// Emissão NFS-e Nacional (Emissor Nacional gov.br) — Homologação
// Endpoint sandbox: https://sefin.producaorestrita.nfse.gov.br/API/SefinNacional/nfse
//
// Fluxo:
// 1. Recebe modelo (prestador, tomador, serviço, tributos, valores)
// 2. Persiste rascunho em nfses_emitidas (gera número via trigger)
// 3. Monta DPS XML segundo schema nacional v1.00
// 4. Carrega certificado A1 da empresa (bucket certificados-digitais) e assina XMLDSig
// 5. POST para sandbox e atualiza registro com resposta
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import forge from "npm:node-forge@1.3.1";
import { gzipSync, gunzipSync } from "node:zlib";
import { Buffer } from "node:buffer";

const SANDBOX_URL = "https://sefin.producaorestrita.nfse.gov.br/SefinNacional/nfse";
const PROD_URL = "https://sefin.nfse.gov.br/SefinNacional/nfse";

// Edge Runtime/node:https pode falhar no ambiente da função; usamos socket TLS + HTTP/1.1 cru.
async function httpsPostJson(targetUrl: string, body: string): Promise<{ status: number; text: string }> {
  const u = new URL(targetUrl);
  const hostname = u.hostname;
  const port = Number(u.port || 443);
  const path = `${u.pathname}${u.search}`;
  const request = [
    `POST ${path} HTTP/1.1`,
    `Host: ${hostname}`,
    "Content-Type: application/json",
    "Accept: application/json",
    "Connection: close",
    `Content-Length: ${Buffer.byteLength(body)}`,
    "",
    body,
  ].join("\r\n");

  const conn = await Deno.connectTls({ hostname, port });
  try {
    await conn.write(new TextEncoder().encode(request));
    const chunks: Uint8Array[] = [];
    const buf = new Uint8Array(16 * 1024);
    while (true) {
      const n = await conn.read(buf);
      if (n === null) break;
      chunks.push(buf.slice(0, n));
    }
    const raw = new TextDecoder().decode(Buffer.concat(chunks));
    const headerEnd = raw.indexOf("\r\n\r\n");
    const head = headerEnd >= 0 ? raw.slice(0, headerEnd) : raw;
    const text = headerEnd >= 0 ? raw.slice(headerEnd + 4) : "";
    const status = Number((head.match(/^HTTP\/\d(?:\.\d)?\s+(\d+)/) || [])[1] || 0);
    return { status, text };
  } finally {
    try { conn.close(); } catch (_) { /* noop */ }
  }
}

type Modelo = {
  empresaId: string;
  ambiente?: 1 | 2;
  serie?: string;
  dataCompetencia?: string;
  faturamentoId?: string | null;
  clienteId?: string | null;
  prestador: {
    cnpj: string; im?: string; razaoSocial: string;
    endereco?: any; regimeTributario?: string; optanteSimples?: boolean;
    codigoMunicipio: string;
  };
  tomador: {
    tipo: "CNPJ" | "CPF" | "EXTERIOR"; documento: string; razaoSocial: string;
    inscricaoMunicipal?: string; email?: string;
    endereco?: { logradouro?: string; numero?: string; complemento?: string;
      bairro?: string; codigoMunicipio?: string; uf?: string; cep?: string; pais?: string };
  };
  servico: {
    descricao: string;
    codigoTributacaoMunicipio: string; // item LC 116
    codigoNbs?: string;
    cnae?: string;
    valorServico: number;
    deducoes?: number;
    descontoIncondicionado?: number;
    descontoCondicionado?: number;
  };
  tributos: {
    aliquotaIss: number; // %
    issRetido: boolean;
    pis?: number; cofins?: number; inss?: number; ir?: number; csll?: number;
  };
  certificadoSenha: string;
};

