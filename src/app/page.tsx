import Link from 'next/link';

export default function Pagina() {
  return (
    <>
      <header className="masthead">
        <p className="eyebrow">LocalFreela · pesquisa de validação</p>
        <h1>Antes de construir, queremos ouvir.</h1>
        <p className="lede">
          O LocalFreela é um app para conectar quem precisa de reforço rápido a
          quem está disponível e pronto para trabalhar, ali perto. Ainda não
          existe: estamos na parte em que se escuta as pessoas antes de escrever a
          primeira linha de código.
        </p>
        <p className="sub">
          Escolha o lado que é o seu. São 4 minutos, e nenhuma pergunta de venda.
        </p>
      </header>

      <main>
        <div className="cards">
          <Link className="card pres" href="/estabelecimento">
            <p className="tag">QUEM CONTRATA</p>
            <h2>Tenho um estabelecimento</h2>
            <p>
              Você contrata reforço, freela ou temporário — na loja, no
              restaurante, no escritório ou para trabalho remoto.
            </p>
            <span className="go">Responder &rarr;</span>
          </Link>
          <Link className="card rem" href="/profissional">
            <p className="tag">QUEM PRESTA SERVIÇO</p>
            <h2>Eu presto serviço</h2>
            <p>
              Você pega trabalho avulso ou freela — atendimento, cozinha, eventos,
              tecnologia, design, o que for.
            </p>
            <span className="go">Responder &rarr;</span>
          </Link>
        </div>

        <div className="prose" style={{ marginTop: '2.5rem' }}>
          <h2>Por que estamos perguntando</h2>
          <p>
            Já levantamos o mercado e os concorrentes no papel. O que relatório
            nenhum entrega é alguém contando como resolve isso hoje e quanto isso
            dói. É essa parte que decide o que construímos primeiro — e se vale
            construir.
          </p>
          <h2>O que fazemos com as respostas</h2>
          <p>
            Usamos para decidir o escopo do produto. O contato no fim é opcional e
            serve só para avisar quem quiser testar o piloto. Nada é vendido nem
            compartilhado com terceiros — está escrito no{' '}
            <Link href="/privacidade">aviso de privacidade</Link>.
          </p>
        </div>
      </main>
    </>
  );
}
