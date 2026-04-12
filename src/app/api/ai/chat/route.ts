import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects, transactions, entities, tasks } from "@/lib/db/schema";

interface ChatContext {
  projects: { id: string; name: string; number: string; budget: number; status: string }[];
  totalBudget: number;
  totalSpent: number;
  activeProjects: number;
}

function analyzeIntent(message: string, context: ChatContext) {
  const lower = message.toLowerCase();
  
  // Total budget query
  if (lower.includes('total budget') || lower.includes('semua budget') || lower.includes('budget semua')) {
    return {
      type: 'total_budget',
      response: `Total budget dari semua ${context.projects.length} proyek adalah **${formatCurrency(context.totalBudget)}**.`
    };
  }
  
  // Total spent query
  if (lower.includes('total spent') || lower.includes('total expense') || lower.includes('sudah keluar') || lower.includes('pengeluaran total')) {
    return {
      type: 'total_spent',
      response: `Total pengeluaran dari semua proyek adalah **${formatCurrency(context.totalSpent)}**. Tersisa **${formatCurrency(context.totalBudget - context.totalSpent)}** dari total budget.`
    };
  }
  
  // Active projects
  if (lower.includes('active') || lower.includes('proyek aktif') || lower.includes('proyek berjalan')) {
    return {
      type: 'active_projects',
      response: `Saat ini ada **${context.activeProjects} proyek aktif** dari total ${context.projects.length} proyek.`
    };
  }
  
  // Budget alert
  if (lower.includes('alert') || lower.includes('peringatan') || lower.includes('budget warning') || lower.includes('over budget')) {
    return {
      type: 'budget_alert',
      response: `Berikut adalah status budget proyek:\n${context.projects.map(p => `• **${p.number} ${p.name}**: ${p.status}`).join('\n')}`
    };
  }
  
  // Project details
  const projectMatch = lower.match(/proyek\s+(\d{3})|project\s+(\d{3})/i);
  if (projectMatch) {
    const projNum = projectMatch[1] || projectMatch[2];
    const project = context.projects.find(p => p.number === projNum);
    if (project) {
      return {
        type: 'project_detail',
        response: `**${project.number} - ${project.name}**\n\n• Status: ${project.status}\n• Budget: ${formatCurrency(project.budget)}`
      };
    }
  }
  
  // Largest budget
  if (lower.includes('terbesar') || lower.includes('paling besar') || lower.includes('budget terbesar')) {
    const sorted = [...context.projects].sort((a, b) => b.budget - a.budget);
    const largest = sorted[0];
    return {
      type: 'largest_project',
      response: `Proyek dengan budget terbesar adalah **${largest.number} ${largest.name}** dengan budget **${formatCurrency(largest.budget)}**.`
    };
  }
  
  // Monthly spending
  if (lower.includes('bulan') || lower.includes('monthly') || lower.includes(' Spending')) {
    return {
      type: 'monthly_spending',
      response: `Ringkasan spending tersedia di halaman /keuangan untuk melihat grafik pengeluaran bulanan. Total yang sudah dikeluarkan: **${formatCurrency(context.totalSpent)}**.`
    };
  }
  
  // Default - can't determine intent
  return {
    type: 'unknown',
    response: `Saya memahami pertanyaan Anda tentang "${message}". \n\nSaya bisa membantu dengan:\n• Total budget semua proyek\n• Total pengeluaran\n• Proyek aktif\n• Budget alert\n• Detail proyek tertentu (contoh: "Proyek 001")\n\nSilakan tanyakan dengan lebih spesifik!`
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    
    if (!message) {
      return NextResponse.json({ response: "Pesan tidak valid" }, { status: 400 });
    }

    // Get fresh data from database for more accurate responses
    const db = getDb();
    const allProjects = await db.select().from(projects);
    const allTransactions = await db.select().from(transactions);
    
    const totalBudget = allProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const activeProjects = allProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    
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
      activeProjects,
    };

    // Analyze the message and generate response
    const result = analyzeIntent(message, enrichedContext);
    
    return NextResponse.json({ response: result.response });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { response: "Maaf, terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}