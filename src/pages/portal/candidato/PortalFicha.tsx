import { useEffect, useState } from "react";
import PortalLayout from "@/components/portal/PortalLayout";
import { portalCall } from "@/lib/portalClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { isValidCPF, maskCPF, onlyDigits } from "@/lib/validators";
import RadioGroupCustom from "@/components/RadioGroupCustom";

const UF_OPTIONS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

interface Dep { nome: string; parentesco: string; nascimento: string; cpf?: string; }
interface Contato { nome: string; parentesco: string; telefone: string; }

const F = ({ l, v, on, type = "text" }: any) => (
  <div><Label className="text-xs">{l}</Label><Input type={type} value={v ?? ""} onChange={(e) => on(e.target.value)} /></div>
);

export default function PortalFicha() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("rascunho");

  const [dp, setDp] = useState<any>({ nome: "", dataNasc: "", sexo: "", estadoCivil: "", nacionalidade: "Brasileira", naturalidade: "", nomeMae: "", nomePai: "", telefone: "", email: "", escolaridade: "", cursoFormacao: "", foto: "" });
  const [docs, setDocs] = useState<any>({
    cpf: "", rgNumero: "", rgOrgao: "", rgUf: "", rgEmissao: "",
    ctpsNumero: "", ctpsSerie: "", ctpsUf: "", ctpsEmissao: "",
    pisPasep: "", tituloEleitor: "", tituloZona: "", tituloSecao: "",
    cnhNumero: "", cnhCategoria: "", cnhValidade: "", cnhPrimeira: "",
    reservistaNumero: "", reservistaCategoria: "",
    passaporteNumero: "", passaporteValidade: "",
    certidaoNumero: "", certidaoTipo: "", certidaoEmissao: "",
  });
  const [end, setEnd] = useState<any>({ cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" });
  const [bc, setBc] = useState<any>({ banco: "", agencia: "", conta: "", tipoConta: "", chavePix: "" });
  const [deps, setDeps] = useState<Dep[]>([]);
  const [ces, setCes] = useState<Contato[]>([]);

  useEffect(() => {
    portalCall<{ ficha: any; prefill?: { nome?: string; cpf?: string; dataNascimento?: string } }>("cand-ficha-get").then(({ ficha, prefill }) => {
      const pf = prefill || {};
      const cpfMasked = pf.cpf ? maskCPF(pf.cpf) : "";
      if (ficha) {
        const { documentos, ...rest } = (ficha.dados_pessoais || {});
        const migrated = { escolaridade: documentos?.escolaridade ?? rest.escolaridade ?? "", cursoFormacao: documentos?.cursoFormacao ?? rest.cursoFormacao ?? "" };
        setDp({
          ...dp,
          ...rest,
          ...migrated,
          nome: rest.nome || pf.nome || "",
          dataNasc: rest.dataNasc || pf.dataNascimento || "",
        });
        const { escolaridade, cursoFormacao, ...restDocs } = documentos || {};
        setDocs({ ...docs, ...restDocs, cpf: restDocs?.cpf || cpfMasked });
        setEnd({ ...end, ...(ficha.endereco || {}) });
        setBc({ ...bc, ...(ficha.bancarios || {}) });
        setDeps(ficha.dependentes || []); setCes(ficha.contatos_emergencia || []);
        setStatus(ficha.status || "rascunho");
      } else {
        // Primeiro acesso: pré-preenche a partir do cadastro do candidato
        setDp({ ...dp, nome: pf.nome || "", dataNasc: pf.dataNascimento || "" });
        setDocs({ ...docs, cpf: cpfMasked });
      }
    }).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const cpfInvalido = docs.cpf && !isValidCPF(docs.cpf);
  const depsCpfInvalidos = deps.some((d) => d.cpf && !isValidCPF(d.cpf));

  const salvar = async (enviar = false) => {
    if (enviar) {
      if (!docs.cpf || !isValidCPF(docs.cpf)) {
        toast.error("Informe um CPF válido antes de enviar.");
        return;
      }
      if (depsCpfInvalidos) {
        toast.error("Há CPF de dependente inválido.");
        return;
      }
    }
    setSaving(true);
    try {
      await portalCall("cand-ficha-save", { dados_pessoais: { ...dp, documentos: docs }, endereco: end, bancarios: bc, dependentes: deps, contatos_emergencia: ces, enviar });
      toast.success(enviar ? "Ficha enviada para análise do RH." : "Rascunho salvo.");
      if (enviar) setStatus("enviada");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };




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
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-48 flex-shrink-0 flex flex-col items-center gap-2">
                  <Label className="text-xs self-start">Foto</Label>
                  <div className="w-40 h-52 border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                    {dp.foto ? (
                      <img src={dp.foto} alt="Foto do candidato" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground text-center px-2">Sem foto</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <input
                      id="foto-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 3 * 1024 * 1024) { toast.error("Imagem deve ter até 3MB."); return; }
                        const r = new FileReader();
                        r.onload = () => setDp({ ...dp, foto: r.result as string });
                        r.readAsDataURL(f);
                      }}
                    />
                    <input
                      id="foto-camera"
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 3 * 1024 * 1024) { toast.error("Imagem deve ter até 3MB."); return; }
                        const r = new FileReader();
                        r.onload = () => setDp({ ...dp, foto: r.result as string });
                        r.readAsDataURL(f);
                      }}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById("foto-upload")?.click()}>Enviar arquivo</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById("foto-camera")?.click()}>Tirar foto</Button>
                    {dp.foto && (
                      <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => setDp({ ...dp, foto: "" })}>Remover</Button>
                    )}
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <F l="Nome completo" v={dp.nome} on={(v: string) => setDp({ ...dp, nome: v })} />
                  <F l="Data de nascimento" type="date" v={dp.dataNasc} on={(v: string) => setDp({ ...dp, dataNasc: v })} />
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Sexo</Label>
                    <RadioGroupCustom
                      options={["Feminino", "Masculino"]}
                      selected={dp.sexo || ""}
                      onChange={(v) => setDp({ ...dp, sexo: v })}
                      columns={2}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Estado civil</Label>
                    <Select value={dp.estadoCivil || ""} onValueChange={(v) => setDp({ ...dp, estadoCivil: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Solteiro(a)", "Casado(a)", "Separado(a) Judicialmente", "Divorciado(a)", "Viúvo(a)"].map((op) => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <F l="Nacionalidade" v={dp.nacionalidade} on={(v: string) => setDp({ ...dp, nacionalidade: v })} />
                  <F l="Naturalidade" v={dp.naturalidade} on={(v: string) => setDp({ ...dp, naturalidade: v })} />
                  <F l="Nome da mãe" v={dp.nomeMae} on={(v: string) => setDp({ ...dp, nomeMae: v })} />
                  <F l="Nome do pai" v={dp.nomePai} on={(v: string) => setDp({ ...dp, nomePai: v })} />
                  <F l="Telefone/WhatsApp" v={dp.telefone} on={(v: string) => setDp({ ...dp, telefone: v })} />
                  <F l="E-mail" v={dp.email} on={(v: string) => setDp({ ...dp, email: v })} />
                  <F l="Escolaridade" v={dp.escolaridade} on={(v: string) => setDp({ ...dp, escolaridade: v })} />
                  <F l="Curso / Formação" v={dp.cursoFormacao} on={(v: string) => setDp({ ...dp, cursoFormacao: v })} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Documentos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Identificação</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">CPF</Label>
                    <Input
                      value={docs.cpf ?? ""}
                      onChange={(e) => setDocs({ ...docs, cpf: maskCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      maxLength={14}
                      className={cpfInvalido ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {cpfInvalido && <p className="text-[11px] text-destructive mt-1">CPF inválido</p>}
                    {docs.cpf && !cpfInvalido && onlyDigits(docs.cpf).length === 11 && (
                      <p className="text-[11px] text-emerald-600 mt-1">CPF válido</p>
                    )}
                  </div>
                  <F l="RG - Número" v={docs.rgNumero} on={(v: string) => setDocs({ ...docs, rgNumero: v })} />
                  <F l="RG - Órgão emissor" v={docs.rgOrgao} on={(v: string) => setDocs({ ...docs, rgOrgao: v })} />
                  <div>
                    <Label className="text-xs">RG - UF</Label>
                    <Select value={docs.rgUf || ""} onValueChange={(v) => setDocs({ ...docs, rgUf: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {UF_OPTIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <F l="RG - Data de emissão" type="date" v={docs.rgEmissao} on={(v: string) => setDocs({ ...docs, rgEmissao: v })} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Carteira de Trabalho (CTPS)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <F l="Número" v={docs.ctpsNumero} on={(v: string) => setDocs({ ...docs, ctpsNumero: v })} />
                  <F l="Série" v={docs.ctpsSerie} on={(v: string) => setDocs({ ...docs, ctpsSerie: v })} />
                  <F l="UF" v={docs.ctpsUf} on={(v: string) => setDocs({ ...docs, ctpsUf: v })} />
                  <F l="Data de emissão" type="date" v={docs.ctpsEmissao} on={(v: string) => setDocs({ ...docs, ctpsEmissao: v })} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">PIS / Título de Eleitor</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <F l="PIS/PASEP" v={docs.pisPasep} on={(v: string) => setDocs({ ...docs, pisPasep: v })} />
                  <F l="Título de Eleitor" v={docs.tituloEleitor} on={(v: string) => setDocs({ ...docs, tituloEleitor: v })} />
                  <F l="Zona" v={docs.tituloZona} on={(v: string) => setDocs({ ...docs, tituloZona: v })} />
                  <F l="Seção" v={docs.tituloSecao} on={(v: string) => setDocs({ ...docs, tituloSecao: v })} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">CNH</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <F l="Número" v={docs.cnhNumero} on={(v: string) => setDocs({ ...docs, cnhNumero: v })} />
                  <F l="Categoria" v={docs.cnhCategoria} on={(v: string) => setDocs({ ...docs, cnhCategoria: v })} />
                  <F l="Validade" type="date" v={docs.cnhValidade} on={(v: string) => setDocs({ ...docs, cnhValidade: v })} />
                  <F l="1ª Habilitação" type="date" v={docs.cnhPrimeira} on={(v: string) => setDocs({ ...docs, cnhPrimeira: v })} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Reservista / Passaporte</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <F l="Reservista - Número" v={docs.reservistaNumero} on={(v: string) => setDocs({ ...docs, reservistaNumero: v })} />
                  <F l="Reservista - Categoria" v={docs.reservistaCategoria} on={(v: string) => setDocs({ ...docs, reservistaCategoria: v })} />
                  <F l="Passaporte - Número" v={docs.passaporteNumero} on={(v: string) => setDocs({ ...docs, passaporteNumero: v })} />
                  <F l="Passaporte - Validade" type="date" v={docs.passaporteValidade} on={(v: string) => setDocs({ ...docs, passaporteValidade: v })} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Certidão</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <F l="Certidão - Tipo (Nasc./Casamento)" v={docs.certidaoTipo} on={(v: string) => setDocs({ ...docs, certidaoTipo: v })} />
                  <F l="Certidão - Número/Matrícula" v={docs.certidaoNumero} on={(v: string) => setDocs({ ...docs, certidaoNumero: v })} />
                  <F l="Certidão - Data de emissão" type="date" v={docs.certidaoEmissao} on={(v: string) => setDocs({ ...docs, certidaoEmissao: v })} />
                </div>
              </div>
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
                  <div className="flex gap-2">
                    <Input
                      placeholder="CPF"
                      value={d.cpf ?? ""}
                      inputMode="numeric"
                      maxLength={14}
                      onChange={(e) => { const n = [...deps]; n[i].cpf = maskCPF(e.target.value); setDeps(n); }}
                      className={d.cpf && !isValidCPF(d.cpf) ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    <Button size="icon" variant="ghost" onClick={() => setDeps(deps.filter((_, x) => x !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
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
