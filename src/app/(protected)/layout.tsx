import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShellClient } from "@/components/layout/AppShellClient";
import { getDb } from "@/lib/db";
import { companySettings } from "@/lib/db/schema";
import { getOrProvisionAppUser } from "@/lib/userProvisioning";

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
  
  const appUser = supabaseUser ? await getOrProvisionAppUser(supabaseUser) : null;
  
  const user = supabaseUser ? {
    name: appUser?.name || 'User',
    email: appUser?.email || '',
    avatar: appUser?.avatar || undefined,
    role: appUser?.role || 'user'
  } : undefined;

  return (
    <AppShellClient
      user={user}
      company={{
        logo: company.logo,
        name: company.companyName || "AXA-PROJECT",
        subtitle: company.companySubtitle || "CV. AXA INDO PRATAMA"
      }}
    >
      {children}
    </AppShellClient>
  );
}
