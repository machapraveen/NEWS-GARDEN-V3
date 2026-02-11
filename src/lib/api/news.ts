import { supabase } from "@/integrations/supabase/client";
import type { NewsArticle, Sentiment, Category, NamedEntity } from "@/data/mockNews";

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

// Single API call to fetch news (no category = general top headlines)
async function fetchNewsFromAPI(
  query: string | null,
  max: number
): Promise<GNewsArticle[]> {
  const { data, error } = await supabase.functions.invoke('fetch-news', {
    body: { category: null, query, max },
  });

  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }

  return (data as GNewsResponse)?.articles || [];
}

// Main function: fetch ALL news once, analyze, and return
// Category filtering happens on the client side after data is loaded
export async function fetchAndAnalyzeNews(
  query?: string | null,
  max: number = 25
): Promise<NewsArticle[]> {
  const gnewsArticles = await fetchNewsFromAPI(query || null, max);

  if (!gnewsArticles.length) return [];

  // Batch analyze all articles in a single AI call
  const articlesForAnalysis = gnewsArticles.map(a => ({
    title: a.title,
    description: a.description,
    content: (a.content || a.description || a.title).slice(0, 1500),
  }));

  let analyses: any[] = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-article', {
        body: { articles: articlesForAnalysis, type: 'full-analysis' },
      });

      if (error) {
        if (attempt < 2) {
          const wait = Math.pow(2, attempt + 1) * 2000;
          console.warn(`Batch analysis rate limited, attempt ${attempt + 1}, retrying in ${wait}ms...`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        console.error('Batch analysis failed after retries:', error);
        break;
      }

      analyses = data?.results || [];
      break;
    } catch (err) {
      if (attempt < 2) {
        const wait = Math.pow(2, attempt + 1) * 2000;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      console.error('Batch analysis error:', err);
    }
  }

  return gnewsArticles.map((article, index) => {
    const analysis = analyses[index];
    return analysis
      ? transformArticle(article, analysis, index)
      : createFallbackArticle(article, index);
  });
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
  const { data, error } = await supabase.functions.invoke('analyze-article', {
    body: {
      title: article.headline,
      description: article.summary,
      content: article.fullText,
      type: 'credibility',
    },
  });

  if (error) throw new Error('Credibility analysis failed');
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

function transformArticle(gnews: GNewsArticle, analysis: any, index: number): NewsArticle {
  const location = analysis.location || { city: 'Unknown', country: 'Unknown', continent: 'Unknown', lat: 0, lng: 0 };

  return {
    id: `live-${index}-${Date.now()}`,
    headline: gnews.title,
    summary: gnews.description || '',
    fullText: gnews.content || gnews.description || '',
    source: gnews.source?.name || 'Unknown',
    sourceUrl: gnews.url,
    imageUrl: gnews.image,
    timestamp: gnews.publishedAt,
    category: (analysis.category || 'Technology') as Category,
    sentiment: (analysis.sentiment || 'neutral') as Sentiment,
    sentimentScore: analysis.sentimentScore ?? 0.5,
    credibilityScore: analysis.credibilityScore ?? 70,
    bertConfidence: 0.85,
    communityReports: 0,
    location: {
      city: location.city || 'Unknown',
      district: '',
      state: '',
      country: location.country || 'Unknown',
      continent: location.continent || 'Unknown',
      lat: location.lat || 0,
      lng: location.lng || 0,
    },
    entities: (analysis.entities || []) as NamedEntity[],
    crossSources: [],
    aiSummary: analysis.aiSummary || gnews.description || '',
  };
}

function createFallbackArticle(gnews: GNewsArticle, index: number): NewsArticle {
  return {
    id: `live-${index}-${Date.now()}`,
    headline: gnews.title,
    summary: gnews.description || '',
    fullText: gnews.content || gnews.description || '',
    source: gnews.source?.name || 'Unknown',
    sourceUrl: gnews.url,
    imageUrl: gnews.image,
    timestamp: gnews.publishedAt,
    category: 'Technology' as Category,
    sentiment: 'neutral' as Sentiment,
    sentimentScore: 0.5,
    credibilityScore: 70,
    bertConfidence: 0.5,
    communityReports: 0,
    location: {
      city: 'Unknown',
      district: '',
      state: '',
      country: 'Unknown',
      continent: 'Unknown',
      lat: 0,
      lng: 0,
    },
    entities: [],
    crossSources: [],
    aiSummary: gnews.description || '',
  };
}
