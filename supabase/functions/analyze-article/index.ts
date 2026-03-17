import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Keyword-based credibility analysis engine (free, fast, no external API) ───

// Clickbait / sensationalist patterns
const CLICKBAIT_PATTERNS = [
  /you won'?t believe/i, /shocking/i, /mind.?blowing/i, /jaw.?dropping/i,
  /what happens next/i, /doctors hate/i, /this one trick/i, /they don'?t want you to know/i,
  /exposed/i, /breaking.*bombshell/i, /secret.*revealed/i, /\b(insane|unbelievable|incredible)\b/i,
  /100% (proof|proven)/i, /must (see|read|watch)/i, /gone wrong/i, /will shock you/i,
  /the truth about/i, /exposed.*lie/i, /mainstream media won'?t/i,
];

// Misinformation red flag patterns
const MISINFO_PATTERNS = [
  /wake up.*sheeple/i, /big pharma/i, /deep state/i, /plandemic/i,
  /government.*cover.?up/i, /they'?re hiding/i, /false flag/i,
  /\bhoax\b/i, /mainstream media.*lying/i, /do your own research/i,
  /\bQAnon\b/i, /new world order/i, /illuminati/i, /chemtrail/i,
  /5G.*cause/i, /microchip.*vaccine/i, /depopulation/i, /agenda 2030/i,
];

// Credibility indicators (professional journalism signals)
const CREDIBILITY_SIGNALS = [
  /according to/i, /officials? said/i, /statement (from|by)/i,
  /spokesperson/i, /report (by|from)/i, /study (finds|shows|suggests)/i,
  /researchers (found|say|report)/i, /data (shows|suggests|indicates)/i,
  /published in/i, /peer.?reviewed/i, /university of/i, /institute of/i,
  /press (release|conference)/i, /source(s)? (said|told|confirmed)/i,
  /evidence (suggests|shows)/i, /investigation (found|reveals)/i,
];

// Reputable sources
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
  'espn': 88, 'bbc sport': 90, 'politico': 86, 'economist': 91,
  'foreign affairs': 92, 'npr': 88, 'pbs': 87, 'propublica': 90,
};

// Known unreliable / satire sources
const UNRELIABLE_SOURCES: Record<string, number> = {
  'the onion': 5, 'babylon bee': 10, 'infowars': 10, 'natural news': 10,
  'world news daily report': 5, 'daily mail': 45, 'new york post': 50,
  'breitbart': 35, 'thegatewaypundit': 15, 'occupydemocrats': 30,
  'bipartisanreport': 25, 'yournewswire': 10, 'beforeitsnews': 10,
};

// Emotional manipulation words
const EMOTIONAL_WORDS = new Set([
  'outrage', 'fury', 'slam', 'blast', 'destroy', 'annihilate', 'epic',
  'brutal', 'savage', 'rips', 'tears', 'crushes', 'obliterates', 'owned',
  'triggers', 'melts down', 'explodes', 'bombshell', 'chaos',
]);

const POSITIVE_WORDS = new Set(['success', 'win', 'wins', 'won', 'growth', 'improve', 'breakthrough', 'celebrate', 'launch', 'record', 'achieve', 'boost', 'gain', 'surge', 'rise', 'recover', 'peace', 'save', 'hero', 'praise', 'award', 'innovation', 'cure', 'solution', 'progress', 'thrive', 'soar', 'upgrade', 'milestone', 'triumph', 'hope', 'relief', 'benefit', 'discover', 'advance', 'prosper']);
const NEGATIVE_WORDS = new Set(['kill', 'killed', 'death', 'dead', 'die', 'crash', 'crisis', 'fail', 'attack', 'war', 'disaster', 'bomb', 'explosion', 'shooting', 'murder', 'victim', 'destroy', 'collapse', 'threat', 'fear', 'danger', 'violence', 'conflict', 'protest', 'riot', 'fraud', 'scam', 'fake', 'corrupt', 'arrest', 'crime', 'drought', 'flood', 'earthquake', 'devastating', 'tragic', 'worst', 'plunge', 'decline', 'loss', 'debt', 'recession', 'scandal', 'abuse', 'suffer', 'warning', 'ban']);

