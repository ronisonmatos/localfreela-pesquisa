import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Survey from './Survey';
import { estabelecimento } from '@/lib/pesquisa/estabelecimento';
import { profissional } from '@/lib/pesquisa/profissional';

/* O cliente do Supabase é trocado por um espião: os testes aqui são sobre o
   comportamento da tela, não sobre a rede. A gravação de verdade é coberta
   pelos testes de enviar.ts e pela migration. */
const inserts: unknown[] = [];
let erroDoBanco: { code?: string; message: string } | null = null;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: (linha: unknown) => {
        inserts.push(linha);
        return Promise.resolve({ error: erroDoBanco });
      },
    }),
  }),
}));

beforeEach(() => {
  inserts.length = 0;
  erroDoBanco = null;
  localStorage.clear();
  window.history.replaceState({}, '', '/estabelecimento?src=teste');
});

const u = () => userEvent.setup();
const passo = () => screen.getByText(/Passo \d de 4/).textContent ?? '';
const perguntas = () =>
  Array.from(document.querySelectorAll('[data-q]')).map(
    (e) => (e as HTMLElement).dataset.q
  );

/** Marca uma opção pelo texto visível, dentro da pergunta certa. */
async function escolher(id: string, texto: string | RegExp) {
  const bloco = document.querySelector(`[data-q="${id}"]`) as HTMLElement;
  await u().click(within(bloco).getByText(texto));
}

async function digitar(id: string, texto: string, indice = 0) {
  const bloco = document.querySelector(`[data-q="${id}"]`) as HTMLElement;
  // por seletor, não por papel: input[type=number] é spinbutton, não textbox
  const campos = bloco.querySelectorAll<HTMLElement>(
    'input:not([type=radio]):not([type=checkbox]), textarea'
  );
  await u().type(campos[indice], texto);
}

const continuar = () => u().click(screen.getByRole('button', { name: /Continuar|Enviar/ }));
const voltar = () => u().click(screen.getByRole('button', { name: 'Voltar' }));

/* ---------- passo 1, comum aos testes seguintes ---------- */

async function preencherPasso1(modo = 'Presencial, aqui no estabelecimento') {
  await escolher('tipo', 'Restaurante, bar ou cafeteria');
  await digitar('cidade', 'Joinville');
  await escolher('tamanho', '10 a 29');
  await escolher('modo', modo);
  await continuar();
}

async function preencherPasso2() {
  await escolher('como_resolve', 'Indicação de alguém que eu conheço');
  await escolher('vezes_ano', 'Só na época de pico');
  await escolher('tempo_inicio', '1 a 3 dias');
  await continuar();
}

async function preencherPasso3() {
  await escolher('escala_trabalho', '4');
  await escolher('escala_resolveria', '5');
  await digitar('comissao_justa', '8');
  await continuar();
}

/* ================= validação ================= */

describe('validação das obrigatórias', () => {
  it('barra o avanço e diz quantas faltam', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    expect(passo()).toContain('Passo 1 de 4');

    await continuar();

    expect(passo()).toContain('Passo 1 de 4');
    expect(screen.getByRole('alert')).toHaveTextContent('Faltam 4 respostas acima');
    expect(document.querySelectorAll('[data-invalid="1"]')).toHaveLength(4);
  });

  it('limpa o erro conforme a pessoa responde', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await continuar();
    await escolher('tipo', 'Comércio ou loja de rua');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('deixa passar quando as obrigatórias estão respondidas', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1();
    expect(passo()).toContain('Passo 2 de 4');
  });
});

/* ================= ramificação ================= */

