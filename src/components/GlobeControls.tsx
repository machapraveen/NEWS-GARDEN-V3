import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Radio, Compass, X, Check, Globe, MapPin, ChevronRight } from "lucide-react";
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
  const [isCountriesModalOpen, setIsCountriesModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalRegion, setModalRegion] = useState<GeopoliticalRegion>("All");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Compute country suggestions when typing in top search
  const suggestions = searchQuery.trim() ? searchCountries(searchQuery).slice(0, 6) : [];

  // Filter 195 countries for the full modal
  const filteredCountries = useMemo(() => {
    let list = COUNTRIES_DATA;
    if (modalRegion !== "All") {
      list = list.filter((c) => c.region === modalRegion);
    }
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.capital.toLowerCase().includes(q)
      );
    }
    return list;
  }, [modalRegion, modalSearch]);

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
    setIsCountriesModalOpen(false);
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    const matched = COUNTRIES_DATA.find(
      (c) => c.name.toLowerCase() === searchQuery.toLowerCase().trim()
    );
    if (matched) {
      handleCountryPick(matched);
    } else {
      onSearch(searchQuery);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-[740px] max-w-[96vw] z-40 space-y-2">
      {/* ── Top Bar: Search, 195 Countries Directory & Waves Radar ── */}
      <div className="glass rounded-2xl p-2 flex items-center gap-2 border border-white/[0.12] shadow-xl backdrop-blur-xl bg-black/50">
        <div ref={searchContainerRef} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
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

          {/* Autocomplete Dropdown for Quick Country Pick */}
          {isDropdownOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-white/[0.12] rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden z-50 animate-in fade-in-50 duration-150">
              <div className="p-1.5 space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Global Hubs & Nations
                </div>
                {suggestions.map((country) => (
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
                      <span className="text-[10px] text-muted-foreground">
                        ({country.capital})
                      </span>
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

        {/* 195 Countries Directory Launcher Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsCountriesModalOpen(true)}
          className="h-9 px-2.5 sm:px-3 rounded-xl border-white/[0.15] bg-white/[0.05] hover:bg-primary/20 hover:border-primary/40 text-foreground transition-all flex items-center gap-1.5 shrink-0"
          title="Browse all 195 countries throughout the world"
        >
          <span className="text-sm select-none">🌍</span>
          <span className="text-xs font-semibold hidden sm:inline">195 Countries</span>
        </Button>

        <Button
          size="sm"
          onClick={handleSearchSubmit}
          className="h-9 px-3 rounded-xl glow-primary bg-primary text-primary-foreground hover:opacity-90 transition-all shrink-0"
          title="Search"
        >
          <Search className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="sm"
          variant={showHeatmap ? "default" : "outline"}
          onClick={onHeatmapToggle}
          className={`h-9 px-2.5 sm:px-3 rounded-xl transition-all shrink-0 ${
            showHeatmap
              ? "bg-primary text-primary-foreground glow-primary"
              : "glass border-white/[0.15] text-muted-foreground hover:text-white"
          }`}
          title="Toggle Sentiment Waves & Resonance"
        >
          <Radio className="w-3.5 h-3.5 mr-1" />
          <span className="text-xs font-medium hidden sm:inline">Waves</span>
        </Button>
      </div>

      {/* ── Geopolitical Region Switcher (Middle East, Americas, Europe, Asia, Africa) ── */}
      <div
        className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 justify-start sm:justify-center"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {REGIONS.map((reg) => {
          const isSelected = selectedRegion === reg;
          return (
            <button
              key={reg}
              onClick={() => onRegionChange(reg)}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-black/40 border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.06]"
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

      {/* ── Category Filter Bar (Completely scrollbar-free across all OSes) ── */}
      <div
        className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 justify-start sm:justify-center"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <Badge
          onClick={() => onCategoryChange(null)}
          className={`cursor-pointer text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 border ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground border-primary glow-primary"
              : "bg-black/50 border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          All Topics
        </Badge>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <Badge
              key={cat}
              onClick={() => onCategoryChange(isSelected ? null : cat)}
              className={`cursor-pointer text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary glow-primary"
                  : "bg-black/50 border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {cat}
            </Badge>
          );
        })}
      </div>

      {/* ── 195 Sovereign Countries Interactive Directory Modal ── */}
      {isCountriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in-50 duration-200">
          <div className="glass rounded-2xl border border-white/[0.15] bg-slate-950/95 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl select-none">🌍</span>
                <div>
                  <h3 className="text-sm font-bold font-display text-white tracking-wide">
                    195 COUNTRIES & TERRITORIES DIRECTORY
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Select any nation to rotate the globe and ingest live intelligence
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCountriesModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/[0.08]"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>

            {/* Modal Search & Region Filter */}
            <div className="p-3 border-b border-white/[0.08] bg-white/[0.02] space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Filter countries by name, code, or capital..."
                  className="pl-9 bg-black/40 border-white/[0.1] text-xs h-9 rounded-xl"
                  autoFocus
                />
              </div>

              <div
                className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {REGIONS.map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setModalRegion(reg)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all shrink-0 border ${
                      modalRegion === reg
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white/[0.03] border-white/[0.08] text-muted-foreground hover:text-white"
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>

            {/* Countries Grid */}
            <div
              className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="text-[10px] uppercase font-bold text-muted-foreground/60 px-2 mb-1">
                Showing {filteredCountries.length} countries
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredCountries.map((country) => {
                  const isCurSelected = selectedCountry?.code === country.code;
                  return (
                    <button
                      key={country.code}
                      onClick={() => handleCountryPick(country)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all group ${
                        isCurSelected
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl select-none shrink-0">{country.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {country.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            Capital: {country.capital} · {country.code.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
