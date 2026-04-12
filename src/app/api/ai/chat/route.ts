import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects, transactions, entities } from "@/lib/db/schema";

interface ChatContext {
  projects: { id: string; name: string; number: string; budget: number; status: string }[];
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  activeProjects: number;
  entitiesCount: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function analyzeIntent(message: string, context: ChatContext): { type: string; response: string } {
  const lower = message.toLowerCase();
  
  if (lower.includes("total budget") || lower.includes("semua budget") || lower.includes("budget semua")) {
    return { type: "total_budget", response: `Total budget dari semua ${context.projects.length} proyek adalah **${formatCurrency(context.totalBudget)}**.` };
  }
  
  if (lower.includes("total spent") || lower.includes("total expense") || lower.includes("sudah keluar") || lower.includes("pengeluaran total") || lower.includes("pengeluaran")) {
    return { type: "total_spent", response: `Total pengeluaran dari semua proyek adalah **${formatCurrency(context.totalSpent)}**. Tersisa **${formatCurrency(context.totalBudget - context.totalSpent)}** dari total budget.` };
  }
  
  if (lower.includes("total income") || lower.includes("pendapatan total") || lower.includes("pemasukan")) {
    return { type: "total_income", response: `Total pendapatan adalah **${formatCurrency(context.totalIncome)}**.` };
  }
  
  if (lower.includes("active") || lower.includes("proyek aktif") || lower.includes("proyek berjalan") || lower.includes("proyek sedang")) {
    return { type: "active_projects", response: `Saat ini ada **${context.activeProjects} proyek aktif** dari total ${context.projects.length} proyek.` };
  }
  
  if (lower.includes("alert") || lower.includes("peringatan") || lower.includes("warning") || lower.includes("over budget") || lower.includes("lebih budget")) {
    const activeProjects = context.projects.filter(p => p.status === "active" || p.status === "in_progress");
    if (activeProjects.length === 0) {
      return { type: "budget_alert", response: `Tidak ada proyek aktif saat ini. Semua ${context.projects.length} proyek mungkin sudah selesai atau on-hold.` };
    }
    return { type: "budget_alert", response: `Berikut status proyek aktif:\n${activeProjects.map(p => `• **${p.number} ${p.name}**: ${p.status}`).join("\n")}` };
  }
  
  const projectMatch = lower.match(/proyek\s+(\d{3})|project\s+(\d{3})|proyek\s+(.+?)\s+|project\s+(.+?)\s+/i);
  if (projectMatch) {
    const searchTerm = (projectMatch[1] || projectMatch[2] || projectMatch[3] || projectMatch[4] || "").trim();
    if (searchTerm) {
      const project = context.projects.find(p => p.number === searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (project) {
        return { type: "project_detail", response: `**${project.number} - ${project.name}**\n\n• Status: ${project.status}\n• Budget: ${formatCurrency(project.budget)}` };
      }
      return { type: "project_detail", response: `Proyek "${searchTerm}" tidak ditemukan. Berikut daftar proyek:\n${context.projects.map(p => `• ${p.number} - ${p.name}`).join("\n")}` };
    }
  }
  
  if (lower.includes("list") || lower.includes("daftar") || lower.includes("semua proyek") || lower.includes("lihat proyek")) {
    if (context.projects.length === 0) {
      return { type: "project_list", response: `Belum ada proyek. Silakan buat proyek baru terlebih dahulu.` };
    }
    return { type: "project_list", response: `Berikut adalah ${context.projects.length} proyek:\n${context.projects.map(p => `• **${p.number} ${p.name}** - ${formatCurrency(p.budget)} (${p.status})`).join("\n")}` };
  }
  
  if (lower.includes("terbesar") || lower.includes("paling besar") || lower.includes("budget terbesar")) {
    if (context.projects.length === 0) return { type: "largest", response: "Belum ada proyek." };
    const sorted = [...context.projects].sort((a, b) => b.budget - a.budget);
    const largest = sorted[0];
    return { type: "largest_project", response: `Proyek dengan budget terbesar adalah **${largest.number} ${largest.name}** dengan budget **${formatCurrency(largest.budget)}**.` };
  }
  
  if (lower.includes("terkecil") || lower.includes("paling kecil") || lower.includes("budget terkecil")) {
    if (context.projects.length === 0) return { type: "smallest", response: "Belum ada proyek." };
    const sorted = [...context.projects].sort((a, b) => a.budget - b.budget);
    const smallest = sorted[0];
    return { type: "smallest_project", response: `Proyek dengan budget terkecil adalah **${smallest.number} ${smallest.name}** dengan budget **${formatCurrency(smallest.budget)}**.` };
  }
  
  if (lower.includes("selesai") || lower.includes("completed")) {
    const completed = context.projects.filter(p => p.status === "completed");
    return { type: "completed_projects", response: `Ada **${completed.length} proyek selesai** dari total ${context.projects.length} proyek.` };
  }
  
  if (lower.includes("vendor") || lower.includes("klien") || lower.includes("client") || lower.includes("entity") || lower.includes("entitas")) {
    return { type: "entities", response: `Saat ini ada **${context.entitiesCount} entitas** (vendor + klien) yang terdaftar di sistem.` };
  }
  
  if (lower.includes("bulan") || lower.includes("monthly") || lower.includes("spending")) {
    return { type: "monthly_spending", response: `Ringkasan spending bulanan tersedia di halaman /keuangan. Total pengeluaran saat ini: **${formatCurrency(context.totalSpent)}**.` };
  }
  
  if (lower.includes("net") || lower.includes("saldo") || lower.includes("balance")) {
    const net = context.totalIncome - context.totalSpent;
    return { type: "net_balance", response: `Net balance: **${formatCurrency(net)}** (Income: ${formatCurrency(context.totalIncome)} - Expense: ${formatCurrency(context.totalSpent)})` };
  }
  
  if (lower.includes("help") || lower.includes("bantu") || lower.includes("apa yang bisa")) {
    return { type: "help", response: `Saya bisa membantu:\n• "Total budget semua proyek"\n• "Proyek terbesar"\n• "Berapa total pengeluaran"\n• "Proyek aktif"\n• "Tampilkan semua proyek"\n• "Budget proyek 001"\n• "Ada berapa vendor?"\n• "Net balance"\n\nTulis dalam Bahasa Indonesia atau English!` };
  }
  
  return { type: "unknown", response: `Saya memahami: "${message}".\n\nBisa bantu:\n• Total budget/expense/income\n• Proyek aktif, terbesar, terkecil, selesai\n• Detail proyek\n• Vendor/klien\n• Net balance\n\nKetik "bantu" untuk semua opsi!` };
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    if (!message) {
      return NextResponse.json({ response: "Pesan tidak valid" }, { status: 400 });
    }

    const db = getDb();
    const allProjects = await db.select().from(projects);
    const allTransactions = await db.select().from(transactions);
    const allEntities = await db.select().from(entities);
    
    const totalBudget = allProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = allTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = allTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const activeProjects = allProjects.filter(p => p.status === "active" || p.status === "in_progress").length;
    
    const enrichedContext: ChatContext = {
      projects: allProjects.map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        budget: p.budget,
        status: p.status,
      })),
      totalBudget,
      totalSpent,
      totalIncome,
      activeProjects,
      entitiesCount: allEntities.length,
    };

    const result = analyzeIntent(message, enrichedContext);
    
    return NextResponse.json({ response: result.response });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json({ response: "Maaf, terjadi kesalahan. Silakan coba lagi." }, { status: 500 });
  }
}