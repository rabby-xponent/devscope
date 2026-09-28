import axios from 'axios';
import { LiveAppAudit } from '../../types/profile';

/**
 * Validates whether a URL is a safe public web destination.
 * Rejects private/loopback/cloud metadata IP ranges (SSRF defense).
 */
function isSafePublicUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    // Check common private IPv4 patterns
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(host)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes input URL strings (e.g. "my-app.vercel.app" -> "https://my-app.vercel.app")
 */
export function normalizeUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Analyzes raw HTML and response headers to detect frameworks, styling, libraries, and hosting platform.
 */
function analyzePage(html: string, headers: Record<string, any>, finalUrl: string) {
  const lowerHtml = html.toLowerCase();
  const lowerHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (v != null) {
      lowerHeaders[k.toLowerCase()] = Array.isArray(v) ? v.join(', ').toLowerCase() : String(v).toLowerCase();
    }
  }

  // 1. Hosting Platform detection
  let hostingPlatform: string | null = null;
  const server = lowerHeaders['server'] || '';
  if (server.includes('vercel') || lowerHeaders['x-vercel-id']) {
    hostingPlatform = 'Vercel';
  } else if (server.includes('netlify') || lowerHeaders['x-nf-request-id']) {
    hostingPlatform = 'Netlify';
  } else if (server.includes('cloudflare') || lowerHeaders['cf-ray']) {
    hostingPlatform = 'Cloudflare';
  } else if (lowerHeaders['x-render-origin-server'] || finalUrl.includes('.onrender.com')) {
    hostingPlatform = 'Render';
  } else if (finalUrl.includes('.github.io')) {
    hostingPlatform = 'GitHub Pages';
  } else if (server) {
    hostingPlatform = server.split('/')[0] || server;
  }

  // 2. Framework detection
  let framework = 'Static / Vanilla HTML';
  if (lowerHtml.includes('__next_data__') || lowerHtml.includes('/_next/') || lowerHtml.includes('next/font')) {
    framework = 'Next.js (React)';
  } else if (lowerHtml.includes('__remixcontext')) {
    framework = 'Remix';
  } else if (lowerHtml.includes('__nuxt__') || lowerHtml.includes('data-v-')) {
    framework = 'Nuxt.js (Vue)';
  } else if (lowerHtml.includes('__sveltekit') || lowerHtml.includes('svelte-')) {
    framework = 'SvelteKit';
  } else if (lowerHtml.includes('/@vite/') || lowerHtml.includes('vite/client')) {
    framework = lowerHtml.includes('react') ? 'React (Vite)' : lowerHtml.includes('vue') ? 'Vue (Vite)' : 'Vite';
  } else if (lowerHtml.includes('data-reactroot') || lowerHtml.includes('react-dom') || lowerHtml.includes('id="root"')) {
    framework = 'React';
  } else if (lowerHtml.includes('ng-version') || lowerHtml.includes('ng-app')) {
    framework = 'Angular';
  } else if (lowerHtml.includes('astro-island') || lowerHtml.includes('astro-')) {
    framework = 'Astro';
  }

  // 3. Styling detection
  const styling: string[] = [];
  if (
    lowerHtml.includes('tailwind') ||
    /\b(flex|grid|rounded|border-|bg-|text-|p-|m-)\b/.test(lowerHtml)
  ) {
    styling.push('Tailwind CSS');
  }
  if (lowerHtml.includes('data-radix-') || lowerHtml.includes('radix')) {
    styling.push('Radix UI / shadcn');
  }
  if (lowerHtml.includes('styled-components') || lowerHtml.includes('data-styled')) {
    styling.push('Styled Components');
  }
  if (lowerHtml.includes('data-emotion') || lowerHtml.includes('chakra')) {
    styling.push('Emotion / Chakra');
  }
  if (lowerHtml.includes('bootstrap')) {
    styling.push('Bootstrap');
  }

  // 4. Tools & Libraries
  const toolsAndLibraries: string[] = [];
  if (lowerHtml.includes('lucide') || lowerHtml.includes('stroke-linejoin="round"')) {
    toolsAndLibraries.push('Lucide Icons');
  }
  if (lowerHtml.includes('framer-motion')) {
    toolsAndLibraries.push('Framer Motion');
  }
  if (lowerHtml.includes('_vercel/insights') || lowerHtml.includes('va.js')) {
    toolsAndLibraries.push('Vercel Analytics');
  }
  if (lowerHtml.includes('googletagmanager') || lowerHtml.includes('gtag')) {
    toolsAndLibraries.push('Google Analytics');
  }
  if (lowerHtml.includes('posthog')) {
    toolsAndLibraries.push('PostHog');
  }

  // 5. Backend Signals
  const backendSignals: string[] = [];
  if (lowerHtml.includes('supabase.co')) {
    backendSignals.push('Supabase Backend');
  }
  if (lowerHtml.includes('firebaseio.com') || lowerHtml.includes('firebase')) {
    backendSignals.push('Firebase');
  }
  if (lowerHtml.includes('/api/') || lowerHtml.includes('/api/v1')) {
    backendSignals.push('REST API (/api)');
  }
  if (lowerHtml.includes('graphql')) {
    backendSignals.push('GraphQL');
  }

  // 6. Meta title & description
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  const descMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : null;

  // 7. Production Standards
  const mobileResponsive = /<meta\s+name=["']viewport["']/i.test(html);
  const httpsEnforced = finalUrl.startsWith('https://');
  const hasSeoMeta = Boolean(title && description);
  const hasSecurityHeaders = Boolean(
    lowerHeaders['strict-transport-security'] ||
    lowerHeaders['content-security-policy'] ||
    lowerHeaders['x-frame-options'] ||
    lowerHeaders['x-content-type-options']
  );

  return {
    title,
    description,
    hostingPlatform,
    framework,
    styling,
    toolsAndLibraries,
    backendSignals,
    productionStandards: {
      httpsEnforced,
      mobileResponsive,
      hasSeoMeta,
      hasSecurityHeaders,
    },
  };
}

