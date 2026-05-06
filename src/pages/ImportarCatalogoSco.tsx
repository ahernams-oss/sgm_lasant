import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrcamentosSco } from "@/contexts/OrcamentosScoContext";
import { toast } from "sonner";

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      res(s.split(",")[1] || "");
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function ImportarCatalogoSco() {
  const nav = useNavigate();
  const { countCatalog } = useOrcamentosSco();
  const [counts, setCounts] = useState({ elementares: 0, servicos: 0, composicoes: 0 });
  const [fgv04, setFgv04] = useState<File | null>(null);
  const [fgv06, setFgv06] = useState<File | null>(null);
  const [fgv07, setFgv07] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = () => countCatalog().then(setCounts);
  useEffect(() => { refresh(); }, []);

  const importar = async () => {
    if (!fgv04 && !fgv06 && !fgv07) { toast.error("Selecione ao menos um arquivo"); return; }
    setLoading(true);
    try {
      const payload: any = {};
      if (fgv04) payload.fgv04 = await fileToBase64(fgv04);
      if (fgv06) payload.fgv06 = await fileToBase64(fgv06);
      if (fgv07) payload.fgv07 = await fileToBase64(fgv07);
      toast.info("Enviando catálogos... isso pode levar alguns minutos.");
      const { data, error } = await supabase.functions.invoke("import-sco-catalogs", { body: payload });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha");
      toast.success(`Importação concluída: ${JSON.stringify(data)}`);
      await refresh();
      setFgv04(null); setFgv06(null); setFgv07(null);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro: " + (e.message || e));
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => nav("/orcamentos")}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-serif font-bold">Importar Catálogo SCO/FGV</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Estado atual</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div><div className="text-2xl font-bold" style={{ color: "#673ab7" }}>{counts.elementares}</div><div className="text-xs text-muted-foreground">Elementares</div></div>
          <div><div className="text-2xl font-bold" style={{ color: "#673ab7" }}>{counts.servicos}</div><div className="text-xs text-muted-foreground">Serviços</div></div>
          <div><div className="text-2xl font-bold" style={{ color: "#673ab7" }}>{counts.composicoes}</div><div className="text-xs text-muted-foreground">Composições</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Carregar planilhas FGV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>FGV04 — Itens Elementares (.xlsx)</Label>
            <Input type="file" accept=".xlsx" onChange={(e) => setFgv04(e.target.files?.[0] || null)} />
          </div>
          <div>
            <Label>FGV06 — Itens de Serviço (.xlsx)</Label>
            <Input type="file" accept=".xlsx" onChange={(e) => setFgv06(e.target.files?.[0] || null)} />
          </div>
          <div>
            <Label>FGV07 — Composições (.xlsx)</Label>
            <Input type="file" accept=".xlsx" onChange={(e) => setFgv07(e.target.files?.[0] || null)} />
          </div>
          <p className="text-xs text-muted-foreground">A importação substitui completamente o catálogo anterior. Recomenda-se enviar os 3 arquivos juntos para manter consistência.</p>
          <Button onClick={importar} disabled={loading} style={{ background: "#673ab7" }}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            {loading ? "Importando..." : "Importar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
