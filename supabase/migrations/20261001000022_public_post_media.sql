-- Post media is readable by every signed-in user already, and every path is a
-- random UUID. A public bucket gives each file one stable, CDN-cached URL, so
-- browsers stop downloading the same image again on every page render.
-- Upload/delete policies stay as they are: only the owner can write.
update storage.buckets set public = true where id = 'post-media';
