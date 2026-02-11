# News Garden

An AI-powered interactive 3D globe for real-time global news exploration.

## Features

- **Interactive 3D Globe** — Spin, zoom, and click to explore news worldwide
- **AI Analysis** — Sentiment analysis, entity extraction, and article summarization
- **Fake News Detection** — Multi-layer verification with ML models and community reporting
- **Geographic Hierarchy** — Browse news from City → District → State → Country → Continent → World
- **Real-time Data** — Live news from GNews API with AI-powered categorization
- **Analytics Dashboard** — Visualize sentiment trends and news distribution

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **3D Globe:** react-globe.gl + Three.js
- **Backend:** Supabase Edge Functions (Deno)
- **AI/ML:** Gemini AI for analysis, HuggingFace for fake news detection
- **Data:** GNews API for real-time news

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase edge function secrets:
- `GNEWS_API_KEY` — GNews API key
- `GEMINI_API_KEY` — Google Gemini API key
- `HF_API_KEY` — HuggingFace API key

## Deployment

Build the project and deploy the `dist/` folder to any static hosting provider (Vercel, Netlify, etc.).
