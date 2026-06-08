import type OpenAI from 'openai';
import { summarizeToolResult } from './tools/definitions';
import {
  getGithubProfile,
  getRepos,
  getPinnedRepos,
  getAggregatedLanguages,
  getCommitActivity,
  getPRActivity,
  getContributionStats,
  getRepoReadme,
} from './tools/github.tool';
import { searchHackerNews, searchDevto, webSearch } from './tools/external.tool';
import { SYNTHESIS_PROMPT } from './prompts';
import { DevProfile, TraceEvent } from '../types/profile';
import { LLMGateway } from '../llm/llm-gateway';

const SYNTHESIS_TIMEOUT_MS = 90_000;
export const CACHE_VERSION = 3;

type EventEmitter = (event: TraceEvent) => void;
type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export class AgentService {
  private gateway: LLMGateway;

  constructor() {
    this.gateway = new LLMGateway();
  }

  async buildProfile(username: string, emit: EventEmitter): Promise<DevProfile> {
    const t0 = Date.now();
    const collectedData: Record<string, unknown> = {};
    let githubData: any;
    let repoData: any;

    try {
      [githubData, repoData] = await Promise.all([
        getGithubProfile(username),
        getRepos(username, 1),
      ]);
      collectedData.get_github_profile = githubData;
      collectedData.get_repos = repoData;
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new Error('GitHub user not found');
      }
      throw err;
    }

    await this.emitPrefetchResult('get_github_profile', { username }, githubData, collectedData, emit);
    await this.emitPrefetchResult('get_repos', { username, page: 1 }, repoData, collectedData, emit);
    await this.prefetchEvidence(username, githubData, repoData, collectedData, emit);
    console.log(`[perf] pre-fetch: ${Date.now() - t0}ms`);

    console.log(`[perf] gather phase: 0ms (skipped, prefetched) (${Date.now() - t0}ms total)`);

    const synthesized = await this.synthesizeProfile(username, collectedData, emit, t0);
    const finalized = this.finalizeSynthesizedProfile(synthesized, username, githubData, collectedData);
    console.log(`[perf] total: ${Date.now() - t0}ms`);
    return this.assembleProfile(username, finalized, githubData, repoData);
  }

  private async emitPrefetchResult(
    name: string,
    input: Record<string, unknown>,
    result: unknown,
    collectedData: Record<string, unknown>,
    emit: EventEmitter
  ): Promise<void> {
    emit({
      type: 'tool_call',
      timestamp: new Date().toISOString(),
      tool: name,
      input,
    });
    this.storeCollectedData(collectedData, name, result);
    emit({
      type: 'tool_result',
      timestamp: new Date().toISOString(),
      tool: name,
      summary: summarizeToolResult(name, result),
    });
  }

  private async prefetchEvidence(
    username: string,
    githubData: any,
    repoData: any,
    collectedData: Record<string, unknown>,
    emit: EventEmitter
  ): Promise<void> {
    const displayName = githubData?.name || username;
    const topRepos: Array<{ name: string }> = repoData?.repos?.slice(0, 3) ?? [];

    const tasks: Array<{
      name: string;
      input: Record<string, unknown>;
      run: () => Promise<unknown>;
    }> = [
      { name: 'get_pinned_repos', input: { username }, run: () => getPinnedRepos(username) },
      {
        name: 'get_aggregated_languages',
        input: { username },
        run: () => getAggregatedLanguages(username, repoData?.repos),
      },
      { name: 'get_commit_activity', input: { username }, run: () => getCommitActivity(username) },
      { name: 'get_pr_activity', input: { username }, run: () => getPRActivity(username) },
      {
        name: 'get_contribution_stats',
        input: { username },
        run: () => getContributionStats(username),
      },
      { name: 'search_hackernews', input: { query: displayName }, run: () => searchHackerNews(displayName) },
      { name: 'search_devto', input: { username }, run: () => searchDevto(username) },
      {
        name: 'web_search',
        input: { query: `${username} blog` },
        run: () => webSearch(`${username} blog`),
      },
      ...topRepos.map((repo) => ({
        name: 'get_repo_readme',
        input: { owner: username, repo: repo.name },
        run: () => getRepoReadme(username, repo.name),
      })),
    ];

    await Promise.all(
      tasks.map(async (task) => {
        emit({
          type: 'tool_call',
          timestamp: new Date().toISOString(),
          tool: task.name,
          input: task.input,
        });

        let result: unknown;
        try {
          result = await task.run();
          this.storeCollectedData(collectedData, task.name, result);
        } catch (err: any) {
          const status = err.response?.status;
          if (status === 404) {
            result = { error: 'GitHub user or resource not found' };
          } else if (status === 403) {
            throw new Error('GitHub API rate limited. Try again in a minute.');
          } else {
            result = { error: err.message };
          }
        }

        emit({
          type: 'tool_result',
          timestamp: new Date().toISOString(),
          tool: task.name,
          summary:
            result && typeof result === 'object' && 'error' in (result as object)
              ? `Error: ${(result as { error: string }).error}`
              : summarizeToolResult(task.name, result),
        });
      })
    );
  }

  private storeCollectedData(
    collected: Record<string, unknown>,
    name: string,
    result: unknown
  ): void {
    if (name === 'get_repo_readme') {
      const existing = Array.isArray(collected.get_repo_readme)
        ? (collected.get_repo_readme as unknown[])
        : [];
      collected.get_repo_readme = [...existing, result];
      return;
    }
    collected[name] = result;
  }

  private compressToolData(data: Record<string, unknown>): string {
    const parts: string[] = [];

    const profile = data.get_github_profile as Record<string, unknown> | undefined;
    if (profile) {
      parts.push(
        `PROFILE: ${profile.name || profile.login}, ${profile.followers} followers, ${profile.publicRepos} repos, joined ${profile.joinedYear}, location: ${profile.location || 'n/a'}, company: ${profile.company || 'n/a'}, website: ${profile.websiteUrl || 'n/a'}`
      );
      if (profile.bio) {
        parts.push(`BIO: ${String(profile.bio).slice(0, 150)}`);
      }
    }

    const repos = data.get_repos as Record<string, unknown> | undefined;
    if (repos) {
      const top = (repos.repos as any[])
        ?.slice(0, 5)
        .map((r) => `${r.name}(★${r.stars},${r.language || '?'})`)
        .join(', ');
      parts.push(
        `REPOS: ${repos.count} repos, ${repos.totalStars} total stars, ${repos.totalForks} forks. Top: ${top}`
      );
    }

    const languages = data.get_aggregated_languages as Record<string, unknown> | undefined;
    if (languages?.languages) {
      const list = (languages.languages as any[])
        .slice(0, 6)
        .map((l) => `${l.name} ${l.percentage}% (${l.level})`)
        .join(', ');
      parts.push(`LANGUAGES: ${list}`);
    }

    const commits = data.get_commit_activity as Record<string, unknown> | undefined;
    if (commits) {
      parts.push(
        `COMMITS: ${commits.totalCommitsLast90Days} commits in 90d, last: ${commits.daysSinceLastCommit}d ago, active days: ${commits.activeDays}, streak: ${commits.longestStreak}d, weekday: ${commits.weekdayPercent}%`
      );
      const msgs = (commits.commitMessages as string[])?.slice(0, 15);
      if (msgs?.length) parts.push(`COMMIT MSGS: ${msgs.join(' | ')}`);
      const topRepos = commits.topActiveRepos as Array<{ repo: string; commits: number }> | undefined;
      if (topRepos?.length) {
        parts.push(
          `TOP ACTIVE REPOS: ${topRepos.map((r) => `${r.repo}(${r.commits})`).join(', ')}`
        );
      }
    }

    const prs = data.get_pr_activity as Record<string, unknown> | undefined;
    if (prs) {
      parts.push(
        `PRS: opened ${prs.prsOpened}, merged ${prs.prsMerged}, reviews ${prs.reviewsGiven}, external ${prs.externalContributions}`
      );
      const titles = prs.recentPRTitles as string[] | undefined;
      if (titles?.length) parts.push(`RECENT PR TITLES: ${titles.slice(0, 5).join(' | ')}`);
    }

    const pinned = data.get_pinned_repos as Record<string, unknown> | undefined;
    if (pinned?.pinned) {
      const names = (pinned.pinned as any[])
        .map((p) => `${p.name}(★${p.stars})`)
        .join(', ');
      parts.push(`PINNED: ${names}`);
    }

    const contributions = data.get_contribution_stats as Record<string, unknown> | undefined;
    if (contributions?.available) {
      parts.push(
        `CONTRIBUTIONS (1yr): ${contributions.commitsLastYear} commits, ${contributions.pullRequestsLastYear} PRs, ${contributions.issuesLastYear} issues, ${contributions.reposContributedTo} repos`
      );
    }

    const hn = data.search_hackernews as Record<string, unknown> | undefined;
    if (hn) {
      const hnQuery = String(profile?.name || profile?.login || '');
      parts.push(`HN: ${hn.count ?? 0} mentions`);
      if (hnQuery) {
        parts.push(`HN URL: https://hn.algolia.com/?q=${encodeURIComponent(hnQuery)}`);
      }
      const hits = (hn.topHits as any[])?.slice(0, 3).map((h) => h.title).filter(Boolean);
      if (hits?.length) parts.push(`HN TOP: ${hits.join(' | ')}`);
    }

    const devto = data.search_devto as Record<string, unknown> | undefined;
    if (devto?.found) {
      parts.push(`DEVTO: ${devto.articleCount} articles, ${devto.totalReactions} reactions`);
    }

    const web = data.web_search as Record<string, unknown> | undefined;
    if (web?.abstract) {
      parts.push(`WEB: ${web.source} — ${String(web.abstract).slice(0, 200)}`);
      if (web.url) parts.push(`WEB URL: ${web.url}`);
    }

    const readmes = data.get_repo_readme;
    const readmeList = Array.isArray(readmes) ? readmes : readmes ? [readmes] : [];
    for (const readme of readmeList.slice(0, 3)) {
      const preview = (readme as Record<string, unknown>).content;
      if (typeof preview === 'string' && preview.length > 0) {
        parts.push(`README: ${preview.slice(0, 300)}`);
      }
    }

    return parts.join('\n');
  }

  private async synthesizeProfile(
    username: string,
    collectedData: Record<string, unknown>,
    emit: EventEmitter,
    t0: number
  ): Promise<any> {
    const compressStart = Date.now();
    const compressedSummary = this.compressToolData(collectedData);
    console.log(
      `[perf] compress: ${Date.now() - compressStart}ms, ${compressedSummary.length} chars (${Date.now() - t0}ms total)`
    );
    console.log('[synthesis] compressed context length:', compressedSummary.length, 'chars');

    emit({
      type: 'thinking',
      timestamp: new Date().toISOString(),
      thinking: `Synthesizing profile (${compressedSummary.length} chars of compressed evidence)...`,
    });

    const synthesisMessages: ChatMessage[] = [
      { role: 'system', content: SYNTHESIS_PROMPT },
      {
        role: 'user',
        content: `GitHub username: ${username}\n\nCollected data:\n${compressedSummary}`,
      },
    ];

    const synthStart = Date.now();
    console.log(`[synthesis] Starting synthesis call at ${new Date().toISOString()}`);

    const synthesisTimeout = setTimeout(() => {
      console.warn('[synthesis] timeout after 90s — provider too slow, failing over');
    }, SYNTHESIS_TIMEOUT_MS);

    let response;
    try {
      response = await this.gateway.complete(
        {
          messages: synthesisMessages,
          tools: [],
          max_tokens: 4096,
          timeoutMs: SYNTHESIS_TIMEOUT_MS,
          provider: {
            allow_fallbacks: true,
            require_parameters: true,
          },
        },
        emit
      );
    } finally {
      clearTimeout(synthesisTimeout);
    }

    const meta = this.gateway.lastCompletionMeta;
    const via = meta ? `${meta.provider}/${meta.model}` : 'unknown';
    console.log(`[synthesis] Completed in ${Date.now() - synthStart}ms via ${via}`);
    console.log(`[perf] synthesis: ${Date.now() - synthStart}ms (${Date.now() - t0}ms total)`);

    const text = response.choices[0].message.content || '';
    console.log(
      `[synthesis] raw response: ${text.length} chars` +
        ` | head: ${JSON.stringify(text.slice(0, 300))}` +
        ` | tail: ${JSON.stringify(text.slice(-200))}`
    );
    return this.parseProfileJson(text);
  }

  private finalizeSynthesizedProfile(
    s: any,
    username: string,
    githubData: any,
    collectedData: Record<string, unknown>
  ): any {
    this.enforceExpertiseFromLanguages(s, collectedData);
    this.enforceWebPresence(s, username, githubData, collectedData);
    return s;
  }

  private enforceExpertiseFromLanguages(s: any, collectedData: Record<string, unknown>): void {
    const languages = (collectedData.get_aggregated_languages as Record<string, unknown> | undefined)
      ?.languages as Array<{
      name: string;
      level: 'primary' | 'secondary' | 'minor';
      percentage: number;
      repoCount?: number;
    }> | undefined;

    if (!languages?.length) return;

    const topLanguages = languages.slice(0, 6);
    const allowed = new Set(topLanguages.map((lang) => lang.name.toLowerCase()));
    const evidenceByLanguage = new Map(
      (Array.isArray(s.expertise) ? s.expertise : [])
        .filter((item: any) => allowed.has(String(item.language || '').toLowerCase()))
        .map((item: any) => [String(item.language || '').toLowerCase(), item.evidence])
    );

    s.expertise = topLanguages.map((lang) => ({
      language: lang.name,
      level: lang.level,
      percentage: lang.percentage,
      evidence:
        evidenceByLanguage.get(lang.name.toLowerCase()) ||
        `${lang.percentage}% across ${lang.repoCount ?? 'multiple'} repos`,
    }));
  }

  private enforceWebPresence(
    s: any,
    username: string,
    githubData: any,
    collectedData: Record<string, unknown>
  ): void {
    const hn = collectedData.search_hackernews as Record<string, unknown> | undefined;
    const query = githubData?.name || username;
    const hnUrl = `https://hn.algolia.com/?q=${encodeURIComponent(query)}`;

    if (!s.webPresence || typeof s.webPresence !== 'object') {
      s.webPresence = { hackerNews: null, blog: null, other: null };
    }

    const current = String(s.webPresence.hackerNews || '');
    if (!current.startsWith('http')) {
      s.webPresence.hackerNews = hn?.count ? hnUrl : null;
    }

    if (hn?.count != null) {
      s.webPresence.hackerNewsMentions = Number(hn.count);
    }
  }

  private parseProfileJson(text: string): any {
    const cleaned = text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
      .replace(/```json\n?/g, '')
      .replace(/```/g, '')
      .trim();

    const raw = this.extractJsonObject(cleaned);
    if (!raw) throw new Error('Agent did not return valid JSON.');

    try {
      return this.sanitizeProseFields(JSON.parse(raw));
    } catch (err) {
      try {
        return this.sanitizeProseFields(JSON.parse(this.repairJson(raw)));
      } catch {
        console.error(
          `[parseProfileJson] repaired JSON still invalid (${(err as Error).message}). Raw response (first 4000 chars):`,
          raw.slice(0, 4000)
        );
        throw err;
      }
    }
  }

  // Finds the first top-level {...} object by tracking brace depth, so stray
  // braces in surrounding prose (or reasoning text the strip above missed)
  // can't widen the match the way a greedy /\{[\s\S]*\}/ regex would.
  private extractJsonObject(text: string): string | null {
    const start = text.indexOf('{');
    if (start === -1) return null;

    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];

      if (inString) {
        if (escapeNext) escapeNext = false;
        else if (ch === '\\') escapeNext = true;
        else if (ch === '"') inString = false;
        continue;
      }

      if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }

    return null;
  }

  // Smaller/free-tier models occasionally emit near-valid JSON with one of two
  // glitches: (1) a missing comma between array/object elements split across
  // lines, or a trailing comma before a closing bracket; (2) an unescaped
  // double-quote inside a string value (e.g. a bio quoting a phrase), which
  // throws off the parser mid-array/object on otherwise compact single-line
  // output. Patch both before giving up on an otherwise well-formed response.
  private repairJson(raw: string): string {
    const withFixedCommas = raw
      // Stray control characters (raw newlines/tabs inside string values)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
      .replace(/,(\s*[\]}])/g, '$1')
      .replace(/("|\]|\})(\s*)\r?\n(\s*)(")/g, '$1,$2\n$3$4');

    return this.escapeStrayQuotesInStrings(withFixedCommas);
  }

  private escapeStrayQuotesInStrings(text: string): string {
    let out = '';
    let inString = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (!inString) {
        out += ch;
        if (ch === '"') inString = true;
        continue;
      }

      if (ch === '\\') {
        out += ch + (text[i + 1] ?? '');
        i += 1;
        continue;
      }

      if (ch === '"') {
        // A real closing quote is followed (modulo whitespace) by a JSON
        // structural character. Anything else is a stray quote embedded in
        // the string's prose — escape it and keep reading the same string.
        const isClosingQuote = /^\s*[,:\]}]/.test(text.slice(i + 1));
        if (isClosingQuote) {
          out += ch;
          inString = false;
        } else {
          out += '\\"';
        }
        continue;
      }

      out += ch;
    }

    return out;
  }

  private sanitizeProseFields(s: any): any {
    if (!s || typeof s !== 'object') return s;

    const fix = (str: any) => (typeof str === 'string' ? this.fixDroppedSpaces(str) : str);
    const fixEach = (arr: any) => (Array.isArray(arr) ? arr.map(fix) : arr);

    s.headline = fix(s.headline);
    s.summary = fix(s.summary);
    s.techEvolution = fix(s.techEvolution);
    s.communicationStyle = fix(s.communicationStyle);
    s.strengths = fixEach(s.strengths);
    s.growthAreas = fixEach(s.growthAreas);

    if (Array.isArray(s.expertise)) {
      s.expertise = s.expertise.map((item: any) =>
        item && typeof item === 'object' ? { ...item, evidence: fix(item.evidence) } : item
      );
    }

    if (s.openSourceImpact && typeof s.openSourceImpact === 'object') {
      s.openSourceImpact.narrative = fix(s.openSourceImpact.narrative);
      if (Array.isArray(s.openSourceImpact.topRepos)) {
        s.openSourceImpact.topRepos = s.openSourceImpact.topRepos.map((repo: any) =>
          repo && typeof repo === 'object'
            ? { ...repo, description: fix(repo.description), why: fix(repo.why) }
            : repo
        );
      }
    }

    if (s.webPresence && typeof s.webPresence === 'object') {
      s.webPresence.hackerNews = fix(s.webPresence.hackerNews);
      s.webPresence.blog = fix(s.webPresence.blog);
      s.webPresence.other = fix(s.webPresence.other);
    }

    if (s.recruiterPanel && typeof s.recruiterPanel === 'object') {
      s.recruiterPanel.seniorityReason = fix(s.recruiterPanel.seniorityReason);
      s.recruiterPanel.commitStyleInsight = fix(s.recruiterPanel.commitStyleInsight);
      s.recruiterPanel.standoutFacts = fixEach(s.recruiterPanel.standoutFacts);
      s.recruiterPanel.interviewTopics = fixEach(s.recruiterPanel.interviewTopics);
      s.recruiterPanel.redFlags = fixEach(s.recruiterPanel.redFlags);
    }

    return s;
  }

  private fixDroppedSpaces(value: string): string {
    if (value.startsWith('http')) return value;
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  private assembleProfile(
    username: string,
    s: any,
    githubData: any,
    repoData: any
  ): DevProfile {
    return {
      username,
      generatedAt: new Date().toISOString(),
      cacheVersion: CACHE_VERSION,
      github: {
        name: githubData?.name || username,
        avatarUrl: githubData?.avatarUrl || '',
        bio: githubData?.bio || null,
        company: githubData?.company || null,
        location: githubData?.location || null,
        websiteUrl: githubData?.websiteUrl || null,
        followers: githubData?.followers ?? 0,
        following: githubData?.following ?? 0,
        publicRepos: githubData?.publicRepos ?? 0,
        joinedYear: githubData?.joinedYear ?? 0,
        totalStars: repoData?.totalStars ?? 0,
        totalForks: repoData?.totalForks ?? 0,
      },
      headline: s.headline || '',
      summary: s.summary || '',
      expertise: s.expertise || [],
      techEvolution: s.techEvolution || '',
      openSourceImpact: s.openSourceImpact || { narrative: '', topRepos: [] },
      communicationStyle: s.communicationStyle || '',
      webPresence: s.webPresence || { hackerNews: null, blog: null, other: null },
      strengths: s.strengths || [],
      growthAreas: s.growthAreas || [],
      recruiterPanel: s.recruiterPanel || undefined,
    };
  }
}
