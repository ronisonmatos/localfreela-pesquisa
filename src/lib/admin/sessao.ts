import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'lf_admin';
const DURACAO = 60 * 60 * 12; // 12 horas

/**
 * Sessão do painel: uma senha só, guardada em variável de ambiente.
 *
 * O cookie não guarda a senha — guarda um HMAC dela. Sem conhecer a senha não
 * dá para forjar o valor, e quem lê o cookie no disco não descobre a senha.
 * Trocar ADMIN_SENHA invalida todas as sessões abertas, que é o único jeito de
 * "revogar" neste modelo: senha única não tem revogação individual.
 */

function senhaConfigurada(): string | null {
  const s = process.env.ADMIN_SENHA;
  return s && s.length > 0 ? s : null;
}

function selo(senha: string): string {
  return createHmac('sha256', senha).update('painel-localfreela-v1').digest('hex');
}

/** Comparação em tempo constante: evita descobrir a senha medindo o tempo. */
function iguais(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) {
    // ainda assim compara algo do mesmo tamanho, para não vazar o comprimento
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export type EstadoSessao = 'autenticado' | 'anonimo' | 'sem-senha-configurada';

export async function estadoDaSessao(): Promise<EstadoSessao> {
  const senha = senhaConfigurada();
  if (!senha) return 'sem-senha-configurada';

  const cookie = (await cookies()).get(COOKIE)?.value;
  if (!cookie) return 'anonimo';

  return iguais(cookie, selo(senha)) ? 'autenticado' : 'anonimo';
}

/** true quando a senha confere e a sessão foi aberta. */
export async function abrirSessao(tentativa: string): Promise<boolean> {
  const senha = senhaConfigurada();
  if (!senha || !iguais(tentativa, senha)) return false;

  (await cookies()).set(COOKIE, selo(senha), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: DURACAO,
  });
  return true;
}

export async function fecharSessao(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: '/admin' });
}
