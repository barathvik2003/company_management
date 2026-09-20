import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SessionProvider } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Company Management System',
  description: 'Monitor employees, sales, projects and finance in one place.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
