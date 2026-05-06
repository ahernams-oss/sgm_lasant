import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function CatalogoSco() {
  const nav = useNavigate();
  const [tab, setTab] = useState("servicos");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const fmt = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    const t = setTimeout(async () => {
      const table = tab === "servicos" ? "sco_servicos" : "sco_elementares";
      let query = (supabase as any).from(table).select("*").limit(100);
      if (q.trim()) query = query.or(`codigo.ilike.%${q}%,descricao.ilike.%${q}%`);
      const { data } = await query;
      setRows(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q, tab]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => nav("/orcamentos")}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-serif font-bold">Catálogo SCO</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consulta de preços</CardTitle>
          <Input className="max-w-md mt-2" placeholder="Buscar por código ou descrição..." value={q} onChange={(e) => setQ(e.target.value)} />
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList><TabsTrigger value="servicos">Serviços</TabsTrigger><TabsTrigger value="elementares">Elementares</TabsTrigger></TabsList>
            <TabsContent value={tab}>
              <Table>
                <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Un</TableHead><TableHead className="text-right">Preço</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhum resultado</TableCell></TableRow>}
                  {rows.map((r) => (
                    <TableRow key={r.codigo}>
                      <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                      <TableCell className="text-xs">{r.descricao}</TableCell>
                      <TableCell>{r.unidade}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(Number(r.preco))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">Mostrando até 100 resultados. Refine a busca para ver mais.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
