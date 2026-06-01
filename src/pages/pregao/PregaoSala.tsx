import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Construction, Gavel } from "lucide-react";
import { usePregao } from "@/contexts/PregaoContext";
import { formatNumeroAno } from "@/lib/formatNumero";

export default function PregaoSala() {
  const { id } = useParams();
  const nav = useNavigate();
  const { pregoes } = usePregao();
  const pregao = pregoes.find(p => p.id === id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/compras/pregao")}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="p-2 rounded-xl bg-primary/10 text-primary"><Gavel className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-serif font-semibold">
            Sala de Disputa {pregao && `— Pregão ${formatNumeroAno(pregao.numero, pregao.createdAt)}`}
          </h1>
          {pregao && <Badge variant="outline" className="mt-1">{pregao.status}</Badge>}
        </div>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Construction className="h-5 w-5 text-amber-600" /> Sala em construção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            A <strong>sala de disputa em tempo real</strong> (lances anônimos, cronômetro com prorrogação automática, chat oficial e painel do pregoeiro)
            será entregue na <strong>Fase 2</strong> do plano.
          </p>
          <p>
            Já está pronto: cadastro completo do pregão, itens/lotes, documentos exigidos, termo com hash e credenciamento de fornecedores
            no Portal do Fornecedor.
          </p>
          {pregao && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div><span className="text-xs">Objeto:</span><div className="text-foreground">{pregao.objeto}</div></div>
              <div><span className="text-xs">Modalidade:</span><div className="text-foreground">{pregao.modalidade}</div></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
