import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface UnifiedArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
}

async function fetchGNews(category?: string, query?: string, max = 5): Promise<UnifiedArticle[]> {
  const apiKey = Deno.env.get('GNEWS_API_KEY');
  if (!apiKey) return [];

  let url: string;
  if (query) {
    url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=${max}&apikey=${apiKey}`;
  } else {
    url = `https://gnews.io/api/v4/top-headlines?lang=en&max=${max}&apikey=${apiKey}`;
  }

  if (category && category !== 'All') {
    const categoryMap: Record<string, string> = {
      'Technology': 'technology', 'Science': 'science', 'Health': 'health',
      'Business': 'business', 'Entertainment': 'entertainment', 'Sports': 'sports',
      'Politics': 'nation', 'Environment': 'world',
    };
    url += `&category=${categoryMap[category] || 'general'}`;
  }

  console.log('Fetching from GNews:', url.replace(apiKey, '***'));
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) { console.error('GNews error:', data); return []; }
    return (data.articles || []).map((a: any) => ({
      title: a.title,
      description: a.description || '',
      content: a.content || a.description || '',
      url: a.url,
      image: a.image || '',
      publishedAt: a.publishedAt,
      source: { name: a.source?.name || 'Unknown', url: a.source?.url || '' },
    }));
  } catch (err) { console.error('GNews fetch error:', err); return []; }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, country, query, max } = await req.json();
    const requestMax = Math.min(max || 25, 25);

    const allArticles = await fetchGNews(category, query, requestMax);

    console.log(`Fetched ${allArticles.length} articles from GNews`);

    return new Response(JSON.stringify({ totalArticles: allArticles.length, articles: allArticles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
