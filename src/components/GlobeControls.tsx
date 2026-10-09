import { useState, useRef, useEffect } from "react";
import { Search, Radio, Compass, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Category, categories } from "@/data/mockNews";
import {
  COUNTRIES_DATA,
  searchCountries,
  type CountryInfo,
  type GeopoliticalRegion,
} from "@/data/countriesData";

interface GlobeControlsProps {
  selectedCategory: Category | null;
  onCategoryChange: (cat: Category | null) => void;
  selectedRegion: GeopoliticalRegion;
  onRegionChange: (region: GeopoliticalRegion) => void;
  showHeatmap: boolean;
  onHeatmapToggle: () => void;
  onSearch: (query: string) => void;
  onSelectCountry: (country: CountryInfo) => void;
  selectedCountry: CountryInfo | null;
}

const REGIONS: GeopoliticalRegion[] = [
  "All",
  "Middle East",
  "Americas",
  "Europe",
  "Asia-Pacific",
  "Africa",
];

export default function GlobeControls({
  selectedCategory,
  onCategoryChange,
  selectedRegion,
  onRegionChange,
  showHeatmap,
  onHeatmapToggle,
  onSearch,
  onSelectCountry,
  selectedCountry,
}: GlobeControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Compute country suggestions when typing
  const suggestions = searchQuery.trim() ? searchCountries(searchQuery).slice(0, 6) : [];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountryPick = (country: CountryInfo) => {
    onSelectCountry(country);
    setSearchQuery(country.name);
    setIsDropdownOpen(false);
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    // Check if the query matches a specific country
    const matched = COUNTRIES_DATA.find(
      c => c.name.toLowerCase() === searchQuery.toLowerCase().trim()
    );
    if (matched) {
      handleCountryPick(matched);
    } else {
      onSearch(searchQuery);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-[680px] z-40 space-y-2.5">
      {/* ── Top Bar: Search & Country Explorer + Radar ── */}
      <div className="glass rounded-2xl p-2 flex items-center gap-2 border border-white/[0.12] shadow-xl backdrop-blur-xl bg-black/40">
        <div ref={searchContainerRef} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={e => e.key === "Enter" && handleSearchSubmit()}
            placeholder="Search 195 countries or news keywords..."
            className="pl-9 pr-8 bg-transparent border-border/30 text-xs sm:text-sm h-9 focus-visible:ring-primary/40 rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsDropdownOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete Dropdown for 195 Countries */}
          {isDropdownOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-white/[0.12] rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden z-50 animate-in fade-in-50 duration-150">
              <div className="p-1.5 space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Countries & Hubs
                </div>
                {suggestions.map(country => (
                  <button
                    key={country.code}
                    onClick={() => handleCountryPick(country)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-white/[0.08] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{country.flag}</span>
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {country.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">({country.capital})</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-muted-foreground group-hover:text-white">
                      {country.region}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleSearchSubmit}
          className="h-9 px-3.5 rounded-xl glow-primary"
          title="Search"
        >
          <Search className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="sm"
          variant={showHeatmap ? "default" : "outline"}
          onClick={onHeatmapToggle}
          className={`h-9 px-3 rounded-xl transition-all ${
            showHeatmap
              ? "bg-primary text-primary-foreground glow-primary"
              : "glass border-white/[0.15] text-muted-foreground hover:text-white"
          }`}
          title="Toggle Sentiment Waves & Resonance"
        >
          <Radio className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-xs font-medium">Waves</span>
        </Button>
      </div>

      {/* ── Geopolitical Region Switcher (Middle East, Americas, Europe, Asia, Africa) ── */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 justify-start sm:justify-center">
        {REGIONS.map(reg => {
          const isSelected = selectedRegion === reg;
          return (
            <button
              key={reg}
              onClick={() => onRegionChange(reg)}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-black/30 border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {reg === "All" && "🌐 "}
              {reg === "Middle East" && "🕌 "}
              {reg === "Americas" && "🗽 "}
              {reg === "Europe" && "🏰 "}
              {reg === "Asia-Pacific" && "🌏 "}
              {reg === "Africa" && "🌍 "}
              {reg}
            </button>
          );
        })}
      </div>

      {/* ── Category Filter Bar (Single clean row, horizontal scroll with smooth indicators) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 justify-start sm:justify-center">
        <Badge
          onClick={() => onCategoryChange(null)}
          className={`cursor-pointer text-[11px] px-2.5 py-1 rounded-full font-medium transition-all shrink-0 border ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground border-primary glow-primary"
              : "bg-black/40 border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          All Topics
        </Badge>
        {categories.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <Badge
              key={cat}
              onClick={() => onCategoryChange(isSelected ? null : cat)}
              className={`cursor-pointer text-[11px] px-2.5 py-1 rounded-full font-medium transition-all shrink-0 border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary glow-primary"
                  : "bg-black/40 border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {cat}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
