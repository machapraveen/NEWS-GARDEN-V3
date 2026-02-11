import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CACHE_HOURS = 12; // Fetch fresh news only every 12 hours

interface RawArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
}

interface AnalyzedArticle {
  id: string;
  headline: string;
  summary: string;
  fullText: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  timestamp: string;
  category: string;
  sentiment: string;
  sentimentScore: number;
  credibilityScore: number;
  bertConfidence: number;
  location: {
    city: string;
    district: string;
    state: string;
    country: string;
    continent: string;
    lat: number;
    lng: number;
  };
  entities: { text: string; type: string }[];
  aiSummary: string;
}

// ─── Supabase Admin Client ───
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// ─── Check if cache is fresh ───
async function getCachedArticles(supabase: any): Promise<AnalyzedArticle[] | null> {
  // Check last fetch time
  const { data: log } = await supabase
    .from('news_fetch_log')
    .select('fetched_at, batch_id')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (!log) return null;

  const hoursSinceLastFetch = (Date.now() - new Date(log.fetched_at).getTime()) / (1000 * 60 * 60);
  console.log(`Last fetch: ${log.fetched_at}, hours ago: ${hoursSinceLastFetch.toFixed(2)}`);
  if (hoursSinceLastFetch >= CACHE_HOURS) return null;

  // Fetch the most recent 100 articles (ordered by when they were stored)
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(100);

  if (error) { console.error('Cache read error:', error); return null; }
  if (!articles || articles.length === 0) return null;

  // Transform DB rows to frontend format
  return articles.map((a: any) => ({
    id: a.id,
    headline: a.title,
    summary: a.summary || '',
    fullText: a.summary || '',
    source: a.source_name || 'Unknown',
    sourceUrl: a.url || '',
    imageUrl: a.image_url || '',
    timestamp: a.published_at || new Date().toISOString(),
    category: a.category || 'Technology',
    sentiment: a.sentiment_label || 'neutral',
    sentimentScore: a.sentiment_score ?? 0.5,
    credibilityScore: a.credibility_score ?? 70,
    bertConfidence: a.roberta_fake_score ?? 0.5,
    location: {
      city: a.city || 'Unknown',
      district: a.district || '',
      state: a.state || '',
      country: a.country || 'Unknown',
      continent: a.continent || 'Unknown',
      lat: a.latitude || 0,
      lng: a.longitude || 0,
    },
    entities: a.entities || [],
    aiSummary: a.ai_summary || a.summary || '',
  }));
}

// ─── Store articles in database ───
async function storeArticles(supabase: any, articles: AnalyzedArticle[], source: string) {
  const now = new Date().toISOString();
  const batchId = `batch-${Date.now()}`;

  // Insert articles
  const rows = articles.map(a => ({
    id: a.id,
    title: a.headline,
    summary: a.summary,
    ai_summary: a.aiSummary,
    url: a.sourceUrl,
    image_url: a.imageUrl,
    source_name: a.source,
    source_domain: a.source,
    city: a.location.city,
    district: a.location.district,
    state: a.location.state,
    country: a.location.country,
    continent: a.location.continent,
    latitude: a.location.lat,
    longitude: a.location.lng,
    category: a.category,
    sentiment_score: a.sentimentScore,
    sentiment_label: a.sentiment,
    credibility_score: a.credibilityScore,
    roberta_fake_score: a.bertConfidence,
    entities: a.entities,
    published_at: a.timestamp,
    fetched_at: now,
    created_at: now,
    updated_at: now,
  }));

  const { error: insertErr } = await supabase
    .from('news_articles')
    .upsert(rows, { onConflict: 'id' });

  if (insertErr) console.error('Error storing articles:', insertErr);

  // Log the fetch
  const { error: logErr } = await supabase
    .from('news_fetch_log')
    .insert({ fetched_at: now, article_count: articles.length, source, batch_id: batchId });

  if (logErr) console.error('Error logging fetch:', logErr);

  console.log(`Stored ${articles.length} articles in database (batch: ${batchId})`);
}

// ─── Fetch from GNews API (supports country filter) ───
async function fetchGNews(apiKey: string, query?: string, max = 25, country?: string): Promise<RawArticle[]> {
  let url: string;
  const params = new URLSearchParams({
    lang: 'en',
    max: String(max),
    apikey: apiKey,
  });

  if (country) {
    params.set('country', country);
  }

  if (query) {
    url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&${params.toString()}`;
  } else {
    params.set('category', 'general');
    url = `https://gnews.io/api/v4/top-headlines?${params.toString()}`;
  }

  console.log('Fetching from GNews:', url.replace(apiKey, '***'));
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('GNews error:', response.status, await response.text());
      return [];
    }
    const data = await response.json();
    return (data.articles || []).map((a: any) => ({
      title: a.title || '',
      description: a.description || '',
      content: a.content || a.description || '',
      url: a.url || '',
      image: a.image || '',
      publishedAt: a.publishedAt || new Date().toISOString(),
      source: { name: a.source?.name || 'Unknown', url: a.source?.url || '' },
    }));
  } catch (err) {
    console.error('GNews fetch error:', err);
    return [];
  }
}

