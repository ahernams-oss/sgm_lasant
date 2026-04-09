import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const chatproToken = Deno.env.get('CHATPRO_TOKEN');
    const chatproInstance = Deno.env.get('CHATPRO_INSTANCE');

    if (!chatproToken || !chatproInstance) {
      throw new Error('CHATPRO_TOKEN ou CHATPRO_INSTANCE não configurados');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: contatos, error: errContatos } = await supabase
      .from('juridico_contatos_notificacao')
      .select('*')
      .eq('ativo', true);

    if (errContatos) throw errContatos;
    if (!contatos || contatos.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum contato ativo para notificação' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const em2d = new Date(hoje);
    em2d.setDate(em2d.getDate() + 2);
    const em5d = new Date(hoje);
    em5d.setDate(em5d.getDate() + 5);

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const { data: aud5d } = await supabase
      .from('juridico_audiencias')
      .select('*')
      .eq('status', 'Agendada')
      .eq('notificado_5d', false)
      .lte('data_audiencia', fmt(em5d))
      .gte('data_audiencia', fmt(hoje));

    const { data: aud2d } = await supabase
      .from('juridico_audiencias')
      .select('*')
      .eq('status', 'Agendada')
      .eq('notificado_2d', false)
      .lte('data_audiencia', fmt(em2d))
      .gte('data_audiencia', fmt(hoje));

    let enviados = 0;
    const baseUrl = `https://v5.chatpro.com.br/${chatproInstance}`;

    const enviarWhatsApp = async (telefone: string, mensagem: string) => {
      const telefoneLimpo = telefone.replace(/\D/g, '');
      if (!telefoneLimpo) return;

      const url = `${baseUrl}/api/v1/send_message`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': chatproToken,
        },
        body: JSON.stringify({ number: telefoneLimpo, message: mensagem }),
      });
      enviados++;
    };

    for (const aud of (aud5d || [])) {
      const dataFormatada = new Date(aud.data_audiencia + 'T12:00:00').toLocaleDateString('pt-BR');
      const msg = `⚖️ *LEMBRETE DE AUDIÊNCIA - 5 DIAS*\n\n` +
        `Processo: *${aud.processo_numero}*\n` +
        `Tipo: ${aud.tipo}\n` +
        `Data: *${dataFormatada}*${aud.hora ? ` às ${aud.hora}` : ''}\n` +
        `Local: ${aud.local || 'Não informado'}\n` +
        `Vara: ${aud.vara || 'Não informada'}\n` +
        `${aud.observacoes ? `Obs: ${aud.observacoes}` : ''}`;

      for (const contato of contatos) {
        if (contato.telefone_whatsapp) {
          await enviarWhatsApp(contato.telefone_whatsapp, msg);
        }
      }

      await supabase
        .from('juridico_audiencias')
        .update({ notificado_5d: true })
        .eq('id', aud.id);
    }

    for (const aud of (aud2d || [])) {
      const dataFormatada = new Date(aud.data_audiencia + 'T12:00:00').toLocaleDateString('pt-BR');
      const msg = `⚖️ *URGENTE - AUDIÊNCIA EM 2 DIAS*\n\n` +
        `Processo: *${aud.processo_numero}*\n` +
        `Tipo: ${aud.tipo}\n` +
        `Data: *${dataFormatada}*${aud.hora ? ` às ${aud.hora}` : ''}\n` +
        `Local: ${aud.local || 'Não informado'}\n` +
        `Vara: ${aud.vara || 'Não informada'}\n` +
        `${aud.observacoes ? `Obs: ${aud.observacoes}` : ''}`;

      for (const contato of contatos) {
        if (contato.telefone_whatsapp) {
          await enviarWhatsApp(contato.telefone_whatsapp, msg);
        }
      }

      await supabase
        .from('juridico_audiencias')
        .update({ notificado_2d: true })
        .eq('id', aud.id);
    }

    return new Response(
      JSON.stringify({ success: true, enviados, audiencias_5d: (aud5d || []).length, audiencias_2d: (aud2d || []).length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Erro ao verificar audiências:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
