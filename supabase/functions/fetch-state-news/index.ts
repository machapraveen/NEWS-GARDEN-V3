import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_HOURS = 24; // Cache state news for 24 hours (once per day)

// Major Indian states + their key cities for GNews search matching
const STATE_SEARCH_GROUPS = [
  { query: 'Telangana Hyderabad news', states: ['Telangana'] },
  { query: 'Andhra Pradesh Visakhapatnam Vijayawada news', states: ['Andhra Pradesh'] },
  { query: 'Tamil Nadu Chennai Coimbatore news', states: ['Tamil Nadu'] },
  { query: 'Karnataka Bengaluru Mysuru news', states: ['Karnataka'] },
  { query: 'Kerala Kochi Thiruvananthapuram news', states: ['Kerala'] },
  { query: 'Maharashtra Mumbai Pune Nagpur news', states: ['Maharashtra'] },
  { query: 'Gujarat Ahmedabad Surat news', states: ['Gujarat'] },
  { query: 'Rajasthan Jaipur Udaipur news', states: ['Rajasthan'] },
  { query: 'Uttar Pradesh Lucknow Varanasi Noida news', states: ['Uttar Pradesh'] },
  { query: 'Madhya Pradesh Bhopal Indore news', states: ['Madhya Pradesh'] },
  { query: 'Delhi NCR news', states: ['Delhi'] },
  { query: 'West Bengal Kolkata news', states: ['West Bengal'] },
  { query: 'Bihar Patna news', states: ['Bihar'] },
  { query: 'Punjab Chandigarh Ludhiana news', states: ['Punjab'] },
  { query: 'Haryana Gurugram Faridabad news', states: ['Haryana'] },
  { query: 'Odisha Bhubaneswar news', states: ['Odisha'] },
  { query: 'Assam Guwahati news', states: ['Assam'] },
  { query: 'Jharkhand Ranchi news', states: ['Jharkhand'] },
  { query: 'Chhattisgarh Raipur news', states: ['Chhattisgarh'] },
  { query: 'Uttarakhand Dehradun news', states: ['Uttarakhand'] },
  { query: 'Himachal Pradesh Shimla news', states: ['Himachal Pradesh'] },
  { query: 'Goa Panaji news', states: ['Goa'] },
  { query: 'Jammu Kashmir Srinagar news', states: ['Jammu & Kashmir'] },
  { query: 'Ladakh Leh news', states: ['Ladakh'] },
  { query: 'Manipur Imphal news', states: ['Manipur'] },
  { query: 'Meghalaya Shillong news', states: ['Meghalaya'] },
  { query: 'Tripura Agartala news', states: ['Tripura'] },
  { query: 'Nagaland Kohima news', states: ['Nagaland'] },
  { query: 'Mizoram Aizawl news', states: ['Mizoram'] },
  { query: 'Arunachal Pradesh Itanagar news', states: ['Arunachal Pradesh'] },
  { query: 'Sikkim Gangtok news', states: ['Sikkim'] },
];

// State → city keywords for matching articles to states
const STATE_KEYWORDS: Record<string, string[]> = {
  'Telangana': ['telangana', 'hyderabad', 'secunderabad', 'warangal', 'nizamabad', 'karimnagar'],
  'Andhra Pradesh': ['andhra pradesh', 'visakhapatnam', 'vijayawada', 'tirupati', 'guntur', 'amaravati'],
  'Tamil Nadu': ['tamil nadu', 'chennai', 'coimbatore', 'madurai', 'salem', 'tiruchirappalli'],
  'Karnataka': ['karnataka', 'bengaluru', 'bangalore', 'mysuru', 'mysore', 'hubli', 'mangalore'],
  'Kerala': ['kerala', 'kochi', 'thiruvananthapuram', 'kozhikode', 'thrissur', 'kollam'],
  'Maharashtra': ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'nashik', 'aurangabad'],
  'Gujarat': ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'gandhinagar'],
  'Rajasthan': ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'kota', 'ajmer'],
  'Uttar Pradesh': ['uttar pradesh', 'lucknow', 'varanasi', 'noida', 'agra', 'kanpur', 'prayagraj'],
  'Madhya Pradesh': ['madhya pradesh', 'bhopal', 'indore', 'jabalpur', 'gwalior'],
  'Delhi': ['delhi', 'new delhi', 'ncr'],
  'West Bengal': ['west bengal', 'kolkata', 'calcutta', 'howrah', 'durgapur'],
  'Bihar': ['bihar', 'patna', 'gaya', 'muzaffarpur', 'bhagalpur'],
  'Punjab': ['punjab', 'chandigarh', 'ludhiana', 'amritsar', 'jalandhar'],
  'Haryana': ['haryana', 'gurugram', 'gurgaon', 'faridabad', 'karnal', 'hisar'],
  'Odisha': ['odisha', 'orissa', 'bhubaneswar', 'cuttack', 'puri'],
  'Assam': ['assam', 'guwahati', 'dibrugarh', 'silchar'],
  'Jharkhand': ['jharkhand', 'ranchi', 'jamshedpur', 'dhanbad', 'bokaro'],
  'Chhattisgarh': ['chhattisgarh', 'raipur', 'bilaspur', 'durg'],
  'Uttarakhand': ['uttarakhand', 'dehradun', 'haridwar', 'rishikesh', 'nainital'],
  'Himachal Pradesh': ['himachal', 'shimla', 'manali', 'dharamshala', 'kullu'],
  'Goa': ['goa', 'panaji', 'margao', 'vasco'],
  'Jammu & Kashmir': ['jammu', 'kashmir', 'srinagar', 'anantnag', 'baramulla'],
  'Ladakh': ['ladakh', 'leh', 'kargil'],
  'Manipur': ['manipur', 'imphal'],
  'Meghalaya': ['meghalaya', 'shillong', 'tura'],
  'Tripura': ['tripura', 'agartala'],
  'Nagaland': ['nagaland', 'kohima', 'dimapur'],
  'Mizoram': ['mizoram', 'aizawl', 'lunglei'],
  'Arunachal Pradesh': ['arunachal', 'itanagar', 'tawang'],
  'Sikkim': ['sikkim', 'gangtok'],
};