// ─── GDELT API (enrichment + fallback) ───
async function fetchGDELT(query?: string, max = 50): Promise<RawArticle[]> {
  const searchQuery = query || 'world news';
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(searchQuery)} sourcelang:english&mode=ArtList&maxrecords=${max}&format=json&sort=DateDesc&timespan=1d`;

  console.log('Fetching from GDELT for enrichment');
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.articles || []).map((a: any) => ({
      title: a.title || '',
      description: a.seendate ? `Published ${a.seendate}` : '',
      content: a.title || '',
      url: a.url || '',
      image: a.socialimage || '',
      publishedAt: a.seendate
        ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')).toISOString()
        : new Date().toISOString(),
      source: { name: a.domain || 'Unknown', url: a.url || '' },
    }));
  } catch (err) {
    console.error('GDELT fetch error:', err);
    return [];
  }
}

// ─── Read state news from DB and convert to RawArticle format ───
async function getStateNewsAsRaw(supabase: any): Promise<RawArticle[]> {
  try {
    const { data, error } = await supabase
      .from('state_daily_news')
      .select('*')
      .order('state', { ascending: true });

    if (error || !data || data.length === 0) return [];

    return data.map((d: any) => ({
      title: d.title || '',
      description: d.description || '',
      content: d.description || d.title || '',
      url: d.url || '',
      image: d.image_url || '',
      publishedAt: d.published_at || new Date().toISOString(),
      source: { name: d.source || 'Unknown', url: '' },
    }));
  } catch {
    return [];
  }
}

// ─── Multi-region fetch: 5 parallel calls for ~100 articles ───
async function fetchMultiRegion(apiKey: string, supabase: any): Promise<{ articles: RawArticle[]; source: string }> {
  const fetches = [
    // 1. Global top headlines (max 100)
    fetchGNews(apiKey, undefined, 100),
    // 2. India news
    fetchGNews(apiKey, undefined, 10, 'in'),
    // 3. Regional diversity via search
    fetchGNews(apiKey, 'world news', 10),
    // 4. GDELT enrichment for cross-source coverage
    fetchGDELT('world news', 50),
    // 5. State news from DB (already fetched daily by fetch-state-news)
    getStateNewsAsRaw(supabase),
  ];

  const results = await Promise.allSettled(fetches);
  const allArticles: RawArticle[] = [];
  const sources: string[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allArticles.push(...result.value);
      sources.push(i < 3 ? 'GNews' : i === 3 ? 'GDELT' : 'StateNews');
    }
  });

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allArticles.filter(a => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  const sourceLabel = [...new Set(sources)].join('+');
  console.log(`Multi-region fetch: ${allArticles.length} total, ${unique.length} unique from ${sourceLabel}`);
  return { articles: unique, source: sourceLabel };
}

// ─── Call Gemini for batch analysis (with district/state extraction) ───
async function analyzeWithGemini(articles: RawArticle[], apiKey: string): Promise<any[]> {
  const articleList = articles.map((a, i) =>
    `[Article ${i}]\nTitle: ${a.title}\nDescription: ${a.description || ''}\nContent: ${(a.content || a.description || a.title).slice(0, 1500)}`
  ).join('\n\n---\n\n');

  const systemPrompt = `You are a news analysis AI. You will receive multiple articles. For EACH article, return analysis in a JSON array.
Each element must have:
- sentiment: "positive", "negative", or "neutral"
- sentimentScore: number 0-1
- credibilityScore: number 0-100
- aiSummary: a 2-sentence summary
- entities: array of {text: string, type: "person"|"place"|"organization"}
- category: one of "Politics", "Technology", "Sports", "Health", "Science", "Business", "Entertainment", "Environment"
- location: {city, district, state, country, continent, lat, lng}
  * city: the specific city mentioned (e.g., "San Francisco", "Mumbai", "London")
  * district: the local district/borough/ward (e.g., "Manhattan", "Chiyoda", "Banjara Hills")
  * state: the state/province/region (e.g., "Telangana", "California", "Bavaria")
  * country: the country name (e.g., "United States", "India", "Germany")
  * continent: one of "North America", "South America", "Europe", "Asia", "Africa", "Oceania"
  * lat: latitude as number
  * lng: longitude as number

