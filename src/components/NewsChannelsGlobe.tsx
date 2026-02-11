import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { feature as topojsonFeature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import {
  NEWS_CHANNELS,
  CONTINENT_COLORS,
  getCountryName,
  getTotalChannelCount,
  type Channel,
} from '@/data/newsChannels';
import { Search, X, ChevronDown, ChevronUp, Play, Pause, RotateCcw } from 'lucide-react';

const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const INDIA_STATES_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson';

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

// Map GeoJSON state names to our newsChannels.ts state names
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
  'Orissa': 'Odisha',
  'Punjab': 'Punjab',
  'Rajasthan': 'Rajasthan',
  'Sikkim': 'Sikkim',
  'Tamil Nadu': 'Tamil Nadu',
  'Telangana': 'Telangana',
  'Tripura': 'Tripura',
  'Uttar Pradesh': 'Uttar Pradesh',
  'Uttarakhand': 'Uttarakhand',
  'Uttaranchal': 'Uttarakhand',
  'West Bengal': 'West Bengal',
  'Jammu & Kashmir': 'Jammu & Kashmir',
  'Jammu and Kashmir': 'Jammu & Kashmir',
  'Ladakh': 'Ladakh',
  'NCT of Delhi': 'Delhi',
  'Delhi': 'Delhi',
};

