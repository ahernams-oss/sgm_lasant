import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const URL_HOM = "https://homologacao.focusnfe.com.br";
const URL_PROD = "https://api.focusnfe.com.br";
const digitsOnly = (s: string) => (s || "").replace(/\D+/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { empresaId, baixarXml = true, dataInicial, dataFinal } = await req.json().catch(() => ({}));
    if (!empresaId) return json({ ok: false, error: "empresaId obrigatório" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: emp, error: empErr } = await admin
      .from("empresa").select("cnpj, nfe_ambiente").eq("id", empresaId).maybeSingle();
    if (empErr || !emp) return json({ ok: false, error: "Empresa não encontrada" }, 404);

    const cnpj = digitsOnly(emp.cnpj || "");
    if (cnpj.length !== 14) return json({ ok: false, error: "CNPJ inválido" }, 400);

    const ambiente = String(emp.nfe_ambiente || "homologacao").toLowerCase();
    const baseUrl = ambiente === "producao" ? URL_PROD : URL_HOM;
    const tokenName = ambiente === "producao" ? "FOCUS_NFE_TOKEN_PRODUCAO" : "FOCUS_NFE_TOKEN_HOMOLOGACAO";
    const token = Deno.env.get(tokenName);
    if (!token) return json({ ok: false, error: `Token ${tokenName} não configurado` }, 400);
    const auth = "Basic " + btoa(`${token}:`);

    // Lista NFes recebidas
    const params = new URLSearchParams({ cnpj });
    if (dataInicial) params.set("data_inicial", String(dataInicial));
    if (dataFinal) params.set("data_final", String(dataFinal));
    const listUrl = `${baseUrl}/v2/nfes_recebidas?${params.toString()}`;
    const lst = await fetch(listUrl, { headers: { Authorization: auth, Accept: "application/json" } });
    const lstText = await lst.text();
    let arr: any[] = [];
    try { const j = JSON.parse(lstText); arr = Array.isArray(j) ? j : []; } catch {}
    if (!lst.ok) return json({ ok: false, httpStatus: lst.status, error: lstText.slice(0, 500) }, 502);

    let inseridas = 0, atualizadas = 0, comXml = 0, erros = 0;

    for (const n of arr) {
      const chave = n.chave_nfe || n.chave || n.chNFe;
      if (!chave) continue;

      let xmlPath: string | null = null;
      if (baixarXml && (n.caminho_xml_nota_fiscal || n.caminho_xml || true)) {
        try {
          const xmlPathApi = n.caminho_xml_nota_fiscal || `/v2/nfes_recebidas/${chave}.xml`;
          const xmlUrl = xmlPathApi.startsWith("http") ? xmlPathApi : `${baseUrl}${xmlPathApi}`;
          const xr = await fetch(xmlUrl, { headers: { Authorization: auth } });
          if (xr.ok) {
            const xmlBuf = new Uint8Array(await xr.arrayBuffer());
            const path = `${empresaId}/${chave}.xml`;
            const up = await admin.storage.from("nfes-xml").upload(path, xmlBuf, {
              upsert: true, contentType: "application/xml",
            });
            if (!up.error) { xmlPath = path; comXml++; }
          }
        } catch { erros++; }
      }

      const row = {
        empresa_id: empresaId,
        chave,
        numero: String(n.numero ?? n.nNF ?? ""),
        serie: String(n.serie ?? n.serie_nfe ?? ""),
        emitente_cnpj: digitsOnly(n.cnpj_emitente || n.emitente_cnpj || ""),
        emitente_nome: n.nome_emitente || n.emitente_nome || "",
        destinatario_cnpj: cnpj,
        valor_total: Number(n.valor_total || n.valor_nota_fiscal || 0) || 0,
        data_emissao: n.data_emissao || n.dhEmi || null,
        data_recebimento: n.data_inclusao || n.data_recebimento || null,
        ambiente,
        status: n.status || n.situacao || null,
        manifestacao: n.manifestacao_destinatario || null,
        xml_url: xmlPath,
        payload: n,
      };

      const { data: existing } = await admin.from("nfes_recebidas")
        .select("id").eq("chave", chave).maybeSingle();
      if (existing?.id) {
        await admin.from("nfes_recebidas").update(row).eq("id", existing.id);
        atualizadas++;
      } else {
        await admin.from("nfes_recebidas").insert(row);
        inseridas++;
      }
    }

    return json({ ok: true, total: arr.length, inseridas, atualizadas, comXml, erros, ambiente });
  } catch (e) {
    console.error("importar-nfes-focus erro:", e);
    return json({ ok: false, error: (e as Error).message || "Erro inesperado" }, 500);
  }
});
