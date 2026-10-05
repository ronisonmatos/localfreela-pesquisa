import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente do Supabase para o navegador.
 *
 * A chave publishable é pública de propósito: ela vai embutida no bundle que
 * o respondente baixa, como qualquer variável NEXT_PUBLIC_. Quem protege os
 * dados é a RLS no Postgres, não o segredo da chave — por isso a política da
 * tabela de respostas precisa liberar INSERT e negar SELECT.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Faltam NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ' +
        'em .env.local'
    );
  }

  return createBrowserClient(url, key);
}
