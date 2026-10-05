import { NextResponse, type NextRequest } from 'next/server';
import { clienteAdmin } from '@/lib/supabase/admin';
import { estadoDaSessao } from '@/lib/admin/sessao';
import { filtrar, type Filtros, type Linha } from '@/lib/admin/analise';
import { montarCsv, nomeDoArquivo } from '@/lib/admin/csv';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if ((await estadoDaSessao()) !== 'autenticado') {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  const p = req.nextUrl.searchParams;
  const filtros: Filtros = {
    form: p.get('form') ?? undefined,
    trilha: p.get('trilha') ?? undefined,
    canal: p.get('canal') ?? undefined,
    incluirSuspeitas: p.get('suspeitas') === '1',
  };

  const supabase = clienteAdmin();
  const { data, error } = await supabase
    .from('respostas')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return new NextResponse(error.message, { status: 500 });

  const csv = montarCsv(filtrar((data ?? []) as Linha[], filtros));

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeDoArquivo()}"`,
      'Cache-Control': 'no-store',
    },
  });
}
