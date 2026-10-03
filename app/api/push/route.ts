import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import webpush from "web-push";
import { z } from "zod";
import { LANGS } from "@/lib/i18n/core";
import { isPushEndpoint } from "@/lib/push/endpoint";
import { buildPushMessage, pushEventSchema } from "@/lib/push/message";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  subs: z
    .array(
      z.object({
        endpoint: z.string().refine(isPushEndpoint),
        p256dh: z.string().max(200),
        auth: z.string().max(100),
        lang: z.enum(LANGS),
      }),
    )
    .max(20),
  event: pushEventSchema,
});

function sameSecret(given: string | null, expected: string) {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Called by the database (pg_net) when a message or notification should reach a device.
// Authenticated by the shared secret; sends one push per subscription, then reports dead ones back.
export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!secret || !publicKey || !privateKey || !subject) {
    return NextResponse.json({ error: "push is not configured" }, { status: 503 });
  }
  if (!sameSecret(request.headers.get("x-push-secret"), secret)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const { subs, event } = parsed.data;

  const results = await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(buildPushMessage(event, sub.lang)),
          { TTL: 60 * 60 * 24, urgency: "high", timeout: 8000 },
        );
        return { endpoint: sub.endpoint, gone: false, ok: true };
      } catch (error) {
        const status = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
        return { endpoint: sub.endpoint, gone: status === 404 || status === 410, ok: false };
      }
    }),
  );

  // The push service says these devices are gone (uninstalled, permission revoked): forget them.
  const gone = results.filter((r) => r.gone).map((r) => r.endpoint);
  if (gone.length > 0) {
    const supabase = await createClient();
    await supabase.rpc("push_drop", { p_secret: secret, p_endpoints: gone });
  }

  return NextResponse.json({ sent: results.filter((r) => r.ok).length, dropped: gone.length });
}
