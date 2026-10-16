import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { SessionProvider } from '@/components/SessionProvider';

/**
 * Applies the persisted theme before first paint.
 *
 * Runs inline in <head> — earlier than any React hydration — so a dark-mode
 * user never sees the light canvas flash on refresh (FOUC). The ThemeProvider
 * later reads the same key to sync its React state.
 */
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('gitgrill_theme_v2') || localStorage.getItem('devscope_theme_v2');
    var root = document.documentElement;
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && prefersDark)) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  title: 'GitGrill — AI-Native Technical Talent Intelligence & Developer CareerOS',
  description:
    'Autonomous GitHub code defense, candidate intelligence, and developer CareerOS. Investigate codebases, verify claims with line-level diffs, and manage your master resume vault.',
  metadataBase: new URL('https://gitgrill-gr.vercel.app'),
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/app-icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'GitGrill — AI-Native Technical Talent Intelligence & Developer CareerOS',
    description: 'Autonomous GitHub code defense, candidate intelligence, and developer CareerOS.',
    url: 'https://gitgrill-gr.vercel.app',
    siteName: 'GitGrill',
    type: 'website',
    images: [
      {
        url: '/brand/brand-hero.png',
        width: 1200,
        height: 630,
        alt: 'GitGrill — Autonomous GitHub Technical Auditor & CareerOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GitGrill — AI-Native Technical Talent Intelligence & Developer CareerOS',
    description: 'Autonomous GitHub code defense, candidate intelligence, and developer CareerOS.',
    images: ['/brand/brand-hero.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
