"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

interface ProjectEditFormProps {
  project: {
    id: string;
    number: string;
    name: string;
    budget: number;
    status: string;
    hourlyRate: number;
    startDate: string | null;
    endDate: string | null;
  };
}

interface ProjectFormData {
  name: string;
  budget: string;
  status: string;
  hourlyRate: string;
  startDate: string;
  endDate: string;
}

export default function ProjectEditForm({ project }: ProjectEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project.name,
    budget: project.budget.toString(),
    status: project.status,
    hourlyRate: project.hourlyRate.toString(),
    startDate: project.startDate || "",
    endDate: project.endDate || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update project");
      }

      router.push(`/projects/${project.id}`);
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
    <div className="p-10 pt-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/projects/${project.id}`} className="p-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <h1 className="text-3xl font-headline font-bold text-on-surface">
          Edit Project {project.number}
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
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
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
            className="w-full bg-surface-container-low border-none text-zinc-300 py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
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
        <div className="flex gap-4 pt-4">
          <Link
            href={`/projects/${project.id}`}
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
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}