import { useEffect, useState } from "react";
import PortalLayout from "@/components/portal/PortalLayout";
import { portalCall } from "@/lib/portalClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

const TERMOS = [
  {
    tipo: "lgpd", titulo: "Termo LGPD - Consentimento",
    texto: "Autorizo a LASANT Construções a coletar, armazenar e tratar meus dados pessoais para fins de admissão, gestão de pessoas, cumprimento de obrigações legais trabalhistas e comunicação institucional, nos termos da Lei nº 13.709/2018 (LGPD).",
  },
];

export default function PortalTermos() {
  const [assinados, setAssinados] = useState<any[]>([]);
  const [ativos, setAtivos] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const load = () => portalCall<{ termos: any[] }>("termos-list").then((r) => setAssinados(r.termos));
  useEffect(() => { load().catch((e) => toast.error(e.message)); }, []);

  const jaAssinou = (tipo: string) => assinados.some((t) => t.tipo_termo === tipo);

  const assinar = async (t: typeof TERMOS[number]) => {
    if (!ativos[t.tipo]) return toast.error("Marque a declaração de aceite.");
    setLoading(true);
    try {
      await portalCall("termo-assinar", { tipo_termo: t.tipo, versao_termo: "1.0", texto_aceite: t.texto });
      toast.success("Termo assinado.");
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <PortalLayout requireTipo="candidato">
      <h1 className="text-2xl font-semibold mb-4">Termos e Documentos</h1>
      <div className="space-y-4">
        {TERMOS.map((t) => {
          const done = jaAssinou(t.tipo);
          return (
            <Card key={t.tipo}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t.titulo}</CardTitle>
                {done && <span className="text-xs text-green-700 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Assinado</span>}
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted/50 p-3 rounded whitespace-pre-line">{t.texto}</p>
                {!done && (
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                    <label className="text-sm flex items-center gap-2">
                      <Checkbox checked={!!ativos[t.tipo]} onCheckedChange={(v) => setAtivos({ ...ativos, [t.tipo]: !!v })} />
                      Li e concordo com este termo
                    </label>
                    <Button size="sm" onClick={() => assinar(t)} disabled={loading}>Assinar eletronicamente</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {assinados.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Comprovantes de Assinatura</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-xs font-mono">
            {assinados.map((a) => (
              <div key={a.id}>
                {a.tipo_termo} v{a.versao_termo} • {new Date(a.assinado_em).toLocaleString("pt-BR")} • HASH: {a.hash_sha256.slice(0, 16)}...
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PortalLayout>
  );
}