function analyzeCredibilityLocal(title: string, content: string, sourceName: string): {
  credibilityScore: number;
  bertConfidence: number;
  bertLabel: string;
  verdict: string;
  explanation: string;
  redFlags: string[];
  models: { nlpEngine: { score: number; verdict: string }; sourceCheck: { score: number; verdict: string } };
} {
  const text = `${title} ${content}`.toLowerCase();
  const words = text.split(/\W+/);
  const redFlags: string[] = [];
  let score = 70; // Start at neutral-credible baseline

  // 1. Source reputation check (+/- up to 25 points)
  const srcLower = sourceName.toLowerCase();
  let sourceScore = 65; // Unknown source baseline
  let sourceVerdict = 'unverified';
  for (const [name, rep] of Object.entries(REPUTABLE_SOURCES)) {
    if (srcLower.includes(name)) {
      sourceScore = rep;
      sourceVerdict = 'reputable';
      score += Math.round((rep - 70) * 0.3); // boost for reputable sources
      break;
    }
  }
  for (const [name, rep] of Object.entries(UNRELIABLE_SOURCES)) {
    if (srcLower.includes(name)) {
      sourceScore = rep;
      sourceVerdict = 'unreliable';
      score -= Math.round((70 - rep) * 0.4);
      redFlags.push(`Source "${sourceName}" has low credibility rating`);
      break;
    }
  }

  // 2. Clickbait detection (-3 points each, max -18)
  let clickbaitCount = 0;
  for (const pattern of CLICKBAIT_PATTERNS) {
    if (pattern.test(title) || pattern.test(content)) {
      clickbaitCount++;
    }
  }
  if (clickbaitCount > 0) {
    const penalty = Math.min(clickbaitCount * 3, 18);
    score -= penalty;
    redFlags.push(`Contains ${clickbaitCount} clickbait/sensationalist pattern${clickbaitCount > 1 ? 's' : ''}`);
  }

  // 3. Misinformation patterns (-8 points each, max -30)
  let misinfoCount = 0;
  for (const pattern of MISINFO_PATTERNS) {
    if (pattern.test(text)) {
      misinfoCount++;
    }
  }
  if (misinfoCount > 0) {
    const penalty = Math.min(misinfoCount * 8, 30);
    score -= penalty;
    redFlags.push(`Contains ${misinfoCount} known misinformation indicator${misinfoCount > 1 ? 's' : ''}`);
  }

  // 4. Credibility signals (+2 each, max +14)
  let credSignals = 0;
  for (const pattern of CREDIBILITY_SIGNALS) {
    if (pattern.test(text)) {
      credSignals++;
    }
  }
  if (credSignals > 0) {
    score += Math.min(credSignals * 2, 14);
  }

  // 5. Emotional manipulation check (-2 each, max -10)
  let emotionalCount = 0;
  for (const w of words) {
    if (EMOTIONAL_WORDS.has(w)) emotionalCount++;
  }
  if (emotionalCount >= 2) {
    score -= Math.min(emotionalCount * 2, 10);
    redFlags.push('Uses emotionally charged language');
  }

  // 6. ALL CAPS check in title
  const capsWords = title.split(/\s+/).filter(w => w.length > 3 && w === w.toUpperCase()).length;
  if (capsWords >= 2) {
    score -= 5;
    redFlags.push('Excessive capitalization in headline');
  }

  // 7. Excessive punctuation (!!! or ???)
  if (/[!?]{2,}/.test(title)) {
    score -= 4;
    redFlags.push('Excessive punctuation in headline');
  }

  // 8. Text length check — very short articles are less trustworthy
  if (content.length < 100) {
    score -= 5;
    redFlags.push('Very short article — insufficient content for verification');
  } else if (content.length > 500) {
    score += 3; // Longer, well-written articles tend to be more credible
  }

  // 9. Quote presence (journalist attribution)
  const quoteCount = (content.match(/[""].*?[""]|".*?"/g) || []).length;
  if (quoteCount >= 2) {
    score += 4; // Articles with quotes from sources are more credible
  }

  // 10. Number/data presence (factual reporting)
  const numberCount = (content.match(/\d+(?:\.\d+)?%|\$\d|£\d|\d{4,}|\d+\s*(million|billion|thousand|crore|lakh)/gi) || []).length;
  if (numberCount >= 2) {
    score += 3;
  }

  // Clamp score to 5-98 range
  score = Math.max(5, Math.min(98, score));

  // Determine sentiment for NLP engine display
  const posCount = words.filter(w => POSITIVE_WORDS.has(w)).length;
  const negCount = words.filter(w => NEGATIVE_WORDS.has(w)).length;
  const sentimentRatio = posCount + negCount > 0 ? posCount / (posCount + negCount) : 0.5;

  // Fake/Real determination — map credibility score to a confidence
  const bertConfidence = score / 100;
  const bertLabel = score >= 65 ? 'Real' : score >= 40 ? 'Uncertain' : 'Fake';

  const verdict = score > 75 ? 'credible' : score > 45 ? 'suspicious' : 'likely_fake';

  // Build explanation
  let explanation = '';
  if (score > 75) {
    explanation = `This article appears credible. ${credSignals > 0 ? `Found ${credSignals} professional journalism indicator${credSignals > 1 ? 's' : ''} (source attribution, data references).` : ''} ${sourceVerdict === 'reputable' ? `Published by ${sourceName}, a well-known reputable source.` : ''}`.trim();
  } else if (score > 45) {
    explanation = `This article shows some concerns. ${redFlags.length > 0 ? redFlags[0] + '.' : ''} ${sourceVerdict === 'unverified' ? 'The source could not be verified against known outlets.' : ''}`.trim();
  } else {
    explanation = `This article has significant credibility concerns. ${redFlags.slice(0, 2).join('. ')}. Recommend cross-checking with reputable sources before sharing.`;
  }

  if (!explanation) {
    explanation = `Credibility analysis based on ${words.length} words: source reputation, language patterns, and journalistic indicators.`;
  }

  // If no red flags found at all and source is unverified, note that
  if (redFlags.length === 0 && score < 75 && sourceVerdict === 'unverified') {
    redFlags.push('Source not in our verified database — credibility unconfirmed');
  }

  return {
    credibilityScore: score,
    bertConfidence,
    bertLabel,
    verdict,
    explanation,
    redFlags,
    models: {
      nlpEngine: { score, verdict },
      sourceCheck: { score: sourceScore, verdict: sourceVerdict },
    },
  };
}

