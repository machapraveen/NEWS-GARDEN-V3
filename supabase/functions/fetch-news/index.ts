import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CACHE_HOURS = 2; // Refresh every 2 hours (Enterprise plan: 25k requests/day)

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
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
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

  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(100);

  if (error) { console.error('Cache read error:', error); return null; }
  if (!articles || articles.length === 0) return null;

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
      city: a.city || '',
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
    entities: a.entities || [],
    published_at: a.timestamp,
    fetched_at: now,
    created_at: now,
    updated_at: now,
  }));

  // Upsert on URL (not id) — same article URL gets updated, not duplicated
  const { error: insertErr, count } = await supabase
    .from('news_articles')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: false });

  if (insertErr) {
    console.error('Error storing articles:', JSON.stringify(insertErr));
    throw new Error(`Upsert failed: ${insertErr.message || JSON.stringify(insertErr)}`);
  }
  console.log(`Upserted ${rows.length} articles (conflict on url)`);

  // Log the fetch
  const { error: logErr } = await supabase
    .from('news_fetch_log')
    .insert({ fetched_at: now, article_count: articles.length, source, batch_id: batchId });

  if (logErr) console.error('Error logging fetch:', logErr);
  console.log(`Stored ${articles.length} articles in database (batch: ${batchId})`);
}

