import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import GlobeGL from "react-globe.gl";
import * as THREE from "three";
import { GlobeMarker, getGlobeMarkers, Category, NewsArticle } from "@/data/mockNews";
import { generateNewsArcs, type NewsArc } from "@/data/globeArcs";
import { GLOBAL_NEWS_CABLES } from "@/data/globePaths";
import {
  COUNTRIES_DATA,
  type CountryInfo,
  type GeopoliticalRegion,
  REGION_CENTERS,
} from "@/data/countriesData";
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
  selectedCountry?: CountryInfo | null;
  isSidebarOpen?: boolean;
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

// ─── Basemap Textures & Assets (vasturiano/globe.gl showcase environments) ───
const THEME_TEXTURES: Record<
  GlobeTheme,
  {
    globe: string;
    bump: string;
    bg: string;
    atmosphere: string;
    altitude: number;
    showGlobe: boolean;
  }
> = {
  night: {
    globe: "//unpkg.com/three-globe/example/img/earth-night.jpg",
    bump: "//unpkg.com/three-globe/example/img/earth-topology.png",
    bg: "//unpkg.com/three-globe/example/img/night-sky.png",
    atmosphere: "#06b6d4",
    altitude: 0.22,
    showGlobe: true,
  },
  day: {
    globe: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    bump: "//unpkg.com/three-globe/example/img/earth-topology.png",
    bg: "//unpkg.com/three-globe/example/img/night-sky.png",
    atmosphere: "#38bdf8",
    altitude: 0.28,
    showGlobe: true,
  },
  cyber: {
    globe: "//unpkg.com/three-globe/example/img/earth-dark.jpg",
    bump: "//unpkg.com/three-globe/example/img/earth-topology.png",
    bg: "//unpkg.com/three-globe/example/img/night-sky.png",
    atmosphere: "#10b981",
    altitude: 0.18,
    showGlobe: true,
  },
  hologram: {
    globe: "",
    bump: "",
    bg: "//unpkg.com/three-globe/example/img/night-sky.png",
    atmosphere: "rgba(20, 184, 166, 0.4)",
    altitude: 0.15,
    showGlobe: false, // Transparent hollow hologram (vasturiano hollow-globe example)
  },
};

