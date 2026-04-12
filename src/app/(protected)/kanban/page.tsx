"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, GripVertical, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface Task {
  id: string;
  projectId: string;
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

const columns = [
  { id: "todo", title: "To Do", color: "bg-zinc-500" },
  { id: "in_progress", title: "In Progress", color: "bg-primary" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showCostModal, setShowCostModal] = useState(false);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [costForm, setCostForm] = useState({ actCost: 0, hours: 0 });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    } else {
      fetchAllTasks();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data.data || []);
    setLoading(false);
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
      setCompletedTask(draggedTask);
      setCostForm({ actCost: draggedTask.actCost || 0, hours: draggedTask.hours || 0 });
      setShowCostModal(true);
    } else {
      await updateTaskStatus(draggedTask.id, status);
    }

    setDraggedTask(null);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const now = new Date().toISOString();
    const updates: any = { status };
    if (status === "in_progress" && !tasks.find(t => t.id === taskId)?.startedAt) {
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

  const handleSaveCost = async () => {
    if (!completedTask) return;

    const now = new Date().toISOString();
    await fetch(`/api/tasks/${completedTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "done",
        actCost: costForm.actCost,
        hours: costForm.hours,
        completedAt: now,
      }),
    });

    setTasks(tasks.map(t => t.id === completedTask.id ? { 
      ...t, 
      status: "done", 
      actCost: costForm.actCost, 
      hours: costForm.hours,
      completedAt: now
    } : t));

    setShowCostModal(false);
    setCompletedTask(null);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? `${project.number} - ${project.name}` : "Unknown Project";
  };

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const getVariance = (est: number, act: number) => {
    if (est === 0) return 0;
    return ((act - est) / est) * 100;
  };

  if (loading) {
    return <div className="p-10 pt-24">Loading...</div>;
  }

  return (
    <div className="p-10 pt-24 space-y-8 min-h-screen">
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
          <Link 
            href="/projects"
            className="gold-gradient px-4 py-2 rounded-lg font-headline font-bold text-sm uppercase tracking-widest text-on-primary hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Link>
        </div>
      </div>

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
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {getTasksByStatus(column.id).map((task) => {
                const variance = getVariance(task.estCost, task.actCost);
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
                      <button className="text-zinc-600 hover:text-zinc-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-headline font-bold text-on-surface mb-3">
                      {task.title}
                    </h3>

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

      {showCostModal && completedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-headline font-bold text-on-surface mb-2">
              Complete Task
            </h2>
            <p className="text-zinc-500 mb-6">
              Enter actual cost for: {completedTask.title}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Actual Cost (Rp)
                </label>
                <input
                  type="number"
                  value={costForm.actCost}
                  onChange={(e) => setCostForm({ ...costForm, actCost: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Hours Worked
                </label>
                <input
                  type="number"
                  value={costForm.hours}
                  onChange={(e) => setCostForm({ ...costForm, hours: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                  placeholder="0"
                />
              </div>
              <div className="bg-surface-container-high p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Estimated Cost</span>
                  <span className="text-zinc-300">{formatCurrency(completedTask.estCost)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-zinc-500">Variance</span>
                  <span className={`font-headline font-bold ${
                    costForm.actCost > completedTask.estCost ? 'text-red-500' : 'text-emerald-500'
                  }`}>
                    {costForm.actCost > 0 
                      ? ((costForm.actCost - completedTask.estCost) / completedTask.estCost * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowCostModal(false)}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 hover:bg-surface-container-highest transition-colors font-headline font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCost}
                className="flex-1 gold-gradient py-3 rounded-lg font-headline font-bold text-on-primary hover:shadow-lg transition-all"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}