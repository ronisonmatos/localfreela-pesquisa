import type { Pesquisa } from './tipos';

/* Pesquisa com profissionais — derivada do roteiro "Quem presta serviço"
   do mapa de validação. Os pontos sensíveis do roteiro são a comissão e o
   registro de início e fim: as duas perguntas são feitas sem defender o
   produto, porque uma reação ruim aqui é informação, não objeção.

   Igual ao outro formulário: "comissao_justa" (campo livre) e "comissao_teto"
   (faixas) em passos diferentes, para não ancorar a resposta. */
export const profissional: Pesquisa = {
  form: 'profissional',
  fim:
    'Suas respostas foram registradas. É com elas que decidimos como a ' +
    'comissão e o pagamento vão funcionar — e se você deixou contato, ' +
    'avisamos quando abrir o acesso antecipado.',

  passos: [
    {
      nome: 'Você',
      perguntas: [
        {
          id: 'area',
          tipo: 'radio',
          obrigatoria: true,
          com_texto_em: 'outro',
          label: 'Qual é a sua área principal de trabalho?',
          opcoes: [
            { v: 'atendimento', t: 'Atendimento ou caixa' },
            { v: 'estoque', t: 'Reposição e estoque' },
            { v: 'cozinha', t: 'Garçom, cozinha ou copa' },
            { v: 'limpeza', t: 'Limpeza e conservação' },
            { v: 'eventos', t: 'Montagem e produção de eventos' },
            { v: 'vendas', t: 'Vendas ou promotor' },
            { v: 'entregas', t: 'Entregas' },
            { v: 'tecnologia', t: 'Tecnologia e programação' },
            { v: 'design', t: 'Design' },
            { v: 'marketing', t: 'Marketing e conteúdo' },
            { v: 'administrativo', t: 'Administrativo e financeiro' },
            { v: 'redacao', t: 'Redação ou tradução' },
            { v: 'outro', t: 'Outra área' },
          ],
        },
        {
          id: 'cidade',
          tipo: 'texto',
          obrigatoria: true,
          label: 'Em que cidade você está?',
          placeholder: 'Joinville',
          autocomplete: 'address-level2',
        },
        {
          id: 'modo',
          tipo: 'radio',
          obrigatoria: true,
          ramifica: true,
          label: 'Seu trabalho é presencial ou remoto?',
          opcoes: [
            { v: 'presencial', t: 'Presencial, preciso estar no local' },
            { v: 'remoto', t: 'Remoto, faço de qualquer lugar' },
            { v: 'ambos', t: 'Os dois, depende do trabalho' },
          ],
        },
        {
          id: 'sustento',
          tipo: 'radio',
          obrigatoria: true,
          label: 'Quanto do seu sustento vem de trabalho avulso ou freela?',
          opcoes: [
            { v: 'principal', t: 'É a minha renda principal' },
            { v: 'metade', t: 'Mais ou menos metade' },
            { v: 'extra', t: 'É renda extra' },
            { v: 'nenhum', t: 'Nunca peguei trabalho avulso' },
          ],
        },
      ],
    },

    {
      nome: 'Como é hoje',
      perguntas: [
        {
          id: 'canais',
          tipo: 'checkbox',
          obrigatoria: true,
          com_texto_em: 'outro',
          label: 'Como você consegue seus trabalhos hoje?',
          ajuda: 'Pode marcar mais de um.',
          opcoes: [
            { v: 'indicacao', t: 'Indicação de quem me conhece' },
            { v: 'whatsapp', t: 'Grupo de WhatsApp' },
            { v: 'redes', t: 'Redes sociais' },
            { v: 'getninjas', t: 'GetNinjas' },
            { v: 'workana', t: 'Workana' },
            { v: '99freelas', t: '99Freelas' },
            { v: 'closeer', t: 'Closeer' },
            { v: 'switch', t: 'Switch' },
            { v: 'helppi', t: 'Helppi' },
            { v: 'agencia', t: 'Agência ou empresa de terceirização' },
            { v: 'presencial', t: 'Vou pessoalmente oferecer meu trabalho' },
            { v: 'outro', t: 'Outro canal' },
            { v: 'nenhum', t: 'Não consigo trabalho avulso hoje', exclusivo: true },
          ],
        },
        {
          id: 'frequencia',
          tipo: 'radio',
          obrigatoria: true,
          label: 'Com que frequência você pega trabalho avulso?',
          opcoes: [
            { v: 'semanal', t: 'Toda semana' },
            { v: 'mensal', t: 'Algumas vezes por mês' },
            { v: '6-11ano', t: '6 a 11 vezes por ano' },
            { v: '1-5ano', t: '1 a 5 vezes por ano' },
            { v: 'pico', t: 'Só na época de pico' },
            { v: 'nunca', t: 'Nunca peguei' },
          ],
        },
        {
          id: 'pesa',
          tipo: 'checkbox',
          max: 2,
          exceto_resp: { id: 'frequencia', em: ['nunca'] },
          label: 'O que mais pesa na hora de aceitar ou não um trabalho?',
          ajuda: 'Escolha no máximo 2, as que pesam de verdade.',
          opcoes: [
            { v: 'valor', t: 'O valor pago' },
            { v: 'distancia', t: 'A distância até o local' },
            { v: 'garantia', t: 'A garantia de que vou receber' },
            { v: 'horario', t: 'O horário' },
            { v: 'quem', t: 'Quem está contratando' },
            { v: 'tarefa', t: 'O tipo de tarefa' },
          ],
        },
        {
          id: 'problema_receber',
          tipo: 'radio',
          obrigatoria: true,
          exceto_resp: { id: 'frequencia', em: ['nunca'] },
          label: 'Já teve problema para receber, ou com combinado não cumprido?',
          opcoes: [
            { v: 'sim_varias', t: 'Sim, mais de uma vez' },
            { v: 'sim_uma', t: 'Sim, uma vez' },
            { v: 'nunca', t: 'Nunca tive' },
          ],
        },
        {
          id: 'problema_qual',
          tipo: 'textarea',
          so_se_resp: { id: 'problema_receber', em: ['sim_varias', 'sim_uma'] },
          label: 'Conte o que aconteceu, e como você resolveu.',
          ajuda: 'Do seu jeito, sem formalidade. É a resposta que mais nos ajuda.',
          placeholder: 'Combinamos um valor e depois…',
        },
      ],
    },

    {
      nome: 'Confiança e comissão',
      nota:
        'Lembrando o que estamos construindo: um app que mostra trabalhos ' +
        'disponíveis perto de você, com pagamento retido até o serviço ' +
        'terminar e avaliação pública dos dois lados. As próximas perguntas ' +
        'são sobre isso.',
      perguntas: [
        {
          id: 'confiar_contratante',
          tipo: 'textarea',
          exceto_resp: { id: 'frequencia', em: ['nunca'] },
          label:
            'O que te faria confiar em quem está contratando, alguém que você nunca viu?',
          placeholder: 'Eu aceitaria se…',
        },
        {
          id: 'registro_ponto',
          tipo: 'radio',
          obrigatoria: true,
          label:
            'Se o app registrasse o início e o fim do serviço para liberar o seu pagamento, isso:',
          opcoes: [
            { v: 'seguranca', t: 'Me dá mais segurança' },
            { v: 'incomoda', t: 'Me incomoda, parece controle' },
            { v: 'tanto', t: 'Tanto faz' },
            { v: 'depende', t: 'Depende de como funciona' },
          ],
        },
        {
          id: 'avaliar_contratante',
          tipo: 'radio',
          label:
            'Você gostaria de avaliar publicamente quem te contratou, e não só ser avaliado?',
          opcoes: [
            { v: 'sim', t: 'Sim, isso é importante para mim' },
            { v: 'tanto', t: 'Tanto faz' },
            { v: 'nao', t: 'Não, prefiro não avaliar' },
          ],
        },
        {
          id: 'raio',
          tipo: 'radio',
          so_se: 'presencial',
          label: 'Até que distância da sua casa você aceitaria trabalhar?',
          opcoes: [
            { v: '2km', t: 'Até 2 km' },
            { v: '5km', t: 'Até 5 km' },
            { v: '10km', t: 'Até 10 km' },
            { v: '20km', t: 'Até 20 km' },
            { v: 'cidade', t: 'Qualquer lugar da cidade' },
            { v: 'fora', t: 'Outras cidades também' },
          ],
        },
        {
          id: 'trocar_plataforma',
          tipo: 'textarea',
          so_se: 'remoto',
          exceto_resp: { id: 'canais', em: ['nenhum'] },
          label: 'O que te faria trocar os canais que você usa hoje por um app novo?',
          placeholder: 'Eu trocaria se…',
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
            'Qual percentual sobre o valor do serviço você acharia justo que o app ficasse?',
          ajuda:
            'Pode chutar. Não existe resposta certa, e é justamente o seu número que queremos saber.',
          sufixo: '%',
          min: 0,
          max: 100,
          escape: 'Não aceitaria nenhuma comissão',
        },
      ],
    },

    {
      nome: 'Acesso antecipado',
      perguntas: [
        {
          id: 'comissao_teto',
          tipo: 'radio',
          obrigatoria: true,
          label: 'A partir de qual percentual você não usaria o app?',
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
          id: 'quer_acesso',
          tipo: 'radio',
          obrigatoria: true,
          label: 'Quer entrar na lista de acesso antecipado?',
          opcoes: [
            { v: 'sim', t: 'Sim' },
            { v: 'talvez', t: 'Talvez, quero saber mais antes' },
            { v: 'nao', t: 'Não' },
          ],
        },
        {
          id: 'contato',
          tipo: 'contato',
          so_se_resp: { id: 'quer_acesso', em: ['sim', 'talvez'] },
          label: 'Para onde avisamos quando abrir?',
          ajuda: 'Só usamos para falar deste projeto. Pode deixar em branco.',
          rotulos: ['Seu nome', 'WhatsApp ou e-mail'],
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
