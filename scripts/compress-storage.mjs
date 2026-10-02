#!/usr/bin/env node
// One-off / periodic maintenance for Supabase Storage: shrink existing photos and videos
// without visible quality loss, and find files that nothing references any more.
//
// SAFE BY DEFAULT
//   - Without --apply it only reports (downloads and compresses in memory, writes nothing).
//   - With --apply every original is first saved to ./storage-backup/<run>/<bucket>/<path>,
//     then the smaller version is uploaded to the SAME path (database rows keep pointing at
//     it, nothing in the database changes), downloaded again and size-checked.
//   - A file is replaced only if the new version is at least 20 % smaller.
//   - Files already processed (storage-backup/processed.json) are never re-encoded, so
//     running it again later only touches new uploads.
//   - --restore <manifest.json> puts every original from that run back.
//
// Runs on your own computer only; the service-role key must never reach the app or git.
//
//   export SUPABASE_URL=https://<ref>.supabase.co
//   export SUPABASE_SERVICE_ROLE_KEY=<service role key>   # Dashboard → Settings → API
//   node scripts/compress-storage.mjs                      # report only
//   node scripts/compress-storage.mjs --apply              # back up + shrink
//   node scripts/compress-storage.mjs --orphans            # also list unreferenced files
//   node scripts/compress-storage.mjs --apply --orphans --delete-orphans
//   node scripts/compress-storage.mjs --restore storage-backup/<run>/manifest.json
//
// Needs ffmpeg on PATH for videos (Arch: sudo pacman -S ffmpeg). Without it videos are skipped.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const run = promisify(execFile);

// Same sizes the app uses for new uploads (lib/image.ts, banner editor).
export const BUCKETS = {
  avatars: { image: { width: 512, height: 512 } },
  "project-logos": { image: { width: 512, height: 512 } },
  banners: { image: { width: 1800, height: 1200 } },
  "message-images": { image: { width: 1600, height: 1600 } },
  "message-attachments": { image: { width: 1600, height: 1600 }, video: true },
  "post-media": { image: { width: 1600, height: 1600 }, video: true },
};

const MIN_SAVING = 0.2; // keep the original unless the new file is ≥ 20 % smaller
const MIN_IMAGE_BYTES = 120 * 1024; // smaller images aren't worth touching
const MIN_VIDEO_BYTES = 2 * 1024 * 1024;
const ORPHAN_MIN_AGE_MS = 24 * 3600 * 1000; // never call a fresh upload an orphan
const BACKUP_ROOT = "storage-backup";
const LEDGER = join(BACKUP_ROOT, "processed.json");

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]); // GIFs keep their animation
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

// Photo: apply EXIF rotation, fit inside the box, WebP 82 (metadata such as GPS is dropped).
export async function shrinkImage(input, { width, height }) {
  return sharp(input)
    .rotate()
    .resize({ width, height, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

// Video: longer side ≤ 1280 px, H.264 CRF 26 + AAC 96k, moov atom first so playback starts
// before the whole file has downloaded.
export async function shrinkVideo(input) {
  const dir = join(tmpdir(), `weone-${process.pid}-${Date.now()}`);
  await mkdir(dir, { recursive: true });
  const src = join(dir, "in");
  const out = join(dir, "out.mp4");
  try {
    await writeFile(src, input);
    await run("ffmpeg", [
      "-y", "-loglevel", "error", "-i", src,
      "-vf", "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'",
      "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", out,
    ], { maxBuffer: 1024 * 1024 });
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// Every file in a bucket (Storage lists one folder level at a time).
async function listAll(supabase, bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) files.push(...(await listAll(supabase, bucket, path)));
      else files.push({ path, size: entry.metadata?.size ?? 0, type: entry.metadata?.mimetype ?? "", createdAt: entry.created_at });
    }
    if (data.length < 1000) return files;
  }
}

// Storage paths the database still points at, per bucket.
async function referencedPaths(supabase, url) {
  const refs = Object.fromEntries(Object.keys(BUCKETS).map((b) => [b, new Set()]));
  const publicPath = (value, bucket) => {
    const marker = `/storage/v1/object/public/${bucket}/`;
    return value?.startsWith(url) && value.includes(marker) ? value.slice(value.indexOf(marker) + marker.length) : null;
  };
  async function all(table, columns) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(table).select(columns).range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...data);
      if (data.length < 1000) return rows;
    }
  }
  for (const p of await all("profiles", "avatar_url, banner_path")) {
    const avatar = publicPath(p.avatar_url, "avatars");
    if (avatar) refs.avatars.add(avatar);
    if (p.banner_path) refs.banners.add(p.banner_path);
  }
  for (const p of await all("projects", "logo_url")) {
    const logo = publicPath(p.logo_url, "project-logos");
    if (logo) refs["project-logos"].add(logo);
  }
  for (const m of await all("messages", "image_path, attachment_path")) {
    if (m.image_path) refs["message-images"].add(m.image_path);
    if (m.attachment_path) refs["message-attachments"].add(m.attachment_path);
  }
  for (const p of await all("posts", "media_path")) if (p.media_path) refs["post-media"].add(p.media_path);
  return refs;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function download(supabase, bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`download ${bucket}/${path}: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

async function upload(supabase, bucket, path, body, contentType) {
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`upload ${bucket}/${path}: ${error.message}`);
}

async function restore(supabase, manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const item of manifest.replaced) {
    await upload(supabase, item.bucket, item.path, await readFile(item.backup), item.oldType);
    console.log(`restored ${item.bucket}/${item.path}`);
  }
  for (const item of manifest.deleted ?? []) {
    await upload(supabase, item.bucket, item.path, await readFile(item.backup), item.type);
    console.log(`restored deleted ${item.bucket}/${item.path}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first (see the top of this file).");
    process.exit(1);
  }
  await maintain(createClient(url, key, { auth: { persistSession: false } }), url, args);
}

