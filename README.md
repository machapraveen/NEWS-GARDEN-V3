# News Garden V3 — AI-Powered Interactive 3D Globe News Explorer

## Abstract

The proliferation of misinformation across digital platforms presents a critical challenge to informed public discourse. **News Garden** addresses this through an AI-powered interactive 3D globe interface that aggregates, analyzes, and visualizes global news in real time across six geographic levels: **City, District, State, Country, Continent, and World**.

The system employs a **multi-model ensemble approach** for fake news detection, combining a fine-tuned **RoBERTa-based transformer** (trained on 72,134 labeled articles) with **Google Gemini 2.0 Flash** for contextual credibility assessment. Each article undergoes six-dimensional analysis: **sentiment classification, category detection, credibility scoring, named entity extraction, geographic location mapping, and AI-generated summarization**.

News Garden aggregates articles from multiple sources (**GNews API, GDELT Project**) using a multi-region fetch strategy that ensures geographic diversity across continents. A dedicated **India state-level news pipeline** fetches daily top stories for all 31 states and union territories. Articles are ranked using a **multi-factor trending algorithm** (recency 50%, credibility 30%, sentiment strength 20%) with the top story at each geographic level marked as trending.

The frontend is built with **React 18 and Vite**, featuring an interactive **Three.js/WebGL 3D globe** with clickable markers, a **D3.js-rendered India state overlay** with district-level GeoJSON boundaries, a **news verification tool** for user-submitted text, and an **analytics dashboard** with real-time sentiment distribution, regional activity, and category breakdowns.

Backend services run on **Supabase Edge Functions** (Deno runtime) with PostgreSQL for multi-tier caching (30-minute client-side, 12-hour server-side for global news, 24-hour for state news). The system processes approximately 100 articles per refresh cycle with batched AI analysis.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5 |
| 3D Globe | react-globe.gl, Three.js, WebGL |
| India Map | D3.js (Orthographic projection, GeoJSON) |
| UI Components | Radix UI, TailwindCSS, Lucide Icons |
| Charts | Recharts |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase PostgreSQL (with RLS) |
| AI Analysis | Google Gemini 2.0 Flash |
| Fake News Detection | HuggingFace RoBERTa (roberta-base-openai-detector) |
| News Sources | GNews API, GDELT Project |
| State Management | React Query (TanStack) |

---

## Features

### Core
- **Interactive 3D Globe** with clickable news markers across the world
- **Six Geographic Levels** — City, District, State, Country, Continent, World
- **Multi-Factor Trending** — Articles ranked by recency, credibility, and sentiment
- **100+ Live Articles** per refresh from multiple global sources
- **India State News** — Daily top story from each of the 31 states/UTs
- **120+ News Channels** — Global directory with India state overlay

### AI & Analysis
- **Ensemble Credibility Scoring** — 60% Gemini + 40% RoBERTa
- **Sentiment Analysis** — Positive, Negative, Neutral with confidence scores
- **Category Classification** — 8 categories (Politics, Technology, Sports, Health, Science, Business, Entertainment, Environment)
- **Named Entity Extraction** — Persons, Organizations, Places
- **AI Summarization** — Gemini-generated article summaries
- **News Verifier** — Paste any headline to check credibility in real time

### Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Globe View | 3D globe, trending section, state news, news verifier, quick stats |
| `/article/:id` | Article Detail | Full article with credibility analysis, RoBERTa detector, Gemini AI analysis, red flags, community reports, text-to-speech |
| `/dashboard` | Dashboard | Sentiment pie chart, regional bar chart, category tag cloud |
| `/channels` | Channels | 120+ global news channels on a globe with India state overlay (D3.js) |
| `*` | 404 | Not found page |

### Infrastructure
- **Multi-tier Caching** — 30min client / 12hr server / 24hr state news
- **Auto-refresh** — Background refresh every 30 minutes
- **Cross-source Verification** — Articles aggregated from GNews + GDELT
- **Content Change Detection** — Hash-based staleness checking
- **Batched AI Analysis** — 25 articles per Gemini batch for efficient processing

---

## Project Structure

```
├── index.html                          # Entry HTML
├── package.json                        # Dependencies and scripts
├── vite.config.ts                      # Vite build config
├── tailwind.config.ts                  # TailwindCSS theme
├── tsconfig.json                       # TypeScript config
│
├── public/
│   ├── favicon.svg                     # App favicon
│   └── robots.txt                      # SEO crawl rules
│
├── src/
│   ├── main.tsx                        # React entry point
│   ├── App.tsx                         # Router (5 routes)
│   │
│   ├── pages/
│   │   ├── Index.tsx                   # Globe + trending + state news + verifier
│   │   ├── ArticleDetail.tsx           # Article view with AI credibility analysis
│   │   ├── Dashboard.tsx               # Analytics dashboard (charts)
│   │   ├── Channels.tsx                # News channels directory
│   │   └── NotFound.tsx                # 404 page
│   │
│   ├── components/
│   │   ├── Globe.tsx                   # 3D globe (react-globe.gl + Three.js)
│   │   ├── GlobeControls.tsx           # Category filter, search bar
│   │   ├── NewsPanel.tsx               # Side panel with 6 geographic levels
│   │   ├── NewsVerifier.tsx            # Paste-to-verify credibility tool
│   │   ├── NewsChannelsGlobe.tsx       # Channels globe with India overlay
│   │   ├── IndiaMapOverlay.tsx         # D3.js SVG India state map
│   │   ├── NavLink.tsx                 # Navigation component
│   │   └── ui/                         # 45+ Radix UI styled components
│   │
│   ├── data/
│   │   ├── mockNews.ts                 # Types, interfaces, helper functions
│   │   └── newsChannels.ts             # 120+ channels, country ID mapping
│   │
│   ├── lib/
│   │   ├── api/news.ts                 # API layer (fetch news, state news, credibility)
│   │   ├── newsCache.ts                # Client-side 30min cache
│   │   └── utils.ts                    # Utility functions
│   │
│   └── hooks/
│       └── use-toast.ts                # Toast notification hook
│
└── supabase/
    ├── functions/
    │   ├── fetch-news/index.ts         # Main pipeline: multi-region fetch + Gemini batch analysis
    │   ├── fetch-state-news/index.ts   # India 31-state daily news aggregation
    │   └── analyze-article/index.ts    # Ensemble credibility (Gemini + RoBERTa)
    │
    └── migrations/
        └── create_state_daily_news.sql # State news cache table schema
```

