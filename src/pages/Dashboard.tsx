import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, Globe2, FileText, AlertTriangle, Flag } from "lucide-react";
import { categories, NewsArticle } from "@/data/mockNews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const location = useLocation();
  const articles: NewsArticle[] = (location.state as any)?.articles || [];

  const sentimentData = [
    { name: "Positive", value: articles.filter(a => a.sentiment === "positive").length, color: "#22c55e" },
    { name: "Negative", value: articles.filter(a => a.sentiment === "negative").length, color: "#ef4444" },
    { name: "Neutral", value: articles.filter(a => a.sentiment === "neutral").length, color: "#eab308" },
  ];

  const continentData = (() => {
    const map = new Map<string, number>();
    articles.forEach(a => map.set(a.location.continent, (map.get(a.location.continent) || 0) + 1));
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  })();

  const categoryData = categories.map(cat => ({
    name: cat,
    count: articles.filter(a => a.category === cat).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const uniqueCountries = new Set(articles.map(a => a.location.country)).size;
  const flaggedArticles = articles.filter(a => a.credibilityScore < 50).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Globe
        </Link>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
          <span className="text-primary text-glow">📊</span> Global News Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Real-time analytics from {articles.length} live articles</p>

        {articles.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              No articles loaded. Go back to the globe to fetch live news first.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: FileText, label: "Total Articles", value: articles.length, color: "text-primary" },
                { icon: Globe2, label: "Countries", value: uniqueCountries, color: "text-accent" },
                { icon: AlertTriangle, label: "Flagged", value: flaggedArticles, color: "text-sentiment-negative" },
                { icon: Flag, label: "Community Reports", value: articles.reduce((s, a) => s + a.communityReports, 0), color: "text-sentiment-neutral" },
              ].map(stat => (
                <Card key={stat.label} className="bg-card border-border/50">
                  <CardContent className="pt-6 text-center">
                    <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                    <p className={`text-3xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sentiment */}
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-sm">Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {sentimentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(220,20%,10%)", border: "1px solid hsl(220,15%,18%)", borderRadius: "8px", color: "#e2e8f0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Regions */}
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-sm">Most Active Regions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={continentData}>
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(220,20%,10%)", border: "1px solid hsl(220,15%,18%)", borderRadius: "8px", color: "#e2e8f0" }} />
                      <Bar dataKey="count" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trending Topics */}
              <Card className="bg-card border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-display text-sm">Trending Topics by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {categoryData.map(c => (
                      <Badge
                        key={c.name}
                        variant="outline"
                        className="text-sm px-3 py-1.5 border-primary/30 text-foreground"
                        style={{ fontSize: `${Math.max(12, 10 + c.count * 3)}px` }}
                      >
                        {c.name} <span className="text-primary ml-1">({c.count})</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
