import { supabase } from "@/integrations/supabase/client";

export async function enviarWhatsApp(telefone: string, mensagem: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: { telefone, mensagem },
    });

    if (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}
