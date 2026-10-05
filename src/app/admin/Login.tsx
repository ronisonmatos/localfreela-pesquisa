'use client';

import { useActionState } from 'react';
import { entrar } from './acoes';

export default function Login() {
  const [erro, acao, enviando] = useActionState(entrar, null);

  return (
    <form action={acao} className="q" style={{ maxWidth: '26rem' }}>
      <label className="q-label" htmlFor="senha">
        Senha do painel
      </label>
      <input
        type="password"
        id="senha"
        name="senha"
        autoComplete="current-password"
        autoFocus
        required
      />
      <div className="nav">
        <span className="spacer" />
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Conferindo…' : 'Entrar'}
        </button>
      </div>
      {erro && (
        <div className="err" role="alert">
          {erro}
        </div>
      )}
    </form>
  );
}
