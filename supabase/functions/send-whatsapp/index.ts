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
    const CHATPRO_TOKEN = Deno.env.get('CHATPRO_TOKEN');
    if (!CHATPRO_TOKEN) {
      throw new Error('CHATPRO_TOKEN is not configured');
    }

    const CHATPRO_INSTANCE = Deno.env.get('CHATPRO_INSTANCE');
    if (!CHATPRO_INSTANCE) {
      throw new Error('CHATPRO_INSTANCE is not configured');
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

    // Se tiver documento, envia como arquivo
    if (documentUrl) {
      const chatproUrl = `https://v5.chatpro.com.br/${CHATPRO_INSTANCE}/api/v1/send_file_url`;

      const response = await fetch(chatproUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': CHATPRO_TOKEN,
        },
        body: JSON.stringify({
          url: documentUrl,
          number: telefoneLimpo,
          filename: documentFilename || 'documento.pdf',
          caption: mensagem || '',
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`ChatPro retornou resposta inválida [${response.status}]: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(`ChatPro API error [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Envio de mensagem de texto normal
    const chatproUrl = `https://v5.chatpro.com.br/${CHATPRO_INSTANCE}/api/v1/send_message`;

    const response = await fetch(chatproUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': CHATPRO_TOKEN,
      },
      body: JSON.stringify({
        message: mensagem,
        number: telefoneLimpo,
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`ChatPro retornou resposta inválida [${response.status}]: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(`ChatPro API error [${response.status}]: ${JSON.stringify(data)}`);
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
