import { HeaderPrivate } from "@/components/layout/header-private";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderPrivate />
      <main className="flex-1">{children}</main>
    </>
  );
}
