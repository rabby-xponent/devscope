import axios from 'axios';

const GH_API = 'https://api.github.com';
const GH_GRAPHQL = 'https://api.github.com/graphql';

function headers() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Authorization: token ? `token ${token}` : '',
    Accept: 'application/vnd.github+json',
    'User-Agent': 'DevScope-Agent',
  };
}

export async function getGithubProfile(username: string) {
  const { data } = await axios.get(`${GH_API}/users/${username}`, { headers: headers() });
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
  const { data } = await axios.get(`${GH_API}/users/${username}/repos`, {
    headers: headers(),
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
    const { data } = await axios.get(`${GH_API}/repos/${owner}/${repo}/readme`, {
      headers: { ...headers(), Accept: 'application/vnd.github.raw+json' },
    });
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return { found: true, content: content.substring(0, 4000) };
  } catch (e: any) {
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

  const { data } = await axios.post(
    GH_GRAPHQL,
    { query, variables: { login: username } },
    { headers: { ...headers(), 'Content-Type': 'application/json' } }
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

  const { data } = await axios.post(
    GH_GRAPHQL,
    { query, variables: { login: username } },
    { headers: { ...headers(), 'Content-Type': 'application/json' } }
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
}
