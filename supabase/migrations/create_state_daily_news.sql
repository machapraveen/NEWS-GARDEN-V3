-- State Daily News Cache Table
-- Run this in Supabase SQL Editor to enable server-side caching of state news

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

-- Enable RLS
ALTER TABLE state_daily_news ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read state_daily_news"
  ON state_daily_news FOR SELECT USING (true);

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role full access"
  ON state_daily_news FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for fast fetched_at lookups
CREATE INDEX IF NOT EXISTS idx_state_daily_news_fetched
  ON state_daily_news(fetched_at DESC);