Return ONLY a valid JSON array with exactly ${articles.length} elements, one per article in order. No markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nAnalyze these ${articles.length} articles:\n\n${articleList}` }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini error:', response.status);
      return [];
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini analysis error:', err);
    return [];
  }
}

// ─── Combine raw articles + analysis into final format ───
function buildAnalyzedArticles(raw: RawArticle[], analyses: any[]): AnalyzedArticle[] {
  return raw.map((article, index) => {
    const analysis = analyses[index] || {};
    const location = analysis.location || {};

    return {
      id: uuidv4(),
      headline: article.title,
      summary: article.description || '',
      fullText: article.content || article.description || '',
      source: article.source?.name || 'Unknown',
      sourceUrl: article.url,
      imageUrl: article.image,
      timestamp: article.publishedAt,
      category: analysis.category || 'Technology',
      sentiment: analysis.sentiment || 'neutral',
      sentimentScore: analysis.sentimentScore ?? 0.5,
      credibilityScore: analysis.credibilityScore ?? 70,
      bertConfidence: 0.5,
      location: {
        city: location.city || 'Unknown',
        district: location.district || '',
        state: location.state || '',
        country: location.country || 'Unknown',
        continent: location.continent || 'Unknown',
        lat: location.lat || 0,
        lng: location.lng || 0,
      },
      entities: (analysis.entities || []),
      aiSummary: analysis.aiSummary || article.description || '',
    };
  });
}

// ─── Main Handler ───
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, max, forceRefresh } = await req.json();
    const supabase = getSupabaseAdmin();

    // 1. Check database cache (unless force refresh or search query)
    if (!forceRefresh && !query) {
      const cached = await getCachedArticles(supabase);
      if (cached && cached.length > 0) {
        console.log(`Serving ${cached.length} articles from database cache`);
        return new Response(JSON.stringify({
          totalArticles: cached.length,
          articles: cached,
          source: 'database',
          cached: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 2. Fetch fresh articles using multi-region strategy
    const GNEWS_API_KEY = Deno.env.get('GNEWS_API_KEY');
    let rawArticles: RawArticle[] = [];
    let newsSource = '';

    if (GNEWS_API_KEY) {
      if (query) {
        // For search queries, use a single targeted GNews call
        rawArticles = await fetchGNews(GNEWS_API_KEY, query, Math.min(max || 25, 25));
        newsSource = 'GNews';
      } else {
        // For default feed, use multi-region strategy for geographic diversity
        const result = await fetchMultiRegion(GNEWS_API_KEY, supabase);
        rawArticles = result.articles;
        newsSource = result.source;
      }
    }

    // Fallback to GDELT if GNews returned nothing
    if (rawArticles.length === 0) {
      rawArticles = await fetchGDELT(query || undefined, 50);
      newsSource = 'GDELT';
    }

    if (rawArticles.length === 0) {
      return new Response(JSON.stringify({ totalArticles: 0, articles: [], source: 'none', cached: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Sending ${rawArticles.length} articles to Gemini for analysis (batched)`);

    // 3. Analyze with Gemini in batches of 25
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    let analyses: any[] = [];
    if (GEMINI_API_KEY) {
      const BATCH_SIZE = 25;
      for (let batchStart = 0; batchStart < rawArticles.length; batchStart += BATCH_SIZE) {
        const batch = rawArticles.slice(batchStart, batchStart + BATCH_SIZE);
        let batchAnalyses: any[] = [];
        for (let attempt = 0; attempt < 3; attempt++) {
          batchAnalyses = await analyzeWithGemini(batch, GEMINI_API_KEY);
          if (batchAnalyses.length > 0) break;
          const wait = Math.pow(2, attempt + 1) * 2000;
          console.warn(`Batch ${batchStart / BATCH_SIZE + 1} retry ${attempt + 1}, waiting ${wait}ms...`);
          await new Promise(r => setTimeout(r, wait));
        }
        analyses.push(...batchAnalyses);
        console.log(`Analyzed batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(rawArticles.length / BATCH_SIZE)}: ${batchAnalyses.length} results`);
      }
    }

    // 4. Build final articles
    const analyzedArticles = buildAnalyzedArticles(rawArticles, analyses);

    // 5. Store in database (blocking — ensures cache is ready for next request)
    if (!query) {
      try {
        await storeArticles(supabase, analyzedArticles, newsSource);
      } catch (err) {
        console.error('Store error (non-fatal):', err);
      }
    }

    console.log(`Fetched ${analyzedArticles.length} fresh articles from ${newsSource}, analyzed & cached`);

    return new Response(JSON.stringify({
      totalArticles: analyzedArticles.length,
      articles: analyzedArticles,
      source: newsSource,
      cached: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
