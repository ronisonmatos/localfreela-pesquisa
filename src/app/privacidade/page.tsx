import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'LocalFreela — aviso de privacidade da pesquisa',
};

export default function Pagina() {
  return (
    <>
      <header className="masthead">
        <p className="eyebrow">LocalFreela · pesquisa de validação</p>
        <h1>Aviso de privacidade</h1>
        <p className="lede">
          Este aviso vale para as duas páginas de pesquisa do projeto LocalFreela.
          Vale só para a pesquisa — o app ainda não existe, e quando existir terá
          política própria.
        </p>
      </header>

      <main className="prose">
        <h2>Quem está coletando</h2>
        <p>
          O projeto LocalFreela, em fase de validação, conduzido por Ronison Matos
          e sócio. O projeto ainda não tem pessoa jurídica constituída; os
          responsáveis pelo tratamento dos dados são os próprios autores da
          pesquisa, pelo contato no fim desta página.
        </p>

        <h2>Que dados são coletados</h2>
        <ul>
          <li>
            <strong>Suas respostas</strong> às perguntas da pesquisa, incluindo
            cidade, área de atuação e as respostas escritas por você.
          </li>
          <li>
            <strong>Nome e WhatsApp ou e-mail</strong>, apenas se você preencher o
            campo de contato no último passo. Esse campo é opcional.
          </li>
          <li>
            <strong>Dados técnicos do envio</strong>: data e hora, identificação do
            navegador, quanto tempo levou para responder, e de qual canal de
            divulgação você chegou (o parâmetro <code>src</code> do link).
          </li>
        </ul>
        <p>
          Não coletamos CPF, CNPJ, localização por GPS, nem dado de pagamento. Não
          há cookies de rastreamento nem ferramenta de analytics nestas páginas. As
          respostas parcialmente preenchidas ficam salvas apenas no seu próprio
          navegador, para você poder retomar, e são apagadas quando você envia.
        </p>

        <h2>Para que usamos</h2>
        <ul>
          <li>
            Entender como as pessoas resolvem contratação de trabalho avulso hoje,
            e decidir o que o produto precisa fazer.
          </li>
          <li>
            Avisar você quando houver um piloto para testar, se você deixou contato
            e autorizou.
          </li>
        </ul>
        <p>
          As respostas podem aparecer de forma <strong>agregada e anônima</strong>{' '}
          em apresentações do projeto — por exemplo, &ldquo;70% dos estabelecimentos
          levam mais de 3 dias para encontrar alguém&rdquo;. Frases escritas por
          você só são citadas sem qualquer identificação.
        </p>

        <h2>Base legal</h2>
        <p>
          Para as respostas da pesquisa, o <strong>legítimo interesse</strong> em
          pesquisa de mercado, com dados tratados de forma agregada. Para nome e
          contato, o seu <strong>consentimento</strong>, dado na caixa que você
          marca antes de enviar. Você pode retirar o consentimento quando quiser,
          pelo contato abaixo, sem precisar justificar.
        </p>

        <h2>Onde ficam e com quem compartilhamos</h2>
        <p>
          Com ninguém. As respostas ficam num banco de dados Postgres gerenciado
          pela Supabase, acessível apenas aos dois responsáveis pelo projeto, com
          regras que impedem qualquer visitante de ler o que foi respondido por
          outra pessoa. As páginas são hospedadas na Vercel. Supabase e Vercel
          atuam como operadores de infraestrutura. Não vendemos, não cedemos e não
          usamos seus dados para anúncio.
        </p>

        <h2>Por quanto tempo guardamos</h2>
        <p>
          As respostas da pesquisa ficam guardadas por até 24 meses a contar do
          envio, prazo em que a decisão de produto já terá sido tomada. Nome e
          contato são apagados assim que você pedir, ou quando o piloto encerrar e
          você não tiver se tornado usuário.
        </p>

        <h2>Seus direitos</h2>
        <p>
          A LGPD te dá direito a confirmar o tratamento, acessar seus dados,
          corrigi-los, pedir anonimização ou exclusão, revogar o consentimento e
          saber com quem foram compartilhados. Para exercer qualquer um deles,
          escreva para o contato abaixo. Respondemos em até 15 dias.
        </p>

        <h2>Contato</h2>
        <p>
          Dúvida, correção ou pedido de exclusão:{' '}
          <strong>ronisonmaria@gmail.com</strong>
        </p>
        <p>
          Ao pedir exclusão, diga a cidade e a data aproximada em que respondeu — é
          como localizamos seu registro, já que a pesquisa não exige identificação.
        </p>

        <p style={{ marginTop: '2.5rem' }}>
          <Link className="btn" href="/">
            Voltar para a pesquisa
          </Link>
        </p>
      </main>
    </>
  );
}
