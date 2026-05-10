import { HeaderPublic } from "@/components/layout/header-public";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderPublic />
      <main className="flex-1">{children}</main>
    </>
  );
}
