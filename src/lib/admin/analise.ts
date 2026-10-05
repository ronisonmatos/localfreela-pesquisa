import { estabelecimento } from '@/lib/pesquisa/estabelecimento';
import { profissional } from '@/lib/pesquisa/profissional';
import type { Pesquisa } from '@/lib/pesquisa/tipos';

/** Uma linha de public.respostas, como vem do banco. */
export interface Linha {
  id: number;
  submission_id: string;
  form: 'estabelecimento' | 'profissional';
  trilha: string | null;
  cidade: string | null;
  canal: string | null;
  comissao_pct: number | null;
  comissao_sem: boolean;
  comissao_teto: string | null;
  escala_resolveria: number | null;
  contato_nome: string | null;
  contato_valor: string | null;
  consentimento: boolean;
  respostas: Record<string, unknown>;
  segundos: number | null;
  user_agent: string | null;
  created_at: string;
}

export interface Filtros {
  form?: string;
  trilha?: string;
  canal?: string;
  incluirSuspeitas?: boolean;
}

export const SEGUNDOS_SUSPEITOS = 20;

export function filtrar(linhas: Linha[], f: Filtros): Linha[] {
  return linhas.filter((l) => {
    if (f.form && l.form !== f.form) return false;
    if (f.trilha && l.trilha !== f.trilha) return false;
    if (f.canal && (l.canal ?? '(link direto)') !== f.canal) return false;
    if (!f.incluirSuspeitas && (l.segundos ?? 0) < SEGUNDOS_SUSPEITOS) return false;
    return true;
  });
}

/* ---------- estatística ---------- */

export function media(ns: number[]): number | null {
  if (!ns.length) return null;
  return Math.round((ns.reduce((a, b) => a + b, 0) / ns.length) * 10) / 10;
}

