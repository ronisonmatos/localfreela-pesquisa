import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/* Resposta que o cliente falso do Supabase vai devolver no próximo teste. */
let resposta: { count: number | null; error: { message: string } | null } = {
  count: 0,
  error: null,
};

const select = vi.fn(() => Promise.resolve(resposta));
const from = vi.fn(() => ({ select }));

vi.mock('@/lib/supabase/admin', () => ({
  clienteAdmin: () => ({ from }),
}));

const { GET } = await import('./route');

const SEGREDO = 'segredo-de-cron-bem-comprido-2026';

function chamar(authorization?: string) {
  return GET(
    new NextRequest('http://localhost/api/keep-alive', {
      headers: authorization ? { authorization } : {},
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.env.CRON_SECRET = SEGREDO;
  resposta = { count: 0, error: null };
});

describe('GET /api/keep-alive', () => {
  it('recusa quem não manda credencial', async () => {
    const r = await chamar();
    expect(r.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('recusa Bearer errado', async () => {
    const r = await chamar('Bearer quase-o-segredo-mas-nao');
    expect(r.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('recusa quando o segredo não está configurado', async () => {
    delete process.env.CRON_SECRET;
    const r = await chamar(`Bearer ${SEGREDO}`);
    expect(r.status).toBe(503);
    expect(from).not.toHaveBeenCalled();
  });

  it('com o Bearer certo, consulta o banco e devolve a contagem', async () => {
    resposta = { count: 42, error: null };
    const r = await chamar(`Bearer ${SEGREDO}`);

    expect(r.status).toBe(200);
    await expect(r.json()).resolves.toMatchObject({ ok: true, respostas: 42 });
    expect(from).toHaveBeenCalledWith('respostas');
    // head: true é o que impede de trazer linha nenhuma — só a contagem
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
    expect(r.headers.get('cache-control')).toContain('no-store');
  });

  it('devolve 503 quando o banco está fora do ar', async () => {
    resposta = { count: null, error: { message: 'TypeError: fetch failed' } };
    const r = await chamar(`Bearer ${SEGREDO}`);

    expect(r.status).toBe(503);
    await expect(r.json()).resolves.toMatchObject({ ok: false });
    expect(console.error).toHaveBeenCalled();
  });

  it('devolve 503, e não 500, quando o cliente do Supabase nem monta', async () => {
    // é o que acontece quando falta SUPABASE_SERVICE_ROLE_KEY no ambiente
    select.mockImplementationOnce(() => {
      throw new Error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');
    });
    const r = await chamar(`Bearer ${SEGREDO}`);

    expect(r.status).toBe(503);
    expect(console.error).toHaveBeenCalled();
  });
});
