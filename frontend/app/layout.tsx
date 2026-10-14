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
    var t = localStorage.getItem('devscope_theme_v2');
    var root = document.documentElement;
    if (t === 'dark') {
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
