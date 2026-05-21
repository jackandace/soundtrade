export const metadata = {
  title: "SOUND·TRADE 管理画面",
  robots: "noindex,nofollow",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-admin-bg text-admin-base text-admin-ink">{children}</div>;
}
