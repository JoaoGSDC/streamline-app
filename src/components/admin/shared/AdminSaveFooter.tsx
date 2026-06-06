"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminSaveFooterProps {
  dirty: boolean;
  saving?: boolean;
  saved?: boolean;
  onSave: () => void;
  className?: string;
}

export function AdminSaveFooter({
  dirty,
  saving = false,
  saved = false,
  onSave,
  className,
}: AdminSaveFooterProps) {
  return (
    <div className={cn("admin-save-footer", className)}>
      <div className="flex min-h-5 flex-1 items-center">
        {dirty && !saving ? (
          <span className="admin-save-status--dirty" aria-live="polite">
            ● Alterações não salvas
          </span>
        ) : null}
        {saved && !dirty && !saving ? (
          <span className="admin-save-status--saved" aria-live="polite">
            ✓ Configurações salvas
          </span>
        ) : null}
      </div>
      <Button
        onClick={onSave}
        disabled={saving || !dirty}
        size="sm"
        className={cn(dirty && !saving && "bg-primary hover:bg-primary/90")}
      >
        {saving ? "Salvando…" : "Salvar configurações"}
      </Button>
    </div>
  );
}
