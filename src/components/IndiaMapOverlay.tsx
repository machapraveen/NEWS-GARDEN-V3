import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { ArrowLeft, Search, X, Play, Tv } from 'lucide-react';
import { NEWS_CHANNELS, type Channel } from '@/data/newsChannels';

// District-level GeoJSON with modern boundaries (includes Telangana, Ladakh, etc.)
const INDIA_DISTRICTS_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@ef25ebc/geojson/india.geojson';

interface GeoFeature {
  type: string;
  properties: Record<string, unknown>;
  id?: string | number;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoCollection {
  type: string;
  features: GeoFeature[];
}

// Map GeoJSON state names → our channel data keys
const STATE_NAME_MAP: Record<string, string> = {
  'Andhra Pradesh': 'Andhra Pradesh',
  'Arunachal Pradesh': 'Arunachal Pradesh',
  'Assam': 'Assam',
  'Bihar': 'Bihar',
  'Chhattisgarh': 'Chhattisgarh',
  'Goa': 'Goa',
  'Gujarat': 'Gujarat',
  'Haryana': 'Haryana',
  'Himachal Pradesh': 'Himachal Pradesh',
  'Jharkhand': 'Jharkhand',
  'Karnataka': 'Karnataka',
  'Kerala': 'Kerala',
  'Madhya Pradesh': 'Madhya Pradesh',
  'Maharashtra': 'Maharashtra',
  'Manipur': 'Manipur',
  'Meghalaya': 'Meghalaya',
  'Mizoram': 'Mizoram',
  'Nagaland': 'Nagaland',
  'Odisha': 'Odisha',
  'Punjab': 'Punjab',
  'Rajasthan': 'Rajasthan',
  'Sikkim': 'Sikkim',
  'Tamil Nadu': 'Tamil Nadu',
  'Telangana': 'Telangana',
  'Tripura': 'Tripura',
  'Uttar Pradesh': 'Uttar Pradesh',
  'Uttarakhand': 'Uttarakhand',
  'West Bengal': 'West Bengal',
  'Jammu & Kashmir': 'Jammu & Kashmir',
  'Jammu and Kashmir': 'Jammu & Kashmir',
  'Ladakh': 'Ladakh',
  'NCT of Delhi': 'Delhi',
  'Delhi': 'Delhi',
};

// Bright distinct colors for each state
const STATE_COLORS = [
  '#FF6B35', '#4ECDC4', '#E8AA14', '#7B68EE', '#FF69B4',
  '#45B7D1', '#98D8C8', '#FF4757', '#2ED573', '#FFA502',
  '#1E90FF', '#FF6348', '#7BED9F', '#70A1FF', '#ECCC68',
  '#A29BFE', '#FD79A8', '#00CEC9', '#6C5CE7', '#FDCB6E',
  '#E17055', '#00B894', '#0984E3', '#D63031', '#74B9FF',
  '#55EFC4', '#81ECEC', '#DFE6E9', '#FAB1A0', '#E77F67',
  '#786FA6', '#F8A5C2', '#63CDDA', '#CF6A87', '#778BEB',
  '#F19066', '#546DE5', '#E15F41', '#C44569', '#574B90',
];

interface IndiaMapOverlayProps {
  onClose: () => void;
}

export default function IndiaMapOverlay({ onClose }: IndiaMapOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<GeoCollection | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [animPhase, setAnimPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const [mapSize, setMapSize] = useState({ width: 800, height: 700 });

  // Load India GeoJSON (district-level, grouped by state)
  useEffect(() => {
    fetch(INDIA_DISTRICTS_URL)
      .then((r) => r.json())
      .then((data: GeoCollection) => setGeoData(data))
      .catch((err) => console.error('Failed to load India map:', err));
  }, []);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setAnimPhase('visible'), 50);
    return () => clearTimeout(timer);
  }, []);

  // Responsive sizing
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const panelW = selectedState ? 380 : 0;
        setMapSize({
          width: Math.max(400, rect.width - panelW - 40),
          height: Math.max(400, rect.height - 80),
        });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [selectedState]);

  const handleClose = useCallback(() => {
    setAnimPhase('exit');
    setTimeout(onClose, 400);
  }, [onClose]);

  // Get state name from a feature's properties
  const getStateName = useCallback((feature: GeoFeature): string => {
    const raw = (feature.properties?.st_nm || feature.properties?.ST_NM || feature.properties?.NAME_1 || feature.properties?.name || '') as string;
    return STATE_NAME_MAP[raw] || raw;
  }, []);

  // Group features by state for color mapping
  const stateNames = useMemo(() => {
    if (!geoData) return [];
    const seen = new Set<string>();
    geoData.features.forEach((f) => {
      seen.add(getStateName(f));
    });
    return Array.from(seen).sort();
  }, [geoData, getStateName]);

  // Mercator projection fitted to India
  const projection = useMemo(() => {
    if (!geoData) return null;
    return d3
      .geoMercator()
      .fitSize([mapSize.width, mapSize.height], geoData as unknown as d3.GeoPermissibleObjects);
  }, [geoData, mapSize]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return d3.geoPath().projection(projection) as d3.GeoPath<unknown, GeoFeature>;
  }, [projection]);

  // State color map: each unique state gets a distinct color
  const stateColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    stateNames.forEach((name, i) => {
      map[name] = STATE_COLORS[i % STATE_COLORS.length];
    });
    return map;
  }, [stateNames]);

  // Centroids: compute average centroid per state (from all its district features)
  const stateCentroids = useMemo(() => {
    if (!geoData || !pathGenerator) return {};
    const accum: Record<string, { sx: number; sy: number; count: number }> = {};
    geoData.features.forEach((f) => {
      const name = getStateName(f);
      const c = pathGenerator.centroid(f);
      if (c && isFinite(c[0]) && isFinite(c[1])) {
        if (!accum[name]) accum[name] = { sx: 0, sy: 0, count: 0 };
        accum[name].sx += c[0];
        accum[name].sy += c[1];
        accum[name].count += 1;
      }
    });
    const centroids: Record<string, [number, number]> = {};
    Object.entries(accum).forEach(([name, { sx, sy, count }]) => {
      centroids[name] = [sx / count, sy / count];
    });
    return centroids;
  }, [geoData, pathGenerator, getStateName]);

  // Filter for search
  const filteredChannels = useMemo(() => {
    if (!selectedState || !NEWS_CHANNELS.India?.states?.[selectedState]) return [];
    const channels = NEWS_CHANNELS.India.states[selectedState];
    if (!searchQuery) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (c) => c.name.toLowerCase().includes(q) || c.lang.toLowerCase().includes(q)
    );
  }, [selectedState, searchQuery]);

  const ChannelCard = ({ channel }: { channel: Channel }) => (
    <div className="group flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.08]">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{channel.name}</div>
        <div className="text-[11px] text-muted-foreground">{channel.lang}</div>
      </div>
      <a
        href={channel.url}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-3 flex shrink-0 items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-red-700"
      >
        <Play className="h-3 w-3 fill-white" />
        YouTube
      </a>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] flex transition-all duration-500 ease-out ${
        animPhase === 'enter'
          ? 'scale-[0.3] opacity-0'
          : animPhase === 'visible'
          ? 'scale-100 opacity-100'
          : 'scale-[0.3] opacity-0'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(10,22,40,0.98) 0%, rgba(5,12,25,0.99) 100%)',
        transformOrigin: 'center center',
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Globe
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[22px] font-bold text-foreground">India</span>
          <span className="rounded-full bg-[#FF6B35]/20 px-3 py-1 text-xs font-bold text-[#FF6B35]">
            {stateNames.length} States
          </span>
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
            {(NEWS_CHANNELS.India?.channels?.length || 0) + Object.values(NEWS_CHANNELS.India?.states || {}).reduce((s, c) => s + c.length, 0)} Channels
          </span>
        </div>
        <div className="text-xs text-muted-foreground">Click a state to see its news channels</div>
      </div>

      {/* Map area */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        <div className="relative flex flex-1 items-center justify-center">
          {/* Glow */}
          <div
            className="pointer-events-none absolute"
            style={{
              width: mapSize.width + 100,
              height: mapSize.height + 100,
              background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)',
            }}
          />

          {geoData && pathGenerator && (
            <svg ref={svgRef} width={mapSize.width} height={mapSize.height} className="drop-shadow-2xl">
              {/* District paths grouped by state */}
              {geoData.features.map((feature, i) => {
                const stateName = getStateName(feature);
                const hasChannels = !!(NEWS_CHANNELS.India?.states?.[stateName]);
                const isSelected = selectedState === stateName;
                const isHovered = hoveredState === stateName;
                const path = pathGenerator(feature);
                if (!path) return null;

                const baseColor = stateColorMap[stateName] || '#4a5568';

                return (
                  <path
                    key={i}
                    d={path}
                    fill={
                      isSelected
                        ? baseColor
                        : isHovered
                        ? baseColor + 'DD'
                        : hasChannels
                        ? baseColor + '99'
                        : baseColor + '40'
                    }
                    stroke={
                      isSelected
                        ? '#fff'
                        : isHovered
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(255,255,255,0.15)'
                    }
                    strokeWidth={isSelected ? 1.5 : 0.3}
                    style={{
                      cursor: 'pointer',
                      transition: 'fill 0.2s, stroke 0.2s',
                      filter: isSelected ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedState(isSelected ? null : stateName);
                      setSearchQuery('');
                    }}
                    onMouseEnter={() => setHoveredState(stateName)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                );
              })}

              {/* State labels at averaged centroids */}
              {Object.entries(stateCentroids).map(([name, [cx, cy]]) => {
                const hasChannels = !!(NEWS_CHANNELS.India?.states?.[name]);
                const isSelected = selectedState === name;
                const isHovered = hoveredState === name;
                const showLabel = isSelected || isHovered || mapSize.width > 350;
                if (!showLabel) return null;

                return (
                  <text
                    key={`label-${name}`}
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none select-none"
                    style={{
                      fontSize: isSelected ? 11 : 7,
                      fontWeight: isSelected ? 700 : hasChannels ? 600 : 400,
                      fill: isSelected ? '#fff' : hasChannels ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                  >
                    {name}
                  </text>
                );
              })}
            </svg>
          )}

          {/* Hover tooltip */}
          {hoveredState && !selectedState && (
            <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-xl border border-white/15 bg-black/90 px-5 py-3 backdrop-blur-sm">
              <div className="text-sm font-bold text-foreground">{hoveredState}</div>
              {NEWS_CHANNELS.India?.states?.[hoveredState] ? (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-primary">
                  <Tv className="h-3 w-3" />
                  {NEWS_CHANNELS.India.states[hoveredState].length} news channel
                  {NEWS_CHANNELS.India.states[hoveredState].length !== 1 ? 's' : ''}
                </div>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground">No channels yet</div>
              )}
            </div>
          )}

          {!geoData && (
            <div className="text-sm text-muted-foreground animate-pulse">Loading India map...</div>
          )}
        </div>

        {/* State Details Panel */}
        {selectedState && (
          <div className="w-[380px] shrink-0 animate-in slide-in-from-right overflow-y-auto border-l border-white/[0.08] bg-[rgba(10,22,40,0.95)] duration-300">
            {/* State Header */}
            <div
              className="border-b border-white/[0.06] p-5"
              style={{
                background: `linear-gradient(135deg, ${stateColorMap[selectedState] || '#FF6B35'}25, transparent)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedState}</h2>
                  <div className="mt-1 text-xs text-muted-foreground">India</div>
                </div>
                <button
                  onClick={() => { setSelectedState(null); setSearchQuery(''); }}
                  className="rounded-full border border-white/10 p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Channels */}
            <div className="p-5">
              {NEWS_CHANNELS.India?.states?.[selectedState] ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
                      News Channels ({NEWS_CHANNELS.India.states[selectedState].length})
                    </div>
                  </div>

                  {NEWS_CHANNELS.India.states[selectedState].length > 3 && (
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search channels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    {filteredChannels.map((ch, i) => (
                      <ChannelCard key={i} channel={ch} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Tv className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <div className="text-sm text-muted-foreground">No channels listed yet for {selectedState}</div>
                  <div className="mt-1 text-xs text-muted-foreground/60">Check back as we expand coverage</div>
                </div>
              )}

              {/* Also show national channels */}
              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
                  National Channels
                </div>
                <div className="space-y-2">
                  {NEWS_CHANNELS.India?.channels?.slice(0, 5).map((ch, i) => (
                    <ChannelCard key={`nat-${i}`} channel={ch} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