// ─── Clean articles older than 48 hours ───
async function cleanOldArticles(supabase: any) {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('news_articles')
      .delete()
      .lt('fetched_at', cutoff);
    if (error) console.error('Cleanup error:', error);
    else console.log('Cleaned articles older than 48 hours');
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

// ─── Fetch from GNews API (supports country filter) ───
async function fetchGNews(apiKey: string, query?: string, max = 100, country?: string): Promise<RawArticle[]> {
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

// ─── Read state news from DB ───
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

// ─── Multi-region fetch: 8+ parallel calls for global coverage ───
async function fetchMultiRegion(apiKey: string, supabase: any): Promise<{ articles: RawArticle[]; source: string }> {
  const fetches = [
    fetchGNews(apiKey, undefined, 100),              // Global top headlines
    fetchGNews(apiKey, undefined, 100, 'in'),         // India
    fetchGNews(apiKey, undefined, 50, 'us'),          // United States
    fetchGNews(apiKey, undefined, 30, 'gb'),          // United Kingdom
    fetchGNews(apiKey, undefined, 20, 'au'),          // Australia
    fetchGNews(apiKey, undefined, 20, 'jp'),          // Japan
    fetchGNews(apiKey, undefined, 20, 'br'),          // Brazil
    fetchGNews(apiKey, undefined, 20, 'ng'),          // Nigeria
    fetchGDELT('world news', 30),                     // GDELT cross-source
    getStateNewsAsRaw(supabase),                      // Indian state news
  ];

  const results = await Promise.allSettled(fetches);
  const allArticles: RawArticle[] = [];
  const sources: string[] = [];
  const regionNames = ['Global', 'India', 'US', 'UK', 'AU', 'JP', 'BR', 'NG', 'GDELT', 'StateNews'];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allArticles.push(...result.value);
      sources.push(regionNames[i]);
      console.log(`  ${regionNames[i]}: ${result.value.length} articles`);
    } else if (result.status === 'rejected') {
      console.error(`  ${regionNames[i]}: FAILED`, result.reason);
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

// ─── Keyword-based article analysis (free, fast, no paid API) ───
const POSITIVE_WORDS = new Set(['success', 'win', 'wins', 'won', 'growth', 'improve', 'breakthrough', 'celebrate', 'launch', 'record', 'achieve', 'boost', 'gain', 'surge', 'rise', 'rises', 'recover', 'peace', 'save', 'hero', 'praise', 'award', 'innovation', 'cure', 'solution', 'progress', 'thrive', 'soar', 'upgrade', 'best', 'milestone', 'triumph', 'positive', 'hope', 'optimistic', 'relief', 'benefit', 'discover', 'advance', 'prosper']);
const NEGATIVE_WORDS = new Set(['kill', 'killed', 'death', 'dead', 'die', 'crash', 'crisis', 'fail', 'attack', 'war', 'disaster', 'bomb', 'explosion', 'shooting', 'murder', 'victim', 'destroy', 'collapse', 'threat', 'fear', 'danger', 'violence', 'conflict', 'protest', 'riot', 'fraud', 'scam', 'fake', 'corrupt', 'arrest', 'crime', 'drought', 'flood', 'earthquake', 'hurricane', 'devastating', 'tragic', 'worst', 'plunge', 'decline', 'loss', 'debt', 'recession', 'scandal', 'abuse', 'suffer', 'warning', 'ban', 'sanctions']);

const REPUTABLE_SOURCES: Record<string, number> = {
  'reuters': 95, 'bbc': 93, 'associated press': 94, 'ap news': 94,
  'new york times': 90, 'washington post': 89, 'the guardian': 88,
  'financial times': 92, 'bloomberg': 91, 'wall street journal': 90,
  'al jazeera': 85, 'cnn': 82, 'nbc news': 83, 'abc news': 83,
  'the hindu': 85, 'times of india': 80, 'ndtv': 82, 'indian express': 84,
  'hindustan times': 81, 'economic times': 83, 'mint': 82, 'livemint': 82,
  'sky news': 82, 'france 24': 85, 'dw': 86, 'nhk': 87,
  'nature': 97, 'science': 97, 'the lancet': 96, 'national geographic': 90,
  'techcrunch': 84, 'the verge': 82, 'wired': 83, 'ars technica': 85,
  'espn': 88, 'bbc sport': 90, 'sky sports': 85,
  'politico': 86, 'economist': 91, 'foreign affairs': 92,
};

function inferSentiment(text: string): { sentiment: string; sentimentScore: number } {
  const words = text.toLowerCase().split(/\W+/);
  let pos = 0, neg = 0;
  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) pos++;
    if (NEGATIVE_WORDS.has(w)) neg++;
  }
  const total = pos + neg;
  if (total === 0) return { sentiment: 'neutral', sentimentScore: 0.5 };
  const ratio = pos / total;
  if (ratio > 0.6) return { sentiment: 'positive', sentimentScore: Math.min(0.95, 0.6 + ratio * 0.35) };
  if (ratio < 0.4) return { sentiment: 'negative', sentimentScore: Math.max(0.1, 0.4 - (1 - ratio) * 0.3) };
  return { sentiment: 'neutral', sentimentScore: 0.45 + ratio * 0.1 };
}

function inferCredibility(sourceName: string): number {
  const lower = sourceName.toLowerCase();
  for (const [name, score] of Object.entries(REPUTABLE_SOURCES)) {
    if (lower.includes(name)) return score;
  }
  return 60 + Math.floor(Math.random() * 15);
}

function extractEntities(text: string): { text: string; type: string }[] {
  const entities: { text: string; type: string }[] = [];
  const seen = new Set<string>();

  // Extract places from MAJOR_CITIES
  const lower = text.toLowerCase();
  const sortedCities = Object.entries(MAJOR_CITIES).sort((a, b) => b[0].length - a[0].length);
  for (const [cityName, data] of sortedCities) {
    if (lower.includes(cityName) && !seen.has(cityName)) {
      const display = cityName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      entities.push({ text: display, type: 'place' });
      seen.add(cityName);
      if (!seen.has(data.country.toLowerCase())) {
        entities.push({ text: data.country, type: 'place' });
        seen.add(data.country.toLowerCase());
      }
    }
  }

  // Extract countries
  for (const country of Object.keys(COUNTRY_COORDS)) {
    if (lower.includes(country.toLowerCase()) && !seen.has(country.toLowerCase())) {
      entities.push({ text: country, type: 'place' });
      seen.add(country.toLowerCase());
    }
  }

  // Extract capitalized multi-word names (person/org candidates)
  const namePattern = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+)\b/g;
  let m;
  while ((m = namePattern.exec(text)) !== null) {
    const name = m[1];
    const nl = name.toLowerCase();
    if (seen.has(nl) || name.length < 5) continue;
    // Skip known place names
    if (Object.keys(COUNTRY_COORDS).some(c => name.includes(c))) continue;
    if (Object.keys(MAJOR_CITIES).some(c => nl.includes(c))) continue;
    seen.add(nl);
    if (/\b(Group|Corp|Inc|Ltd|Ministry|Department|Commission|Agency|Bank|University|Institute|Association|Council|Authority|Foundation|Company)\b/i.test(name)) {
      entities.push({ text: name, type: 'organization' });
    } else {
      entities.push({ text: name, type: 'person' });
    }
    if (entities.length >= 8) break;
  }

  return entities.slice(0, 8);
}

function analyzeArticleLocal(article: RawArticle): { sentiment: string; sentimentScore: number; credibilityScore: number; entities: { text: string; type: string }[]; aiSummary: string } {
  const fullText = [article.title, article.description, article.content].join(' ');
  const { sentiment, sentimentScore } = inferSentiment(fullText);
  const credibilityScore = inferCredibility(article.source.name);
  const entities = extractEntities(fullText);
  return { sentiment, sentimentScore, credibilityScore, entities, aiSummary: article.description || article.title };
}

