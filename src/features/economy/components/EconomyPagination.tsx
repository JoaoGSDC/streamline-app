"use client";

import { Button } from "@/components/ui/button";

interface EconomyPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function EconomyPagination({
  page,
  totalPages,
  onPageChange,
}: EconomyPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Anterior
      </Button>
      <span className="text-label text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima →
      </Button>
    </div>
  );
}
