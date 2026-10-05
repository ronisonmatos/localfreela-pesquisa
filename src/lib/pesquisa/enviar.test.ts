import { describe, expect, it } from 'vitest';
import { montarLinha, trilhaDe, visivel } from './enviar';
import { estabelecimento } from './estabelecimento';
import { profissional } from './profissional';
import { ESCAPE, type Respostas } from './tipos';

const meta = {
  submissionId: '11111111-1111-1111-1111-111111111111',
  canal: 'acij',
  trilha: 'presencial',
  segundos: 190,
  userAgent: 'teste',
};

const base: Respostas = {
  tipo: 'alimentacao',
  cidade: 'Joinville',
  tamanho: '10-29',
  modo: 'presencial',
  como_resolve: ['indicacao', 'whatsapp'],
  vezes_ano: 'pico',
  tempo_inicio: '1-3dias',
  escala_trabalho: 5,
  avalia_presencial: ['indicacao'],
  escala_resolveria: 4,
  comissao_justa: 8,
  comissao_teto: '>15',
  topa_piloto: 'sim',
};

describe('montarLinha', () => {
  it('preenche as colunas tipadas', () => {
    const l = montarLinha(estabelecimento, base, meta);
    expect(l.form).toBe('estabelecimento');
    expect(l.submission_id).toBe(meta.submissionId);
    expect(l.cidade).toBe('Joinville');
    expect(l.canal).toBe('acij');
    expect(l.trilha).toBe('presencial');
    expect(l.comissao_pct).toBe(8);
    expect(l.comissao_sem).toBe(false);
    expect(l.comissao_teto).toBe('>15');
    expect(l.escala_resolveria).toBe(4);
    expect(l.segundos).toBe(190);
  });

  it('não repete no jsonb o que virou coluna', () => {
    const l = montarLinha(estabelecimento, base, meta);
    for (const promovido of [
      'cidade',
      'comissao_justa',
      'comissao_teto',
      'escala_resolveria',
      'contato',
      'consentimento',
    ]) {
      expect(l.respostas).not.toHaveProperty(promovido);
    }
    expect(l.respostas).toMatchObject({
      tipo: 'alimentacao',
      como_resolve: ['indicacao', 'whatsapp'],
      escala_trabalho: 5,
    });
  });

  it('não envia pergunta que a trilha escondeu', () => {
    const l = montarLinha(estabelecimento, base, meta);
    expect(l.respostas).toHaveProperty('avalia_presencial');
    expect(l.respostas).not.toHaveProperty('avalia_remoto');
  });

  it('separa "não pagaria comissão" de "não respondeu"', () => {
    const l = montarLinha(
      estabelecimento,
      { ...base, comissao_justa: ESCAPE },
      meta
    );
    expect(l.comissao_pct).toBeNull();
    expect(l.comissao_sem).toBe(true);
  });

  it('comissão de 0% é um número, não ausência', () => {
    const l = montarLinha(estabelecimento, { ...base, comissao_justa: 0 }, meta);
    expect(l.comissao_pct).toBe(0);
    expect(l.comissao_sem).toBe(false);
  });

  describe('contato e consentimento', () => {
    const comContato = {
      ...base,
      contato: { nome: '  Bar do Zé  ', contato: ' 47 98888-1111 ' },
    };

    it('grava o contato quando há consentimento, sem espaços nas pontas', () => {
      const l = montarLinha(
        estabelecimento,
        { ...comContato, consentimento: true },
        meta
      );
      expect(l.consentimento).toBe(true);
      expect(l.contato_nome).toBe('Bar do Zé');
      expect(l.contato_valor).toBe('47 98888-1111');
    });

    it('descarta o contato se o consentimento foi desmarcado', () => {
      const l = montarLinha(
        estabelecimento,
        { ...comContato, consentimento: false },
        meta
      );
      expect(l.contato_nome).toBeNull();
      expect(l.contato_valor).toBeNull();
    });

    it('campo em branco vira null, não string vazia', () => {
      // string vazia faria a constraint contato_exige_consentimento recusar a linha
      const l = montarLinha(
        estabelecimento,
        { ...base, contato: { nome: '   ', contato: '' }, consentimento: true },
        meta
      );
      expect(l.contato_nome).toBeNull();
      expect(l.contato_valor).toBeNull();
    });
  });

  it('trunca o user agent no limite da coluna', () => {
    const l = montarLinha(estabelecimento, base, {
      ...meta,
      userAgent: 'x'.repeat(900),
    });
    expect(l.user_agent).toHaveLength(500);
  });

  it('canal vazio vira null', () => {
    const l = montarLinha(estabelecimento, base, { ...meta, canal: '' });
    expect(l.canal).toBeNull();
  });
});

describe('ramificação', () => {
  it('lê a trilha da pergunta marcada como ramifica', () => {
    expect(trilhaDe(estabelecimento, { modo: 'remoto' })).toBe('remoto');
    expect(trilhaDe(profissional, { modo: 'ambos' })).toBe('ambos');
    expect(trilhaDe(estabelecimento, {})).toBe('');
  });

  const raio = profissional.passos
    .flatMap((p) => p.perguntas)
    .find((q) => q.id === 'raio')!;
  const trocar = profissional.passos
    .flatMap((p) => p.perguntas)
    .find((q) => q.id === 'trocar_plataforma')!;

  it('presencial mostra o raio e esconde a troca de plataforma', () => {
    expect(visivel(raio, 'presencial', {})).toBe(true);
    expect(visivel(trocar, 'presencial', {})).toBe(false);
  });

  it('remoto faz o inverso', () => {
    expect(visivel(raio, 'remoto', {})).toBe(false);
    expect(visivel(trocar, 'remoto', {})).toBe(true);
  });

  it('"os dois" mostra as duas', () => {
    expect(visivel(raio, 'ambos', {})).toBe(true);
    expect(visivel(trocar, 'ambos', {})).toBe(true);
  });

  it('sem trilha escolhida, nenhuma das duas aparece', () => {
    expect(visivel(raio, '', {})).toBe(false);
    expect(visivel(trocar, '', {})).toBe(false);
  });

  const problemaQual = profissional.passos
    .flatMap((p) => p.perguntas)
    .find((q) => q.id === 'problema_qual')!;

  it('condicional depende da resposta que a dispara', () => {
    expect(visivel(problemaQual, 'remoto', { problema_receber: 'nunca' })).toBe(false);
    expect(visivel(problemaQual, 'remoto', { problema_receber: 'sim_uma' })).toBe(true);
  });
});

describe('regras de metodologia dos roteiros', () => {
  for (const pesquisa of [estabelecimento, profissional]) {
    const onde = (id: string) =>
      pesquisa.passos.findIndex((p) => p.perguntas.some((q) => q.id === id));

    it(`[${pesquisa.form}] o campo livre da comissão vem antes das faixas, em outro passo`, () => {
      // o roteiro manda não dizer número primeiro: faixas na mesma tela ancorariam
      expect(onde('comissao_teto')).toBeGreaterThan(onde('comissao_justa'));
    });

    it(`[${pesquisa.form}] nenhuma pergunta aberta é obrigatória`, () => {
      const abertas = pesquisa.passos
        .flatMap((p) => p.perguntas)
        .filter((q) => q.tipo === 'textarea' && q.obrigatoria);
      expect(abertas).toEqual([]);
    });
  }
});
