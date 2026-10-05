import type { Fatia } from '@/lib/admin/analise';

/**
 * Barras horizontais em HTML, sem SVG: refluem no celular, o rótulo quebra
 * linha sozinho e não há risco de texto saindo da caixa.
 *
 * Série única usa uma matiz só — quem identifica a categoria é o rótulo do
 * eixo, não a cor. A paleta de duas cores existe para o caso em que a cor
 * carrega identidade de verdade (presencial e remoto), e foi validada para
 * separação por daltonismo nos dois temas.
 */
export default function Barras({
  titulo,
  nota,
  dados,
  cores,
  vazio = 'Nenhuma resposta ainda.',
}: {
  titulo: string;
  nota?: string;
  dados: Fatia[];
  /** Cor por rótulo, quando a cor carrega identidade. */
  cores?: Record<string, string>;
  vazio?: string;
}) {
  const max = Math.max(1, ...dados.map((d) => d.n));
  const total = dados.reduce((a, d) => a + d.n, 0);

  return (
    <section className="graf">
      <h3>{titulo}</h3>
      {nota && <p className="graf-nota">{nota}</p>}

      {total === 0 ? (
        <p className="graf-vazio">{vazio}</p>
      ) : (
        <ul className="barras">
          {dados.map((d) => {
            const pct = total ? Math.round((d.n / total) * 100) : 0;
            return (
              <li key={d.rotulo}>
                <span className="barra-rotulo">{d.rotulo}</span>
                <span
                  className="barra-trilho"
                  title={`${d.rotulo}: ${d.n} de ${total} (${pct}%)`}
                >
                  <span
                    className="barra-marca"
                    style={{
                      width: `${(d.n / max) * 100}%`,
                      background: cores?.[d.rotulo] ?? 'var(--graf)',
                    }}
                  />
                </span>
                <span className="barra-valor">
                  {d.n}
                  <em>{pct}%</em>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
