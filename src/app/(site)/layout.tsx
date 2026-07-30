import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { client } from "@/sanity/lib/client";
import { PROFILE_QUERY } from "@/sanity/lib/queries";
import type { Profile } from "@/sanity/types";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profileData = await client.fetch(PROFILE_QUERY);
  const profile = profileData as Profile | null;
  const contact = profile?.contact;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader contact={contact} />
      <main className="flex-1">{children}</main>
      <SiteFooter contact={contact} />
    </div>
  );
}
