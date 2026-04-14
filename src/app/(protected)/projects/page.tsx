"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, ChevronRight, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Skeleton, SkeletonCard, SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState, EmptyProjects } from "@/components/ui/EmptyState";
import { ErrorState, ErrorCard } from "@/components/ui/ErrorState";

interface Project {
  id: string;
  number: string;
  name: string;
  budget: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Gagal memuat data proyek");
      const data = await res.json();
      setProjects(data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete project");
      }

      setShowDeleteModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    if (status === 'in_progress' || status === 'active') return 'bg-primary/10 text-primary';
    if (status === 'on_hold') return 'bg-yellow-500/10 text-yellow-500';
    if (status === 'completed') return 'bg-emerald-500/10 text-emerald-500';
    return 'bg-surface-container-highest text-zinc-400';
  };

  if (loading) {
    return (
      <div className="p-10 pt-24 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-12 w-40" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1 max-w-md" />
          <Skeleton className="h-12 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 pt-24 space-y-8">
        <ErrorState 
          message={error} 
          action={{ label: "Coba Lagi", onClick: fetchProjects }} 
        />
      </div>
    );
  }

  return (
    <div className="p-10 pt-24 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            Projects
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage all your projects in one place
          </p>
        </div>
        <Link 
          href="/projects/new"
          className="gold-gradient px-6 py-3 rounded-lg font-headline font-bold text-sm uppercase tracking-widest text-on-primary hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Project
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Cari proyek..." 
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

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        searchQuery ? (
          <ErrorState 
            message="Tidak ada proyek yang cocok dengan pencarian Anda" 
          />
        ) : (
          <EmptyProjects />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-surface-container-low p-6 rounded-lg group hover:bg-surface-container-high transition-all duration-300"
            >
              <Link href={`/projects/${project.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-primary font-headline font-black text-2xl">
                      {project.number}
                    </span>
                    <h3 className="text-xl font-headline font-bold text-on-surface mt-2">
                      {project.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 text-xs uppercase font-bold tracking-widest rounded ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-zinc-500">Budget</span>
                      <span className="text-zinc-300">
                        {formatCurrency(project.budget)}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full w-[45%] gold-gradient rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-500">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString('id-ID') : 'No date'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-headline font-bold text-on-surface">
                  Hapus Proyek
                </h3>
                <p className="text-sm text-zinc-500">
                  Aksi ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-zinc-300 mb-6">
              Apakah Anda yakin ingin menghapus proyek <span className="font-bold text-primary">{selectedProject.number} - {selectedProject.name}</span>? Semua data terkait (transactions, tasks, milestones) juga akan dihapus.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProject(null);
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