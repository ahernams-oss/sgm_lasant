import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { gerarHashRdo } from "@/lib/assinaturaHash";

const fmtDateTime = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const labelPapel = (p: string) => p === "responsavel" ? "Responsável Técnico" : "Fiscalização";

export default function VerificarAssinatura() {
  const { codigo: codigoParam } = useParams();
  const [codigo, setCodigo] = useState(codigoParam || "");
  const [busca, setBusca] = useState(!!codigoParam);
  const [loading, setLoading] = useState(false);
  const [assinatura, setAssinatura] = useState<any>(null);
  const [rdo, setRdo] = useState<any>(null);
  const [todasAssinaturas, setTodasAssinaturas] = useState<any[]>([]);
  const [hashAtual, setHashAtual] = useState<string>("");
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const buscar = async (cod: string) => {
    if (!cod) return;
    setLoading(true);
    setNaoEncontrado(false);
    setAssinatura(null);
    setRdo(null);
    try {
      const { data: ass } = await supabase
        .from("rdo_assinaturas")
        .select("*")
        .eq("codigo_verificador", cod.trim())
        .maybeSingle();
      if (!ass) { setNaoEncontrado(true); setLoading(false); return; }
      setAssinatura(ass);

      const { data: r } = await supabase
        .from("rdos")
        .select("*")
        .eq("id", ass.rdo_id)
        .maybeSingle();
      setRdo(r);

      const { data: outras } = await supabase
        .from("rdo_assinaturas")
        .select("*")
        .eq("rdo_id", ass.rdo_id)
        .order("signed_at");
      setTodasAssinaturas(outras || []);

      if (r) {
        const h = await gerarHashRdo(r as any);
        setHashAtual(h);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codigoParam) buscar(codigoParam);
  }, [codigoParam]);

  const integro = assinatura && hashAtual && assinatura.hash_documento === hashAtual;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-semibold">Verificação de Assinatura Eletrônica</h1>
          <Button asChild variant="outline" size="sm"><Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link></Button>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Buscar por código verificador</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              placeholder="Digite o código verificador"
              onKeyDown={e => e.key === "Enter" && (setBusca(true), buscar(codigo))}
            />
            <Button onClick={() => { setBusca(true); buscar(codigo); }} disabled={loading || !codigo}>
              {loading ? "Buscando..." : "Verificar"}
            </Button>
          </CardContent>
        </Card>

        {busca && naoEncontrado && (
          <Card className="border-destructive">
            <CardContent className="pt-6 flex items-center gap-3 text-destructive">
              <ShieldAlert className="h-6 w-6" />
              <div>
                <p className="font-semibold">Assinatura não encontrada</p>
                <p className="text-sm text-muted-foreground">O código informado não corresponde a nenhuma assinatura registrada no sistema.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {assinatura && (
          <>
            <Card className={integro ? "border-2 border-green-500" : "border-2 border-amber-500"}>
              <CardHeader className="pb-2 flex-row items-center gap-2">
                {integro ? <ShieldCheck className="h-6 w-6 text-green-600" /> : <ShieldAlert className="h-6 w-6 text-amber-600" />}
                <CardTitle className="text-base">
                  {integro ? "Assinatura Válida e Documento Íntegro" : "Assinatura registrada — verifique a integridade"}
                </CardTitle>
                <Badge variant="outline" className={integro ? "ml-auto bg-green-100 text-green-800 border-green-300" : "ml-auto bg-amber-100 text-amber-800 border-amber-300"}>
                  {integro ? "Válida" : "Atenção"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {!integro && hashAtual && (
                  <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2">
                    O conteúdo do documento foi modificado após a assinatura. O hash atual não confere com o hash assinado.
                  </p>
                )}
                <p><span className="font-semibold">Documento:</span> RDO Nº {assinatura.rdo_numero}</p>
                <p><span className="font-semibold">Papel:</span> {labelPapel(assinatura.papel)}</p>
                <p><span className="font-semibold">Signatário:</span> {assinatura.signatario_nome}</p>
                {assinatura.signatario_email && <p><span className="font-semibold">E-mail:</span> {assinatura.signatario_email}</p>}
                {assinatura.signatario_cargo && <p><span className="font-semibold">Cargo:</span> {assinatura.signatario_cargo}</p>}
                {assinatura.signatario_matricula && <p><span className="font-semibold">Matrícula:</span> {assinatura.signatario_matricula}</p>}
                <p><span className="font-semibold">Data/Hora da assinatura:</span> {fmtDateTime(assinatura.signed_at)}</p>
                {assinatura.ip_origem && <p><span className="font-semibold">IP de origem:</span> {assinatura.ip_origem}</p>}
                <p className="italic text-muted-foreground mt-2 text-xs">{assinatura.base_legal}</p>
                <div className="border-t pt-2 mt-2 space-y-1">
                  <p className="text-xs"><span className="font-semibold">Código verificador:</span> <code className="bg-muted px-1 rounded">{assinatura.codigo_verificador}</code></p>
                  <p className="text-xs break-all"><span className="font-semibold">Hash assinado:</span> <code className="bg-muted px-1 rounded">{assinatura.hash_documento}</code></p>
                  {hashAtual && <p className="text-xs break-all"><span className="font-semibold">Hash atual:</span> <code className="bg-muted px-1 rounded">{hashAtual}</code></p>}
                </div>
              </CardContent>
            </Card>

            {rdo && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Conteúdo do RDO</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="font-semibold">Cliente:</span> {rdo.cliente_nome}</p>
                  <p><span className="font-semibold">Obra:</span> {rdo.obra}</p>
                  <p><span className="font-semibold">Data:</span> {rdo.data_rdo ? new Date(rdo.data_rdo + "T00:00:00").toLocaleDateString("pt-BR") : "-"}</p>
                  <p><span className="font-semibold">Responsável:</span> {rdo.responsavel}</p>
                  <p><span className="font-semibold">Avanço Físico:</span> {(Number(rdo.avanco_fisico_geral) || 0).toFixed(2)}%</p>
                  <p><span className="font-semibold">Status:</span> {rdo.status}</p>
                </CardContent>
              </Card>
            )}

            {todasAssinaturas.length > 1 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Outras assinaturas neste documento</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {todasAssinaturas.filter(a => a.id !== assinatura.id).map(a => (
                    <div key={a.id} className="border rounded p-2">
                      <p><strong>{labelPapel(a.papel)}:</strong> {a.signatario_nome} — {fmtDateTime(a.signed_at)}</p>
                      <p className="text-xs text-muted-foreground">Código: {a.codigo_verificador}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
