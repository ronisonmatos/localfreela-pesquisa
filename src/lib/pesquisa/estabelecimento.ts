import type { Pesquisa } from './tipos';

/* Pesquisa com estabelecimentos — derivada do roteiro "Quem contrata"
   do mapa de validação. Fechadas, com três abertas nos pontos em que o
   roteiro manda registrar frase literal.

   Regra que não pode ser quebrada: "comissao_justa" (campo livre) e
   "comissao_teto" (faixas) ficam em passos diferentes. As faixas na mesma
   tela ancorariam a resposta, e o percentual é decisão aberta do projeto. */
export const estabelecimento: Pesquisa = {
  form: 'estabelecimento',
  fim:
    'Suas respostas foram registradas. Elas entram direto na pesquisa que vai ' +
    'definir o que construímos primeiro — e se você deixou contato, avisamos ' +
    'quando o piloto estiver de pé.',

  passos: [
    {
      nome: 'Seu negócio',
      perguntas: [
        {
          id: 'tipo',
          tipo: 'radio',
          obrigatoria: true,
          com_texto_em: 'outro',
          label: 'Que tipo de estabelecimento é o seu?',
          opcoes: [
            { v: 'comercio', t: 'Comércio ou loja de rua' },
            { v: 'shopping', t: 'Loja em shopping' },
            { v: 'mercado', t: 'Supermercado ou mercado' },
            { v: 'alimentacao', t: 'Restaurante, bar ou cafeteria' },
            { v: 'hotel', t: 'Hotel ou pousada' },
            { v: 'servicos', t: 'Serviços: salão, oficina, clínica' },
            { v: 'eventos', t: 'Eventos' },
            { v: 'tecnologia', t: 'Escritório ou empresa de tecnologia' },
            { v: 'industria', t: 'Indústria' },
            { v: 'outro', t: 'Outro' },
          ],
        },
        {
          id: 'cidade',
          tipo: 'texto',
          obrigatoria: true,
          label: 'Em que cidade vocês ficam?',
          placeholder: 'Joinville',
          autocomplete: 'address-level2',
        },
        {
          id: 'tamanho',
          tipo: 'radio',
          obrigatoria: true,
          label: 'Quantas pessoas trabalham no seu negócio hoje?',
          opcoes: [
            { v: '1', t: 'Só eu' },
            { v: '2-4', t: '2 a 4' },
            { v: '5-9', t: '5 a 9' },
            { v: '10-29', t: '10 a 29' },
            { v: '30+', t: '30 ou mais' },
          ],
        },
        {
          id: 'modo',
          tipo: 'radio',
          obrigatoria: true,
          ramifica: true,
          label: 'O reforço que vocês contratam é presencial ou remoto?',
          opcoes: [
            { v: 'presencial', t: 'Presencial, aqui no estabelecimento' },
            { v: 'remoto', t: 'Remoto, feito de qualquer lugar' },
            { v: 'ambos', t: 'Os dois, depende do serviço' },
          ],
        },
      ],
    },

    {
      nome: 'Como é hoje',
      perguntas: [
        {
          id: 'como_resolve',
          tipo: 'checkbox',
          obrigatoria: true,
          com_texto_em: 'outro',
          label: 'Como vocês resolvem hoje, quando precisa de reforço ou freela?',
          ajuda: 'Pode marcar mais de um.',
          opcoes: [
            { v: 'indicacao', t: 'Indicação de alguém que eu conheço' },
            { v: 'whatsapp', t: 'Grupo de WhatsApp' },
            { v: 'redes', t: 'Redes sociais: Facebook, Instagram' },
            { v: 'agencia', t: 'Agência ou empresa de terceirização' },
            { v: 'app', t: 'App ou site de freelancers' },
            { v: 'clt', t: 'Contrato temporário com carteira assinada' },
            { v: 'equipe', t: 'Não contrato: a própria equipe absorve', exclusivo: true },
            { v: 'outro', t: 'Outro jeito' },
          ],
        },
        {
          id: 'vezes_ano',
          tipo: 'radio',
          obrigatoria: true,
          label: 'Com que frequência vocês precisam de reforço ou freela?',
          opcoes: [
            { v: 'semanal', t: 'Toda semana' },
            { v: 'mensal', t: 'Algumas vezes por mês' },
            { v: '6-11ano', t: '6 a 11 vezes por ano' },
            { v: '1-5ano', t: '1 a 5 vezes por ano' },
            { v: 'pico', t: 'Só na época de pico' },
            { v: 'nunca', t: 'Nunca precisei' },
          ],
        },
        {
          id: 'tempo_inicio',
          tipo: 'radio',
          obrigatoria: true,
          exceto_resp: { id: 'vezes_ano', em: ['nunca'] },
          label:
            'Quanto tempo leva, hoje, de "preciso de alguém" até a pessoa começar a trabalhar?',
          opcoes: [
            { v: '<1dia', t: 'Menos de 1 dia' },
            { v: '1-3dias', t: '1 a 3 dias' },
            { v: '1semana', t: 'Cerca de 1 semana' },
            { v: '>1semana', t: 'Mais de 1 semana' },
            { v: 'depende', t: 'Depende muito' },
          ],
        },
        {
          id: 'ultima_vez',
          tipo: 'textarea',
          exceto_resp: { id: 'vezes_ano', em: ['nunca'] },
          label:
            'Conte a última vez que vocês precisaram de alguém rápido. O que aconteceu?',
          ajuda: 'Do seu jeito, sem formalidade. É a resposta que mais nos ajuda.',
          placeholder: 'Foi no fim do ano passado, quando…',
        },
        {
          id: 'o_que_da_errado',
          tipo: 'textarea',
          exceto_resp: { id: 'vezes_ano', em: ['nunca'] },
          label: 'O que mais dá errado nesse processo hoje?',
          placeholder: 'A pessoa não aparece, não sei se posso confiar…',
        },
      ],
    },

    {
      nome: 'Confiança e valor',
      nota:
        'Lembrando o que estamos construindo: um app que mostra profissionais ' +
        'disponíveis perto de você, com avaliação pública dos dois lados e ' +
        'pagamento retido até o serviço terminar. As próximas perguntas são ' +
        'sobre isso.',
      perguntas: [
        {
          id: 'escala_trabalho',
          tipo: 'escala',
          obrigatoria: true,
          max: 5,
          exceto_resp: { id: 'vezes_ano', em: ['nunca'] },
          // "te dá trabalho" era ambíguo numa pesquisa que fala de contratar
          // trabalho: parecia perguntar se o processo TRAZ trabalho.
          label: 'De 1 a 5, quanta dor de cabeça esse processo te dá hoje?',
          pontas: ['nenhuma', 'muita'],
        },
        {
          id: 'avalia_presencial',
          tipo: 'checkbox',
          so_se: 'presencial',
          exceto_resp: { id: 'vezes_ano', em: ['nunca'] },
          com_texto_em: 'outro',
          label:
            'Como você avalia hoje se a pessoa é confiável, antes de deixá-la trabalhando sozinha no seu negócio?',
          ajuda: 'Pode marcar mais de um.',
          opcoes: [
            { v: 'indicacao', t: 'Só indicação de quem eu conheço' },
            { v: 'entrevista', t: 'Conversa ou entrevista presencial' },
            { v: 'documento', t: 'Documento, CPF ou antecedentes' },
            { v: 'experiencia', t: 'Experiência anterior comprovada' },
            { v: 'teste', t: 'Período de teste pago' },
            { v: 'nao_da', t: 'Não tenho como avaliar de verdade', exclusivo: true },
            { v: 'outro', t: 'Outro jeito' },
          ],
        },
        {
          id: 'avalia_remoto',
          tipo: 'checkbox',
          so_se: 'remoto',
          exceto_resp: { id: 'vezes_ano', em: ['nunca'] },
          com_texto_em: 'outro',
          label: 'Como você avalia hoje se o freelancer sabe entregar, antes de contratar?',
          ajuda: 'Pode marcar mais de um.',
          opcoes: [
            { v: 'portfolio', t: 'Portfólio ou trabalhos anteriores' },
            { v: 'teste', t: 'Um teste pago pequeno' },
            { v: 'indicacao', t: 'Indicação de quem eu conheço' },
            { v: 'avaliacao', t: 'Avaliação dele na plataforma' },
            { v: 'entrevista', t: 'Entrevista ou conversa' },
            { v: 'nao_da', t: 'Não tenho como avaliar de verdade', exclusivo: true },
            { v: 'outro', t: 'Outro jeito' },
          ],
        },
        {
          id: 'o_que_faria_confiar',
          tipo: 'textarea',
          label:
            'Se existisse um app com profissionais avaliados e disponíveis agora, o que faria você confiar nele?',
          placeholder: 'Eu confiaria se…',
        },
        {
          id: 'seguranca',
          tipo: 'checkbox',
          max: 2,
          label: 'O que mais te daria segurança para usar um app assim?',
          ajuda: 'Escolha no máximo 2, as que pesam de verdade.',
          opcoes: [
            { v: 'avaliacao', t: 'Avaliação pública, dos dois lados' },
            { v: 'retido', t: 'Pagamento retido até o serviço terminar' },
            { v: 'identidade', t: 'Verificação de identidade do profissional' },
            { v: 'suporte', t: 'Suporte de verdade se der problema' },
            { v: 'contrato', t: 'Contrato formal a cada serviço' },
          ],
        },
        {
          id: 'escala_resolveria',
          tipo: 'escala',
          obrigatoria: true,
          max: 5,
          label: 'De 1 a 5, quanto um app assim resolveria o seu problema?',
          pontas: ['não resolveria', 'resolveria por completo'],
        },
        {
          id: 'comissao_justa',
          tipo: 'numero',
          obrigatoria: true,
          label:
            'Qual percentual sobre o valor do serviço você acharia justo pagar ao app?',
          ajuda:
            'Pode chutar. Não existe resposta certa, e é justamente o seu número que queremos saber.',
          sufixo: '%',
          min: 0,
          max: 100,
          escape: 'Não pagaria comissão nenhuma',
        },
      ],
    },

    {
      nome: 'Comissão e piloto',
      perguntas: [
        {
          id: 'comissao_teto',
          tipo: 'radio',
          obrigatoria: true,
          label: 'A partir de qual percentual você desistiria de usar?',
          opcoes: [
            { v: '>5', t: 'Mais de 5%' },
            { v: '>10', t: 'Mais de 10%' },
            { v: '>15', t: 'Mais de 15%' },
            { v: '>20', t: 'Mais de 20%' },
            { v: '>30', t: 'Mais de 30%' },
            { v: 'nao_eh', t: 'O percentual não é o que me impede' },
          ],
        },
        {
          id: 'pagamento_quando',
          tipo: 'radio',
          label: 'Você prefere pagar quando?',
          opcoes: [
            { v: 'antes', t: 'Antes do serviço começar' },
            { v: 'depois', t: 'Depois do serviço concluído' },
            { v: 'retido', t: 'Retido no app, liberado na conclusão' },
            { v: 'tanto', t: 'Tanto faz' },
          ],
        },
        {
          id: 'topa_piloto',
          tipo: 'radio',
          obrigatoria: true,
          label: 'Toparia ser um dos primeiros a testar, sem custo nenhum?',
          opcoes: [
            { v: 'sim', t: 'Sim' },
            { v: 'talvez', t: 'Talvez, quero saber mais antes' },
            { v: 'nao', t: 'Não' },
          ],
        },
        {
          id: 'contato',
          tipo: 'contato',
          so_se_resp: { id: 'topa_piloto', em: ['sim', 'talvez'] },
          label: 'Para onde avisamos quando o piloto estiver pronto?',
          ajuda: 'Só usamos para falar deste projeto. Pode deixar em branco.',
          rotulos: ['Seu nome e o do estabelecimento', 'WhatsApp ou e-mail'],
        },
        {
          id: 'consentimento',
          tipo: 'consentimento',
          label: 'Consentimento',
          html:
            'Autorizo o contato sobre este projeto e o uso das minhas respostas ' +
            'na pesquisa. Li o <a href="/privacidade" target="_blank" ' +
            'rel="noopener">aviso de privacidade</a>.',
        },
      ],
    },
  ],
};
