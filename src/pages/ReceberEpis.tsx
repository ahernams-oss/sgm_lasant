import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { HardHat, Camera, CheckCircle2, Loader2 } from "lucide-react";

type Etapa = "identificar" | "capturar" | "concluido";

interface EpiInfo {
  id: string;
  descricao: string;
  ca?: string;
  quantidade?: number;
}

export default function ReceberEpis() {
  const { token } = useParams();
  const [etapa, setEtapa] = useState<Etapa>("identificar");
  const [cpf, setCpf] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [funcionarioNome, setFuncionarioNome] = useState("");
  const [epis, setEpis] = useState<EpiInfo[]>([]);
  const [selfie, setSelfie] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);

  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }, []);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      // Redimensiona para no máx 800px para reduzir upload
      const img = new Image();
      img.onload = () => {
        const max = 800;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        setSelfie(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const invoke = async (action: "verify" | "confirm", body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("epi-recebimento-publico", {
      body: { action, token, cpf, dataNascimento: dob, ...body },
    });
    if (error) throw new Error((data as any)?.error || error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf || !dob) { toast.error("Informe CPF e data de nascimento."); return; }
    setLoading(true);
    try {
      const r = await invoke("verify", {});
      setFuncionarioNome(r.funcionario?.nome || "");
      setEpis(r.epis || []);
      setEtapa("capturar");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      toast.error("Não foi possível acessar a câmera.");
    }
  };

  const capturar = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    canvas.getContext("2d")!.drawImage(v, 0, 0);
    const b64 = canvas.toDataURL("image/jpeg", 0.85);
    setSelfie(b64);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  };

  const confirmar = async () => {
    if (!selfie) return;
    setLoading(true);
    try {
      await invoke("confirm", { selfieBase64: selfie });
      setEtapa("concluido");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4">
      <Card className="w-full max-w-lg mt-8 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <HardHat className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>Confirmação de Recebimento de EPIs</CardTitle>
        </CardHeader>
        <CardContent>
          {etapa === "identificar" && (
            <form className="space-y-4" onSubmit={verify}>
              <p className="text-sm text-muted-foreground">Para sua segurança, confirme seus dados.</p>
              <div>
                <Label>CPF</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="Somente números" required />
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
              </Button>
            </form>
          )}

          {etapa === "capturar" && (
            <div className="space-y-4">
              <div>
                <p className="text-sm">Olá, <strong>{funcionarioNome}</strong>.</p>
                <p className="text-sm text-muted-foreground">Você está confirmando o recebimento dos seguintes EPIs:</p>
                <ul className="mt-2 border rounded-md divide-y">
                  {epis.map((e) => (
                    <li key={e.id} className="p-2 text-sm">
                      <div className="font-medium">{e.descricao}</div>
                      <div className="text-xs text-muted-foreground">Qtd: {e.quantidade || 1} {e.ca ? `· CA ${e.ca}` : ""}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-md border overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
                {selfie ? (
                  <img src={selfie} alt="Selfie" className="w-full h-full object-contain" />
                ) : (
                  <video ref={videoRef} className="w-full h-full object-contain" muted playsInline />
                )}
              </div>

              <div className="flex gap-2">
                {!selfie && !streamRef.current && (
                  <Button type="button" className="w-full" onClick={iniciarCamera}>
                    <Camera className="h-4 w-4 mr-1" /> Ligar Câmera
                  </Button>
                )}
                {!selfie && streamRef.current && (
                  <Button type="button" className="w-full" onClick={capturar}>Capturar Selfie</Button>
                )}
                {selfie && (
                  <>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => { setSelfie(null); iniciarCamera(); }}>Refazer</Button>
                    <Button type="button" className="flex-1" onClick={confirmar} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Recebimento"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {etapa === "concluido" && (
            <div className="text-center py-6 space-y-2">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <p className="font-medium">Recebimento confirmado!</p>
              <p className="text-sm text-muted-foreground">Obrigado, {funcionarioNome}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
