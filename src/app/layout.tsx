import type { Metadata } from 'next';
import './globals.css';
import { APP_NAME, APP_TAGLINE } from '@/utils/constants';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    'AgriLink connects farmers directly with retail consumers, bulk buyers, and local logistics partners with fair price discovery and community cart optimization.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="flex min-h-screen flex-col bg-agri-earth-50 text-agri-earth-900 antialiased">
        {children}
      </body>
    </html>
  );
}
