import type { ReactNode } from "react";

// The hidden admin pages have no navbar or tab bar: just the content on the app background.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[900px] px-4 py-8 lg:px-8">{children}</main>;
}
