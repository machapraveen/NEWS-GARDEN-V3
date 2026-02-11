import { useRef, useEffect, useCallback, useState } from "react";
import GlobeGL from "react-globe.gl";
import { GlobeMarker, getGlobeMarkers, Category, NewsArticle } from "@/data/mockNews";

interface GlobeProps {
  onMarkerClick: (marker: GlobeMarker) => void;
  selectedCategory: Category | null;
  showHeatmap: boolean;
  articles: NewsArticle[];
}

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#eab308",
};

const SENTIMENT_BG = {
  positive: "rgba(34,197,94,0.15)",
  negative: "rgba(239,68,68,0.15)",
  neutral: "rgba(234,179,8,0.15)",
};

const SENTIMENT_BORDER = {
  positive: "rgba(34,197,94,0.5)",
  negative: "rgba(239,68,68,0.5)",
  neutral: "rgba(234,179,8,0.5)",
};

export default function Globe({ onMarkerClick, selectedCategory, showHeatmap, articles }: GlobeProps) {
  const globeRef = useRef<any>(null);
  const [markers, setMarkers] = useState<GlobeMarker[]>([]);

  useEffect(() => {
    const filtered = selectedCategory
      ? articles.filter(a => a.category === selectedCategory)
      : articles;
    setMarkers(getGlobeMarkers(filtered));
  }, [selectedCategory, articles]);

  useEffect(() => {
    const globe = globeRef.current;
    if (globe) {
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.5;
      globe.controls().enableZoom = true;
      globe.pointOfView({ altitude: 2.5 }, 1000);
    }
  }, []);

  const handleMarkerClick = useCallback((marker: object) => {
    const m = marker as GlobeMarker;
    onMarkerClick(m);
    const globe = globeRef.current;
    if (globe) {
      globe.controls().autoRotate = false;
      globe.pointOfView({ lat: m.lat, lng: m.lng, altitude: 1.5 }, 1000);
    }
  }, [onMarkerClick]);

  return (
    <div className="w-full h-full">
      <GlobeGL
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={markers}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: object) => SENTIMENT_COLORS[(d as GlobeMarker).sentiment]}
        pointAltitude={(d: object) => 0.06 + (d as GlobeMarker).articleCount * 0.04}
        pointRadius={0.6}
        pointLabel={(d: object) => {
          const m = d as GlobeMarker;
          const sentColor = SENTIMENT_COLORS[m.sentiment];
          const sentBg = SENTIMENT_BG[m.sentiment];
          const sentBorder = SENTIMENT_BORDER[m.sentiment];
          const categoryBadge = m.topArticle.category;
          const timeAgo = getTimeAgo(m.topArticle.timestamp);

          return `<div style="
            background: linear-gradient(135deg, rgba(10,15,30,0.95), rgba(15,25,50,0.95));
            padding: 14px 18px;
            border-radius: 14px;
            border: 1px solid ${sentBorder};
            box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${sentColor}22;
            font-family: Inter, sans-serif;
            color: #e2e8f0;
            max-width: 320px;
            min-width: 240px;
            backdrop-filter: blur(12px);
          ">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <div style="
                width:10px; height:10px; border-radius:50%;
                background:${sentColor};
                box-shadow: 0 0 8px ${sentColor};
                animation: pulse 2s infinite;
              "></div>
              <span style="font-family:Orbitron,sans-serif; font-weight:700; font-size:13px; color:${sentColor}; letter-spacing:0.5px;">
                ${m.city}
              </span>
              <span style="color:#64748b; font-size:11px;">·</span>
              <span style="color:#94a3b8; font-size:11px;">${m.country}</span>
              <span style="margin-left:auto; background:${sentBg}; color:${sentColor}; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:600; border:1px solid ${sentBorder};">
                ${m.sentiment.toUpperCase()}
              </span>
            </div>

            ${m.topArticle.imageUrl ? `<img src="${m.topArticle.imageUrl}" style="width:100%; height:80px; object-fit:cover; border-radius:8px; margin-bottom:8px; opacity:0.9;" onerror="this.style.display='none'" />` : ''}

            <div style="font-size:13px; font-weight:600; line-height:1.4; margin-bottom:6px; color:#f1f5f9;">
              ${m.topArticle.headline.length > 100 ? m.topArticle.headline.slice(0, 100) + '...' : m.topArticle.headline}
            </div>

            <div style="font-size:11px; color:#94a3b8; line-height:1.4; margin-bottom:8px;">
              ${(m.topArticle.summary || '').slice(0, 120)}${(m.topArticle.summary || '').length > 120 ? '...' : ''}
            </div>

            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span style="background:hsl(174,72%,46%,0.15); color:hsl(174,72%,46%); padding:2px 8px; border-radius:10px; font-size:10px; font-weight:600; border:1px solid hsl(174,72%,46%,0.3);">
                ${categoryBadge}
              </span>
              <span style="color:#64748b; font-size:10px;">${m.topArticle.source}</span>
              <span style="color:#64748b; font-size:10px;">·</span>
              <span style="color:#64748b; font-size:10px;">🕐 ${timeAgo}</span>
              <span style="margin-left:auto; color:#64748b; font-size:10px; font-weight:600;">
                ${m.articleCount} article${m.articleCount > 1 ? 's' : ''}
              </span>
            </div>

            <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(100,116,139,0.2); text-align:center;">
              <span style="color:hsl(174,72%,46%); font-size:10px; font-weight:600; letter-spacing:0.5px;">
                🔍 CLICK TO EXPLORE
              </span>
            </div>
          </div>`;
        }}
        onPointClick={handleMarkerClick}
        atmosphereColor="#2dd4bf"
        atmosphereAltitude={0.2}
        ringsData={showHeatmap ? markers : []}
        ringLat="lat"
        ringLng="lng"
        ringColor={(d: object) => {
          const c = SENTIMENT_COLORS[(d as GlobeMarker).sentiment];
          return [c, "transparent"];
        }}
        ringMaxRadius={4}
        ringPropagationSpeed={1.5}
        ringRepeatPeriod={1500}
        animateIn={true}
        width={typeof window !== "undefined" ? window.innerWidth : 800}
        height={typeof window !== "undefined" ? window.innerHeight : 600}
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