// ─── Keyword-based metadata inference ───
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

const MAJOR_CITIES: Record<string, { state: string; country: string; continent: string; lat: number; lng: number }> = {
  // India
  'mumbai': { state: 'Maharashtra', country: 'India', continent: 'Asia', lat: 19.076, lng: 72.8777 },
  'delhi': { state: 'Delhi', country: 'India', continent: 'Asia', lat: 28.6139, lng: 77.209 },
  'new delhi': { state: 'Delhi', country: 'India', continent: 'Asia', lat: 28.6139, lng: 77.209 },
  'bangalore': { state: 'Karnataka', country: 'India', continent: 'Asia', lat: 12.9716, lng: 77.5946 },
  'bengaluru': { state: 'Karnataka', country: 'India', continent: 'Asia', lat: 12.9716, lng: 77.5946 },
  'chennai': { state: 'Tamil Nadu', country: 'India', continent: 'Asia', lat: 13.0827, lng: 80.2707 },
  'kolkata': { state: 'West Bengal', country: 'India', continent: 'Asia', lat: 22.5726, lng: 88.3639 },
  'hyderabad': { state: 'Telangana', country: 'India', continent: 'Asia', lat: 17.385, lng: 78.4867 },
  'pune': { state: 'Maharashtra', country: 'India', continent: 'Asia', lat: 18.5204, lng: 73.8567 },
  'ahmedabad': { state: 'Gujarat', country: 'India', continent: 'Asia', lat: 23.0225, lng: 72.5714 },
  'jaipur': { state: 'Rajasthan', country: 'India', continent: 'Asia', lat: 26.9124, lng: 75.7873 },
  'lucknow': { state: 'Uttar Pradesh', country: 'India', continent: 'Asia', lat: 26.8467, lng: 80.9462 },
  'chandigarh': { state: 'Punjab', country: 'India', continent: 'Asia', lat: 30.7333, lng: 76.7794 },
  'bhopal': { state: 'Madhya Pradesh', country: 'India', continent: 'Asia', lat: 23.2599, lng: 77.4126 },
  'patna': { state: 'Bihar', country: 'India', continent: 'Asia', lat: 25.6093, lng: 85.1376 },
  'thiruvananthapuram': { state: 'Kerala', country: 'India', continent: 'Asia', lat: 8.5241, lng: 76.9366 },
  'kochi': { state: 'Kerala', country: 'India', continent: 'Asia', lat: 9.9312, lng: 76.2673 },
  'visakhapatnam': { state: 'Andhra Pradesh', country: 'India', continent: 'Asia', lat: 17.6868, lng: 83.2185 },
  'vijayawada': { state: 'Andhra Pradesh', country: 'India', continent: 'Asia', lat: 16.5062, lng: 80.648 },
  'amaravati': { state: 'Andhra Pradesh', country: 'India', continent: 'Asia', lat: 16.5131, lng: 80.516 },
  'tirupati': { state: 'Andhra Pradesh', country: 'India', continent: 'Asia', lat: 13.6288, lng: 79.4192 },
  'coimbatore': { state: 'Tamil Nadu', country: 'India', continent: 'Asia', lat: 11.0168, lng: 76.9558 },
  'madurai': { state: 'Tamil Nadu', country: 'India', continent: 'Asia', lat: 9.9252, lng: 78.1198 },
  'nagpur': { state: 'Maharashtra', country: 'India', continent: 'Asia', lat: 21.1458, lng: 79.0882 },
  'indore': { state: 'Madhya Pradesh', country: 'India', continent: 'Asia', lat: 22.7196, lng: 75.8577 },
  'surat': { state: 'Gujarat', country: 'India', continent: 'Asia', lat: 21.1702, lng: 72.8311 },
  'varanasi': { state: 'Uttar Pradesh', country: 'India', continent: 'Asia', lat: 25.3176, lng: 82.9739 },
  'bhubaneswar': { state: 'Odisha', country: 'India', continent: 'Asia', lat: 20.2961, lng: 85.8245 },
  'guwahati': { state: 'Assam', country: 'India', continent: 'Asia', lat: 26.1445, lng: 91.7362 },
  'ranchi': { state: 'Jharkhand', country: 'India', continent: 'Asia', lat: 23.3441, lng: 85.3096 },
  'dehradun': { state: 'Uttarakhand', country: 'India', continent: 'Asia', lat: 30.3165, lng: 78.0322 },
  'shimla': { state: 'Himachal Pradesh', country: 'India', continent: 'Asia', lat: 31.1048, lng: 77.1734 },
  'srinagar': { state: 'Jammu and Kashmir', country: 'India', continent: 'Asia', lat: 34.0837, lng: 74.7973 },
  'panaji': { state: 'Goa', country: 'India', continent: 'Asia', lat: 15.4909, lng: 73.8278 },
  'raipur': { state: 'Chhattisgarh', country: 'India', continent: 'Asia', lat: 21.2514, lng: 81.6296 },
  // US
  'new york': { state: 'New York', country: 'United States', continent: 'North America', lat: 40.7128, lng: -74.006 },
  'washington': { state: 'DC', country: 'United States', continent: 'North America', lat: 38.9072, lng: -77.0369 },
  'los angeles': { state: 'California', country: 'United States', continent: 'North America', lat: 34.0522, lng: -118.2437 },
  'chicago': { state: 'Illinois', country: 'United States', continent: 'North America', lat: 41.8781, lng: -87.6298 },
  'san francisco': { state: 'California', country: 'United States', continent: 'North America', lat: 37.7749, lng: -122.4194 },
  'houston': { state: 'Texas', country: 'United States', continent: 'North America', lat: 29.7604, lng: -95.3698 },
  'miami': { state: 'Florida', country: 'United States', continent: 'North America', lat: 25.7617, lng: -80.1918 },
  'seattle': { state: 'Washington', country: 'United States', continent: 'North America', lat: 47.6062, lng: -122.3321 },
  'boston': { state: 'Massachusetts', country: 'United States', continent: 'North America', lat: 42.3601, lng: -71.0589 },
  'atlanta': { state: 'Georgia', country: 'United States', continent: 'North America', lat: 33.749, lng: -84.388 },
  // UK
  'london': { state: 'England', country: 'United Kingdom', continent: 'Europe', lat: 51.5074, lng: -0.1278 },
  'manchester': { state: 'England', country: 'United Kingdom', continent: 'Europe', lat: 53.4808, lng: -2.2426 },
  'birmingham': { state: 'England', country: 'United Kingdom', continent: 'Europe', lat: 52.4862, lng: -1.8904 },
  'edinburgh': { state: 'Scotland', country: 'United Kingdom', continent: 'Europe', lat: 55.9533, lng: -3.1883 },
  // Japan
  'tokyo': { state: 'Tokyo', country: 'Japan', continent: 'Asia', lat: 35.6762, lng: 139.6503 },
  'osaka': { state: 'Osaka', country: 'Japan', continent: 'Asia', lat: 34.6937, lng: 135.5023 },
  'kyoto': { state: 'Kyoto', country: 'Japan', continent: 'Asia', lat: 35.0116, lng: 135.7681 },
  // Brazil
  'sao paulo': { state: 'São Paulo', country: 'Brazil', continent: 'South America', lat: -23.5505, lng: -46.6333 },
  'rio de janeiro': { state: 'Rio de Janeiro', country: 'Brazil', continent: 'South America', lat: -22.9068, lng: -43.1729 },
  'brasilia': { state: 'Federal District', country: 'Brazil', continent: 'South America', lat: -15.7975, lng: -47.8919 },
  // Nigeria
  'lagos': { state: 'Lagos', country: 'Nigeria', continent: 'Africa', lat: 6.5244, lng: 3.3792 },
  'abuja': { state: 'FCT', country: 'Nigeria', continent: 'Africa', lat: 9.0579, lng: 7.4951 },
  // Australia
  'sydney': { state: 'NSW', country: 'Australia', continent: 'Oceania', lat: -33.8688, lng: 151.2093 },
  'melbourne': { state: 'Victoria', country: 'Australia', continent: 'Oceania', lat: -37.8136, lng: 144.9631 },
  'brisbane': { state: 'Queensland', country: 'Australia', continent: 'Oceania', lat: -27.4698, lng: 153.0251 },
  // Other major world cities
  'beijing': { state: 'Beijing', country: 'China', continent: 'Asia', lat: 39.9042, lng: 116.4074 },
  'shanghai': { state: 'Shanghai', country: 'China', continent: 'Asia', lat: 31.2304, lng: 121.4737 },
  'paris': { state: 'Île-de-France', country: 'France', continent: 'Europe', lat: 48.8566, lng: 2.3522 },
  'berlin': { state: 'Berlin', country: 'Germany', continent: 'Europe', lat: 52.52, lng: 13.405 },
  'moscow': { state: 'Moscow', country: 'Russia', continent: 'Europe', lat: 55.7558, lng: 37.6173 },
  'dubai': { state: 'Dubai', country: 'UAE', continent: 'Asia', lat: 25.2048, lng: 55.2708 },
  'singapore': { state: 'Singapore', country: 'Singapore', continent: 'Asia', lat: 1.3521, lng: 103.8198 },
  'seoul': { state: 'Seoul', country: 'South Korea', continent: 'Asia', lat: 37.5665, lng: 126.978 },
  'bangkok': { state: 'Bangkok', country: 'Thailand', continent: 'Asia', lat: 13.7563, lng: 100.5018 },
  'cairo': { state: 'Cairo', country: 'Egypt', continent: 'Africa', lat: 30.0444, lng: 31.2357 },
  'nairobi': { state: 'Nairobi', country: 'Kenya', continent: 'Africa', lat: -1.2921, lng: 36.8219 },
  'johannesburg': { state: 'Gauteng', country: 'South Africa', continent: 'Africa', lat: -26.2041, lng: 28.0473 },
  'cape town': { state: 'Western Cape', country: 'South Africa', continent: 'Africa', lat: -33.9249, lng: 18.4241 },
  'toronto': { state: 'Ontario', country: 'Canada', continent: 'North America', lat: 43.6532, lng: -79.3832 },
  'mexico city': { state: 'CDMX', country: 'Mexico', continent: 'North America', lat: 19.4326, lng: -99.1332 },
  'buenos aires': { state: 'Buenos Aires', country: 'Argentina', continent: 'South America', lat: -34.6037, lng: -58.3816 },
  'istanbul': { state: 'Istanbul', country: 'Turkey', continent: 'Asia', lat: 41.0082, lng: 28.9784 },
  'rome': { state: 'Lazio', country: 'Italy', continent: 'Europe', lat: 41.9028, lng: 12.4964 },
  'madrid': { state: 'Madrid', country: 'Spain', continent: 'Europe', lat: 40.4168, lng: -3.7038 },
  'jakarta': { state: 'Jakarta', country: 'Indonesia', continent: 'Asia', lat: -6.2088, lng: 106.8456 },
  'islamabad': { state: 'ICT', country: 'Pakistan', continent: 'Asia', lat: 33.6844, lng: 73.0479 },
  'karachi': { state: 'Sindh', country: 'Pakistan', continent: 'Asia', lat: 24.8607, lng: 67.0011 },
  'lahore': { state: 'Punjab', country: 'Pakistan', continent: 'Asia', lat: 31.5204, lng: 74.3587 },
  'dhaka': { state: 'Dhaka', country: 'Bangladesh', continent: 'Asia', lat: 23.8103, lng: 90.4125 },
  'colombo': { state: 'Western', country: 'Sri Lanka', continent: 'Asia', lat: 6.9271, lng: 79.8612 },
  'kathmandu': { state: 'Bagmati', country: 'Nepal', continent: 'Asia', lat: 27.7172, lng: 85.324 },
  'kuala lumpur': { state: 'KL', country: 'Malaysia', continent: 'Asia', lat: 3.139, lng: 101.6869 },
  'hanoi': { state: 'Hanoi', country: 'Vietnam', continent: 'Asia', lat: 21.0278, lng: 105.8342 },
  'manila': { state: 'NCR', country: 'Philippines', continent: 'Asia', lat: 14.5995, lng: 120.9842 },
  'taipei': { state: 'Taipei', country: 'Taiwan', continent: 'Asia', lat: 25.033, lng: 121.5654 },
  'hong kong': { state: 'Hong Kong', country: 'China', continent: 'Asia', lat: 22.3193, lng: 114.1694 },
  'tehran': { state: 'Tehran', country: 'Iran', continent: 'Asia', lat: 35.6892, lng: 51.389 },
  'riyadh': { state: 'Riyadh', country: 'Saudi Arabia', continent: 'Asia', lat: 24.7136, lng: 46.6753 },
  'tel aviv': { state: 'Tel Aviv', country: 'Israel', continent: 'Asia', lat: 32.0853, lng: 34.7818 },
  'jerusalem': { state: 'Jerusalem', country: 'Israel', continent: 'Asia', lat: 31.7683, lng: 35.2137 },
  'kyiv': { state: 'Kyiv', country: 'Ukraine', continent: 'Europe', lat: 50.4501, lng: 30.5234 },
  'warsaw': { state: 'Masovia', country: 'Poland', continent: 'Europe', lat: 52.2297, lng: 21.0122 },
  'amsterdam': { state: 'North Holland', country: 'Netherlands', continent: 'Europe', lat: 52.3676, lng: 4.9041 },
  'brussels': { state: 'Brussels', country: 'Belgium', continent: 'Europe', lat: 50.8503, lng: 4.3517 },
  'vienna': { state: 'Vienna', country: 'Austria', continent: 'Europe', lat: 48.2082, lng: 16.3738 },
  'zurich': { state: 'Zurich', country: 'Switzerland', continent: 'Europe', lat: 47.3769, lng: 8.5417 },
  'geneva': { state: 'Geneva', country: 'Switzerland', continent: 'Europe', lat: 46.2044, lng: 6.1432 },
  'stockholm': { state: 'Stockholm', country: 'Sweden', continent: 'Europe', lat: 59.3293, lng: 18.0686 },
  'oslo': { state: 'Oslo', country: 'Norway', continent: 'Europe', lat: 59.9139, lng: 10.7522 },
  'lisbon': { state: 'Lisbon', country: 'Portugal', continent: 'Europe', lat: 38.7223, lng: -9.1393 },
  'athens': { state: 'Attica', country: 'Greece', continent: 'Europe', lat: 37.9838, lng: 23.7275 },
  'addis ababa': { state: 'Addis Ababa', country: 'Ethiopia', continent: 'Africa', lat: 9.0249, lng: 38.7469 },
  'accra': { state: 'Greater Accra', country: 'Ghana', continent: 'Africa', lat: 5.6037, lng: -0.187 },
  'lima': { state: 'Lima', country: 'Peru', continent: 'South America', lat: -12.0464, lng: -77.0428 },
  'bogota': { state: 'Bogotá', country: 'Colombia', continent: 'South America', lat: 4.711, lng: -74.0721 },
  'santiago': { state: 'Santiago', country: 'Chile', continent: 'South America', lat: -33.4489, lng: -70.6693 },
};

