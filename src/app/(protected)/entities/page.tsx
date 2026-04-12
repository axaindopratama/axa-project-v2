import Link from "next/link";
import { Plus, Search, Filter, ChevronRight, Building2, Users } from "lucide-react";
import { getDb } from "@/lib/db";
import { entities } from "@/lib/db/schema";

async function getEntities() {
  const db = getDb();
  return await db.select().from(entities);
}

export default async function EntitiesPage() {
  const entitiesList = await getEntities();
  
  const vendors = entitiesList.filter(e => e.type === 'vendor');
  const clients = entitiesList.filter(e => e.type === 'client');
  
  return (
    <div className="p-10 pt-24 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            Entities
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage vendors and clients
          </p>
        </div>
        <Link 
          href="/entities/new"
          className="gold-gradient px-6 py-3 rounded-lg font-headline font-bold text-sm uppercase tracking-widest text-on-primary hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Entity
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Cari entitas..." 
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 pl-12 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-surface-container-low rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {entitiesList.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-4">Belum ada entitas</p>
          <Link href="/entities/new" className="text-primary hover:underline">
            Buat entitas pertama
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {vendors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-zinc-500" />
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Vendors ({vendors.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.map((entity) => (
                  <Link
                    key={entity.id}
                    href={`/entities/${entity.id}`}
                    className="bg-surface-container-low p-5 rounded-lg group hover:bg-surface-container-high transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-headline font-bold text-on-surface">
                          {entity.name}
                        </h3>
                        {entity.contact && (
                          <p className="text-sm text-zinc-500 mt-1">{entity.contact}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-zinc-500">
                      {entity.email && <span>{entity.email}</span>}
                      {entity.phone && <span>{entity.phone}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {clients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-zinc-500" />
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Clients ({clients.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((entity) => (
                  <Link
                    key={entity.id}
                    href={`/entities/${entity.id}`}
                    className="bg-surface-container-low p-5 rounded-lg group hover:bg-surface-container-high transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-headline font-bold text-on-surface">
                          {entity.name}
                        </h3>
                        {entity.contact && (
                          <p className="text-sm text-zinc-500 mt-1">{entity.contact}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-zinc-500">
                      {entity.email && <span>{entity.email}</span>}
                      {entity.phone && <span>{entity.phone}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}