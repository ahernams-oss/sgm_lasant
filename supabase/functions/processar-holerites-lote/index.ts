// Recebe PDF consolidado de holerites (base64), quebra por página,
// usa IA para extrair CPF/nome/tipo/valor e casa com funcionários.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

async function extractComIA(pdfBase64: string, mes: number, ano: number) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const prompt = `Este é um holerite (contracheque) de UM único funcionário referente à competência ${mes.toString().padStart(2, "0")}/${ano}.
Extraia estas informações e retorne APENAS um JSON válido, sem markdown:
{"cpf":"somente dígitos","nome":"nome completo","tipo":"folha|13o|ferias|rescisao|outros","valor_liquido": numero_decimal}

Regras:
- Se o documento mencionar "Rescisão" ou "TRCT" → tipo "rescisao".
- Se mencionar "13º", "Décimo Terceiro" ou "Gratificação Natalina" → tipo "13o".
- Se mencionar "Férias" (recibo de férias) → tipo "ferias".
- Caso contrário → tipo "folha".
- valor_liquido é o LÍQUIDO A RECEBER (valor final que o funcionário recebe).
- Se não encontrar algum campo, use null.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } },
        ],
      }],
      temperature: 0,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("IA err:", resp.status, t);
    return { cpf: null, nome: null, tipo: "folha", valor_liquido: null };
  }
  const data = await resp.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) return { cpf: null, nome: null, tipo: "folha", valor_liquido: null };
  try {
    const parsed = JSON.parse(m[0]);
    return {
      cpf: parsed.cpf ? onlyDigits(String(parsed.cpf)) : null,
      nome: parsed.nome ?? null,
      tipo: ["folha", "13o", "ferias", "rescisao", "outros"].includes(parsed.tipo) ? parsed.tipo : "folha",
      valor_liquido: parsed.valor_liquido != null ? Number(parsed.valor_liquido) : null,
    };
  } catch {
    return { cpf: null, nome: null, tipo: "folha", valor_liquido: null };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pdfBase64, arquivo_nome, competencia_mes, competencia_ano, importado_por, importado_por_nome } = await req.json();
    if (!pdfBase64 || !competencia_mes || !competencia_ano) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios ausentes." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Decode PDF
    const bin = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    const srcDoc = await PDFDocument.load(bin);
    const totalPages = srcDoc.getPageCount();

    // Cria lote
    const { data: lote, error: loteErr } = await supabase
      .from("portal_holerites_import_lote")
      .insert({
        arquivo_nome, competencia_mes, competencia_ano,
        total_paginas: totalPages, status: "conferencia",
        importado_por, importado_por_nome,
      })
      .select("id").single();
    if (loteErr) throw loteErr;

    // Carrega funcionarios (para matching)
    const { data: funcs } = await supabase
      .from("funcionarios")
      .select("id, nome, cpf, status")
      .in("status", ["Ativo", "ativo", "ATIVO"]);
    const byCpf = new Map<string, any[]>();
    (funcs || []).forEach((f: any) => {
      const c = onlyDigits(f.cpf || "");
      if (!c) return;
      const arr = byCpf.get(c) || [];
      arr.push(f);
      byCpf.set(c, arr);
    });

    // Processa cada página
    const items: any[] = [];
    for (let i = 0; i < totalPages; i++) {
      const singleDoc = await PDFDocument.create();
      const [pg] = await singleDoc.copyPages(srcDoc, [i]);
      singleDoc.addPage(pg);
      const bytes = await singleDoc.save();
      const b64 = btoa(String.fromCharCode(...bytes));

      const extracted = await extractComIA(b64, competencia_mes, competencia_ano);

      let funcionario_id: string | null = null;
      let status_match = "nao_encontrado";
      if (extracted.cpf) {
        const matches = byCpf.get(extracted.cpf) || [];
        if (matches.length === 1) { funcionario_id = matches[0].id; status_match = "auto"; }
        else if (matches.length > 1) { status_match = "ambiguo"; }
      }

      items.push({
        lote_id: lote.id, pagina: i + 1,
        cpf_detectado: extracted.cpf, nome_detectado: extracted.nome,
        funcionario_id, tipo: extracted.tipo, valor_liquido: extracted.valor_liquido,
        status_match, pdf_pagina_base64: b64,
      });
    }

    // Insere em batches
    const chunk = 20;
    for (let i = 0; i < items.length; i += chunk) {
      const { error: itErr } = await supabase.from("portal_holerites_import_item").insert(items.slice(i, i + chunk));
      if (itErr) throw itErr;
    }

    return new Response(JSON.stringify({ lote_id: lote.id, total: totalPages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