// ─── Sentiment analysis ───
function analyzeSentiment(text: string): { sentiment: string; sentimentScore: number } {
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

// ─── Category inference ───
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Politics: ['president', 'minister', 'election', 'parliament', 'government', 'congress', 'senate', 'vote', 'political', 'trump', 'biden', 'modi', 'law', 'bill', 'policy', 'diplomat', 'sanction'],
  Sports: ['cricket', 'football', 'soccer', 'tennis', 'nba', 'nfl', 'ipl', 'match', 'tournament', 'championship', 'olympic', 'goal', 'player', 'coach', 'league', 'cup', 'fifa'],
  Health: ['health', 'medical', 'hospital', 'vaccine', 'disease', 'doctor', 'patient', 'cancer', 'drug', 'treatment', 'mental', 'covid', 'who', 'pandemic', 'outbreak'],
  Science: ['nasa', 'space', 'mars', 'moon', 'rocket', 'satellite', 'research', 'scientist', 'discovery', 'physics', 'quantum', 'genome', 'species', 'asteroid'],
  Business: ['market', 'stock', 'economy', 'bank', 'trade', 'tariff', 'investment', 'revenue', 'profit', 'startup', 'ipo', 'ceo', 'billion', 'million', 'gdp', 'finance'],
  Technology: ['ai', 'artificial intelligence', 'tech', 'software', 'google', 'apple', 'microsoft', 'meta', 'chip', 'robot', 'cyber', 'data', 'app', 'cloud'],
  Entertainment: ['movie', 'film', 'music', 'actor', 'celebrity', 'hollywood', 'bollywood', 'netflix', 'game', 'album', 'concert', 'award', 'oscar', 'grammy'],
  Environment: ['climate', 'carbon', 'emissions', 'renewable', 'solar', 'pollution', 'wildfire', 'flood', 'drought', 'earthquake', 'hurricane', 'deforestation'],
};

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  let best = 'General';
  let bestCount = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = keywords.filter(k => lower.includes(k)).length;
    if (count > bestCount) { best = cat; bestCount = count; }
  }
  return best;
}

// ─── Main Handler ───
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const isBatch = Array.isArray(body.articles);

    if (isBatch) {
      // Batch analysis
      const results = body.articles.map((a: any) => {
        const text = `${a.title || ''} ${a.description || ''} ${a.content || ''}`;
        const { sentiment, sentimentScore } = analyzeSentiment(text);
        const cred = analyzeCredibilityLocal(a.title || '', a.content || a.description || a.title || '', a.source || 'Unknown');
        const category = inferCategory(text);
        return {
          sentiment,
          sentimentScore,
          credibilityScore: cred.credibilityScore,
          aiSummary: (a.description || a.title || '').slice(0, 200),
          entities: [],
          category,
          location: { city: '', country: '', continent: '', lat: 0, lng: 0 },
        };
      });
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (body.type === 'credibility') {
      // Single article credibility check (used by Verify News)
      const { title, description, content } = body;
      const articleText = content || description || title || '';
      const sourceName = body.source || '';
      const result = analyzeCredibilityLocal(title || articleText, articleText, sourceName);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Single article full analysis
      const { title, description, content } = body;
      const text = `${title || ''} ${description || ''} ${content || ''}`;
      const { sentiment, sentimentScore } = analyzeSentiment(text);
      const cred = analyzeCredibilityLocal(title || '', content || description || title || '', body.source || 'Unknown');
      const category = inferCategory(text);
      return new Response(JSON.stringify({
        sentiment,
        sentimentScore,
        credibilityScore: cred.credibilityScore,
        aiSummary: (description || title || '').slice(0, 200),
        entities: [],
        category,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
