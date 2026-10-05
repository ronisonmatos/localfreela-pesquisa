-- Tabela de respostas das pesquisas do LocalFreela.
--
-- Modelo: colunas tipadas para o que entra na análise (comissão, cidade,
-- canal, trilha) e um jsonb para o resto. As perguntas ainda vão mudar
-- durante a validação; prender cada uma a uma coluna significaria migration
-- a cada ajuste de roteiro, e as respostas já coletadas ficariam com buracos.
--
-- Acesso: quem responde é anônimo e só pode INSERIR. Não existe policy de
-- SELECT para o papel anon, então a chave publishable — que vai pública no
-- bundle do navegador — não lê nenhum contato coletado.

create table public.respostas (
  id              bigint generated always as identity primary key,

  -- gerado no navegador no carregamento da página; o unique é o que faz
  -- um reenvio por rede instável não virar duas linhas
  submission_id   uuid        not null unique,

  form            text        not null,
  trilha          text,
  cidade          text,
  canal           text,

  -- percentual que a pessoa acha justo. Null quando ela escolheu o escape,
  -- e aí comissao_sem fica true: são coisas diferentes de "não respondeu"
  comissao_pct    smallint,
  comissao_sem    boolean     not null default false,
  comissao_teto   text,

  escala_resolveria smallint,

  contato_nome    text,
  contato_valor   text,
  consentimento   boolean     not null default false,

  respostas       jsonb       not null default '{}'::jsonb,

  segundos        integer,
  user_agent      text,
  created_at      timestamptz not null default now(),

  constraint form_conhecido
    check (form in ('estabelecimento', 'profissional')),

  constraint trilha_conhecida
    check (trilha is null or trilha in ('presencial', 'remoto', 'ambos')),

  constraint comissao_pct_plausivel
    check (comissao_pct is null or comissao_pct between 0 and 100),

  constraint escala_de_1_a_5
    check (escala_resolveria is null or escala_resolveria between 1 and 5),

  -- LGPD, no banco e não só na tela: dado de contato só é aceito junto do
  -- consentimento. Se a validação do formulário falhar, o Postgres recusa.
  constraint contato_exige_consentimento
    check (consentimento or (contato_nome is null and contato_valor is null)),

  -- limites de tamanho: sem eles, a chave publishable permite encher a base
  constraint textos_curtos
    check (
      coalesce(length(cidade), 0)        <= 120 and
      coalesce(length(canal), 0)         <= 120 and
      coalesce(length(contato_nome), 0)  <= 200 and
      coalesce(length(contato_valor), 0) <= 200 and
      coalesce(length(user_agent), 0)    <= 500
    ),

  constraint respostas_de_tamanho_razoavel
    check (pg_column_size(respostas) <= 20000)
);

comment on table public.respostas is
  'Respostas das pesquisas de validação. Anônimo insere, nunca lê.';
comment on column public.respostas.comissao_sem is
  'true quando a pessoa escolheu "não pagaria/aceitaria comissão", em vez de dar um número.';
comment on column public.respostas.segundos is
  'Tempo de preenchimento. Abaixo de ~20s é provável robô ou teste.';

-- A consulta natural do painel é "respostas de um público, mais recentes
-- primeiro". Com poucas centenas de linhas o Postgres ignoraria o índice,
-- mas ele já fica pronto para quando a coleta crescer.
create index respostas_form_created_at_idx
  on public.respostas (form, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.respostas enable row level security;

-- Sem esta grant a tabela não aparece na Data API, mesmo com a policy certa:
-- RLS decide quais LINHAS são visíveis, a grant decide se a TABELA é alcançável.
grant insert on table public.respostas to anon;

-- Só INSERT, e só para anon. A ausência de policy de select, update e delete
-- é o que protege os contatos: nega por padrão.
create policy "anonimo pode responder a pesquisa"
  on public.respostas
  for insert
  to anon
  with check (true);
