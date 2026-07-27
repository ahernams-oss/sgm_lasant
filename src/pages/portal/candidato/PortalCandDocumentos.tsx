import { useEffect, useRef, useState } from "react";
import PortalLayout from "@/components/portal/PortalLayout";
import { portalCall, fileToBase64 } from "@/lib/portalClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const TIPOS = [
  "RG", "CPF", "CTPS", "Título de Eleitor", "Reservista", "Comprovante de Residência",
  "Comprovante Escolaridade", "Certidão de Nascimento/Casamento", "Foto 3x4", "Outros",
];

export default function PortalCandDocumentos() {
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tipo, setTipo] = useState("RG");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => portalCall<{ documentos: any[] }>("cand-doc-list").then((r) => setDocs(r.documentos));
  useEffect(() => { load().catch((e) => toast.error(e.message)); }, []);

  const enviar = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) return toast.error("Arquivo máximo 10MB.");
    setUploading(true);
    try {
      const b64 = await fileToBase64(file);
      await portalCall("cand-doc-upload", {
        tipo_documento: tipo, nome_arquivo: file.name, content_type: file.type, arquivo_base64: b64,
      });
      toast.success("Documento enviado.");
      await load();
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  return (
    <PortalLayout requireTipo="candidato">
      <h1 className="text-2xl font-semibold mb-4">Envio de Documentos</h1>
      <Card className="mb-4">
        <CardHeader><CardTitle>Enviar novo documento</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label>Tipo</Label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background">
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files && enviar(e.target.files[0])} />
            <Button disabled={uploading} onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-1" />{uploading ? "Enviando..." : "Selecionar"}</Button>
          </div>
          <p className="text-xs text-muted-foreground md:col-span-3">Formatos aceitos: PDF, JPG, PNG. Tamanho máximo 10MB.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Documentos enviados</CardTitle></CardHeader>
        <CardContent>
          {docs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum documento enviado.</p>}
          <div className="space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="text-sm font-medium">{d.tipo_documento}</div>
                  <div className="text-xs text-muted-foreground">{d.nome_arquivo} • {new Date(d.enviado_em).toLocaleString("pt-BR")}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${d.status === "aprovado" ? "bg-green-100 text-green-800" : d.status === "reprovado" ? "bg-red-100 text-red-800" : "bg-muted"}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
