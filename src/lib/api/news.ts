import type { NewsArticle, Sentiment, Category, NamedEntity } from "@/data/mockNews";

const EDGE_URL = import.meta.env.VITE_EDGE_FUNCTIONS_URL;
const EDGE_KEY = import.meta.env.VITE_EDGE_FUNCTIONS_KEY;

// Call edge function via direct fetch
async function callEdgeFunction(functionName: string, body: any): Promise<any> {
  const response = await fetch(`${EDGE_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EDGE_KEY}`,
      'apikey': EDGE_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Edge function ${functionName} error: ${response.status}`);
  }

  return response.json();
}

// Main function: fetch analyzed news (server handles caching + analysis)
export async function fetchAndAnalyzeNews(
  query?: string | null,
  max: number = 25,
  forceRefresh: boolean = false
): Promise<NewsArticle[]> {
  try {
    const data = await callEdgeFunction('fetch-news', {
      query: query || null,
      max,
      forceRefresh,
    });

    const articles = data?.articles || [];
    console.log(`Received ${articles.length} articles (source: ${data?.source}, cached: ${data?.cached})`);

    return articles.map((a: any, index: number) => ({
      id: a.id || `article-${index}-${Date.now()}`,
      headline: a.headline || a.title || '',
      summary: a.summary || a.description || '',
      fullText: a.fullText || a.content || a.summary || '',
      source: a.source || 'Unknown',
      sourceUrl: a.sourceUrl || a.url || '',
      imageUrl: a.imageUrl || a.image || '',
      timestamp: a.timestamp || a.publishedAt || new Date().toISOString(),
      category: (a.category || 'Technology') as Category,
      sentiment: (a.sentiment || 'neutral') as Sentiment,
      sentimentScore: a.sentimentScore ?? 0.5,
      credibilityScore: a.credibilityScore ?? 70,
      bertConfidence: a.bertConfidence ?? 0.5,
      communityReports: 0,
      location: {
        city: a.location?.city || 'Unknown',
        district: '',
        state: '',
        country: a.location?.country || 'Unknown',
        continent: a.location?.continent || 'Unknown',
        lat: a.location?.lat || 0,
        lng: a.location?.lng || 0,
      },
      entities: (a.entities || []) as NamedEntity[],
      crossSources: [],
      aiSummary: a.aiSummary || a.summary || '',
    }));
  } catch (err) {
    console.error('Failed to fetch news:', err);
    return [];
  }
}

// Filter articles by category on the client side (no API call)
export function filterArticlesByCategory(
  articles: NewsArticle[],
  category: Category | null
): NewsArticle[] {
  if (!category) return articles;
  return articles.filter(a => a.category === category);
}

// Analyze a single article for credibility (used in ArticleDetail)
export async function analyzeCredibility(article: NewsArticle) {
  const data = await callEdgeFunction('analyze-article', {
    title: article.headline,
    description: article.summary,
    content: article.fullText,
    type: 'credibility',
  });

  return data;
}

// Generate a content hash to detect if news actually changed
export function generateContentHash(articles: NewsArticle[]): string {
  const titles = articles.map(a => a.headline).sort().join('|');
  let hash = 0;
  for (let i = 0; i < titles.length; i++) {
    const char = titles.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}