describe('ramificação por trilha', () => {
  it('presencial mostra só a avaliação presencial', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1();
    await preencherPasso2();
    expect(perguntas()).toContain('avalia_presencial');
    expect(perguntas()).not.toContain('avalia_remoto');
  });

  it('remoto mostra só a avaliação remota', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1('Remoto, feito de qualquer lugar');
    await preencherPasso2();
    expect(perguntas()).toContain('avalia_remoto');
    expect(perguntas()).not.toContain('avalia_presencial');
  });

  it('"os dois" mostra as duas', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1('Os dois, depende do serviço');
    await preencherPasso2();
    expect(perguntas()).toContain('avalia_presencial');
    expect(perguntas()).toContain('avalia_remoto');
  });

  it('trocar a trilha redesenha o passo na hora', async () => {
    render(<Survey pesquisa={profissional} />);
    await escolher('area', 'Tecnologia e programação');
    await digitar('cidade', 'Joinville');
    await escolher('modo', 'Presencial, preciso estar no local');
    await escolher('sustento', 'É renda extra');
    await continuar();
    await escolher('canais', 'Indicação de quem me conhece');
    await escolher('frequencia', 'Toda semana');
    await escolher('problema_receber', 'Nunca tive');
    await continuar();

    expect(perguntas()).toContain('raio');
    expect(perguntas()).not.toContain('trocar_plataforma');

    // volta dois passos e troca para remoto
    await voltar();
    await voltar();
    await escolher('modo', 'Remoto, faço de qualquer lugar');
    await continuar();
    await continuar();

    expect(perguntas()).toContain('trocar_plataforma');
    expect(perguntas()).not.toContain('raio');
  });
});

/* ================= condicionais ================= */

describe('perguntas condicionais', () => {
  it('o campo de contato só aparece depois de topar o piloto', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1();
    await preencherPasso2();
    await preencherPasso3();

    expect(perguntas()).not.toContain('contato');
    await escolher('topa_piloto', 'Sim');
    expect(perguntas()).toContain('contato');

    await escolher('topa_piloto', 'Não');
    expect(perguntas()).not.toContain('contato');
  });

  it('o relato do problema só aparece para quem já teve problema', async () => {
    render(<Survey pesquisa={profissional} />);
    await escolher('area', 'Limpeza e conservação');
    await digitar('cidade', 'Joinville');
    await escolher('modo', 'Presencial, preciso estar no local');
    await escolher('sustento', 'É a minha renda principal');
    await continuar();

    expect(perguntas()).not.toContain('problema_qual');
    await escolher('problema_receber', 'Sim, uma vez');
    expect(perguntas()).toContain('problema_qual');
  });
});

/* ================= múltipla escolha ================= */

describe('múltipla escolha', () => {
  it('respeita o limite e avisa', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1();
    await preencherPasso2();

    await escolher('seguranca', 'Avaliação pública, dos dois lados');
    await escolher('seguranca', 'Pagamento retido até o serviço terminar');
    await escolher('seguranca', 'Verificação de identidade do profissional');

    const bloco = document.querySelector('[data-q="seguranca"]') as HTMLElement;
    const marcadas = bloco.querySelectorAll('input:checked');
    expect(marcadas).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('no máximo 2');
  });

  it('a opção exclusiva zera as outras, e vice-versa', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1();

    await escolher('como_resolve', 'Indicação de alguém que eu conheço');
    await escolher('como_resolve', 'Grupo de WhatsApp');
    await escolher('como_resolve', 'Não contrato: a própria equipe absorve');

    const bloco = document.querySelector('[data-q="como_resolve"]') as HTMLElement;
    let marcadas = Array.from(bloco.querySelectorAll<HTMLInputElement>('input:checked'));
    expect(marcadas.map((i) => i.value)).toEqual(['equipe']);

    await escolher('como_resolve', 'Redes sociais: Facebook, Instagram');
    marcadas = Array.from(bloco.querySelectorAll<HTMLInputElement>('input:checked'));
    expect(marcadas.map((i) => i.value)).toEqual(['redes']);
  });
});

/* ================= comissão ================= */

describe('comissão', () => {
  it('a faixa de teto nunca aparece na mesma tela que o campo livre', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1();
    await preencherPasso2();

    expect(perguntas()).toContain('comissao_justa');
    expect(perguntas()).not.toContain('comissao_teto');

    await preencherPasso3();
    expect(perguntas()).toContain('comissao_teto');
    expect(perguntas()).not.toContain('comissao_justa');
  });

  it('o escape desabilita o campo numérico', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1();
    await preencherPasso2();

    const bloco = document.querySelector('[data-q="comissao_justa"]') as HTMLElement;
    const numero = bloco.querySelector('input[type=number]') as HTMLInputElement;
    expect(numero.disabled).toBe(false);

    await escolher('comissao_justa', 'Não pagaria comissão nenhuma');
    expect(numero.disabled).toBe(true);
  });
});