// Exported so it can be exercised against a fake client.
export async function maintain(supabase, url, args) {
  const apply = args.includes("--apply");
  const showOrphans = args.includes("--orphans") || args.includes("--delete-orphans");
  const deleteOrphans = args.includes("--delete-orphans");
  if (deleteOrphans && !apply) throw new Error("--delete-orphans only works together with --apply.");

  const restoreAt = args.indexOf("--restore");
  if (restoreAt !== -1) return restore(supabase, args[restoreAt + 1]);

  let hasFfmpeg = true;
  try {
    await run("ffmpeg", ["-version"]);
  } catch {
    hasFfmpeg = false;
    console.warn("ffmpeg not found: videos will be skipped.");
  }

  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(BACKUP_ROOT, runId);
  const ledger = existsSync(LEDGER) ? JSON.parse(await readFile(LEDGER, "utf8")) : {};
  const manifest = { runId, apply, replaced: [], deleted: [] };
  const refs = showOrphans ? await referencedPaths(supabase, url) : null;
  let before = 0;
  let after = 0;

  // Manifest and ledger are written after every change, so even an interrupted run
  // can be restored and won't re-encode what it already did.
  async function save() {
    await mkdir(runDir, { recursive: true });
    await writeFile(join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    await writeFile(LEDGER, JSON.stringify(ledger, null, 2));
  }

  // The first copy saved in a run is the original; it is never overwritten.
  async function backup(bucket, path, body) {
    const file = join(runDir, bucket, path);
    if (existsSync(file)) return file;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body, { flag: "wx" });
    return file;
  }

  console.log(apply ? "APPLY mode: originals are backed up first.\n" : "REPORT mode: nothing will be changed.\n");

  for (const [bucket, rules] of Object.entries(BUCKETS)) {
    const files = await listAll(supabase, bucket);
    console.log(`== ${bucket}: ${files.length} files, ${mb(files.reduce((s, f) => s + f.size, 0))}`);

    // Files no row points at (older than a day). They are reported/deleted below and
    // never re-encoded, so their backup is always the untouched original.
    const now = Date.now();
    const orphans = refs
      ? files.filter((f) => !refs[bucket].has(f.path) && f.createdAt && now - Date.parse(f.createdAt) > ORPHAN_MIN_AGE_MS)
      : [];
    const orphanPaths = new Set(orphans.map((f) => f.path));

    for (const f of files) {
      if (orphanPaths.has(f.path)) continue;
      const ledgerKey = `${bucket}/${f.path}`;
      const isImage = rules.image && IMAGE_TYPES.has(f.type) && f.size >= MIN_IMAGE_BYTES;
      const isVideo = rules.video && hasFfmpeg && VIDEO_TYPES.has(f.type) && f.size >= MIN_VIDEO_BYTES;
      if (ledger[ledgerKey] || (!isImage && !isVideo)) continue;

      try {
        const original = await download(supabase, bucket, f.path);
        const smaller = isImage ? await shrinkImage(original, rules.image) : await shrinkVideo(original);
        const newType = isImage ? "image/webp" : "video/mp4";
        if (smaller.length > original.length * (1 - MIN_SAVING)) {
          console.log(`  keep    ${f.path} (${mb(original.length)}; would only save ${Math.round((1 - smaller.length / original.length) * 100)} %)`);
          continue;
        }
        before += original.length;
        after += smaller.length;
        console.log(`  ${apply ? "shrink " : "would  "} ${f.path}  ${mb(original.length)} → ${mb(smaller.length)}`);
        if (!apply) continue;

        const backupFile = await backup(bucket, f.path, original);
        await upload(supabase, bucket, f.path, smaller, newType);
        const check = await download(supabase, bucket, f.path);
        if (check.length !== smaller.length) {
          // Something went wrong: put the original back right away.
          await upload(supabase, bucket, f.path, original, f.type);
          throw new Error(`size check failed for ${ledgerKey}, original restored`);
        }
        manifest.replaced.push({ bucket, path: f.path, oldType: f.type, newType, oldSize: original.length, newSize: smaller.length, backup: backupFile });
        ledger[ledgerKey] = { at: new Date().toISOString(), from: original.length, to: smaller.length };
        await save();
      } catch (error) {
        console.error(`  ERROR   ${ledgerKey}: ${error.message}`);
      }
    }

    for (const f of orphans) {
      console.log(`  orphan  ${f.path} (${mb(f.size)})${deleteOrphans ? " → deleting" : ""}`);
      if (!deleteOrphans) continue;
      try {
        const original = await download(supabase, bucket, f.path);
        const backupFile = await backup(bucket, f.path, original);
        const { error } = await supabase.storage.from(bucket).remove([f.path]);
        if (error) throw new Error(error.message);
        manifest.deleted.push({ bucket, path: f.path, type: f.type, size: f.size, backup: backupFile });
        await save();
      } catch (error) {
        console.error(`  ERROR   orphan ${bucket}/${f.path}: ${error.message}`);
      }
    }
  }

  console.log(`\nPhotos/videos: ${mb(before)} → ${mb(after)} (${apply ? "saved" : "could save"} ${mb(before - after)})`);
  if (apply && (manifest.replaced.length || manifest.deleted.length)) {
    console.log(`Backup + manifest: ${runDir}  (undo: node scripts/compress-storage.mjs --restore ${join(runDir, "manifest.json")})`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
