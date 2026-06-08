import { searchHackerNews, searchDevto, webSearch } from './external.tool';
export { executeTool } from './executor';

export const toolDefinitions = [
  {
    type: 'function' as const,
    function: {
      name: 'get_github_profile',
      description:
        'Fetch basic GitHub user profile: name, bio, followers, join year, public repo count, company, location.',
      parameters: {
        type: 'object',
        properties: { username: { type: 'string' } },
        required: ['username'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_repos',
      description:
        'List a user public repos (forks excluded), sorted by stars. Returns name, description, language, stars, forks, topics, plus total stars/forks. 30 per page.',
      parameters: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          page: { type: 'number', description: 'Page number, start at 1.' },
        },
        required: ['username', 'page'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_repo_readme',
      description:
        'Fetch the README of a repo (first 4000 chars). Use on top 2-3 repos to assess documentation quality and communication style.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
        },
        required: ['owner', 'repo'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_contribution_stats',
      description:
        'Get commit/PR/issue activity for the last year via GitHub GraphQL. Reveals how active and collaborative the developer is.',
      parameters: {
        type: 'object',
        properties: { username: { type: 'string' } },
        required: ['username'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_pinned_repos',
      description:
        'Get the repos a user pinned to their profile. These represent what the developer considers their best work.',
      parameters: {
        type: 'object',
        properties: { username: { type: 'string' } },
        required: ['username'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_aggregated_languages',
      description:
        'Get real language percentages by byte count across top repos. USE THIS instead of guessing language levels. Returns accurate percentage per language.',
      parameters: {
        type: 'object',
        properties: { username: { type: 'string' } },
        required: ['username'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_commit_activity',
      description:
        'Analyze recent commit patterns, consistency score, last active date, and commit message quality signals from the last 90 days of public push events',
      parameters: {
        type: 'object',
        properties: { username: { type: 'string' } },
        required: ['username'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_pr_activity',
      description:
        'Get pull request and code review activity — essential for assessing collaboration, teamwork, and external open source contributions',
      parameters: {
        type: 'object',
        properties: { username: { type: 'string' } },
        required: ['username'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_hackernews',
      description:
        'Search Hacker News for mentions of a developer by name or username. Reveals community reputation and notable discussions.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_devto',
      description:
        'Find DEV.to articles by this username. Reveals technical writing habits and communication style.',
      parameters: {
        type: 'object',
        properties: { username: { type: 'string' } },
        required: ['username'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description:
        'General web search for blog posts, talks, or other public presence. Use when GitHub data is thin.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
];

export function summarizeToolResult(name: string, result: any): string {
  switch (name) {
    case 'get_github_profile':
      return `${result.name || result.login} · ${result.followers} followers · ${result.publicRepos} repos · joined ${result.joinedYear}`;
    case 'get_repos':
      return `${result.count} repos, ${result.totalStars} total stars. Top: ${result.repos.slice(0, 3).map((r: any) => `${r.name} (★${r.stars})`).join(', ')}`;
    case 'get_repo_readme':
      return result.found ? `README fetched (${result.content.length} chars)` : 'No README found';
    case 'get_contribution_stats':
      return result.available
        ? `${result.commitsLastYear} commits, ${result.pullRequestsLastYear} PRs last year`
        : 'Contribution stats unavailable';
    case 'get_pinned_repos':
      return `${result.pinned.length} pinned repos`;
    case 'get_aggregated_languages':
      return result.languages?.length
        ? result.languages
            .slice(0, 3)
            .map((language: any) => `${language.name} ${language.percentage}%`)
            .join(', ')
        : 'No language data';
    case 'get_commit_activity':
      return `${result.totalCommitsLast90Days} commits in 90 days, last active ${result.daysSinceLastCommit}d ago`;
    case 'get_pr_activity':
      return `${result.prsOpened} PRs opened, ${result.prsMerged} merged, ${result.reviewsGiven} reviews`;
    case 'search_hackernews':
      return `${result.count} HN mentions found`;
    case 'search_devto':
      return result.found ? `${result.articleCount} DEV.to articles` : 'No DEV.to presence';
    case 'web_search':
      return result.abstract ? `Found: ${result.source}` : 'No notable web results';
    default:
      return 'Done';
  }
}
