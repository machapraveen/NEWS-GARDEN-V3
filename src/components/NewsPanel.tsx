import { X, ChevronDown, ChevronRight, Clock, MapPin, ExternalLink, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { GlobeMarker, NewsArticle } from "@/data/mockNews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewsPanelProps {
  marker: GlobeMarker | null;
  onClose: () => void;
  articles: NewsArticle[];
}

const sentimentStyles = {
  positive: "bg-sentiment-positive/20 text-sentiment-positive border-sentiment-positive/30",
  negative: "bg-sentiment-negative/20 text-sentiment-negative border-sentiment-negative/30",
  neutral: "bg-sentiment-neutral/20 text-sentiment-neutral border-sentiment-neutral/30",
};

function CredibilityBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  if (score > 75) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border font-medium bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ${compact ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}>
        <ShieldCheck className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
        VERIFIED
      </span>
    );
  }
  if (score >= 45) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border font-medium bg-amber-500/15 text-amber-400 border-amber-500/30 ${compact ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}>
        <ShieldAlert className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
        SUSPICIOUS
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium bg-red-500/15 text-red-400 border-red-500/30 ${compact ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}>
      <ShieldQuestion className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
      UNVERIFIED
    </span>
  );
}

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      to={`/article/${encodeURIComponent(article.id)}`}
      state={{ article }}
      className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-border/50 hover:border-primary/30 group"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
          {article.headline}
        </h4>
        <ExternalLink className="w-3 h-3 mt-1 shrink-0 text-muted-foreground group-hover:text-primary" />
      </div>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <CredibilityBadge score={article.credibilityScore} compact />
        <Badge className={`text-[10px] px-1.5 py-0 ${sentimentStyles[article.sentiment]}`}>
          {article.sentiment}
        </Badge>
        <span className="text-[10px] text-muted-foreground">{article.source}</span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          {new Date(article.timestamp).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}

function GeoLevel({ level, name, articles }: { level: string; name: string; articles: NewsArticle[] }) {
  const [expanded, setExpanded] = useState(false);
  const top = articles[0];
  if (!top) return null;

  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-secondary/30 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-primary font-display">{level}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-foreground font-medium truncate">{name}</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{articles.length}</span>
          </div>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{top.headline}</p>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {articles.slice(0, 5).map(a => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewsPanel({ marker, onClose, articles }: NewsPanelProps) {
  if (!marker) return null;

  // Find articles near this marker
  const markerArticles = articles.filter(a =>
    Math.abs(a.location.lat - marker.lat) < 1 && Math.abs(a.location.lng - marker.lng) < 1
  );
  const primaryArticle = markerArticles[0];
  if (!primaryArticle) return null;

  // Build all 6 geographic levels from the articles
  const levels = [
    { level: "City", name: primaryArticle.location.city, articles: articles.filter(a => a.location.city === primaryArticle.location.city) },
    { level: "District", name: primaryArticle.location.district || primaryArticle.location.city, articles: articles.filter(a => (a.location.district || a.location.city) === (primaryArticle.location.district || primaryArticle.location.city)) },
    { level: "State", name: primaryArticle.location.state || primaryArticle.location.country, articles: articles.filter(a => (a.location.state || a.location.country) === (primaryArticle.location.state || primaryArticle.location.country)) },
    { level: "Country", name: primaryArticle.location.country, articles: articles.filter(a => a.location.country === primaryArticle.location.country) },
    { level: "Continent", name: primaryArticle.location.continent, articles: articles.filter(a => a.location.continent === primaryArticle.location.continent) },
    { level: "World", name: "Global", articles: [...articles].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) },
  ];

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] z-50 glass border-l border-border/50 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-display text-sm font-semibold tracking-wide text-foreground">
            {marker.city}, {marker.country}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-60px)]">
        {/* Featured Article */}
        <div className="p-4 border-b border-border/30">
          <Link
            to={`/article/${encodeURIComponent(primaryArticle.id)}`}
            state={{ article: primaryArticle }}
            className="block group"
          >
            {primaryArticle.imageUrl && (
              <img
                src={primaryArticle.imageUrl}
                alt={primaryArticle.headline}
                className="w-full h-40 object-cover rounded-lg mb-3"
                loading="lazy"
              />
            )}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CredibilityBadge score={primaryArticle.credibilityScore} />
              <Badge className={`text-xs ${sentimentStyles[primaryArticle.sentiment]}`}>
                {primaryArticle.sentiment} · {Math.round(primaryArticle.sentimentScore * 100)}%
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
              {primaryArticle.headline}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{primaryArticle.summary}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span>{primaryArticle.source}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(primaryArticle.timestamp).toLocaleString()}
              </span>
            </div>
          </Link>
        </div>

        {/* Geographic Levels */}
        <div className="p-4">
          <h3 className="font-display text-xs uppercase tracking-widest text-primary mb-3">Geographic Levels</h3>
          <div className="rounded-lg border border-border/30 overflow-hidden">
            {levels.map(gl => (
              <GeoLevel key={gl.level} level={gl.level} name={gl.name} articles={gl.articles} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
