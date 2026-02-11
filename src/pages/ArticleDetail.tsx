import { useParams, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Volume2, VolumeX, Shield, AlertTriangle, CheckCircle, Flag, Bot, FileSearch, Users, Loader2, ExternalLink, Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { NewsArticle } from "@/data/mockNews";
import { analyzeCredibility } from "@/lib/api/news";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

const sentimentStyles = {
  positive: "bg-sentiment-positive/20 text-sentiment-positive border-sentiment-positive/30",
  negative: "bg-sentiment-negative/20 text-sentiment-negative border-sentiment-negative/30",
  neutral: "bg-sentiment-neutral/20 text-sentiment-neutral border-sentiment-neutral/30",
};

export default function ArticleDetail() {
  const { id } = useParams();
  const location = useLocation();
  const article = (location.state as any)?.article as NewsArticle | undefined;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reports, setReports] = useState(article?.communityReports || 0);
  const [credibility, setCredibility] = useState<any>(null);
  const [credLoading, setCredLoading] = useState(false);
  const { toast } = useToast();

  // Run ensemble credibility analysis (Gemini + RoBERTa) on mount
  useEffect(() => {
    if (!article) return;
    setCredLoading(true);
    analyzeCredibility(article)
      .then(data => setCredibility(data))
      .catch(err => {
        console.error('Credibility analysis failed:', err);
      })
      .finally(() => setCredLoading(false));
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl text-foreground mb-2">Article Not Found</h1>
          <Link to="/" className="text-primary hover:underline">Back to Globe</Link>
        </div>
      </div>
    );
  }

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(article.fullText || article.summary);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const credScore = credibility?.credibilityScore ?? article.credibilityScore;
  const credibilityColor = credScore > 80 ? "text-sentiment-positive" : credScore > 50 ? "text-sentiment-neutral" : "text-sentiment-negative";
  const credibilityLabel = credScore > 80 ? "Highly Credible" : credScore > 50 ? "Moderate Credibility" : "Low Credibility";

  // RoBERTa model results
  const bertConf = credibility?.bertConfidence ?? article.bertConfidence;
  const bertLabel = credibility?.bertLabel || 'unknown';
  const robertaColor = bertLabel === 'Real' ? 'text-sentiment-positive' : bertLabel === 'Fake' ? 'text-sentiment-negative' : 'text-sentiment-neutral';

  // Gemini model results
  const geminiScore = credibility?.models?.gemini?.score;
  const geminiVerdict = credibility?.models?.gemini?.verdict;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Nav */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Globe
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge className={sentimentStyles[article.sentiment]}>
              {article.sentiment} &middot; {Math.round(article.sentimentScore * 100)}%
            </Badge>
            <Badge variant="outline" className="text-xs">{article.category}</Badge>
            <Badge variant="outline" className="text-xs">{article.source}</Badge>
            <Badge className="bg-primary/20 text-primary text-[10px]">LIVE</Badge>
          </div>

          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.headline}
              className="w-full h-64 object-cover rounded-xl mb-4"
              loading="lazy"
            />
          )}

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3">
            {article.headline}
          </h1>
          <p className="text-muted-foreground">{article.summary}</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
            <span>{article.location.city}, {article.location.country}</span>
            <span>{new Date(article.timestamp).toLocaleString()}</span>
            {article.sourceUrl && (
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> Original source
              </a>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Full Article */}
            <Card className="bg-card border-border/50">
              <CardContent className="pt-6">
                <p className="text-foreground leading-relaxed">{article.fullText}</p>
              </CardContent>
            </Card>

            {/* AI Summary */}
            <Card className="bg-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  AI-Generated Summary
                  <Badge className="bg-primary/20 text-primary text-[10px]">Gemini AI</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{article.aiSummary}</p>
              </CardContent>
            </Card>

            {/* Named Entities */}
            {article.entities.length > 0 && (
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Named Entities (AI Extracted)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {article.entities.map((e, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={`text-xs ${
                          e.type === "person" ? "border-accent/50 text-accent" :
                          e.type === "organization" ? "border-primary/50 text-primary" :
                          "border-sentiment-neutral/50 text-sentiment-neutral"
                        }`}
                      >
                        {e.type === "person" ? "Person" : e.type === "organization" ? "Org" : "Place"}: {e.text}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credibility Score (Ensemble) */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Credibility Score
                  {credLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                  {!credLoading && credibility && (
                    <Badge className="bg-primary/20 text-primary text-[10px]">Ensemble</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-3">
                  <span className={`text-4xl font-display font-bold ${credibilityColor}`}>
                    {credScore}%
                  </span>
                  <p className={`text-sm mt-1 ${credibilityColor}`}>{credibilityLabel}</p>
                </div>
                <Progress value={credScore} className="h-2" />
                {credibility?.explanation && (
                  <p className="text-xs text-muted-foreground mt-2">{credibility.explanation}</p>
                )}
              </CardContent>
            </Card>

            {/* Fake News Detection — Real ML Models */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">AI Fake News Detection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="multiple" defaultValue={["roberta", "gemini", "flags", "community"]}>
                  {/* RoBERTa Model */}
                  <AccordionItem value="roberta" className="border-border/30">
                    <AccordionTrigger className="text-xs py-2 hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-primary" /> RoBERTa Detector
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-xs text-muted-foreground space-y-2">
                        <div className="flex justify-between">
                          <span>Confidence</span>
                          <span className="text-foreground">
                            {credLoading ? '...' : `${Math.round(bertConf * 100)}%`}
                          </span>
                        </div>
                        <Progress value={bertConf * 100} className="h-1.5" />
                        <div className="flex justify-between items-center">
                          <span>Verdict</span>
                          {credLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Badge className={`text-[10px] ${
                              bertLabel === 'Real' ? 'bg-sentiment-positive/20 text-sentiment-positive' :
                              bertLabel === 'Fake' ? 'bg-sentiment-negative/20 text-sentiment-negative' :
                              'bg-sentiment-neutral/20 text-sentiment-neutral'
                            }`}>
                              {bertLabel === 'unknown' ? 'ANALYZING...' : bertLabel.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60">roberta-base-openai-detector via HuggingFace</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Gemini Analysis */}
                  <AccordionItem value="gemini" className="border-border/30">
                    <AccordionTrigger className="text-xs py-2 hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Bot className="w-3.5 h-3.5 text-primary" /> Gemini AI Analysis
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-xs text-muted-foreground space-y-2">
                        {geminiScore !== undefined && (
                          <>
                            <div className="flex justify-between">
                              <span>Score</span>
                              <span className="text-foreground">{geminiScore}/100</span>
                            </div>
                            <Progress value={geminiScore} className="h-1.5" />
                          </>
                        )}
                        {geminiVerdict && (
                          <div className="flex justify-between items-center">
                            <span>Verdict</span>
                            <Badge className={`text-[10px] ${
                              geminiVerdict === 'credible' ? 'bg-sentiment-positive/20 text-sentiment-positive' :
                              geminiVerdict === 'suspicious' ? 'bg-sentiment-neutral/20 text-sentiment-neutral' :
                              'bg-sentiment-negative/20 text-sentiment-negative'
                            }`}>
                              {geminiVerdict.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                        {!credLoading && !geminiScore && (
                          <p className="text-[10px]">Analysis pending...</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60">Gemini 2.0 Flash credibility assessment</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Red Flags */}
                  {credibility?.redFlags?.length > 0 && (
                    <AccordionItem value="flags" className="border-border/30">
                      <AccordionTrigger className="text-xs py-2 hover:no-underline">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-sentiment-negative" /> Red Flags ({credibility.redFlags.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-1">
                          {credibility.redFlags.map((flag: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-sentiment-negative shrink-0 mt-0.5" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Community Reports */}
                  <AccordionItem value="community" className="border-border/30">
                    <AccordionTrigger className="text-xs py-2 hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-primary" /> Community Reports
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{reports} reports</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReports(r => r + 1);
                            toast({ title: "Report submitted", description: "Thank you for helping verify this article." });
                          }}
                          className="h-7 text-xs"
                        >
                          <Flag className="w-3 h-3 mr-1" /> Report as Fake
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* TTS */}
            <Button
              onClick={toggleSpeech}
              variant="outline"
              className="w-full glass border-border/30"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
              {isSpeaking ? "Stop Reading" : "Listen to Article"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
