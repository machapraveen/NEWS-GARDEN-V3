import type { NewsArticle } from "@/data/mockNews";

interface CacheEntry {
  articles: NewsArticle[];
  timestamp: number;
  category: string | null;
  contentHash: string;
}

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, CacheEntry>();

function getCacheKey(category: string | null): string {
  return category || '__all__';
}

export function getCachedNews(category: string | null): NewsArticle[] | null {
  const key = getCacheKey(category);
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_DURATION_MS) {
    cache.delete(key);
    return null;
  }

  return entry.articles;
}

export function setCachedNews(category: string | null, articles: NewsArticle[], contentHash: string): void {
  const key = getCacheKey(category);
  cache.set(key, {
    articles,
    timestamp: Date.now(),
    category,
    contentHash,
  });
}

export function getCacheEntry(category: string | null): CacheEntry | null {
  const key = getCacheKey(category);
  return cache.get(key) || null;
}

export function clearCache(category?: string | null): void {
  if (category !== undefined) {
    cache.delete(getCacheKey(category));
  } else {
    cache.clear();
  }
}

export function getCacheAge(category: string | null): number | null {
  const key = getCacheKey(category);
  const entry = cache.get(key);
  if (!entry) return null;
  return Date.now() - entry.timestamp;
}

export const CACHE_DURATION = CACHE_DURATION_MS;