export default function NewsChannelsGlobe() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<GeoCollection | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([78, -20, 0]); // Start centered on India
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showIndia, setShowIndia] = useState(false);
  const [indiaGeoData, setIndiaGeoData] = useState<GeoCollection | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globeSize, setGlobeSize] = useState(520);
  const animRef = useRef<number | null>(null);
  const dragRef = useRef<{ start: [number, number] | null; startRotation: [number, number, number] | null }>({
    start: null,
    startRotation: null,
  });

  const totalChannels = useMemo(() => getTotalChannelCount(), []);

  // Responsive globe sizing
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const panelWidth = selectedCountry ? 360 : 0;
        const available = Math.min(rect.width - panelWidth - 40, rect.height - 40);
        setGlobeSize(Math.max(300, Math.min(600, available)));
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [selectedCountry]);

  // Load world atlas topology
  useEffect(() => {
    fetch(WORLD_ATLAS_URL)
      .then((r) => r.json())
      .then((topology: Topology) => {
        const countries = topojsonFeature(topology, topology.objects.countries) as unknown as GeoCollection;
        setGeoData(countries);
      })
      .catch((err) => console.error('Failed to load world atlas:', err));
  }, []);

  // Load India states GeoJSON when India is selected
  useEffect(() => {
    if (showIndia && !indiaGeoData) {
      fetch(INDIA_STATES_URL)
        .then((r) => r.json())
        .then((data: GeoCollection) => {
          setIndiaGeoData(data);
        })
        .catch((err) => console.error('Failed to load India states:', err));
    }
  }, [showIndia, indiaGeoData]);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || isDragging) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    let lastTime = Date.now();
    function animate() {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setRotation((prev) => [prev[0] + dt * 8, prev[1], prev[2]]);
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [autoRotate, isDragging]);

  const projection = useMemo(() => {
    return d3
      .geoOrthographic()
      .scale(globeSize / 2 - 10)
      .translate([globeSize / 2, globeSize / 2])
      .rotate(rotation)
      .clipAngle(90);
  }, [rotation, globeSize]);

  const pathGenerator = useMemo(
    () => d3.geoPath().projection(projection) as d3.GeoPath<unknown, GeoFeature>,
    [projection]
  );

  const graticule = useMemo(() => d3.geoGraticule10(), []);

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setAutoRotate(false);
      const rect = svgRef.current!.getBoundingClientRect();
      dragRef.current = {
        start: [e.clientX - rect.left, e.clientY - rect.top],
        startRotation: [...rotation],
      };
    },
    [rotation]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragRef.current.start || !dragRef.current.startRotation) return;
      const rect = svgRef.current!.getBoundingClientRect();
      const dx = e.clientX - rect.left - dragRef.current.start[0];
      const dy = e.clientY - rect.top - dragRef.current.start[1];
      setRotation([
        dragRef.current.startRotation[0] + dx * 0.4,
        Math.max(-90, Math.min(90, dragRef.current.startRotation[1] - dy * 0.4)),
        0,
      ]);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      setIsDragging(true);
      setAutoRotate(false);
      const touch = e.touches[0];
      const rect = svgRef.current!.getBoundingClientRect();
      dragRef.current = {
        start: [touch.clientX - rect.left, touch.clientY - rect.top],
        startRotation: [...rotation],
      };
    },
    [rotation]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !dragRef.current.start || !dragRef.current.startRotation || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = svgRef.current!.getBoundingClientRect();
      const dx = touch.clientX - rect.left - dragRef.current.start[0];
      const dy = touch.clientY - rect.top - dragRef.current.start[1];
      setRotation([
        dragRef.current.startRotation[0] + dx * 0.4,
        Math.max(-90, Math.min(90, dragRef.current.startRotation[1] - dy * 0.4)),
        0,
      ]);
    },
    [isDragging]
  );

  const handleCountryClick = useCallback((feature: GeoFeature) => {
    const name = getCountryName(feature);
    const data = NEWS_CHANNELS[name];
    if (data) {
      setSelectedCountry(name);
      setSelectedState(null);
      setShowIndia(name === 'India');
      setHoveredState(null);
      setSearchQuery('');
      // Center globe on India when clicked
      if (name === 'India') {
        setRotation([-78, -20, 0]); // Center on India (longitude negated for d3 rotation)
        setAutoRotate(false);
      }
    }
  }, []);

  const closePanel = useCallback(() => {
    setSelectedCountry(null);
    setShowIndia(false);
    setSelectedState(null);
    setHoveredState(null);
    setSearchQuery('');
  }, []);

  function getCountryColor(name: string): string {
    const data = NEWS_CHANNELS[name];
    if (!data) return '#1a2332';
    return CONTINENT_COLORS[data.continent] || '#4a5568';
  }

  // Filter states by search query
  const filteredStates = useMemo(() => {
    if (!showIndia || !NEWS_CHANNELS.India?.states) return {};
    if (!searchQuery) return NEWS_CHANNELS.India.states;
    const q = searchQuery.toLowerCase();
    const result: Record<string, Channel[]> = {};
    for (const [state, channels] of Object.entries(NEWS_CHANNELS.India.states)) {
      if (
        state.toLowerCase().includes(q) ||
        channels.some(
          (c) => c.name.toLowerCase().includes(q) || c.lang.toLowerCase().includes(q)
        )
      ) {
        result[state] = channels;
      }
    }
    return result;
  }, [showIndia, searchQuery]);

  const ChannelCard = ({ channel, compact = false }: { channel: Channel; compact?: boolean }) => (
    <div className="group flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]">
      <div className="min-w-0 flex-1">
        <div className={`font-semibold text-foreground ${compact ? 'text-[13px]' : 'text-sm'}`}>
          {channel.name}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{channel.lang}</span>
          {channel.type && (
            <>
              <span className="text-white/20">|</span>
              <span
                className={
                  channel.type === 'Public'
                    ? 'text-primary'
                    : channel.type === 'State' || channel.type === 'State-funded'
                    ? 'text-yellow-400'
                    : channel.type === 'Digital' || channel.type === 'Independent'
                    ? 'text-emerald-400'
                    : 'text-pink-400'
                }
              >
                {channel.type}
              </span>
            </>
          )}
        </div>
      </div>
      <a
        href={channel.url}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-3 flex shrink-0 items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-red-700"
      >
        <Play className="h-3 w-3 fill-white" />
        {compact ? 'YT' : 'YouTube'}
      </a>
    </div>
  );

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Globe Area */}
        <div className="relative flex min-w-0 flex-1 items-center justify-center">
          {/* Glow effect behind globe */}
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              width: globeSize + 40,
              height: globeSize + 40,
              background: 'radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 70%)',
            }}
          />

          <svg
            ref={svgRef}
            width={globeSize}
            height={globeSize}
            className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <defs>
              <radialGradient id="channels-ocean" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#1a3a5c" />
                <stop offset="100%" stopColor="#0a1628" />
              </radialGradient>
            </defs>

            {/* Ocean */}
            <circle cx={globeSize / 2} cy={globeSize / 2} r={globeSize / 2 - 10} fill="url(#channels-ocean)" />

            {/* Graticule */}
            <path
              d={pathGenerator(graticule as unknown as GeoFeature) || ''}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={0.5}
            />

            {/* Countries */}
            {geoData?.features?.map((feature, i) => {
              const name = getCountryName(feature);
              const hasData = !!NEWS_CHANNELS[name];
              const isSelected = selectedCountry === name;
              const isHovered = hoveredCountry === name;
              const path = pathGenerator(feature);
              if (!path) return null;

              return (
                <path
                  key={i}
                  d={path}
                  fill={
                    isSelected
                      ? '#FF6B35'
                      : isHovered && hasData
                      ? '#4ECDC4'
                      : hasData
                      ? getCountryColor(name) + '88'
                      : '#1a2332'
                  }
                  stroke={
                    isSelected
                      ? '#FF6B35'
                      : hasData
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.06)'
                  }
                  strokeWidth={isSelected ? 1.5 : 0.4}
                  style={{
                    cursor: hasData ? 'pointer' : 'default',
                    transition: 'fill 0.3s',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasData) handleCountryClick(feature);
                  }}
                  onMouseEnter={() => setHoveredCountry(name)}
                  onMouseLeave={() => setHoveredCountry(null)}
                />
              );
            })}

            {/* India State Overlay — shown when India is selected */}
            {showIndia && indiaGeoData?.features?.map((feature, i) => {
              const rawName = (feature.properties?.NAME_1 || feature.properties?.name || feature.properties?.NAME || feature.properties?.st_nm || '') as string;
              const stateName = STATE_NAME_MAP[rawName] || rawName;
              const hasChannels = !!(NEWS_CHANNELS.India?.states?.[stateName]);
              const isStateSelected = selectedState === stateName;
              const isStateHovered = hoveredState === stateName;
              const path = pathGenerator(feature);
              if (!path) return null;

              return (
                <path
                  key={`india-state-${i}`}
                  d={path}
                  fill={
                    isStateSelected
                      ? '#FF6B35'
                      : isStateHovered && hasChannels
                      ? '#4ECDC4'
                      : hasChannels
                      ? 'rgba(255,107,53,0.45)'
                      : 'rgba(255,107,53,0.15)'
                  }
                  stroke={isStateSelected ? '#FF6B35' : 'rgba(255,255,255,0.35)'}
                  strokeWidth={isStateSelected ? 1.5 : 0.8}
                  style={{
                    cursor: hasChannels ? 'pointer' : 'default',
                    transition: 'fill 0.2s',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasChannels) {
                      setSelectedState(isStateSelected ? null : stateName);
                    }
                  }}
                  onMouseEnter={() => setHoveredState(stateName)}
                  onMouseLeave={() => setHoveredState(null)}
                />
              );
            })}

            {/* Atmosphere glow ring */}
            <circle
              cx={globeSize / 2}
              cy={globeSize / 2}
              r={globeSize / 2 - 10}
              fill="none"
              stroke="rgba(78,205,196,0.15)"
              strokeWidth={2}
            />
          </svg>

          {/* Hover tooltip */}
          {(hoveredCountry || (showIndia && hoveredState)) && !isDragging && (
            <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-[13px] font-semibold backdrop-blur-sm">
              {showIndia && hoveredState ? (
                <>
                  {hoveredState}, India
                  {NEWS_CHANNELS.India?.states?.[hoveredState] && (
                    <span className="ml-2 text-primary">
                      {NEWS_CHANNELS.India.states[hoveredState].length} channel
                      {NEWS_CHANNELS.India.states[hoveredState].length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {!NEWS_CHANNELS.India?.states?.[hoveredState] && (
                    <span className="ml-2 text-muted-foreground text-xs">No channels yet</span>
                  )}
                </>
              ) : hoveredCountry ? (
                <>
                  {hoveredCountry}
                  {NEWS_CHANNELS[hoveredCountry] && (
                    <span className="ml-2 text-primary">
                      {NEWS_CHANNELS[hoveredCountry].channels?.length || 0} channel
                      {(NEWS_CHANNELS[hoveredCountry].channels?.length || 0) !== 1 ? 's' : ''}
                      {NEWS_CHANNELS[hoveredCountry].states &&
                        ` + ${Object.keys(NEWS_CHANNELS[hoveredCountry].states!).length} states`}
                    </span>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Continent Legend */}
          <div className="absolute bottom-4 right-4 flex max-w-[200px] flex-wrap gap-1.5">
            {Object.entries(CONTINENT_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <div className="h-2 w-2 rounded-sm" style={{ background: color }} />
                {name}
              </div>
            ))}
          </div>

          {/* Instruction overlay */}
          {!selectedCountry && (
            <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-[11px] text-muted-foreground">
              Drag to rotate | Click colored countries to explore channels
            </div>
          )}

          {/* Globe controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                autoRotate
                  ? 'border-primary/30 bg-primary/20 text-primary'
                  : 'border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {autoRotate ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {autoRotate ? 'Pause' : 'Rotate'}
            </button>
            <button
              onClick={() => {
                setRotation([78, -20, 0]);
                setAutoRotate(false);
              }}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10"
              title="Reset to India"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Side Panel */}
        {selectedCountry && NEWS_CHANNELS[selectedCountry] && (
          <div className="w-[360px] shrink-0 animate-in slide-in-from-right overflow-y-auto border-l border-white/[0.08] bg-[rgba(13,27,42,0.95)] duration-300">
            {/* Country Header */}
            <div
              className="border-b border-white/[0.06] p-5"
              style={{
                background: `linear-gradient(135deg, ${
                  CONTINENT_COLORS[NEWS_CHANNELS[selectedCountry]?.continent] || '#FF6B35'
                }15, transparent)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[22px] font-bold">{selectedCountry}</h2>
                  <div
                    className="text-xs font-semibold"
                    style={{ color: CONTINENT_COLORS[NEWS_CHANNELS[selectedCountry]?.continent] }}
                  >
                    {NEWS_CHANNELS[selectedCountry]?.continent}
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  className="rounded-full border border-white/10 p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* National / Global Channels */}
            <div className="p-5">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
                {selectedCountry === 'India' ? 'National Channels' : 'News Channels'}
              </div>
              <div className="space-y-2">
                {NEWS_CHANNELS[selectedCountry]?.channels?.map((ch, i) => (
                  <ChannelCard key={i} channel={ch} />
                ))}
              </div>
            </div>

            {/* India State-wise Channels */}
            {showIndia && NEWS_CHANNELS.India?.states && (
              <div className="border-t border-white/[0.06] px-5 pt-4 pb-5">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
                  State-Wise Channels ({Object.keys(NEWS_CHANNELS.India.states).length} States)
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search state or language..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* State list */}
                <div className="space-y-1">
                  {Object.entries(filteredStates).map(([state, channels]) => (
                    <div key={state}>
                      <button
                        onClick={() => setSelectedState(selectedState === state ? null : state)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                          selectedState === state
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : 'border-white/[0.06] bg-white/[0.02] text-foreground/80 hover:bg-white/[0.06]'
                        }`}
                      >
                        <span>{state}</span>
                        <span className="flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                          {channels.length} ch
                          {selectedState === state ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </span>
                      </button>

                      {selectedState === state && (
                        <div className="space-y-1.5 py-2 pl-2">
                          {channels.map((ch, i) => (
                            <ChannelCard key={i} channel={ch} compact />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {Object.keys(filteredStates).length === 0 && searchQuery && (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No states match "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Stats Bar */}
      <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/20 px-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="font-medium text-primary">LIVE DIRECTORY</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{Object.keys(NEWS_CHANNELS).length} Countries</span>
          <span className="text-white/20">|</span>
          <span>{totalChannels}+ Channels</span>
          <span className="text-white/20">|</span>
          <span>{Object.keys(NEWS_CHANNELS.India?.states || {}).length} Indian States</span>
        </div>
      </div>
    </div>
  );
}
