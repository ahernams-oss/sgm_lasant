import { useEffect, useState } from "react";
import PortalLayout from "@/components/portal/PortalLayout";
import { portalCall } from "@/lib/portalClient";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, CheckCircle2, Clock } from "lucide-react";

interface T {
  id: string;
  tipo: string;
  titulo: string;
  status: string;
  concluido_em: string | null;
  nota: number | null;
  created_at: string;
}

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");

export default function PortalFuncTreinamentos() {
  const [list, setList] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalCall<{ treinamentos: T[] }>("treinamentos-list")
      .then((r) => setList(r.treinamentos))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalLayout requireTipo="funcionario">
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <GraduationCap className="w-6 h-6" /> Treinamentos
      </h1>
      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!loading && list.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhum treinamento registrado.</CardContent></Card>
      )}
      <div className="space-y-2">
        {list.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.titulo}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {t.tipo}
                  {t.concluido_em && <> · Concluído em {fmt(t.concluido_em)}</>}
                  {t.nota != null && <> · Nota {t.nota}</>}
                </div>
              </div>
              {t.status === "concluido" ? (
                <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Concluído
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pendente
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
