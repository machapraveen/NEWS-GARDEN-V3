import { useState } from "react";
import {
  Layers,
  Radio,
  Zap,
  Box,
  Map,
  Tag,
  Moon,
  Sun,
  Shield,
  RotateCw,
  Plus,
  Minus,
  Crosshair,
  Sparkles,
  Cloud,
  Grid,
  Network,
  Eye,
  Compass,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeopoliticalRegion } from "@/data/countriesData";

export type GlobeViewMode =
  | "beacons"
  | "arcs"
  | "hexmatrix"
  | "hexbin"
  | "polygons"
  | "cables"
  | "labels";

export type GlobeTheme = "night" | "day" | "cyber" | "hologram";

interface GlobeVisualControlsProps {
  currentMode: GlobeViewMode;
  onModeChange: (mode: GlobeViewMode) => void;
  currentTheme: GlobeTheme;
  onThemeChange: (theme: GlobeTheme) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  showAtmosphere: boolean;
  onToggleAtmosphere: () => void;
  showClouds: boolean;
  onToggleClouds: () => void;
  showShield: boolean;
  onToggleShield: () => void;
  enableClickArcs: boolean;
  onToggleClickArcs: () => void;
  onSelectRegion?: (region: GeopoliticalRegion) => void;
  totalArticles: number;
}

const MODES: { id: GlobeViewMode; label: string; icon: any; desc: string }[] = [
  { id: "beacons", label: "Radar", icon: Radio, desc: "Pulsing surface beacons & sentiment resonance waves" },
  { id: "arcs", label: "Wire Arcs", icon: Zap, desc: "Cross-continental news transmission & syndication streams" },
  { id: "hexmatrix", label: "Hex Matrix", icon: Grid, desc: "Cybernetic glowing hexagonal dot-matrix country meshes (vasturiano style)" },
  { id: "hexbin", label: "Hex Towers", icon: Box, desc: "3D hexagonal density prisms scaled by news concentration" },
  { id: "polygons", label: "Choropleth", icon: Map, desc: "Interactive sovereign country borders with real-time sentiment glow" },
  { id: "cables", label: "Conduits", icon: Network, desc: "Intercontinental trans-oceanic fiber routes with animated photon pulses" },
  { id: "labels", label: "3D Labels", icon: Tag, desc: "Floating spatial typography for world metropolitan hubs" },
];

const THEMES: { id: GlobeTheme; label: string; icon: any }[] = [
  { id: "night", label: "Night Lights", icon: Moon },
  { id: "day", label: "Day Satellite", icon: Sun },
  { id: "cyber", label: "Cyber Matrix", icon: Shield },
  { id: "hologram", label: "Hologram", icon: Eye },
];

const REGIONS: GeopoliticalRegion[] = [
  "All",
  "Middle East",
  "Americas",
  "Europe",
  "Asia-Pacific",
  "Africa",
];

