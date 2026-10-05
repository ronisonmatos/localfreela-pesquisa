import { describe, expect, it } from 'vitest';
import { montarLinha, perguntasVisiveis, visivel } from './enviar';
import { estabelecimento } from './estabelecimento';
import { profissional } from './profissional';
import type { Pesquisa, Respostas } from './tipos';

/* Garantias vindas da revisão das 41 perguntas: quem diz não ter o processo
   não é interrogado sobre ele, a proposta é relembrada antes das perguntas de
   reação, e o "Outro" não perde a resposta. */

const todas = (p: Pesquisa) => p.passos.flatMap((s) => s.perguntas);
const achar = (p: Pesquisa, id: string) => todas(p).find((q) => q.id === id)!;
const ids = (p: Pesquisa, r: Respostas) => perguntasVisiveis(p, r).map((q) => q.id);

describe('quem nunca contratou não responde sobre o processo', () => {
  it('estabelecimento: "Nunca precisei" esconde o bloco de processo atual', () => {
    const nunca = ids(estabelecimento, { modo: 'presencial', vezes_ano: 'nunca' });
    for (const id of [
      'tempo_inicio',
      'ultima_vez',
      'o_que_da_errado',
      'escala_trabalho',
      'avalia_presencial',
    ]) {
      expect(nunca).not.toContain(id);
    }
  });

  it('estabelecimento: mas segue respondendo sobre a proposta', () => {
    const nunca = ids(estabelecimento, { modo: 'presencial', vezes_ano: 'nunca' });
    for (const id of [
      'o_que_faria_confiar',
      'seguranca',
      'escala_resolveria',
      'comissao_justa',
      'comissao_teto',
      'topa_piloto',
    ]) {
      expect(nunca).toContain(id);
    }
  });

  it('estabelecimento: quem contrata vê tudo', () => {
    const contrata = ids(estabelecimento, { modo: 'presencial', vezes_ano: 'pico' });
    expect(contrata).toContain('tempo_inicio');
    expect(contrata).toContain('escala_trabalho');
    expect(contrata).toContain('avalia_presencial');
  });

  it('profissional: "Nunca peguei" esconde as perguntas de experiência', () => {
    const nunca = ids(profissional, { modo: 'presencial', frequencia: 'nunca' });
    for (const id of ['pesa', 'problema_receber', 'confiar_contratante']) {
      expect(nunca).not.toContain(id);
    }
    expect(nunca).toContain('escala_resolveria');
    expect(nunca).toContain('comissao_justa');
  });

  it('profissional: quem não usa canal nenhum não é perguntado sobre trocar', () => {
    const semCanal = ids(profissional, { modo: 'remoto', canais: ['nenhum'] });
    expect(semCanal).not.toContain('trocar_plataforma');

    const comCanal = ids(profissional, { modo: 'remoto', canais: ['workana'] });
    expect(comCanal).toContain('trocar_plataforma');
  });

  it('obrigatória escondida não entra na linha enviada', () => {
    const linha = montarLinha(
      estabelecimento,
      { modo: 'presencial', vezes_ano: 'nunca', cidade: 'Joinville' },
      { submissionId: 'x', canal: '', trilha: 'presencial', segundos: 90, userAgent: 'u' }
    );
    expect(linha.respostas).not.toHaveProperty('tempo_inicio');
    expect(linha.respostas).toHaveProperty('vezes_ano', 'nunca');
  });
});

describe('a proposta é relembrada antes das perguntas de reação', () => {
  for (const pesquisa of [estabelecimento, profissional]) {
    it(`[${pesquisa.form}] o passo com escala_resolveria tem nota`, () => {
      const passo = pesquisa.passos.find((p) =>
        p.perguntas.some((q) => q.id === 'escala_resolveria')
      )!;
      expect(passo.nota).toBeTruthy();
      // tem de descrever o produto, não só anunciar que vem pergunta
      expect(passo.nota).toMatch(/pagamento retido/);
      expect(passo.nota).toMatch(/avaliação pública/);
    });
  }
});

