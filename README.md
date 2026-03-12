# News Garden V3 — AI-Powered Interactive 3D Globe News Explorer

## Abstract

The proliferation of misinformation across digital platforms presents a critical challenge to informed public discourse. **News Garden** addresses this through an AI-powered interactive 3D globe interface that aggregates, analyzes, and visualizes global news in real time across six geographic levels: **City, District, State, Country, Continent, and World**.

The system employs a **keyword-based NLP engine** for article analysis — sentiment classification, credibility scoring from a database of 40+ reputable sources, and named entity extraction using pattern matching against 120+ major world cities and 45+ countries. Each article undergoes six-dimensional analysis: **sentiment classification, category detection, credibility scoring, named entity extraction, geographic location mapping, and AI-generated summarization**.

News Garden aggregates articles from multiple sources (**GNews API, GDELT Project**) using a **multi-region fetch strategy** across 8 geographic regions (Global, India, US, UK, Australia, Japan, Brazil, Nigeria) ensuring diversity across continents. A dedicated **India state-level news pipeline** fetches daily top stories for all 31 states and union territories. Articles are ranked using a **multi-factor trending algorithm** (recency 50%, credibility 30%, sentiment strength 20%) with the top story at each geographic level marked as trending.

The frontend is built with **React 18 and Vite**, featuring an interactive **Three.js/WebGL 3D globe** with clickable markers, a **D3.js-rendered India state overlay** with district-level GeoJSON boundaries, a **news verification tool** for user-submitted text, and an **analytics dashboard** with 9 real-time visualization sections.

Backend services run on **Supabase Edge Functions** (Deno runtime) with PostgreSQL for **3-layer caching** (30-minute client-side, 2-hour server-side DB cache, 48-hour article retention). The system processes **330–390 articles per refresh cycle** with fully local keyword-based analysis (no paid AI APIs required).

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
| NLP Analysis | Keyword-based sentiment, credibility & entity engine |
| News Sources | GNews API (Enterprise), GDELT Project |
| State Management | React Query (TanStack) |

---

## How News Flows — 3-Layer Caching Architecture

The system uses a **3-layer caching strategy** to balance freshness with performance:

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER OPENS THE SITE                          │
└─────────────┬───────────────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: Browser localStorage (30 min TTL)                     │
│                                                                 │
│  - Checked FIRST on every page load                             │
│  - If articles exist and are < 30 min old → show INSTANTLY      │
│  - Meanwhile, a background fetch runs to get fresh data         │
│  - Result: zero-latency page load for returning users           │
└─────────────┬───────────────────────────────────────────────────┘
              ▼  (background fetch hits edge function)
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: Supabase DB Cache (2 hour TTL)                        │
│                                                                 │
│  - Edge function checks `news_fetch_log` for last fetch time    │
│  - If last fetch was < 2 hours ago → serve from PostgreSQL      │
│  - Response time: ~50-100ms (DB read only, no external API)     │
│  - Result: fast response, shared cache across ALL users         │
└─────────────┬───────────────────────────────────────────────────┘
              ▼  (only when DB cache is expired)
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: Fresh Multi-Region GNews Fetch                        │
│                                                                 │
│  - 8 parallel GNews API calls:                                  │
│    Global(100) + India(100) + US(50) + UK(30)                   │
│    + AU(20) + JP(20) + BR(20) + NG(20)                          │
│  - + GDELT cross-source (30)                                    │
│  - + Indian state news from DB                                  │
│  - Deduplicated by URL → 330-390 unique articles                │
│  - Keyword analysis: sentiment + credibility + entities          │
│  - Stored in DB, old articles (>48hr) cleaned                   │
│  - Response time: ~15-20 seconds                                │
└─────────────────────────────────────────────────────────────────┘
```

### Refresh Timing Summary

| Scenario | What Happens | Response Time |
|----------|-------------|---------------|
| User opens site (has localStorage cache) | Shows cached articles instantly, background refresh runs | **< 1 second** |
| Background refresh (DB cache < 2hr old) | Returns DB-cached articles, updates localStorage | **~100ms** |
| DB cache expired (> 2 hours) | Full multi-region fetch + analysis + DB store | **~15-20 seconds** |
| User clicks Refresh button | `forceRefresh: true` — always fetches fresh | **~15-20 seconds** |
| Articles older than 48 hours | Automatically deleted by `cleanOldArticles()` | Automatic |

### Key Design Decisions

- **No paid AI dependency** — All analysis (sentiment, credibility, entities) runs locally in the edge function using keyword matching. Zero API cost for analysis.
- **`Promise.allSettled`** for multi-region — If Japan or Brazil API calls fail, the rest still return. The system is resilient to partial failures.
- **Upsert on URL** — Same article URL gets updated (not duplicated). New articles are inserted. This prevents stale duplicates.
- **Enterprise GNews plan** — 25,000 requests/day capacity. System uses ~10 requests per refresh cycle = ~120/day max. Well within limits.

---

## Features

### Core
- **Interactive 3D Globe** with clickable news markers across the world
- **Six Geographic Levels** — City, District, State, Country, Continent, World
- **Multi-Factor Trending** — Articles ranked by recency, credibility, and sentiment
- **330+ Live Articles** per refresh from 8 global regions
- **India State News** — Daily top story from each of the 31 states/UTs
- **120+ News Channels** — Global directory with India state overlay

### Analysis Engine
- **Keyword-Based Sentiment** — Positive, Negative, Neutral with confidence scores using curated word lists
- **Source Credibility Scoring** — 40+ reputable sources mapped (Reuters 95, BBC 93, AP 94, etc.)
- **Category Classification** — 8 categories (Politics, Technology, Sports, Health, Science, Business, Entertainment, Environment)
- **Named Entity Extraction** — Persons, Organizations, Places from 120+ city database + pattern matching
- **Geographic Inference** — 120+ major cities with lat/lng, 45+ countries, TLD-based fallback, Indian state mapping
- **News Verifier** — Paste any headline to check credibility in real time

### Dashboard (9 Sections)
1. **Header + Stats Bar** — Total articles, countries, avg credibility, sources
2. **Sentiment Donut Chart** — Positive/Negative/Neutral distribution
3. **Category Distribution** — Horizontal bar chart sorted by count
4. **Credibility Distribution** — 5 buckets (0-20 to 81-100) with color gradient
5. **Publication Timeline** — Area chart showing article freshness
6. **Geographic Coverage** — Country bars with continent badges
7. **Top Sources** — Ranked by article count with credibility scores
8. **Trending Entities** — Tabbed tag cloud (All/People/Organizations/Places)
9. **Recent Articles** — Scrollable linked list with sentiment indicators

### Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Globe View | 3D globe, trending section, state news, news verifier, quick stats |
| `/article/:id` | Article Detail | Full article with credibility analysis, red flags, text-to-speech |
| `/dashboard` | Dashboard | 9-section analytics dashboard with self-sufficient data loading |
| `/channels` | Channels | 120+ global news channels on a globe with India state overlay (D3.js) |
| `*` | 404 | Not found page |

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
│   │   ├── ArticleDetail.tsx           # Article view with credibility analysis
│   │   ├── Dashboard.tsx               # 9-section analytics dashboard
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
│   │   ├── newsCache.ts                # Client-side 30min localStorage cache
│   │   └── utils.ts                    # Utility functions
│   │
│   └── hooks/
│       └── use-toast.ts                # Toast notification hook
│
└── supabase/
    ├── config.toml                     # Supabase project config
    ├── functions/
    │   ├── fetch-news/index.ts         # Main pipeline: multi-region fetch + keyword analysis
    │   ├── fetch-state-news/index.ts   # India 31-state daily news aggregation
    │   └── analyze-article/index.ts    # Single article credibility analysis
    │
    └── migrations/
        └── create_state_daily_news.sql # State news cache table schema
```

