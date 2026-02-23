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
  _hint?: { country?: string; state?: string };
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

// ─── Normalize category to title case ───
const VALID_CATEGORIES = ['Politics', 'Technology', 'Sports', 'Health', 'Science', 'Business', 'Entertainment', 'Environment'];
function normalizeCategory(raw: string): string {
  const lower = raw.toLowerCase();
  const match = VALID_CATEGORIES.find(c => c.toLowerCase() === lower);
  if (match) return match;
  if (lower === 'general' || lower === 'world') return 'Politics';
  return 'Technology';
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
    category: normalizeCategory(a.category || 'Technology'),
    sentiment: a.sentiment_label || 'neutral',
    sentimentScore: a.sentiment_score ?? 0.5,
    credibilityScore: a.credibility_score ?? 70,
    bertConfidence: a.ai_fake_score ?? 0.5,
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
    ai_fake_score: a.bertConfidence,
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
      _hint: country ? { country } : undefined,
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
      _hint: { country: 'in', state: d.state || '' },
    }));
  } catch {
    return [];
  }
}

// ─── Multi-region fetch: 5 parallel calls for diverse coverage ───
async function fetchMultiRegion(apiKey: string, supabase: any): Promise<{ articles: RawArticle[]; source: string }> {
  const fetches = [
    // 1. Global top headlines (keep under edge function time limit)
    fetchGNews(apiKey, undefined, 10),
    // 2. India news
    fetchGNews(apiKey, undefined, 10, 'in'),
    // 3. GDELT enrichment for cross-source coverage
    fetchGDELT('world news', 20),
    // 4. State news from DB
    getStateNewsAsRaw(supabase),
  ];

  const results = await Promise.allSettled(fetches);
  const allArticles: RawArticle[] = [];
  const sources: string[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allArticles.push(...result.value);
      sources.push(i < 2 ? 'GNews' : i === 2 ? 'GDELT' : 'StateNews');
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

// ─── Robust JSON extraction from Gemini responses ───
function extractAndParseJSON(text: string): any[] {
  // Strip markdown fences
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    // Handle {results: [...]} wrapper
    if (parsed && Array.isArray(parsed.results)) return parsed.results;
    if (parsed && typeof parsed === 'object') {
      const arrKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
      if (arrKey) return parsed[arrKey];
    }
    return [parsed];
  } catch { /* continue to extraction */ }

  // Find JSON array in surrounding text
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch { /* try repair */ }

    // Truncated response: find last complete object and close array
    const truncated = arrayMatch[0];
    const lastCloseBrace = truncated.lastIndexOf('}');
    if (lastCloseBrace > 0) {
      const repaired = truncated.slice(0, lastCloseBrace + 1) + ']';
      try {
        const parsed = JSON.parse(repaired);
        if (Array.isArray(parsed)) {
          console.warn(`Repaired truncated JSON: got ${parsed.length} items from partial response`);
          return parsed;
        }
      } catch { /* give up */ }
    }
  }

  // Find JSON object in surrounding text
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]);
      if (Array.isArray(parsed.results)) return parsed.results;
      return [parsed];
    } catch { /* give up */ }
  }

  console.error('Failed to extract JSON from Gemini response, preview:', cleaned.slice(0, 300));
  return [];
}

// ─── Call Gemini for batch analysis (with district/state extraction) ───
async function analyzeWithGemini(articles: RawArticle[], apiKey: string): Promise<any[]> {
  const articleList = articles.map((a, i) =>
    `[${i}] ${a.title} | ${(a.description || '').slice(0, 200)}`
  ).join('\n');

  const systemPrompt = `Analyze ${articles.length} news articles. Return a JSON array with ${articles.length} objects, one per article in order.
Each object: {"sentiment":"positive|negative|neutral","sentimentScore":0.0-1.0,"credibilityScore":0-100,"aiSummary":"2 sentences","entities":[{"text":"...","type":"person|place|organization"}],"category":"Politics|Technology|Sports|Health|Science|Business|Entertainment|Environment","location":{"city":"...","district":"...","state":"...","country":"...","continent":"North America|South America|Europe|Asia|Africa|Oceania","lat":0.0,"lng":0.0}}
Return ONLY the JSON array. No markdown, no explanation.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nArticles:\n${articleList}` }] }],
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
    console.log(`Gemini response preview (${text.length} chars): ${text.slice(0, 200)}...`);
    return extractAndParseJSON(text);
  } catch (err) {
    console.error('Gemini analysis error:', err);
    return [];
  }
}

