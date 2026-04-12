"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";

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

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [formData, setFormData] = useState({
    projectId: "",
    entityId: "",
    type: "expense",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentStatus: "lunas",
    paidAmount: "",
    dueDate: "",
    paymentMethod: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.data || []));
    fetch("/api/entities")
      .then((res) => res.json())
      .then((data) => setEntities(data.data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseInt(formData.amount),
          paidAmount: formData.paidAmount ? parseInt(formData.paidAmount) : 0,
        }),
      });

      if (res.ok) {
        router.push("/transactions");
      } else {
        alert("Failed to create transaction");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 pt-24 space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            New Transaction
          </h1>
          <p className="text-zinc-500 mt-1">
            Add a new income or expense
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-container-low p-6 rounded-lg space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "expense" })}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.type === "expense"
                    ? "border-red-500 bg-red-500/10"
                    : "border-transparent bg-surface-container-high text-zinc-400"
                }`}
              >
                <ArrowDownRight className="w-5 h-5" />
                <span className="font-headline font-bold">Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "income" })}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.type === "income"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-transparent bg-surface-container-high text-zinc-400"
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                <span className="font-headline font-bold">Income</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Project
            </label>
            <select
              required
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Entity (Optional)
            </label>
            <select
              value={formData.entityId}
              onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select entity</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Amount
            </label>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Payment Status
            </label>
            <select
              value={formData.paymentStatus}
              onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
            >
              <option value="lunas">Lunas (Paid)</option>
              <option value="belum_lunas">Belum Lunas (Unpaid)</option>
              <option value="sebagian">Sebagian (Partial)</option>
            </select>
          </div>

          {formData.paymentStatus !== "lunas" && (
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="qris">QRIS</option>
              <option value="credit_card">Credit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 resize-none"
              placeholder="Additional notes"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 bg-surface-container-low rounded-lg text-zinc-400 hover:bg-surface-container-high transition-colors font-headline font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 gold-gradient py-3 rounded-lg font-headline font-bold text-on-primary hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Buat Transaksi"}
          </button>
        </div>
      </form>
    </div>
  );
}