import {
  getGithubProfile,
  getRepos,
  getRepoReadme,
  getContributionStats,
  getPinnedRepos,
} from './github.tool';
import { searchHackerNews, searchDevto, webSearch } from './external.tool';

export const toolDefinitions = [
  {
    name: 'get_github_profile',
    description:
      'Fetch basic GitHub user profile: name, bio, followers, join year, public repo count, company, location.',
    input_schema: {
      type: 'object' as const,
      properties: { username: { type: 'string' } },
      required: ['username'],
    },
  },
  {
    name: 'get_repos',
    description:
      'List a user public repos (forks excluded), sorted by stars. Returns name, description, language, stars, forks, topics, plus total stars/forks. 30 per page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        username: { type: 'string' },
        page: { type: 'number', description: 'Page number, start at 1.' },
      },
      required: ['username', 'page'],
    },
  },
  {
    name: 'get_repo_readme',
    description:
      'Fetch the README of a repo (first 4000 chars). Use on top 2-3 repos to assess documentation quality and communication style.',
    input_schema: {
      type: 'object' as const,
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_contribution_stats',
    description:
      'Get commit/PR/issue activity for the last year via GitHub GraphQL. Reveals how active and collaborative the developer is.',
    input_schema: {
      type: 'object' as const,
      properties: { username: { type: 'string' } },
      required: ['username'],
    },
  },
  {
    name: 'get_pinned_repos',
    description:
      'Get the repos a user pinned to their profile. These represent what the developer considers their best work.',
    input_schema: {
      type: 'object' as const,
      properties: { username: { type: 'string' } },
      required: ['username'],
    },
  },
  {
    name: 'search_hackernews',
    description:
      'Search Hacker News for mentions of a developer by name or username. Reveals community reputation and notable discussions.',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'search_devto',
    description:
      'Find DEV.to articles by this username. Reveals technical writing habits and communication style.',
    input_schema: {
      type: 'object' as const,
      properties: { username: { type: 'string' } },
      required: ['username'],
    },
  },
  {
    name: 'web_search',
    description:
      'General web search for blog posts, talks, or other public presence. Use when GitHub data is thin.',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
];

export async function executeTool(name: string, input: Record<string, any>): Promise<any> {
  switch (name) {
    case 'get_github_profile':
      return getGithubProfile(input.username);
    case 'get_repos':
      return getRepos(input.username, input.page ?? 1);
    case 'get_repo_readme':
      return getRepoReadme(input.owner, input.repo);
    case 'get_contribution_stats':
      return getContributionStats(input.username);
    case 'get_pinned_repos':
      return getPinnedRepos(input.username);
    case 'search_hackernews':
      return searchHackerNews(input.query);
    case 'search_devto':
      return searchDevto(input.username);
    case 'web_search':
      return webSearch(input.query);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

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
