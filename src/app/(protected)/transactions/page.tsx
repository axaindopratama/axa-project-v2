"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, ChevronRight, Trash2, X, Loader2, AlertTriangle } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  paymentStatus: string;
  projectId: string;
  entityId: string | null;
  projectName: string;
  entityName: string | null;
}

interface Project {
  id: string;
  name: string;
  number: string;
}

interface Entity {
  id: string;
  name: string;
  type: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      
      // Also fetch projects and entities for mapping
      const [projectsRes, entitiesRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/entities"),
      ]);
      
      const projects: Project[] = (await projectsRes.json()).data || [];
      const entities: Entity[] = (await entitiesRes.json()).data || [];
      
      const projectMap = new Map(projects.map((p) => [p.id, p]));
      const entityMap = new Map(entities.map((e) => [e.id, e]));
      
      const enrichedTransactions = (data.data || []).map((tx: any) => ({
        ...tx,
        projectName: projectMap.get(tx.projectId)?.name || "Unknown",
        entityName: tx.entityId ? entityMap.get(tx.entityId)?.name : null,
      }));
      
      setTransactions(enrichedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${selectedTransaction.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete transaction");
      }

      setShowDeleteModal(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.entityName && tx.entityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.date.includes(searchQuery)
  );

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-10 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="w-4 h-4 text-red-500" />
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Total Expense</span>
          </div>
          <p className="text-xl font-headline font-bold text-red-500">
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Net</span>
          </div>
          <p className={`text-xl font-headline font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Cari transaksi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 pl-12 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-surface-container-low rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {filteredTransactions.length === 0 ? (
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
                <th className="p-4 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
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
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 text-xs uppercase font-bold tracking-widest rounded ${
                      tx.paymentStatus === 'lunas' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {tx.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteClick(tx)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Hapus transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link href={`/transactions/${tx.id}`} className="text-zinc-500 hover:text-primary transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-headline font-bold text-on-surface">
                  Hapus Transaksi
                </h3>
                <p className="text-sm text-zinc-500">
                  Aksi ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-zinc-300 mb-6">
              Apakah Anda yakin ingin menghapus transaksi ini? Total: <span className="font-bold text-primary">{formatCurrency(selectedTransaction.amount)}</span> untuk project <span className="font-bold">{selectedTransaction.projectName}</span>.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTransaction(null);
                }}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 hover:bg-surface-container-highest transition-colors font-headline font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 rounded-lg font-headline font-bold text-white hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}