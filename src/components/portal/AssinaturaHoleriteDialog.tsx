import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eraser, PenLine } from "lucide-react";
import { portalCall } from "@/lib/portalClient";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  holeriteId: string | null;
  competencia?: string;
  onAssinado: (id: string, assinadoEm: string) => void;
}

export default function AssinaturaHoleriteDialog({ open, onOpenChange, holeriteId, competencia, onAssinado }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const desenhando = useRef(false);
  const [temTraco, setTemTraco] = useState(false);
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  const ctx = () => {
    const c = canvasRef.current;
    if (!c) return null;
    const g = c.getContext("2d");
    if (g) {
      g.lineWidth = 2;
      g.lineCap = "round";
      g.strokeStyle = "#111827";
    }
    return g;
  };

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const g = ctx();
    if (!g) return;
    desenhando.current = true;
    const p = pos(e);
    g.beginPath();
    g.moveTo(p.x, p.y);
    setTemTraco(true);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhando.current) return;
    const g = ctx();
    if (!g) return;
    const p = pos(e);
    g.lineTo(p.x, p.y);
    g.stroke();
  };
  const end = () => { desenhando.current = false; };

  const limpar = () => {
    const c = canvasRef.current;
    const g = c?.getContext("2d");
    if (c && g) g.clearRect(0, 0, c.width, c.height);
    setTemTraco(false);
  };

  const confirmar = async () => {
    if (!holeriteId) return;
    if (!temTraco) { toast.error("Desenhe sua assinatura no quadro."); return; }
    if (senha.length < 4) { toast.error("Informe sua senha do portal."); return; }
    setSalvando(true);
    try {
      const assinatura = canvasRef.current!.toDataURL("image/png");
      const r = await portalCall<{ assinado_em: string }>("assinar-holerite", { id: holeriteId, senha, assinatura });
      toast.success("Holerite assinado com sucesso.");
      onAssinado(holeriteId, r.assinado_em);
      onOpenChange(false);
      setSenha("");
      limpar();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSenha(""); limpar(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PenLine className="w-4 h-4" /> Assinar holerite</DialogTitle>
          <DialogDescription>
            {competencia ? `Competência ${competencia}. ` : ""}
            Declaro ter recebido a importância líquida discriminada neste recibo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1 block">Assinatura</Label>
            <canvas
              ref={canvasRef}
              width={600}
              height={220}
              className="w-full h-40 rounded-md border bg-background touch-none"
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
            />
            <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={limpar}>
              <Eraser className="w-4 h-4 mr-1" /> Limpar
            </Button>
          </div>
          <div>
            <Label htmlFor="senha-assinatura">Confirme sua senha do portal</Label>
            <Input id="senha-assinatura" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={confirmar} disabled={salvando}>
            {salvando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Assinar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