const TLD_COUNTRY: Record<string, { country: string; continent: string; lat: number; lng: number }> = {
  'co.in': { country: 'India', continent: 'Asia', lat: 20.5937, lng: 78.9629 },
  'co.uk': { country: 'United Kingdom', continent: 'Europe', lat: 51.5074, lng: -0.1278 },
  'com.au': { country: 'Australia', continent: 'Oceania', lat: -25.2744, lng: 133.7751 },
  'co.ke': { country: 'Kenya', continent: 'Africa', lat: -1.2921, lng: 36.8219 },
  'co.za': { country: 'South Africa', continent: 'Africa', lat: -30.5595, lng: 22.9375 },
  'co.jp': { country: 'Japan', continent: 'Asia', lat: 36.2048, lng: 138.2529 },
  'com.br': { country: 'Brazil', continent: 'South America', lat: -14.235, lng: -51.9253 },
  'com.ng': { country: 'Nigeria', continent: 'Africa', lat: 9.082, lng: 8.6753 },
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
  'Brazil': { continent: 'South America', lat: -14.235, lng: -51.9253 },
  'Nigeria': { continent: 'Africa', lat: 9.082, lng: 8.6753 },
  'South Africa': { continent: 'Africa', lat: -30.5595, lng: 22.9375 },
  'Ireland': { continent: 'Europe', lat: 53.1424, lng: -7.6921 },
  'Estonia': { continent: 'Europe', lat: 58.5953, lng: 25.0136 },
  'Singapore': { continent: 'Asia', lat: 1.3521, lng: 103.8198 },
  'Russia': { continent: 'Europe', lat: 55.7558, lng: 37.6173 },
  'Ukraine': { continent: 'Europe', lat: 50.4501, lng: 30.5234 },
  'Israel': { continent: 'Asia', lat: 31.7683, lng: 35.2137 },
  'Iran': { continent: 'Asia', lat: 35.6892, lng: 51.389 },
  'Saudi Arabia': { continent: 'Asia', lat: 24.7136, lng: 46.6753 },
  'Turkey': { continent: 'Asia', lat: 41.0082, lng: 28.9784 },
  'Italy': { continent: 'Europe', lat: 41.9028, lng: 12.4964 },
  'Spain': { continent: 'Europe', lat: 40.4168, lng: -3.7038 },
  'Mexico': { continent: 'North America', lat: 19.4326, lng: -99.1332 },
  'Argentina': { continent: 'South America', lat: -34.6037, lng: -58.3816 },
  'Indonesia': { continent: 'Asia', lat: -6.2088, lng: 106.8456 },
  'Thailand': { continent: 'Asia', lat: 13.7563, lng: 100.5018 },
  'Philippines': { continent: 'Asia', lat: 14.5995, lng: 120.9842 },
  'Malaysia': { continent: 'Asia', lat: 3.139, lng: 101.6869 },
  'Bangladesh': { continent: 'Asia', lat: 23.8103, lng: 90.4125 },
  'Vietnam': { continent: 'Asia', lat: 21.0278, lng: 105.8342 },
  'Egypt': { continent: 'Africa', lat: 30.0444, lng: 31.2357 },
  'Ethiopia': { continent: 'Africa', lat: 9.0249, lng: 38.7469 },
  'Ghana': { continent: 'Africa', lat: 5.6037, lng: -0.187 },
  'Colombia': { continent: 'South America', lat: 4.711, lng: -74.0721 },
  'Peru': { continent: 'South America', lat: -12.0464, lng: -77.0428 },
  'Chile': { continent: 'South America', lat: -33.4489, lng: -70.6693 },
  'Poland': { continent: 'Europe', lat: 52.2297, lng: 21.0122 },
  'Netherlands': { continent: 'Europe', lat: 52.3676, lng: 4.9041 },
  'Sweden': { continent: 'Europe', lat: 59.3293, lng: 18.0686 },
  'Switzerland': { continent: 'Europe', lat: 47.3769, lng: 8.5417 },
  'South Korea': { continent: 'Asia', lat: 37.5665, lng: 126.978 },
  'Taiwan': { continent: 'Asia', lat: 25.033, lng: 121.5654 },
  'Sri Lanka': { continent: 'Asia', lat: 6.9271, lng: 79.8612 },
  'Nepal': { continent: 'Asia', lat: 27.7172, lng: 85.324 },
  'UAE': { continent: 'Asia', lat: 25.2048, lng: 55.2708 },
};

