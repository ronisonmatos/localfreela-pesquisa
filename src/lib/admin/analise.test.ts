import { describe, expect, it } from 'vitest';
import {
  analisar,
  contar,
  contarNaOrdem,
  filtrar,
  media,
  mediana,
  opcoesDe,
  perguntasAbertas,
  rotuloDe,
  type Linha,
} from './analise';

const base: Linha = {
  id: 1,
  submission_id: 'a',
  form: 'estabelecimento',
  trilha: 'presencial',
  cidade: 'Joinville',
  canal: 'acij',
  comissao_pct: 10,
  comissao_sem: false,
  comissao_teto: '>15',
  escala_resolveria: 4,
  contato_nome: null,
  contato_valor: null,
  consentimento: false,
  respostas: {},
  segundos: 190,
  user_agent: 'teste',
  created_at: '2026-10-05T12:00:00Z',
};

const linha = (p: Partial<Linha>, n = 1): Linha => ({
  ...base,
  id: n,
  submission_id: 'sub-' + n,
  ...p,
});

describe('estatística', () => {
  it('média arredonda a uma casa', () => {
    expect(media([10, 15, 8])).toBe(11);
    expect(media([1, 2])).toBe(1.5);
  });

  it('média e mediana de lista vazia são nulas, não zero', () => {
    // zero significaria "responderam 0%", que é coisa diferente de "ninguém respondeu"
    expect(media([])).toBeNull();
    expect(mediana([])).toBeNull();
  });

  it('mediana resiste a um extremo que a média não resiste', () => {
    const ns = [8, 10, 12, 100];
    expect(mediana(ns)).toBe(11);
    expect(media(ns)).toBe(32.5);
  });

  it('mediana de lista par é a média dos dois do meio', () => {
    expect(mediana([5, 10, 20, 25])).toBe(15);
  });
});

describe('contagem', () => {
  it('ordena da maior para a menor', () => {
    const r = contar(['a', 'b', 'a', 'c', 'a', 'b']);
    expect(r.map((f) => f.rotulo)).toEqual(['a', 'b', 'c']);
    expect(r[0].n).toBe(3);
  });

  it('agrupa vazio e nulo sob o mesmo rótulo', () => {
    const r = contar([null, '', '  ', 'x'], 'sem resposta');
    expect(r.find((f) => f.rotulo === 'sem resposta')?.n).toBe(3);
  });

  it('na ordem fixa, mantém a faixa vazia visível', () => {
    const r = contarNaOrdem(['a', 'a'], [
      { v: 'a', t: 'Primeira' },
      { v: 'b', t: 'Segunda' },
    ]);
    expect(r).toEqual([
      { rotulo: 'Primeira', n: 2 },
      { rotulo: 'Segunda', n: 0 },
    ]);
  });
});

describe('filtros', () => {
  const linhas = [
    linha({ form: 'estabelecimento', trilha: 'presencial', canal: 'acij' }, 1),
    linha({ form: 'profissional', trilha: 'remoto', canal: null }, 2),
    linha({ form: 'estabelecimento', trilha: 'remoto', canal: 'cdl', segundos: 5 }, 3),
  ];

  it('esconde as rápidas por padrão', () => {
    expect(filtrar(linhas, {}).map((l) => l.id)).toEqual([1, 2]);
  });

  it('mostra as rápidas quando pedido', () => {
    expect(filtrar(linhas, { incluirSuspeitas: true })).toHaveLength(3);
  });

  it('filtra por público e por trilha', () => {
    expect(filtrar(linhas, { form: 'profissional' }).map((l) => l.id)).toEqual([2]);
    expect(filtrar(linhas, { trilha: 'presencial' }).map((l) => l.id)).toEqual([1]);
  });

  it('canal nulo é filtrável como "(link direto)"', () => {
    expect(filtrar(linhas, { canal: '(link direto)' }).map((l) => l.id)).toEqual([2]);
  });
});

