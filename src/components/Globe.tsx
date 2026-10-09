import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import GlobeGL from "react-globe.gl";
import * as THREE from "three";
import { GlobeMarker, getGlobeMarkers, Category, NewsArticle } from "@/data/mockNews";
import { generateNewsArcs, type NewsArc } from "@/data/globeArcs";
import { COUNTRIES_DATA, type CountryInfo } from "@/data/countriesData";
import GlobeVisualControls, {
  type GlobeViewMode,
  type GlobeTheme,
} from "./GlobeVisualControls";

interface GlobeProps {
  onMarkerClick: (marker: GlobeMarker) => void;
  selectedCategory: Category | null;
  showHeatmap: boolean;
  articles: NewsArticle[];
  focusLocation?: { lat: number; lng: number; altitude?: number } | null;
  onSelectCountry?: (country: CountryInfo) => void;
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

// ─── Basemap Textures & Assets ───
const THEME_TEXTURES = {
  night: {
    globe: "//unpkg.com/three-globe/example/img/earth-night.jpg",
    bump: "//unpkg.com/three-globe/example/img/earth-topology.png",
    bg: "//unpkg.com/three-globe/example/img/night-sky.png",
    atmosphere: "#06b6d4",
    altitude: 0.22,
  },
  day: {
    globe: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    bump: "//unpkg.com/three-globe/example/img/earth-topology.png",
    bg: "//unpkg.com/three-globe/example/img/night-sky.png",
    atmosphere: "#38bdf8",
    altitude: 0.28,
  },
  cyber: {
    globe: "//unpkg.com/three-globe/example/img/earth-dark.jpg",
    bump: "//unpkg.com/three-globe/example/img/earth-topology.png",
    bg: "//unpkg.com/three-globe/example/img/night-sky.png",
    atmosphere: "#10b981",
    altitude: 0.18,
  },
};

export default function Globe({
  onMarkerClick,
  selectedCategory,
  showHeatmap,
  articles,
  focusLocation,
  onSelectCountry,
}: GlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Visual Modes & Themes
  const [viewMode, setViewMode] = useState<GlobeViewMode>("beacons");
  const [theme, setTheme] = useState<GlobeTheme>("night");
  const [autoRotate, setAutoRotate] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showClouds, setShowClouds] = useState(true);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Data layers
  const [markers, setMarkers] = useState<GlobeMarker[]>([]);
  const [geoCountries, setGeoCountries] = useState<any[]>([]);
  const [hoveredPolygon, setHoveredPolygon] = useState<any | null>(null);

  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 800,
    height: typeof window !== "undefined" ? window.innerHeight : 600,
  });

  // Re-calculate clusters on articles / category change
  useEffect(() => {
    const filtered = selectedCategory
      ? articles.filter((a) => a.category === selectedCategory)
      : articles;
    setMarkers(getGlobeMarkers(filtered));
  }, [selectedCategory, articles]);

  // Load World GeoJSON dataset for Country Choropleth Mode
  useEffect(() => {
    let isMounted = true;
    const loadGeoJson = async () => {
      try {
        const res = await fetch("/datasets/ne_110m_admin_0_countries.geojson");
        if (!res.ok) throw new Error("Local fetch failed");
        const data = await res.json();
        if (isMounted) setGeoCountries(data.features || []);
      } catch (err) {
        console.warn("Falling back to CDN for world geojson:", err);
        try {
          const cdnRes = await fetch(
            "https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson"
          );
          const cdnData = await cdnRes.json();
          if (isMounted) setGeoCountries(cdnData.features || []);
        } catch (e) {
          console.error("Failed to load world geojson:", e);
        }
      }
    };
    loadGeoJson();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute country news sentiment statistics map
  const countryStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        pos: number;
        neu: number;
        neg: number;
        dominant: "positive" | "neutral" | "negative";
        topHeadline: string;
      }
    >();

    articles.forEach((a) => {
      const c = (a.location?.country || "").toLowerCase().trim();
      if (!c) return;
      const cur = map.get(c) || {
        total: 0,
        pos: 0,
        neu: 0,
        neg: 0,
        dominant: "neutral",
        topHeadline: a.headline,
      };
      cur.total++;
      if (a.sentiment === "positive") cur.pos++;
      else if (a.sentiment === "negative") cur.neg++;
      else cur.neu++;

      cur.dominant =
        cur.pos >= cur.neu && cur.pos >= cur.neg
          ? "positive"
          : cur.neg >= cur.neu
          ? "negative"
          : "neutral";

      map.set(c, cur);
    });
    return map;
  }, [articles]);

  // Dynamic news transmission arcs
  const arcs = useMemo(() => {
    return generateNewsArcs(markers);
  }, [markers]);

  // HexBin raw data points
  const hexPoints = useMemo(() => {
    return articles.map((a) => ({
      lat: a.location.lat,
      lng: a.location.lng,
      weight: 1,
      article: a,
      sentiment: a.sentiment,
    }));
  }, [articles]);

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

  // Initial globe camera, specular ocean lighting & 3D atmospheric clouds setup (vasturiano style)
  useEffect(() => {
    const globe = globeRef.current;
    if (globe) {
      globe.controls().autoRotate = autoRotate;
      globe.controls().autoRotateSpeed = 0.45;
      globe.controls().enableZoom = true;
      globe.pointOfView({ altitude: 2.3 }, 1000);

      // Enhance globe material with ocean specular reflections
      try {
        const globeMaterial = globe.globeMaterial ? globe.globeMaterial() : null;
        if (globeMaterial) {
          globeMaterial.bumpScale = 10;
          new THREE.TextureLoader().load(
            "//unpkg.com/three-globe/example/img/earth-water.png",
            (waterTexture) => {
              globeMaterial.specularMap = waterTexture;
              globeMaterial.specular = new THREE.Color("#64748b");
              globeMaterial.shininess = 15;
              globeMaterial.needsUpdate = true;
            }
          );
        }

        // Configure sunlight directional lighting
        const scene = globe.scene ? globe.scene() : null;
        if (scene) {
          const directionalLight = scene.children.find(
            (obj: any) => obj.type === "DirectionalLight"
          );
          if (directionalLight) {
            directionalLight.position.set(1.5, 1, 1);
            directionalLight.intensity = 1.4;
          }

          // Add volumetric 3D orbiting clouds layer
          const radius = globe.getGlobeRadius ? globe.getGlobeRadius() : 100;
          const loader = new THREE.TextureLoader();
          loader.load(
            "//unpkg.com/three-globe/example/img/clouds.png",
            (cloudsTexture) => {
              if (!globeRef.current) return;
              const cloudsGeo = new THREE.SphereGeometry(radius * 1.004, 75, 75);
              const cloudsMat = new THREE.MeshPhongMaterial({
                map: cloudsTexture,
                transparent: true,
                opacity: 0.82,
                blending: THREE.AdditiveBlending,
              });
              const mesh = new THREE.Mesh(cloudsGeo, cloudsMat);
              mesh.visible = showClouds;
              scene.add(mesh);
              cloudsMeshRef.current = mesh;

              const rotateClouds = () => {
                if (cloudsMeshRef.current) {
                  cloudsMeshRef.current.rotation.y += -0.0003;
                }
                animFrameRef.current = requestAnimationFrame(rotateClouds);
              };
              rotateClouds();
            }
          );
        }
      } catch (err) {
        console.warn("Globe Three.js enhancement notice:", err);
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (cloudsMeshRef.current && globeRef.current?.scene) {
        globeRef.current.scene().remove(cloudsMeshRef.current);
        cloudsMeshRef.current.geometry.dispose();
        (cloudsMeshRef.current.material as THREE.Material).dispose();
        cloudsMeshRef.current = null;
      }
    };
  }, []);

  // Sync clouds visibility with state toggle
  useEffect(() => {
    if (cloudsMeshRef.current) {
      cloudsMeshRef.current.visible = showClouds;
    }
  }, [showClouds]);

  // Synchronize auto-rotation
  useEffect(() => {
    const globe = globeRef.current;
    if (globe && globe.controls()) {
      globe.controls().autoRotate = autoRotate;
      globe.controls().autoRotateSpeed = autoRotate ? 0.45 : 0;
    }
  }, [autoRotate]);

  // Camera focus animation
  useEffect(() => {
    if (focusLocation && globeRef.current) {
      const globe = globeRef.current;
      globe.controls().autoRotate = false;
      setAutoRotate(false);
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

  // Marker click handler
  const handleMarkerClick = useCallback(
    (marker: object) => {
      const m = marker as GlobeMarker;
      onMarkerClick(m);
      const globe = globeRef.current;
      if (globe) {
        globe.controls().autoRotate = false;
        setAutoRotate(false);
        globe.pointOfView({ lat: m.lat, lng: m.lng, altitude: 1.6 }, 1000);
      }
    },
    [onMarkerClick]
  );

  // Polygon click handler (Choropleth Mode)
  const handlePolygonClick = useCallback(
    (polygon: any) => {
      if (!polygon?.properties) return;
      const name = polygon.properties.NAME || polygon.properties.ADMIN;
      const code = (polygon.properties.ISO_A2 || polygon.properties.POSTAL || "").toLowerCase();

      // Find matching CountryInfo
      const matched =
        COUNTRIES_DATA.find((c) => c.code === code) ||
        COUNTRIES_DATA.find((c) => c.name.toLowerCase() === name.toLowerCase());

      if (matched && onSelectCountry) {
        onSelectCountry(matched);
      }

      // Fly to polygon centroid
      const globe = globeRef.current;
      if (globe) {
        globe.controls().autoRotate = false;
        setAutoRotate(false);
        if (matched) {
          globe.pointOfView({ lat: matched.lat, lng: matched.lng, altitude: 1.7 }, 1000);
        }
      }
    },
    [onSelectCountry]
  );

  // Camera toolbar helpers
  const handleZoomIn = useCallback(() => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    globeRef.current.pointOfView(
      { ...pov, altitude: Math.max(1.15, (pov.altitude || 2.0) - 0.35) },
      400
    );
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    globeRef.current.pointOfView(
      { ...pov, altitude: Math.min(3.8, (pov.altitude || 2.0) + 0.35) },
      400
    );
  }, []);

  const handleResetView = useCallback(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.3 }, 1000);
  }, []);

  const currentTexture = THEME_TEXTURES[theme];

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <GlobeGL
        ref={globeRef}
        globeImageUrl={currentTexture.globe}
        bumpImageUrl={currentTexture.bump}
        backgroundImageUrl={currentTexture.bg}
        // ── Atmosphere Glow ──
        atmosphereColor={showAtmosphere ? currentTexture.atmosphere : "transparent"}
        atmosphereAltitude={showAtmosphere ? currentTexture.altitude : 0}
        // ── 1. Points / Beacons Layer (Active in 'beacons', 'arcs', 'labels', 'hexmatrix') ──
        pointsData={
          viewMode === "beacons" || viewMode === "arcs" || viewMode === "labels" || viewMode === "hexmatrix"
            ? markers
            : []
        }
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: object) => SENTIMENT_COLORS[(d as GlobeMarker).sentiment]}
        pointAltitude={0.005} // Surface-level glowing bead, zero spiky cylinders!
        pointRadius={(d: object) => {
          const count = (d as GlobeMarker).articleCount || 1;
          return Math.min(1.15, 0.38 + Math.log10(count + 1) * 0.42);
        }}
        pointResolution={32}
        pointsMerge={false}
        onPointClick={handleMarkerClick}
        pointLabel={(d: object) => renderMarkerTooltip(d as GlobeMarker)}
        // ── 2. Pulsing Sentiment Waves (Radar Ripples across planet crust) ──
        ringsData={viewMode === "beacons" ? markers : []}
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
        // ── 3. Wire Transmission Arcs Layer ('arcs' Mode) ──
        arcsData={viewMode === "arcs" ? arcs : []}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={(d: object) => (d as NewsArc).color}
        arcAltitude={(d: object) => (d as NewsArc).altitude}
        arcStroke={(d: object) => (d as NewsArc).stroke}
        arcDashLength={0.35}
        arcDashGap={1.6}
        arcDashInitialGap={(d: object) => (d as NewsArc).dashInitialGap}
        arcDashAnimateTime={(d: object) => (d as NewsArc).dashAnimateTime}
        arcLabel={(d: object) => renderArcTooltip(d as NewsArc)}
        onArcClick={(d: object) => {
          const arc = d as NewsArc;
          handleMarkerClick(arc.destinationMarker);
        }}
        // ── 4. Hexagonal Density Towers ('hexbin' Mode) ──
        hexBinPointsData={viewMode === "hexbin" ? hexPoints : []}
        hexBinPointLat="lat"
        hexBinPointLng="lng"
        hexBinPointWeight="weight"
        hexBinResolution={3.8}
        hexAltitude={(d: any) => Math.min(0.55, 0.05 + (d.points?.length || 1) * 0.04)}
        hexTopColor={(d: any) => getHexDominantColor(d.points)}
        hexSideColor={(d: any) => getHexDominantColor(d.points, 0.45)}
        hexLabel={(d: any) => renderHexTooltip(d)}
        onHexClick={(d: any) => {
          if (d.points?.[0]?.article) {
            const m = markers.find(
              (mk) =>
                Math.abs(mk.lat - d.lat) < 2.5 && Math.abs(mk.lng - d.lng) < 2.5
            );
            if (m) handleMarkerClick(m);
          }
        }}
        // ── 5. Choropleth Country Polygons ('polygons' Mode) ──
        polygonsData={viewMode === "polygons" ? geoCountries : []}
        polygonGeoJsonGeometry="geometry"
        polygonCapColor={(d: any) => {
          const isHovered = hoveredPolygon === d;
          if (isHovered) return "rgba(6, 182, 212, 0.85)"; // Glowing cyan highlight
          const stats = getCountryStats(d, countryStatsMap);
          if (stats && stats.total > 0) {
            return stats.dominant === "positive"
              ? "rgba(16, 185, 129, 0.5)"
              : stats.dominant === "negative"
              ? "rgba(244, 63, 94, 0.5)"
              : "rgba(245, 158, 11, 0.5)";
          }
          return "rgba(255, 255, 255, 0.04)";
        }}
        polygonSideColor={(d: any) => {
          const stats = getCountryStats(d, countryStatsMap);
          if (stats && stats.total > 0) {
            return stats.dominant === "positive"
              ? "rgba(16, 185, 129, 0.2)"
              : stats.dominant === "negative"
              ? "rgba(244, 63, 94, 0.2)"
              : "rgba(245, 158, 11, 0.2)";
          }
          return "rgba(255, 255, 255, 0.02)";
        }}
        polygonStrokeColor={(d: any) => {
          const isHovered = hoveredPolygon === d;
          if (isHovered) return "rgba(6, 182, 212, 1.0)";
          const stats = getCountryStats(d, countryStatsMap);
          return stats && stats.total > 0
            ? "rgba(255, 255, 255, 0.45)"
            : "rgba(255, 255, 255, 0.12)";
        }}
        polygonAltitude={(d: any) => {
          if (hoveredPolygon === d) return 0.07;
          const stats = getCountryStats(d, countryStatsMap);
          return stats && stats.total > 0
            ? Math.min(0.04, 0.015 + stats.total * 0.003)
            : 0.003;
        }}
        polygonCapCurvatureResolution={3}
        onPolygonHover={setHoveredPolygon}
        onPolygonClick={handlePolygonClick}
        polygonLabel={(d: any) => renderPolygonTooltip(d, countryStatsMap)}
        // ── 5b. Cybernetic Hex Matrix Mode ('hexmatrix' Mode - vasturiano style) ──
        hexPolygonsData={viewMode === "hexmatrix" ? geoCountries : []}
        hexPolygonGeoJsonGeometry="geometry"
        hexPolygonColor={(d: any) => {
          const stats = getCountryStats(d, countryStatsMap);
          if (stats && stats.total > 0) {
            return stats.dominant === "positive"
              ? "rgba(16, 185, 129, 0.75)"
              : stats.dominant === "negative"
              ? "rgba(244, 63, 94, 0.75)"
              : "rgba(245, 158, 11, 0.75)";
          }
          return "rgba(255, 255, 255, 0.12)";
        }}
        hexPolygonAltitude={0.008}
        hexPolygonResolution={3}
        hexPolygonMargin={0.28}
        hexPolygonUseDots={true}
        onHexPolygonClick={handlePolygonClick}
        hexPolygonLabel={(d: any) => renderPolygonTooltip(d, countryStatsMap)}
        // ── 6. 3D Floating Typography Labels ('labels' Mode) ──
        labelsData={viewMode === "labels" ? markers.slice(0, 24) : []}
        labelLat="lat"
        labelLng="lng"
        labelText={(d: any) => `${d.city || d.country}`}
        labelSize={(d: any) =>
          Math.min(1.4, 0.85 + Math.log10((d.articleCount || 1) + 1) * 0.4)
        }
        labelDotRadius={0.45}
        labelColor={(d: any) => SENTIMENT_COLORS[d.sentiment]}
        labelAltitude={0.015}
        labelResolution={3}
        onLabelClick={handleMarkerClick}
        // ── Window Dimensions ──
        animateIn={true}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* ── Interactive Globe Visual Suite Floating Dock ── */}
      <GlobeVisualControls
        currentMode={viewMode}
        onModeChange={setViewMode}
        currentTheme={theme}
        onThemeChange={setTheme}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        showAtmosphere={showAtmosphere}
        onToggleAtmosphere={() => setShowAtmosphere(!showAtmosphere)}
        showClouds={showClouds}
        onToggleClouds={() => setShowClouds(!showClouds)}
        totalArticles={articles.length}
      />
    </div>
  );
}