const INDIAN_STATES: Record<string, { lat: number; lng: number }> = {
  'Andhra Pradesh': { lat: 15.9129, lng: 79.74 },
  'Telangana': { lat: 18.1124, lng: 79.0193 },
  'Tamil Nadu': { lat: 11.1271, lng: 78.6569 },
  'Karnataka': { lat: 15.3173, lng: 75.7139 },
  'Maharashtra': { lat: 19.7515, lng: 75.7139 },
  'Kerala': { lat: 10.8505, lng: 76.2711 },
  'Gujarat': { lat: 22.2587, lng: 71.1924 },
  'Rajasthan': { lat: 27.0238, lng: 74.2179 },
  'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'West Bengal': { lat: 22.9868, lng: 87.855 },
  'Bihar': { lat: 25.0961, lng: 85.3131 },
  'Madhya Pradesh': { lat: 22.9734, lng: 78.6569 },
  'Punjab': { lat: 31.1471, lng: 75.3412 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Odisha': { lat: 20.9517, lng: 85.0985 },
  'Assam': { lat: 26.2006, lng: 92.9376 },
  'Jharkhand': { lat: 23.6102, lng: 85.2799 },
  'Chhattisgarh': { lat: 21.2787, lng: 81.8661 },
  'Haryana': { lat: 29.0588, lng: 76.0856 },
  'Goa': { lat: 15.2993, lng: 74.124 },
  'Himachal Pradesh': { lat: 31.1048, lng: 77.1734 },
  'Jammu and Kashmir': { lat: 33.7782, lng: 76.5762 },
  'Uttarakhand': { lat: 30.0668, lng: 79.0193 },
  'Manipur': { lat: 24.6637, lng: 93.9063 },
  'Meghalaya': { lat: 25.467, lng: 91.3662 },
  'Mizoram': { lat: 23.1645, lng: 92.9376 },
  'Nagaland': { lat: 26.1584, lng: 94.5624 },
  'Sikkim': { lat: 27.533, lng: 88.5122 },
  'Tripura': { lat: 23.9408, lng: 91.9882 },
  'Arunachal Pradesh': { lat: 28.218, lng: 94.7278 },
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

  // 1. Check hint from fetch source (state news)
  if (article._hint?.state) {
    const st = article._hint.state;
    const coords = INDIAN_STATES[st] || { lat: 20.5937, lng: 78.9629 };
    // Try to find a city in this state from MAJOR_CITIES
    for (const [cityName, cityData] of Object.entries(MAJOR_CITIES)) {
      if (cityData.state === st && cityData.country === 'India' && text.includes(cityName)) {
        return { city: cityName.charAt(0).toUpperCase() + cityName.slice(1), district: '', state: st, country: 'India', continent: 'Asia', lat: cityData.lat, lng: cityData.lng };
      }
    }
    return { city: '', district: '', state: st, country: 'India', continent: 'Asia', lat: coords.lat + (Math.random() - 0.5) * 1, lng: coords.lng + (Math.random() - 0.5) * 1 };
  }

  // 2. Check for major cities in text (most specific match first)
  // Sort by name length descending so "new delhi" matches before "delhi", "san francisco" before "san"
  const sortedCities = Object.entries(MAJOR_CITIES).sort((a, b) => b[0].length - a[0].length);
  for (const [cityName, cityData] of sortedCities) {
    if (text.includes(cityName)) {
      const displayName = cityName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return {
        city: displayName, district: '', state: cityData.state,
        country: cityData.country, continent: cityData.continent,
        lat: cityData.lat + (Math.random() - 0.5) * 0.3,
        lng: cityData.lng + (Math.random() - 0.5) * 0.3,
      };
    }
  }

  // 3. Check hint for India country
  if (article._hint?.country === 'in') {
    for (const [state, coords] of Object.entries(INDIAN_STATES)) {
      if (text.includes(state.toLowerCase())) {
        return { city: '', district: '', state, country: 'India', continent: 'Asia', lat: coords.lat + (Math.random() - 0.5) * 1, lng: coords.lng + (Math.random() - 0.5) * 1 };
      }
    }
    return { city: '', district: '', state: '', country: 'India', continent: 'Asia', lat: 20.5937 + (Math.random() - 0.5) * 10, lng: 78.9629 + (Math.random() - 0.5) * 10 };
  }

  // 4. Check for known countries in text
  for (const [country, coords] of Object.entries(COUNTRY_COORDS)) {
    if (text.includes(country.toLowerCase())) {
      return { city: '', district: '', state: '', country, continent: coords.continent, lat: coords.lat + (Math.random() - 0.5) * 3, lng: coords.lng + (Math.random() - 0.5) * 3 };
    }
  }

  // 5. Check source domain TLD
  try {
    const domain = article.source.url ? new URL(article.url).hostname : article.source.name;
    for (const [tld, loc] of Object.entries(TLD_COUNTRY)) {
      if (domain.endsWith(`.${tld}`)) {
        return { city: '', district: '', state: '', country: loc.country, continent: loc.continent, lat: loc.lat + (Math.random() - 0.5) * 3, lng: loc.lng + (Math.random() - 0.5) * 3 };
      }
    }
    if (domain.endsWith('.com') || domain.endsWith('.org') || domain.endsWith('.net')) {
      return { city: '', district: '', state: '', country: 'United States', continent: 'North America', lat: 38.9 + (Math.random() - 0.5) * 15, lng: -98.35 + (Math.random() - 0.5) * 15 };
    }
  } catch { /* ignore */ }

  // 6. Scatter globally as fallback
  const fallbacks = Object.values(COUNTRY_COORDS);
  const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return { city: '', district: '', state: '', country: 'Unknown', continent: pick.continent, lat: pick.lat + (Math.random() - 0.5) * 8, lng: pick.lng + (Math.random() - 0.5) * 8 };
}

// ─── Combine raw articles with local analysis + location inference ───
function buildAnalyzedArticles(raw: RawArticle[], analyses: any[]): AnalyzedArticle[] {
  return raw.map((article, index) => {
    const analysis = analyses[index] || {};
    const category = inferCategory(article.title);
    const loc = inferLocation(article);

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
        rawArticles = await fetchGNews(GNEWS_API_KEY, query, Math.min(max || 100, 100));
        newsSource = 'GNews';
      } else {
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

    // 3. Analyze all articles locally (keyword-based — fast, free, reliable)
    console.log(`Analyzing ${rawArticles.length} articles with keyword engine...`);
    const analyses = rawArticles.map(a => analyzeArticleLocal(a));
    console.log(`Analysis done: ${analyses.filter(a => a.sentiment !== 'neutral').length} non-neutral sentiments`);

    // 4. Build articles with analysis data
    const analyzedArticles = buildAnalyzedArticles(rawArticles, analyses);

    // 5. Clean old articles, then store new ones
    if (!query) {
      await cleanOldArticles(supabase);
      try {
        await storeArticles(supabase, analyzedArticles, newsSource);
      } catch (err) {
        console.error('Store error (non-fatal):', err);
      }
    }

    console.log(`Fetched ${analyzedArticles.length} fresh articles from ${newsSource}`);

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
