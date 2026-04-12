import Link from "next/link";
import { ArrowLeft, Edit, ArrowUpRight, ArrowDownRight, Building2 } from "lucide-react";
import { getDb } from "@/lib/db";
import { transactions, projects, entities, transactionItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getTransaction(id: string) {
  const db = getDb();
  try {
    const txList = await db.select().from(transactions).where(eq(transactions.id, id));
    return txList[0] || null;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
}

async function getProject(id: string) {
  const db = getDb();
  try {
    const projectList = await db.select().from(projects).where(eq(projects.id, id));
    return projectList[0] || null;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

async function getEntity(id: string) {
  const db = getDb();
  try {
    const entityList = await db.select().from(entities).where(eq(entities.id, id));
    return entityList[0] || null;
  } catch (error) {
    console.error("Error fetching entity:", error);
    return null;
  }
}

async function getTransactionItems(txId: string) {
  const db = getDb();
  try {
    return await db.select().from(transactionItems).where(eq(transactionItems.transactionId, txId));
  } catch (error) {
    console.error("Error fetching transaction items:", error);
    return [];
  }
}

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transaction = await getTransaction(id);
  
  if (!transaction) {
    return (
      <div className="p-10 pt-24">
        <p className="text-zinc-500">Transaction not found</p>
      </div>
    );
  }
  
  const project = await getProject(transaction.projectId);
  const entity = transaction.entityId ? await getEntity(transaction.entityId) : null;
  const items = await getTransactionItems(id);

  return (
    <div className="p-10 pt-24 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/transactions" className="p-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">
              Transaction Details
            </h1>
            <p className="text-zinc-500 mt-1">
              {transaction.date}
            </p>
          </div>
        </div>
        <Link 
          href={`/transactions/${id}/edit`}
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
              Transaction Items
            </h2>
            {items.length === 0 ? (
              <p className="text-zinc-500 italic">No items</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-surface-container-high rounded-lg">
                    <div>
                      <span className="text-zinc-300">{item.description}</span>
                      <span className="text-zinc-500 text-sm ml-2">x{item.qty}</span>
                    </div>
                    <span className="text-zinc-300 font-headline font-bold">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {transaction.notes && (
            <div className="bg-surface-container-low p-6 rounded-lg">
              <h2 className="text-lg font-headline font-bold text-on-surface mb-4">
                Notes
              </h2>
              <p className="text-zinc-300">{transaction.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-low p-6 rounded-lg">
            <h2 className="text-lg font-headline font-bold text-on-surface mb-4">
              Amount
            </h2>
            <div className="flex items-center gap-3">
              {transaction.type === 'income' ? (
                <ArrowUpRight className="w-8 h-8 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-8 h-8 text-red-500" />
              )}
              <span className={`text-3xl font-headline font-bold ${
                transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {transaction.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(transaction.amount)}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-lg space-y-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Type</span>
              <p className={`font-headline font-bold capitalize ${
                transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {transaction.type}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Payment Status</span>
              <p className={`font-headline font-bold capitalize ${
                transaction.paymentStatus === 'lunas' ? 'text-emerald-500' : 'text-yellow-500'
              }`}>
                {transaction.paymentStatus}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Project</span>
              <Link href={`/projects/${project?.id}`} className="text-primary hover:underline block mt-1">
                {project?.name || "Unknown"}
              </Link>
            </div>
            {entity && (
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Entity</span>
                <Link href={`/entities/${entity.id}`} className="flex items-center gap-2 text-primary hover:underline mt-1">
                  <Building2 className="w-4 h-4" />
                  {entity.name}
                </Link>
              </div>
            )}
            {transaction.paymentMethod && (
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Payment Method</span>
                <p className="text-zinc-300 mt-1">{transaction.paymentMethod}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}