import type { NewsArticle } from "@/data/mockNews";

interface CacheEntry {
  articles: NewsArticle[];
  timestamp: number;
  contentHash: string;
}

const CACHE_KEY = 'news_garden_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch { /* localStorage full or unavailable */ }
}

export function getCachedNews(category: string | null): NewsArticle[] | null {
  const entry = readCache();
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_DURATION_MS) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }

  return entry.articles;
}

export function setCachedNews(category: string | null, articles: NewsArticle[], contentHash: string): void {
  writeCache({
    articles,
    timestamp: Date.now(),
    contentHash,
  });
}

export function getCacheEntry(category: string | null): CacheEntry | null {
  return readCache();
}

export function clearCache(category?: string | null): void {
  localStorage.removeItem(CACHE_KEY);
}

export function getCacheAge(category: string | null): number | null {
  const entry = readCache();
  if (!entry) return null;
  return Date.now() - entry.timestamp;
}

export const CACHE_DURATION = CACHE_DURATION_MS;
