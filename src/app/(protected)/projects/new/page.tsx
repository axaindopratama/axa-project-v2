"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface ProjectFormData {
  name: string;
  budget: string;
  status: string;
  hourlyRate: string;
  startDate: string;
  endDate: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    budget: "",
    status: "planning",
    hourlyRate: "150000",
    startDate: "",
    endDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      router.push(`/projects/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 pt-20 sm:pt-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link href="/projects" className="p-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface">
          New Project
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Project Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
            Project Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., Azure Heights"
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
            Total Budget (IDR) *
          </label>
          <input
            type="number"
            required
            value={formData.budget}
            onChange={(e) => handleChange("budget", e.target.value)}
            placeholder="e.g., 1000000000"
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-zinc-500">Enter amount without commas (e.g., 1000000)</p>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Hourly Rate */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
            Hourly Rate (IDR)
          </label>
          <input
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => handleChange("hourlyRate", e.target.value)}
            placeholder="150000"
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full bg-surface-container-low border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              className="w-full bg-surface-container-low border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
          <Link
            href="/projects"
            className="flex-1 px-6 py-3 bg-surface-container-low rounded-lg text-zinc-300 text-center font-medium hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 gold-gradient px-6 py-3 rounded-lg font-headline font-bold text-sm uppercase tracking-widest text-on-primary hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Buat Proyek
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}