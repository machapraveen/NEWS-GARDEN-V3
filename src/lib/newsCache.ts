import type { NewsArticle } from "@/data/mockNews";
import { mergeWithGlobal195News, getGlobal195Articles } from "@/data/global195News";

interface CacheEntry {
  articles: NewsArticle[];
  timestamp: number;
  contentHash: string;
}

// Version 5 explicitly ensures all 195 sovereign nations are present in the cache
const CACHE_KEY = 'news_garden_cache_v5_195';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    // If the cache was stored with fewer than 195 countries, re-hydrate with full 195 dataset
    if (entry.articles && entry.articles.length < 195) {
      entry.articles = mergeWithGlobal195News(entry.articles);
    }
    return entry;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    // Always guarantee that cache stored in localStorage covers all 195 nations
    const fullArticles = mergeWithGlobal195News(entry.articles);
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...entry,
      articles: fullArticles,
    }));
  } catch { /* localStorage full or unavailable */ }
}

export function getCachedNews(category: string | null): NewsArticle[] | null {
  const entry = readCache();
  if (!entry) {
    // Return pre-warmed 195 sovereign country news if cache is empty
    return getGlobal195Articles();
  }

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_DURATION_MS) {
    localStorage.removeItem(CACHE_KEY);
    return getGlobal195Articles();
  }

  return entry.articles;
}

export function setCachedNews(category: string | null, articles: NewsArticle[], contentHash: string): void {
  const full = mergeWithGlobal195News(articles);
  writeCache({
    articles: full,
    timestamp: Date.now(),
    contentHash,
  });
}

export function getCacheEntry(category: string | null): CacheEntry | null {
  return readCache();
}

export function clearCache(category?: string | null): void {
  localStorage.removeItem(CACHE_KEY);
  // Also clean up any legacy v1-v4 cache keys
  try {
    localStorage.removeItem('news_garden_cache');
    localStorage.removeItem('news_garden_cache_v2');
    localStorage.removeItem('news_garden_cache_v3');
    localStorage.removeItem('news_garden_cache_v4');
  } catch {}
}

export function getCacheAge(category: string | null): number | null {
  const entry = readCache();
  if (!entry) return null;
  return Date.now() - entry.timestamp;
}

export const CACHE_DURATION = CACHE_DURATION_MS;
