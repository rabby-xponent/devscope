import { searchHackerNews, searchDevto, webSearch } from './external.tool';
import {
  getGithubProfile,
  getRepos,
  getRepoReadme,
  getContributionStats,
  getPinnedRepos,
  getAggregatedLanguages,
  getCommitActivity,
  getPRActivity,
} from './github.tool';

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
    case 'get_aggregated_languages':
      return getAggregatedLanguages(input.username);
    case 'get_commit_activity':
      return getCommitActivity(input.username);
    case 'get_pr_activity':
      return getPRActivity(input.username);
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
