import { useEffect, useState } from "react";
import PortalLayout from "@/components/portal/PortalLayout";
import { portalCall } from "@/lib/portalClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

const TREINAMENTOS_PADRAO = [
  { tipo: "integracao", titulo: "Integração Institucional LASANT" },
  { tipo: "seguranca", titulo: "NR-06 — EPIs" },
  { tipo: "seguranca", titulo: "NR-35 — Trabalho em Altura (se aplicável)" },
  { tipo: "qualidade", titulo: "Política de Qualidade e Ética" },
];

export default function PortalAdmissional() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => portalCall<{ treinamentos: any[] }>("treinamentos-list").then((r) => setItems(r.treinamentos));
  useEffect(() => { load().catch((e) => toast.error(e.message)); }, []);

  const concluir = async (t: typeof TREINAMENTOS_PADRAO[number]) => {
    const jaFeito = items.find((x) => x.titulo === t.titulo && x.status === "concluido");
    if (jaFeito) return;
    setLoading(true);
    try {
      await portalCall("treinamento-concluir", { tipo: t.tipo, titulo: t.titulo });
      toast.success("Treinamento marcado como concluído.");
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const isDone = (titulo: string) => items.some((x) => x.titulo === titulo && x.status === "concluido");

  return (
    <PortalLayout requireTipo="candidato">
      <h1 className="text-2xl font-semibold mb-4">Exame Admissional e Integração</h1>

      <Card className="mb-4">
        <CardHeader><CardTitle>Exame Admissional</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>O agendamento do exame admissional é realizado pelo RH após o envio da ficha e dos documentos.</p>
          <p>Você receberá as informações (clínica, endereço, data e horário) por WhatsApp no número cadastrado.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Treinamentos de Integração</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {TREINAMENTOS_PADRAO.map((t) => {
              const done = isDone(t.titulo);
              return (
                <div key={t.titulo} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="text-sm font-medium">{t.titulo}</div>
                    <div className="text-xs text-muted-foreground">{t.tipo}</div>
                  </div>
                  {done ? (
                    <span className="text-xs text-green-700 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Concluído</span>
                  ) : (
                    <Button size="sm" onClick={() => concluir(t)} disabled={loading}>Marcar como concluído</Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