export default function GlobeVisualControls({
  currentMode,
  onModeChange,
  currentTheme,
  onThemeChange,
  autoRotate,
  onToggleAutoRotate,
  onZoomIn,
  onZoomOut,
  onResetView,
  showAtmosphere,
  onToggleAtmosphere,
  showClouds,
  onToggleClouds,
  showShield,
  onToggleShield,
  enableClickArcs,
  onToggleClickArcs,
  onSelectRegion,
  totalArticles,
}: GlobeVisualControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2 select-none">
      {/* Floating dock */}
      <div className="glass rounded-2xl border border-white/[0.12] bg-black/65 backdrop-blur-2xl shadow-2xl p-2.5 max-w-sm sm:max-w-md w-auto text-foreground transition-all duration-300">
        {/* Dock Header & Toggle */}
        <div className="flex items-center justify-between gap-3 px-1 pb-1.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="font-display text-xs font-bold tracking-wider text-primary">
              GLOBE VISUAL SUITE
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              ({totalArticles} stories)
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-muted-foreground hover:text-white hover:bg-white/[0.08] transition-colors"
            title={isExpanded ? "Collapse Controls" : "Expand Controls"}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="pt-2 space-y-2.5 animate-in fade-in-50 duration-200">
            {/* ── 1. Visualization Layer Modes (7 Globe Showcase Styles) ── */}
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-wider px-1 mb-1.5 flex items-center justify-between">
                <span>Globe Visual Mode</span>
                <span className="text-[9px] text-primary/80 lowercase truncate max-w-[170px]">
                  {MODES.find((m) => m.id === currentMode)?.label} active
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const isActive = currentMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => onModeChange(m.id)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all group ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(20,184,166,0.35)]"
                          : "bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:text-white hover:bg-white/[0.08]"
                      }`}
                      title={m.desc}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] font-semibold tracking-tight leading-tight">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 2. Globe Basemap Themes (4 Environments) ── */}
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-wider px-1 mb-1.5">
                Basemap Environment
              </div>
              <div className="grid grid-cols-4 gap-1">
                {THEMES.map((t) => {
                  const Icon = t.icon;
                  const isActive = currentTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onThemeChange(t.id)}
                      className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-xl border text-xs font-medium transition-all ${
                        isActive
                          ? "bg-white/[0.15] text-white border-white/[0.3] shadow-sm"
                          : "bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="text-[10px] truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 3. Quick Cinematic Region Focus ── */}
            {onSelectRegion && (
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-wider px-1 mb-1 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-primary/70" />
                  <span>Cinematic Region Jump</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => onSelectRegion(r)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-muted-foreground hover:text-white hover:bg-primary/20 hover:border-primary/30 transition-all shrink-0"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── 4. Planetary FX & Camera Tools ── */}
            <div className="pt-1.5 border-t border-white/[0.08] flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                {/* Auto Rotate Toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggleAutoRotate}
                  className={`h-7 px-2 rounded-lg text-[10px] border transition-all ${
                    autoRotate
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-transparent text-muted-foreground border-white/[0.08] hover:text-white"
                  }`}
                  title="Toggle Auto-Rotation"
                >
                  <RotateCw
                    className={`w-3 h-3 mr-1 ${autoRotate ? "animate-spin" : ""}`}
                    style={{ animationDuration: "6s" }}
                  />
                  <span>Rotate</span>
                </Button>

                {/* Atmosphere Aura Toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggleAtmosphere}
                  className={`h-7 px-2 rounded-lg text-[10px] border transition-all ${
                    showAtmosphere
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-transparent text-muted-foreground border-white/[0.08] hover:text-white"
                  }`}
                  title="Toggle Atmospheric Glow"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  <span>Aura</span>
                </Button>

                {/* 3D Atmospheric Clouds Toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggleClouds}
                  className={`h-7 px-2 rounded-lg text-[10px] border transition-all ${
                    showClouds
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                      : "bg-transparent text-muted-foreground border-white/[0.08] hover:text-white"
                  }`}
                  title="Toggle 3D Orbiting Clouds Layer (vasturiano style)"
                >
                  <Cloud className="w-3 h-3 mr-1" />
                  <span>Clouds</span>
                </Button>

                {/* Planetary Energy Shield Toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggleShield}
                  className={`h-7 px-2 rounded-lg text-[10px] border transition-all ${
                    showShield
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-transparent text-muted-foreground border-white/[0.08] hover:text-white"
                  }`}
                  title="Toggle Planetary Defense Resonance Wave (vasturiano earth-shield)"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  <span>Shield</span>
                </Button>

                {/* Click-to-Emit Laser Flight Arcs */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggleClickArcs}
                  className={`h-7 px-2 rounded-lg text-[10px] border transition-all ${
                    enableClickArcs
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      : "bg-transparent text-muted-foreground border-white/[0.08] hover:text-white"
                  }`}
                  title="Toggle Click-to-Emit Interactive Laser Arcs (vasturiano emit-arcs-on-click)"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  <span>Pulse</span>
                </Button>
              </div>

              {/* Zoom In, Out & Reset Orbit */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onZoomIn}
                  className="h-7 w-7 rounded-lg border border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.08]"
                  title="Zoom In"
                >
                  <Plus className="w-3 h-3" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onZoomOut}
                  className="h-7 w-7 rounded-lg border border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.08]"
                  title="Zoom Out"
                >
                  <Minus className="w-3 h-3" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onResetView}
                  className="h-7 w-7 rounded-lg border border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.08]"
                  title="Reset Orbit & Center View"
                >
                  <Crosshair className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
