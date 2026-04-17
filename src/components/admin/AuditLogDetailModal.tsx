"use client";

// These components are missing from the project, commenting out to fix the build.
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
type AuditLogDetailModalProps = {
  action: string;
  oldValue: string | null;
  newValue: string | null;
};

export function AuditLogDetailModal({
  action,
  oldValue,
  newValue,
}: AuditLogDetailModalProps) {
  const hasDetails = Boolean(oldValue || newValue);

  return (
    <div className="text-xs text-zinc-500 space-y-1">
      <p className="font-medium text-zinc-400">{action}</p>
      <p>{hasDetails ? "Detail tersedia" : "Tidak ada detail perubahan"}</p>
      <p>(Dialog components missing)</p>
    </div>
  );
}
