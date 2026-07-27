import { useEffect, useState } from "react";
import PortalLayout from "@/components/portal/PortalLayout";
import { portalCall } from "@/lib/portalClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Dep { nome: string; parentesco: string; nascimento: string; cpf?: string; }
interface Contato { nome: string; parentesco: string; telefone: string; }

export default function PortalFicha() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("rascunho");

  const [dp, setDp] = useState<any>({ nome: "", rg: "", orgao: "", dataNasc: "", sexo: "", estadoCivil: "", nacionalidade: "Brasileira", naturalidade: "", nomeMae: "", nomePai: "", telefone: "", email: "" });
  const [docs, setDocs] = useState<any>({
    cpf: "", rgNumero: "", rgOrgao: "", rgUf: "", rgEmissao: "",
    ctpsNumero: "", ctpsSerie: "", ctpsUf: "", ctpsEmissao: "",
    pisPasep: "", tituloEleitor: "", tituloZona: "", tituloSecao: "",
    cnhNumero: "", cnhCategoria: "", cnhValidade: "", cnhPrimeira: "",
    reservistaNumero: "", reservistaCategoria: "",
    passaporteNumero: "", passaporteValidade: "",
    certidaoNumero: "", certidaoTipo: "", certidaoEmissao: "",
    escolaridade: "", cursoFormacao: "",
  });
  const [end, setEnd] = useState<any>({ cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" });
  const [bc, setBc] = useState<any>({ banco: "", agencia: "", conta: "", tipoConta: "", chavePix: "" });
  const [deps, setDeps] = useState<Dep[]>([]);
  const [ces, setCes] = useState<Contato[]>([]);

  useEffect(() => {
    portalCall<{ ficha: any }>("cand-ficha-get").then(({ ficha }) => {
      if (ficha) {
        const { documentos, ...rest } = (ficha.dados_pessoais || {});
        setDp({ ...dp, ...rest });
        if (documentos) setDocs({ ...docs, ...documentos });
        setEnd({ ...end, ...(ficha.endereco || {}) });
        setBc({ ...bc, ...(ficha.bancarios || {}) });
        setDeps(ficha.dependentes || []); setCes(ficha.contatos_emergencia || []);
        setStatus(ficha.status || "rascunho");
      }
    }).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvar = async (enviar = false) => {
    setSaving(true);
    try {
      await portalCall("cand-ficha-save", { dados_pessoais: { ...dp, documentos: docs }, endereco: end, bancarios: bc, dependentes: deps, contatos_emergencia: ces, enviar });
      toast.success(enviar ? "Ficha enviada para análise do RH." : "Rascunho salvo.");
      if (enviar) setStatus("enviada");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const F = ({ l, v, on, type = "text" }: any) => (
    <div><Label className="text-xs">{l}</Label><Input type={type} value={v ?? ""} onChange={(e) => on(e.target.value)} /></div>
  );

  return (
    <PortalLayout requireTipo="candidato">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Ficha Cadastral</h1>
        <span className="text-xs px-2 py-1 rounded bg-muted">{status.toUpperCase()}</span>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <F l="Nome completo" v={dp.nome} on={(v: string) => setDp({ ...dp, nome: v })} />
              <F l="RG" v={dp.rg} on={(v: string) => setDp({ ...dp, rg: v })} />
              <F l="Órgão emissor" v={dp.orgao} on={(v: string) => setDp({ ...dp, orgao: v })} />
              <F l="Data de nascimento" type="date" v={dp.dataNasc} on={(v: string) => setDp({ ...dp, dataNasc: v })} />
              <F l="Sexo" v={dp.sexo} on={(v: string) => setDp({ ...dp, sexo: v })} />
              <F l="Estado civil" v={dp.estadoCivil} on={(v: string) => setDp({ ...dp, estadoCivil: v })} />
              <F l="Nacionalidade" v={dp.nacionalidade} on={(v: string) => setDp({ ...dp, nacionalidade: v })} />
              <F l="Naturalidade" v={dp.naturalidade} on={(v: string) => setDp({ ...dp, naturalidade: v })} />
              <F l="Nome da mãe" v={dp.nomeMae} on={(v: string) => setDp({ ...dp, nomeMae: v })} />
              <F l="Nome do pai" v={dp.nomePai} on={(v: string) => setDp({ ...dp, nomePai: v })} />
              <F l="Telefone/WhatsApp" v={dp.telefone} on={(v: string) => setDp({ ...dp, telefone: v })} />
              <F l="E-mail" v={dp.email} on={(v: string) => setDp({ ...dp, email: v })} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <F l="CEP" v={end.cep} on={(v: string) => setEnd({ ...end, cep: v })} />
              <F l="Logradouro" v={end.logradouro} on={(v: string) => setEnd({ ...end, logradouro: v })} />
              <F l="Número" v={end.numero} on={(v: string) => setEnd({ ...end, numero: v })} />
              <F l="Complemento" v={end.complemento} on={(v: string) => setEnd({ ...end, complemento: v })} />
              <F l="Bairro" v={end.bairro} on={(v: string) => setEnd({ ...end, bairro: v })} />
              <F l="Cidade" v={end.cidade} on={(v: string) => setEnd({ ...end, cidade: v })} />
              <F l="UF" v={end.uf} on={(v: string) => setEnd({ ...end, uf: v })} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Dados Bancários</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <F l="Banco" v={bc.banco} on={(v: string) => setBc({ ...bc, banco: v })} />
              <F l="Agência" v={bc.agencia} on={(v: string) => setBc({ ...bc, agencia: v })} />
              <F l="Conta" v={bc.conta} on={(v: string) => setBc({ ...bc, conta: v })} />
              <F l="Tipo de conta" v={bc.tipoConta} on={(v: string) => setBc({ ...bc, tipoConta: v })} />
              <F l="Chave PIX" v={bc.chavePix} on={(v: string) => setBc({ ...bc, chavePix: v })} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dependentes</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setDeps([...deps, { nome: "", parentesco: "", nascimento: "", cpf: "" }])}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {deps.map((d, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div className="md:col-span-2"><Label className="text-xs">Nome</Label><Input value={d.nome} onChange={(e) => { const n = [...deps]; n[i].nome = e.target.value; setDeps(n); }} /></div>
                  <div><Label className="text-xs">Parentesco</Label><Input value={d.parentesco} onChange={(e) => { const n = [...deps]; n[i].parentesco = e.target.value; setDeps(n); }} /></div>
                  <div><Label className="text-xs">Nascimento</Label><Input type="date" value={d.nascimento} onChange={(e) => { const n = [...deps]; n[i].nascimento = e.target.value; setDeps(n); }} /></div>
                  <div className="flex gap-2"><Input placeholder="CPF" value={d.cpf ?? ""} onChange={(e) => { const n = [...deps]; n[i].cpf = e.target.value; setDeps(n); }} /><Button size="icon" variant="ghost" onClick={() => setDeps(deps.filter((_, x) => x !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
                </div>
              ))}
              {deps.length === 0 && <p className="text-xs text-muted-foreground">Nenhum dependente.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contatos de Emergência</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setCes([...ces, { nome: "", parentesco: "", telefone: "" }])}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {ces.map((c, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                  <div><Label className="text-xs">Nome</Label><Input value={c.nome} onChange={(e) => { const n = [...ces]; n[i].nome = e.target.value; setCes(n); }} /></div>
                  <div><Label className="text-xs">Parentesco</Label><Input value={c.parentesco} onChange={(e) => { const n = [...ces]; n[i].parentesco = e.target.value; setCes(n); }} /></div>
                  <div><Label className="text-xs">Telefone</Label><Input value={c.telefone} onChange={(e) => { const n = [...ces]; n[i].telefone = e.target.value; setCes(n); }} /></div>
                  <div><Button size="icon" variant="ghost" onClick={() => setCes(ces.filter((_, x) => x !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
                </div>
              ))}
              {ces.length === 0 && <p className="text-xs text-muted-foreground">Nenhum contato.</p>}
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 sticky bottom-4">
            <Button variant="outline" onClick={() => salvar(false)} disabled={saving}>Salvar rascunho</Button>
            <Button onClick={() => salvar(true)} disabled={saving}>Enviar para o RH</Button>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