/**
 * Live URL inspection tool for candidate demo applications and portfolios.
 */
export async function inspectLiveUrl(rawUrl: string): Promise<LiveAppAudit> {
  const url = normalizeUrl(rawUrl);

  if (!isSafePublicUrl(url)) {
    return {
      url,
      finalUrl: url,
      status: 400,
      isLive: false,
      responseTimeMs: 0,
      speedRating: 'slow',
      title: null,
      description: null,
      hostingPlatform: null,
      detectedStack: {},
      productionStandards: {
        httpsEnforced: false,
        mobileResponsive: false,
        hasSeoMeta: false,
        hasSecurityHeaders: false,
      },
      architectureSummary: 'Invalid or restricted URL format. Inspection aborted for safety.',
    };
  }

  const startTime = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: 7000,
      maxContentLength: 300 * 1024, // 300KB max HTML
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (compatible; DevScope-Bot/1.0; +https://devscope.app)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      validateStatus: () => true, // capture 404, 500, etc. without throwing
    });

    const elapsed = Date.now() - startTime;
    const finalUrl = (response.request?.res?.responseUrl as string) || url;
    const isLive = response.status >= 200 && response.status < 400;
    const speedRating: 'fast' | 'moderate' | 'slow' =
      elapsed < 400 ? 'fast' : elapsed < 1200 ? 'moderate' : 'slow';

    const html = typeof response.data === 'string' ? response.data : '';
    const analysis = analyzePage(html, response.headers, finalUrl);

    // Build human-readable architecture summary
    const stackParts: string[] = [];
    if (analysis.framework) stackParts.push(analysis.framework);
    if (analysis.styling.length > 0) stackParts.push(analysis.styling.join(' & '));
    if (analysis.hostingPlatform) stackParts.push(`deployed on ${analysis.hostingPlatform}`);

    const architectureSummary = isLive
      ? `Live production application built with ${stackParts.join(', ')}. Responded in ${elapsed}ms (${speedRating}). Mobile responsive: ${analysis.productionStandards.mobileResponsive ? 'Yes' : 'No'}.`
      : `Application returned HTTP ${response.status} during automated inspection.`;

    return {
      url,
      finalUrl,
      status: response.status,
      isLive,
      responseTimeMs: elapsed,
      speedRating,
      title: analysis.title,
      description: analysis.description,
      hostingPlatform: analysis.hostingPlatform,
      detectedStack: {
        framework: analysis.framework,
        styling: analysis.styling,
        toolsAndLibraries: analysis.toolsAndLibraries,
        backendSignals: analysis.backendSignals,
      },
      productionStandards: analysis.productionStandards,
      architectureSummary,
    };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    return {
      url,
      finalUrl: url,
      status: 0,
      isLive: false,
      responseTimeMs: elapsed,
      speedRating: 'slow',
      title: null,
      description: null,
      hostingPlatform: null,
      detectedStack: {},
      productionStandards: {
        httpsEnforced: false,
        mobileResponsive: false,
        hasSeoMeta: false,
        hasSecurityHeaders: false,
      },
      architectureSummary: `Inspection failed or timed out (${err.message || 'connection error'}).`,
    };
  }
}
