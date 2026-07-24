import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { HardHat, Camera, CheckCircle2, Loader2 } from "lucide-react";

type Etapa = "identificar" | "capturar" | "revisar" | "concluido";

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
  const [selfies, setSelfies] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);

  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }, []);

  const addSelfie = (dataUrl: string) => setSelfies((prev) => (prev.length >= 2 ? prev : [...prev, dataUrl]));

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        const max = 800;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        addSelfie(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
    if (isMobile) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      setCameraAtiva(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      toast.error("Não foi possível acessar a câmera. Use o botão para enviar uma foto.");
      fileInputRef.current?.click();
    }
  };

  const capturar = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    canvas.getContext("2d")!.drawImage(v, 0, 0);
    addSelfie(canvas.toDataURL("image/jpeg", 0.85));
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setCameraAtiva(false);
  };

  const confirmar = async () => {
    if (selfies.length < 2) { toast.error("Capture as 2 selfies antes de confirmar."); return; }
    setLoading(true);
    try {
      await invoke("confirm", { selfieBase64: selfies[0], selfieBase64_2: selfies[1] });
      toast.success("Registro de EPIs realizado com sucesso!");
      setEtapa("concluido");
      setTimeout(() => {
        try { window.close(); } catch {}
        window.location.replace("about:blank");
      }, 3500);
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
                {cameraAtiva ? (
                  <video ref={videoRef} className="w-full h-full object-contain" muted playsInline />
                ) : selfies.length > 0 ? (
                  <img src={selfies[selfies.length - 1]} alt="Selfie" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-white/70 text-sm">Nenhuma foto capturada</div>
                )}
              </div>

              {selfies.length > 0 && (
                <div className="flex gap-2 justify-center">
                  {selfies.map((s, i) => (
                    <div key={i} className="relative">
                      <img src={s} alt={`Selfie ${i + 1}`} className="h-16 w-16 object-cover rounded border-2 border-green-500" />
                      <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{i + 1}</span>
                    </div>
                  ))}
                  {Array.from({ length: 2 - selfies.length }).map((_, i) => (
                    <div key={`p-${i}`} className="h-16 w-16 rounded border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-xs text-muted-foreground">
                      {selfies.length + i + 1}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                {selfies.length < 2
                  ? `Capture ${2 - selfies.length} foto${selfies.length === 1 ? "" : "s"} para confirmar (${selfies.length}/2)`
                  : "As 2 fotos foram capturadas. Confirme o recebimento."}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={onFileSelected}
              />

              <div className="flex gap-2">
                {selfies.length < 2 && !cameraAtiva && (
                  <Button type="button" className="w-full" onClick={iniciarCamera}>
                    <Camera className="h-4 w-4 mr-1" /> {isMobile ? `Tirar Foto ${selfies.length + 1}` : `Ligar Câmera (Foto ${selfies.length + 1})`}
                  </Button>
                )}
                {cameraAtiva && (
                  <Button type="button" className="w-full" onClick={capturar}>
                    Capturar Foto {selfies.length + 1}
                  </Button>
                )}
                {selfies.length >= 2 && (
                  <>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setSelfies([])}>Refazer</Button>
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