/* ================= envio ================= */

describe('envio', () => {
  async function irAteOFim() {
    await preencherPasso1();
    await preencherPasso2();
    await preencherPasso3();
    await escolher('comissao_teto', 'Mais de 15%');
    await escolher('topa_piloto', 'Sim');
  }

  it('envia e mostra o agradecimento', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await irAteOFim();
    await continuar();

    expect(inserts).toHaveLength(1);
    expect(await screen.findByText('Obrigado de verdade.')).toBeInTheDocument();
  });

  it('manda o canal lido do ?src= e a trilha', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await irAteOFim();
    await continuar();

    const linha = inserts[0] as Record<string, unknown>;
    expect(linha.canal).toBe('teste');
    expect(linha.trilha).toBe('presencial');
    expect(linha.form).toBe('estabelecimento');
    expect(String(linha.submission_id)).toHaveLength(36);
  });

  it('exige consentimento quando a pessoa deixa contato', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await irAteOFim();
    await digitar('contato', 'Bar do Zé', 0);
    await digitar('contato', '47 98888-1111', 1);

    await continuar();
    expect(inserts).toHaveLength(0);
    expect(screen.getByRole('alert')).toHaveTextContent('Falta responder');

    await escolher('consentimento', /Autorizo o contato/);
    await continuar();
    expect(inserts).toHaveLength(1);
    expect((inserts[0] as Record<string, unknown>).contato_nome).toBe('Bar do Zé');
  });

  it('não exige consentimento de quem responde sem deixar contato', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await irAteOFim();
    await continuar();
    expect(inserts).toHaveLength(1);
    expect((inserts[0] as Record<string, unknown>).consentimento).toBe(false);
  });

  it('trata resposta duplicada como sucesso, não como erro', async () => {
    erroDoBanco = { code: '23505', message: 'duplicate key' };
    render(<Survey pesquisa={estabelecimento} />);
    await irAteOFim();
    await continuar();
    expect(await screen.findByText('Obrigado de verdade.')).toBeInTheDocument();
  });

  it('avisa e preserva o rascunho quando a gravação falha', async () => {
    erroDoBanco = { code: '08006', message: 'connection failed' };
    render(<Survey pesquisa={estabelecimento} />);
    await irAteOFim();
    await continuar();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos enviar');
    expect(screen.queryByText('Obrigado de verdade.')).toBeNull();
    expect(localStorage.getItem('lf-pesquisa-estabelecimento')).not.toBeNull();
  });

  it('limpa o rascunho depois de enviar', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await irAteOFim();
    expect(localStorage.getItem('lf-pesquisa-estabelecimento')).not.toBeNull();
    await continuar();
    expect(localStorage.getItem('lf-pesquisa-estabelecimento')).toBeNull();
  });
});

/* ================= rascunho ================= */

describe('rascunho', () => {
  it('retoma no passo em que a pessoa parou, com as respostas', async () => {
    localStorage.setItem(
      'lf-pesquisa-estabelecimento',
      JSON.stringify({
        passo: 1,
        respostas: {
          tipo: 'mercado',
          cidade: 'Jaraguá do Sul',
          tamanho: '5-9',
          modo: 'ambos',
        },
      })
    );
    render(<Survey pesquisa={estabelecimento} />);

    expect(passo()).toContain('Passo 2 de 4');
    expect(screen.getByText('Retomamos de onde você parou.')).toBeInTheDocument();

    await voltar();
    const cidade = document.querySelector(
      '[data-q="cidade"] input'
    ) as HTMLInputElement;
    expect(cidade.value).toBe('Jaraguá do Sul');
  });
});

/* ================= robô ================= */

describe('isca para robô', () => {
  it('campo escondido preenchido: finge sucesso e não grava nada', async () => {
    render(<Survey pesquisa={estabelecimento} />);
    await preencherPasso1();
    await preencherPasso2();
    await preencherPasso3();
    await escolher('comissao_teto', 'Mais de 15%');
    await escolher('topa_piloto', 'Sim');

    const isca = document.getElementById('hp-site') as HTMLInputElement;
    isca.value = 'http://spam.example';

    await continuar();
    expect(inserts).toHaveLength(0);
    expect(await screen.findByText('Obrigado de verdade.')).toBeInTheDocument();
  });
});
