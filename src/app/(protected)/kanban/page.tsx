"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, GripVertical, TrendingUp, TrendingDown, AlertTriangle, X, Trash2, AlertCircle, Loader2, Edit2, Calendar, User } from "lucide-react";

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

const priorities = [
  { id: "rendah", label: "Rendah", color: "text-emerald-500" },
  { id: "sedang", label: "Sedang", color: "text-yellow-500" },
  { id: "tinggi", label: "Tinggi", color: "text-red-500" },
];

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Form states
  const [taskForm, setTaskForm] = useState({
    projectId: "",
    title: "",
    priority: "sedang",
    dueDate: "",
    assignee: "",
    estCost: 0,
  });
  const [costForm, setCostForm] = useState({ actCost: 0, hours: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    } else {
      fetchAllTasks();
    }
  }, [selectedProject]);

  const fetchData = async () => {
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
  };

  const fetchTasks = async (projectId: string) => {
    const res = await fetch(`/api/tasks?projectId=${projectId}`);
    const data = await res.json();
    setTasks(data.data || []);
  };

  const fetchAllTasks = async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.data || []);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: string) => {
    if (!draggedTask) return;

    const wasDone = draggedTask.status === "done";
    const isNowDone = status === "done";

    if (!wasDone && isNowDone) {
      setSelectedTask(draggedTask);
      setCostForm({ actCost: draggedTask.actCost || 0, hours: draggedTask.hours || 0 });
      setShowCostModal(true);
    } else {
      await updateTaskStatus(draggedTask.id, status);
    }

    setDraggedTask(null);
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
          title: taskForm.title,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate || null,
          assignee: taskForm.assignee || null,
          estCost: taskForm.estCost,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      setShowAddModal(false);
      setTaskForm({ projectId: "", title: "", priority: "sedang", dueDate: "", assignee: "", estCost: 0 });
      
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
          priority: selectedTask.priority,
          dueDate: selectedTask.dueDate || null,
          assignee: selectedTask.assignee || null,
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('id-ID');
  };

  const getVariance = (est: number, act: number) => {
    if (est === 0) return 0;
    return ((act - est) / est) * 100;
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "tinggi") return "text-red-500";
    if (priority === "sedang") return "text-yellow-500";
    return "text-emerald-500";
  };

  const getPriorityBg = (priority: string) => {
    if (priority === "tinggi") return "bg-red-500/10 text-red-500";
    if (priority === "sedang") return "bg-yellow-500/10 text-yellow-500";
    return "bg-emerald-500/10 text-emerald-500";
  };

  if (loading) {
    return (
      <div className="p-10 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-10 pt-24 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            Financial Kanban
          </h1>
          <p className="text-zinc-500 mt-1">
            Task-to-Cost tracking with drag-and-drop
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-low border-none text-zinc-300 py-2 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 text-sm w-48"
            />
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-surface-container-low border-none text-zinc-300 py-2 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.number} - {p.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowAddModal(true)}
            className="gold-gradient px-4 py-2 rounded-lg font-headline font-bold text-sm uppercase tracking-widest text-on-primary hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-3 gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="bg-surface-container-low rounded-xl min-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
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
                const employeeName = getEmployeeName(task.assignee);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-surface-container-high p-4 rounded-lg cursor-grab active:cursor-grabbing group hover:bg-surface-container-highest transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">
                          {getProjectName(task.projectId)}
                        </span>
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

                    {/* Priority Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 text-xs uppercase font-bold rounded ${getPriorityBg(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    {/* Due Date & Assignee */}
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      )}
                      {employeeName && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{employeeName}</span>
                        </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
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
                  Penanggung Jawab (Assignee)
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
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
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
                  Judul Task *
                </label>
                <input
                  type="text"
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Prioritas
                  </label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
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
                    value={selectedTask.dueDate || ""}
                    onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value || null })}
                    className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Penanggung Jawab (Assignee)
                </label>
                <select
                  value={selectedTask.assignee || ""}
                  onChange={(e) => setSelectedTask({ ...selectedTask, assignee: e.target.value || null })}
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
                  value={selectedTask.estCost}
                  onChange={(e) => setSelectedTask({ ...selectedTask, estCost: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
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

            <div className="flex gap-4">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
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

            <div className="flex gap-4 mt-6">
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