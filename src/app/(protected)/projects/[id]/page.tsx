import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ChevronRight, Plus, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { getDb } from "@/lib/db";
import { projects, milestones, tasks, transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getProject(id: string) {
  const db = getDb();
  const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return project[0] || null;
}

async function getProjectMilestones(projectId: string) {
  const db = getDb();
  return await db.select().from(milestones).where(eq(milestones.projectId, projectId)).orderBy(sql`${milestones.percentage} ASC`);
}

async function getProjectTasks(projectId: string) {
  const db = getDb();
  return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
}

async function getProjectTransactions(projectId: string) {
  const db = getDb();
  return await db.select().from(transactions).where(eq(transactions.projectId, projectId)).orderBy(sql`${transactions.date} DESC`);
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  
  if (!project) {
    notFound();
  }
  
  const milestonesList = await getProjectMilestones(id);
  const tasksList = await getProjectTasks(id);
  const transactionsList = await getProjectTransactions(id);
  
  const totalSpent = transactionsList.reduce((sum, tx) => sum + tx.amount, 0);
  const budgetUsedPercent = Math.round((totalSpent / project.budget) * 100);
  
  return (
    <div className="p-10 pt-24 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs uppercase tracking-widest">
        <Link href="/projects" className="text-zinc-500 hover:text-primary">Projects</Link>
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        <span className="text-primary">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="p-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">
              {project.number} - {project.name}
            </h1>
            <span className={`inline-block mt-2 px-3 py-1 text-xs uppercase font-bold tracking-widest rounded ${
              project.status === 'in_progress' || project.status === 'active'
                ? 'bg-primary/10 text-primary'
                : project.status === 'on_hold'
                ? 'bg-yellow-500/10 text-yellow-500'
                : 'bg-surface-container-highest text-zinc-400'
            }`}>
              {project.status}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link 
            href={`/projects/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-zinc-300 hover:text-primary hover:bg-surface-container-high transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-6 rounded-lg">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Total Budget</p>
          <p className="text-2xl font-headline font-bold text-primary">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(project.budget)}
          </p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-lg">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Total Spent</p>
          <p className="text-2xl font-headline font-bold text-on-surface">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalSpent)}
          </p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-lg">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Remaining</p>
          <p className="text-2xl font-headline font-bold text-emerald-500">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(project.budget - totalSpent)}
          </p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-lg">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Budget Usage</p>
          <p className="text-2xl font-headline font-bold text-on-surface">{budgetUsedPercent}%</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="bg-surface-container-low p-6 rounded-lg">
        <div className="flex justify-between mb-3">
          <span className="text-zinc-400 text-sm">Budget Progress</span>
          <span className="text-primary text-sm font-bold">{budgetUsedPercent}%</span>
        </div>
        <div className="h-4 bg-surface-container-highest rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${budgetUsedPercent > 80 ? 'bg-error' : budgetUsedPercent > 60 ? 'bg-yellow-500' : 'gold-gradient'}`}
            style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-headline font-bold text-on-surface">Milestones</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {milestonesList.length === 0 ? (
            <p className="text-zinc-500 col-span-3">No milestones yet</p>
          ) : (
            milestonesList.map((milestone) => (
              <div key={milestone.id} className={`p-4 rounded-lg border-l-4 ${
                milestone.isPaid 
                  ? 'bg-emerald-500/10 border-emerald-500' 
                  : 'bg-surface-container-low border-zinc-600'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-on-surface">{milestone.title}</h4>
                    <p className="text-primary font-headline font-bold mt-1">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(milestone.amount)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-zinc-400">{milestone.percentage}%</span>
                </div>
                <div className="mt-3">
                  <span className={`px-2 py-1 text-xs uppercase font-bold rounded ${
                    milestone.isPaid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {milestone.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-headline font-bold text-on-surface">Tasks</h2>
          <button className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors">
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
        <div className="space-y-2">
          {tasksList.length === 0 ? (
            <p className="text-zinc-500 py-4">No tasks yet</p>
          ) : (
            tasksList.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded border-2 ${task.status === 'done' ? 'bg-primary border-primary' : 'border-zinc-600'}`} />
                  <span className="text-zinc-300">{task.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs uppercase font-bold rounded ${
                    task.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' :
                    task.status === 'in_progress' ? 'bg-primary/10 text-primary' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {task.status}
                  </span>
                  <span className="text-zinc-500 text-sm">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(task.estCost || 0)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}