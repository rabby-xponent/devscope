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
  title: 'GitGrill — GitHub developer intelligence & code defense',
  description:
    'Point it at a GitHub username. Get a developer intelligence report and deep code grill in under a minute.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/brand/app-icon.jpg',
  },
  openGraph: {
    title: 'GitGrill — GitHub developer intelligence & code defense',
    description: 'An AI agent that investigates and grills any GitHub developer codebase.',
    type: 'website',
    images: [
      {
        url: '/brand/brand-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'GitGrill — Autonomous GitHub Technical Auditor',
      },
    ],
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
