import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gawor — moje niemieckie zdania',
  description:
    'Słuchaj własnych zdań po niemiecku i powtarzaj je we własnym rytmie.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Gawor', statusBarStyle: 'default' },
};
export const viewport: Viewport = {
  themeColor: '#122920',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
