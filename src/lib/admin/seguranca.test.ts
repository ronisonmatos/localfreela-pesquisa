import { beforeEach, describe, expect, it, vi } from 'vitest';
import { celula, montarCsv } from './csv';
import type { Linha } from './analise';

/* Cookie falso, com a mesma forma do de next/headers. */
const loja = new Map<string, { value: string } & Record<string, unknown>>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (n: string) => loja.get(n),
    set: (n: string, value: string, opts: Record<string, unknown>) =>
      loja.set(n, { value, ...opts }),
    delete: ({ name }: { name: string }) => loja.delete(name),
  }),
}));

const { abrirSessao, estadoDaSessao, fecharSessao } = await import('./sessao');

const SENHA = 'uma-senha-longa-de-verdade-2026';

beforeEach(() => {
  loja.clear();
  process.env.ADMIN_SENHA = SENHA;
});

describe('sessão do painel', () => {
  it('sem ADMIN_SENHA o painel se recusa a abrir', async () => {
    delete process.env.ADMIN_SENHA;
    expect(await estadoDaSessao()).toBe('sem-senha-configurada');
    // e não é possível entrar nem acertando "nada"
    expect(await abrirSessao('')).toBe(false);
  });

  it('visitante sem cookie é anônimo', async () => {
    expect(await estadoDaSessao()).toBe('anonimo');
  });

  it('senha errada não abre sessão nem grava cookie', async () => {
    expect(await abrirSessao('chute')).toBe(false);
    expect(loja.size).toBe(0);
    expect(await estadoDaSessao()).toBe('anonimo');
  });

  it('senha certa abre a sessão', async () => {
    expect(await abrirSessao(SENHA)).toBe(true);
    expect(await estadoDaSessao()).toBe('autenticado');
  });

  it('o cookie NÃO contém a senha', async () => {
    await abrirSessao(SENHA);
    const valor = [...loja.values()][0].value;
    expect(valor).not.toContain(SENHA);
    expect(valor).toMatch(/^[a-f0-9]{64}$/); // é um HMAC, não a senha
  });

  it('o cookie é httpOnly e preso ao caminho do painel', async () => {
    await abrirSessao(SENHA);
    const c = [...loja.values()][0];
    expect(c.httpOnly).toBe(true);
    expect(c.path).toBe('/admin');
    expect(c.sameSite).toBe('lax');
  });

  it('cookie inventado não autentica', async () => {
    loja.set('lf_admin', { value: 'f'.repeat(64) });
    expect(await estadoDaSessao()).toBe('anonimo');
  });

  it('trocar a senha invalida as sessões já abertas', async () => {
    await abrirSessao(SENHA);
    expect(await estadoDaSessao()).toBe('autenticado');

    process.env.ADMIN_SENHA = 'outra-senha-completamente-diferente';
    expect(await estadoDaSessao()).toBe('anonimo');
  });

  it('sair apaga o cookie', async () => {
    await abrirSessao(SENHA);
    await fecharSessao();
    expect(loja.size).toBe(0);
    expect(await estadoDaSessao()).toBe('anonimo');
  });

  it('senha de comprimento diferente não quebra a comparação', async () => {
    // timingSafeEqual lança se os buffers tiverem tamanhos diferentes
    await expect(abrirSessao('x')).resolves.toBe(false);
    await expect(abrirSessao(SENHA + 'aa')).resolves.toBe(false);
  });
});

/* ---------- CSV ---------- */

const linha = (p: Partial<Linha>): Linha => ({
  id: 1,
  submission_id: 'a',
  form: 'estabelecimento',
  trilha: 'presencial',
  cidade: 'Joinville',
  canal: null,
  comissao_pct: 10,
  comissao_sem: false,
  comissao_teto: '>15',
  escala_resolveria: 4,
  contato_nome: null,
  contato_valor: null,
  consentimento: false,
  respostas: {},
  segundos: 100,
  user_agent: 'x',
  created_at: '2026-10-05T12:00:00Z',
  ...p,
});

describe('exportação CSV', () => {
  it('neutraliza fórmula do Excel vinda de resposta aberta', () => {
    // =HYPERLINK(...) numa célula é execução de conteúdo de terceiro
    expect(celula('=HYPERLINK("http://mau","clique")')).toBe(
      '"\'=HYPERLINK(""http://mau"",""clique"")"'
    );
    expect(celula('+1234')).toBe('"\'+1234"');
    expect(celula('-cmd')).toBe('"\'-cmd"');
    expect(celula('@SUM(A1)')).toBe('"\'@SUM(A1)"');
  });

  it('texto comum não ganha apóstrofo', () => {
    expect(celula('A pessoa não apareceu')).toBe('"A pessoa não apareceu"');
  });

  it('aspas internas são duplicadas', () => {
    expect(celula('ele disse "sim"')).toBe('"ele disse ""sim"""');
  });

  it('nulo vira célula vazia, não a palavra null', () => {
    expect(celula(null)).toBe('');
    expect(celula(undefined)).toBe('');
  });

  it('múltipla escolha vira uma célula legível', () => {
    expect(celula(['indicacao', 'whatsapp'])).toBe('"indicacao; whatsapp"');
  });

  it('o jsonb vira uma coluna por chave, em ordem estável', () => {
    const csv = montarCsv([
      linha({ respostas: { tipo: 'bar', vezes_ano: 'pico' } }),
      linha({ respostas: { tipo: 'loja', cidade_extra: 'x' } }),
    ]);
    const cabecalho = csv.split('\r\n')[0];
    expect(cabecalho).toContain('"tipo"');
    expect(cabecalho).toContain('"vezes_ano"');
    expect(cabecalho).toContain('"cidade_extra"');
    expect(csv.split('\r\n')).toHaveLength(3); // cabeçalho + 2 linhas
  });

  it('começa com BOM, senão o Excel erra os acentos', () => {
    expect(montarCsv([linha({})]).charCodeAt(0)).toBe(0xfeff);
  });

  it('base vazia gera só o cabeçalho', () => {
    const linhas = montarCsv([]).split('\r\n');
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toContain('"created_at"');
  });
});