// ─── Lightweight metadata inference (no AI needed) ───
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Politics: ['president', 'minister', 'election', 'parliament', 'government', 'congress', 'senate', 'vote', 'political', 'trump', 'biden', 'modi', 'law', 'bill', 'policy', 'diplomat', 'sanction'],
  Sports: ['cricket', 'football', 'soccer', 'tennis', 'nba', 'nfl', 'ipl', 'match', 'tournament', 'championship', 'olympic', 'goal', 'player', 'coach', 'league', 'cup', 'fifa', 'rugby'],
  Health: ['health', 'medical', 'hospital', 'vaccine', 'disease', 'doctor', 'patient', 'cancer', 'drug', 'treatment', 'mental', 'covid', 'who', 'pandemic', 'outbreak', 'therapy'],
  Science: ['nasa', 'space', 'mars', 'moon', 'rocket', 'satellite', 'research', 'scientist', 'discovery', 'physics', 'quantum', 'genome', 'species', 'asteroid', 'telescope'],
  Business: ['market', 'stock', 'economy', 'bank', 'trade', 'tariff', 'investment', 'revenue', 'profit', 'startup', 'ipo', 'ceo', 'billion', 'million', 'gdp', 'finance', 'inflation'],
  Technology: ['ai', 'artificial intelligence', 'tech', 'software', 'google', 'apple', 'microsoft', 'meta', 'chip', 'robot', 'cyber', 'data', 'app', 'cloud', 'nvidia'],
  Entertainment: ['movie', 'film', 'music', 'actor', 'celebrity', 'hollywood', 'bollywood', 'netflix', 'game', 'album', 'concert', 'award', 'oscar', 'grammy', 'streaming'],
  Environment: ['climate', 'carbon', 'emissions', 'renewable', 'solar', 'pollution', 'wildfire', 'flood', 'drought', 'earthquake', 'hurricane', 'deforestation', 'biodiversity', 'glacier'],
};

const TLD_COUNTRY: Record<string, { country: string; continent: string; lat: number; lng: number }> = {
  'co.in': { country: 'India', continent: 'Asia', lat: 20.5937, lng: 78.9629 },
  'co.uk': { country: 'United Kingdom', continent: 'Europe', lat: 51.5074, lng: -0.1278 },
  'com.au': { country: 'Australia', continent: 'Oceania', lat: -25.2744, lng: 133.7751 },
  'co.ke': { country: 'Kenya', continent: 'Africa', lat: -1.2921, lng: 36.8219 },
  'co.za': { country: 'South Africa', continent: 'Africa', lat: -30.5595, lng: 22.9375 },
};

