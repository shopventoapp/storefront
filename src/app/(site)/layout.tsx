import { SiteFooter, SiteHeader } from "@/components/chrome";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="inhalt">{children}</main>
      <SiteFooter />
    </>
  );
}
