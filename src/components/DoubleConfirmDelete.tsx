import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DoubleConfirmDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DoubleConfirmDelete({ open, onOpenChange, onConfirm }: DoubleConfirmDeleteProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const handleOpenChange = (value: boolean) => {
    if (!value) setStep(1);
    onOpenChange(value);
  };

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const handleSecondConfirm = () => {
    onConfirm();
    setStep(1);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            {step === 1
              ? "Deseja realmente excluir esse registro?"
              : "Caso confirme, não haverá como recuperar o registro, confirma a exclusão?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {step === 1 ? (
            <AlertDialogAction onClick={handleFirstConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, excluir
            </AlertDialogAction>
          ) : (
            <AlertDialogAction onClick={handleSecondConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmo a exclusão
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook to manage double confirm delete state.
 * Returns [deleteId, requestDelete, confirmDelete, cancelDelete]
 */
export function useDoubleConfirmDelete() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const requestDelete = (id: string) => setDeleteId(id);
  const cancelDelete = () => setDeleteId(null);

  return { deleteId, requestDelete, cancelDelete };
}