const COUNTRY_COORDS: Record<string, { continent: string; lat: number; lng: number }> = {
  'India': { continent: 'Asia', lat: 20.5937, lng: 78.9629 },
  'United States': { continent: 'North America', lat: 38.9072, lng: -77.0369 },
  'United Kingdom': { continent: 'Europe', lat: 51.5074, lng: -0.1278 },
  'Australia': { continent: 'Oceania', lat: -25.2744, lng: 133.7751 },
  'Kenya': { continent: 'Africa', lat: -1.2921, lng: 36.8219 },
  'Pakistan': { continent: 'Asia', lat: 30.3753, lng: 69.3451 },
  'Canada': { continent: 'North America', lat: 56.1304, lng: -106.3468 },
  'Germany': { continent: 'Europe', lat: 51.1657, lng: 10.4515 },
  'France': { continent: 'Europe', lat: 46.2276, lng: 2.2137 },
  'Japan': { continent: 'Asia', lat: 36.2048, lng: 138.2529 },
  'China': { continent: 'Asia', lat: 35.8617, lng: 104.1954 },
  'Brazil': { continent: 'South America', lat: -14.2350, lng: -51.9253 },
  'Nigeria': { continent: 'Africa', lat: 9.0820, lng: 8.6753 },
  'South Africa': { continent: 'Africa', lat: -30.5595, lng: 22.9375 },
  'Ireland': { continent: 'Europe', lat: 53.1424, lng: -7.6921 },
  'Estonia': { continent: 'Europe', lat: 58.5953, lng: 25.0136 },
  'Singapore': { continent: 'Asia', lat: 1.3521, lng: 103.8198 },
};

const INDIAN_STATES: Record<string, { lat: number; lng: number }> = {
  'Andhra Pradesh': { lat: 15.9129, lng: 79.7400 },
  'Telangana': { lat: 18.1124, lng: 79.0193 },
  'Tamil Nadu': { lat: 11.1271, lng: 78.6569 },
  'Karnataka': { lat: 15.3173, lng: 75.7139 },
  'Maharashtra': { lat: 19.7515, lng: 75.7139 },
  'Kerala': { lat: 10.8505, lng: 76.2711 },
  'Gujarat': { lat: 22.2587, lng: 71.1924 },
  'Rajasthan': { lat: 27.0238, lng: 74.2179 },
  'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'West Bengal': { lat: 22.9868, lng: 87.8550 },
  'Bihar': { lat: 25.0961, lng: 85.3131 },
  'Madhya Pradesh': { lat: 22.9734, lng: 78.6569 },
  'Punjab': { lat: 31.1471, lng: 75.3412 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Odisha': { lat: 20.9517, lng: 85.0985 },
  'Assam': { lat: 26.2006, lng: 92.9376 },
  'Jharkhand': { lat: 23.6102, lng: 85.2799 },
  'Chhattisgarh': { lat: 21.2787, lng: 81.8661 },
  'Haryana': { lat: 29.0588, lng: 76.0856 },
  'Goa': { lat: 15.2993, lng: 74.1240 },
  'Himachal Pradesh': { lat: 31.1048, lng: 77.1734 },
  'Jammu and Kashmir': { lat: 33.7782, lng: 76.5762 },
  'Uttarakhand': { lat: 30.0668, lng: 79.0193 },
  'Manipur': { lat: 24.6637, lng: 93.9063 },
  'Meghalaya': { lat: 25.4670, lng: 91.3662 },
  'Mizoram': { lat: 23.1645, lng: 92.9376 },
  'Nagaland': { lat: 26.1584, lng: 94.5624 },
  'Sikkim': { lat: 27.5330, lng: 88.5122 },
  'Tripura': { lat: 23.9408, lng: 91.9882 },
  'Arunachal Pradesh': { lat: 28.2180, lng: 94.7278 },
};

function inferCategory(title: string): string {
  const lower = title.toLowerCase();
  let best = 'Technology';
  let bestCount = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = keywords.filter(k => lower.includes(k)).length;
    if (count > bestCount) { best = cat; bestCount = count; }
  }
  return best;
}

