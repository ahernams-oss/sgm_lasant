import { supabase } from "@/integrations/supabase/client";

/** E-mail que recebe cópia de todos os envios do módulo de Compras. */
export const EMAIL_COPIA_COMPRAS = "compras@lasant.com.br";

interface EnvioComprasParams {
  templateName: string;
  recipientEmail: string;
  idempotencyKey: string;
  templateData: Record<string, any>;
}

/**
 * Envia um e-mail do módulo de Compras para o destinatário e dispara
 * automaticamente uma cópia para EMAIL_COPIA_COMPRAS.
 * A cópia é "best-effort": falhas nela não afetam o envio principal.
 */
export async function enviarEmailCompras({
  templateName,
  recipientEmail,
  idempotencyKey,
  templateData,
}: EnvioComprasParams): Promise<{ error: any }> {
  const { error } = await supabase.functions.invoke("send-transactional-email", {
    body: { templateName, recipientEmail, idempotencyKey, templateData },
  });

  if (recipientEmail?.trim().toLowerCase() !== EMAIL_COPIA_COMPRAS) {
    supabase.functions
      .invoke("send-transactional-email", {
        body: {
          templateName,
          recipientEmail: EMAIL_COPIA_COMPRAS,
          idempotencyKey: `${idempotencyKey}-copia`,
          templateData: { ...templateData, copiaInterna: true, destinatarioOriginal: recipientEmail },
        },
      })
      .catch(err => console.error("Falha ao enviar cópia para compras:", err));
  }

  return { error };
}
