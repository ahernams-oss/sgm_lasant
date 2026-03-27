import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    paginated: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    totalPages,
    safePage,
  };
}

export default function PaginationControls({ currentPage, totalItems, onPageChange, pageSize = PAGE_SIZE }: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-xs text-muted-foreground">
        Página {safePage} de {totalPages} — {totalItems} registro(s)
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />Anterior
        </Button>
        <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>
          Próxima<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