// ── Tooltip Renderers ──

function renderMarkerTooltip(m: GlobeMarker): string {
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
}

function renderArcTooltip(arc: NewsArc): string {
  return `<div style="
    background: linear-gradient(135deg, rgba(8, 14, 28, 0.96), rgba(13, 23, 42, 0.94));
    padding: 12px 16px;
    border-radius: 14px;
    border: 1px solid rgba(56, 189, 248, 0.5);
    box-shadow: 0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(56, 189, 248, 0.2);
    font-family: Inter, system-ui, sans-serif;
    color: #f1f5f9;
    max-width: 290px;
    pointer-events: none;
  ">
    <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.8px; color:#38bdf8; font-weight:700; margin-bottom:4px;">
      ⚡ Live News Transmission Arc
    </div>
    <div style="font-size:13px; font-weight:700; color:#ffffff; margin-bottom:4px;">
      ${arc.fromName} ⇄ ${arc.toName}
    </div>
    <div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">
      ${arc.articleCount} cross-regional stories syndicated
    </div>
    <div style="font-size:11.5px; color:#cbd5e1; line-height:1.3; font-style:italic;">
      "${arc.topHeadline.slice(0, 80)}..."
    </div>
    <div style="margin-top:6px; font-size:9.5px; color:#38bdf8; text-align:right;">
      Click to open destination hub →
    </div>
  </div>`;
}

