"use client";

import { ImageUpload } from "./image-upload";
import { UserAvatar } from "./user-avatar";

export function AvatarUpload({
  userId,
  name,
  initialUrl,
}: {
  userId: string;
  name: string;
  initialUrl: string | null;
}) {
  return (
    <ImageUpload
      bucket="avatars"
      folder={userId}
      fieldName="avatar_url"
      initialUrl={initialUrl}
      preview={(url) => <UserAvatar name={name || "?"} url={url} size="xl" />}
    />
  );
}
