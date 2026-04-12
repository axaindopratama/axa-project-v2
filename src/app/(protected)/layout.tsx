import { Sidebar } from "@/components/layout/Sidebar";
import { TopAppBar } from "@/components/layout/TopAppBar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-64">
        <TopAppBar />
        <main className="pt-16">{children}</main>
      </div>
    </div>
  );
}