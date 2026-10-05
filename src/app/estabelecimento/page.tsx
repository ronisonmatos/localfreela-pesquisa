import type { Metadata } from 'next';
import Survey from '@/components/Survey';
import { estabelecimento } from '@/lib/pesquisa/estabelecimento';

export const metadata: Metadata = {
  title: 'LocalFreela — pesquisa com estabelecimentos',
  description:
    'Quatro minutos para contar como vocês resolvem contratação de reforço ou freela hoje.',
};

export default function Pagina() {
  return (
    <>
      <header className="masthead">
        <p className="eyebrow">LocalFreela · pesquisa com quem contrata</p>
        <h1>Como vocês resolvem isso hoje?</h1>
        <p className="lede">
          Estamos construindo o LocalFreela, um app para conectar quem precisa de
          reforço rápido a quem está disponível e pronto para trabalhar. Antes de
          construir qualquer coisa, queremos ouvir você.
        </p>
        <p className="sub">
          São 4 minutos. Nenhuma pergunta de venda, nenhum cadastro obrigatório.
          Deixar contato no fim é opcional.
        </p>
      </header>
      <Survey pesquisa={estabelecimento} />
    </>
  );
}