function inferLocation(article: RawArticle): { city: string; district: string; state: string; country: string; continent: string; lat: number; lng: number } {
  const text = `${article.title} ${article.description} ${article.source.name}`.toLowerCase();

  // 1. Check hint from fetch source (GNews country param, state news)
  if (article._hint?.state) {
    const st = article._hint.state;
    const coords = INDIAN_STATES[st] || { lat: 20.5937, lng: 78.9629 };
    return { city: '', district: '', state: st, country: 'India', continent: 'Asia', lat: coords.lat + (Math.random() - 0.5) * 2, lng: coords.lng + (Math.random() - 0.5) * 2 };
  }

  if (article._hint?.country === 'in') {
    // Try to find a state mentioned in the text
    for (const [state, coords] of Object.entries(INDIAN_STATES)) {
      if (text.includes(state.toLowerCase())) {
        return { city: '', district: '', state, country: 'India', continent: 'Asia', lat: coords.lat + (Math.random() - 0.5) * 1, lng: coords.lng + (Math.random() - 0.5) * 1 };
      }
    }
    return { city: '', district: '', state: '', country: 'India', continent: 'Asia', lat: 20.5937 + (Math.random() - 0.5) * 10, lng: 78.9629 + (Math.random() - 0.5) * 10 };
  }

  // 2. Check for known countries in text
  for (const [country, coords] of Object.entries(COUNTRY_COORDS)) {
    if (text.includes(country.toLowerCase())) {
      return { city: '', district: '', state: '', country, continent: coords.continent, lat: coords.lat + (Math.random() - 0.5) * 4, lng: coords.lng + (Math.random() - 0.5) * 4 };
    }
  }

  // 3. Check source domain TLD
  try {
    const domain = article.source.url ? new URL(article.url).hostname : article.source.name;
    for (const [tld, loc] of Object.entries(TLD_COUNTRY)) {
      if (domain.endsWith(`.${tld}`)) {
        return { city: '', district: '', state: '', country: loc.country, continent: loc.continent, lat: loc.lat + (Math.random() - 0.5) * 4, lng: loc.lng + (Math.random() - 0.5) * 4 };
      }
    }
    // Common US domains
    if (domain.endsWith('.com') || domain.endsWith('.org') || domain.endsWith('.net')) {
      return { city: '', district: '', state: '', country: 'United States', continent: 'North America', lat: 38.9 + (Math.random() - 0.5) * 20, lng: -98.35 + (Math.random() - 0.5) * 20 };
    }
  } catch { /* ignore URL parse errors */ }

  // 4. Scatter globally as fallback
  const fallbacks = Object.values(COUNTRY_COORDS);
  const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return { city: '', district: '', state: '', country: 'Unknown', continent: pick.continent, lat: pick.lat + (Math.random() - 0.5) * 10, lng: pick.lng + (Math.random() - 0.5) * 10 };
}

// ─── Combine raw articles into final format with inferred metadata ───
function buildAnalyzedArticles(raw: RawArticle[], analyses: any[]): AnalyzedArticle[] {
  return raw.map((article, index) => {
    const analysis = analyses[index] || {};
    const analysisLoc = analysis.location || {};
    const hasAnalysis = Object.keys(analysis).length > 0;

    const category = hasAnalysis ? (analysis.category || inferCategory(article.title)) : inferCategory(article.title);
    const loc = hasAnalysis && analysisLoc.lat ? analysisLoc : inferLocation(article);

    return {
      id: uuidv4(),
      headline: article.title,
      summary: article.description || '',
      fullText: article.content || article.description || '',
      source: article.source?.name || 'Unknown',
      sourceUrl: article.url,
      imageUrl: article.image,
      timestamp: article.publishedAt,
      category,
      sentiment: analysis.sentiment || 'neutral',
      sentimentScore: analysis.sentimentScore ?? 0.5,
      credibilityScore: analysis.credibilityScore ?? 70,
      bertConfidence: 0.5,
      location: {
        city: loc.city || '',
        district: loc.district || '',
        state: loc.state || '',
        country: loc.country || 'Unknown',
        continent: loc.continent || 'Unknown',
        lat: loc.lat || 0,
        lng: loc.lng || 0,
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

    // 3. Build articles with defaults (Gemini analysis is on-demand per article)
    const analyzedArticles = buildAnalyzedArticles(rawArticles, []);

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
