"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, AlertTriangle, X, Trash2, Loader2, Edit2, RotateCcw, Play, CheckCircle } from "lucide-react";

interface Task {
  id: string;
  projectId: string;
  assignedTo: string | null;
  title: string;
  status: string;
  estCost: number;
  actCost: number;
  hours: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface Project {
  id: string;
  number: string;
  name: string;
  budget: number;
}

interface Entity {
  id: string;
  name: string;
  type: string;
}

const columns = [
  { id: "todo", title: "To Do", color: "bg-zinc-500" },
  { id: "in_progress", title: "In Progress", color: "bg-primary" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Form states
  const [taskForm, setTaskForm] = useState({
    projectId: "",
    assignedTo: "",
    title: "",
    estCost: 0,
  });
  const [costForm, setCostForm] = useState({ actCost: 0, hours: 0 });
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async (projectId: string) => {
    const res = await fetch(`/api/tasks?projectId=${projectId}`);
    const data = await res.json();
    setTasks(data.data || []);
  }, []);

  const fetchAllTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.data || []);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, employeesRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/entities?type=employee"),
      ]);
      const projectsData = await projectsRes.json();
      const employeesData = await employeesRes.json();
      setProjects(projectsData.data || []);
      setEmployees(employeesData.data || []);
      await fetchAllTasks();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchAllTasks]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    } else {
      fetchAllTasks();
    }
  }, [selectedProject, fetchAllTasks, fetchTasks]);

  const moveTaskToStatus = async (taskId: string, newStatus: string) => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    // If moving to Done, show cost modal
    if (newStatus === 'done' && currentTask.status !== 'done') {
      setSelectedTask(currentTask);
      setCostForm({ actCost: currentTask.actCost || 0, hours: currentTask.hours || 0 });
      setShowCostModal(true);
      return;
    }

    // Otherwise update status directly
    await updateTaskStatus(taskId, newStatus);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { status };
    
    const currentTask = tasks.find(t => t.id === taskId);
    if (status === "in_progress" && currentTask?.status !== "in_progress") {
      updates.startedAt = now;
    }
    if (status === "done") {
      updates.completedAt = now;
    }

    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const handleSaveTask = async () => {
    if (!taskForm.projectId || !taskForm.title) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: taskForm.projectId,
          assignedTo: taskForm.assignedTo || null,
          title: taskForm.title,
          estCost: taskForm.estCost,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      setShowAddModal(false);
      setTaskForm({ projectId: "", assignedTo: "", title: "", estCost: 0 });
      
      if (selectedProject) {
        fetchTasks(selectedProject);
      } else {
        fetchAllTasks();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    
    setSaving(true);
    try {
      await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedTask.title,
          assignedTo: selectedTask.assignedTo || null,
          estCost: selectedTask.estCost,
        }),
      });

      setShowEditModal(false);
      
      if (selectedProject) {
        fetchTasks(selectedProject);
      } else {
        fetchAllTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    setSaving(true);
    try {
      await fetch(`/api/tasks/${selectedTask.id}`, { method: "DELETE" });
      setShowDeleteModal(false);
      setSelectedTask(null);
      
      if (selectedProject) {
        fetchTasks(selectedProject);
      } else {
        fetchAllTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCost = async () => {
    if (!selectedTask) return;

    const now = new Date().toISOString();
    await fetch(`/api/tasks/${selectedTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "done",
        actCost: costForm.actCost,
        hours: costForm.hours,
        completedAt: now,
      }),
    });

    setTasks(tasks.map(t => t.id === selectedTask.id ? { 
      ...t, 
      status: "done", 
      actCost: costForm.actCost, 
      hours: costForm.hours,
      completedAt: now
    } : t));

    setShowCostModal(false);
    setSelectedTask(null);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask({ ...task });
    setShowEditModal(true);
  };

  const openDeleteModal = (task: Task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? `${project.number} - ${project.name}` : "Unknown Project";
  };

  const getEmployeeName = (entityId: string | null) => {
    if (!entityId) return null;
    const employee = employees.find(e => e.id === entityId);
    return employee?.name || null;
  };

  const getTasksByStatus = (status: string) => {
    let filtered = tasks.filter(t => t.status === status);
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getProjectName(t.projectId).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const getVariance = (est: number, act: number) => {
    if (est === 0) return 0;
    return ((act - est) / est) * 100;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 space-y-6 sm:space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface">
            Financial Kanban
          </h1>
          <p className="text-zinc-500 mt-1">
            Task-to-Cost tracking with drag-and-drop
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <input
              type="text"
              placeholder="Cari task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:w-56 bg-surface-container-low border-none text-zinc-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 text-sm"
            />
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full bg-surface-container-low border-none text-zinc-300 py-2.5 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.number} - {p.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto justify-center gold-gradient px-4 py-2.5 rounded-lg font-headline font-bold text-sm uppercase tracking-widest text-on-primary hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 sm:pb-4 snap-x snap-mandatory">
        {columns.map((column) => (
          <div
            key={column.id}
            className="bg-surface-container-low rounded-xl min-h-[500px] flex-shrink-0 w-[86vw] sm:w-[24rem] lg:w-1/3 snap-start"
          >
            <div className="p-4 border-b border-surface-container-highest">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${column.color}`} />
                  <span className="font-headline font-bold text-on-surface">
                    {column.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    {getTasksByStatus(column.id).length}
                  </span>
                  <button
                    onClick={() => {
                      setTaskForm({ ...taskForm, projectId: selectedProject });
                      setShowAddModal(true);
                    }}
                    className="p-1 rounded hover:bg-surface-container-high text-zinc-500 hover:text-primary"
                    title="Tambah task"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {getTasksByStatus(column.id).map((task) => {
                const variance = getVariance(task.estCost, task.actCost);
                return (
                  <div
                    key={task.id}
                    className="bg-surface-container-high p-4 rounded-lg group hover:bg-surface-container-highest transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">
                          {getProjectName(task.projectId)}
                        </span>
                        {task.assignedTo && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded w-fit uppercase font-bold">
                            {getEmployeeName(task.assignedTo)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditModal(task)}
                          className="p-1 rounded text-zinc-600 hover:text-primary hover:bg-surface-container-high"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(task)}
                          className="p-1 rounded text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                          title="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-headline font-bold text-on-surface mb-3">
                      {task.title}
                    </h3>

                    {/* Action Buttons based on status */}
                    <div className="flex gap-2 mb-3">
                      {task.status === 'todo' && (
                        <button
                          onClick={() => moveTaskToStatus(task.id, 'in_progress')}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded hover:bg-primary/30 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Mulai
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => moveTaskToStatus(task.id, 'done')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded hover:bg-emerald-500/30 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Selesai
                          </button>
                          <button
                            onClick={() => moveTaskToStatus(task.id, 'todo')}
                            className="flex items-center justify-center gap-1 py-1.5 bg-zinc-700 text-zinc-400 text-xs font-bold rounded hover:bg-zinc-600 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      {task.status === 'done' && (
                        <button
                          onClick={() => moveTaskToStatus(task.id, 'todo')}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-zinc-700 text-zinc-400 text-xs font-bold rounded hover:bg-zinc-600 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Ulang
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Estimated</span>
                        <span className="text-zinc-300 font-headline font-bold">
                          {formatCurrency(task.estCost)}
                        </span>
                      </div>
                      {task.actCost > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Actual</span>
                          <span className={`font-headline font-bold ${
                            variance > 20 ? 'text-red-500' : variance < 0 ? 'text-emerald-500' : 'text-zinc-300'
                          }`}>
                            {formatCurrency(task.actCost)}
                          </span>
                        </div>
                      )}
                      {task.hours > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Hours</span>
                          <span className="text-zinc-300">{task.hours}h</span>
                        </div>
                      )}
                    </div>

                    {task.actCost > 0 && task.estCost > 0 && (
                      <div className={`mt-3 flex items-center gap-1 text-xs ${
                        variance > 20 ? 'text-red-500' : variance < 0 ? 'text-emerald-500' : 'text-zinc-500'
                      }`}>
                        {variance > 20 ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : variance < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        <span className="font-bold">
                          {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-surface-container-low p-4 sm:p-6 rounded-t-xl sm:rounded-xl max-w-md w-full mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-headline font-bold text-on-surface">
                Tambah Task Baru
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Project *
                </label>
                <select
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                  required
                >
                  <option value="">-- Pilih Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.number} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Tugaskan Ke
                </label>
                <select
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg mb-4"
                >
                  <option value="">-- Tidak Ditugaskan --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

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

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Estimasi Biaya (Rp)
                </label>
                <input
                  type="number"
                  value={taskForm.estCost}
                  onChange={(e) => setTaskForm({ ...taskForm, estCost: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 hover:bg-surface-container-highest transition-colors font-headline font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTask}
                disabled={saving || !taskForm.projectId || !taskForm.title}
                className="flex-1 gold-gradient py-3 rounded-lg font-headline font-bold text-on-primary hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-surface-container-low p-4 sm:p-6 rounded-t-xl sm:rounded-xl max-w-md w-full mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-headline font-bold text-on-surface">
                Edit Task
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Tugaskan Ke
                </label>
                <select
                  value={selectedTask.assignedTo || ""}
                  onChange={(e) => setSelectedTask({ ...selectedTask, assignedTo: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg mb-4"
                >
                  <option value="">-- Tidak Ditugaskan --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Judul Task *
                </label>
                <input
                  type="text"
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Estimasi Biaya (Rp)
                </label>
                <input
                  type="number"
                  value={selectedTask.estCost}
                  onChange={(e) => setSelectedTask({ ...selectedTask, estCost: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 hover:bg-surface-container-highest transition-colors font-headline font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateTask}
                disabled={saving || !selectedTask.title}
                className="flex-1 gold-gradient py-3 rounded-lg font-headline font-bold text-on-primary hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-surface-container-low p-4 sm:p-6 rounded-t-xl sm:rounded-xl max-w-md w-full mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-headline font-bold text-on-surface">
                  Hapus Task
                </h3>
                <p className="text-sm text-zinc-500">
                  Aksi ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-zinc-300 mb-6">
              Apakah Anda yakin ingin menghapus task <span className="font-bold text-primary">{selectedTask.title}</span>?
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTask(null);
                }}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 hover:bg-surface-container-highest transition-colors font-headline font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={saving}
                className="flex-1 py-3 bg-red-500 rounded-lg font-headline font-bold text-white hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Modal (Complete Task) */}
      {showCostModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-surface-container-low p-4 sm:p-6 rounded-t-xl sm:rounded-xl max-w-md w-full mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-headline font-bold text-on-surface mb-2">
              Selesaikan Task
            </h2>
            <p className="text-zinc-500 mb-6">
              Masukkan biaya aktual untuk: {selectedTask.title}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Biaya Aktual (Rp)
                </label>
                <input
                  type="number"
                  value={costForm.actCost}
                  onChange={(e) => setCostForm({ ...costForm, actCost: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Jam Kerja
                </label>
                <input
                  type="number"
                  value={costForm.hours}
                  onChange={(e) => setCostForm({ ...costForm, hours: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                />
              </div>
              <div className="bg-surface-container-high p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Estimasi Biaya</span>
                  <span className="text-zinc-300">{formatCurrency(selectedTask.estCost)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-zinc-500">Variance</span>
                  <span className={`font-headline font-bold ${
                    costForm.actCost > selectedTask.estCost ? 'text-red-500' : 'text-emerald-500'
                  }`}>
                    {costForm.actCost > 0 
                      ? ((costForm.actCost - selectedTask.estCost) / selectedTask.estCost * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-6">
              <button
                onClick={() => {
                  setShowCostModal(false);
                  setSelectedTask(null);
                }}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 hover:bg-surface-container-highest transition-colors font-headline font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCost}
                className="flex-1 gold-gradient py-3 rounded-lg font-headline font-bold text-on-primary hover:shadow-lg transition-all"
              >
                Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}