describe('"Outro" não perde a resposta', () => {
  const comOutro = [
    [estabelecimento, 'tipo'],
    [estabelecimento, 'como_resolve'],
    [estabelecimento, 'avalia_presencial'],
    [estabelecimento, 'avalia_remoto'],
    [profissional, 'area'],
    [profissional, 'canais'],
  ] as const;

  for (const [pesquisa, id] of comOutro) {
    it(`[${pesquisa.form}] ${id} abre campo de texto no "outro"`, () => {
      const q = achar(pesquisa, id);
      expect(q).toHaveProperty('com_texto_em', 'outro');
      // a opção referenciada precisa existir de verdade
      const opcoes = (q as { opcoes: { v: string }[] }).opcoes;
      expect(opcoes.map((o) => o.v)).toContain('outro');
    });
  }

  it('o texto do "outro" viaja no jsonb', () => {
    const linha = montarLinha(
      estabelecimento,
      {
        tipo: 'outro',
        tipo_outro: '  Food truck  ',
        cidade: 'Joinville',
        modo: 'presencial',
        vezes_ano: 'pico',
      },
      { submissionId: 'x', canal: '', trilha: 'presencial', segundos: 90, userAgent: 'u' }
    );
    expect(linha.respostas).toHaveProperty('tipo_outro', 'Food truck');
  });

  it('texto do "outro" de pergunta escondida não viaja', () => {
    const linha = montarLinha(
      estabelecimento,
      {
        modo: 'presencial',
        vezes_ano: 'nunca',
        avalia_presencial: ['outro'],
        avalia_presencial_outro: 'nao deveria ir',
      },
      { submissionId: 'x', canal: '', trilha: 'presencial', segundos: 90, userAgent: 'u' }
    );
    expect(linha.respostas).not.toHaveProperty('avalia_presencial_outro');
  });
});

describe('redação sem ambiguidade', () => {
  it('a escala de dor não pode ser lida como "traz trabalho"', () => {
    const q = achar(estabelecimento, 'escala_trabalho');
    expect(q.label).not.toMatch(/te dá trabalho/);
    expect(q.label).toMatch(/dor de cabeça/);
  });

  it('nenhuma pergunta usa referente vago', () => {
    for (const pesquisa of [estabelecimento, profissional]) {
      for (const q of todas(pesquisa)) {
        expect(q.label).not.toMatch(/essa necessidade|trabalham aí/);
      }
    }
  });

  it('a pergunta de avaliação não presume varejo', () => {
    const q = achar(estabelecimento, 'avalia_presencial');
    expect(q.label).not.toMatch(/no caixa/);
  });

  it('o raio pergunta "até que distância"', () => {
    expect(achar(profissional, 'raio').label).toMatch(/^Até que distância/);
  });
});

describe('toda referência de condicional aponta para pergunta existente', () => {
  for (const pesquisa of [estabelecimento, profissional]) {
    it(`[${pesquisa.form}]`, () => {
      const existentes = new Set(todas(pesquisa).map((q) => q.id));
      for (const q of todas(pesquisa)) {
        for (const regra of [q.so_se_resp, q.exceto_resp]) {
          if (!regra) continue;
          expect(existentes, `${q.id} aponta para ${regra.id}`).toContain(regra.id);

          // e os valores citados têm de existir entre as opções daquela pergunta
          const alvo = achar(pesquisa, regra.id);
          if ('opcoes' in alvo) {
            const valores = alvo.opcoes.map((o) => o.v);
            for (const v of regra.em) {
              expect(valores, `${q.id} cita ${regra.id}=${v}`).toContain(v);
            }
          }
        }
      }
    });
  }
});

describe('a pergunta que decide a trilha não pode ser escondida', () => {
  for (const pesquisa of [estabelecimento, profissional]) {
    it(`[${pesquisa.form}]`, () => {
      const ramifica = todas(pesquisa).find((q) => q.tipo === 'radio' && q.ramifica)!;
      expect(ramifica.so_se).toBeUndefined();
      expect(ramifica.so_se_resp).toBeUndefined();
      expect(ramifica.exceto_resp).toBeUndefined();
      expect(visivel(ramifica, '', {})).toBe(true);
    });
  }
});
