import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Upload, FileText, X, Lock } from "lucide-react";
import type { Faturamento } from "@/contexts/ClientesContext";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import { usePermissao } from "@/hooks/usePermissao";

const emptyFaturamento: Omit<Faturamento, "id"> = {
  periodoInicio: "",
  periodoFim: "",
  dataEmissaoNf: "",
  xmlNfNome: "",
  xmlNfConteudo: "",
  numeroMedicao: "",
  descricao: "",
  valorBruto: "",
  valorLiquido: "",
  valorFolha: "",
  anexoNfUrl: "",
  anexoNfNome: "",
  pago: false,
  dataPagamento: "",
};

interface Props {
  faturamentos: Faturamento[];
  onChange: (faturamentos: Faturamento[]) => void;
  contratoNumero: string;
}

export default function FaturamentoSection({ faturamentos, onChange, contratoNumero }: Props) {
  const [form, setForm] = useState<Omit<Faturamento, "id">>(emptyFaturamento);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();
  const { tem } = usePermissao();
  const podeVerValorFolha = tem("clientes.ver_valor_folha");

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleImportXml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xml")) {
      toast.error("Selecione um arquivo XML válido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      // Try to extract NF number and value from XML
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");
        const nNF = xmlDoc.getElementsByTagName("nNF")[0]?.textContent || "";
        const vNF = xmlDoc.getElementsByTagName("vNF")[0]?.textContent || "";
        const dhEmi = xmlDoc.getElementsByTagName("dhEmi")[0]?.textContent || "";
        const dataEmi = dhEmi ? dhEmi.substring(0, 10) : "";
        
        setForm((prev) => ({
          ...prev,
          xmlNfNome: file.name,
          xmlNfConteudo: content.substring(0, 5000), // limit storage
          ...(nNF && !prev.numeroMedicao ? { numeroMedicao: nNF } : {}),
          ...(vNF && !prev.valorBruto ? { valorBruto: vNF } : {}),
          ...(dataEmi && !prev.dataEmissaoNf ? { dataEmissaoNf: dataEmi } : {}),
        }));
        toast.success("XML importado! Dados extraídos automaticamente.");
      } catch {
        setForm((prev) => ({ ...prev, xmlNfNome: file.name, xmlNfConteudo: content.substring(0, 5000) }));
        toast.success("XML importado.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAnexoNf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        anexoNfUrl: ev.target?.result as string,
        anexoNfNome: file.name,
      }));
      toast.success("NF anexada.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = () => {
    if (!form.periodoInicio || !form.periodoFim) {
      toast.error("Informe o período do faturamento.");
      return;
    }
    if (editingId) {
      const updated = faturamentos.map((f) => (f.id === editingId ? { ...f, ...form } : f));
      onChange(updated);
      toast.success("Faturamento atualizado!");
    } else {
      const novo: Faturamento = { id: crypto.randomUUID(), ...form };
      onChange([...faturamentos, novo]);
      toast.success("Faturamento adicionado!");
    }
    setForm(emptyFaturamento);
    setEditingId(null);
  };

  const handleEdit = (f: Faturamento) => {
    setEditingId(f.id);
    const { id, ...rest } = f;
    setForm(rest);
  };

  const handleDelete = (id: string) => {
    onChange(faturamentos.filter((f) => f.id !== id));
    toast.success("Faturamento removido.");
    if (editingId === id) {
      setForm(emptyFaturamento);
      setEditingId(null);
    }
  };

  const formatCurrency = (val: string) => {
    if (!val) return "—";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="mt-4 border border-border rounded-lg p-4 bg-muted/30">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Faturamento — Contrato {contratoNumero}
      </h3>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="field-label">Período Início *</label>
          <Input type="date" value={form.periodoInicio} onChange={(e) => update("periodoInicio", e.target.value)} />
        </div>
        <div>
          <label className="field-label">Período Fim *</label>
          <Input type="date" value={form.periodoFim} onChange={(e) => update("periodoFim", e.target.value)} />
        </div>
        <div>
          <label className="field-label">Data Emissão NF</label>
          <div className="flex gap-2">
            <Input type="date" value={form.dataEmissaoNf} onChange={(e) => update("dataEmissaoNf", e.target.value)} className="flex-1" />
            <label className="cursor-pointer">
              <input type="file" accept=".xml" className="hidden" onChange={handleImportXml} />
              <Button type="button" variant="outline" size="icon" asChild title="Importar XML da NF">
                <span><Upload className="h-4 w-4" /></span>
              </Button>
            </label>
          </div>
          {form.xmlNfNome && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <FileText className="h-3 w-3" /> {form.xmlNfNome}
              <button type="button" onClick={() => setForm(p => ({ ...p, xmlNfNome: "", xmlNfConteudo: "" }))} className="text-destructive hover:text-destructive/80">
                <X className="h-3 w-3" />
              </button>
            </p>
          )}
        </div>
        <div>
          <label className="field-label">Nº Medição</label>
          <Input placeholder="Nº da medição" value={form.numeroMedicao} onChange={(e) => update("numeroMedicao", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Descrição</label>
          <Input placeholder="Descrição do faturamento" value={form.descricao} onChange={(e) => update("descricao", e.target.value)} />
        </div>
        <div>
          <label className="field-label">Valor Bruto</label>
          <Input placeholder="0,00" value={form.valorBruto} onChange={(e) => update("valorBruto", e.target.value)} />
        </div>
        <div>
          <label className="field-label">Valor Líquido</label>
          <Input placeholder="0,00" value={form.valorLiquido} onChange={(e) => update("valorLiquido", e.target.value)} />
        </div>
        {podeVerValorFolha && (
          <div>
            <label className="field-label flex items-center gap-1">
              <Lock className="h-3 w-3 text-primary" /> Valor Folha
            </label>
            <Input placeholder="0,00" value={form.valorFolha} onChange={(e) => update("valorFolha", e.target.value)} />
          </div>
        )}
        <div>
          <label className="field-label">Anexar NF</label>
          <label className="cursor-pointer">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleAnexoNf} />
            <Button type="button" variant="outline" size="sm" asChild className="w-full gap-2">
              <span><Upload className="h-3.5 w-3.5" /> {form.anexoNfNome || "Selecionar arquivo"}</span>
            </Button>
          </label>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={form.pago}
              onCheckedChange={(v) => update("pago", !!v)}
              id="pago"
            />
            <label htmlFor="pago" className="text-sm font-medium cursor-pointer">Pago</label>
          </div>
          {form.pago && (
            <div className="flex-1">
              <label className="field-label">Data Pagamento</label>
              <Input type="date" value={form.dataPagamento} onChange={(e) => update("dataPagamento", e.target.value)} />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button size="sm" type="button" onClick={handleSave}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {editingId ? "Salvar Alterações" : "Adicionar Faturamento"}
        </Button>
        {editingId && (
          <Button size="sm" variant="outline" type="button" onClick={() => { setForm(emptyFaturamento); setEditingId(null); }}>
            Cancelar
          </Button>
        )}
      </div>

      {/* List */}
      {faturamentos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum faturamento cadastrado.</p>
      ) : (
        <div className="divide-y divide-border">
          {faturamentos.map((f) => (
            <div key={f.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                <p className="font-medium text-foreground">
                  Medição {f.numeroMedicao || "—"}
                </p>
                <p className="text-muted-foreground truncate sm:col-span-2">{f.descricao || "—"}</p>
                <p className="text-muted-foreground tabular-nums">
                  {f.periodoInicio ? new Date(f.periodoInicio + "T00:00:00").toLocaleDateString("pt-BR") : "—"} a{" "}
                  {f.periodoFim ? new Date(f.periodoFim + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                </p>
                <p className="text-muted-foreground">Bruto: {formatCurrency(f.valorBruto)}</p>
                <p className="text-muted-foreground">Líquido: {formatCurrency(f.valorLiquido)}</p>
                {podeVerValorFolha && (
                  <p className="text-primary font-medium flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Folha: {formatCurrency(f.valorFolha)}
                  </p>
                )}
                <p className="text-muted-foreground">
                  Emissão: {f.dataEmissaoNf ? new Date(f.dataEmissaoNf + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                </p>
                <p className={`font-medium ${f.pago ? "text-emerald-600" : "text-amber-600"}`}>
                  {f.pago ? `Pago em ${f.dataPagamento ? new Date(f.dataPagamento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}` : "Pendente"}
                </p>
                {f.anexoNfNome && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {f.anexoNfNome}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" type="button" onClick={() => handleEdit(f)} className="text-xs">Editar</Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => requestDelete(f.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <DoubleConfirmDelete open={!!deleteId} onOpenChange={(open) => !open && cancelDelete()} onConfirm={() => { if (deleteId) { handleDelete(deleteId); cancelDelete(); } }} />
    </div>
  );
}