function esc(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function digits(s: string) { return (s || "").replace(/\D+/g, ""); }
function fmt(n: number, d = 2) { return (Number(n) || 0).toFixed(d); }

/** Monta XML DPS (Declaração de Prestação de Serviço) conforme schema nacional v1.00 */
function buildDPSXml(numeroDps: number, m: Modelo): { xml: string; id: string } {
  const amb = m.ambiente || 2;
  const serie = m.serie || "00001";
  const dCompet = m.dataCompetencia || new Date().toISOString().slice(0, 10);
  const dhEmi = new Date().toISOString().replace(/\.\d+Z$/, "-03:00");
  const idDps = `DPS${digits(m.prestador.cnpj).padStart(14, "0")}${amb}${serie.padStart(5, "0")}${String(numeroDps).padStart(15, "0")}`;

  const valorServico = Number(m.servico.valorServico) || 0;
  const deducoes = Number(m.servico.deducoes) || 0;
  const baseCalculo = Math.max(0, valorServico - deducoes - (m.servico.descontoIncondicionado || 0));
  const valorIss = baseCalculo * (Number(m.tributos.aliquotaIss) || 0) / 100;

  const tomadorDoc = digits(m.tomador.documento);
  const tomadorTag = m.tomador.tipo === "CPF"
    ? `<CPF>${esc(tomadorDoc)}</CPF>`
    : m.tomador.tipo === "CNPJ"
    ? `<CNPJ>${esc(tomadorDoc)}</CNPJ>`
    : `<NIFTom>${esc(tomadorDoc)}</NIFTom>`;

  const end = m.tomador.endereco || {};

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
  <infDPS Id="${idDps}" versao="1.00">
    <tpAmb>${amb}</tpAmb>
    <dhEmi>${dhEmi}</dhEmi>
    <verAplic>1.00</verAplic>
    <serie>${esc(serie)}</serie>
    <nDPS>${numeroDps}</nDPS>
    <dCompet>${esc(dCompet)}</dCompet>
    <tpEmit>1</tpEmit>
    <cLocEmi>${esc(m.prestador.codigoMunicipio)}</cLocEmi>
    <prest>
      <CNPJ>${esc(digits(m.prestador.cnpj))}</CNPJ>
      ${m.prestador.im ? `<IM>${esc(m.prestador.im)}</IM>` : ""}
      <xNome>${esc(m.prestador.razaoSocial)}</xNome>
      <regTrib>
        <opSimpNac>${m.prestador.optanteSimples ? 1 : 2}</opSimpNac>
        <regApTribSN>${m.prestador.regimeTributario || 1}</regApTribSN>
      </regTrib>
    </prest>
    <toma>
      ${tomadorTag}
      ${m.tomador.inscricaoMunicipal ? `<IM>${esc(m.tomador.inscricaoMunicipal)}</IM>` : ""}
      <xNome>${esc(m.tomador.razaoSocial)}</xNome>
      <end>
        <endNac>
          <cMun>${esc(end.codigoMunicipio || m.prestador.codigoMunicipio)}</cMun>
          <CEP>${esc(digits(end.cep || ""))}</CEP>
        </endNac>
        <xLgr>${esc(end.logradouro || "")}</xLgr>
        <nro>${esc(end.numero || "S/N")}</nro>
        ${end.complemento ? `<xCpl>${esc(end.complemento)}</xCpl>` : ""}
        <xBairro>${esc(end.bairro || "")}</xBairro>
      </end>
      ${m.tomador.email ? `<email>${esc(m.tomador.email)}</email>` : ""}
    </toma>
    <serv>
      <locPrest><cLocPrestacao>${esc(m.prestador.codigoMunicipio)}</cLocPrestacao></locPrest>
      <cServ>
        <cTribNac>${esc(m.servico.codigoTributacaoMunicipio)}</cTribNac>
        ${m.servico.codigoNbs ? `<cNBS>${esc(m.servico.codigoNbs)}</cNBS>` : ""}
        ${m.servico.cnae ? `<CNAE>${esc(m.servico.cnae)}</CNAE>` : ""}
        <xDescServ>${esc(m.servico.descricao)}</xDescServ>
      </cServ>
    </serv>
    <valores>
      <vServPrest>
        <vReceb>${fmt(valorServico)}</vReceb>
        <vServ>${fmt(valorServico)}</vServ>
      </vServPrest>
      <vDescCondIncond>
        <vDescIncond>${fmt(m.servico.descontoIncondicionado || 0)}</vDescIncond>
        <vDescCond>${fmt(m.servico.descontoCondicionado || 0)}</vDescCond>
      </vDescCondIncond>
      <vDedRed>
        <vDR>${fmt(deducoes)}</vDR>
      </vDedRed>
      <trib>
        <tribMun>
          <tribISSQN>${m.tributos.issRetido ? 2 : 1}</tribISSQN>
          <cLocIncid>${esc(m.prestador.codigoMunicipio)}</cLocIncid>
          <pAliq>${fmt(m.tributos.aliquotaIss, 4)}</pAliq>
          <tpRetISSQN>${m.tributos.issRetido ? 1 : 2}</tpRetISSQN>
        </tribMun>
        <totTrib>
          <vTotTrib>
            <vTotTribFed>${fmt((m.tributos.pis||0)+(m.tributos.cofins||0)+(m.tributos.ir||0)+(m.tributos.csll||0)+(m.tributos.inss||0))}</vTotTribFed>
            <vTotTribEst>0.00</vTotTribEst>
            <vTotTribMun>${fmt(valorIss)}</vTotTribMun>
          </vTotTrib>
        </totTrib>
      </trib>
    </valores>
  </infDPS>
</DPS>`.trim();

  return { xml, id: idDps };
}

/** Assina o XML DPS com XMLDSig enveloped (RSA-SHA256, C14N exclusive) usando node-forge */
function signDPS(xml: string, infDpsId: string, privateKey: forge.pki.PrivateKey, cert: forge.pki.Certificate): string {
  // 1. Extrai elemento <infDPS ...>...</infDPS>
  const infMatch = xml.match(/<infDPS\b[^>]*>[\s\S]*?<\/infDPS>/);
  if (!infMatch) throw new Error("Não foi possível localizar <infDPS> no XML");
  const infXml = infMatch[0];

  // 2. Canonicaliza (simplificado — para conformidade total c14n exclusive use uma lib)
  //    Aqui aplicamos normalização básica: remove whitespace entre tags.
  const canonical = infXml.replace(/>\s+</g, "><").trim();

  // 3. Digest SHA-256 (base64)
  const md = forge.md.sha256.create();
  md.update(canonical, "raw");
  const digestB64 = forge.util.encode64(md.digest().bytes());

  // 4. Monta SignedInfo
  const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">` +
    `<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
    `<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>` +
    `<Reference URI="#${infDpsId}">` +
      `<Transforms>` +
        `<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
        `<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
      `</Transforms>` +
      `<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
      `<DigestValue>${digestB64}</DigestValue>` +
    `</Reference>` +
  `</SignedInfo>`;

  // 5. Assina SignedInfo
  const signMd = forge.md.sha256.create();
  signMd.update(signedInfo, "raw");
  const signature = (privateKey as forge.pki.rsa.PrivateKey).sign(signMd);
  const signatureB64 = forge.util.encode64(signature);

  // 6. Certificado em base64 DER
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const certB64 = forge.util.encode64(certDer);

  const signatureXml = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` +
    signedInfo +
    `<SignatureValue>${signatureB64}</SignatureValue>` +
    `<KeyInfo><X509Data><X509Certificate>${certB64}</X509Certificate></X509Data></KeyInfo>` +
  `</Signature>`;

  // 7. Insere a Signature dentro do <DPS> logo após </infDPS>
  return xml.replace("</infDPS>", `</infDPS>${signatureXml}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const modelo = await req.json() as Modelo;
    if (!modelo?.empresaId) throw new Error("empresaId é obrigatório");
    if (!modelo?.certificadoSenha) throw new Error("Senha do certificado A1 é obrigatória");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ambiente = modelo.ambiente || 2;
    const serie = modelo.serie || "00001";

    // 1. Cria rascunho (trigger gera numero_dps)
    const valorServico = Number(modelo.servico.valorServico) || 0;
    const deducoes = Number(modelo.servico.deducoes) || 0;
    const baseCalculo = Math.max(0, valorServico - deducoes - (modelo.servico.descontoIncondicionado || 0));
    const valorIss = baseCalculo * (Number(modelo.tributos.aliquotaIss) || 0) / 100;

    const { data: inserted, error: insErr } = await admin.from("nfses_emitidas").insert({
      empresa_id: modelo.empresaId, ambiente, serie,
      status: "processando",
      cliente_id: modelo.clienteId || null,
      faturamento_id: modelo.faturamentoId || null,
      data_competencia: modelo.dataCompetencia || new Date().toISOString().slice(0, 10),
      prestador: modelo.prestador, tomador: modelo.tomador,
      servico: modelo.servico, tributos: modelo.tributos,
      valor_servico: valorServico,
      valor_iss: valorIss,
      valor_liquido: valorServico - (modelo.tributos.issRetido ? valorIss : 0),
    }).select("*").single();
    if (insErr || !inserted) throw new Error("Falha ao gravar rascunho: " + insErr?.message);

    // 2. Busca certificado da empresa
    const { data: empresa, error: empErr } = await admin.from("empresa")
      .select("certificado_a1_url, cnpj, razao_social").eq("id", modelo.empresaId).single();
    if (empErr || !empresa?.certificado_a1_url) {
      await admin.from("nfses_emitidas").update({
        status: "rejeitada", mensagem_retorno: "Certificado A1 não cadastrado em Dados da Empresa",
      }).eq("id", inserted.id);
      throw new Error("Empresa sem certificado A1 cadastrado");
    }

    const { data: pfxFile, error: dlErr } = await admin.storage
      .from("certificados-digitais").download(empresa.certificado_a1_url);
    if (dlErr || !pfxFile) {
      await admin.from("nfses_emitidas").update({
        status: "rejeitada", mensagem_retorno: "Falha ao baixar certificado A1: " + (dlErr?.message || ""),
      }).eq("id", inserted.id);
      throw new Error("Falha ao baixar certificado");
    }

    const buf = new Uint8Array(await pfxFile.arrayBuffer());
    const binary = String.fromCharCode(...buf);
    let p12: forge.pkcs12.Pkcs12Pfx;
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(binary, false), false, modelo.certificadoSenha);
    } catch {
      await admin.from("nfses_emitidas").update({
        status: "rejeitada", mensagem_retorno: "Senha do certificado A1 incorreta",
      }).eq("id", inserted.id);
      return new Response(JSON.stringify({ ok: false, error: "Senha do certificado A1 incorreta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const cert = (certBags[forge.pki.oids.certBag] || [])[0]?.cert;
    const key = (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || [])[0]?.key;
    if (!cert || !key) throw new Error("Certificado ou chave privada não localizados no .pfx");

    // 3. Monta + assina DPS
    const { xml: xmlDps, id: idDps } = buildDPSXml(inserted.numero_dps, modelo);
    const xmlAssinado = signDPS(xmlDps, idDps, key, cert);

    // 4. Envia para Emissor Nacional
    const url = ambiente === 1 ? PROD_URL : SANDBOX_URL;
    let respStatus = 0, respText = "", chaveAcesso: string | null = null,
      protocolo: string | null = null, dataEmissao: string | null = null;
    try {
      const dpsXmlGZipB64 = Buffer.from(gzipSync(Buffer.from(xmlAssinado, "utf-8"))).toString("base64");
      const resp = await httpsPostJson(url, JSON.stringify({ dpsXmlGZipB64 }));
      respStatus = resp.status;
      respText = resp.text;

      let nfseXml: string | null = null;
      if (respStatus >= 200 && respStatus < 300) {
        try {
          const j = JSON.parse(respText);
          chaveAcesso = j.chaveAcesso || null;
          if (j.nfseXmlGZipB64) {
            nfseXml = gunzipSync(Buffer.from(j.nfseXmlGZipB64, "base64")).toString("utf-8");
            protocolo = (nfseXml.match(/<nProt>([^<]+)<\/nProt>/) || [])[1] || null;
            dataEmissao = (nfseXml.match(/<dhProc>([^<]+)<\/dhProc>/) || [])[1] || null;
          }
        } catch (_) { /* keep raw text */ }
      }
    } catch (e) {
      respText = "Falha de rede ao chamar Emissor Nacional: " + (e as Error).message;
    }

    const novoStatus = respStatus >= 200 && respStatus < 300 ? "emitida" : "rejeitada";
    await admin.from("nfses_emitidas").update({
      status: novoStatus,
      xml_dps: xmlAssinado,
      xml_nfse: novoStatus === "emitida" ? respText : null,
      chave_acesso: chaveAcesso,
      protocolo,
      data_emissao: dataEmissao || (novoStatus === "emitida" ? new Date().toISOString() : null),
      mensagem_retorno: novoStatus === "emitida" ? "Autorizada" : `HTTP ${respStatus}: ${respText.slice(0, 2000)}`,
    }).eq("id", inserted.id);

    return new Response(JSON.stringify({
      ok: novoStatus === "emitida",
      id: inserted.id,
      numero_dps: inserted.numero_dps,
      status: novoStatus,
      httpStatus: respStatus,
      chaveAcesso, protocolo,
      mensagem: novoStatus === "emitida" ? "NFS-e autorizada" : respText.slice(0, 500),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("nfse-emitir erro:", e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
