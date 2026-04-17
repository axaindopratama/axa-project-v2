"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Building2 } from "lucide-react";

interface Project {
  id: string;
  number: string;
  name: string;
  budget: number;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  notes: string | null;
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => {
      setProjectId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      const [projectRes, transactionsRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/transactions?projectId=${id}`),
      ]);

      const projectData = await projectRes.json();
      const transactionsData = await transactionsRes.json();

      setProject(projectData.data);
      // Only include expenses for the invoice
      setTransactions((transactionsData.data || []).filter((t: Transaction) => t.type === 'expense'));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  if (loading) {
    return <div className="p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 text-center">Memuat invoice...</div>;
  }

  if (!project) {
    return <div className="p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 text-center text-red-500">Proyek tidak ditemukan</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        {/* Controls - Hidden during print */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8 print:hidden">
          <Link href={`/projects/${projectId}`} className="flex items-center gap-2 text-zinc-400 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Proyek
          </Link>
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 gold-gradient text-on-primary rounded-lg font-headline font-bold text-sm uppercase tracking-widest hover:shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </button>
        </div>

        {/* Invoice Paper - Styled for printing */}
        <div className="bg-white text-black p-10 rounded-lg shadow-xl print:shadow-none print:p-0 print:m-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-zinc-200 pb-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-widest">AXA INDO PRATAMA</h1>
                <p className="text-sm text-zinc-500">NPWP: 00.000.000.0-000.000</p>
                <p className="text-sm text-zinc-500">Jakarta, Indonesia</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black text-zinc-300 uppercase tracking-widest mb-2">INVOICE</h2>
              <p className="font-bold">INV-{project.number}</p>
              <p className="text-sm text-zinc-500">Tanggal: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Project Details */}
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Tagihan Untuk:</h3>
            <p className="font-bold text-lg">{project.name}</p>
            <p className="text-zinc-600">ID Proyek: {project.number}</p>
          </div>

          {/* Table */}
          <table className="w-full mb-8">
            <thead className="bg-zinc-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">Tanggal</th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">Deskripsi</th>
                <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-widest text-zinc-500">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-zinc-500">Belum ada item tagihan</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-4 px-4 text-sm">{formatDate(tx.date)}</td>
                    <td className="py-4 px-4 text-sm font-medium">{tx.notes || "Pengeluaran Proyek"}</td>
                    <td className="py-4 px-4 text-sm text-right">{formatCurrency(tx.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="py-4 px-4 text-right font-bold uppercase tracking-widest">Total Tagihan</td>
                <td className="py-4 px-4 text-right font-black text-lg">{formatCurrency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="border-t-2 border-zinc-200 pt-8 mt-16 text-sm text-zinc-500">
            <p className="font-bold text-black mb-1">Catatan:</p>
            <p>Pembayaran dapat dilakukan melalui transfer ke rekening:</p>
            <p className="font-bold text-black mt-2">BCA: 1234567890 a.n CV AXA Indo Pratama</p>
            <p className="mt-4">Terima kasih atas kepercayaan Anda.</p>
          </div>
        </div>
      </div>
      
      {/* Print-specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-4xl, .max-w-4xl * {
            visibility: visible;
          }
          .max-w-4xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}
