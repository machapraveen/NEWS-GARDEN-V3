import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Globe from "@/components/Globe";
import NewsPanel from "@/components/NewsPanel";
import GlobeControls from "@/components/GlobeControls";
import { GlobeMarker, Category, getGlobeMarkers, NewsArticle } from "@/data/mockNews";
import { fetchAndAnalyzeNews, filterArticlesByCategory, generateContentHash } from "@/lib/api/news";
import { getCachedNews, setCachedNews, clearCache, getCacheEntry, CACHE_DURATION } from "@/lib/newsCache";
import { Link } from "react-router-dom";
import { BarChart3, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AUTO_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

const Index = () => {
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]); // Full dataset — fetched once
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [noNewUpdates, setNoNewUpdates] = useState(false);
  const [lastChangedAt, setLastChangedAt] = useState<Date | null>(null);
  const lastChangedAtRef = useRef<Date | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Filtered articles derived locally from allArticles — NO API call on category change
  const articles = useMemo(
    () => filterArticlesByCategory(allArticles, selectedCategory),
    [allArticles, selectedCategory]
  );

  // Fetch ALL news once (no category param). Called on mount and on refresh.
  const loadNews = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless forced)
    if (!forceRefresh) {
      const cached = getCachedNews(null); // Always use the "__all__" cache key
      if (cached && cached.length > 0) {
        setAllArticles(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setNoNewUpdates(false);
    try {
      const data = await fetchAndAnalyzeNews(null, 25); // Single API call, no category
      const newHash = generateContentHash(data);

      // Check if content actually changed
      const cacheEntry = getCacheEntry(null);
      if (cacheEntry && cacheEntry.contentHash === newHash && data.length > 0) {
        setAllArticles(cacheEntry.articles);
        setNoNewUpdates(true);
        setLastRefresh(new Date());
        toast({
          title: "Already up to date",
          description: `No new articles since ${lastChangedAtRef.current ? lastChangedAtRef.current.toLocaleTimeString() : 'last check'}. News updates every few hours.`,
        });
      } else {
        setAllArticles(data);
        setCachedNews(null, data, newHash);
        setLastRefresh(new Date());
        setLastChangedAt(new Date());
        lastChangedAtRef.current = new Date();
        setNoNewUpdates(false);
      }
    } catch (err) {
      console.error('Failed to load news:', err);
      const cached = getCachedNews(null);
      if (cached) {
        setAllArticles(cached);
        toast({
          title: "Using cached news",
          description: "Could not fetch new articles. Showing previously loaded news.",
        });
      } else {
        toast({
          title: "Error loading news",
          description: "Could not fetch real-time news. Please try refreshing.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load once on mount
  useEffect(() => {
    loadNews(false);
  }, [loadNews]);

  // Auto-refresh timer
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      console.log('Auto-refreshing news...');
      loadNews(true);
    }, AUTO_REFRESH_MS);

    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [loadNews]);

  const handleManualRefresh = useCallback(() => {
    clearCache(null);
    loadNews(true);
    toast({ title: "Refreshing news", description: "Fetching latest articles..." });
  }, [loadNews, toast]);

  const markers = getGlobeMarkers(articles);

  const handleMarkerClick = useCallback((marker: GlobeMarker) => {
    setSelectedMarker(marker);
  }, []);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    // First try to find in current articles
    const found = markers.find(m =>
      m.city.toLowerCase().includes(q) ||
      m.country.toLowerCase().includes(q) ||
      m.topArticle.headline.toLowerCase().includes(q)
    );
    if (found) {
      setSelectedMarker(found);
    } else {
      // Only make an API call for search queries that aren't in our data
      setLoading(true);
      fetchAndAnalyzeNews(query, 25)
        .then(data => {
          setAllArticles(prev => {
            const ids = new Set(prev.map(a => a.headline));
            const newArticles = data.filter(a => !ids.has(a.headline));
            return [...prev, ...newArticles];
          });
          const newMarkers = getGlobeMarkers(data);
          if (newMarkers.length > 0) {
            setSelectedMarker(newMarkers[0]);
          }
        })
        .catch(err => {
          console.error('Search error:', err);
          toast({ title: "Search failed", variant: "destructive" });
        })
        .finally(() => setLoading(false));
    }
  }, [markers, toast]);

  const getRefreshText = () => {
    if (noNewUpdates && lastChangedAt) {
      const mins = Math.floor((Date.now() - lastChangedAt.getTime()) / 60000);
      const hours = Math.floor(mins / 60);
      if (hours > 0) return `unchanged for ${hours}h ${mins % 60}m`;
      if (mins < 1) return 'just updated';
      return `unchanged for ${mins}m`;
    }
    if (!lastRefresh) return '';
    const mins = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    return `${mins} mins ago`;
  };

  // Count articles per category from ALL articles (not filtered)
  const categoryCounts = allArticles.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
        <h1 className="font-display text-lg font-bold tracking-wider text-primary text-glow">
          NEWS GARDEN
        </h1>
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading news...</span>
          </div>
        )}
      </div>

      {/* Dashboard link */}
      <div className="fixed bottom-4 left-4 z-50">
        <Link to="/dashboard" state={{ articles: allArticles }}>
          <Button variant="outline" size="sm" className="glass border-border/30">
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Live indicator + Refresh */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 glass border-border/30"
          onClick={handleManualRefresh}
          disabled={loading}
          title="Refresh news"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground glass px-3 py-1.5 rounded-full">
          {noNewUpdates ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span className="text-primary font-medium">UP TO DATE</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-sentiment-positive animate-pulse" />
              <span>LIVE</span>
            </>
          )}
          <span className="mx-0.5">&middot;</span>
          <span>{articles.length} articles{selectedCategory ? ` (${selectedCategory})` : ''}</span>
          <span className="mx-0.5">&middot;</span>
          <span>{Object.keys(categoryCounts).length} categories</span>
          {(lastRefresh || lastChangedAt) && (
            <span className="text-muted-foreground/60 ml-1">&middot; {getRefreshText()}</span>
          )}
        </div>
      </div>

      <GlobeControls
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showHeatmap={showHeatmap}
        onHeatmapToggle={() => setShowHeatmap(!showHeatmap)}
        onSearch={handleSearch}
      />

      <Globe
        onMarkerClick={handleMarkerClick}
        selectedCategory={selectedCategory}
        showHeatmap={showHeatmap}
        articles={articles}
      />

      <NewsPanel
        marker={selectedMarker}
        onClose={() => setSelectedMarker(null)}
        articles={articles}
      />
    </div>
  );
};

export default Index;
