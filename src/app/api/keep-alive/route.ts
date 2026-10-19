import { NextResponse, type NextRequest } from 'next/server';
import { clienteAdmin } from '@/lib/supabase/admin';
import { comparar } from '@/lib/admin/sessao';

/**
 * Keep-alive do banco.
 *
 * O plano free do Supabase pausa o projeto depois de ~7 dias sem atividade, e
 * o host de um projeto pausado some do DNS. Quando isso aconteceu, não foi só
 * o painel que caiu: o formulário público passou a recusar todo envio com
 * "fetch failed" — ou seja, a pesquisa ficou dias coletando nada.
 *
 * Uma consulta por dia zera esse contador. O cron da Vercel (vercel.json)
 * chama esta rota; ela faz a leitura mais barata possível que ainda toca o
 * Postgres de verdade.
 *
 * Não é garantia contratual: se a Vercel pular execuções por uma semana
 * inteira, a pausa volta a ser possível. A única garantia dura seria o plano
 * Pro do Supabase, que não pausa por inatividade.
 */
export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;

  // Sem segredo configurado a rota fica fechada. Aberta ela não vazaria dado
  // nenhum — devolve só uma contagem —, mas seria um gatilho anônimo para
  // consultas no banco, e isso não precisa existir.
  if (!segredo) {
    return NextResponse.json(
      { ok: false, erro: 'CRON_SECRET não configurado' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // A Vercel manda este cabeçalho nas invocações de cron quando a env var existe.
  const enviado = req.headers.get('authorization') ?? '';
  if (!comparar(enviado, `Bearer ${segredo}`)) {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  // O try cobre o clienteAdmin(), que lança quando falta variável de ambiente.
  // Um cron que estoura em 500 com stack trace é um sinal pior do que um 503
  // com a causa no log — e é o log que vai ser lido quando isto cair de novo.
  try {
    const supabase = clienteAdmin();
    const { count, error } = await supabase
      .from('respostas')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json(
      { ok: true, respostas: count ?? 0, em: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    // `message` de uma falha de rede é só "TypeError: fetch failed"; a causa
    // real (ENOTFOUND, timeout, TLS) está em `cause`. Este é o lugar onde ela
    // fica registrada: é por aqui que a próxima queda vai ser diagnosticada.
    const erro = e as { message?: string; cause?: unknown };
    console.error('[keep-alive] falhou:', erro.message, erro.cause);
    return NextResponse.json(
      { ok: false, erro: erro.message ?? 'erro desconhecido' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
