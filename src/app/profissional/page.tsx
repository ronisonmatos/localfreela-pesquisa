import type { Metadata } from 'next';
import Survey from '@/components/Survey';
import { profissional } from '@/lib/pesquisa/profissional';

export const metadata: Metadata = {
  title: 'LocalFreela — pesquisa com profissionais',
  description: 'Quatro minutos para contar como você consegue seus trabalhos hoje.',
};

export default function Pagina() {
  return (
    <>
      <header className="masthead">
        <p className="eyebrow">LocalFreela · pesquisa com quem presta serviço</p>
        <h1>Como você consegue trabalho hoje?</h1>
        <p className="lede">
          Estamos construindo o LocalFreela, um app para conectar quem precisa de
          reforço rápido a quem está disponível e pronto para trabalhar. Antes de
          construir qualquer coisa, queremos ouvir você.
        </p>
        <p className="sub">
          São 4 minutos. Pergunta de comissão inclusive — se a resposta for ruim
          para nós, é exatamente isso que precisamos saber agora.
        </p>
      </header>
      <Survey pesquisa={profissional} />
    </>
  );
}