export function mediana(ns: number[]): number | null {
  if (!ns.length) return null;
  const o = [...ns].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

export interface Fatia {
  rotulo: string;
  n: number;
}

/** Contagem por chave, da maior para a menor. */
export function contar(valores: (string | null | undefined)[], vazio = '—'): Fatia[] {
  const mapa = new Map<string, number>();
  for (const v of valores) {
    const k = (v ?? '').toString().trim() || vazio;
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([rotulo, n]) => ({ rotulo, n }))
    .sort((a, b) => b.n - a.n);
}

/** Contagem numa ordem fixa, mantendo as faixas vazias visíveis. */
export function contarNaOrdem(
  valores: (string | null | undefined)[],
  ordem: { v: string; t: string }[]
): Fatia[] {
  const mapa = new Map<string, number>();
  for (const v of valores) {
    if (v == null) continue;
    mapa.set(v, (mapa.get(v) ?? 0) + 1);
  }
  return ordem.map((o) => ({ rotulo: o.t, n: mapa.get(o.v) ?? 0 }));
}

/* ---------- rótulos vindos do questionário ---------- */

const PESQUISAS: Record<string, Pesquisa> = { estabelecimento, profissional };

/** Traduz o código gravado no banco para o texto que a pessoa leu na tela. */
export function rotuloDe(form: string, perguntaId: string, valor: string): string {
  const pesquisa = PESQUISAS[form];
  if (!pesquisa) return valor;
  for (const passo of pesquisa.passos) {
    for (const q of passo.perguntas) {
      if (q.id !== perguntaId || !('opcoes' in q)) continue;
      return q.opcoes.find((o) => o.v === valor)?.t ?? valor;
    }
  }
  return valor;
}

export function opcoesDe(form: string, perguntaId: string): { v: string; t: string }[] {
  const pesquisa = PESQUISAS[form];
  if (!pesquisa) return [];
  for (const passo of pesquisa.passos) {
    for (const q of passo.perguntas) {
      if (q.id === perguntaId && 'opcoes' in q) {
        return q.opcoes.map((o) => ({ v: o.v, t: o.t }));
      }
    }
  }
  return [];
}

/** As perguntas abertas de um formulário, com o enunciado. */
export function perguntasAbertas(form: string): { id: string; label: string }[] {
  const pesquisa = PESQUISAS[form];
  if (!pesquisa) return [];
  return pesquisa.passos
    .flatMap((p) => p.perguntas)
    .filter((q) => q.tipo === 'textarea')
    .map((q) => ({ id: q.id, label: q.label }));
}

/* ---------- o resumo que o painel mostra ---------- */

export interface Aberta {
  pergunta: string;
  itens: { texto: string; cidade: string; trilha: string; quando: string }[];
}

export interface Contato {
  nome: string;
  valor: string;
  cidade: string;
  form: string;
  interesse: string;
  quando: string;
}

export interface Analise {
  total: number;
  suspeitas: number;
  porForm: Fatia[];
  comissaoMedia: number | null;
  comissaoMediana: number | null;
  semComissao: number;
  comComissao: number;
  distComissao: Fatia[];
  distTeto: Fatia[];
  resolveriaMedia: number | null;
  distResolveria: Fatia[];
  dorMedia: number | null;
  distTrilha: Fatia[];
  distCidade: Fatia[];
  distCanal: Fatia[];
  contatos: Contato[];
  abertas: Aberta[];
  ultima: string | null;
}

/** Faixas da comissão. A pessoa respondeu em campo livre; aqui agrupamos. */
const FAIXAS: { rotulo: string; teste: (n: number) => boolean }[] = [
  { rotulo: '0%', teste: (n) => n === 0 },
  { rotulo: '1 a 5%', teste: (n) => n >= 1 && n <= 5 },
  { rotulo: '6 a 10%', teste: (n) => n >= 6 && n <= 10 },
  { rotulo: '11 a 15%', teste: (n) => n >= 11 && n <= 15 },
  { rotulo: '16 a 20%', teste: (n) => n >= 16 && n <= 20 },
  { rotulo: 'mais de 20%', teste: (n) => n > 20 },
];

/** "sim" vira "Sim", "talvez" vira o texto completo que a pessoa leu. */
function interesseDe(l: Linha): string {
  const campo = l.form === 'estabelecimento' ? 'topa_piloto' : 'quer_acesso';
  const v = l.respostas?.[campo];
  return typeof v === 'string' ? rotuloDe(l.form, campo, v) : '—';
}

export function analisar(linhas: Linha[]): Analise {
  const pcts = linhas
    .map((l) => l.comissao_pct)
    .filter((n): n is number => typeof n === 'number');

  const notas = linhas
    .map((l) => l.escala_resolveria)
    .filter((n): n is number => typeof n === 'number');

  const dores = linhas
    .map((l) => Number(l.respostas?.['escala_trabalho']))
    .filter((n) => Number.isFinite(n) && n > 0);

  const formDe = (l: Linha) => (l.form === 'estabelecimento' ? 'Estabelecimento' : 'Profissional');

  // respostas abertas, agrupadas por pergunta e com o enunciado real
  const abertas: Aberta[] = [];
  for (const form of ['estabelecimento', 'profissional'] as const) {
    for (const { id, label } of perguntasAbertas(form)) {
      const itens = linhas
        .filter((l) => l.form === form && typeof l.respostas?.[id] === 'string')
        .map((l) => ({
          texto: String(l.respostas[id]).trim(),
          cidade: l.cidade ?? '—',
          trilha: l.trilha ?? '—',
          quando: l.created_at,
        }))
        .filter((i) => i.texto.length > 0);
      if (itens.length) abertas.push({ pergunta: label, itens });
    }
  }

  const contatos: Contato[] = linhas
    .filter((l) => l.contato_valor || l.contato_nome)
    .map((l) => ({
      nome: l.contato_nome ?? '—',
      valor: l.contato_valor ?? '—',
      cidade: l.cidade ?? '—',
      form: formDe(l),
      interesse: interesseDe(l),
      quando: l.created_at,
    }))
    .sort((a, b) => b.quando.localeCompare(a.quando));

  const tetoOrdem = opcoesDe('estabelecimento', 'comissao_teto');

  return {
    total: linhas.length,
    suspeitas: linhas.filter((l) => (l.segundos ?? 0) < SEGUNDOS_SUSPEITOS).length,
    porForm: contar(linhas.map(formDe)),

    comissaoMedia: media(pcts),
    comissaoMediana: mediana(pcts),
    semComissao: linhas.filter((l) => l.comissao_sem).length,
    comComissao: pcts.length,
    distComissao: FAIXAS.map((f) => ({
      rotulo: f.rotulo,
      n: pcts.filter(f.teste).length,
    })).concat({
      rotulo: 'não pagaria',
      n: linhas.filter((l) => l.comissao_sem).length,
    }),
    distTeto: contarNaOrdem(
      linhas.map((l) => l.comissao_teto),
      tetoOrdem
    ),

    resolveriaMedia: media(notas),
    distResolveria: [1, 2, 3, 4, 5].map((n) => ({
      rotulo: String(n),
      n: notas.filter((x) => x === n).length,
    })),
    dorMedia: media(dores),

    distTrilha: contar(linhas.map((l) => l.trilha), 'sem resposta'),
    distCidade: contar(linhas.map((l) => l.cidade?.trim().toLowerCase()), 'sem cidade'),
    distCanal: contar(linhas.map((l) => l.canal), '(link direto)'),

    contatos,
    abertas,
    ultima: linhas.length
      ? linhas.map((l) => l.created_at).sort().at(-1) ?? null
      : null,
  };
}