---

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- A **Supabase** project (free tier works, Pro recommended for edge function limits)
- **GNews API key** (Enterprise plan recommended for multi-region fetching)

---

## API Keys Required

| Key | Where to Get | Purpose |
|-----|-------------|---------|
| `GNEWS_API_KEY` | [gnews.io](https://gnews.io) | Fetching news articles (8 regions + search) |
| `SUPABASE_URL` | Supabase Dashboard > Settings > API | Auto-injected in edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API | Auto-injected in edge functions |
| `SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API | Client-side API calls |

> **Note:** No Gemini or HuggingFace API keys are required. All article analysis runs locally in the edge function.

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

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
VITE_EDGE_FUNCTIONS_URL=https://<your-project-ref>.supabase.co/functions/v1
VITE_EDGE_FUNCTIONS_KEY=<your-supabase-anon-key>
```

### 4. Set Up Supabase

#### a. Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- News Articles Table
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  url TEXT UNIQUE NOT NULL,
  image_url TEXT,
  source_name TEXT,
  source_domain TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  country TEXT DEFAULT 'Unknown',
  continent TEXT DEFAULT 'Unknown',
  latitude DOUBLE PRECISION DEFAULT 0,
  longitude DOUBLE PRECISION DEFAULT 0,
  category TEXT DEFAULT 'Technology',
  sentiment_score DOUBLE PRECISION DEFAULT 0.5,
  sentiment_label TEXT DEFAULT 'neutral',
  credibility_score DOUBLE PRECISION DEFAULT 70,
  ai_fake_score DOUBLE PRECISION DEFAULT 0.5,
  entities JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_articles_fetched_at ON news_articles(fetched_at DESC);
CREATE INDEX idx_news_articles_country ON news_articles(country);
CREATE INDEX idx_news_articles_category ON news_articles(category);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON news_articles FOR SELECT USING (true);
CREATE POLICY "Allow service insert" ON news_articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update" ON news_articles FOR UPDATE USING (true);
CREATE POLICY "Allow service delete" ON news_articles FOR DELETE USING (true);

-- News Fetch Log Table
CREATE TABLE IF NOT EXISTS news_fetch_log (
  id SERIAL PRIMARY KEY,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  article_count INTEGER DEFAULT 0,
  source TEXT,
  batch_id TEXT
);

ALTER TABLE news_fetch_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON news_fetch_log FOR SELECT USING (true);
CREATE POLICY "Allow service insert" ON news_fetch_log FOR INSERT WITH CHECK (true);

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
CREATE POLICY "Public read state_daily_news" ON state_daily_news FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON state_daily_news FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX idx_state_daily_news_fetched ON state_daily_news(fetched_at DESC);
```

#### b. Set Edge Function Secrets

In **Supabase Dashboard > Edge Functions > Secrets**, add:

| Secret Name | Value |
|-------------|-------|
| `GNEWS_API_KEY` | Your GNews API key |

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase.

#### c. Deploy Edge Functions

Using Supabase CLI:

```bash
supabase functions deploy fetch-news --no-verify-jwt
supabase functions deploy fetch-state-news --no-verify-jwt
supabase functions deploy analyze-article --no-verify-jwt
```

### 5. Run the Application

```bash
# Development server (http://localhost:8080)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Edge Functions

| Function | Purpose | Cache TTL | Trigger |
|----------|---------|-----------|---------|
| `fetch-news` | Multi-region fetch (8 GNews regions + GDELT + state news) + keyword-based analysis | 2 hours (DB) | Page load / Refresh button |
| `fetch-state-news` | India 31-state daily news via GNews search queries | 24 hours | Page load |
| `analyze-article` | Single article credibility analysis | None | On-demand (article detail view) |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `news_articles` | Stores analyzed articles with sentiment, credibility, location (6 levels), entities, summaries |
| `news_fetch_log` | Tracks last fetch timestamp for 2-hour cache invalidation |
| `state_daily_news` | One top story per Indian state, refreshed every 24 hours |

---

## Architecture

```
  Browser (React + Vite)
      │
      ├── 3D Globe (Three.js / WebGL)
      ├── India Map (D3.js SVG)
      ├── Dashboard (Recharts — 9 sections)
      └── Client Cache (localStorage, 30min TTL)
      │
      ▼
  Supabase Edge Functions (Deno)
      │
      ├── fetch-news ─────────┬── GNews API x8 regions (330-390 articles)
      │                       ├── GDELT Project (cross-source enrichment)
      │                       ├── State News DB (daily cache)
      │                       └── Keyword NLP Engine (sentiment + credibility + entities)
      │
      ├── fetch-state-news ───┬── GNews API (31 state search queries)
      │                       └── PostgreSQL (24hr cache)
      │
      └── analyze-article ────── Keyword credibility analysis
      │
      ▼
  Supabase PostgreSQL (2hr cache TTL)
      ├── news_articles (330+ rows, upsert on URL)
      ├── news_fetch_log (cache invalidation tracker)
      └── state_daily_news (31 Indian states)
```

---

## API Usage (Approximate Daily)

| API | Calls/Day | Notes |
|-----|-----------|-------|
| GNews | ~120 | ~10 calls per refresh x ~12 refreshes/day (2hr cache) |
| GDELT | ~12 | Free, no API key required |
| Paid AI APIs | **0** | All analysis is local keyword-based |

> With GNews Enterprise (25,000 requests/day), the system operates at < 1% of capacity.

---

## Keyword Analysis Engine

The system uses a fully local NLP engine (no external AI API calls):

### Sentiment Analysis
- **40 positive keywords** (success, win, growth, breakthrough, celebrate, etc.)
- **48 negative keywords** (kill, crash, crisis, war, disaster, fraud, etc.)
- Ratio-based scoring: `positive_count / (positive + negative)` → sentiment label + score

### Credibility Scoring
- **40+ reputable sources** mapped with scores (Reuters: 95, BBC: 93, AP: 94, Financial Times: 92, etc.)
- Source name matching against the database
- Unknown sources receive a baseline score of 60-75

### Entity Extraction
- **120+ major cities** with lat/lng, state, country, continent
- **45+ countries** with coordinates
- Pattern matching for capitalized multi-word names (persons, organizations)
- Up to 8 entities per article

### Category Classification
- **8 category keyword lists** (17-18 keywords each)
- Best-match scoring: category with most keyword hits wins
- Covers: Politics, Technology, Sports, Health, Science, Business, Entertainment, Environment

### Geographic Inference (Priority Order)
1. Check fetch hint (state news → Indian state)
2. Check 120+ major cities in text (longest match first: "New Delhi" before "Delhi")
3. Check Indian state hints
4. Check 45+ country names in text
5. Check source domain TLD (.co.in → India, .co.uk → UK, etc.)
6. Fallback: random global scatter

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Deployment

Build the project and deploy the `dist/` folder to any static hosting provider:

```bash
npm run build
```

Compatible with **Vercel**, **Netlify**, **Cloudflare Pages**, or any static file host. Make sure the hosting provider is configured for SPA routing (redirect all routes to `index.html`).

### Environment Variables for Hosting

Set these in your hosting provider's dashboard:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_EDGE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1
VITE_EDGE_FUNCTIONS_KEY=<anon-key>
```

---

## License

All rights reserved.