function renderHexTooltip(d: any): string {
  const points = d.points || [];
  const count = points.length;
  const topArticle = points[0]?.article;
  const posCount = points.filter((p: any) => p.sentiment === "positive").length;
  const negCount = points.filter((p: any) => p.sentiment === "negative").length;
  const neuCount = count - posCount - negCount;

  return `<div style="
    background: linear-gradient(135deg, rgba(8, 14, 28, 0.96), rgba(13, 23, 42, 0.94));
    padding: 12px 16px;
    border-radius: 14px;
    border: 1px solid rgba(20, 184, 166, 0.5);
    box-shadow: 0 10px 30px rgba(0,0,0,0.7);
    font-family: Inter, system-ui, sans-serif;
    color: #f1f5f9;
    max-width: 280px;
    pointer-events: none;
  ">
    <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.8px; color:#2dd4bf; font-weight:700; margin-bottom:4px;">
      ⬡ Regional Hexagonal Cluster
    </div>
    <div style="font-size:13px; font-weight:700; color:#ffffff; margin-bottom:4px;">
      ${count} Stories in Density Tower
    </div>
    <div style="display:flex; height:4px; border-radius:4px; overflow:hidden; background:rgba(255,255,255,0.08); margin-bottom:6px;">
      <div style="width:${Math.round((posCount / count) * 100)}%; background:#10b981;"></div>
      <div style="width:${Math.round((neuCount / count) * 100)}%; background:#f59e0b;"></div>
      <div style="width:${Math.round((negCount / count) * 100)}%; background:#f43f5e;"></div>
    </div>
    ${
      topArticle
        ? `<div style="font-size:11px; color:#cbd5e1; line-height:1.3;">
            ${topArticle.headline.slice(0, 80)}...
          </div>`
        : ""
    }
  </div>`;
}

