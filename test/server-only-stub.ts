/* O pacote server-only lança erro fora de um Server Component — é a garantia
   de que a chave service_role nunca chega ao navegador. No Vitest não existe
   essa distinção, então ele é trocado por este módulo vazio. A proteção real
   continua valendo no build do Next. */
export {};
