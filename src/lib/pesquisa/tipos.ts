/** Tipos das perguntas. O conteúdo vem dos Roteiros de pesquisa do mapa de
 *  validação; aqui só ganha tipo. */

export type Trilha = 'presencial' | 'remoto' | 'ambos';

export interface Opcao {
  v: string;
  t: string;
  /** Marca esta opção zera as outras: "não contrato", "nenhum". */
  exclusivo?: boolean;
}

interface Base {
  id: string;
  label: string;
  ajuda?: string;
  obrigatoria?: boolean;
  /** Mostra só nesta trilha; quem respondeu "ambos" vê as duas. */
  so_se?: Exclude<Trilha, 'ambos'>;
  /** Mostra só se outra pergunta foi respondida com um destes valores. */
  so_se_resp?: { id: string; em: string[] };
  /**
   * Esconde se outra pergunta foi respondida com um destes valores. Serve para
   * não perguntar sobre um processo que a pessoa disse não ter: quem nunca
   * contratou não tem "o que dá errado hoje" para contar.
   */
  exceto_resp?: { id: string; em: string[] };
}

export type Pergunta =
  | (Base & {
      tipo: 'radio';
      opcoes: Opcao[];
      ramifica?: boolean;
      /** Valor da opção que abre um campo de texto para dizer qual. */
      com_texto_em?: string;
    })
  | (Base & {
      tipo: 'checkbox';
      opcoes: Opcao[];
      max?: number;
      com_texto_em?: string;
    })
  | (Base & { tipo: 'escala'; max: number; pontas: [string, string] })
  | (Base & { tipo: 'texto'; placeholder?: string; autocomplete?: string })
  | (Base & { tipo: 'textarea'; placeholder?: string })
  | (Base & { tipo: 'numero'; sufixo?: string; min: number; max: number; escape: string })
  | (Base & { tipo: 'contato'; rotulos: [string, string] })
  | (Base & { tipo: 'consentimento'; html: string });

export interface Passo {
  nome: string;
  /**
   * Lembrete mostrado no topo do passo. Usado antes das perguntas de reação,
   * porque a descrição do produto fica no cabeçalho, passos atrás — e ninguém
   * rola para trás no celular para conferir o que é "um app assim".
   */
  nota?: string;
  perguntas: Pergunta[];
}

export interface Pesquisa {
  form: 'estabelecimento' | 'profissional';
  fim: string;
  passos: Passo[];
}

/** Valor de uma resposta em memória. */
export type Resposta =
  | string
  | string[]
  | number
  | boolean
  | { nome?: string; contato?: string }
  | typeof ESCAPE;

/** Marcador de "escolhi a saída" num campo numérico ("não pagaria nada"). */
export const ESCAPE = '__escape__' as const;

/** Sufixo da chave onde fica o texto do "outro, qual?". */
export const SUFIXO_OUTRO = '_outro';

export type Respostas = Record<string, Resposta | undefined>;
