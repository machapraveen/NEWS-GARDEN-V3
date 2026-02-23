import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, FileText, Globe2, Shield, Radio,
  Loader2, AlertCircle,
} from "lucide-react";
import { NewsArticle, NamedEntity, categories } from "@/data/mockNews";
import { fetchAndAnalyzeNews } from "@/lib/api/news";
import { getCachedNews } from "@/lib/newsCache";
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Constants ───────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: "hsl(220,20%,10%)",
  border: "1px solid hsl(220,15%,18%)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: 12,
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#eab308",
};

const CATEGORY_COLORS: Record<string, string> = {
  Politics: "#3b82f6",
  Technology: "#06b6d4",
  Sports: "#f97316",
  Health: "#ec4899",
  Science: "#a855f7",
  Business: "#14b8a6",
  Entertainment: "#f59e0b",
  Environment: "#22c55e",
};

const CREDIBILITY_BUCKETS = [
  { range: "0–20", min: 0, max: 20, color: "#ef4444" },
  { range: "21–40", min: 21, max: 40, color: "#f97316" },
  { range: "41–60", min: 41, max: 60, color: "#eab308" },
  { range: "61–80", min: 61, max: 80, color: "#84cc16" },
  { range: "81–100", min: 81, max: 100, color: "#22c55e" },
];

const CONTINENT_EMOJI: Record<string, string> = {
  Asia: "AS",
  Europe: "EU",
  "North America": "NA",
  "South America": "SA",
  Africa: "AF",
  Oceania: "OC",
  Antarctica: "AN",
};

// ─── Skeleton component ─────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/50 ${className}`} />;
}

// ─── Section header ─────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-xs uppercase tracking-widest text-primary mb-4">
      {children}
    </h3>
  );
}

