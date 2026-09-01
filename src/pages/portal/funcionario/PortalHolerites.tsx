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

  const blobDoHolerite = async (id: string) => {
    const { url } = await portalCall<{ url: string }>("download-holerite", { id });
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Não foi possível obter o arquivo.");
    return URL.createObjectURL(await resp.blob());
  };

  const download = async (h: H) => {
    setBusy(h.id + "d");
    try {
      const href = await blobDoHolerite(h.id);
      const a = document.createElement("a");
      a.href = href;
      a.download = `holerite-${String(h.competencia_mes).padStart(2, "0")}-${h.competencia_ano}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(href), 30000);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const imprimir = async (h: H) => {
    setBusy(h.id + "p");
    try {
      const href = await blobDoHolerite(h.id);
      const frame = document.createElement("iframe");
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.src = href;
      frame.onload = () => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch {
          window.open(href, "_blank");
        }
      };
      document.body.appendChild(frame);
      setTimeout(() => { URL.revokeObjectURL(href); frame.remove(); }, 60000);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
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
