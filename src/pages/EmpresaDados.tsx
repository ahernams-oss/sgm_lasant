import { useState, useEffect, useRef, useCallback } from "react";
import { useEmpresa, Empresa } from "@/contexts/EmpresaContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, Save, MapPin, Phone, Mail, Globe, Trash2, Landmark, MessageCircle, ShieldCheck, FileKey2, Eye, EyeOff } from "lucide-react";
import { usePermissao } from "@/hooks/usePermissao";


export default function EmpresaDados() {
  const { empresa, loading, saveEmpresa, uploadLogo, uploadCertificadoA1, removerCertificadoA1 } = useEmpresa();
  const { toast } = useToast();
  const { tem } = usePermissao();
  const podeEditar = tem("empresa.editar");
  const fileRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Empresa>(empresa);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "pending" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!loading && !dirtyRef.current) {
      setForm(empresa);
      initialLoadDone.current = true;
    }
  }, [empresa, loading]);

  const autoSave = useCallback(async (updatedForm: Empresa) => {
    if (!podeEditar) return;
    if (!updatedForm.razaoSocial?.trim()) return;
    setAutoSaveStatus("saving");
    try {
      await saveEmpresa(updatedForm);
      dirtyRef.current = false;
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch {
      setAutoSaveStatus("idle");
    }
  }, [saveEmpresa, podeEditar]);

  const update = (field: keyof Empresa, value: string) => {
    if (!podeEditar) return;
    dirtyRef.current = true;
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setAutoSaveStatus("pending");
      debounceRef.current = setTimeout(() => autoSave(next), 1500);
      return next;
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!podeEditar) { toast({ title: "Você não possui permissão para esta ação.", variant: "destructive" }); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione um arquivo de imagem", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      setForm(prev => ({ ...prev, logoUrl: url }));
      toast({ title: "Logo enviada com sucesso" });
    } catch {
      toast({ title: "Erro ao enviar logo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!podeEditar) { toast({ title: "Você não possui permissão para esta ação.", variant: "destructive" }); return; }
    if (!form.razaoSocial.trim()) {
      toast({ title: "Informe a Razão Social", variant: "destructive" });
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    try {
      await saveEmpresa(form);
      dirtyRef.current = false;
    } catch {
      toast({ title: "Erro ao salvar dados", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const buscarCep = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
          complemento: data.complemento || prev.complemento,
        }));
      }
    } catch { /* ignore */ }
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  const Field = ({ label, field, placeholder, icon: Icon }: {
    label: string; field: keyof Empresa; placeholder?: string; icon?: any;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />}
        <Input
          value={form[field] as string}
          onChange={e => update(field, e.target.value)}
          placeholder={placeholder}
          className={Icon ? "pl-9" : ""}
        />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Dados da Empresa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as informações da sua empresa que serão usadas em documentos e relatórios
          </p>
        </div>
        <div className="flex items-center gap-3">
          {autoSaveStatus === "pending" && (
            <span className="text-xs text-muted-foreground animate-pulse">Alterações pendentes...</span>
          )}
          {autoSaveStatus === "saving" && (
            <span className="text-xs text-muted-foreground animate-pulse">Salvando...</span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-xs text-primary">✓ Salvo</span>
          )}
          <Button onClick={handleSave} disabled={saving || !podeEditar} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Logo Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Logomarca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-40 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-1 opacity-40" />
                  <span className="text-xs">Sem logo</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Enviando..." : "Enviar Logo"}
              </Button>
              {form.logoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm(prev => ({ ...prev, logoUrl: "" }))}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos: PNG, JPG, SVG. Tamanho recomendado: 400x200px
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Razão Social *" field="razaoSocial" placeholder="Razão social da empresa" />
            <Field label="Nome Fantasia" field="nomeFantasia" placeholder="Nome fantasia" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="CNPJ" field="cnpj" placeholder="00.000.000/0000-00" />
            <Field label="Inscrição Estadual" field="inscricaoEstadual" placeholder="Inscrição estadual" />
            <Field label="Inscrição Municipal" field="inscricaoMunicipal" placeholder="Inscrição municipal" />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">CEP</Label>
              <Input
                value={form.cep}
                onChange={e => update("cep", e.target.value)}
                onBlur={buscarCep}
                placeholder="00000-000"
              />
            </div>
            <div className="md:col-span-2">
              <Field label="Logradouro" field="logradouro" placeholder="Rua, Av..." />
            </div>
            <Field label="Número" field="numero" placeholder="Nº" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Complemento" field="complemento" placeholder="Sala, andar..." />
            <Field label="Bairro" field="bairro" placeholder="Bairro" />
            <Field label="Cidade" field="cidade" placeholder="Cidade" />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">UF</Label>
              <Input
                value={form.uf}
                onChange={e => update("uf", e.target.value)}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4" /> Dados Bancários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Banco" field="banco" placeholder="Nome do banco" icon={Landmark} />
            <Field label="Agência" field="agencia" placeholder="0000" />
            <Field label="Conta" field="conta" placeholder="00000-0" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Tipo de Conta</Label>
              <select
                value={form.tipoConta}
                onChange={e => update("tipoConta", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione...</option>
                <option value="Corrente">Corrente</option>
                <option value="Poupança">Poupança</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Field label="Chave PIX" field="chavePix" placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" /> Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Telefone" field="telefone" placeholder="(00) 0000-0000" icon={Phone} />
            <Field label="Celular" field="celular" placeholder="(00) 00000-0000" icon={Phone} />
            <Field label="Contato" field="contato" placeholder="Nome do contato" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="E-mail" field="email" placeholder="email@empresa.com" icon={Mail} />
            <Field label="E-mail Compras" field="emailCompras" placeholder="compras@empresa.com" icon={Mail} />
            <Field label="Site" field="site" placeholder="www.empresa.com.br" icon={Globe} />
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="E-mail Envio RH" field="emailRh" placeholder="rh@empresa.com" icon={Mail} />
            <Field label="E-mail Envio Engenharia e Manutenção" field="emailEngenharia" placeholder="engenharia@empresa.com" icon={Mail} />
            <Field label="E-mail Envio Estoque" field="emailEstoque" placeholder="estoque@empresa.com" icon={Mail} />
            <Field label="E-mail Envio Relatórios" field="emailRelatorios" placeholder="relatorios@empresa.com" icon={Mail} />
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> WhatsApp para Disparos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Informe número (com DDI/DDD) ou string de grupo do WhatsApp para envio automático de mensagens.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="WhatsApp Compras" field="whatsappCompras" placeholder="55119... ou ID do grupo" icon={MessageCircle} />
            <Field label="WhatsApp RH" field="whatsappRh" placeholder="55119... ou ID do grupo" icon={MessageCircle} />
            <Field label="WhatsApp Engenharia e Manutenção" field="whatsappEngenharia" placeholder="55119... ou ID do grupo" icon={MessageCircle} />
            <Field label="WhatsApp Comercial" field="whatsappComercial" placeholder="55119... ou ID do grupo" icon={MessageCircle} />
            <Field label="WhatsApp Faturamento" field="whatsappFaturamento" placeholder="55119... ou ID do grupo" icon={MessageCircle} />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
