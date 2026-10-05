import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente com a chave service_role. Ela IGNORA a RLS por completo: lê, altera
 * e apaga qualquer linha. Nunca pode chegar ao navegador.
 *
 * O `import 'server-only'` acima é a garantia: se algum dia alguém importar
 * este arquivo de um componente de cliente, o build quebra em vez de vazar a
 * chave no bundle. Por isso ela também não tem o prefixo NEXT_PUBLIC_.
 */
export function clienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error(
      'Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente'
    );
  }

  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
