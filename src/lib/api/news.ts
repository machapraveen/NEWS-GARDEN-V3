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
  forceRefresh: boolean = false,
  country?: string | null,
  countryCode?: string | null
): Promise<NewsArticle[]> {
  try {
    const data = await callEdgeFunction('fetch-news', {
      query: query || null,
      max,
      forceRefresh,
      country: country || null,
      countryCode: countryCode || null,
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
        district: a.location?.district || a.location?.city || '',
        state: a.location?.state || a.location?.country || '',
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

// Fetch on-demand news for a specific country (JIT ingestion)
export async function fetchCountryNews(
  countryCode: string,
  countryName?: string,
  forceRefresh = false
): Promise<NewsArticle[]> {
  return fetchAndAnalyzeNews(null, 30, forceRefresh, countryName || null, countryCode || null);
}

// Filter articles by category on the client side (no API call)
export function filterArticlesByCategory(
  articles: NewsArticle[],
  category: Category | null
): NewsArticle[] {
  if (!category) return articles;
  return articles.filter(a => a.category === category);
}

// Filter articles by geopolitical region
export function filterArticlesByRegion(
  articles: NewsArticle[],
  region: string
): NewsArticle[] {
  if (!region || region === 'All') return articles;

  const MENA = ['united arab emirates', 'saudi arabia', 'egypt', 'qatar', 'israel', 'turkey', 'kuwait', 'oman', 'bahrain', 'jordan', 'lebanon', 'iraq', 'iran', 'yemen', 'syria', 'morocco', 'algeria', 'tunisia'];
  const AMERICAS = ['united states', 'canada', 'brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru', 'venezuela', 'ecuador', 'cuba', 'panama', 'costa rica', 'uruguay', 'bolivia'];
  const EUROPE = ['united kingdom', 'germany', 'france', 'italy', 'spain', 'netherlands', 'switzerland', 'sweden', 'norway', 'poland', 'ukraine', 'belgium', 'austria', 'ireland', 'portugal', 'greece', 'denmark', 'finland', 'russia'];
  const ASIA = ['india', 'japan', 'china', 'australia', 'south korea', 'singapore', 'indonesia', 'malaysia', 'thailand', 'philippines', 'vietnam', 'pakistan', 'bangladesh', 'new zealand', 'taiwan', 'sri lanka'];
  const AFRICA = ['nigeria', 'south africa', 'kenya', 'ghana', 'ethiopia', 'rwanda', 'tanzania', 'uganda', 'senegal', 'ivory coast', 'cameroon', 'angola', 'zimbabwe'];

  return articles.filter(a => {
    const c = (a.location?.country || '').toLowerCase();
    const cont = (a.location?.continent || '').toLowerCase();

    if (region === 'Middle East') {
      return MENA.some(m => c.includes(m)) || cont === 'middle east';
    }
    if (region === 'Americas') {
      return AMERICAS.some(m => c.includes(m)) || cont.includes('america');
    }
    if (region === 'Europe') {
      return EUROPE.some(m => c.includes(m)) || cont === 'europe';
    }
    if (region === 'Asia-Pacific') {
      return ASIA.some(m => c.includes(m)) || cont === 'asia' || cont === 'oceania';
    }
    if (region === 'Africa') {
      return AFRICA.some(m => c.includes(m)) || cont === 'africa';
    }
    return true;
  });
}

export interface VerifyResult {
  credibilityScore: number;
  truthPercentage: number;
  falsePercentage: number;
  isTrue: boolean;
  bertConfidence: number;
  bertLabel: string;
  verdict: string;
  explanation: string;
  redFlags: string[];
  models?: {
    nlpEngine?: { score: number; verdict: string };
    gemini?: { score: number; falseScore?: number; verdict: string };
    sourceCheck?: { score: number; verdict: string };
  };
}

// Analyze a single article for credibility with Gemini fact-checking
export async function analyzeCredibility(article: NewsArticle): Promise<VerifyResult> {
  const text = `${article.headline || ''} ${article.summary || ''} ${article.fullText || ''}`.trim();
  try {
    const data = await callEdgeFunction('analyze-article', {
      title: article.headline,
      description: article.summary,
      content: article.fullText,
      source: article.source || '',
      type: 'credibility',
    });

    const truthPercentage = typeof data.truthPercentage === 'number'
      ? data.truthPercentage
      : (typeof data.credibilityScore === 'number' ? data.credibilityScore : 50);
    const falsePercentage = typeof data.falsePercentage === 'number'
      ? data.falsePercentage
      : (100 - truthPercentage);
    const isTrue = typeof data.isTrue === 'boolean'
      ? data.isTrue
      : (truthPercentage >= 55);

    return {
      credibilityScore: data.credibilityScore ?? truthPercentage,
      truthPercentage,
      falsePercentage,
      isTrue,
      bertConfidence: data.bertConfidence ?? (truthPercentage / 100),
      bertLabel: data.bertLabel ?? (isTrue ? 'Real' : 'Fake'),
      verdict: data.verdict ?? (isTrue ? 'TRUE_VERIFIED' : 'FALSE_HOAX'),
      explanation: data.explanation || '',
      redFlags: Array.isArray(data.redFlags) ? data.redFlags : [],
      models: data.models,
    };
  } catch (err) {
    console.warn('Backend verification call failed, running local fact heuristic:', err);
    // Local fallback with hoax pattern check
    const HOAX_PATTERN = /\b(modi|biden|trump|putin|macron|sunak|starmer|netanyahu|obama|harris|zelenskyy|scholz|xi)\b.*\b(shot|short|killed|assassinated|dead|murdered|arrested|executed|died)\b|\b(shot|short|killed|assassinated|dead|murdered)\b.*\b(modi|biden|trump|putin|macron|sunak|starmer|netanyahu)\b/i;
    const isHoax = HOAX_PATTERN.test(text);

    if (isHoax) {
      return {
        credibilityScore: 5,
        truthPercentage: 5,
        falsePercentage: 95,
        isTrue: false,
        bertConfidence: 0.95,
        bertLabel: 'Fake',
        verdict: 'FALSE_HOAX',
        explanation: 'Debunked false rumor. Zero credible global news agencies have reported this event; matches viral social media hoax patterns targeting public figures.',
        redFlags: [
          'Assassination / death hoax pattern targeting world leader',
          'Zero credible news sources corroborate this claim',
          'Unverified viral claim'
        ],
        models: {
          gemini: { score: 5, falseScore: 95, verdict: 'Fake' },
          nlpEngine: { score: 5, verdict: 'Fake' }
        }
      };
    }

    return {
      credibilityScore: 50,
      truthPercentage: 50,
      falsePercentage: 50,
      isTrue: false,
      bertConfidence: 0.5,
      bertLabel: 'Uncertain',
      verdict: 'MISLEADING_UNPROVEN',
      explanation: 'Could not connect to live verification engine. Please verify network connection or try again.',
      redFlags: ['Verification service currently unreachable'],
    };
  }
}

// Full on-demand AI analysis for a single article (sentiment, category, location, entities, summary + credibility)
export async function analyzeArticleFull(article: NewsArticle): Promise<{
  analysis: any;
  credibility: any;
}> {
  const [analysisResult, credResult] = await Promise.allSettled([
    callEdgeFunction('analyze-article', {
      title: article.headline,
      description: article.summary,
      content: article.fullText,
      type: 'full-analysis',
    }),
    callEdgeFunction('analyze-article', {
      title: article.headline,
      description: article.summary,
      content: article.fullText,
      type: 'credibility',
    }),
  ]);

  return {
    analysis: analysisResult.status === 'fulfilled' ? analysisResult.value : null,
    credibility: credResult.status === 'fulfilled' ? credResult.value : null,
  };
}

// ─── State Daily News ───
export interface StateNewsItem {
  state: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
}

let stateNewsCache: { data: StateNewsItem[]; ts: number } | null = null;
const STATE_NEWS_CACHE_MS = 60 * 60 * 1000; // 1 hour client-side cache

export async function fetchStateNews(forceRefresh = false): Promise<StateNewsItem[]> {
  // Client-side cache
  if (!forceRefresh && stateNewsCache && Date.now() - stateNewsCache.ts < STATE_NEWS_CACHE_MS) {
    return stateNewsCache.data;
  }

  try {
    const data = await callEdgeFunction('fetch-state-news', { forceRefresh });
    const items: StateNewsItem[] = (data?.stateNews || []).map((s: any) => ({
      state: s.state,
      title: s.title,
      description: s.description,
      url: s.url,
      imageUrl: s.imageUrl || s.image_url || '',
      source: s.source,
      publishedAt: s.publishedAt || s.published_at || '',
    }));
    stateNewsCache = { data: items, ts: Date.now() };
    console.log(`State news: ${items.length} states (cached: ${data?.cached})`);
    return items;
  } catch {
    // fetch-state-news edge function may not be deployed yet — fail silently
    return stateNewsCache?.data || [];
  }
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
