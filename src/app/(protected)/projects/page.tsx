import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Filter, ChevronRight } from "lucide-react";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

async function getProjects() {
  const db = getDb();
  try {
    return await db.select().from(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export default async function ProjectsPage() {
  const projectsList = await getProjects();
  
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
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 pl-12 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-surface-container-low rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Projects Grid */}
      {projectsList.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-4">Belum ada proyek</p>
          <Link 
            href="/projects/new"
            className="text-primary hover:underline"
          >
            Buat proyek pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsList.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-surface-container-low p-6 rounded-lg group hover:bg-surface-container-high transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-primary font-headline font-black text-2xl">
                    {project.number}
                  </span>
                  <h3 className="text-xl font-headline font-bold text-on-surface mt-2">
                    {project.name}
                  </h3>
                </div>
                <span className={`px-2 py-1 text-xs uppercase font-bold tracking-widest rounded ${
                  project.status === 'in_progress' || project.status === 'active'
                    ? 'bg-primary/10 text-primary'
                    : project.status === 'on_hold'
                    ? 'bg-yellow-500/10 text-yellow-500'
                    : project.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-surface-container-highest text-zinc-400'
                }`}>
                  {project.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-zinc-500">Budget</span>
                    <span className="text-zinc-300">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(project.budget)}
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
          ))}
        </div>
      )}
    </div>
  );
}