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

    const body = await req.json();
    const { telefone, mensagem, documentUrl, documentFilename, _probe } = body;

    const telefoneLimpo = (telefone || '').replace(/\D/g, '');
    const baseUrl = `https://v5.chatpro.com.br/${CHATPRO_INSTANCE}`;

    if (_probe) {
      const endpoints = ['send_message_file','send_image','send_link','send_attachment','send_document','send_file','send_media','sendDocument','sendFile','send_doc'];
      const results: Record<string, { status: number; body: string }> = {};
      for (const ep of endpoints) {
        const r = await fetch(`${baseUrl}/api/v1/${ep}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': CHATPRO_TOKEN },
          body: JSON.stringify({ number: telefoneLimpo, url: 'https://example.com/x.pdf', file_name: 'x.pdf', caption: '' }),
        });
        const t = await r.text();
        results[ep] = { status: r.status, body: t.substring(0, 150) };
      }
      return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!telefone || (!mensagem && !documentUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: 'telefone e (mensagem ou documentUrl) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se tiver documento, envia como arquivo
    if (documentUrl) {
      const chatproUrl = `${baseUrl}/api/v1/send_message_file`;

      const response = await fetch(chatproUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': CHATPRO_TOKEN,
        },
        body: JSON.stringify({
          number: telefoneLimpo,
          url: documentUrl,
          file_name: documentFilename || 'documento.pdf',
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
        throw new Error(`ChatPro error [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Envio de mensagem de texto normal
    const chatproUrl = `${baseUrl}/api/v1/send_message`;

    const response = await fetch(chatproUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CHATPRO_TOKEN,
      },
      body: JSON.stringify({
        number: telefoneLimpo,
        message: mensagem,
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
      throw new Error(`ChatPro error [${response.status}]: ${JSON.stringify(data)}`);
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
