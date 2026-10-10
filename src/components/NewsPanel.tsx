import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Search,
  Sparkles,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Clock,
  Globe2,
  TrendingUp,
  BarChart3,
  Layers,
  Radio,
  SlidersHorizontal,
  Compass,
  Building2,
  Share2,
  ArrowUpRight,
} from "lucide-react";
import { GlobeMarker, NewsArticle, Category } from "@/data/mockNews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { findCountry } from "@/data/countriesData";

interface NewsPanelProps {
  marker: GlobeMarker | null;
  onClose: () => void;
  articles: NewsArticle[];
}

// ── Curated Luminescent Sentiment Palette ──
const SENTIMENT_COLORS = {
  positive: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/35",
    cardHover: "hover:border-emerald-500/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)]",
    dot: "bg-emerald-400",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  neutral: {
    text: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/35",
    cardHover: "hover:border-amber-500/50 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]",
    dot: "bg-amber-400",
    glow: "rgba(245, 158, 11, 0.4)",
  },
  negative: {
    text: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/35",
    cardHover: "hover:border-rose-500/50 hover:shadow-[0_8px_30px_rgba(244,63,94,0.12)]",
    dot: "bg-rose-400",
    glow: "rgba(244, 63, 94, 0.4)",
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  Politics: "🏛️",
  Technology: "⚡",
  Business: "📈",
  Science: "🔬",
  Environment: "🌱",
  Sports: "⚽",
  Entertainment: "🎬",
  Health: "🩺",
};

function CredibilityBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  if (score >= 75) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 ${
          compact ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"
        }`}
      >
        <ShieldCheck className={compact ? "w-3 h-3 text-emerald-400" : "w-3.5 h-3.5 text-emerald-400"} />
        <span>{score}% Verified</span>
      </span>
    );
  }
  if (score >= 45) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/35 ${
          compact ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"
        }`}
      >
        <ShieldAlert className={compact ? "w-3 h-3 text-amber-400" : "w-3.5 h-3.5 text-amber-400"} />
        <span>{score}% Scrutiny</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/35 ${
        compact ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"
      }`}
    >
      <ShieldQuestion className={compact ? "w-3 h-3 text-rose-400" : "w-3.5 h-3.5 text-rose-400"} />
      <span>{score}% Unverified</span>
    </span>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ArticleCard({
  article,
  badgeContext,
}: {
  article: NewsArticle;
  badgeContext?: string;
}) {
  if (!article) return null;
  const sentConfig = (article.sentiment && SENTIMENT_COLORS[article.sentiment]) || SENTIMENT_COLORS.neutral;
  const timeAgo = article.timestamp ? getTimeAgo(article.timestamp) : "Recently";
  const catIcon = (article.category && CATEGORY_ICONS[article.category]) || "📰";

  return (
    <div
      className={`group relative rounded-xl p-3.5 bg-slate-900/70 border border-white/10 ${sentConfig.cardHover} transition-all duration-200 backdrop-blur-md`}
    >
      {/* Category & Sentiment Badges */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-white/[0.08] text-slate-200 border-white/10 text-[10px] font-medium px-2 py-0.5 hover:bg-white/[0.12]">
            {catIcon} {article.category}
          </Badge>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sentConfig.bg} ${sentConfig.text} border ${sentConfig.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sentConfig.dot}`} />
            <span className="capitalize">{article.sentiment}</span>
          </span>
          {badgeContext && (
            <span className="text-[10px] font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              {badgeContext}
            </span>
          )}
        </div>

        <CredibilityBadge score={article.credibilityScore} compact />
      </div>

      {/* Headline */}
      <Link
        to={`/article/${encodeURIComponent(article.id)}`}
        state={{ article }}
        className="block"
      >
        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-primary transition-colors leading-snug line-clamp-2">
          {article.headline}
        </h4>
      </Link>

      {/* Summary */}
      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
        {article.summary}
      </p>

      {/* Card Footer */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/[0.08] text-[11px] text-slate-400">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-slate-300 truncate max-w-[130px]">
            {article.source}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 shrink-0 text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            {timeAgo}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to={`/article/${encodeURIComponent(article.id)}`}
            state={{ article }}
            className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
          >
            Deep Dive
            <ArrowUpRight className="w-3 h-3" />
          </Link>
          {article.sourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Open original source"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewsPanel({ marker, onClose, articles }: NewsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "credibility" | "sentiment">("recent");
  const [activeTab, setActiveTab] = useState<"hub" | "regional" | "pulse">("hub");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 1. Identify sovereign country metadata — must be before any conditional return
  const countryInfo = useMemo(() => {
    if (!marker) return null;
    if (marker.country) {
      const found = findCountry(marker.country);
      if (found) return found;
    }
    if (marker.city) {
      const found = findCountry(marker.city);
      if (found) return found;
    }
    return null;
  }, [marker]);

  // 2. Compute Direct Hub Dispatches (Strictly matching this city & sovereign nation)
  const hubArticles = useMemo(() => {
    if (!marker) return [];
    const mCountry = (marker.country || "").toLowerCase().trim();
    const mCity = (marker.city || "").toLowerCase().trim();
    const mState = (marker.state || "").toLowerCase().trim();
    const cName = (countryInfo?.name || "").toLowerCase().trim();
    const cCode = (countryInfo?.code || "").toLowerCase().trim();

    const matched = articles.filter((a) => {
      const aCountry = (a.location?.country || "").toLowerCase().trim();
      const aCity = (a.location?.city || "").toLowerCase().trim();
      const aState = (a.location?.state || "").toLowerCase().trim();
      const aHeadline = (a.headline || "").toLowerCase();

      const matchCountry =
        (mCountry && aCountry === mCountry) ||
        (cName && aCountry === cName) ||
        (cCode && aCountry === cCode) ||
        (mCountry && aHeadline.includes(mCountry)) ||
        (cName && aHeadline.includes(cName));

      const matchCity =
        (mCity && aCity === mCity) ||
        (mCity && aHeadline.includes(mCity));

      const matchState = mState && aState === mState;

      return matchCountry || matchCity || matchState;
    });

    // Merge any distinct articles from the marker's own clustered list
    const combined = [...matched];
    if (marker.articles && marker.articles.length > 0) {
      const seenIds = new Set(combined.map((a) => a.id));
      marker.articles.forEach((a) => {
        if (!seenIds.has(a.id)) combined.push(a);
      });
    }

    return combined;
  }, [marker, articles, countryInfo]);

  // 3. Compute Regional Concourse Dispatches (Neighboring nations in same region, EXCLUDING current country)
  const regionalArticles = useMemo(() => {
    if (!marker) return [];
    const targetRegion = (
      countryInfo?.region ||
      marker.topArticle?.location?.continent ||
      ""
    ).toLowerCase().trim();

    const currentCountry = (marker.country || countryInfo?.name || "").toLowerCase().trim();

    if (!targetRegion) return [];

    return articles.filter((a) => {
      const aCountry = (a.location?.country || "").toLowerCase().trim();
      const aContinent = (a.location?.continent || "").toLowerCase().trim();

      // Explicitly exclude stories belonging to this sovereign country
      if (aCountry === currentCountry) return false;

      // Match region or continent
      return (
        (aContinent && aContinent === targetRegion) ||
        (countryInfo && countryInfo.region.toLowerCase().includes(aContinent)) ||
        targetRegion.includes(aContinent)
      );
    });
  }, [marker, countryInfo, articles]);

  // 4. Compute Executive Sentiment Analytics for the Hub
  const hubStats = useMemo(() => {
    if (hubArticles.length === 0) {
      return { total: 0, pos: 0, neu: 0, neg: 0, posPct: 0, neuPct: 0, negPct: 0, avgCred: 0, dominant: "neutral" };
    }
    let pos = 0;
    let neu = 0;
    let neg = 0;
    let totalCred = 0;

    hubArticles.forEach((a) => {
      totalCred += a.credibilityScore || 70;
      if (a.sentiment === "positive") pos++;
      else if (a.sentiment === "negative") neg++;
      else neu++;
    });

    const total = hubArticles.length;
    const posPct = Math.round((pos / total) * 100);
    const neuPct = Math.round((neu / total) * 100);
    const negPct = Math.round((neg / total) * 100);
    const avgCred = Math.round(totalCred / total);
    const dominant = pos >= neu && pos >= neg ? "positive" : neg >= neu ? "negative" : "neutral";

    return { total, pos, neu, neg, posPct, neuPct, negPct, avgCred, dominant };
  }, [hubArticles]);

  // 5. Unique categories present in this hub
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    hubArticles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [hubArticles]);

  // 6. Filter & Sort Hub Articles
  const filteredHubArticles = useMemo(() => {
    let list = [...hubArticles];

    // Category filter
    if (selectedCat !== "all") {
      list = list.filter((a) => a.category.toLowerCase() === selectedCat.toLowerCase());
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.headline.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          (a.location.city && a.location.city.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "credibility") {
        return (b.credibilityScore || 50) - (a.credibilityScore || 50);
      }
      if (sortBy === "sentiment") {
        return (b.sentimentScore || 0.5) - (a.sentimentScore || 0.5);
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return list;
  }, [hubArticles, selectedCat, searchQuery, sortBy]);

  // Top Entities & Syndication Sources for Pulse Tab
  const topSources = useMemo(() => {
    const counts = new Map<string, number>();
    hubArticles.forEach((a) => {
      counts.set(a.source, (counts.get(a.source) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [hubArticles]);

  // All hooks must run above — conditional early return goes here
  if (!marker) return null;

  const flag = countryInfo?.flag || "🌐";
  const capital = countryInfo?.capital || marker.city || "Metropolitan Hub";
  const hubTitle = marker.city || marker.country || "Global News Hub";
  const countryTitle = countryInfo?.name || marker.country;
  const regionName = countryInfo?.region || marker.topArticle?.location?.continent || "International";

  return (
    <aside
      className="fixed right-0 top-0 h-full w-full sm:w-[480px] z-50 flex flex-col bg-slate-950/90 border-l border-white/10 shadow-[-24px_0_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in slide-in-from-right duration-300 select-none text-slate-100"
      aria-label="Intelligence Console"
    >
      {/* ── Console Header ── */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-900/60 relative">
        {/* Subtle ambient accent glow based on dominant sentiment */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{
            background:
              hubStats.dominant === "positive"
                ? "#10b981"
                : hubStats.dominant === "negative"
                ? "#f43f5e"
                : "#f59e0b",
          }}
        />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-3xl select-none shrink-0 mt-0.5">{flag}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base sm:text-lg font-bold text-white tracking-wide truncate">
                  {hubTitle}
                </h2>
                {marker.city && countryTitle && marker.city !== countryTitle && (
                  <span className="text-xs font-medium text-slate-400">
                    ({countryTitle})
                  </span>
                )}
              </div>

              {/* Geo Telemetry Chips */}
              <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  {(marker?.lat ?? 0).toFixed(2)}°, {(marker?.lng ?? 0).toFixed(2)}°
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10">
                  {regionName}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Hub
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.1] shrink-0 border border-white/10 transition-colors"
            title="Close Console (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* ── Sentiment Resonance Pulse Bar ── */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.08] relative z-10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>Sentiment Resonance</span>
            </div>
            <span className="font-mono text-[11px] text-cyan-300 font-semibold">
              {hubStats.total} Dispatches • {hubStats.avgCred}% Avg Credibility
            </span>
          </div>

          {/* Tri-Color Multi-segment Glowing Bar */}
          <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${hubStats.posPct}%` }}
              className="bg-emerald-400 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              title={`Positive: ${hubStats.posPct}% (${hubStats.pos})`}
            />
            <div
              style={{ width: `${hubStats.neuPct}%` }}
              className="bg-amber-400 transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              title={`Neutral: ${hubStats.neuPct}% (${hubStats.neu})`}
            />
            <div
              style={{ width: `${hubStats.negPct}%` }}
              className="bg-rose-500 transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              title={`Critical: ${hubStats.negPct}% (${hubStats.neg})`}
            />
          </div>

          {/* Ratio Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {hubStats.posPct}% Optimistic ({hubStats.pos})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {hubStats.neuPct}% Balanced ({hubStats.neu})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {hubStats.negPct}% Critical ({hubStats.neg})
            </span>
          </div>
        </div>
      </div>

      {/* ── Console Tabs ── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-white/[0.08] bg-slate-900/30">
          <TabsList className="grid grid-cols-3 w-full bg-slate-900/80 border border-white/10 p-1 rounded-xl">
            <TabsTrigger
              value="hub"
              className="text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-slate-950 rounded-lg transition-all"
            >
              📰 Hub ({hubArticles.length})
            </TabsTrigger>
            <TabsTrigger
              value="regional"
              className="text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-slate-950 rounded-lg transition-all"
            >
              🌐 Regional ({regionalArticles.length})
            </TabsTrigger>
            <TabsTrigger
              value="pulse"
              className="text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-slate-950 rounded-lg transition-all"
            >
              ⚡ Radar Pulse
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── TAB 1: Hub Dispatches ── */}
        <TabsContent value="hub" className="flex-1 flex flex-col min-h-0 m-0 p-0">
          {/* In-Panel Filter Toolbar */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-white/[0.08] bg-slate-900/40 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={`Search dispatches in ${hubTitle}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs bg-slate-950/60 border-white/10 rounded-lg focus-visible:ring-primary text-slate-200 placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => setSelectedCat("all")}
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-colors shrink-0 ${
                  selectedCat === "all"
                    ? "bg-primary text-slate-950 font-bold"
                    : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] hover:text-slate-200"
                }`}
              >
                All Topics ({hubArticles.length})
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-colors shrink-0 ${
                    selectedCat.toLowerCase() === cat.toLowerCase()
                      ? "bg-primary text-slate-950 font-bold"
                      : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] hover:text-slate-200"
                  }`}
                >
                  {CATEGORY_ICONS[cat] || "•"} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Feed */}
          <ScrollArea className="flex-1 p-4 sm:p-5">
            {filteredHubArticles.length > 0 ? (
              <div className="space-y-3 pb-6">
                {filteredHubArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  No matching dispatches
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                  No stories found matching your filter criteria. Reset the search query or category filter.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCat("all");
                  }}
                  className="text-xs h-7 border-white/15"
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* ── TAB 2: Regional Concourse ── */}
        <TabsContent value="regional" className="flex-1 flex flex-col min-h-0 m-0 p-0">
          <div className="px-4 sm:px-5 py-2.5 border-b border-white/[0.08] bg-slate-900/40 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Neighboring Cross-Border Dispatches ({regionName})
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              {regionalArticles.length} Stories
            </span>
          </div>

          <ScrollArea className="flex-1 p-4 sm:p-5">
            {regionalArticles.length > 0 ? (
              <div className="space-y-3 pb-6">
                {regionalArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    badgeContext={article.location?.country || "Regional"}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 text-slate-400 text-xs">
                No external regional stories indexed for {regionName}.
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* ── TAB 3: Radar Pulse & Topic Telemetry ── */}
        <TabsContent value="pulse" className="flex-1 flex flex-col min-h-0 m-0 p-0">
          <ScrollArea className="flex-1 p-4 sm:p-5 space-y-4">
            {/* Geopolitical Summary Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
                <Compass className="w-4 h-4 text-primary" />
                <span>Geopolitical Hub Telemetry</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    National Capital
                  </span>
                  <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                    {capital}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Geopolitical Basin
                  </span>
                  <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                    {regionName}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Monitored Dispatches
                  </span>
                  <span className="font-semibold text-cyan-400 mt-0.5 block">
                    {hubStats.total} stories
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Network Trust Score
                  </span>
                  <span className="font-semibold text-emerald-400 mt-0.5 block">
                    {hubStats.avgCred}% Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Contributing Syndication Sources */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-3">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Top Syndication Outlets</span>
              </div>
              <div className="space-y-2">
                {topSources.map(([source, count]) => (
                  <div
                    key={source}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs"
                  >
                    <span className="font-medium text-slate-300">{source}</span>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                      {count} {count === 1 ? "dispatch" : "dispatches"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Sentiment Analysis Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>AI Sentinel Assessment</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Coverage for {hubTitle} reflects a predominantly{" "}
                <strong className="text-slate-200 capitalize font-semibold">
                  {hubStats.dominant}
                </strong>{" "}
                narrative ({hubStats.posPct}% optimistic vs {hubStats.negPct}% critical).
                Media dispatches cross-verified with institutional source rating of{" "}
                <span className="text-emerald-400 font-semibold">{hubStats.avgCred}%</span>.
              </p>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* ── Console Footer ── */}
      <div className="p-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-[11px]">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          News Garden Global Mesh
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="text-xs h-7 border-white/15 hover:bg-white/[0.08]"
        >
          Dismiss Console
        </Button>
      </div>
    </aside>
  );
}
