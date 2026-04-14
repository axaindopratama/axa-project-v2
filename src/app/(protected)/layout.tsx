import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopAppBar } from "@/components/layout/TopAppBar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  const user = supabaseUser ? {
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email || '',
    avatar: supabaseUser.user_metadata?.avatar_url
  } : undefined;

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-64">
        <TopAppBar user={user} />
        <main className="pt-16">{children}</main>
      </div>
    </div>
  );
}