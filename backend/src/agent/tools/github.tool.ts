import axios from 'axios';

const GH_API = 'https://api.github.com';
const GH_GRAPHQL = 'https://api.github.com/graphql';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const README_MAX_CHARS = 1500;

const githubAxios = axios.create({
  timeout: 8000,
  headers: {
    ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
    Accept: 'application/vnd.github+json',
    'User-Agent': 'DevScope/1.0',
  },
});

interface GitHubEventCommit {
  message?: string;
}

interface GitHubPullRequest {
  title?: string;
  merged?: boolean;
  merged_at?: string | null;
  base?: {
    repo?: {
      owner?: {
        login?: string;
      };
    };
  };
}

interface GitHubEvent {
  type: string;
  created_at: string;
  repo?: {
    name?: string;
  };
  payload?: {
    commits?: GitHubEventCommit[];
    action?: string;
    pull_request?: GitHubPullRequest;
    review?: {
      state?: string;
    };
  };
}

function isTimeout(err: unknown): boolean {
  return axios.isAxiosError(err) && err.code === 'ECONNABORTED';
}

export async function getGithubProfile(username: string) {
  const { data } = await githubAxios.get(`${GH_API}/users/${username}`);
  return {
    login: data.login,
    name: data.name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    company: data.company,
    location: data.location,
    websiteUrl: data.blog || null,
    followers: data.followers,
    following: data.following,
    publicRepos: data.public_repos,
    joinedYear: new Date(data.created_at).getFullYear(),
  };
}

export async function getRepos(username: string, page: number) {
  const { data } = await githubAxios.get(`${GH_API}/users/${username}/repos`, {
    params: { sort: 'pushed', per_page: 30, page, type: 'owner' },
  });

  const repos = data
    .filter((r: any) => !r.fork)
    .map((r: any) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      pushedAt: r.pushed_at,
      url: r.html_url,
      topics: r.topics || [],
      isArchived: r.archived,
    }))
    .sort((a: any, b: any) => b.stars - a.stars);

  return {
    count: repos.length,
    totalStars: repos.reduce((s: number, r: any) => s + r.stars, 0),
    totalForks: repos.reduce((s: number, r: any) => s + r.forks, 0),
    repos: repos.slice(0, 30),
  };
}

export async function getRepoReadme(owner: string, repo: string) {
  try {
    const { data } = await githubAxios.get(`${GH_API}/repos/${owner}/${repo}/readme`, {
      headers: { Accept: 'application/vnd.github.raw+json' },
    });
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return { found: true, content: content.substring(0, README_MAX_CHARS) };
  } catch (e: any) {
    if (isTimeout(e)) return { found: false, content: 'README fetch timed out.' };
    if (e.response?.status === 404) return { found: false, content: 'No README found.' };
    throw e;
  }
}

export async function getContributionStats(username: string) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalRepositoriesWithContributedCommits
          contributionCalendar { totalContributions }
        }
      }
    }`;

  try {
    const { data } = await githubAxios.post(
      GH_GRAPHQL,
      { query, variables: { login: username } },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const c = data?.data?.user?.contributionsCollection;
    if (!c) return { available: false };

    return {
      available: true,
      commitsLastYear: c.totalCommitContributions,
      pullRequestsLastYear: c.totalPullRequestContributions,
      issuesLastYear: c.totalIssueContributions,
      reposContributedTo: c.totalRepositoriesWithContributedCommits,
      totalContributions: c.contributionCalendar?.totalContributions,
    };
  } catch (err) {
    if (isTimeout(err)) return { available: false, reason: 'timeout' };
    throw err;
  }
}

export async function getPinnedRepos(username: string) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              stargazerCount
              forkCount
              primaryLanguage { name }
              url
            }
          }
        }
      }
    }`;

  try {
    const { data } = await githubAxios.post(
      GH_GRAPHQL,
      { query, variables: { login: username } },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const nodes = data?.data?.user?.pinnedItems?.nodes || [];
    return {
      pinned: nodes.map((n: any) => ({
        name: n.name,
        description: n.description,
        stars: n.stargazerCount,
        forks: n.forkCount,
        language: n.primaryLanguage?.name || 'Unknown',
        url: n.url,
      })),
    };
  } catch (err) {
    if (isTimeout(err)) return { pinned: [], reason: 'timeout' };
    throw err;
  }
}

async function getRepoLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  try {
    const { data } = await githubAxios.get<Record<string, number>>(
      `${GH_API}/repos/${owner}/${repo}/languages`
    );
    return data;
  } catch (err) {
    if (isTimeout(err)) return {};
    throw err;
  }
}

const eventsCache = new Map<string, { at: number; events: GitHubEvent[] }>();
const EVENTS_CACHE_TTL_MS = 30_000;

async function getPublicEvents(username: string): Promise<GitHubEvent[]> {
  const cached = eventsCache.get(username);
  if (cached && Date.now() - cached.at < EVENTS_CACHE_TTL_MS) {
    return cached.events;
  }

  try {
    const { data } = await githubAxios.get<GitHubEvent[]>(`${GH_API}/users/${username}/events/public`, {
      params: { per_page: 100 },
    });
    const events = Array.isArray(data) ? data : [];
    eventsCache.set(username, { at: Date.now(), events });
    return events;
  } catch (err) {
    if (isTimeout(err)) return [];
    throw err;
  }
}

function utcDayKey(value: string): string {
  return value.slice(0, 10);
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso);
  const b = new Date(bIso);
  const diff = Math.max(0, b.getTime() - a.getTime());
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function firstLine(value: string | undefined): string {
  return (value || '').split('\n')[0].trim();
}