export default function Globe({
  onMarkerClick,
  selectedCategory,
  showHeatmap,
  articles,
  focusLocation,
  onSelectCountry,
  selectedCountry,
  isSidebarOpen,
}: GlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Visual Modes & Themes
  const [viewMode, setViewMode] = useState<GlobeViewMode>("beacons");
  const [theme, setTheme] = useState<GlobeTheme>("night");
  const [autoRotate, setAutoRotate] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);

  // Planetary FX
  const [showClouds, setShowClouds] = useState(true);
  const [showShield, setShowShield] = useState(false);
  const [enableClickArcs, setEnableClickArcs] = useState(true);
  const [clickArcs, setClickArcs] = useState<any[]>([]);
  const [clickRings, setClickRings] = useState<any[]>([]);
  const prevCoordsRef = useRef<{ lat: number; lng: number }>({ lat: 20, lng: 0 });

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

  // Load World GeoJSON dataset for Country Choropleth & Hex Matrix Mode
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

  // Combined arcs: static news arcs + interactive click-to-emit laser arcs
  const activeArcs = useMemo(() => {
    const base = viewMode === "arcs" ? arcs : [];
    return [...base, ...clickArcs];
  }, [viewMode, arcs, clickArcs]);

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

  // Planetary Shield ring (vasturiano earth-shield example)
  const shieldRing = useMemo(
    () => ({
      lat: 90,
      lng: 0,
      isShield: true,
      sentiment: "positive" as const,
      articleCount: 10,
    }),
    []
  );

  // Check if a GeoJSON polygon feature matches the currently selected country
  const isSelectedPolygon = useCallback(
    (feature: any) => {
      if (!selectedCountry || !feature?.properties) return false;
      const pName = (feature.properties.NAME || feature.properties.ADMIN || "").toLowerCase().trim();
      const pCode = (feature.properties.ISO_A2 || feature.properties.POSTAL || "").toLowerCase().trim();
      const pCode3 = (feature.properties.ISO_A3 || feature.properties.ADM0_A3 || "").toLowerCase().trim();
      const sName = selectedCountry.name.toLowerCase().trim();
      const sCode = selectedCountry.code.toLowerCase().trim();
      return (
        pCode === sCode ||
        pName === sName ||
        pCode3 === sCode ||
        pName.includes(sName) ||
        sName.includes(pName)
      );
    },
    [selectedCountry]
  );

  // Active polygons: if in 'polygons' mode, show all countries; otherwise, if a country is selected, display its polygon!
  const activePolygons = useMemo(() => {
    if (viewMode === "polygons") {
      return geoCountries;
    }
    if (selectedCountry) {
      return geoCountries.filter(isSelectedPolygon);
    }
    return [];
  }, [viewMode, geoCountries, selectedCountry, isSelectedPolygon]);

  // Target radar beacon for selected country
  const selectedCountryRing = useMemo(() => {
    if (!selectedCountry) return null;
    return {
      lat: selectedCountry.lat,
      lng: selectedCountry.lng,
      isSelectedBeacon: true,
      sentiment: "positive" as const,
      articleCount: 15,
    };
  }, [selectedCountry]);

  // Combined rings: markers + arrival ripples + planetary shield + selected country radar
  const activeRings = useMemo(() => {
    const list: any[] = viewMode === "beacons" ? [...markers] : [];
    if (clickRings.length > 0) list.push(...clickRings);
    if (showShield) list.push(shieldRing);
    if (selectedCountryRing) list.push(selectedCountryRing);
    return list;
  }, [viewMode, markers, clickRings, showShield, shieldRing, selectedCountryRing]);

  // Active labels: show city/country labels and always spotlight selected country with a 3D flag pin!
  const activeLabels = useMemo(() => {
    const base = viewMode === "labels" ? markers.slice(0, 32) : [];
    if (selectedCountry) {
      const pin = {
        lat: selectedCountry.lat,
        lng: selectedCountry.lng,
        city: `${selectedCountry.flag} ${selectedCountry.name.toUpperCase()}`,
        country: selectedCountry.capital,
        sentiment: "positive" as const,
        articleCount: 12,
        isSelectedCountryPin: true,
      };
      return [
        pin,
        ...base.filter(
          (b) =>
            Math.abs(b.lat - selectedCountry.lat) > 2 ||
            Math.abs(b.lng - selectedCountry.lng) > 2
        ),
      ];
    }
    return base;
  }, [viewMode, markers, selectedCountry]);

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
      cloudsMeshRef.current.visible = showClouds && theme !== "hologram";
    }
  }, [showClouds, theme]);

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

  // Polygon click handler (Choropleth & Hex Matrix Mode)
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
          globe.pointOfView({ lat: matched.lat, lng: matched.lng, altitude: 0.65 }, 1000);
        }
      }
    },
    [onSelectCountry]
  );

  // Interactive Click-to-Emit Laser Flight Arcs (vasturiano emit-arcs-on-click example)
  const handleGlobeClick = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      if (!enableClickArcs) return;

      const startLat = prevCoordsRef.current.lat;
      const startLng = prevCoordsRef.current.lng;
      const endLat = lat;
      const endLng = lng;

      prevCoordsRef.current = { lat, lng };

      const newArc = {
        startLat,
        startLng,
        endLat,
        endLng,
        color: ["#38bdf8", "#f43f5e"],
        altitude: 0.32,
        stroke: 1.6,
        dashInitialGap: 0,
        dashAnimateTime: 1200,
        isClickPulse: true,
      };

      setClickArcs((prev) => [...prev, newArc]);
      setTimeout(() => {
        setClickArcs((prev) => prev.filter((a) => a !== newArc));
      }, 2400);

      const targetRing = {
        lat: endLat,
        lng: endLng,
        sentiment: "positive" as const,
        articleCount: 4,
        isTargetRipple: true,
      };
      setClickRings((prev) => [...prev, targetRing]);
      setTimeout(() => {
        setClickRings((prev) => prev.filter((r) => r !== targetRing));
      }, 2200);
    },
    [enableClickArcs]
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

  // Quick Cinematic Regional Focus
  const handleSelectRegion = useCallback((region: GeopoliticalRegion) => {
    const coords = REGION_CENTERS[region] || REGION_CENTERS["All"];
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
      setAutoRotate(false);
      globeRef.current.pointOfView(coords, 1400);
    }
  }, []);

  const currentTexture = THEME_TEXTURES[theme];

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <GlobeGL
        ref={globeRef}
        showGlobe={currentTexture.showGlobe}
        globeImageUrl={currentTexture.globe}
        bumpImageUrl={currentTexture.bump}
        backgroundImageUrl={currentTexture.bg}
        onGlobeClick={handleGlobeClick}
        // ── Atmosphere Glow ──
        showAtmosphere={theme === "hologram" ? false : showAtmosphere}
        atmosphereColor={showAtmosphere ? currentTexture.atmosphere : "transparent"}
        atmosphereAltitude={showAtmosphere ? currentTexture.altitude : 0}
        // ── 1. Points / Beacons Layer (Active in 'beacons', 'arcs', 'labels', 'hexmatrix', 'cables') ──
        pointsData={
          viewMode === "beacons" ||
          viewMode === "arcs" ||
          viewMode === "labels" ||
          viewMode === "hexmatrix" ||
          viewMode === "cables"
            ? markers
            : []
        }
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: object) => SENTIMENT_COLORS[(d as GlobeMarker).sentiment]}
        pointAltitude={0.005} // Surface-level glowing bead, zero spiky cylinders
        pointRadius={(d: object) => {
          const count = (d as GlobeMarker).articleCount || 1;
          return Math.min(1.15, 0.38 + Math.log10(count + 1) * 0.42);
        }}
        pointResolution={32}
        pointsMerge={false}
        onPointClick={handleMarkerClick}
        pointLabel={(d: object) => renderMarkerTooltip(d as GlobeMarker)}
        // ── 2. Pulsing Sentiment Waves & Planetary Shield ──
        ringsData={activeRings}
        ringLat="lat"
        ringLng="lng"
        ringAltitude={(d: any) => (d.isSelectedBeacon ? 0.025 : d.isShield ? 0.22 : 0.003)}
        ringColor={(d: any) => {
          if (d.isSelectedBeacon) return () => "rgba(6, 182, 212, 0.95)";
          if (d.isShield) return () => "rgba(6, 182, 212, 0.45)";
          const m = d as GlobeMarker;
          const c = SENTIMENT_COLORS[m.sentiment] || "#10b981";
          return [c, "rgba(0,0,0,0)"];
        }}
        ringMaxRadius={(d: any) => {
          if (d.isSelectedBeacon) return 6.5;
          if (d.isShield) return 180;
          const m = d as GlobeMarker;
          const boost = showHeatmap ? 1.5 : 1.0;
          return (2.2 + Math.min(3.2, Math.log10((m.articleCount || 1) + 1) * 2.0)) * boost;
        }}
        ringPropagationSpeed={(d: any) => (d.isSelectedBeacon ? 4.5 : d.isShield ? 20 : showHeatmap ? 1.6 : 1.1)}
        ringRepeatPeriod={(d: any) => (d.isSelectedBeacon ? 900 : d.isShield ? 2400 : showHeatmap ? 1400 : 2000)}
        // ── 3. Wire Transmission Arcs & Interactive Photon Lasers ('arcs' Mode & Globe Clicks) ──
        arcsData={activeArcs}
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
        arcsTransitionDuration={300}
        onArcClick={(d: object) => {
          const arc = d as NewsArc;
          if (arc.destinationMarker) handleMarkerClick(arc.destinationMarker);
        }}
        // ── 4. Inter-Continental Fiber News Conduits ('cables' Mode - vasturiano submarine-cables) ──
        pathsData={viewMode === "cables" ? GLOBAL_NEWS_CABLES : []}
        pathPoints="coords"
        pathPointLat={(p: any) => p[1]}
        pathPointLng={(p: any) => p[0]}
        pathColor={(d: any) => d.color}
        pathStroke={2.4}
        pathDashLength={0.14}
        pathDashGap={0.015}
        pathDashAnimateTime={8000}
        pathLabel={(d: any) => `<b>🌐 ${d.name}</b><br/><i>${d.region} Continental Concourse</i>`}
        pathTransitionDuration={300}
        // ── 5. Hexagonal Density Towers ('hexbin' Mode - vasturiano world-population) ──
        hexBinPointsData={viewMode === "hexbin" ? hexPoints : []}
        hexBinPointLat="lat"
        hexBinPointLng="lng"
        hexBinPointWeight="weight"
        hexBinResolution={3.8}
        hexAltitude={(d: any) => Math.min(0.55, 0.05 + (d.points?.length || 1) * 0.04)}
        hexTopColor={(d: any) => getHexDominantColor(d.points)}
        hexSideColor={(d: any) => getHexDominantColor(d.points, 0.45)}
        hexLabel={(d: any) => renderHexTooltip(d)}
        hexTransitionDuration={300}
        onHexClick={(d: any) => {
          if (d.points?.[0]?.article) {
            const m = markers.find(
              (mk) =>
                Math.abs(mk.lat - d.lat) < 2.5 && Math.abs(mk.lng - d.lng) < 2.5
            );
            if (m) handleMarkerClick(m);
          }
        }}
        // ── 6. Choropleth Country Polygons ('polygons' Mode & Selected Country Focus) ──
        polygonsData={activePolygons}
        polygonGeoJsonGeometry="geometry"
        polygonCapColor={(d: any) => {
          const isSelected = isSelectedPolygon(d);
          if (isSelected) return "rgba(6, 182, 212, 0.95)"; // Electric glowing cyan spotlight
          const isHovered = hoveredPolygon === d;
          if (isHovered) return "rgba(6, 182, 212, 0.85)";
          const stats = getCountryStats(d, countryStatsMap);
          if (stats && stats.total > 0) {
            return stats.dominant === "positive"
              ? "rgba(16, 185, 129, 0.55)"
              : stats.dominant === "negative"
              ? "rgba(244, 63, 94, 0.55)"
              : "rgba(245, 158, 11, 0.55)";
          }
          return "rgba(255, 255, 255, 0.06)";
        }}
        polygonSideColor={(d: any) => {
          const isSelected = isSelectedPolygon(d);
          if (isSelected) return "rgba(6, 182, 212, 0.65)"; // Glowing 3D cyan wall
          const stats = getCountryStats(d, countryStatsMap);
          if (stats && stats.total > 0) {
            return stats.dominant === "positive"
              ? "rgba(16, 185, 129, 0.25)"
              : stats.dominant === "negative"
              ? "rgba(244, 63, 94, 0.25)"
              : "rgba(245, 158, 11, 0.25)";
          }
          return "rgba(255, 255, 255, 0.02)";
        }}
        polygonStrokeColor={(d: any) => {
          const isSelected = isSelectedPolygon(d);
          if (isSelected) return "#38bdf8"; // Bright neon cyan border
          const isHovered = hoveredPolygon === d;
          if (isHovered) return "rgba(6, 182, 212, 1.0)";
          const stats = getCountryStats(d, countryStatsMap);
          return stats && stats.total > 0
            ? "rgba(255, 255, 255, 0.5)"
            : "rgba(255, 255, 255, 0.15)";
        }}
        polygonAltitude={(d: any) => {
          const isSelected = isSelectedPolygon(d);
          if (isSelected) return 0.16; // 3D elevated plateau standing tall
          if (hoveredPolygon === d) return 0.10; // Lift on hover
          const stats = getCountryStats(d, countryStatsMap);
          return stats && stats.total > 0
            ? Math.min(0.06, 0.02 + stats.total * 0.004)
            : 0.005;
        }}
        polygonCapCurvatureResolution={3}
        polygonsTransitionDuration={300}
        onPolygonHover={setHoveredPolygon}
        onPolygonClick={handlePolygonClick}
        polygonLabel={(d: any) => renderPolygonTooltip(d, countryStatsMap)}
        // ── 7. Cybernetic Hex Matrix Mode ('hexmatrix' Mode - vasturiano hexed-polygons) ──
        hexPolygonsData={viewMode === "hexmatrix" ? geoCountries : []}
        hexPolygonGeoJsonGeometry="geometry"
        hexPolygonColor={(d: any) => {
          if (isSelectedPolygon(d)) return "rgba(6, 182, 212, 1.0)";
          const stats = getCountryStats(d, countryStatsMap);
          if (stats && stats.total > 0) {
            return stats.dominant === "positive"
              ? "rgba(16, 185, 129, 0.8)"
              : stats.dominant === "negative"
              ? "rgba(244, 63, 94, 0.8)"
              : "rgba(245, 158, 11, 0.8)";
          }
          return "rgba(255, 255, 255, 0.14)";
        }}
        hexPolygonAltitude={(d: any) => (isSelectedPolygon(d) ? 0.05 : 0.008)}
        hexPolygonResolution={3}
        hexPolygonMargin={0.28}
        hexPolygonUseDots={true}
        hexPolygonsTransitionDuration={300}
        onHexPolygonClick={handlePolygonClick}
        hexPolygonLabel={(d: any) => renderPolygonTooltip(d, countryStatsMap)}
        // ── 8. 3D Floating Typography Labels ('labels' Mode & Spotlight Pin) ──
        labelsData={activeLabels}
        labelLat="lat"
        labelLng="lng"
        labelText={(d: any) => `${d.city || d.country}`}
        labelSize={(d: any) =>
          d.isSelectedCountryPin
            ? 1.85
            : Math.min(1.4, 0.85 + Math.log10((d.articleCount || 1) + 1) * 0.4)
        }
        labelDotRadius={(d: any) => (d.isSelectedCountryPin ? 0.8 : 0.45)}
        labelColor={(d: any) =>
          d.isSelectedCountryPin ? "#38bdf8" : SENTIMENT_COLORS[d.sentiment]
        }
        labelAltitude={(d: any) => (d.isSelectedCountryPin ? 0.06 : 0.015)}
        labelResolution={3}
        labelsTransitionDuration={300}
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
        showShield={showShield}
        onToggleShield={() => setShowShield(!showShield)}
        enableClickArcs={enableClickArcs}
        onToggleClickArcs={() => setEnableClickArcs(!enableClickArcs)}
        onSelectRegion={handleSelectRegion}
        totalArticles={articles.length}
        isSidebarOpen={isSidebarOpen}
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

  return `
    <div style="
      background: rgba(10, 15, 29, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 14px;
      padding: 12px 14px;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.75), 0 0 20px ${sentBg};
      backdrop-filter: blur(16px);
      max-width: 320px;
      pointer-events: none;
      line-height: 1.4;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-weight: 700; font-size: 13px; color: #ffffff;">📍 ${m.city}</span>
          <span style="color: #94a3b8; font-size: 11px;">(${m.country})</span>
        </div>
        <span style="
          background: ${sentBg};
          border: 1px solid ${sentBorder};
          color: ${sentColor};
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 9999px;
        ">
          ${m.sentiment}
        </span>
      </div>

      <div style="font-size: 12px; font-weight: 600; color: #f1f5f9; margin-bottom: 6px;">
        ${escapeHtml(m.topArticle.headline)}
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #94a3b8; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
        <span>🏷️ ${categoryBadge} • ${timeAgo}</span>
        <span style="color: ${sentColor}; font-weight: 600;">📡 ${totalInHub} stories</span>
      </div>
    </div>
  `;
}

