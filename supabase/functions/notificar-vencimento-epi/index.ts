import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Today (BRT) as YYYY-MM-DD
function brtToday(): { dateStr: string; hour: number; minute: number } {
  const now = new Date();
  // BRT = UTC-3 (sem DST atualmente)
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const y = brt.getUTCFullYear();
  const m = String(brt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(brt.getUTCDate()).padStart(2, "0");
  return { dateStr: `${y}-${m}-${d}`, hour: brt.getUTCHours(), minute: brt.getUTCMinutes() };
}

function daysBetween(fromStr: string, toStr: string): number {
  const a = new Date(fromStr + "T00:00:00Z").getTime();
  const b = new Date(toStr + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { dateStr: today, hour, minute } = brtToday();

    // Slot atual (com tolerância de 15min)
    const slot = (() => {
      const hm = hour * 60 + minute;
      const slots = [
        { name: "09:00", min: 9 * 60 },
        { name: "11:30", min: 11 * 60 + 30 },
        { name: "13:30", min: 13 * 60 + 30 },
        { name: "15:00", min: 15 * 60 },
        { name: "17:00", min: 17 * 60 },
      ];
      return slots.find((s) => Math.abs(hm - s.min) <= 15)?.name || null;
    })();

    if (!slot) {
      return new Response(JSON.stringify({ skipped: true, reason: "fora dos slots", hour, minute }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RH WhatsApp
    const { data: empresa } = await supabase
      .from("empresa")
      .select("whatsapp_rh")
      .limit(1)
      .maybeSingle();
    const rh = (empresa?.whatsapp_rh || "").trim();
    if (!rh) {
      return new Response(JSON.stringify({ skipped: true, reason: "sem whatsapp RH" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: funcionarios } = await supabase
      .from("funcionarios")
      .select("nome, epis");

    const avisos: { funcionario: string; epi: string; dias: number; vencimento: string }[] = [];
    for (const f of (funcionarios || []) as any[]) {
      const epis = (f.epis as any[]) || [];
      for (const epi of epis) {
        if (!epi?.dataVencimento) continue;
        const dias = daysBetween(today, epi.dataVencimento);
        // 45, 30, 20: apenas no slot 09:00
        const isMarco = (dias === 45 || dias === 30 || dias === 20) && slot === "09:00";
        // 1..10 dias: todos os 5 slots
        const isReta = dias >= 1 && dias <= 10;
        // No dia do vencimento (0): aviso 09:00
        const isHoje = dias === 0 && slot === "09:00";
        if (isMarco || isReta || isHoje) {
          avisos.push({
            funcionario: f.nome,
            epi: epi.descricao,
            dias,
            vencimento: epi.dataVencimento.split("-").reverse().join("/"),
          });
        }
      }
    }

    if (avisos.length === 0) {
      return new Response(JSON.stringify({ sent: 0, slot }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Monta mensagem agregada
    const linhas = avisos.map(
      (a) =>
        `• *${a.funcionario}* — ${a.epi} — vence em *${a.dias}* dia(s) (${a.vencimento})`
    );
    const mensagem =
      `⚠️ *Vencimento de EPIs*\n` +
      `_Aviso automático (${slot})_\n\n` +
      linhas.join("\n") +
      `\n\nProvidencie a renovação/substituição.`;

    // Envia via send-whatsapp
    await supabase.functions.invoke("send-whatsapp", {
      body: { telefone: rh, mensagem },
    });

    return new Response(JSON.stringify({ sent: avisos.length, slot, avisos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("notificar-vencimento-epi", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
