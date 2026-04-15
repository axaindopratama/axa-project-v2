import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { getDb } from "@/lib/db";
import { companySettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  const db = getDb();
  const companyData = await db.select().from(companySettings).limit(1);
  const company = companyData[0] || {};
  
  const user = supabaseUser ? {
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email || '',
    avatar: supabaseUser.user_metadata?.avatar_url
  } : undefined;

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar company={{
        logo: company.logo,
        name: company.companyName || "AXA-PROJECT",
        subtitle: company.companySubtitle || "CV. AXA INDO PRATAMA"
      }} />
      <div className="ml-64">
        <TopAppBar user={user} />
        <main className="pt-16">{children}</main>
      </div>
    </div>
  );
}
