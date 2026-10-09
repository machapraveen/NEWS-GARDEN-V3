import type { GlobeMarker } from "./mockNews";

export interface NewsArc {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  fromName: string;
  toName: string;
  color: [string, string];
  altitude: number;
  stroke: number;
  dashLength: number;
  dashGap: number;
  dashInitialGap: number;
  dashAnimateTime: number;
  articleCount: number;
  topHeadline: string;
  destinationMarker: GlobeMarker;
}

const SENTIMENT_COLORS = {
  positive: "#10b981",
  neutral: "#f59e0b",
  negative: "#f43f5e",
};

/**
 * Generate dynamic animated news transmission arcs connecting global hubs
 */
export function generateNewsArcs(markers: GlobeMarker[]): NewsArc[] {
  if (!markers || markers.length < 2) return [];

  const arcs: NewsArc[] = [];
  // Sort markers by article count descending (major global hubs first)
  const sorted = [...markers].sort((a, b) => (b.articleCount || 1) - (a.articleCount || 1));
  const topHubs = sorted.slice(0, 16);

  // Connect pairs of international hubs across continents or regions
  for (let i = 0; i < topHubs.length; i++) {
    const hubA = topHubs[i];
    // Find up to 2 other hubs that are at least 15 degrees apart to create long, elegant arcs
    let connections = 0;
    for (let j = 0; j < topHubs.length; j++) {
      if (i === j) continue;
      const hubB = topHubs[j];

      // Approximate angular distance
      const dLat = hubA.lat - hubB.lat;
      const dLng = hubA.lng - hubB.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      // We want arcs across reasonable distances (between 12 and 160 degrees)
      if (dist >= 14 && dist <= 165) {
        // Prevent duplicate reverse arcs
        const arcId = [hubA.city || hubA.country, hubB.city || hubB.country].sort().join("<->");
        if (arcs.some((a) => a.id === arcId)) continue;

        const colorA = SENTIMENT_COLORS[hubA.sentiment] || "#38bdf8";
        const colorB = SENTIMENT_COLORS[hubB.sentiment] || "#10b981";
        const combinedArticles = (hubA.articleCount || 1) + (hubB.articleCount || 1);

        arcs.push({
          id: arcId,
          startLat: hubA.lat,
          startLng: hubA.lng,
          endLat: hubB.lat,
          endLng: hubB.lng,
          fromName: hubA.city || hubA.country,
          toName: hubB.city || hubB.country,
          color: [colorA, colorB],
          altitude: Math.min(0.38, 0.14 + (dist / 180) * 0.22),
          stroke: Math.min(1.8, 0.8 + Math.log10(combinedArticles) * 0.35),
          dashLength: 0.35,
          dashGap: 1.6,
          dashInitialGap: (i * 0.3) % 2,
          dashAnimateTime: 2200 + (dist * 10),
          articleCount: combinedArticles,
          topHeadline: hubB.topArticle?.headline || hubA.topArticle?.headline || "Global News Stream",
          destinationMarker: hubB,
        });

        connections++;
        if (connections >= 2) break;
      }
    }
  }

  return arcs;
}
