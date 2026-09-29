import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'DevScope — GitHub developer intelligence',
  description:
    'Point it at a GitHub username. Get a developer intelligence report in under a minute.',
  openGraph: {
    title: 'DevScope — GitHub developer intelligence',
    description: 'An AI agent that investigates any GitHub developer and writes their profile.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
