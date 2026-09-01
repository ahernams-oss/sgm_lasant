import { useEffect, useState } from "react";
import PortalLayout from "@/components/portal/PortalLayout";
import { portalCall } from "@/lib/portalClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface H { id: string; tipo: string; competencia_mes: number; competencia_ano: number; descricao?: string; disponibilizado_em: string; }
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const TIPO_LABEL: Record<string,string> = { folha: "Holerite Mensal", "13o": "13º Salário", ferias: "Férias", rescisao: "Rescisão", outros: "Outros" };

export default function PortalHolerites() {
  const [list, setList] = useState<H[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    portalCall<{ holerites: H[] }>("list-holerites")
      .then((r) => setList(r.holerites))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const download = async (id: string) => {
    try {
      const { url } = await portalCall<{ url: string }>("download-holerite", { id });
      window.open(url, "_blank");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <PortalLayout requireTipo="funcionario">
      <h1 className="text-2xl font-semibold mb-4">Holerites e Comprovantes</h1>
      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!loading && list.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhum documento disponível ainda.</CardContent></Card>
      )}
      <div className="space-y-2">
        {list.map((h) => (
          <Card key={h.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{TIPO_LABEL[h.tipo] ?? h.tipo}</div>
                <div className="text-sm text-muted-foreground">
                  {MESES[h.competencia_mes - 1]}/{h.competencia_ano}
                  {h.descricao && ` — ${h.descricao}`}
                </div>
              </div>
              <Button size="sm" onClick={() => download(h.id)}><Download className="w-4 h-4 mr-1" />Baixar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
