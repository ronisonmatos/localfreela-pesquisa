import type { Metadata } from 'next';
import Link from 'next/link';
import Barras from '@/components/admin/Barras';
import Numero from '@/components/admin/Numero';
import { clienteAdmin } from '@/lib/supabase/admin';
import { estadoDaSessao } from '@/lib/admin/sessao';
import {
  analisar,
  filtrar,
  SEGUNDOS_SUSPEITOS,
  type Filtros,
  type Linha,
} from '@/lib/admin/analise';
import Login from './Login';
import { sair } from './acoes';

export const metadata: Metadata = {
  title: 'LocalFreela — resultados da pesquisa',
  robots: { index: false, follow: false },
};

/* Lê cookie e banco: nunca pode ser pré-renderizado em build. */
export const dynamic = 'force-dynamic';

export default async function Painel({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sessao = await estadoDaSessao();

  if (sessao === 'sem-senha-configurada') {
    return (
      <>
        <header className="masthead">
          <p className="eyebrow">LocalFreela · painel</p>
          <h1>Painel sem senha configurada</h1>
        </header>
        <div className="err" role="alert">
          A variável de ambiente <code>ADMIN_SENHA</code> não está definida. Sem ela
          o painel não abre — e não abriria para mais ninguém também.
        </div>
      </>
    );
  }

  if (sessao === 'anonimo') {
    return (
      <>
        <header className="masthead">
          <p className="eyebrow">LocalFreela · painel</p>
          <h1>Resultados da pesquisa</h1>
          <p className="sub">Esta página mostra dados pessoais de quem respondeu.</p>
        </header>
        <Login />
      </>
    );
  }

  const sp = await searchParams;
  const um = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? '';
  };

  const filtros: Filtros = {
    form: um('form') || undefined,
    trilha: um('trilha') || undefined,
    canal: um('canal') || undefined,
    incluirSuspeitas: um('suspeitas') === '1',
  };

  const supabase = clienteAdmin();
  const { data, error } = await supabase
    .from('respostas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <>
        <header className="masthead">
          <h1>Não consegui ler as respostas</h1>
        </header>
        <div className="err" role="alert">
          {error.message}
        </div>
      </>
    );
  }

  const todas = (data ?? []) as Linha[];
  const linhas = filtrar(todas, filtros);
  const a = analisar(linhas);

  const canais = [...new Set(todas.map((l) => l.canal ?? '(link direto)'))].sort();
  const qs = new URLSearchParams(
    Object.entries({ ...filtros, suspeitas: filtros.incluirSuspeitas ? '1' : '' })
      .filter(([, v]) => v)
      .map(([k, v]) => [k, String(v)])
  );

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <div className="painel">
      <header className="masthead">
        <p className="eyebrow">LocalFreela · painel</p>
        <h1>Resultados da pesquisa</h1>
        <p className="sub">
          {todas.length} respostas no total · última em {fmt(a.ultima)}
          {a.suspeitas > 0 && !filtros.incluirSuspeitas && (
            <>
              {' · '}
              <strong>{a.suspeitas} ocultas</strong> por preenchimento abaixo de{' '}
              {SEGUNDOS_SUSPEITOS}s
            </>
          )}
        </p>
      </header>

      <Filtro filtros={filtros} canais={canais} />

      <section className="tiles">
        <Numero rotulo="Respostas" valor={a.total} destaque />
        <Numero
          rotulo="Comissão justa — média"
          valor={a.comissaoMedia}
          sufixo="%"
          detalhe={`${a.comComissao} deram um número`}
          destaque
        />
        <Numero
          rotulo="Comissão justa — mediana"
          valor={a.comissaoMediana}
          sufixo="%"
          detalhe="menos sensível a extremos"
          destaque
        />
        <Numero
          rotulo="Não pagariam comissão"
          valor={a.semComissao}
          detalhe={a.total ? `${Math.round((a.semComissao / a.total) * 100)}% do total` : undefined}
        />
        <Numero
          rotulo="Resolveria meu problema"
          valor={a.resolveriaMedia}
          sufixo=" de 5"
          detalhe="média da nota"
        />
        <Numero
          rotulo="Processo atual dá dor de cabeça"
          valor={a.dorMedia}
          sufixo=" de 5"
          detalhe="só estabelecimentos"
        />
        <Numero rotulo="Deixaram contato" valor={a.contatos.length} />
      </section>

      <div className="grafs">
        <Barras
          titulo="Comissão considerada justa"
          nota="Campo livre, agrupado em faixas depois. As faixas não foram mostradas a quem respondeu."
          dados={a.distComissao}
        />
        <Barras
          titulo="Percentual que faria desistir"
          nota="Teto declarado, perguntado numa tela separada da anterior."
          dados={a.distTeto}
        />
        <Barras
          titulo="Quanto resolveria o problema"
          nota="Nota de 1 a 5."
          dados={a.distResolveria}
        />
        <Barras
          titulo="Trilha"
          dados={a.distTrilha}
          cores={{
            presencial: 'var(--graf-pres)',
            remoto: 'var(--graf-rem)',
            ambos: 'var(--graf-neutro)',
          }}
        />
        <Barras titulo="Público" dados={a.porForm} />
        <Barras titulo="Canal de divulgação" dados={a.distCanal} />
        <Barras titulo="Cidade" dados={a.distCidade} />
      </div>

      <section className="bloco">
        <h2>Respostas abertas</h2>
        <p className="sub">
          As frases literais. É aqui que aparece o que nenhuma escala mostra.
        </p>
        {a.abertas.length === 0 ? (
          <p className="graf-vazio">Ninguém escreveu nada ainda.</p>
        ) : (
          a.abertas.map((g) => (
            <div key={g.pergunta} className="aberta">
              <h3>{g.pergunta}</h3>
              <ul>
                {g.itens.map((i, n) => (
                  <li key={n}>
                    <p className="citacao">{i.texto}</p>
                    <p className="citacao-meta">
                      {i.cidade} · {i.trilha} · {fmt(i.quando)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="bloco">
        <h2>Contatos</h2>
        <p className="sub">
          Quem autorizou contato. São dados pessoais: não repasse esta lista.
        </p>
        {a.contatos.length === 0 ? (
          <p className="graf-vazio">Ninguém deixou contato ainda.</p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>WhatsApp ou e-mail</th>
                  <th>Cidade</th>
                  <th>Público</th>
                  <th>Interesse</th>
                  <th>Quando</th>
                </tr>
              </thead>
              <tbody>
                {a.contatos.map((c, n) => (
                  <tr key={n}>
                    <td>{c.nome}</td>
                    <td>{c.valor}</td>
                    <td>{c.cidade}</td>
                    <td>{c.form}</td>
                    <td>{c.interesse}</td>
                    <td>{fmt(c.quando)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="nav">
        <Link className="btn" href={`/admin/csv?${qs.toString()}`} prefetch={false}>
          Baixar CSV
        </Link>
        <span className="spacer" />
        <form action={sair}>
          <button type="submit" className="btn">
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- filtros ---------- */

function Filtro({ filtros, canais }: { filtros: Filtros; canais: string[] }) {
  const link = (mudanca: Record<string, string>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = {
      form: filtros.form ?? '',
      trilha: filtros.trilha ?? '',
      canal: filtros.canal ?? '',
      suspeitas: filtros.incluirSuspeitas ? '1' : '',
      ...mudanca,
    };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin?${s}` : '/admin';
  };

  const grupo = (
    nome: string,
    atual: string,
    chave: string,
    opcoes: { v: string; t: string }[]
  ) => (
    <div className="filtro-grupo">
      <span className="filtro-nome">{nome}</span>
      {opcoes.map((o) => (
        <Link
          key={o.v}
          href={link({ [chave]: o.v })}
          className={'filtro-op' + (atual === o.v ? ' is-ativo' : '')}
          prefetch={false}
        >
          {o.t}
        </Link>
      ))}
    </div>
  );

  return (
    <nav className="filtros" aria-label="Filtros">
      {grupo('Público', filtros.form ?? '', 'form', [
        { v: '', t: 'todos' },
        { v: 'estabelecimento', t: 'estabelecimento' },
        { v: 'profissional', t: 'profissional' },
      ])}
      {grupo('Trilha', filtros.trilha ?? '', 'trilha', [
        { v: '', t: 'todas' },
        { v: 'presencial', t: 'presencial' },
        { v: 'remoto', t: 'remoto' },
        { v: 'ambos', t: 'os dois' },
      ])}
      {canais.length > 1 &&
        grupo(
          'Canal',
          filtros.canal ?? '',
          'canal',
          [{ v: '', t: 'todos' }, ...canais.map((c) => ({ v: c, t: c }))]
        )}
      {grupo('Teste', filtros.incluirSuspeitas ? '1' : '', 'suspeitas', [
        { v: '', t: 'ocultar rápidas' },
        { v: '1', t: 'mostrar todas' },
      ])}
    </nav>
  );
}