---

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- A **Supabase** project (free tier is sufficient)
- API keys listed below

---

## API Keys Required

| Key | Where to Get | Purpose |
|-----|-------------|---------|
| `GNEWS_API_KEY` | [gnews.io](https://gnews.io) | Fetching news articles (global + India + search) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) | Batch article analysis, summarization, credibility |
| `HF_API_KEY` *(optional)* | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | RoBERTa fake news detection model |
| `SUPABASE_URL` | Supabase Dashboard > Settings > API | Database and Edge Functions base URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API | Server-side DB operations (edge functions) |
| `SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API | Client-side API calls |

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/hyperbuildlabs-main/NEWS-GARDEN-V3.git
cd NEWS-GARDEN-V3
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_EDGE_FUNCTIONS_URL=https://<your-project-ref>.supabase.co/functions/v1
VITE_EDGE_FUNCTIONS_KEY=<your-supabase-anon-key>
```

### 4. Set Up Supabase

#### a. Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- State Daily News Cache Table
CREATE TABLE IF NOT EXISTS state_daily_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  image_url TEXT,
  source TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE state_daily_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read state_daily_news"
  ON state_daily_news FOR SELECT USING (true);

CREATE POLICY "Service role full access"
  ON state_daily_news FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_state_daily_news_fetched
  ON state_daily_news(fetched_at DESC);
```

> The `news_articles` and `news_fetch_log` tables are auto-created by the `fetch-news` edge function on first run.

#### b. Set Edge Function Secrets

In **Supabase Dashboard > Edge Functions > Secrets**, add:

| Secret Name | Value |
|-------------|-------|
| `GNEWS_API_KEY` | Your GNews API key |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `HF_API_KEY` | Your HuggingFace API token |

#### c. Deploy Edge Functions

Using Supabase CLI:

```bash
supabase functions deploy fetch-news --no-verify-jwt
supabase functions deploy fetch-state-news --no-verify-jwt
supabase functions deploy analyze-article --no-verify-jwt
```

Or deploy via **Supabase Dashboard > Edge Functions > Deploy**.

### 5. Run the Application

```bash
# Development server (http://localhost:8080)
npm run dev

# Production build
npm run build

# Preview production build (http://localhost:4173)
npm run preview
```

---

## Edge Functions

| Function | Purpose | Cache TTL | Trigger |
|----------|---------|-----------|---------|
| `fetch-news` | Multi-region news aggregation (GNews + GDELT + state news) + Gemini batch analysis | 12 hours | Page load / 30min auto-refresh |
| `fetch-state-news` | India 31-state daily news via GNews search queries | 24 hours | Page load |
| `analyze-article` | Single article credibility analysis (Gemini + RoBERTa ensemble) | None | On-demand (article detail view) |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `news_articles` | Stores analyzed articles with sentiment, credibility, location (6 levels), entities, AI summary |
| `news_fetch_log` | Tracks last fetch timestamp for 12-hour cache invalidation |
| `state_daily_news` | One top story per Indian state, refreshed every 24 hours |

---

## Architecture

```
  Browser (React + Vite)
      │
      ├── 3D Globe (Three.js / WebGL)
      ├── India Map (D3.js SVG)
      ├── Charts (Recharts)
      └── Client Cache (30min)
      │
      ▼
  Supabase Edge Functions (Deno)
      │
      ├── fetch-news ─────────┬── GNews API (global + India + search)
      │                       ├── GDELT Project (cross-source enrichment)
      │                       ├── State News DB (daily cache)
      │                       └── Gemini 2.0 Flash (batch analysis, 25/batch)
      │
      ├── fetch-state-news ───┬── GNews API (31 state search queries)
      │                       └── PostgreSQL (24hr cache)
      │
      └── analyze-article ────┬── Gemini 2.0 Flash (credibility + red flags)
                              └── HuggingFace RoBERTa (fake news detection)
      │
      ▼
  Supabase PostgreSQL
      ├── news_articles
      ├── news_fetch_log
      └── state_daily_news
```

---

## API Usage (Approximate Daily)

| API | Calls/Day | Notes |
|-----|-----------|-------|
| GNews | ~35 | 4 global refreshes + 31 state queries |
| GDELT | ~4 | Free, no API key required |
| Gemini | ~16 | 4 refreshes x 4 batches of 25 articles |
| HuggingFace | On-demand | Only when viewing individual article detail |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (Vitest) |

---

## Deployment

Build the project and deploy the `dist/` folder to any static hosting provider:

```bash
npm run build
```

Compatible with **Vercel**, **Netlify**, **Cloudflare Pages**, or any static file host. Make sure the hosting provider is configured for SPA routing (redirect all routes to `index.html`).

---

## License

All rights reserved.
