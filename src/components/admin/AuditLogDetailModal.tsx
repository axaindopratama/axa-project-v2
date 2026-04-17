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
  action: _action,
  oldValue: _oldValue,
  newValue: _newValue,
}: AuditLogDetailModalProps) {
  return (
    <div className="text-xs text-zinc-500">
      (Dialog components missing)
    </div>
  );
}
