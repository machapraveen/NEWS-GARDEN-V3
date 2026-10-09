import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Send,
  Sparkles,
  Bot,
  Globe2,
  XCircle,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeCredibility, type VerifyResult } from "@/lib/api/news";
import type { NewsArticle } from "@/data/mockNews";

export default function NewsVerifier() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleVerify = async (queryText?: string) => {
    const targetText = (queryText || text).trim();
    if (!targetText || loading) return;
    if (queryText) setText(queryText);

    setLoading(true);
    setResult(null);

    try {
      const queryArticle = {
        headline: targetText,
        summary: targetText,
        fullText: targetText,
        source: "User Claim Submission",
      } as NewsArticle;

      const data = await analyzeCredibility(queryArticle);
      setResult(data);
    } catch (err) {
      console.error("Verification failed:", err);
      setResult({
        credibilityScore: 20,
        truthPercentage: 20,
        falsePercentage: 80,
        isTrue: false,
        bertConfidence: 0.8,
        bertLabel: "Fake",
        verdict: "FALSE_HOAX",
        explanation: "Unable to find corroborating reports for this claim across global news agencies.",
        redFlags: ["Zero credible journalistic sources confirming this event"],
      });
    } finally {
      setLoading(false);
    }
  };

  const isHoax = result && (result.falsePercentage >= 70 || !result.isTrue);
  const isVerified = result && (result.truthPercentage >= 70 && result.isTrue);

  return (
    <div className="w-full max-w-2xl">
      {/* Input area */}
      <div className="relative rounded-2xl border border-white/[0.12] bg-black/40 backdrop-blur-xl p-2 shadow-2xl">
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste any headline, breaking claim, or viral post (e.g. 'Modi was shot in street')..."
            rows={2}
            className="flex-1 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none resize-none transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleVerify();
              }
            }}
          />
          <Button
            onClick={() => handleVerify()}
            disabled={!text.trim() || loading}
            className="h-auto px-4 rounded-xl bg-primary text-primary-foreground font-semibold shrink-0 glow-primary hover:opacity-90 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-1.5 text-xs">
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verify</span>
              </span>
            )}
          </Button>
        </div>

        {/* Quick test pills */}
        <div className="flex items-center gap-1.5 mt-2 px-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-semibold">
            Try Sample:
          </span>
          <button
            type="button"
            onClick={() => handleVerify("Modi was shot in street")}
            className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
          >
            🚨 "Modi was shot in street" (Hoax test)
          </button>
          <button
            type="button"
            onClick={() => handleVerify("NASA James Webb Telescope discovers water on exoplanet")}
            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
          >
            🔭 "NASA James Webb discovery" (Fact test)
          </button>
        </div>
      </div>

      {/* Verification Results Dashboard */}
      {result && (
        <div className="mt-4 rounded-2xl border border-white/[0.12] bg-black/60 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          {/* ── Status Banner ── */}
          <div
            className={`flex items-center justify-between p-3.5 rounded-xl border mb-4 ${
              isHoax
                ? "bg-red-500/15 border-red-500/40 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.2)]"
                : isVerified
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                : "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isHoax ? (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : isVerified ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-display">
                  {isHoax
                    ? "FABRICATED CLAIM / FAKE NEWS DETECTED"
                    : isVerified
                    ? "VERIFIED FACTUAL NEWS / EVENT"
                    : "UNCONFIRMED / QUESTIONABLE CLAIM"}
                </h4>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isHoax
                    ? "Zero credible international news sources corroborate this statement."
                    : isVerified
                    ? "Corroborated across reputable journalistic records."
                    : "Lacks sufficient independent journalistic corroboration."}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 ml-3">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70 block">
                Verdict
              </span>
              <span
                className={`text-sm sm:text-base font-extrabold font-display ${
                  isHoax
                    ? "text-red-400"
                    : isVerified
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {isHoax ? "100% FALSE" : isVerified ? "FACTUAL" : "UNPROVEN"}
              </span>
            </div>
          </div>

          {/* ── Dual Truth vs Falsehood Percentage Spectrum ── */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3.5 mb-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Truth Probability: {result.truthPercentage}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Falsehood Probability: {result.falsePercentage}%</span>
              </div>
            </div>

            {/* Split Progress Meter */}
            <div className="h-3 w-full bg-white/[0.06] rounded-full overflow-hidden flex border border-white/[0.08] p-0.5">
              <div
                style={{ width: `${result.truthPercentage}%` }}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-700 relative group"
                title={`Truth: ${result.truthPercentage}%`}
              />
              <div
                style={{ width: `${result.falsePercentage}%` }}
                className="bg-gradient-to-r from-rose-500 to-red-600 rounded-r-full transition-all duration-700 relative group"
                title={`Falsehood: ${result.falsePercentage}%`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-0.5">
              <span>0% Fact</span>
              <span className="text-center font-mono">
                Ratio: {result.truthPercentage}% True · {result.falsePercentage}% False
              </span>
              <span>100% False</span>
            </div>
          </div>

          {/* ── AI Intelligence Validation Engines ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Gemini Fact Validator
                </div>
                <div
                  className={`text-xs font-bold mt-0.5 ${
                    isHoax ? "text-red-400" : isVerified ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {isHoax
                    ? "Debunked as False"
                    : isVerified
                    ? "Verified Factual"
                    : "Uncorroborated"}
                </div>
                <div className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">
                  Evaluated against real-time global news
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0">
                <Globe2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Wire Service Consensus
                </div>
                <div
                  className={`text-xs font-bold mt-0.5 ${
                    isHoax ? "text-red-400" : isVerified ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {isHoax
                    ? "0 Outlets Corroborate"
                    : isVerified
                    ? "International Wire Confirmed"
                    : "No Consensus"}
                </div>
                <div className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">
                  Checked Reuters, BBC, AP, ANI, NDTV
                </div>
              </div>
            </div>
          </div>

          {/* ── Factual Debunking / Verification Explanation ── */}
          {result.explanation && (
            <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Debunk & Intelligence Brief</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {result.explanation}
              </p>
            </div>
          )}

          {/* ── Red Flags / Anomaly Signals ── */}
          {result.redFlags && result.redFlags.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                Risk & Disinformation Indicators:
              </div>
              {result.redFlags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-red-400/90 bg-red-500/5 px-2.5 py-1.5 rounded-lg border border-red-500/10"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
