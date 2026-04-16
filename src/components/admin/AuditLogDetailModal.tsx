import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface AuditLogDetailModalProps {
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
}

export function AuditLogDetailModal({ action, oldValue, newValue }: AuditLogDetailModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs h-8">
          View details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Audit Log: {action}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {oldValue && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Old Value:</h4>
              <pre className="bg-zinc-900 p-3 rounded text-xs overflow-auto max-h-60 text-zinc-300">
                {JSON.stringify(JSON.parse(oldValue), null, 2)}
              </pre>
            </div>
          )}
          {newValue && (
            <div>
              <h4 className="font-semibold text-sm mb-1">New Value:</h4>
              <pre className="bg-zinc-900 p-3 rounded text-xs overflow-auto max-h-60 text-zinc-300">
                {JSON.stringify(JSON.parse(newValue), null, 2)}
              </pre>
            </div>
          )}
          {!oldValue && !newValue && (
            <p className="text-zinc-500">No details available.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
