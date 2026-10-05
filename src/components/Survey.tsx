'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ESCAPE,
  SUFIXO_OUTRO,
  type Pergunta,
  type Pesquisa,
  type Respostas,
} from '@/lib/pesquisa/tipos';
import { enviar, trilhaDe, visivel } from '@/lib/pesquisa/enviar';

type Estado = 'preenchendo' | 'enviando' | 'pronto' | 'erro';

/* Fora do componente de propósito: relógio e sorteio são impuros, e chamá-los
   durante a renderização produziria valor diferente a cada redesenho. */
const agora = () => Date.now();

const segundosDesde = (t: number) => Math.round((agora() - t) / 1000);

const novoId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${agora()}-${Math.random().toString(36).slice(2)}`;

export default function Survey({ pesquisa }: { pesquisa: Pesquisa }) {
  const [respostas, setRespostas] = useState<Respostas>({});
  const [passo, setPasso] = useState(0);
  const [estado, setEstado] = useState<Estado>('preenchendo');
  const [erro, setErro] = useState('');
  const [invalidas, setInvalidas] = useState<string[]>([]);
  const [retomado, setRetomado] = useState(false);

  const chave = `lf-pesquisa-${pesquisa.form}`;
  const inicio = useRef(0);
  const submissionId = useRef('');
  const honeypot = useRef<HTMLInputElement>(null);
  const topo = useRef<HTMLDivElement>(null);

  /* ---------- rascunho ---------- */

  useEffect(() => {
    inicio.current = agora();
    submissionId.current = novoId();
    try {
      const bruto = localStorage.getItem(chave);
      if (!bruto) return;
      const d = JSON.parse(bruto);
      if (d?.respostas) {
        /* Um segundo render no carregamento é o preço de ler estado salvo:
           a página é pré-renderizada estática, e o localStorage só existe
           depois da hidratação. Ler antes causaria divergência com o HTML
           que veio do servidor. */
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRespostas(d.respostas);
        setPasso(Math.min(d.passo ?? 0, pesquisa.passos.length - 1));
        setRetomado(true);
      }
    } catch {
      /* navegador sem localStorage: segue sem rascunho */
    }
  }, [chave, pesquisa.passos.length]);

  function guardar(novas: Respostas, novoPasso = passo) {
    try {
      localStorage.setItem(
        chave,
        JSON.stringify({ respostas: novas, passo: novoPasso })
      );
    } catch {
      /* ignora: o formulário funciona sem rascunho */
    }
  }

  /* ---------- leitura das respostas ---------- */

  const trilha = trilhaDe(pesquisa, respostas);
  const perguntasDoPasso = pesquisa.passos[passo].perguntas.filter((q) =>
    visivel(q, trilha, respostas)
  );

  /** Contato preenchido é o que torna o consentimento obrigatório. */
  function temContato() {
    const c = respostas['contato'] as { nome?: string; contato?: string } | undefined;
    return !!(c?.nome?.trim() || c?.contato?.trim());
  }

  function obrigatoria(q: Pergunta) {
    if (q.tipo === 'consentimento') return temContato();
    return !!q.obrigatoria;
  }

  function respondida(q: Pergunta) {
    const r = respostas[q.id];
    switch (q.tipo) {
      case 'checkbox':
        return Array.isArray(r) && r.length > 0;
      case 'numero':
        return typeof r === 'number' || r === ESCAPE;
      case 'consentimento':
        return r === true;
      case 'contato':
        return true;
      default:
        return r !== undefined && r !== null && String(r).trim() !== '';
    }
  }

  /* ---------- escrita ---------- */

  function responder(id: string, valor: Respostas[string]) {
    const novas = { ...respostas, [id]: valor };
    setRespostas(novas);
    guardar(novas);
    setInvalidas((atual) => atual.filter((x) => x !== id));
    if (erro) setErro('');
  }

  function alternarCaixa(q: Extract<Pergunta, { tipo: 'checkbox' }>, opcao: string) {
    const atual = (respostas[q.id] as string[] | undefined) ?? [];
    const marcando = !atual.includes(opcao);
    const exclusiva = q.opcoes.find((o) => o.v === opcao)?.exclusivo;

    let proximas: string[];
    if (!marcando) {
      proximas = atual.filter((v) => v !== opcao);
    } else if (exclusiva) {
      proximas = [opcao]; // "não contrato" zera as outras
    } else {
      const semExclusivas = atual.filter(
        (v) => !q.opcoes.find((o) => o.v === v)?.exclusivo
      );
      proximas = [...semExclusivas, opcao];
    }

    if (q.max && proximas.length > q.max) {
      setErro(`Escolha no máximo ${q.max}.`);
      return;
    }
    responder(q.id, proximas);
  }

  /* ---------- navegação ---------- */

  function avancar() {
    const faltando = perguntasDoPasso.filter((q) => obrigatoria(q) && !respondida(q));
    if (faltando.length) {
      setInvalidas(faltando.map((q) => q.id));
      setErro(
        faltando.length === 1
          ? 'Falta responder uma pergunta acima.'
          : `Faltam ${faltando.length} respostas acima.`
      );
      document
        .querySelector('[data-invalid="1"]')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setInvalidas([]);
    setErro('');

    if (passo < pesquisa.passos.length - 1) {
      const proximo = passo + 1;
      setPasso(proximo);
      guardar(respostas, proximo);
      topo.current?.scrollIntoView();
    } else {
      void submeter();
    }
  }

  function voltar() {
    const anterior = passo - 1;
    setPasso(anterior);
    guardar(respostas, anterior);
    setErro('');
    topo.current?.scrollIntoView();
  }

  async function submeter() {
    // Robô preencheu o campo escondido: finge que deu certo e não grava nada.
    if (honeypot.current?.value) {
      setEstado('pronto');
      return;
    }

    setEstado('enviando');
    const r = await enviar(pesquisa, respostas, {
      submissionId: submissionId.current,
      canal: canalDaUrl(),
      trilha,
      segundos: segundosDesde(inicio.current),
      userAgent: navigator.userAgent,
    });

    if (r.ok) {
      try {
        localStorage.removeItem(chave);
      } catch {
        /* nada a fazer */
      }
      setEstado('pronto');
      topo.current?.scrollIntoView();
    } else {
      setEstado('erro');
      setErro(r.mensagem);
    }
  }

  /* ---------- telas de fim ---------- */

  if (estado === 'pronto') {
    return (
      <div ref={topo}>
        <div className="done-card">
          <div className="done-mark" aria-hidden="true">
            ✓
          </div>
          <h2>Obrigado de verdade.</h2>
          <p>{pesquisa.fim}</p>
          <p style={{ marginTop: '1rem' }}>
            <Link className="btn" href="/">
              Conhecer o projeto
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const ultimo = passo === pesquisa.passos.length - 1;
  const total = pesquisa.passos.length;

  return (
    <div ref={topo}>
      <div className="meter">
        <div className="meter-track">
          <div
            className="meter-fill"
            style={{ width: `${Math.round((passo / total) * 100)}%` }}
          />
        </div>
        <div className="meter-label" aria-live="polite">
          Passo {passo + 1} de {total} · {pesquisa.passos[passo].nome}
        </div>
      </div>

      <ol className="steps">
        {pesquisa.passos.map((p, i) => (
          <li
            key={p.nome}
            aria-current={i === passo ? 'step' : undefined}
            data-past={i < passo ? '1' : undefined}
          >
            {p.nome}
          </li>
        ))}
      </ol>

      {retomado && <p className="sub">Retomamos de onde você parou.</p>}

      <main>
        {pesquisa.passos[passo].nota && (
          <p className="nota">{pesquisa.passos[passo].nota}</p>
        )}

        {perguntasDoPasso.map((q) => (
          <Campo
            key={q.id}
            q={q}
            valor={respostas[q.id]}
            textoOutro={respostas[q.id + SUFIXO_OUTRO] as string | undefined}
            invalida={invalidas.includes(q.id)}
            obrigatoria={obrigatoria(q)}
            aoResponder={(v) => responder(q.id, v)}
            aoResponderOutro={(v) => responder(q.id + SUFIXO_OUTRO, v)}
            aoAlternarCaixa={(opcao) =>
              alternarCaixa(q as Extract<Pergunta, { tipo: 'checkbox' }>, opcao)
            }
          />
        ))}

        <div className="hp" aria-hidden="true">
          <label htmlFor="hp-site">Site</label>
          <input
            type="text"
            id="hp-site"
            ref={honeypot}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="nav">
          {passo > 0 && estado !== 'enviando' && (
            <button type="button" className="btn" onClick={voltar}>
              Voltar
            </button>
          )}
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-primary"
            onClick={avancar}
            disabled={estado === 'enviando'}
          >
            {estado === 'enviando'
              ? 'Enviando…'
              : ultimo
                ? 'Enviar respostas'
                : 'Continuar'}
          </button>
        </div>

        {erro && (
          <div className="err" role="alert">
            {erro}
          </div>
        )}
      </main>
    </div>
  );
}

function canalDaUrl() {
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get('src') ?? p.get('utm_source') ?? '';
  } catch {
    return '';
  }
}

/* ---------- uma pergunta ---------- */

function Campo({
  q,
  valor,
  textoOutro,
  invalida,
  obrigatoria,
  aoResponder,
  aoResponderOutro,
  aoAlternarCaixa,
}: {
  q: Pergunta;
  valor: Respostas[string];
  textoOutro?: string;
  invalida: boolean;
  obrigatoria: boolean;
  aoResponder: (v: Respostas[string]) => void;
  aoResponderOutro: (v: string) => void;
  aoAlternarCaixa: (opcao: string) => void;
}) {
  const usaFieldset = ['radio', 'checkbox', 'escala', 'consentimento'].includes(q.tipo);
  const Wrapper = usaFieldset ? 'fieldset' : 'div';

  const titulo = (
    <>
      {q.label}
      {obrigatoria ? (
        <span className="req" aria-hidden="true">
          *
        </span>
      ) : q.tipo === 'textarea' || q.tipo === 'contato' ? (
        <span className="opt">opcional</span>
      ) : null}
    </>
  );

  return (
    <Wrapper className="q" data-q={q.id} data-invalid={invalida ? '1' : undefined}>
      {usaFieldset ? (
        <legend>{titulo}</legend>
      ) : (
        <label className="q-label" htmlFor={`f-${q.id}`}>
          {titulo}
        </label>
      )}
      {q.ajuda && <p className="q-help">{q.ajuda}</p>}

      {q.tipo === 'radio' && (
        <>
          <div className="choices">
            {q.opcoes.map((o) => (
              <label className="choice" key={o.v}>
                <input
                  type="radio"
                  name={q.id}
                  value={o.v}
                  checked={valor === o.v}
                  onChange={() => aoResponder(o.v)}
                />
                <span>{o.t}</span>
              </label>
            ))}
          </div>
          {q.com_texto_em && valor === q.com_texto_em && (
            <CampoOutro id={q.id} valor={textoOutro} aoMudar={aoResponderOutro} />
          )}
        </>
      )}

      {q.tipo === 'checkbox' && (
        <>
          <div className="choices">
            {q.opcoes.map((o) => (
              <label className="choice" key={o.v}>
                <input
                  type="checkbox"
                  name={q.id}
                  value={o.v}
                  checked={((valor as string[] | undefined) ?? []).includes(o.v)}
                  onChange={() => aoAlternarCaixa(o.v)}
                />
                <span>{o.t}</span>
              </label>
            ))}
          </div>
          {q.com_texto_em &&
            ((valor as string[] | undefined) ?? []).includes(q.com_texto_em) && (
              <CampoOutro id={q.id} valor={textoOutro} aoMudar={aoResponderOutro} />
            )}
        </>
      )}

      {q.tipo === 'escala' && (
        <>
          <div className="scale">
            {Array.from({ length: q.max }, (_, i) => i + 1).map((n) => (
              <label key={n}>
                <input
                  type="radio"
                  name={q.id}
                  value={n}
                  checked={String(valor) === String(n)}
                  onChange={() => aoResponder(n)}
                />
                {n}
              </label>
            ))}
          </div>
          <div className="scale-ends">
            <span>1 · {q.pontas[0]}</span>
            <span>
              {q.max} · {q.pontas[1]}
            </span>
          </div>
        </>
      )}

      {q.tipo === 'texto' && (
        <input
          type="text"
          id={`f-${q.id}`}
          value={(valor as string) ?? ''}
          placeholder={q.placeholder}
          autoComplete={q.autocomplete}
          onChange={(e) => aoResponder(e.target.value)}
        />
      )}

      {q.tipo === 'textarea' && (
        <textarea
          id={`f-${q.id}`}
          value={(valor as string) ?? ''}
          placeholder={q.placeholder}
          onChange={(e) => aoResponder(e.target.value)}
        />
      )}

      {q.tipo === 'numero' && (
        <>
          <div className="num-row">
            <input
              type="number"
              id={`f-${q.id}`}
              inputMode="numeric"
              min={q.min}
              max={q.max}
              disabled={valor === ESCAPE}
              value={typeof valor === 'number' ? valor : ''}
              onChange={(e) =>
                aoResponder(e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
            {q.sufixo && <span className="sufixo">{q.sufixo}</span>}
          </div>
          <div className="choices">
            <label className="choice">
              <input
                type="checkbox"
                checked={valor === ESCAPE}
                onChange={(e) => aoResponder(e.target.checked ? ESCAPE : undefined)}
              />
              <span>{q.escape}</span>
            </label>
          </div>
        </>
      )}

      {q.tipo === 'contato' && (
        <Contato q={q} valor={valor as { nome?: string; contato?: string }} aoResponder={aoResponder} />
      )}

      {q.tipo === 'consentimento' && (
        <div className="choices">
          <label className="choice">
            <input
              type="checkbox"
              name={q.id}
              checked={valor === true}
              onChange={(e) => aoResponder(e.target.checked)}
            />
            {/* texto fixo nosso, com um link para o aviso de privacidade */}
            <span dangerouslySetInnerHTML={{ __html: q.html }} />
          </label>
        </div>
      )}
    </Wrapper>
  );
}

function Contato({
  q,
  valor,
  aoResponder,
}: {
  q: Extract<Pergunta, { tipo: 'contato' }>;
  valor?: { nome?: string; contato?: string };
  aoResponder: (v: Respostas[string]) => void;
}) {
  const c = valor ?? {};
  return (
    <>
      <label className="field-label" htmlFor={`f-${q.id}-nome`}>
        {q.rotulos[0]}
      </label>
      <input
        type="text"
        id={`f-${q.id}-nome`}
        value={c.nome ?? ''}
        autoComplete="name"
        onChange={(e) => aoResponder({ ...c, nome: e.target.value })}
      />
      <label className="field-label" htmlFor={`f-${q.id}-contato`}>
        {q.rotulos[1]}
      </label>
      <input
        type="text"
        id={`f-${q.id}-contato`}
        value={c.contato ?? ''}
        inputMode="tel"
        autoComplete="tel"
        onChange={(e) => aoResponder({ ...c, contato: e.target.value })}
      />
    </>
  );
}

/** Campo curto que aparece quando a pessoa marca "Outro". */
function CampoOutro({
  id,
  valor,
  aoMudar,
}: {
  id: string;
  valor?: string;
  aoMudar: (v: string) => void;
}) {
  return (
    <>
      <label className="field-label" htmlFor={`f-${id}-outro`}>
        Qual?
      </label>
      <input
        type="text"
        id={`f-${id}-outro`}
        value={valor ?? ''}
        placeholder="Conte com suas palavras"
        onChange={(e) => aoMudar(e.target.value)}
      />
    </>
  );
}
