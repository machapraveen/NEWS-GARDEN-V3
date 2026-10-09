import { useMemo } from "react";
import { X, Sparkles, TrendingUp, Newspaper, ExternalLink, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CountryInfo } from "@/data/countriesData";
import type { NewsArticle } from "@/data/mockNews";
import { Link } from "react-router-dom";

interface CountryPulseCardProps {
  country: CountryInfo;
  articles: NewsArticle[];
  loading?: boolean;
  onClose: () => void;
  onExploreArticles?: () => void;
}

export default function CountryPulseCard({
  country,
  articles,
  loading = false,
  onClose,
  onExploreArticles,
}: CountryPulseCardProps) {
  // Filter articles belonging to this country
  const countryArticles = useMemo(() => {
    const qName = country.name.toLowerCase();
    const qCode = country.code.toLowerCase();
    return articles.filter(a => {
      const c = (a.location?.country || "").toLowerCase();
      const s = (a.location?.state || "").toLowerCase();
      return c === qName || c === qCode || s.includes(qName);
    });
  }, [articles, country]);

  // Compute sentiment breakdown
  const stats = useMemo(() => {
    if (countryArticles.length === 0) {
      return { total: 0, posPct: 0, neuPct: 0, negPct: 0, avgCred: 0, dominant: "neutral" };
    }
    let pos = 0, neu = 0, neg = 0, totalCred = 0;
    countryArticles.forEach(a => {
      totalCred += a.credibilityScore || 60;
      if (a.sentiment === "positive") pos++;
      else if (a.sentiment === "negative") neg++;
      else neu++;
    });
    const total = countryArticles.length;
    const posPct = Math.round((pos / total) * 100);
    const neuPct = Math.round((neu / total) * 100);
    const negPct = Math.round((neg / total) * 100);
    const avgCred = Math.round(totalCred / total);
    const dominant = pos >= neu && pos >= neg ? "positive" : neg >= neu ? "negative" : "neutral";

    return { total, posPct, neuPct, negPct, avgCred, dominant };
  }, [countryArticles]);

  return (
    <div className="fixed bottom-6 left-4 sm:left-6 z-40 max-w-sm sm:max-w-md w-full animate-in slide-in-from-bottom duration-300">
      <div className="glass rounded-2xl p-4 sm:p-5 border border-white/[0.12] shadow-2xl backdrop-blur-2xl bg-black/40 text-foreground relative overflow-hidden">
        {/* Subtle ambient accent glow based on dominant sentiment */}
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{
            background:
              stats.dominant === "positive"
                ? "#10b981"
                : stats.dominant === "negative"
                ? "#f43f5e"
                : "#f59e0b",
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl select-none">{country.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white tracking-wide">
                  {country.name}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-primary border border-white/[0.08]">
                  {country.region}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span>Capital: {country.capital}</span>
                <span>·</span>
                <span>{country.code.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-white hover:bg-white/[0.08] rounded-full"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Loading state or sentiment gauge */}
        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Fetching live news for {country.name}...</p>
            <span className="text-[10px] text-muted-foreground/60">GNews Enterprise Ingestion</span>
          </div>
        ) : stats.total > 0 ? (
          <>
            {/* Sentiment Spectrum Bar */}
            <div className="space-y-1.5 mb-3 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium flex items-center gap-1 text-white/90">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Sentiment Pulse
                </span>
                <span className="text-muted-foreground font-medium">
                  {stats.total} {stats.total === 1 ? "story" : "stories"} · {stats.avgCred}% cred
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-white/[0.08] rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${stats.posPct}%` }}
                  className="bg-[#10b981] transition-all duration-500"
                  title={`${stats.posPct}% Positive`}
                />
                <div
                  style={{ width: `${stats.neuPct}%` }}
                  className="bg-[#f59e0b] transition-all duration-500"
                  title={`${stats.neuPct}% Neutral`}
                />
                <div
                  style={{ width: `${stats.negPct}%` }}
                  className="bg-[#f43f5e] transition-all duration-500"
                  title={`${stats.negPct}% Critical`}
                />
              </div>

              {/* Legend numbers */}
              <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                <span className="text-[#10b981] font-semibold">{stats.posPct}% Optimistic</span>
                <span className="text-[#f59e0b] font-semibold">{stats.neuPct}% Balanced</span>
                <span className="text-[#f43f5e] font-semibold">{stats.negPct}% Critical</span>
              </div>
            </div>

            {/* Top headlines list (max 2) */}
            <div className="space-y-2 mb-3">
              {countryArticles.slice(0, 2).map(a => (
                <Link
                  key={a.id}
                  to={`/article/${encodeURIComponent(a.id)}`}
                  state={{ article: a }}
                  className="block p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-all group"
                >
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {a.headline}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Newspaper className="w-2.5 h-2.5" />
                      {a.source}
                    </span>
                    <span>·</span>
                    <span>{new Date(a.timestamp).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-xs text-muted-foreground bg-white/[0.02] rounded-xl border border-white/[0.05] mb-3">
            <p>No headlines indexed for {country.name} yet.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Select or search this country to fetch live global dispatches.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {stats.total > 0 && onExploreArticles && (
            <Button
              size="sm"
              variant="outline"
              onClick={onExploreArticles}
              className="flex-1 h-8 text-xs glass border-white/[0.15] hover:border-primary/40"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5 text-primary" />
              View All {stats.total} Stories
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 text-xs text-muted-foreground hover:text-white"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
