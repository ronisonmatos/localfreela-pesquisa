/**
 * Um número que não precisa de gráfico. Quando o dado é um só valor, a melhor
 * visualização é o próprio valor em corpo grande.
 */
export default function Numero({
  rotulo,
  valor,
  sufixo,
  detalhe,
  destaque,
}: {
  rotulo: string;
  valor: string | number | null;
  sufixo?: string;
  detalhe?: string;
  destaque?: boolean;
}) {
  const vazio = valor === null || valor === undefined || valor === '';
  return (
    <div className={'tile' + (destaque ? ' tile-destaque' : '')}>
      <p className="tile-rotulo">{rotulo}</p>
      <p className="tile-valor">
        {vazio ? <span className="tile-sem">sem dado</span> : valor}
        {!vazio && sufixo && <span className="tile-sufixo">{sufixo}</span>}
      </p>
      {detalhe && <p className="tile-detalhe">{detalhe}</p>}
    </div>
  );
}
