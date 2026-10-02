-- Save storage and traffic on the Free plan.
-- Post videos: 10 MB max (photos are compressed in the browser and stay far below).
update storage.buckets set file_size_limit = 10485760 where id = 'post-media';
-- Chat files are paused (ATTACHMENTS_ENABLED = false): the bucket accepts nothing new.
-- Existing files stay readable. To turn sending back on:
--   update storage.buckets set file_size_limit = 20971520 where id = 'message-attachments';
update storage.buckets set file_size_limit = 1 where id = 'message-attachments';