// ─── Main component ─────────────────────────────────────────
export default function Dashboard() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [entityTab, setEntityTab] = useState<"all" | "person" | "organization" | "place">("all");

  // ── Data loading (same pattern as Index.tsx) ──
  const loadNews = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCachedNews(null);
      if (cached && cached.length > 0) {
        setArticles(cached);
        setLoading(false);
      }
    }

    try {
      const data = await fetchAndAnalyzeNews(null, 100, force);
      if (data.length > 0) {
        setArticles(data);
        setError(false);
      }
    } catch {
      if (articles.length === 0) setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNews(false); }, [loadNews]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNews(true);
  };

  // ── Derived data ──────────────────────────────────────────
  const stats = useMemo(() => {
    const countries = new Set(articles.map(a => a.location.country)).size;
    const sources = new Set(articles.map(a => a.source)).size;
    const avgCred = articles.length
      ? Math.round(articles.reduce((s, a) => s + a.credibilityScore, 0) / articles.length)
      : 0;
    return { total: articles.length, countries, sources, avgCred };
  }, [articles]);

  const sentimentData = useMemo(() => {
    const counts = { positive: 0, negative: 0, neutral: 0 };
    articles.forEach(a => { counts[a.sentiment]++; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: SENTIMENT_COLORS[name],
    }));
  }, [articles]);

  const dominantSentiment = useMemo(() => {
    const sorted = [...sentimentData].sort((a, b) => b.value - a.value);
    if (!sorted[0] || !articles.length) return { label: "N/A", pct: 0 };
    return { label: sorted[0].name, pct: Math.round((sorted[0].value / articles.length) * 100) };
  }, [sentimentData, articles.length]);

  const categoryData = useMemo(() =>
    categories
      .map(cat => ({ name: cat, count: articles.filter(a => a.category === cat).length, color: CATEGORY_COLORS[cat] }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count),
  [articles]);

  const credibilityData = useMemo(() =>
    CREDIBILITY_BUCKETS.map(b => ({
      range: b.range,
      count: articles.filter(a => a.credibilityScore >= b.min && a.credibilityScore <= b.max).length,
      color: b.color,
    })),
  [articles]);

  const timelineData = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach(a => {
      const day = new Date(a.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        const da = new Date(a.date + " 2025");
        const db = new Date(b.date + " 2025");
        return da.getTime() - db.getTime();
      });
  }, [articles]);

  const geographicData = useMemo(() => {
    const map = new Map<string, { count: number; continent: string }>();
    articles.forEach(a => {
      const entry = map.get(a.location.country) || { count: 0, continent: a.location.continent };
      entry.count++;
      map.set(a.location.country, entry);
    });
    return Array.from(map.entries())
      .map(([country, { count, continent }]) => ({ country, count, continent }))
      .sort((a, b) => b.count - a.count);
  }, [articles]);

  const topSources = useMemo(() => {
    const map = new Map<string, { count: number; credSum: number; sentiments: Record<string, number> }>();
    articles.forEach(a => {
      const entry = map.get(a.source) || { count: 0, credSum: 0, sentiments: { positive: 0, negative: 0, neutral: 0 } };
      entry.count++;
      entry.credSum += a.credibilityScore;
      entry.sentiments[a.sentiment]++;
      map.set(a.source, entry);
    });
    return Array.from(map.entries())
      .map(([source, d]) => ({ source, count: d.count, avgCred: Math.round(d.credSum / d.count), sentiments: d.sentiments }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [articles]);

  const entityData = useMemo(() => {
    const map = new Map<string, { count: number; type: NamedEntity["type"] }>();
    articles.forEach(a =>
      a.entities?.forEach(e => {
        const existing = map.get(e.text);
        if (existing) existing.count++;
        else map.set(e.text, { count: 1, type: e.type });
      })
    );
    return Array.from(map.entries())
      .map(([text, { count, type }]) => ({ text, count, type }))
      .sort((a, b) => b.count - a.count);
  }, [articles]);

  const filteredEntities = useMemo(() =>
    entityTab === "all" ? entityData : entityData.filter(e => e.type === entityTab),
  [entityData, entityTab]);

  const maxGeo = geographicData[0]?.count || 1;

  // ── Loading skeleton ──────────────────────────────────────
  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-72" />
            <Skeleton className="h-72 lg:col-span-2" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error && articles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="font-display text-xl text-foreground">Failed to load articles</h2>
          <p className="text-sm text-muted-foreground">Could not fetch news data. Check your connection.</p>
          <button
            onClick={() => { setError(false); setLoading(true); loadNews(true); }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* ───── HEADER ───── */}
        <header>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Globe
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wider text-primary text-glow">
                NEWS INTELLIGENCE
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time analytics across {stats.total} articles from {stats.sources} sources
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass border-border/30 text-sm text-foreground hover:text-primary transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>

        {/* ───── STATS BAR ───── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: "Total Articles", value: stats.total, accent: "text-primary" },
            { icon: Globe2, label: "Countries", value: stats.countries, accent: "text-accent" },
            { icon: Shield, label: "Avg Credibility", value: `${stats.avgCred}%`, accent: stats.avgCred >= 70 ? "text-sentiment-positive" : stats.avgCred >= 45 ? "text-sentiment-neutral" : "text-sentiment-negative" },
            { icon: Radio, label: "Sources", value: stats.sources, accent: "text-primary" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-card border border-border/50 p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.accent}`} />
              <p className={`text-3xl font-display font-bold ${s.accent}`}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ───── ROW 1: Sentiment Donut + Category Bars ───── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sentiment Donut */}
          <div className="rounded-xl bg-card border border-border/50 p-5">
            <SectionHeader>Sentiment Overview</SectionHeader>
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    stroke="none"
                  >
                    {sentimentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-foreground">{dominantSentiment.pct}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{dominantSentiment.label}</p>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2">
              {sentimentData.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="rounded-xl bg-card border border-border/50 p-5 lg:col-span-2">
            <SectionHeader>Category Distribution</SectionHeader>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ───── ROW 2: Credibility + Timeline ───── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Credibility Distribution */}
          <div className="rounded-xl bg-card border border-border/50 p-5">
            <SectionHeader>Credibility Distribution</SectionHeader>
            <div className="text-center mb-3">
              <span className={`text-4xl font-display font-bold ${
                stats.avgCred >= 70 ? "text-sentiment-positive" : stats.avgCred >= 45 ? "text-sentiment-neutral" : "text-sentiment-negative"
              }`}>
                {stats.avgCred}
              </span>
              <span className="text-sm text-muted-foreground ml-1">avg score</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={credibilityData}>
                <XAxis dataKey="range" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {credibilityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Publication Timeline */}
          <div className="rounded-xl bg-card border border-border/50 p-5">
            <SectionHeader>Publication Timeline</SectionHeader>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="count" stroke="#2dd4bf" strokeWidth={2} fill="url(#timelineGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ───── ROW 3: Geographic Coverage ───── */}
        <div className="rounded-xl bg-card border border-border/50 p-5">
          <SectionHeader>Geographic Coverage</SectionHeader>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2">
            {geographicData.map(g => (
              <div key={g.country} className="flex items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded w-8 text-center shrink-0">
                  {CONTINENT_EMOJI[g.continent] || "??"}
                </span>
                <span className="text-sm text-foreground w-28 shrink-0 truncate">{g.country}</span>
                <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(g.count / maxGeo) * 100}%`,
                      background: "linear-gradient(90deg, hsl(174 72% 46%), hsl(210 80% 55%))",
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{g.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ───── ROW 4: Top Sources + Trending Entities ───── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Sources */}
          <div className="rounded-xl bg-card border border-border/50 p-5">
            <SectionHeader>Top Sources</SectionHeader>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {topSources.map((s, i) => {
                const total = s.sentiments.positive + s.sentiments.negative + s.sentiments.neutral;
                return (
                  <div key={s.source} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground truncate">{s.source}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{s.count} articles</span>
                      </div>
                      {/* Mini sentiment bar */}
                      <div className="flex h-1.5 rounded-full overflow-hidden mt-1 bg-muted/30">
                        {s.sentiments.positive > 0 && (
                          <div className="h-full" style={{ width: `${(s.sentiments.positive / total) * 100}%`, backgroundColor: "#22c55e" }} />
                        )}
                        {s.sentiments.neutral > 0 && (
                          <div className="h-full" style={{ width: `${(s.sentiments.neutral / total) * 100}%`, backgroundColor: "#eab308" }} />
                        )}
                        {s.sentiments.negative > 0 && (
                          <div className="h-full" style={{ width: `${(s.sentiments.negative / total) * 100}%`, backgroundColor: "#ef4444" }} />
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      s.avgCred >= 75 ? "bg-emerald-500/15 text-emerald-400" :
                      s.avgCred >= 45 ? "bg-amber-500/15 text-amber-400" :
                      "bg-red-500/15 text-red-400"
                    }`}>
                      {s.avgCred}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending Entities */}
          <div className="rounded-xl bg-card border border-border/50 p-5">
            <SectionHeader>Trending Entities</SectionHeader>
            {/* Tabs */}
            <div className="flex gap-1 mb-4">
              {(["all", "person", "organization", "place"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setEntityTab(tab)}
                  className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider transition ${
                    entityTab === tab
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "all" ? "All" : tab === "person" ? "People" : tab === "organization" ? "Orgs" : "Places"}
                </button>
              ))}
            </div>
            {/* Tag cloud */}
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
              {filteredEntities.slice(0, 30).map(e => {
                const maxCount = filteredEntities[0]?.count || 1;
                const scale = 0.7 + (e.count / maxCount) * 0.6;
                const typeColor = e.type === "person" ? "text-sky-400 border-sky-400/20"
                  : e.type === "organization" ? "text-violet-400 border-violet-400/20"
                  : "text-emerald-400 border-emerald-400/20";
                return (
                  <span
                    key={e.text}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${typeColor} bg-white/[0.02]`}
                    style={{ fontSize: `${scale}rem` }}
                  >
                    {e.text}
                    <span className="text-[9px] opacity-60">{e.count}</span>
                  </span>
                );
              })}
              {filteredEntities.length === 0 && (
                <p className="text-sm text-muted-foreground">No entities found.</p>
              )}
            </div>
          </div>
        </div>

        {/* ───── ROW 5: Recent Articles ───── */}
        <div className="rounded-xl bg-card border border-border/50 p-5">
          <SectionHeader>Recent Articles</SectionHeader>
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {[...articles]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 30)
              .map(a => (
                <Link
                  key={a.id}
                  to={`/article/${encodeURIComponent(a.id)}`}
                  state={{ article: a }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition group"
                >
                  {/* Sentiment dot */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: SENTIMENT_COLORS[a.sentiment] }}
                  />
                  {/* Headline */}
                  <span className="flex-1 text-sm text-foreground group-hover:text-primary transition truncate">
                    {a.headline}
                  </span>
                  {/* Category badge */}
                  <span
                    className="hidden sm:inline text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[a.category]}15`,
                      color: CATEGORY_COLORS[a.category],
                    }}
                  >
                    {a.category}
                  </span>
                  {/* Source */}
                  <span className="hidden md:inline text-[10px] text-muted-foreground w-24 truncate text-right">
                    {a.source}
                  </span>
                  {/* Country */}
                  <span className="hidden lg:inline text-[10px] text-muted-foreground w-20 truncate text-right">
                    {a.location.country}
                  </span>
                  {/* Date */}
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(a.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              ))}
          </div>
        </div>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>

      {/* Background loading indicator */}
      {refreshing && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Updating…
        </div>
      )}
    </div>
  );
}
