import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ContratoTerceiro } from "@/contexts/ContratosTerceirosContext";
import type { Empresa } from "@/contexts/EmpresaContext";

const DARK_BLUE: [number, number, number] = [30, 58, 107];

const fmtMoney = (n?: number) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s + (s.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("pt-BR");
};

const numeroAno = (numero?: number, createdAt?: string) => {
  const ano = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  return `${String(numero || 0).padStart(2, "0")}-${ano}`;
};

export async function gerarPdfContratoTerceiro(c: ContratoTerceiro, empresa?: Empresa) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ml = 14;

  // Header
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, pw, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", pw / 2, 12, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Nº ${numeroAno(c.numero, c.created_at)}`, pw / 2, 19, { align: "center" });

  doc.setTextColor(0, 0, 0);
  let y = 34;

  // Contratante / Contratada
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CONTRATANTE:", ml, y);
  doc.setFont("helvetica", "normal");
  doc.text((empresa as any)?.razaoSocial || (empresa as any)?.nomeFantasia || "—", ml + 32, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("CNPJ:", ml, y);
  doc.setFont("helvetica", "normal");
  doc.text(empresa?.cnpj || "—", ml + 32, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("CONTRATADA:", ml, y);
  doc.setFont("helvetica", "normal");
  doc.text(c.fornecedor_nome || "—", ml + 32, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("CNPJ/CPF:", ml, y);
  doc.setFont("helvetica", "normal");
  doc.text(c.fornecedor_cnpj || "—", ml + 32, y);
  y += 10;

  // Cliente / Obra
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE:", ml, y);
  doc.setFont("helvetica", "normal");
  doc.text(c.cliente_nome || "—", ml + 32, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("OBRA:", ml, y);
  doc.setFont("helvetica", "normal");
  doc.text(c.obra_nome || "—", ml + 32, y);
  y += 10;

  // Objeto
  doc.setFont("helvetica", "bold");
  doc.text("OBJETO:", ml, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const objetoLines = doc.splitTextToSize(c.objeto || "—", pw - ml * 2);
  doc.text(objetoLines, ml, y);
  y += objetoLines.length * 5 + 4;

  // Valor / Vigência
  autoTable(doc, {
    startY: y,
    head: [["Valor do Contrato", "Início da Vigência", "Fim da Vigência", "Status"]],
    body: [[
      fmtMoney(c.valor),
      fmtDate(c.data_inicio),
      fmtDate(c.data_fim),
      (c.status || "").toUpperCase(),
    ]],
    headStyles: { fillColor: DARK_BLUE, halign: "center" },
    bodyStyles: { halign: "center" },
    margin: { left: ml, right: ml },
    theme: "grid",
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Aditivos
  if (c.aditivos?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("ADITIVOS:", ml, y);
    y += 2;
    autoTable(doc, {
      startY: y + 2,
      head: [["Nº", "Data", "Tipo", "Valor Adic.", "Nova Vigência", "Descrição"]],
      body: c.aditivos.map((a) => [
        a.numero,
        fmtDate(a.data),
        a.tipo,
        a.valor_adicional ? fmtMoney(a.valor_adicional) : "—",
        fmtDate(a.nova_data_fim),
        a.descricao || "",
      ]),
      headStyles: { fillColor: DARK_BLUE },
      margin: { left: ml, right: ml },
      theme: "grid",
      styles: { fontSize: 8 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Observações
  if (c.observacoes) {
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVAÇÕES:", ml, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const obsLines = doc.splitTextToSize(c.observacoes, pw - ml * 2);
    doc.text(obsLines, ml, y);
    y += obsLines.length * 5 + 8;
  }

  // Assinaturas
  y = Math.max(y, doc.internal.pageSize.getHeight() - 50);
  doc.line(ml, y, ml + 70, y);
  doc.line(pw - ml - 70, y, pw - ml, y);
  doc.setFontSize(9);
  doc.text("CONTRATANTE", ml + 35, y + 5, { align: "center" });
  doc.text("CONTRATADA", pw - ml - 35, y + 5, { align: "center" });

  doc.save(`Contrato_${numeroAno(c.numero, c.created_at)}.pdf`);
}
