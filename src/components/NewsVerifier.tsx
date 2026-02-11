import { useState } from "react";
import { Shield, Loader2, AlertTriangle, CheckCircle, XCircle, Brain, Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeCredibility } from "@/lib/api/news";
import type { NewsArticle } from "@/data/mockNews";

interface VerifyResult {
  credibilityScore: number;
  bertConfidence: number;
  bertLabel: string;
  explanation: string;
  redFlags: string[];
  models?: {
    gemini?: { score: number; verdict: string };
  };
}

export default function NewsVerifier() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleVerify = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const fakeArticle = {
        headline: text.trim(),
        summary: text.trim(),
        fullText: text.trim(),
      } as NewsArticle;

      const data = await analyzeCredibility(fakeArticle);
      setResult(data);
    } catch (err) {
      console.error("Verification failed:", err);
      setResult({
        credibilityScore: 50,
        bertConfidence: 0.5,
        bertLabel: "unknown",
        explanation: "Could not reach the verification service. Please try again.",
        redFlags: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 75) return "text-emerald-400";
    if (score > 45) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreIcon = (score: number) => {
    if (score > 75) return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (score > 45) return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getScoreLabel = (score: number) => {
    if (score > 75) return "Likely Credible";
    if (score > 45) return "Suspicious";
    return "Likely Fake";
  };

  return (
    <div className="w-full max-w-xl">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="font-display text-sm font-bold tracking-wider text-primary">
          VERIFY NEWS
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Paste a news headline or article text to check if it's real or fake using AI
      </p>

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a news headline or article text here..."
          rows={2}
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none resize-none backdrop-blur-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleVerify();
            }
          }}
        />
        <Button
          onClick={handleVerify}
          disabled={!text.trim() || loading}
          size="sm"
          className="h-auto px-4 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          {/* Main Score */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getScoreIcon(result.credibilityScore)}
              <div>
                <span className={`text-2xl font-bold font-display ${getScoreColor(result.credibilityScore)}`}>
                  {result.credibilityScore}%
                </span>
                <span className={`text-xs ml-2 ${getScoreColor(result.credibilityScore)}`}>
                  {getScoreLabel(result.credibilityScore)}
                </span>
              </div>
            </div>
          </div>

          {/* Model Details */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-2">
              <div className="flex items-center gap-1 mb-1">
                <Brain className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold text-muted-foreground">RoBERTa</span>
              </div>
              <span className={`text-xs font-bold ${
                result.bertLabel === "Real" ? "text-emerald-400" :
                result.bertLabel === "Fake" ? "text-red-400" : "text-muted-foreground"
              }`}>
                {result.bertLabel === "unknown" ? "Analyzing..." : result.bertLabel}
              </span>
              <span className="text-[10px] text-muted-foreground ml-1">
                ({Math.round(result.bertConfidence * 100)}%)
              </span>
            </div>
            <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-2">
              <div className="flex items-center gap-1 mb-1">
                <Bot className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold text-muted-foreground">Gemini AI</span>
              </div>
              {result.models?.gemini ? (
                <>
                  <span className={`text-xs font-bold ${
                    result.models.gemini.verdict === "credible" ? "text-emerald-400" :
                    result.models.gemini.verdict === "suspicious" ? "text-amber-400" : "text-red-400"
                  }`}>
                    {result.models.gemini.verdict}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({result.models.gemini.score}/100)
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </div>
          </div>

          {/* Explanation */}
          {result.explanation && (
            <p className="text-xs text-muted-foreground mb-2">{result.explanation}</p>
          )}

          {/* Red Flags */}
          {result.redFlags && result.redFlags.length > 0 && (
            <div className="space-y-1">
              {result.redFlags.map((flag, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-red-400/80">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {flag}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