interface StateNews {
  state: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// Check if we have today's cached state news
async function getCachedStateNews(supabase: any): Promise<StateNews[] | null> {
  try {
    const cutoff = new Date(Date.now() - CACHE_HOURS * 3600000).toISOString();
    const { data, error } = await supabase
      .from('state_daily_news')
      .select('*')
      .gte('fetched_at', cutoff)
      .order('state', { ascending: true });

    if (error) {
      console.log('Cache table not available:', error.message);
      return null;
    }

    if (data && data.length > 10) {
      return data.map((d: any) => ({
        state: d.state,
        title: d.title,
        description: d.description,
        url: d.url,
        imageUrl: d.image_url,
        source: d.source,
        publishedAt: d.published_at,
      }));
    }
  } catch {
    console.log('Cache check failed, proceeding with fresh fetch');
  }
  return null;
}

// Store state news in database (best-effort, table may not exist yet)
async function storeStateNews(supabase: any, newsItems: StateNews[]) {
  try {
    await supabase.from('state_daily_news').delete().lt(
      'fetched_at',
      new Date(Date.now() - CACHE_HOURS * 3600000).toISOString()
    );

    const rows = newsItems.map((item) => ({
      id: uuidv4(),
      state: item.state,
      title: item.title,
      description: item.description,
      url: item.url,
      image_url: item.imageUrl,
      source: item.source,
      published_at: item.publishedAt,
      fetched_at: new Date().toISOString(),
    }));

    await supabase.from('state_daily_news').upsert(rows, { onConflict: 'state' });
  } catch (err) {
    console.log('Could not cache state news:', err.message);
  }
}

// Match an article to a state using keyword matching
function matchArticleToState(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();
  for (const [state, keywords] of Object.entries(STATE_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return state;
    }
  }
  return null;
}

// Fetch news from GNews for a search query
async function fetchGNews(query: string, apiKey: string): Promise<any[]> {
  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=3&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const forceRefresh = body.forceRefresh === true;

    // Check cache first
    if (!forceRefresh) {
      const cached = await getCachedStateNews(supabase);
      if (cached) {
        return new Response(
          JSON.stringify({ stateNews: cached, cached: true, count: cached.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const GNEWS_KEY = Deno.env.get('GNEWS_API_KEY');
    if (!GNEWS_KEY) {
      return new Response(
        JSON.stringify({ error: 'GNews API key not configured', stateNews: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch news for each state group (batch in groups of 5 to avoid rate limits)
    const stateNewsMap: Record<string, StateNews> = {};
    const batchSize = 5;

    for (let i = 0; i < STATE_SEARCH_GROUPS.length; i += batchSize) {
      const batch = STATE_SEARCH_GROUPS.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((group) => fetchGNews(group.query, GNEWS_KEY))
      );

      results.forEach((result, idx) => {
        if (result.status !== 'fulfilled' || !result.value.length) return;
        const targetState = batch[idx].states[0];
        const articles = result.value;

        for (const article of articles) {
          // Try to match article to its state
          const matched = matchArticleToState(article.title || '', article.description || '') || targetState;
          if (!stateNewsMap[matched]) {
            stateNewsMap[matched] = {
              state: matched,
              title: article.title || '',
              description: article.description || '',
              url: article.url || '',
              imageUrl: article.image || '',
              source: article.source?.name || 'Unknown',
              publishedAt: article.publishedAt || new Date().toISOString(),
            };
          }
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < STATE_SEARCH_GROUPS.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const stateNewsList = Object.values(stateNewsMap);

    // Store in database
    if (stateNewsList.length > 0) {
      await storeStateNews(supabase, stateNewsList);
    }

    return new Response(
      JSON.stringify({ stateNews: stateNewsList, cached: false, count: stateNewsList.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('fetch-state-news error:', err);
    return new Response(
      JSON.stringify({ error: err.message, stateNews: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
