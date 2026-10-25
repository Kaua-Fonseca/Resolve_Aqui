import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Resolve Aqui | Encontre profissionais perto de você',
  description: 'Encontre profissionais da sua região, compare avaliações e entre em contato sem complicação.',
  applicationName: 'Resolve Aqui',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#172554',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
