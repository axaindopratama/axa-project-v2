import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, Pencil, Trash2, Shield, ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const db = getDb();

  // Check admin role from Turso users
  const currentUser = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, user.id))
    .limit(1);

  if (!currentUser[0] || currentUser[0].role !== 'admin') {
    redirect('/');
  }

  // Fetch all users from Turso
  const allUsers = await db
    .select({
      id: users.id,
      supabaseUserId: users.supabaseUserId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="p-6 lg:p-10 pt-24 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/settings" className="flex items-center gap-2 text-zinc-400 hover:text-on-surface mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Pengaturan
          </Link>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            Manajemen Pengguna
          </h1>
          <p className="text-zinc-500 mt-1">Kelola akun dan peran pengguna sistem</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-5 h-5" />
          Tambah Pengguna
        </button>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-high border-b border-zinc-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-headline font-bold text-zinc-400 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-6 py-4 text-left text-xs font-headline font-bold text-zinc-400 uppercase tracking-wider">
                  Kontak
                </th>
                <th className="px-6 py-4 text-left text-xs font-headline font-bold text-zinc-400 uppercase tracking-wider">
                  Peran
                </th>
                <th className="px-6 py-4 text-left text-xs font-headline font-bold text-zinc-400 uppercase tracking-wider">
                  Terakhir Masuk
                </th>
                <th className="px-6 py-4 text-right text-xs font-headline font-bold text-zinc-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {allUsers?.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-headline font-bold">
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-headline font-bold text-on-surface">{u.name || 'Tanpa Nama'}</p>
                        <p className="text-xs text-zinc-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-400">{u.phone || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                      u.role === 'admin' 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : u.role === 'manager'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      <Shield className="w-3 h-3" />
                      {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Manager' : 'Pengguna'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-400">
                      {u.updatedAt
                        ? new Date(u.updatedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Belum pernah'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-zinc-400 hover:text-on-surface">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-zinc-400 hover:text-red-400"
                        disabled={u.supabaseUserId === user.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!allUsers || allUsers.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500">Belum ada pengguna</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 rounded-xl flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
        <div>
          <p className="text-sm font-headline font-bold text-blue-400">Informasi</p>
          <p className="text-xs text-zinc-400 mt-1">
            Hanya admin yang dapat mengakses halaman ini. Penghapusan pengguna tidak dapat dibatalkan.
          </p>
        </div>
      </div>
    </div>
  );
}