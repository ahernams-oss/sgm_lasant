import React, { useState, useRef } from "react";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import { Plus, Trash2, FileDown, Upload, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { NrFuncionario } from "@/contexts/FuncionariosContext";
import { toast } from "sonner";

const NR_OPTIONS = Array.from({ length: 38 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return `NR-${num}`;
});

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-foreground/80">{label}{required && " *"}</Label>
    {children}
  </div>
);

interface Props {
  nrs: NrFuncionario[];
  onChange: (nrs: NrFuncionario[]) => void;
}

export function NRsFuncionarioTab({ nrs, onChange }: Props) {
  const [novaNr, setNovaNr] = useState({ numero: "", descricao: "", dataEntrega: "" });
  const [pendingFile, setPendingFile] = useState<{ base64: string; nome: string; tipo: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formFileRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const addNr = () => {
    if (!novaNr.numero || !novaNr.descricao) {
      toast.error("Preencha o número e a descrição da NR.");
      return;
    }
    const nova: NrFuncionario = {
      id: crypto.randomUUID(),
      numero: novaNr.numero,
      descricao: novaNr.descricao,
      dataEntrega: novaNr.dataEntrega,
      ...(pendingFile ? { anexoBase64: pendingFile.base64, anexoNome: pendingFile.nome, anexoTipo: pendingFile.tipo } : {}),
    };
    onChange([...nrs, nova]);
    setNovaNr({ numero: "", descricao: "", dataEntrega: "" });
    setPendingFile(null);
    if (formFileRef.current) formFileRef.current.value = "";
    toast.success("NR adicionada!");
  };

  const handleFormFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 2MB).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingFile({ base64: reader.result as string, nome: file.name, tipo: file.type });
    };
    reader.readAsDataURL(file);
  };

  const removeNr = (id: string) => {
    onChange(nrs.filter((n) => n.id !== id));
    toast.success("NR removida.");
  };

  const handleUploadClick = (id: string) => {
    setUploadingId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 2MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onChange(nrs.map((n) =>
        n.id === uploadingId
          ? { ...n, anexoBase64: base64, anexoNome: file.name, anexoTipo: file.type }
          : n
      ));
      toast.success("Anexo adicionado!");
      setUploadingId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const downloadAnexo = (nr: NrFuncionario) => {
    if (!nr.anexoBase64 || !nr.anexoNome) return;
    const link = document.createElement("a");
    link.href = nr.anexoBase64;
    link.download = nr.anexoNome;
    link.click();
  };

  const removeAnexo = (id: string) => {
    onChange(nrs.map((n) =>
      n.id === id
        ? { ...n, anexoBase64: undefined, anexoNome: undefined, anexoTipo: undefined }
        : n
    ));
    toast.success("Anexo removido.");
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/80">Número da NR *</Label>
          <Select value={novaNr.numero} onValueChange={(v) => setNovaNr((p) => ({ ...p, numero: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecione a NR" /></SelectTrigger>
            <SelectContent>
              {NR_OPTIONS.map((nr) => (
                <SelectItem key={nr} value={nr}>{nr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/80">Descrição *</Label>
          <Input
            value={novaNr.descricao}
            onChange={(e) => setNovaNr((p) => ({ ...p, descricao: e.target.value }))}
            placeholder="Ex: Equipamentos de Proteção Individual"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/80">Data de Entrega</Label>
          <Input
            type="date"
            value={novaNr.dataEntrega}
            onChange={(e) => setNovaNr((p) => ({ ...p, dataEntrega: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/80">Anexo</Label>
          <Input
            ref={formFileRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFormFileChange}
            className="text-xs"
          />
        </div>
        <Button type="button" onClick={addNr} className="shadow-md">
          <Plus className="h-4 w-4 mr-1" /> Adicionar NR
        </Button>
      </div>

      {nrs.length > 0 ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead>Anexo</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nrs.map((nr) => (
                <TableRow key={nr.id}>
                  <TableCell className="font-medium">{nr.numero}</TableCell>
                  <TableCell>{nr.descricao}</TableCell>
                  <TableCell>{nr.dataEntrega || "—"}</TableCell>
                  <TableCell>
                    {nr.anexoBase64 ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadAnexo(nr)}
                          className="h-7 text-xs gap-1"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          {nr.anexoNome}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeAnexo(nr.id)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleUploadClick(nr.id)}
                        className="h-7 text-xs gap-1"
                      >
                        <Upload className="h-3.5 w-3.5" /> Anexar
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeNr(nr.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Nenhuma NR cadastrada para este funcionário.
        </div>
      )}
    </div>
  );
}
