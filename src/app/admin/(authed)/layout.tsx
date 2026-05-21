import { requireAdmin } from "@/lib/admin-auth";
import { AdminPrefsProvider } from "@/contexts/admin-prefs-context";
import { Sidebar } from "@/components/admin/Sidebar";
import { SkipLink } from "@/components/SkipLink";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <AdminPrefsProvider>
      <SkipLink />
      <div className="flex min-h-screen">
        <Sidebar displayName={admin.display_name} role={admin.role} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 flex-col bg-admin-bg"
        >
          {children}
        </main>
      </div>
    </AdminPrefsProvider>
  );
}
