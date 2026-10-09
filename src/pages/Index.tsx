import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Globe from "@/components/Globe";
import NewsPanel from "@/components/NewsPanel";
import GlobeControls from "@/components/GlobeControls";
import NewsVerifier from "@/components/NewsVerifier";
import CountryPulseCard from "@/components/CountryPulseCard";
import { GlobeMarker, Category, getGlobeMarkers, NewsArticle } from "@/data/mockNews";
import {
  fetchAndAnalyzeNews,
  filterArticlesByCategory,
  filterArticlesByRegion,
  fetchCountryNews,
  generateContentHash,
  fetchStateNews,
  type StateNewsItem,
} from "@/lib/api/news";
import {
  type CountryInfo,
  type GeopoliticalRegion,
  REGION_CENTERS,
  findCountry,
} from "@/data/countriesData";
import { getCachedNews, setCachedNews, clearCache, getCacheEntry } from "@/lib/newsCache";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Globe2,
  TrendingUp,
  Newspaper,
  Clock,
  MapPin,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AUTO_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

const Index = () => {
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<GeopoliticalRegion>("All");
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  const [countryLoading, setCountryLoading] = useState(false);
  const [focusLocation, setFocusLocation] = useState<{
    lat: number;
    lng: number;
    altitude?: number;
  } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]); // Full dataset
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [noNewUpdates, setNoNewUpdates] = useState(false);
  const [lastChangedAt, setLastChangedAt] = useState<Date | null>(null);
  const lastChangedAtRef = useRef<Date | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const [stateNews, setStateNews] = useState<StateNewsItem[]>([]);
  const { toast } = useToast();

  // ── Two-stage local filtering: First by geopolitical region, then by topic category ──
  const articlesByRegion = useMemo(
    () => filterArticlesByRegion(allArticles, selectedRegion),
    [allArticles, selectedRegion]
  );

  const articles = useMemo(
    () => filterArticlesByCategory(articlesByRegion, selectedCategory),
    [articlesByRegion, selectedCategory]
  );

  // ── Fetch Global News (Pre-warmed across 20+ Hubs) ──
  const loadNews = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh) {
        const cached = getCachedNews(null);
        if (cached && cached.length > 0) {
          setAllArticles(cached);
          setLoading(false);
        }
      }

      if (!getCachedNews(null)) setLoading(true);
      setNoNewUpdates(false);

      try {
        const data = await fetchAndAnalyzeNews(null, 100, forceRefresh);
        const newHash = generateContentHash(data);

        const cacheEntry = getCacheEntry(null);
        if (cacheEntry && cacheEntry.contentHash === newHash && data.length > 0) {
          setNoNewUpdates(true);
          setLastRefresh(new Date());
        } else if (data.length > 0) {
          setAllArticles(data);
          setCachedNews(null, data, newHash);
          setLastRefresh(new Date());
          setLastChangedAt(new Date());
          lastChangedAtRef.current = new Date();
          setNoNewUpdates(false);
        }
      } catch (err) {
        console.error("Failed to load news:", err);
        const cached = getCachedNews(null);
        if (cached && cached.length > 0) {
          setAllArticles(cached);
        } else {
          toast({
            title: "Error loading news",
            description: "Could not reach news service. Please try refreshing.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Load once on mount
  useEffect(() => {
    loadNews(false);
    fetchStateNews().then(setStateNews).catch(() => {});
  }, [loadNews]);

  // Auto-refresh timer
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      console.log("Auto-refreshing news...");
      loadNews(false);
    }, AUTO_REFRESH_MS);

    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [loadNews]);

  const handleManualRefresh = useCallback(() => {
    clearCache(null);
    loadNews(true);
    toast({ title: "Refreshing news", description: "Fetching latest global articles..." });
  }, [loadNews, toast]);

  // Markers computed from current filtered articles
  const markers = useMemo(() => getGlobeMarkers(articles), [articles]);

  const handleMarkerClick = useCallback(
    (marker: GlobeMarker) => {
      setSelectedMarker(marker);
      // Also update selected country if marker identifies a recognized country
      if (marker.country) {
        const matched = findCountry(marker.country);
        if (matched) setSelectedCountry(matched);
      }
    },
    []
  );

  // ── Handle Geopolitical Region Change ──
  const handleRegionChange = useCallback((region: GeopoliticalRegion) => {
    setSelectedRegion(region);
    const center = REGION_CENTERS[region];
    if (center) {
      setFocusLocation({ lat: center.lat, lng: center.lng, altitude: center.altitude });
    }
  }, []);

  // ── Handle Country Selection & On-Demand (JIT) Ingestion ──
  const handleSelectCountry = useCallback(
    async (country: CountryInfo) => {
      setSelectedCountry(country);
      setFocusLocation({ lat: country.lat, lng: country.lng, altitude: 1.7 });

      // Check if we already have articles for this country in memory
      const qName = country.name.toLowerCase();
      const qCode = country.code.toLowerCase();
      const existing = allArticles.filter(a => {
        const c = (a.location?.country || "").toLowerCase();
        return c === qName || c === qCode;
      });

      // If we have fewer than 2 articles, trigger JIT on-demand fetch using Enterprise API
      if (existing.length < 2) {
        setCountryLoading(true);
        try {
          const fresh = await fetchCountryNews(country.code, country.name, false);
          if (fresh.length > 0) {
            setAllArticles(prev => {
              const seenUrls = new Set(prev.map(a => a.sourceUrl));
              const newUnique = fresh.filter(a => a.sourceUrl && !seenUrls.has(a.sourceUrl));
              return [...prev, ...newUnique];
            });
            toast({
              title: `${country.flag} ${country.name} Loaded`,
              description: `Indexed ${fresh.length} fresh stories for ${country.name}.`,
            });
          }
        } catch (err) {
          console.error("Country fetch error:", err);
        } finally {
          setCountryLoading(false);
        }
      }
    },
    [allArticles, toast]
  );

  // ── Handle General Keyword Search ──
  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      const q = query.toLowerCase();

      // Check if the query matches a country name first
      const countryMatch = findCountry(query);
      if (countryMatch) {
        handleSelectCountry(countryMatch);
        return;
      }

      // Check existing markers
      const found = markers.find(
        m =>
          m.city.toLowerCase().includes(q) ||
          m.country.toLowerCase().includes(q) ||
          m.topArticle.headline.toLowerCase().includes(q)
      );
      if (found) {
        setSelectedMarker(found);
        setFocusLocation({ lat: found.lat, lng: found.lng, altitude: 1.6 });
      } else {
        // Query edge function
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
              setFocusLocation({
                lat: newMarkers[0].lat,
                lng: newMarkers[0].lng,
                altitude: 1.6,
              });
            }
          })
          .catch(err => {
            console.error("Search error:", err);
            toast({ title: "Search failed", variant: "destructive" });
          })
          .finally(() => setLoading(false));
      }
    },
    [markers, handleSelectCountry, toast]
  );

  const getRefreshText = () => {
    if (noNewUpdates && lastChangedAt) {
      const mins = Math.floor((Date.now() - lastChangedAt.getTime()) / 60000);
      const hours = Math.floor(mins / 60);
      if (hours > 0) return `unchanged for ${hours}h ${mins % 60}m`;
      if (mins < 1) return "just updated";
      return `unchanged for ${mins}m`;
    }
    if (!lastRefresh) return "";
    const mins = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins === 1) return "1 min ago";
    return `${mins} mins ago`;
  };

  const categoryCounts = useMemo(() => {
    return allArticles.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allArticles]);

  // Top stories sorted by recency & credibility
  const topStories = useMemo(() => {
    if (articles.length === 0) return [];
    return [...articles]
      .map(a => {
        const ageHours = (Date.now() - new Date(a.timestamp).getTime()) / 3600000;
        const recency = Math.exp(-ageHours / 6);
        const credibility = (a.credibilityScore || 50) / 100;
        const sentimentStrength = Math.abs((a.sentimentScore || 0.5) - 0.5) * 2;
        const score = recency * 0.5 + credibility * 0.3 + sentimentStrength * 0.2;
        return { ...a, trendingScore: score };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 6);
  }, [articles]);

  return (
    <div className="relative w-full min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
        <h1 className="font-display text-lg font-bold tracking-wider text-primary text-glow">
          NEWS GARDEN
        </h1>
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground glass px-2.5 py-1 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            <span>Syncing global news...</span>
          </div>
        )}
      </div>

      {/* Navigation links */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
        <Link to="/dashboard">
          <Button variant="outline" size="sm" className="glass border-border/30">
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
        </Link>
        <Link to="/channels">
          <Button variant="outline" size="sm" className="glass border-border/30">
            <Globe2 className="w-4 h-4 mr-1.5" />
            Channels
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
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground glass px-3 py-1.5 rounded-full border border-white/[0.08]">
          {noNewUpdates ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span className="text-primary font-medium">UP TO DATE</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>LIVE</span>
            </>
          )}
          <span className="mx-0.5">&middot;</span>
          <span>
            {articles.length} articles
            {selectedRegion !== "All" ? ` (${selectedRegion})` : ""}
            {selectedCategory ? ` · ${selectedCategory}` : ""}
          </span>
          {(lastRefresh || lastChangedAt) && (
            <span className="text-muted-foreground/60 ml-1">&middot; {getRefreshText()}</span>
          )}
        </div>
      </div>

      {/* Globe Section — full viewport */}
      <div className="relative w-full h-screen overflow-hidden">
        <GlobeControls
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedRegion={selectedRegion}
          onRegionChange={handleRegionChange}
          showHeatmap={showHeatmap}
          onHeatmapToggle={() => setShowHeatmap(!showHeatmap)}
          onSearch={handleSearch}
          onSelectCountry={handleSelectCountry}
          selectedCountry={selectedCountry}
        />

        <Globe
          onMarkerClick={handleMarkerClick}
          selectedCategory={selectedCategory}
          showHeatmap={showHeatmap}
          articles={articles}
          focusLocation={focusLocation}
        />

        {/* Selected Country Executive Intelligence Card */}
        {selectedCountry && (
          <CountryPulseCard
            country={selectedCountry}
            articles={allArticles}
            loading={countryLoading}
            onClose={() => setSelectedCountry(null)}
            onExploreArticles={() => {
              const match = markers.find(
                m =>
                  m.country.toLowerCase() === selectedCountry.name.toLowerCase() ||
                  Math.abs(m.lat - selectedCountry.lat) < 5
              );
              if (match) setSelectedMarker(match);
            }}
          />
        )}

        {/* Scroll hint */}
        {!selectedMarker && !selectedCountry && articles.length > 0 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 animate-bounce pointer-events-none">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
              Scroll down for dispatches
            </span>
            <svg
              className="w-4 h-4 text-muted-foreground/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        )}
      </div>

      {/* Below-the-fold content sections */}
      {articles.length > 0 && (
        <div className="relative z-10 bg-background">
          {/* Trending Stories */}
          <section className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-display text-base font-bold tracking-wider text-primary">
                TRENDING NOW
              </h2>
              <span className="text-xs text-muted-foreground ml-2">
                Top stories ranked by recency, credibility & sentiment resonance
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topStories.map((article, i) => (
                <Link
                  key={article.id}
                  to={`/article/${encodeURIComponent(article.id)}`}
                  state={{ article }}
                  className="group block rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {i === 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded animate-pulse">
                        #1 Trending
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        article.credibilityScore > 75
                          ? "bg-emerald-500/15 text-emerald-400"
                          : article.credibilityScore > 45
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {article.credibilityScore}% credible
                    </span>
                    <span
                      className={`text-[10px] font-medium ml-auto px-1.5 py-0.2 rounded ${
                        article.sentiment === "positive"
                          ? "text-[#10b981]"
                          : article.sentiment === "negative"
                          ? "text-[#f43f5e]"
                          : "text-[#f59e0b]"
                      }`}
                    >
                      {article.sentiment}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {article.headline}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Newspaper className="w-2.5 h-2.5" />
                      {article.source}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      {article.location.city || article.location.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(article.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Indian State News - Daily Top Stories */}
          {stateNews.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 py-12 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-[#FF6B35]" />
                <h2 className="font-display text-base font-bold tracking-wider text-[#FF6B35]">
                  INDIA — STATE NEWS
                </h2>
                <span className="text-xs text-muted-foreground ml-2">
                  Daily top stories from across Indian states
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stateNews.slice(0, 12).map(news => (
                  <a
                    key={news.state}
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-[#FF6B35]/20 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FF6B35]/15 text-[#FF6B35] px-2 py-0.5 rounded">
                        {news.state}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{news.source}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-[#FF6B35] transition-colors leading-snug line-clamp-2">
                      {news.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      {news.description}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(news.publishedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity">
                        Read <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
              {stateNews.length > 12 && (
                <div className="mt-4 text-center">
                  <Link to="/channels">
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass border-[#FF6B35]/30 text-[#FF6B35] hover:bg-[#FF6B35]/10"
                    >
                      View all {stateNews.length} states on India Map
                    </Button>
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* News Verification Tool */}
          <section className="max-w-6xl mx-auto px-4 py-12 border-t border-white/[0.06]">
            <div className="flex flex-col items-center text-center mb-6">
              <Shield className="w-6 h-6 text-primary mb-2" />
              <h2 className="font-display text-base font-bold tracking-wider text-primary">
                VERIFY NEWS
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Paste any news headline or article text to check if it's real or fake using our AI
                ensemble (RoBERTa + Gemini)
              </p>
            </div>
            <div className="flex justify-center">
              <NewsVerifier />
            </div>
          </section>

          {/* Quick Stats */}
          <section className="max-w-6xl mx-auto px-4 py-12 border-t border-white/[0.06]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                <div className="text-2xl font-bold font-display text-primary">
                  {articles.length}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Active Articles
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                <div className="text-2xl font-bold font-display text-primary">
                  {new Set(articles.map(a => a.location.country)).size}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Countries Covered
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                <div className="text-2xl font-bold font-display text-primary">
                  {Object.keys(categoryCounts).length}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Topics Tracked
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                <div className="text-2xl font-bold font-display text-emerald-400">
                  {Math.round(
                    articles.reduce((s, a) => s + a.credibilityScore, 0) /
                      (articles.length || 1)
                  )}
                  %
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Avg Credibility
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <NewsPanel
        marker={selectedMarker}
        onClose={() => setSelectedMarker(null)}
        articles={articles}
      />
    </div>
  );
};

export default Index;