describe('rótulos vindos do questionário', () => {
  it('traduz o código gravado para o texto que a pessoa leu', () => {
    expect(rotuloDe('estabelecimento', 'tipo', 'alimentacao')).toBe(
      'Restaurante, bar ou cafeteria'
    );
    expect(rotuloDe('profissional', 'modo', 'remoto')).toBe('Remoto, faço de qualquer lugar');
  });

  it('código desconhecido volta como veio, em vez de sumir', () => {
    expect(rotuloDe('estabelecimento', 'tipo', 'inexistente')).toBe('inexistente');
    expect(rotuloDe('form_que_nao_existe', 'tipo', 'x')).toBe('x');
  });

  it('as faixas de teto vêm na ordem do questionário, não alfabética', () => {
    const o = opcoesDe('estabelecimento', 'comissao_teto');
    expect(o.map((x) => x.v)).toEqual(['>5', '>10', '>15', '>20', '>30', 'nao_eh']);
  });

  it('encontra as perguntas abertas de cada formulário', () => {
    expect(perguntasAbertas('estabelecimento').map((q) => q.id)).toEqual([
      'ultima_vez',
      'o_que_da_errado',
      'o_que_faria_confiar',
    ]);
    expect(perguntasAbertas('profissional').map((q) => q.id)).toContain('problema_qual');
  });
});

describe('análise', () => {
  const linhas = [
    linha({ comissao_pct: 8, escala_resolveria: 5, respostas: { escala_trabalho: 5 } }, 1),
    linha({ comissao_pct: 12, escala_resolveria: 3, respostas: { escala_trabalho: 3 } }, 2),
    linha({ comissao_pct: null, comissao_sem: true, escala_resolveria: 1 }, 3),
  ];

  it('separa quem não pagaria de quem não respondeu', () => {
    const a = analisar(linhas);
    expect(a.comComissao).toBe(2);
    expect(a.semComissao).toBe(1);
    expect(a.comissaoMedia).toBe(10);
    expect(a.comissaoMediana).toBe(10);
  });

  it('quem não pagaria não entra na média', () => {
    // se entrasse como zero, a média cairia para 6.7 e mentiria sobre o mercado
    expect(analisar(linhas).comissaoMedia).toBe(10);
  });

  it('a distribuição soma o total de respostas', () => {
    const a = analisar(linhas);
    const soma = a.distComissao.reduce((s, f) => s + f.n, 0);
    expect(soma).toBe(3);
    expect(a.distComissao.find((f) => f.rotulo === 'não pagaria')?.n).toBe(1);
    expect(a.distComissao.find((f) => f.rotulo === '6 a 10%')?.n).toBe(1);
  });

  it('a escala de 1 a 5 mostra as cinco notas, mesmo as zeradas', () => {
    const a = analisar(linhas);
    expect(a.distResolveria).toHaveLength(5);
    expect(a.distResolveria.map((f) => f.rotulo)).toEqual(['1', '2', '3', '4', '5']);
    expect(a.distResolveria.find((f) => f.rotulo === '4')?.n).toBe(0);
  });

  it('a dor sai do jsonb e só conta quem respondeu', () => {
    expect(analisar(linhas).dorMedia).toBe(4);
  });

  it('agrupa as respostas abertas pelo enunciado da pergunta', () => {
    const a = analisar([
      linha({ respostas: { o_que_da_errado: 'A pessoa não aparece.' } }, 1),
      linha({ respostas: { o_que_da_errado: '   ' } }, 2),
    ]);
    const g = a.abertas.find((x) => x.pergunta.startsWith('O que mais dá errado'));
    expect(g?.itens).toHaveLength(1);
    expect(g?.itens[0].texto).toBe('A pessoa não aparece.');
  });

  it('lista contatos com o interesse já traduzido', () => {
    const a = analisar([
      linha(
        {
          contato_nome: 'Bar do Zé',
          contato_valor: '47 98888-1111',
          consentimento: true,
          respostas: { topa_piloto: 'talvez' },
        },
        1
      ),
    ]);
    expect(a.contatos).toHaveLength(1);
    expect(a.contatos[0].interesse).toBe('Talvez, quero saber mais antes');
  });

  it('não lista quem não deixou contato', () => {
    expect(analisar(linhas).contatos).toHaveLength(0);
  });

  it('cidade é agrupada sem diferenciar maiúscula', () => {
    const a = analisar([
      linha({ cidade: 'Joinville' }, 1),
      linha({ cidade: 'joinville' }, 2),
      linha({ cidade: ' JOINVILLE ' }, 3),
    ]);
    expect(a.distCidade).toHaveLength(1);
    expect(a.distCidade[0].n).toBe(3);
  });

  it('base vazia não quebra nem inventa zero', () => {
    const a = analisar([]);
    expect(a.total).toBe(0);
    expect(a.comissaoMedia).toBeNull();
    expect(a.resolveriaMedia).toBeNull();
    expect(a.contatos).toEqual([]);
    expect(a.ultima).toBeNull();
  });
});
