import { createClient } from '@/lib/supabase/client';
import {
  ESCAPE,
  SUFIXO_OUTRO,
  type Pergunta,
  type Pesquisa,
  type Respostas,
} from './tipos';

/**
 * Monta a linha de `public.respostas` a partir do que a pessoa respondeu.
 *
 * O que vira coluna tipada é o que entra na análise: comissão, cidade, canal,
 * trilha, escala. O resto vai no jsonb. Os roteiros ainda vão mudar durante a
 * validação, e prender cada pergunta a uma coluna significaria migration a
 * cada ajuste.
 */
export function montarLinha(
  pesquisa: Pesquisa,
  respostas: Respostas,
  meta: {
    submissionId: string;
    canal: string;
    trilha: string;
    segundos: number;
    userAgent: string;
  }
) {
  /** Campos promovidos a coluna: não se repetem dentro do jsonb. */
  const PROMOVIDOS = new Set([
    'cidade',
    'comissao_justa',
    'comissao_teto',
    'escala_resolveria',
    'contato',
    'consentimento',
  ]);

  const visiveis = perguntasVisiveis(pesquisa, respostas);
  const jsonb: Record<string, unknown> = {};

  for (const q of visiveis) {
    if (PROMOVIDOS.has(q.id)) continue;
    const r = respostas[q.id];
    if (r !== undefined && r !== null && r !== '') jsonb[q.id] = r;

    // o texto do "outro, qual?" fica numa chave irmã e viaja junto
    const outro = respostas[q.id + SUFIXO_OUTRO];
    if (typeof outro === 'string' && outro.trim() !== '') {
      jsonb[q.id + SUFIXO_OUTRO] = outro.trim();
    }
  }

  const comissao = respostas['comissao_justa'];
  const contato = (respostas['contato'] ?? {}) as { nome?: string; contato?: string };
  const consentiu = respostas['consentimento'] === true;

  // Vazio precisa virar null, não string vazia: a constraint
  // contato_exige_consentimento trata '' como preenchido e recusaria a linha.
  const limpar = (s?: string) => {
    const v = (s ?? '').trim();
    return v === '' ? null : v;
  };

  return {
    submission_id: meta.submissionId,
    form: pesquisa.form,
    trilha: meta.trilha || null,
    cidade: limpar(respostas['cidade'] as string | undefined),
    canal: limpar(meta.canal),

    comissao_pct: typeof comissao === 'number' ? comissao : null,
    comissao_sem: comissao === ESCAPE,
    comissao_teto: (respostas['comissao_teto'] as string | undefined) ?? null,

    escala_resolveria: numero(respostas['escala_resolveria']),

    // Sem consentimento o contato não é enviado. A constraint no banco é a
    // segunda barreira; esta é a primeira, e evita um erro feio para quem
    // digitou o nome e depois desmarcou a caixa.
    contato_nome: consentiu ? limpar(contato.nome) : null,
    contato_valor: consentiu ? limpar(contato.contato) : null,
    consentimento: consentiu,

    respostas: jsonb,
    segundos: meta.segundos,
    user_agent: meta.userAgent.slice(0, 500),
  };
}

function numero(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && v !== '' && v !== undefined && v !== null ? n : null;
}

/** Perguntas que a trilha e as condicionais deixaram na tela. */
export function perguntasVisiveis(pesquisa: Pesquisa, respostas: Respostas): Pergunta[] {
  const trilha = trilhaDe(pesquisa, respostas);
  return pesquisa.passos
    .flatMap((p) => p.perguntas)
    .filter((q) => visivel(q, trilha, respostas));
}

export function trilhaDe(pesquisa: Pesquisa, respostas: Respostas): string {
  for (const p of pesquisa.passos) {
    for (const q of p.perguntas) {
      if (q.tipo === 'radio' && q.ramifica) return (respostas[q.id] as string) || '';
    }
  }
  return '';
}

export function visivel(q: Pergunta, trilha: string, respostas: Respostas): boolean {
  if (q.so_se) {
    if (!trilha) return false;
    if (trilha !== 'ambos' && trilha !== q.so_se) return false;
  }
  if (q.so_se_resp && !bate(respostas[q.so_se_resp.id], q.so_se_resp.em)) {
    return false;
  }
  if (q.exceto_resp && bate(respostas[q.exceto_resp.id], q.exceto_resp.em)) {
    return false;
  }
  return true;
}

/** A resposta (valor único ou lista) toca algum dos valores procurados. */
function bate(r: unknown, valores: string[]): boolean {
  if (Array.isArray(r)) return r.some((v) => valores.includes(v as string));
  return valores.includes(r as string);
}

export type ResultadoEnvio = { ok: true } | { ok: false; mensagem: string };

export async function enviar(
  pesquisa: Pesquisa,
  respostas: Respostas,
  meta: Parameters<typeof montarLinha>[2]
): Promise<ResultadoEnvio> {
  let supabase;
  try {
    supabase = createClient();
  } catch {
    return {
      ok: false,
      mensagem:
        'A pesquisa ainda não está conectada ao banco de respostas. ' +
        'Avise quem te mandou este link.',
    };
  }

  const { error } = await supabase
    .from('respostas')
    .insert(montarLinha(pesquisa, respostas, meta));

  if (!error) return { ok: true };

  // 23505 = unique_violation no submission_id. Quer dizer que esta resposta já
  // chegou e o retry é que falhou — do ponto de vista de quem respondeu, deu certo.
  if (error.code === '23505') return { ok: true };

  return { ok: false, mensagem: mensagemDe(error) };
}

function mensagemDe(error: { code?: string; message: string }): string {
  if (error.code === '23514') {
    return 'Alguma resposta não passou na validação do servidor. Revise os campos e tente de novo.';
  }
  if (error.code === '42501') {
    return 'O banco recusou a gravação por permissão. Avise quem te mandou este link.';
  }
  return `Não conseguimos enviar agora (${error.message}). Suas respostas estão salvas neste navegador — tente de novo em instantes.`;
}
