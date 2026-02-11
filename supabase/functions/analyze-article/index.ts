import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const HF_API_KEY = Deno.env.get('HF_API_KEY');

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const isBatch = Array.isArray(body.articles);

    if (isBatch) {
      return handleBatch(body.articles, body.type || 'full-analysis', GEMINI_API_KEY);
    } else if (body.type === 'credibility') {
      return handleCredibility(body, GEMINI_API_KEY, HF_API_KEY || '');
    } else {
      return handleSingle(body, GEMINI_API_KEY);
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.3 },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', response.status, errText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}

async function callHuggingFace(text: string, apiKey: string): Promise<{ label: string; score: number } | null> {
  if (!apiKey) return null;

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/roberta-base-openai-detector',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text.slice(0, 512) }),
      }
    );

    if (!response.ok) {
      console.error('HuggingFace error:', response.status);
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const realLabel = data[0].find((r: any) => r.label === 'Real');
      const fakeLabel = data[0].find((r: any) => r.label === 'Fake');
      return {
        label: (realLabel?.score || 0) > (fakeLabel?.score || 0) ? 'Real' : 'Fake',
        score: realLabel?.score || 0,
      };
    }
    return null;
  } catch (err) {
    console.error('HuggingFace inference error:', err);
    return null;
  }
}

async function handleBatch(articles: any[], type: string, apiKey: string): Promise<Response> {
  const articleList = articles.map((a: any, i: number) =>
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
- location: {city: string, country: string, continent: string, lat: number, lng: number}

Return ONLY a valid JSON array with exactly ${articles.length} elements, one per article in order. No markdown.`;

  try {
    const content = await callGemini(systemPrompt, `Analyze these ${articles.length} articles:\n\n${articleList}`, apiKey);
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const results = JSON.parse(cleaned);
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Batch analysis error:', err);
    return new Response(JSON.stringify({ results: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleCredibility(body: any, geminiKey: string, hfKey: string): Promise<Response> {
  const { title, description, content } = body;
  const articleText = content || description || title;

  // Run Gemini credibility analysis and HuggingFace RoBERTa in parallel
  const [geminiResult, hfResult] = await Promise.allSettled([
    callGemini(
      `You are a fake news detection AI. Analyze the article for credibility. Return JSON with:
- credibilityScore: 0-100
- verdict: "credible", "suspicious", or "likely_fake"
- explanation: 1-2 sentences explaining your assessment
- redFlags: array of strings listing any concerns

Return ONLY valid JSON, no markdown.`,
      `Check credibility:\nTitle: ${title}\nContent: ${articleText}`,
      geminiKey
    ),
    callHuggingFace(articleText, hfKey),
  ]);

  let geminiData: any = {};
  if (geminiResult.status === 'fulfilled') {
    try {
      const cleaned = geminiResult.value.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      geminiData = JSON.parse(cleaned);
    } catch { /* fallback below */ }
  }

  let bertConfidence = 0.5;
  let bertLabel = 'unknown';
  if (hfResult.status === 'fulfilled' && hfResult.value) {
    bertConfidence = hfResult.value.score;
    bertLabel = hfResult.value.label;
  }

  // Ensemble: combine Gemini credibility + RoBERTa real/fake score
  const geminiScore = geminiData.credibilityScore ?? 70;
  const hfScore = Math.round(bertConfidence * 100);
  const ensembleScore = Math.round(geminiScore * 0.6 + hfScore * 0.4);

  const verdict = ensembleScore > 75 ? 'credible' : ensembleScore > 45 ? 'suspicious' : 'likely_fake';

  const result = {
    credibilityScore: ensembleScore,
    bertConfidence,
    bertLabel,
    verdict,
    explanation: geminiData.explanation || `Ensemble analysis: Gemini scored ${geminiScore}/100, RoBERTa detector confidence ${Math.round(bertConfidence * 100)}% (${bertLabel}).`,
    redFlags: geminiData.redFlags || [],
    models: {
      gemini: { score: geminiScore, verdict: geminiData.verdict || 'unknown' },
      roberta: { confidence: bertConfidence, label: bertLabel },
    },
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleSingle(body: any, apiKey: string): Promise<Response> {
  const { title, description, content, type } = body;
  const articleText = content || description || title;

  let systemPrompt = '';
  let userPrompt = '';

  if (type === 'full-analysis') {
    systemPrompt = `You are a news analysis AI. Analyze the given news article and return a JSON response with these fields:
- sentiment: "positive", "negative", or "neutral"
- sentimentScore: number 0-1
- credibilityScore: number 0-100
- aiSummary: a 2-sentence summary
- entities: array of {text: string, type: "person"|"place"|"organization"}
- category: one of "Politics", "Technology", "Sports", "Health", "Science", "Business", "Entertainment", "Environment"
- location: {city: string, country: string, continent: string, lat: number, lng: number}

Return ONLY valid JSON, no markdown.`;
    userPrompt = `Analyze this article:\nTitle: ${title}\nDescription: ${description}\nContent: ${articleText}`;
  } else {
    systemPrompt = `You are a news summarization AI. Return JSON with:
- summary: 2-sentence summary
- entities: array of {text: string, type: "person"|"place"|"organization"}

Return ONLY valid JSON, no markdown.`;
    userPrompt = `Summarize:\nTitle: ${title}\nContent: ${articleText}`;
  }

  try {
    const resultContent = await callGemini(systemPrompt, userPrompt, apiKey);
    const cleaned = resultContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(cleaned);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Single analysis error:', err);
    return new Response(JSON.stringify({ error: 'Analysis failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
