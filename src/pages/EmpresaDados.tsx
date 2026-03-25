import { useState, useEffect, useRef } from "react";
import { useEmpresa, Empresa } from "@/contexts/EmpresaContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, Save, MapPin, Phone, Mail, Globe, Trash2 } from "lucide-react";

export default function EmpresaDados() {
  const { empresa, loading, saveEmpresa, uploadLogo } = useEmpresa();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Empresa>(empresa);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading) setForm(empresa);
  }, [empresa, loading]);

  const update = (field: keyof Empresa, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!form.razaoSocial.trim()) {
      toast({ title: "Informe a Razão Social", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await saveEmpresa(form);
      toast({ title: "Dados da empresa salvos com sucesso" });
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
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
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
        </CardContent>
      </Card>
    </div>
  );
}
