"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, ArrowLeft, Edit, Trash2, X, Loader2, AlertTriangle, Check, Clock } from "lucide-react";

interface Project {
  id: string;
  number: string;
  name: string;
  budget: number;
  status: string;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: string | null;
  estCost: number;
  actCost: number;
  hours: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  paymentStatus: string;
}

const priorities = [
  { id: "rendah", label: "Rendah" },
  { id: "sedang", label: "Sedang" },
  { id: "tinggi", label: "Tinggi" },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: "",
    priority: "sedang",
    dueDate: "",
    assignee: "",
    estCost: 0,
  });

  useEffect(() => {
    params.then((p) => {
      setProjectId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      const [projectRes, tasksRes, transactionsRes, employeesRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/tasks?projectId=${id}`),
        fetch(`/api/transactions?projectId=${id}`),
        fetch("/api/entities?type=employee"),
      ]);

      const projectData = await projectRes.json();
      const tasksData = await tasksRes.json();
      const transactionsData = await transactionsRes.json();
      const employeesData = await employeesRes.json();

      setProject(projectData.data);
      setTasks(tasksData.data || []);
      setTransactions(transactionsData.data || []);
      setEmployees(employeesData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (entityId: string | null) => {
    if (!entityId) return "-";
    const employee = employees.find(e => e.id === entityId);
    return employee?.name || "-";
  };

  const totalSpent = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const budgetUsedPercent = project ? Math.round((totalSpent / project.budget) * 100) : 0;

  const handleAddTask = async () => {
    if (!taskForm.title) return;
    
    setSaving(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: taskForm.title,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate || null,
          assignee: taskForm.assignee || null,
          estCost: taskForm.estCost,
        }),
      });

      setShowTaskModal(false);
      setTaskForm({ title: "", priority: "sedang", dueDate: "", assignee: "", estCost: 0 });
      fetchData(projectId);
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          completedAt: newStatus === "done" ? new Date().toISOString() : null,
        }),
      });
      fetchData(projectId);
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    setSaving(true);
    try {
      await fetch(`/api/tasks/${selectedTask.id}`, { method: "DELETE" });
      setShowDeleteTaskModal(false);
      setSelectedTask(null);
      fetchData(projectId);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteProjectModal(false);
        router.push("/projects");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('id-ID');
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "tinggi") return "bg-red-500/10 text-red-500";
    if (priority === "sedang") return "bg-yellow-500/10 text-yellow-500";
    return "bg-emerald-500/10 text-emerald-500";
  };

  const getStatusColor = (status: string) => {
    if (status === 'done') return 'bg-emerald-500/10 text-emerald-500';
    if (status === 'in_progress') return 'bg-primary/10 text-primary';
    return 'bg-zinc-700 text-zinc-400';
  };

  if (loading) {
    return (
      <div className="p-10 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return <div className="p-10 pt-24">Project not found</div>;
  }

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
            href={`/projects/${projectId}/invoice`}
            className="flex items-center gap-2 px-4 py-2 gold-gradient text-on-primary rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:shadow-lg transition-all"
          >
            Invoice
          </Link>
          <Link 
            href={`/projects/${projectId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-zinc-300 hover:text-primary hover:bg-surface-container-high transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button 
            onClick={() => setShowDeleteProjectModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-6 rounded-lg">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Total Budget</p>
          <p className="text-2xl font-headline font-bold text-primary">
            {formatCurrency(project.budget)}
          </p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-lg">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Total Spent</p>
          <p className="text-2xl font-headline font-bold text-on-surface">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-lg">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Remaining</p>
          <p className="text-2xl font-headline font-bold text-emerald-500">
            {formatCurrency(project.budget - totalSpent)}
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

      {/* Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-headline font-bold text-on-surface">Tasks</h2>
          <button 
            onClick={() => {
              setSelectedTask(null);
              setShowTaskModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Task
          </button>
        </div>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-zinc-500 py-4">Belum ada task</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleTaskStatus(task)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      task.status === 'done' ? 'bg-primary border-primary' : 'border-zinc-600 hover:border-primary'
                    }`}
                  >
                    {task.status === 'done' && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div>
                    <span className={`text-zinc-300 ${task.status === 'done' ? 'line-through' : ''}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs uppercase font-bold rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="text-xs text-zinc-500">
                          👤 {getEmployeeName(task.assignee)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-500 text-sm">
                    {formatCurrency(task.estCost)}
                  </span>
                  <span className={`px-2 py-1 text-xs uppercase font-bold rounded ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowDeleteTaskModal(true);
                    }}
                    className="p-1 text-zinc-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-headline font-bold text-on-surface">
                Tambah Task
              </h2>
              <button onClick={() => setShowTaskModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Judul Task *
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                  placeholder="Nama task..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Prioritas
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                  >
                    {priorities.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Penanggung Jawab
                </label>
                <select
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Estimasi Biaya (Rp)
                </label>
                <input
                  type="number"
                  value={taskForm.estCost}
                  onChange={(e) => setTaskForm({ ...taskForm, estCost: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 hover:bg-surface-container-highest transition-colors font-headline font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleAddTask}
                disabled={saving || !taskForm.title}
                className="flex-1 gold-gradient py-3 rounded-lg font-headline font-bold text-on-primary hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Modal */}
      {showDeleteTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-headline font-bold text-on-surface">Hapus Task</h3>
                <p className="text-sm text-zinc-500">Aksi ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-zinc-300 mb-6">
              Apakah Anda yakin ingin menghapus task <span className="font-bold text-primary">{selectedTask.title}</span>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteTaskModal(false)}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 font-headline font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={saving}
                className="flex-1 py-3 bg-red-500 rounded-lg font-headline font-bold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {showDeleteProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-headline font-bold text-on-surface">Hapus Proyek</h3>
                <p className="text-sm text-zinc-500">Aksi ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-zinc-300 mb-6">
              Apakah Anda yakin ingin menghapus proyek <span className="font-bold text-primary">{project?.number} - {project?.name}</span>? Semua data terkait (transactions, tasks) juga akan dihapus.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteProjectModal(false)}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 hover:bg-surface-container-highest transition-colors font-headline font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={saving}
                className="flex-1 py-3 bg-red-500 rounded-lg font-headline font-bold text-white hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
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