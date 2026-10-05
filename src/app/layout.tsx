import type { Metadata } from 'next';
import { Archivo, Newsreader } from 'next/font/google';
import './globals.css';
import BotaoTema from '@/components/BotaoTema';

/* Mesmas duas fontes do mapa de validação: Archivo para interface,
   Newsreader para os textos de leitura. */
const archivo = Archivo({
  variable: '--fonte-titulo',
  subsets: ['latin'],
  weight: ['400', '500', '600', '800'],
  display: 'swap',
});

const newsreader = Newsreader({
  variable: '--fonte-leitura',
  subsets: ['latin'],
  weight: ['300', '400'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LocalFreela — pesquisa de validação',
  description:
    'Estamos construindo um app de trabalho freelance local e queremos ouvir ' +
    'quem contrata e quem presta serviço.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${newsreader.variable}`}>
      <body>
        <div className="wrap">
          <BotaoTema />
          {children}
          <footer>
            <span>LocalFreela · pesquisa de validação</span>
            <a href="/privacidade">Aviso de privacidade</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
