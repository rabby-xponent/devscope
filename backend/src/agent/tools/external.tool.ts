import axios from 'axios';

export async function searchHackerNews(query: string) {
  const { data } = await axios.get('https://hn.algolia.com/api/v1/search', {
    params: { query, tags: '(story,comment)', hitsPerPage: 8 },
    timeout: 8000,
  });

  const hits = (data.hits || []).map((h: any) => ({
    title: h.title || h.story_title || null,
    points: h.points,
    author: h.author,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    snippet: h.comment_text ? h.comment_text.substring(0, 200) : null,
    createdAt: h.created_at,
  }));

  return {
    count: data.nbHits,
    topHits: hits.slice(0, 6),
  };
}

export async function searchDevto(username: string) {
  try {
    const { data } = await axios.get('https://dev.to/api/articles', {
      params: { username, per_page: 10 },
      timeout: 8000,
    });

    if (!Array.isArray(data) || data.length === 0) {
      return { found: false, articles: [] };
    }

    return {
      found: true,
      articleCount: data.length,
      totalReactions: data.reduce((s: number, a: any) => s + (a.positive_reactions_count || 0), 0),
      articles: data.slice(0, 6).map((a: any) => ({
        title: a.title,
        reactions: a.positive_reactions_count,
        comments: a.comments_count,
        tags: a.tag_list,
        publishedAt: a.published_at,
        url: a.url,
      })),
    };
  } catch {
    return { found: false, articles: [] };
  }
}

export async function webSearch(query: string) {
  try {
    const { data } = await axios.get('https://api.duckduckgo.com/', {
      params: { q: query, format: 'json', no_redirect: 1, no_html: 1 },
      timeout: 8000,
    });

    return {
      abstract: data.Abstract || null,
      source: data.AbstractSource || null,
      url: data.AbstractURL || null,
      relatedTopics: (data.RelatedTopics || [])
        .slice(0, 5)
        .map((t: any) => t.Text)
        .filter(Boolean),
    };
  } catch {
    return { abstract: null, relatedTopics: [] };
  }
}
