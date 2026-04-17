import { getDb } from "@/lib/db";
import { auditLogs, users, projects } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Shield, User as UserIcon, Clock } from "lucide-react";
import { AuditLogDetailModal } from "@/components/admin/AuditLogDetailModal";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const db = getDb();
  
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  const allUsers = await db.select().from(users);
  const allProjects = await db.select().from(projects);
  
  // Create a map by both id and supabaseUserId for easier lookups
  const userMap = new Map();
  allUsers.forEach(u => {
    userMap.set(u.id, u);
    userMap.set(u.supabaseUserId, u);
  });
  
  const projectMap = new Map(allProjects.map(p => [p.id, p]));
  
  const formattedLogs = logs.map(log => {
    const user = log.userId ? userMap.get(log.userId) : null;
    const project = log.projectId ? projectMap.get(log.projectId) : null;
    
    return {
      ...log,
      userName: user?.name || "System/Unknown",
      userEmail: user?.email || "",
      projectName: project?.name || "-",
    };
  });

  return (
    <div className="p-10 pt-24 space-y-8 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-zinc-500 mt-1">
            Riwayat aktivitas sistem dan perubahan data (100 aktivitas terakhir)
          </p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-surface-container-highest">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-high text-zinc-400 font-headline">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-widest">Waktu</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest">Pengguna</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest">Aksi</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest">Tabel</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest">Proyek</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-zinc-300">
              {formattedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    Belum ada catatan aktivitas.
                  </td>
                </tr>
              ) : (
                formattedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <span>{new Date(log.createdAt || "").toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <UserIcon className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{log.userName}</p>
                          <p className="text-xs text-zinc-500">{log.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest ${
                        log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-500' :
                        log.action === 'UPDATE' ? 'bg-yellow-500/10 text-yellow-500' :
                        log.action === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                        'bg-zinc-500/10 text-zinc-500'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                      {log.tableName}
                    </td>
                    <td className="px-6 py-4">
                      {log.projectName !== "-" && (
                        <span className="bg-surface-container-highest px-2 py-1 rounded text-xs">
                          {log.projectName}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <AuditLogDetailModal 
                        action={log.action}
                        oldValue={log.oldValue}
                        newValue={log.newValue}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
