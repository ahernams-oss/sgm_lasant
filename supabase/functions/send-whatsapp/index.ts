import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ZAPI_TOKEN = Deno.env.get('CHATPRO_TOKEN');
    if (!ZAPI_TOKEN) {
      throw new Error('CHATPRO_TOKEN (Z-API Token) is not configured');
    }

    const ZAPI_INSTANCE = Deno.env.get('CHATPRO_INSTANCE');
    if (!ZAPI_INSTANCE) {
      throw new Error('CHATPRO_INSTANCE (Z-API Instance) is not configured');
    }

    const { telefone, mensagem, documentUrl, documentFilename } = await req.json();

    if (!telefone || (!mensagem && !documentUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: 'telefone e (mensagem ou documentUrl) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar telefone: remover tudo que não é dígito
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const baseUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}`;

    // Se tiver documento, envia como arquivo
    if (documentUrl) {
      const ext = (documentFilename || 'documento.pdf').split('.').pop() || 'pdf';
      const zapiUrl = `${baseUrl}/send-document/${ext}`;

      const response = await fetch(zapiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: telefoneLimpo,
          document: documentUrl,
          fileName: documentFilename || 'documento.pdf',
          caption: mensagem || '',
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Z-API retornou resposta inválida [${response.status}]: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(`Z-API error [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Envio de mensagem de texto normal
    const zapiUrl = `${baseUrl}/send-text`;

    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: telefoneLimpo,
        message: mensagem,
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Z-API retornou resposta inválida [${response.status}]: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(`Z-API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending WhatsApp message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
