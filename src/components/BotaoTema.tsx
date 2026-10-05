'use client';

/* Escuro é o padrão do CSS, então "sem atributo" já significa escuro — não há
   mais o que perguntar à preferência do sistema. O botão só alterna entre os
   dois, e a escolha vale enquanto a aba estiver aberta. */
export default function BotaoTema() {
  function alternar() {
    const raiz = document.documentElement;
    const atual = raiz.getAttribute('data-theme') ?? 'dark';
    raiz.setAttribute('data-theme', atual === 'dark' ? 'light' : 'dark');
  }

  return (
    <button className="theme-toggle" type="button" onClick={alternar}>
      Tema
    </button>
  );
}
