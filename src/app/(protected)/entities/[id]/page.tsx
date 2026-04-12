import Link from "next/link";
import { ArrowLeft, Edit, Building2, Users, Mail, Phone, MapPin } from "lucide-react";
import { getDb } from "@/lib/db";
import { entities, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getEntity(id: string) {
  const db = getDb();
  try {
    const entity = await db.select().from(entities).where(eq(entities.id, id));
    return entity[0] || null;
  } catch (error) {
    console.error("Error fetching entity:", error);
    return null;
  }
}

async function getEntityTransactions(entityId: string) {
  const db = getDb();
  try {
    return await db.select().from(transactions).where(eq(transactions.entityId, entityId));
  } catch (error) {
    console.error("Error fetching entity transactions:", error);
    return [];
  }
}

export default async function EntityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await getEntity(id);
  
  if (!entity) {
    return (
      <div className="p-10 pt-24">
        <p className="text-zinc-500">Entity not found</p>
      </div>
    );
  }
  
  const entityTransactions = await getEntityTransactions(id);
  
  const totalIncome = entityTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = entityTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-10 pt-24 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/entities" className="p-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">
              {entity.name}
            </h1>
            <p className="text-zinc-500 mt-1 capitalize">
              {entity.type}
            </p>
          </div>
        </div>
        <Link 
          href={`/entities/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-zinc-300 hover:bg-surface-container-high transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-lg">
            <h2 className="text-lg font-headline font-bold text-on-surface mb-4">
              Contact Information
            </h2>
            <div className="space-y-4">
              {entity.contact && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-zinc-500" />
                  <span className="text-zinc-300">{entity.contact}</span>
                </div>
              )}
              {entity.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-zinc-500" />
                  <a href={`mailto:${entity.email}`} className="text-primary hover:underline">
                    {entity.email}
                  </a>
                </div>
              )}
              {entity.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-zinc-500" />
                  <a href={`tel:${entity.phone}`} className="text-primary hover:underline">
                    {entity.phone}
                  </a>
                </div>
              )}
              {entity.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-zinc-500 mt-0.5" />
                  <span className="text-zinc-300">{entity.address}</span>
                </div>
              )}
              {!entity.contact && !entity.email && !entity.phone && !entity.address && (
                <p className="text-zinc-500 italic">No contact information</p>
              )}
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-lg">
            <h2 className="text-lg font-headline font-bold text-on-surface mb-4">
              Transactions ({entityTransactions.length})
            </h2>
            {entityTransactions.length === 0 ? (
              <p className="text-zinc-500 italic">Belum ada transaksi</p>
            ) : (
              <div className="space-y-3">
                {entityTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3 bg-surface-container-high rounded-lg">
                    <div>
                      <span className="text-zinc-300">{tx.date}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs uppercase font-bold tracking-widest rounded ${
                        tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.type}
                      </span>
                    </div>
                    <span className={`font-headline font-bold ${
                      tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-low p-6 rounded-lg">
            <h2 className="text-lg font-headline font-bold text-on-surface mb-4">
              Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Income</span>
                <span className="text-emerald-500 font-headline font-bold">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Expense</span>
                <span className="text-red-500 font-headline font-bold">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense)}
                </span>
              </div>
              <div className="border-t border-surface-container-highest pt-4">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-bold">Net</span>
                  <span className={`font-headline font-bold ${
                    totalIncome - totalExpense >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome - totalExpense)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {entity.type === 'vendor' ? (
                <Building2 className="w-5 h-5 text-primary" />
              ) : (
                <Users className="w-5 h-5 text-primary" />
              )}
              <span className="text-zinc-400 text-sm uppercase font-bold tracking-widest">
                Type
              </span>
            </div>
            <p className="text-on-surface font-headline font-bold capitalize">{entity.type}</p>
          </div>
        </div>
      </div>
    </div>
  );
}