function renderPolygonTooltip(d: any, statsMap: Map<string, any>): string {
  const name = d.properties.NAME || d.properties.ADMIN || "Country";
  const code = (d.properties.ISO_A2 || d.properties.POSTAL || "").toLowerCase();
  const countryMatch = COUNTRIES_DATA.find((c) => c.code === code) || COUNTRIES_DATA.find((c) => c.name.toLowerCase() === name.toLowerCase());
  const flag = countryMatch?.flag || "🌍";

  const stats = getCountryStats(d, statsMap);
  const total = stats?.total || 0;

  return `<div style="
    background: linear-gradient(135deg, rgba(8, 14, 28, 0.96), rgba(13, 23, 42, 0.94));
    padding: 12px 16px;
    border-radius: 14px;
    border: 1px solid rgba(6, 182, 212, 0.5);
    box-shadow: 0 10px 30px rgba(0,0,0,0.7);
    font-family: Inter, system-ui, sans-serif;
    color: #f1f5f9;
    min-width: 200px;
    pointer-events: none;
  ">
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
      <span style="font-size:18px;">${flag}</span>
      <span style="font-size:13px; font-weight:700; color:#ffffff;">${name}</span>
    </div>
    <div style="font-size:11px; color:${total > 0 ? "#10b981" : "#94a3b8"}; margin-bottom:4px;">
      ${total > 0 ? `${total} Active Global Dispatches` : "No active dispatches"}
    </div>
    ${
      total > 0
        ? `<div style="font-size:10px; color:#94a3b8;">
            Sentiment: <span style="font-weight:600; text-transform:uppercase; color:${
              stats.dominant === "positive" ? "#10b981" : stats.dominant === "negative" ? "#f43f5e" : "#f59e0b"
            }">${stats.dominant}</span>
          </div>`
        : ""
    }
    <div style="margin-top:6px; font-size:9.5px; color:#06b6d4; font-weight:600;">
      Click to open Country Intelligence →
    </div>
  </div>`;
}

function getCountryStats(polygon: any, statsMap: Map<string, any>) {
  if (!polygon?.properties) return null;
  const name = (polygon.properties.NAME || polygon.properties.ADMIN || "").toLowerCase();
  const code = (polygon.properties.ISO_A2 || polygon.properties.POSTAL || "").toLowerCase();

  return statsMap.get(name) || statsMap.get(code) || null;
}

function getHexDominantColor(points: any[], alpha = 1.0): string {
  if (!points || points.length === 0) return `rgba(245, 158, 11, ${alpha})`;
  let pos = 0,
    neu = 0,
    neg = 0;
  points.forEach((p) => {
    if (p.sentiment === "positive") pos++;
    else if (p.sentiment === "negative") neg++;
    else neu++;
  });
  if (pos >= neu && pos >= neg) return `rgba(16, 185, 129, ${alpha})`;
  if (neg >= neu) return `rgba(244, 63, 94, ${alpha})`;
  return `rgba(245, 158, 11, ${alpha})`;
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
