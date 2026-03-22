import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LocalCliente, Pavimento } from "@/contexts/ClientesContext";
import { Badge } from "@/components/ui/badge";

const UF_OPTIONS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const emptyLocal: Omit<LocalCliente, "id"> = {
  descricao: "", cep: "", bairro: "", logradouro: "", numero: "", complemento: "",
  uf: "", cidade: "", latitude: "", longitude: "", areaTotal: "", areaConstruida: "",
  contato: "", telContato: "", relLinha1: "", relLinha2: "", relLinha3: "", relLinha4: "",
  pavimentos: [],
};

interface LocaisSectionProps {
  locais: LocalCliente[];
  onChange: (locais: LocalCliente[]) => void;
}

export default function LocaisSection({ locais, onChange }: LocaisSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newLocal, setNewLocal] = useState<Omit<LocalCliente, "id">>(emptyLocal);

  const updateField = (field: keyof Omit<LocalCliente, "id">, value: string) =>
    setNewLocal((prev) => ({ ...prev, [field]: value }));

  const buscarCep = useCallback(async (cep: string, setter: (field: string, value: string) => void) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado."); return; }
      setter("logradouro", data.logradouro || "");
      setter("bairro", data.bairro || "");
      setter("cidade", data.localidade || "");
      setter("uf", data.uf || "");
    } catch { toast.error("Erro ao buscar CEP."); }
  }, []);

  const handleAdd = () => {
    if (!newLocal.descricao.trim()) { toast.error("Informe a descrição do local."); return; }
    const local: LocalCliente = { id: crypto.randomUUID(), ...newLocal };
    onChange([...locais, local]);
    setNewLocal(emptyLocal);
    setAdding(false);
    toast.success("Local adicionado!");
  };

  const handleDelete = (id: string) => {
    onChange(locais.filter((l) => l.id !== id));
    toast.success("Local removido.");
  };

  const handleUpdateLocal = (id: string, field: keyof Omit<LocalCliente, "id">, value: string) => {
    onChange(locais.map((l) => l.id === id ? { ...l, [field]: value } : l));
  };

  const renderFields = (
    data: Omit<LocalCliente, "id">,
    onFieldChange: (field: keyof Omit<LocalCliente, "id">, value: string) => void,
    onCepBlur: () => void
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      <div className="md:col-span-2">
        <label className="field-label">Descrição *</label>
        <Input value={data.descricao} onChange={(e) => onFieldChange("descricao", e.target.value)} placeholder="Ex: Sede, Filial Centro" />
      </div>
      <div>
        <label className="field-label">CEP</label>
        <Input value={data.cep} onChange={(e) => onFieldChange("cep", e.target.value)} onBlur={onCepBlur} placeholder="00000-000" />
      </div>
      <div>
        <label className="field-label">Logradouro</label>
        <Input value={data.logradouro} onChange={(e) => onFieldChange("logradouro", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Nº</label>
        <Input value={data.numero} onChange={(e) => onFieldChange("numero", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Complemento</label>
        <Input value={data.complemento} onChange={(e) => onFieldChange("complemento", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Bairro</label>
        <Input value={data.bairro} onChange={(e) => onFieldChange("bairro", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Cidade</label>
        <Input value={data.cidade} onChange={(e) => onFieldChange("cidade", e.target.value)} />
      </div>
      <div>
        <label className="field-label">UF</label>
        <Select value={data.uf} onValueChange={(v) => onFieldChange("uf", v)}>
          <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
          <SelectContent>{UF_OPTIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="field-label">Latitude</label>
        <Input value={data.latitude} onChange={(e) => onFieldChange("latitude", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Longitude</label>
        <Input value={data.longitude} onChange={(e) => onFieldChange("longitude", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Área Total (m²)</label>
        <Input value={data.areaTotal} onChange={(e) => onFieldChange("areaTotal", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Área Construída (m²)</label>
        <Input value={data.areaConstruida} onChange={(e) => onFieldChange("areaConstruida", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Contato</label>
        <Input value={data.contato} onChange={(e) => onFieldChange("contato", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Tel. Contato</label>
        <Input value={data.telContato} onChange={(e) => onFieldChange("telContato", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Rel. Linha 1</label>
        <Input value={data.relLinha1} onChange={(e) => onFieldChange("relLinha1", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Rel. Linha 2</label>
        <Input value={data.relLinha2} onChange={(e) => onFieldChange("relLinha2", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Rel. Linha 3</label>
        <Input value={data.relLinha3} onChange={(e) => onFieldChange("relLinha3", e.target.value)} />
      </div>
      <div>
        <label className="field-label">Rel. Linha 4</label>
        <Input value={data.relLinha4} onChange={(e) => onFieldChange("relLinha4", e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="section-card animate-fade-up mb-6" style={{ animationDelay: "120ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">Locais do Cliente</h2>
        {!adding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Adicionar Local
          </Button>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-lg p-4 mb-4 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Novo Local</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setAdding(false); setNewLocal(emptyLocal); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {renderFields(newLocal, updateField, () => buscarCep(newLocal.cep, updateField))}
          <div className="mt-4">
            <Button type="button" size="sm" onClick={handleAdd} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Salvar Local
            </Button>
          </div>
        </div>
      )}

      {locais.length === 0 && !adding ? (
        <p className="text-center text-sm text-muted-foreground py-6">Nenhum local cadastrado.</p>
      ) : (
        <div className="divide-y divide-border">
          {locais.map((local) => (
            <div key={local.id} className="py-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  onClick={() => setExpandedId(expandedId === local.id ? null : local.id)}
                >
                  {expandedId === local.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {local.descricao}
                  {local.cidade && <span className="text-muted-foreground font-normal text-xs">— {local.cidade}/{local.uf}</span>}
                </button>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(local.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {expandedId === local.id && (
                renderFields(
                  local,
                  (field, value) => handleUpdateLocal(local.id, field, value),
                  () => buscarCep(local.cep, (field, value) => handleUpdateLocal(local.id, field as keyof Omit<LocalCliente, "id">, value))
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
