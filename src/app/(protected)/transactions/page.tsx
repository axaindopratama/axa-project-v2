import Link from "next/link";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { getDb } from "@/lib/db";
import { transactions, projects, entities } from "@/lib/db/schema";

async function getTransactions() {
  const db = getDb();
  const txList = await db.select().from(transactions);
  const projectList = await db.select().from(projects);
  const entityList = await db.select().from(entities);
  
  const projectMap = new Map(projectList.map(p => [p.id, p]));
  const entityMap = new Map(entityList.map(e => [e.id, e]));
  
  return txList.map(tx => ({
    ...tx,
    projectName: projectMap.get(tx.projectId)?.name || "Unknown",
    entityName: tx.entityId ? entityMap.get(tx.entityId)?.name : null,
  }));
}

export default async function TransactionsPage() {
  const transactionsList = await getTransactions();
  
  const totalIncome = transactionsList
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactionsList
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-10 pt-24 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            Transactions
          </h1>
          <p className="text-zinc-500 mt-1">
            Track all your income and expenses
          </p>
        </div>
        <Link 
          href="/transactions/new"
          className="gold-gradient px-6 py-3 rounded-lg font-headline font-bold text-sm uppercase tracking-widest text-on-primary hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Transaction
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="bg-surface-container-low p-4 rounded-lg flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Total Income</span>
          </div>
          <p className="text-xl font-headline font-bold text-emerald-500">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome)}
          </p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="w-4 h-4 text-red-500" />
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Total Expense</span>
          </div>
          <p className="text-xl font-headline font-bold text-red-500">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense)}
          </p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Net</span>
          </div>
          <p className={`text-xl font-headline font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Cari transaksi..." 
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 pl-12 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-surface-container-low rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {transactionsList.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-4">Belum ada transaksi</p>
            <Link href="/transactions/new" className="text-primary hover:underline">
              Buat transaksi pertama
          </Link>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-container-highest">
                <th className="text-left text-xs uppercase font-bold tracking-widest text-zinc-500 p-4">Date</th>
                <th className="text-left text-xs uppercase font-bold tracking-widest text-zinc-500 p-4">Type</th>
                <th className="text-left text-xs uppercase font-bold tracking-widest text-zinc-500 p-4">Project</th>
                <th className="text-left text-xs uppercase font-bold tracking-widest text-zinc-500 p-4">Entity</th>
                <th className="text-right text-xs uppercase font-bold tracking-widest text-zinc-500 p-4">Amount</th>
                <th className="text-right text-xs uppercase font-bold tracking-widest text-zinc-500 p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {transactionsList.map((tx) => (
                <tr key={tx.id} className="border-b border-surface-container-high hover:bg-surface-container-high transition-colors">
                  <td className="p-4 text-zinc-300">{tx.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs uppercase font-bold tracking-widest rounded ${
                      tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-300">{tx.projectName}</td>
                  <td className="p-4 text-zinc-400">{tx.entityName || '-'}</td>
                  <td className={`p-4 text-right font-headline font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.amount)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 text-xs uppercase font-bold tracking-widest rounded ${
                      tx.paymentStatus === 'lunas' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {tx.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link href={`/transactions/${tx.id}`} className="text-zinc-500 hover:text-primary transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}