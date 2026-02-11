"use client";

import { TrendingData, HierarchyLevel } from "@/types";

const LEVEL_ICONS: Record<HierarchyLevel, string> = {
  city: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
  district: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z",
  state: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  country: "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z",
  continent: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  world: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
};

const LEVEL_LABELS: Record<HierarchyLevel, string> = {
  city: "City",
  district: "District",
  state: "State",
  country: "Country",
  continent: "Continent",
  world: "World",
};

interface LevelRowProps {
  level: HierarchyLevel;
  levelName: string | null;
  data: TrendingData[];
  onClick?: () => void;
}

export default function LevelRow({ level, levelName, data, onClick }: LevelRowProps) {
  const topArticle = data[0]?.article;
  const score = data[0]?.trending_score || 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0 group-hover:bg-primary/10">
        <svg
          className="w-4 h-4 text-slate-400 group-hover:text-primary"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d={LEVEL_ICONS[level]} />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            {LEVEL_LABELS[level]}
          </span>
          {levelName && (
            <span className="text-xs text-slate-400 truncate">
              {levelName}
            </span>
          )}
        </div>
        <p className="text-sm text-foreground truncate">
          {topArticle?.title || "No trending data"}
        </p>
      </div>

      {data[0]?.rank === 1 && topArticle && (
        <span className="badge bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider shrink-0 animate-pulse">
          Trending
        </span>
      )}
      {score > 0 && (
        <div className="badge bg-primary/10 text-primary shrink-0">
          {Math.round(score * 100)}
        </div>
      )}
    </button>
  );
}
