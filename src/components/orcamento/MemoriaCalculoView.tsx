import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Tipo = "area" | "mao_de_obra" | "unidade";

const UNIDADE_LABEL: Record<Tipo, string> = {
  area: "ÁREA (m²)",
  mao_de_obra: "TOTAL (h)",
  unidade: "QTD (un)",
};

/** Entradas (setores) de uma linha, com compatibilidade com o formato antigo. */
function getEntradas(l: any): any[] {
  if (Array.isArray(l?.entradas) && l.entradas.length) return l.entradas;
  return [{
    setor: l?.setor || "",
    funcionario: l?.funcionario,
    quantidade: l?.quantidade,
    comprimento: l?.comprimento,
    largura: l?.largura,
    hrDia: l?.hrDia,
    dias: l?.dias,
  }];
}

function calcEntrada(tipo: Tipo, e: any): number {
  if (tipo === "area") return (Number(e.quantidade) || 0) * (Number(e.comprimento) || 0) * (Number(e.largura) || 0);
  if (tipo === "mao_de_obra") return (Number(e.hrDia) || 0) * (Number(e.dias) || 0);
  return Number(e.quantidade) || 0;
}

function calcLinha(tipo: Tipo, l: any): number {
  return getEntradas(l).reduce((s, e) => s + calcEntrada(tipo, e), 0);
}

const nf = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MemoriaCalculoView({ grupos }: { grupos: any[] }) {
  const lista = Array.isArray(grupos) ? grupos : [];

  if (!lista.length) {
    return <p className="text-sm text-muted-foreground py-4">Nenhuma memória de cálculo cadastrada neste orçamento.</p>;
  }

  return (
    <div className="space-y-4">
      {lista.map((g: any, gi: number) => {
        const tipo: Tipo = (g.tipo || "unidade") as Tipo;
        const linhas: any[] = Array.isArray(g.linhas) ? g.linhas : [];
        const total = linhas.reduce((s, l) => s + calcLinha(tipo, l), 0);

        return (
          <div key={gi} className="border rounded-md overflow-x-auto">
            <div className="bg-muted px-3 py-2 text-xs font-semibold">
              {g.item ? `${g.item} - ` : ""}{g.titulo || "SEM TÍTULO"}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ITEM</TableHead>
                  <TableHead className="text-xs">CÓDIGO</TableHead>
                  <TableHead className="text-xs">DESCRIÇÃO</TableHead>
                  <TableHead className="text-xs">SETOR</TableHead>
                  {tipo === "area" && (
                    <>
                      <TableHead className="text-xs text-right">QTD</TableHead>
                      <TableHead className="text-xs text-right">COMP.</TableHead>
                      <TableHead className="text-xs text-right">LARG.</TableHead>
                    </>
                  )}
                  {tipo === "mao_de_obra" && (
                    <>
                      <TableHead className="text-xs text-right">HR/DIA</TableHead>
                      <TableHead className="text-xs text-right">DIAS</TableHead>
                    </>
                  )}
                  <TableHead className="text-xs text-right">{UNIDADE_LABEL[tipo]}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((l: any, li: number) => {
                  const entradas = getEntradas(l);
                  return entradas.map((e: any, ei: number) => (
                    <TableRow key={`${li}-${ei}`}>
                      {ei === 0 && (
                        <>
                          <TableCell rowSpan={entradas.length} className="text-xs align-top">{l.item || ""}</TableCell>
                          <TableCell rowSpan={entradas.length} className="text-xs font-mono align-top">{l.codigo || ""}</TableCell>
                          <TableCell rowSpan={entradas.length} className="text-xs align-top">{l.descricao || ""}</TableCell>
                        </>
                      )}
                      <TableCell className="text-xs">{e.setor || ""}</TableCell>
                      {tipo === "area" && (
                        <>
                          <TableCell className="text-xs text-right">{nf(Number(e.quantidade) || 0)}</TableCell>
                          <TableCell className="text-xs text-right">{nf(Number(e.comprimento) || 0)}</TableCell>
                          <TableCell className="text-xs text-right">{nf(Number(e.largura) || 0)}</TableCell>
                        </>
                      )}
                      {tipo === "mao_de_obra" && (
                        <>
                          <TableCell className="text-xs text-right">{nf(Number(e.hrDia) || 0)}</TableCell>
                          <TableCell className="text-xs text-right">{nf(Number(e.dias) || 0)}</TableCell>
                        </>
                      )}
                      <TableCell className="text-xs text-right font-medium">{nf(calcEntrada(tipo, e))}</TableCell>
                    </TableRow>
                  ));
                })}
                <TableRow>
                  <TableCell colSpan={tipo === "area" ? 7 : tipo === "mao_de_obra" ? 6 : 4} className="text-xs text-right font-semibold">
                    TOTAL
                  </TableCell>
                  <TableCell className="text-xs text-right font-bold">{nf(total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}