function renderArcTooltip(arc: any): string {
  const fromCity = arc.fromName || arc.sourceCity || "Origin Hub";
  const toCity = arc.toName || arc.destinationCity || "Destination Hub";
  const headline = arc.topHeadline || arc.headline || "Trans-continental News Conduit";
  const count = arc.articleCount || 1;
  const sent = arc.destinationMarker?.sentiment || "positive";
  const sentColor = SENTIMENT_COLORS[sent as keyof typeof SENTIMENT_COLORS] || "#38bdf8";

  return `
    <div style="
      background: rgba(10, 15, 29, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 12px;
      padding: 10px 12px;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(14px);
      max-width: 280px;
      pointer-events: none;
    ">
      <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #38bdf8; margin-bottom: 4px; letter-spacing: 0.05em;">
        ⚡ Information Transmission Arc
      </div>
      <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px;">
        ${escapeHtml(fromCity)} ➔ ${escapeHtml(toCity)}
      </div>
      <div style="font-size: 11px; color: #cbd5e1; font-style: italic;">
        "${escapeHtml(headline.slice(0, 80))}${headline.length > 80 ? "..." : ""}"
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: ${sentColor}; margin-top: 6px; font-weight: 600; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
        <span>📡 Syndication Traffic</span>
        <span>${count} Active Dispatches</span>
      </div>
    </div>
  `;
}

