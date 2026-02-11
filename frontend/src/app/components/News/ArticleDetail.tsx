"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useStore } from "@/store/useStore";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types";
import { getCredibilityBadge, getSentimentColor } from "@/lib/credibility";

export default function ArticleDetail() {
  const expandedArticle = useStore((s) => s.expandedArticle);
  const setExpandedArticle = useStore((s) => s.setExpandedArticle);
  const openReportDialog = useStore((s) => s.openReportDialog);

  if (!expandedArticle) return null;

  const article = expandedArticle;
  const credBadge = getCredibilityBadge(article.credibility_score);
  const sentimentColor = getSentimentColor(article.sentiment_score);
  const categoryColor = CATEGORY_COLORS[article.category] || "#94a3b8";
  const timeAgo = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={() => setExpandedArticle(null)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-xl p-6 w-full max-w-lg relative z-10 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="badge text-white text-xs" style={{ backgroundColor: categoryColor }}>
                {CATEGORY_LABELS[article.category]}
              </span>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sentimentColor }} />
              <span className="badge text-xs" style={{ backgroundColor: `${credBadge.color}20`, color: credBadge.color }}>
                {credBadge.label}
              </span>
            </div>
            <button
              onClick={() => setExpandedArticle(null)}
              className="p-1 rounded-md hover:bg-surface-light text-slate-400 hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {article.image_url && (
            <div className="w-full h-48 rounded-lg overflow-hidden mb-4 bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h2 className="text-lg font-semibold text-foreground mb-2">
            {article.title}
          </h2>

          <p className="text-sm text-slate-300 mb-4">
            {article.ai_summary || article.summary}
          </p>

          {/* ML Scores */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-surface rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Credibility</p>
              <p className="text-lg font-semibold" style={{ color: credBadge.color }}>
                {Math.round(article.credibility_score * 100)}%
              </p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Fake Score</p>
              <p className="text-lg font-semibold text-foreground">
                {Math.round(article.ai_fake_score * 100)}%
              </p>
            </div>
            {article.sklearn_fake_score !== null && (
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">sklearn</p>
                <p className="text-sm font-medium text-foreground">
                  {Math.round(article.sklearn_fake_score * 100)}%
                </p>
              </div>
            )}
            {article.roberta_fake_score !== null && (
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">RoBERTa</p>
                <p className="text-sm font-medium text-foreground">
                  {Math.round(article.roberta_fake_score * 100)}%
                </p>
              </div>
            )}
          </div>

          {/* Entities */}
          {article.entities && (
            <div className="mb-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Entities</p>
              <div className="flex flex-wrap gap-1.5">
                {article.entities.locations?.map((loc, i) => (
                  <span key={`loc-${i}`} className="badge bg-emerald-500/20 text-emerald-400 text-[10px]">{loc}</span>
                ))}
                {article.entities.organizations?.map((org, i) => (
                  <span key={`org-${i}`} className="badge bg-blue-500/20 text-blue-400 text-[10px]">{org}</span>
                ))}
                {article.entities.persons?.map((per, i) => (
                  <span key={`per-${i}`} className="badge bg-purple-500/20 text-purple-400 text-[10px]">{per}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{article.source_name || article.source_domain}</span>
            <span>{timeAgo}</span>
          </div>

          <div className="flex gap-3 mt-4">
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-sm text-primary text-center font-medium transition-colors"
              >
                Read full article
              </a>
            )}
            <button
              onClick={() => {
                setExpandedArticle(null);
                openReportDialog(article);
              }}
              className="py-2.5 px-4 rounded-lg bg-danger/10 hover:bg-danger/20 text-sm text-danger font-medium transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
              </svg>
              Report
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
