"use client";

import { FileX, FolderOpen, Users, CreditCard, FolderPlus, Plus } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "folder" | "file" | "users" | "transactions" | "project";
  action?: {
    label: string;
    href: string;
  };
}

const iconMap = {
  folder: FolderOpen,
  file: FileX,
  users: Users,
  transactions: CreditCard,
  project: FolderPlus,
};

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const IconComponent = icon ? iconMap[icon] : FolderOpen;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
        <IconComponent className="w-8 h-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-headline font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-md mb-6">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="gold-gradient text-on-primary px-6 py-3 rounded-lg font-headline font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:shadow-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function EmptyProjects() {
  return (
    <EmptyState
      title="Belum Ada Proyek"
      description="Mulai proyek pertama Anda untuk mengelola anggaran dan task dengan lebih terstruktur."
      icon="project"
      action={{ label: "Buat Proyek Baru", href: "/projects/new" }}
    />
  );
}

export function EmptyTransactions() {
  return (
    <EmptyState
      title="Belum Ada Transaksi"
      description="Catat transaksi pertama Anda untuk mulai melacak pemasukan dan pengeluaran."
      icon="transactions"
      action={{ label: "Catat Transaksi", href: "/transactions/new" }}
    />
  );
}

export function EmptyEntities() {
  return (
    <EmptyState
      title="Belum Ada Entitas"
      description="Tambahkan vendor, client, atau karyawan untuk memudahkan pengelolaan data relasi."
      icon="users"
      action={{ label: "Tambah Entitas", href: "/entities/new" }}
    />
  );
}