function renderHexTooltip(d: any): string {
  const count = d.points?.length || 1;
  const sampleArticle = d.points?.[0]?.article;
  const topHeadline = sampleArticle?.headline || "Global News Concentration";
  const country = sampleArticle?.location?.country || "International Region";

  return `
    <div style="
      background: rgba(10, 15, 29, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 12px;
      padding: 10px 12px;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(14px);
      max-width: 280px;
      pointer-events: none;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 11px; font-weight: 700; color: #38bdf8;">🔷 Hex Density Column</span>
        <span style="font-size: 10px; font-weight: 700; color: #10b981;">${count} Articles</span>
      </div>
      <div style="font-size: 11px; color: #e2e8f0; font-weight: 600; margin-bottom: 2px;">
        ${country}
      </div>
      <div style="font-size: 10px; color: #94a3b8; font-style: italic;">
        "${escapeHtml(topHeadline.slice(0, 75))}..."
      </div>
    </div>
  `;
}

function renderPolygonTooltip(
  polygon: any,
  statsMap: Map<string, any>
): string {
  if (!polygon?.properties) return "";
  const name = polygon.properties.NAME || polygon.properties.ADMIN || "Territory";
  const code = (polygon.properties.ISO_A2 || polygon.properties.POSTAL || "").toUpperCase();

  const stats = getCountryStats(polygon, statsMap);
  const total = stats?.total || 0;
  const dominant = stats?.dominant || "neutral";
  const topHeadline = stats?.topHeadline || "Monitoring verified news channels";

  const color =
    total > 0
      ? SENTIMENT_COLORS[dominant as "positive" | "neutral" | "negative"]
      : "#94a3b8";

  // Flag lookup
  const countryMatch = COUNTRIES_DATA.find((c) => c.code === code.toLowerCase() || c.name.toLowerCase() === name.toLowerCase());
  const flag = countryMatch ? countryMatch.flag : "🌐";

  return `
    <div style="
      background: rgba(10, 15, 29, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 14px;
      padding: 12px 14px;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(16px);
      max-width: 300px;
      pointer-events: none;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 16px;">${flag}</span>
          <span style="font-size: 13px; font-weight: 700; color: #ffffff;">${name}</span>
          <span style="font-size: 10px; color: #94a3b8;">(${code})</span>
        </div>
        <span style="
          background: rgba(255,255,255,0.08);
          color: ${color};
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 9999px;
        ">
          ${total > 0 ? dominant : "Monitored"}
        </span>
      </div>

      <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 6px; line-height: 1.35;">
        ${escapeHtml(topHeadline.slice(0, 90))}${topHeadline.length > 90 ? "..." : ""}
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
        <span>Coverage: <b style="color: #ffffff;">${total}</b> Dispatches</span>
        <span style="color: #38bdf8; font-weight: 600;">Click to focus</span>
      </div>
    </div>
  `;
}

// ── Helpers ──

function getCountryStats(polygon: any, statsMap: Map<string, any>) {
  if (!polygon?.properties) return null;
  const name = (polygon.properties.NAME || polygon.properties.ADMIN || "").toLowerCase();
  const code = (polygon.properties.ISO_A2 || polygon.properties.POSTAL || "").toLowerCase();

  return statsMap.get(name) || statsMap.get(code) || null;
}

function getHexDominantColor(points: any[], opacity = 0.85): string {
  if (!points || points.length === 0) return `rgba(245, 158, 11, ${opacity})`;
  let pos = 0;
  let neg = 0;
  let neu = 0;

  points.forEach((p) => {
    if (p.sentiment === "positive") pos++;
    else if (p.sentiment === "negative") neg++;
    else neu++;
  });

  if (pos >= neu && pos >= neg) return `rgba(16, 185, 129, ${opacity})`;
  if (neg >= neu) return `rgba(244, 63, 94, ${opacity})`;
  return `rgba(245, 158, 11, ${opacity})`;
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