function getOwnerRepo(fullName: string | undefined): { owner: string; repo: string } | null {
  if (!fullName) return null;
  const [owner, ...rest] = fullName.split('/');
  if (!owner || rest.length === 0) return null;
  return { owner, repo: rest.join('/') };
}

function longestConsecutiveStreak(days: string[]): number {
  if (days.length === 0) return 0;

  const daySet = new Set(days);
  let longest = 1;

  for (const day of daySet) {
    const previous = new Date(`${day}T00:00:00Z`);
    let streak = 1;

    while (true) {
      previous.setUTCDate(previous.getUTCDate() - 1);
      const key = previous.toISOString().slice(0, 10);
      if (!daySet.has(key)) break;
      streak += 1;
    }

    longest = Math.max(longest, streak);
  }

  return longest;
}

export async function getAggregatedLanguages(
  username: string,
  repoList?: Array<{ fullName: string; name: string }>
) {
  const repos = (repoList ?? (await getRepos(username, 1)).repos)
    .filter((repo: { fullName: string; name: string }) => Boolean(repo.fullName || repo.name))
    .slice(0, 10);

  const totals = new Map<string, { totalBytes: number; repoCount: number }>();

  await Promise.all(
    repos.map(async (repo: { fullName: string; name: string }) => {
      const parsed = getOwnerRepo(repo.fullName || repo.name);
      if (!parsed) return;

      const languages = await getRepoLanguages(parsed.owner, parsed.repo);
      for (const [language, bytes] of Object.entries(languages)) {
        const current = totals.get(language) || { totalBytes: 0, repoCount: 0 };
        current.totalBytes += bytes;
        current.repoCount += 1;
        totals.set(language, current);
      }
    })
  );

  const sorted = [...totals.entries()]
    .sort((a, b) => b[1].totalBytes - a[1].totalBytes || a[0].localeCompare(b[0]));

  const maxBytes = sorted[0]?.[1].totalBytes || 0;
  return {
    languages: sorted.map(([name, stats]) => {
      const percentage = maxBytes > 0 ? Number(((stats.totalBytes / maxBytes) * 100).toFixed(1)) : 0;
      const level: 'primary' | 'secondary' | 'minor' =
        percentage > 30 ? 'primary' : percentage >= 10 ? 'secondary' : 'minor';

      return {
        name,
        percentage,
        totalBytes: stats.totalBytes,
        repoCount: stats.repoCount,
        level,
      };
    }),
  };
}

export async function getCommitActivity(username: string) {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const events = await getPublicEvents(username);
  const pushEvents = events.filter(
    (event) => event.type === 'PushEvent' && new Date(event.created_at).getTime() >= ninetyDaysAgo
  );

  const reposCommittedTo = new Set<string>();
  const commitMessages: string[] = [];
  const activeDays = new Set<string>();
  const commitsByRepo = new Map<string, number>();
  let totalCommitsLast90Days = 0;
  let weekdayCommits = 0;
  let lastCommitDate = '';

  for (const event of pushEvents) {
    const repoName = event.repo?.name || 'unknown';
    reposCommittedTo.add(repoName);
    const createdAt = event.created_at;
    lastCommitDate = !lastCommitDate || createdAt > lastCommitDate ? createdAt : lastCommitDate;
    activeDays.add(utcDayKey(createdAt));

    const commits = event.payload?.commits || [];
    const commitCount = commits.length > 0 ? commits.length : 1;
    totalCommitsLast90Days += commitCount;
    commitsByRepo.set(repoName, (commitsByRepo.get(repoName) || 0) + commitCount);

    const day = new Date(createdAt).getUTCDay();
    if (day >= 1 && day <= 5) weekdayCommits += commitCount;

    for (const commit of commits) {
      if (commitMessages.length < 50) {
        commitMessages.push(firstLine(commit.message));
      }
    }
  }

  const sortedDays = [...activeDays].sort();
  const longestStreak = longestConsecutiveStreak(sortedDays);
  const lastActiveDaysSince = lastCommitDate ? daysBetween(lastCommitDate, new Date().toISOString()) : 9999;
  const topActiveRepos = [...commitsByRepo.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([repo, commits]) => ({ repo, commits }));

  return {
    totalCommitsLast90Days,
    lastCommitDate,
    daysSinceLastCommit: lastActiveDaysSince,
    reposCommittedTo: [...reposCommittedTo],
    commitMessages,
    activeDays: activeDays.size,
    longestStreak,
    weekdayPercent: totalCommitsLast90Days > 0 ? Number(((weekdayCommits / totalCommitsLast90Days) * 100).toFixed(1)) : 0,
    topActiveRepos,
  };
}

export async function getPRActivity(username: string) {
  const events = await getPublicEvents(username);
  const prEvents = events.filter((event) => event.type === 'PullRequestEvent');
  const reviewEvents = events.filter((event) => event.type === 'PullRequestReviewEvent');
  const recentPRTitles = new Set<string>();

  let prsOpened = 0;
  let prsMerged = 0;
  let externalContributions = 0;

  for (const event of prEvents) {
    const pullRequest = event.payload?.pull_request;
    if (!pullRequest) continue;

    if (event.payload?.action === 'opened') {
      prsOpened += 1;
      const repoName = event.repo?.name || '';
      if (repoName && !repoName.toLowerCase().startsWith(`${username.toLowerCase()}/`)) {
        externalContributions += 1;
      }
      if (pullRequest.title && recentPRTitles.size < 10) {
        recentPRTitles.add(pullRequest.title);
      }
    }

    if (event.payload?.action === 'closed' && pullRequest.merged) {
      prsMerged += 1;
    }
  }

  const reviewsGiven = reviewEvents.length;

  return {
    prsOpened,
    prsMerged,
    reviewsGiven,
    externalContributions,
    recentPRTitles: [...recentPRTitles].slice(0, 10),
  };
}
