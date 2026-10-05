import type { Linha } from './analise';

/** Colunas fixas, na ordem. O jsonb vira uma coluna por chave encontrada. */
export const COLUNAS_FIXAS = [
  'created_at',
  'form',
  'trilha',
  'cidade',
  'canal',
  'comissao_pct',
  'comissao_sem',
  'comissao_teto',
  'escala_resolveria',
  'contato_nome',
  'contato_valor',
  'consentimento',
  'segundos',
  'submission_id',
] as const;

/**
 * Escapa um valor para CSV.
 *
 * O prefixo com apóstrofo não é estética: uma resposta que comece com `=`,
 * `+`, `-` ou `@` é interpretada como fórmula pelo Excel e pelo Planilhas ao
 * abrir o arquivo. Como o texto vem de quem responde, isso seria execução de
 * conteúdo de terceiro na máquina de vocês.
 */
export function celula(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = Array.isArray(v) ? v.join('; ') : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export function montarCsv(linhas: Linha[]): string {
  const chavesJson = [
    ...new Set(linhas.flatMap((l) => Object.keys(l.respostas ?? {}))),
  ].sort();

  const cabecalho = [...COLUNAS_FIXAS, ...chavesJson];
  const corpo = linhas.map((l) =>
    [
      ...COLUNAS_FIXAS.map((c) => celula(l[c])),
      ...chavesJson.map((k) => celula(l.respostas?.[k])),
    ].join(',')
  );

  // BOM no início: sem ele o Excel no Windows abre os acentos errados
  return '﻿' + [cabecalho.map(celula).join(','), ...corpo].join('\r\n');
}

export function nomeDoArquivo(): string {
  return `localfreela-respostas-${new Date().toISOString().slice(0, 10)}.csv`;
}
