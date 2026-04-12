"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Users } from "lucide-react";

interface Entity {
  id: string;
  name: string;
  type: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export default function EditEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "vendor",
    contact: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/entities?id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data && data.data[0]) {
            const e = data.data[0];
            setEntity(e);
            setFormData({
              name: e.name || "",
              type: e.type || "vendor",
              contact: e.contact || "",
              email: e.email || "",
              phone: e.phone || "",
              address: e.address || "",
            });
          }
        })
        .finally(() => setLoading(false));
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity) return;
    
    setSaving(true);

    try {
      const res = await fetch(`/api/entities/${entity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/entities/${entity.id}`);
      } else {
        alert("Failed to update entity");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating entity");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 pt-24">Loading...</div>;
  }

  if (!entity) {
    return <div className="p-10 pt-24">Entity not found</div>;
  }

  return (
    <div className="p-10 pt-24 space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            Edit Entity
          </h1>
          <p className="text-zinc-500 mt-1">
            Update entity information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-container-low p-6 rounded-lg space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
              placeholder="Entity name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "vendor" })}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.type === "vendor"
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-surface-container-high text-zinc-400"
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="font-headline font-bold">Vendor</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "client" })}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.type === "client"
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-surface-container-high text-zinc-400"
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-headline font-bold">Client</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Contact Person
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
              placeholder="Contact name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
              placeholder="+62xxx"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full bg-surface-container-high border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 resize-none"
              placeholder="Full address"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 bg-surface-container-low rounded-lg text-zinc-400 hover:bg-surface-container-high transition-colors font-headline font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 gold-gradient py-3 rounded-lg font-headline font-bold text-on-primary hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}