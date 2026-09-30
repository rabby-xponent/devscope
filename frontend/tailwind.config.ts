import type { Config } from 'tailwindcss';

/**
 * DevScope design tokens.
 *
 * Every color is backed by a CSS variable defined in `globals.css`
 * (`:root` for light, `html.dark` for dark) so a single class like
 * `bg-card`, `border-edge` or `text-signal` renders the correct,
 * contrast-calibrated value in BOTH themes. No `dark:` duplication
 * needed for surfaces, borders, text or the brand accent.
 *
 * Alpha modifiers (`bg-card/80`, `text-muted/60`, ...) work because the
 * variables are raw RGB triplets composed with `<alpha-value>`.
 */
const rgb = (name: string) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Page background
        canvas: rgb('canvas'),
        // Raised card / panel surface
        card: rgb('card'),
        // Inset wells: inputs, table bodies, code strips
        well: rgb('well'),
        // Legacy dark-layer token (deep layer in dark, white in light)
        ink: rgb('ink'),
        // Legacy surface token (kept for dossier components)
        surface: rgb('surface'),
        // Hairline borders & dividers
        edge: rgb('edge'),
        // Secondary text
        muted: rgb('muted'),
        // Primary text
        content: rgb('content'),
        // Back-compat alias: older classes use text-ece9f0
        ece9f0: rgb('content'),
        // Brand accent (orange-600 in light, amber in dark)
        signal: rgb('signal'),
        signaldim: 'rgb(var(--signal-rgb) / 0.1)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        pop: '0 10px 30px -10px rgb(0 0 0 / 0.25), 0 4px 12px -6px rgb(0 0 0 / 0.12)',
      },
      spacing: {
        4.5: '1.125rem',
      },
    },
  },
  plugins: [],
};
export default config;
