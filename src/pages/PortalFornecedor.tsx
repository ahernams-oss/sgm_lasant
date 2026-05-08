import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, FileText, ShoppingCart, AlertCircle, Building2, FileDown, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const STORAGE_KEY = "fornecedorPortalLogado";

interface FornecedorSession {
  id: string;
  nome: string;
  nomeFantasia?: string;
  email: string;
  cnpj?: string;
}

interface ConviteRow {
  id: string;
  token: string;
  cotacao_numero: number;
  comprador: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface PedidoRow {
  id: string;
  numero: number;
  data_criacao: string;
  comprador: string;
  status: string;
  valor_total: number;
  itens: any;
  condicao_pagamento: string;
  prazo_entrega: string;
  local_entrega: string;
  observacoes: string;
}

export default function PortalFornecedorPage() {
  const [session, setSession] = useState<FornecedorSession | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  if (!session) {
    return <LoginScreen onLogin={(s) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); setSession(s); }} />;
  }

  return (
    <Dashboard
      session={session}
      onLogout={() => { localStorage.removeItem(STORAGE_KEY); setSession(null); }}
    />
  );
}

function LoginScreen({ onLogin }: { onLogin: (s: FornecedorSession) => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: err } = await supabase.functions.invoke("fornecedor-login", {
        body: { email: email.trim().toLowerCase(), senha },
      });
      if (err || !data?.fornecedor) {
        setError(data?.error || "E-mail ou senha inválidos.");
        return;
      }
      onLogin(data.fornecedor);
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle>Portal do Fornecedor</CardTitle>
          <CardDescription>Acesse suas cotações e pedidos de compra</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive p-2 rounded text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              A senha é fornecida pelo comprador. Em caso de dúvidas, contate-nos.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Dashboard({ session, onLogout }: { session: FornecedorSession; onLogout: () => void }) {
  const [convites, setConvites] = useState<ConviteRow[]>([]);
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase
          .from("cotacao_convites")
          .select("id,token,cotacao_numero,comprador,status,expires_at,created_at")
          .eq("fornecedor_id", session.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("pedidos_compra")
          .select("id,numero,data_criacao,comprador,status,valor_total,itens,condicao_pagamento,prazo_entrega,local_entrega,observacoes")
          .eq("fornecedor_id", session.id)
          .order("created_at", { ascending: false }),
      ]);
      setConvites((c as any) || []);
      setPedidos((p as any) || []);
      setLoading(false);
    })();
  }, [session.id]);

  const pendentes = useMemo(
    () => convites.filter((c) => c.status === "pendente" && new Date(c.expires_at) > new Date()),
    [convites]
  );

  const fmtDate = (s: string) => {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("pt-BR");
  };
  const fmtMoney = (v: number) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusCotacao = (c: ConviteRow) => {
    if (c.status === "respondido") return "Respondida";
    if (new Date(c.expires_at) < new Date()) return "Expirada";
    return "Pendente";
  };

  const exportCotacoesPdf = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 58, 107);
    doc.rect(0, 0, pw, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text("Relatório de Cotações", 14, 11);
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(session.nome, 14, 18);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pw - 14, 18, { align: "right" });
    doc.setTextColor(30, 30, 30);
    autoTable(doc, {
      startY: 30,
      head: [["Cotação", "Comprador", "Recebida em", "Validade", "Status"]],
      body: convites.map((c) => [
        `COT-${String(c.cotacao_numero).padStart(4, "0")}`,
        c.comprador, fmtDate(c.created_at), fmtDate(c.expires_at), statusCotacao(c),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save(`cotacoes_${session.nome.replace(/\s+/g, "_")}.pdf`);
  };

  const exportCotacoesExcel = () => {
    const ws = XLSX.utils.json_to_sheet(convites.map((c) => ({
      "Cotação": `COT-${String(c.cotacao_numero).padStart(4, "0")}`,
      "Comprador": c.comprador,
      "Recebida em": fmtDate(c.created_at),
      "Validade": fmtDate(c.expires_at),
      "Status": statusCotacao(c),
    })));
    ws["!cols"] = [{ wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cotações");
    XLSX.writeFile(wb, `cotacoes_${session.nome.replace(/\s+/g, "_")}.xlsx`);
  };

  const exportPedidosPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pw = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 58, 107);
    doc.rect(0, 0, pw, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text("Relatório de Pedidos de Compra", 14, 11);
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(session.nome, 14, 18);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pw - 14, 18, { align: "right" });
    doc.setTextColor(30, 30, 30);
    autoTable(doc, {
      startY: 30,
      head: [["Pedido", "Data", "Comprador", "Status", "Pagamento", "Prazo", "Local", "Valor Total"]],
      body: pedidos.map((p) => [
        `PC-${String(p.numero).padStart(4, "0")}`,
        fmtDate(p.data_criacao), p.comprador, p.status,
        p.condicao_pagamento || "-", p.prazo_entrega || "-", p.local_entrega || "-",
        fmtMoney(p.valor_total),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 7: { halign: "right" } },
    });
    doc.save(`pedidos_${session.nome.replace(/\s+/g, "_")}.pdf`);
  };

  const exportPedidosExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsResumo = XLSX.utils.json_to_sheet(pedidos.map((p) => ({
      "Pedido": `PC-${String(p.numero).padStart(4, "0")}`,
      "Data": fmtDate(p.data_criacao),
      "Comprador": p.comprador,
      "Status": p.status,
      "Pagamento": p.condicao_pagamento || "",
      "Prazo": p.prazo_entrega || "",
      "Local": p.local_entrega || "",
      "Valor Total": Number(p.valor_total || 0),
    })));
    wsResumo["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 25 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, "Pedidos");

    const itens: any[] = [];
    pedidos.forEach((p) => {
      if (Array.isArray(p.itens)) {
        p.itens.forEach((it: any) => {
          itens.push({
            "Pedido": `PC-${String(p.numero).padStart(4, "0")}`,
            "Item": it.descricao,
            "Qtd": Number(it.quantidade || 0),
            "Unidade": it.unidadeMedida || it.unidade || "",
            "Preço Unit.": Number(it.precoUnitario || 0),
            "Total": Number(it.precoUnitario || 0) * Number(it.quantidade || 0),
          });
        });
      }
    });
    if (itens.length > 0) {
      const wsItens = XLSX.utils.json_to_sheet(itens);
      wsItens["!cols"] = [{ wch: 12 }, { wch: 40 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsItens, "Itens");
    }
    XLSX.writeFile(wb, `pedidos_${session.nome.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-7 w-7 text-primary" />
            <div>
              <h1 className="font-semibold text-base leading-tight">Portal do Fornecedor</h1>
              <p className="text-xs text-muted-foreground">{session.nome}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Cotações pendentes</p>
              <p className="text-3xl font-semibold text-primary">{pendentes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Total de cotações</p>
              <p className="text-3xl font-semibold">{convites.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Pedidos de compra</p>
              <p className="text-3xl font-semibold">{pedidos.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cotacoes">
          <TabsList>
            <TabsTrigger value="cotacoes">
              <FileText className="h-4 w-4 mr-2" /> Cotações
            </TabsTrigger>
            <TabsTrigger value="pedidos">
              <ShoppingCart className="h-4 w-4 mr-2" /> Pedidos de Compra
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cotacoes">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Cotações recebidas</CardTitle>
                  <CardDescription>Clique em "Responder" para enviar sua proposta.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={exportCotacoesExcel} disabled={convites.length === 0}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportCotacoesPdf} disabled={convites.length === 0}>
                    <FileDown className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : convites.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma cotação encontrada.</p>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cotação</TableHead>
                          <TableHead>Comprador</TableHead>
                          <TableHead>Recebida em</TableHead>
                          <TableHead>Validade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {convites.map((c) => {
                          const expirado = new Date(c.expires_at) < new Date();
                          const podeResponder = c.status === "pendente" && !expirado;
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">
                                COT-{String(c.cotacao_numero).padStart(4, "0")}
                              </TableCell>
                              <TableCell>{c.comprador}</TableCell>
                              <TableCell>{fmtDate(c.created_at)}</TableCell>
                              <TableCell>{fmtDate(c.expires_at)}</TableCell>
                              <TableCell>
                                {c.status === "respondido" ? (
                                  <Badge variant="secondary">Respondida</Badge>
                                ) : expirado ? (
                                  <Badge variant="outline">Expirada</Badge>
                                ) : (
                                  <Badge>Pendente</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {podeResponder ? (
                                  <Link to={`/cotacao/proposta/${c.token}`}>
                                    <Button size="sm">Responder</Button>
                                  </Link>
                                ) : (
                                  <Button size="sm" variant="ghost" disabled>—</Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pedidos">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-base">Pedidos de Compra emitidos</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={exportPedidosExcel} disabled={pedidos.length === 0}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportPedidosPdf} disabled={pedidos.length === 0}>
                    <FileDown className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : pedidos.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum pedido encontrado.</p>
                ) : (
                  <div className="space-y-4">
                    {pedidos.map((p) => (
                      <div key={p.id} className="border rounded-lg p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold">PC-{String(p.numero).padStart(4, "0")}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(p.data_criacao)} • {p.comprador}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{p.status}</Badge>
                            <span className="font-semibold text-primary">{fmtMoney(p.valor_total)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                          <div><strong>Pagamento:</strong> {p.condicao_pagamento || "-"}</div>
                          <div><strong>Prazo:</strong> {p.prazo_entrega || "-"}</div>
                          <div><strong>Local:</strong> {p.local_entrega || "-"}</div>
                        </div>
                        {Array.isArray(p.itens) && p.itens.length > 0 && (
                          <div className="border-t pt-2 mt-2">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead className="w-20 text-center">Qtd</TableHead>
                                  <TableHead className="w-16 text-center">Un</TableHead>
                                  <TableHead className="w-32 text-right">Preço</TableHead>
                                  <TableHead className="w-32 text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {p.itens.map((it: any, i: number) => (
                                  <TableRow key={i}>
                                    <TableCell className="text-sm">{it.descricao}</TableCell>
                                    <TableCell className="text-center">{it.quantidade}</TableCell>
                                    <TableCell className="text-center">{it.unidadeMedida || it.unidade}</TableCell>
                                    <TableCell className="text-right">{fmtMoney(Number(it.precoUnitario || 0))}</TableCell>
                                    <TableCell className="text-right">{fmtMoney(Number(it.precoUnitario || 0) * Number(it.quantidade || 0))}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        {p.observacoes && (
                          <p className="text-xs text-muted-foreground mt-2"><strong>Obs:</strong> {p.observacoes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
