import { useRef, useEffect, useCallback, useState } from "react";
import GlobeGL from "react-globe.gl";
import { GlobeMarker, getGlobeMarkers, Category, NewsArticle } from "@/data/mockNews";

interface GlobeProps {
  onMarkerClick: (marker: GlobeMarker) => void;
  selectedCategory: Category | null;
  showHeatmap: boolean;
  articles: NewsArticle[];
  focusLocation?: { lat: number; lng: number; altitude?: number } | null;
}

// ─── Curated Luminescent Sentiment Palette ───
const SENTIMENT_COLORS = {
  positive: "#10b981", // Luminous Emerald Teal
  neutral: "#f59e0b",  // Solar Amber / Topaz
  negative: "#f43f5e", // Neon Rose / Crimson Coral
};

const SENTIMENT_BG = {
  positive: "rgba(16, 185, 129, 0.16)",
  neutral: "rgba(245, 158, 11, 0.16)",
  negative: "rgba(244, 63, 94, 0.16)",
};

const SENTIMENT_BORDER = {
  positive: "rgba(16, 185, 129, 0.5)",
  neutral: "rgba(245, 158, 11, 0.5)",
  negative: "rgba(244, 63, 94, 0.5)",
};

export default function Globe({
  onMarkerClick,
  selectedCategory,
  showHeatmap,
  articles,
  focusLocation,
}: GlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<GlobeMarker[]>([]);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 800,
    height: typeof window !== "undefined" ? window.innerHeight : 600,
  });

  // Re-calculate clusters on articles / category change
  useEffect(() => {
    const filtered = selectedCategory
      ? articles.filter(a => a.category === selectedCategory)
      : articles;
    setMarkers(getGlobeMarkers(filtered));
  }, [selectedCategory, articles]);

  // Window resize listener
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || window.innerWidth,
          height: containerRef.current.clientHeight || window.innerHeight,
        });
      }
    };
    window.addEventListener("resize", updateDimensions);
    updateDimensions();
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Initial globe view & auto-rotation
  useEffect(() => {
    const globe = globeRef.current;
    if (globe) {
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.45;
      globe.controls().enableZoom = true;
      globe.pointOfView({ altitude: 2.4 }, 1000);
    }
  }, []);

  // Handle fly-to programmatic camera focus (e.g. when selecting a country)
  useEffect(() => {
    if (focusLocation && globeRef.current) {
      const globe = globeRef.current;
      globe.controls().autoRotate = false;
      globe.pointOfView(
        {
          lat: focusLocation.lat,
          lng: focusLocation.lng,
          altitude: focusLocation.altitude || 1.8,
        },
        1200
      );
    }
  }, [focusLocation]);

  const handleMarkerClick = useCallback(
    (marker: object) => {
      const m = marker as GlobeMarker;
      onMarkerClick(m);
      const globe = globeRef.current;
      if (globe) {
        globe.controls().autoRotate = false;
        globe.pointOfView({ lat: m.lat, lng: m.lng, altitude: 1.6 }, 1000);
      }
    },
    [onMarkerClick]
  );

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <GlobeGL
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        // ── Surface Beacons (Sleek, hugging Earth surface, NO tall spiky cylinders) ──
        pointsData={markers}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: object) => SENTIMENT_COLORS[(d as GlobeMarker).sentiment]}
        pointAltitude={0.005} // Surface-level glowing bead, zero tall spikes!
        pointRadius={(d: object) => {
          const count = (d as GlobeMarker).articleCount || 1;
          // Smooth logarithmic sizing so single stories look sleek and clusters look like radiant hubs
          return Math.min(1.15, 0.38 + Math.log10(count + 1) * 0.42);
        }}
        pointResolution={32}
        pointsMerge={false}
        // ── Pulsing Sentiment Waves (Radar Ripples across the planet crust) ──
        ringsData={markers}
        ringLat="lat"
        ringLng="lng"
        ringColor={(d: object) => {
          const m = d as GlobeMarker;
          const c = SENTIMENT_COLORS[m.sentiment];
          return [c, "rgba(0,0,0,0)"];
        }}
        ringMaxRadius={(d: object) => {
          const m = d as GlobeMarker;
          const boost = showHeatmap ? 1.5 : 1.0;
          return (2.2 + Math.min(3.2, Math.log10(m.articleCount + 1) * 2.0)) * boost;
        }}
        ringPropagationSpeed={showHeatmap ? 1.6 : 1.1}
        ringRepeatPeriod={showHeatmap ? 1400 : 2000}
        // ── Ultra-Premium Glassmorphic Tooltip ──
        pointLabel={(d: object) => {
          const m = d as GlobeMarker;
          const sentColor = SENTIMENT_COLORS[m.sentiment];
          const sentBg = SENTIMENT_BG[m.sentiment];
          const sentBorder = SENTIMENT_BORDER[m.sentiment];
          const categoryBadge = m.topArticle.category;
          const timeAgo = getTimeAgo(m.topArticle.timestamp);
          const totalInHub = m.articleCount || 1;
          const posCount = m.positiveCount || (m.sentiment === "positive" ? 1 : 0);
          const neuCount = m.neutralCount || (m.sentiment === "neutral" ? 1 : 0);
          const negCount = m.negativeCount || (m.sentiment === "negative" ? 1 : 0);
          const posPct = Math.round((posCount / totalInHub) * 100);
          const neuPct = Math.round((neuCount / totalInHub) * 100);
          const negPct = Math.round((negCount / totalInHub) * 100);

          return `<div style="
            background: linear-gradient(135deg, rgba(8, 14, 28, 0.96), rgba(13, 23, 42, 0.94));
            padding: 14px 18px;
            border-radius: 16px;
            border: 1px solid ${sentBorder};
            box-shadow: 0 12px 36px rgba(0,0,0,0.7), 0 0 24px ${sentColor}33;
            font-family: Inter, system-ui, -apple-system, sans-serif;
            color: #f1f5f9;
            max-width: 320px;
            min-width: 250px;
            backdrop-filter: blur(16px);
            pointer-events: none;
          ">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span style="
                width:9px; height:9px; border-radius:50%;
                background:${sentColor};
                box-shadow: 0 0 10px ${sentColor};
                display:inline-block;
              "></span>
              <span style="font-family:Orbitron,sans-serif; font-weight:700; font-size:13px; color:#ffffff; letter-spacing:0.5px;">
                ${m.city || m.state || m.country}
              </span>
              ${m.country && m.city !== m.country ? `<span style="color:#94a3b8; font-size:11px;">· ${m.country}</span>` : ""}
              <span style="
                margin-left:auto; background:${sentBg}; color:${sentColor};
                padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700;
                border:1px solid ${sentBorder}; text-transform:uppercase; letter-spacing:0.5px;
              ">
                ${m.sentiment}
              </span>
            </div>

            ${
              totalInHub > 1
                ? `<div style="margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; margin-bottom:3px;">
                      <span>Sentiment Pulse</span>
                      <span style="color:${sentColor}; font-weight:600;">${totalInHub} active stories</span>
                    </div>
                    <div style="display:flex; height:4px; border-radius:4px; overflow:hidden; background:rgba(255,255,255,0.08);">
                      <div style="width:${posPct}%; background:#10b981;" title="${posPct}% Positive"></div>
                      <div style="width:${neuPct}%; background:#f59e0b;" title="${neuPct}% Neutral"></div>
                      <div style="width:${negPct}%; background:#f43f5e;" title="${negPct}% Critical"></div>
                    </div>
                  </div>`
                : ""
            }

            <div style="font-size:12.5px; font-weight:600; line-height:1.4; margin-bottom:6px; color:#f8fafc;">
              ${m.topArticle.headline.length > 95 ? m.topArticle.headline.slice(0, 95) + "..." : m.topArticle.headline}
            </div>

            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:8px; font-size:10px; color:#94a3b8;">
              <span style="background:rgba(255,255,255,0.06); color:#cbd5e1; padding:2px 7px; border-radius:8px; font-weight:500;">
                ${categoryBadge}
              </span>
              <span style="color:#64748b;">·</span>
              <span style="color:#cbd5e1;">${m.topArticle.source}</span>
              <span style="color:#64748b;">·</span>
              <span>${timeAgo}</span>
              <span style="margin-left:auto; color:#10b981; font-weight:600;">
                ${m.topArticle.credibilityScore}% credible
              </span>
            </div>

            <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.08); text-align:center;">
              <span style="color:#38bdf8; font-size:10px; font-weight:600; letter-spacing:0.8px;">
                CLICK TO EXPLORE HUB
              </span>
            </div>
          </div>`;
        }}
        onPointClick={handleMarkerClick}
        atmosphereColor="#06b6d4"
        atmosphereAltitude={0.22}
        animateIn={true}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
