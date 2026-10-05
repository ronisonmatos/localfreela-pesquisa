import '@testing-library/jest-dom/vitest';

/* O jsdom não implementa scrollIntoView nem scrollTo. Existem no navegador de
   verdade; aqui viram no-op para não quebrar os testes de navegação. */
Element.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};
