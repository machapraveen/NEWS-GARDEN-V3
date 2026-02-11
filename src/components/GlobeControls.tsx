import { Search, Filter, Radio } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Category, categories } from "@/data/mockNews";

interface GlobeControlsProps {
  selectedCategory: Category | null;
  onCategoryChange: (cat: Category | null) => void;
  showHeatmap: boolean;
  onHeatmapToggle: () => void;
  onSearch: (query: string) => void;
}

export default function GlobeControls({
  selectedCategory,
  onCategoryChange,
  showHeatmap,
  onHeatmapToggle,
  onSearch,
}: GlobeControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-[640px] z-40 space-y-3">
      {/* Search */}
      <div className="glass rounded-xl p-2 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search locations or news..."
            className="pl-9 bg-transparent border-border/30 text-sm h-9 focus-visible:ring-primary/50"
          />
        </div>
        <Button size="sm" onClick={handleSearch} className="h-9 glow-primary">
          <Search className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant={showHeatmap ? "default" : "outline"}
          onClick={onHeatmapToggle}
          className="h-9"
        >
          <Radio className="w-3.5 h-3.5 mr-1" />
          <span className="hidden sm:inline text-xs">Sentiment</span>
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        <Badge
          onClick={() => onCategoryChange(null)}
          className={`cursor-pointer text-xs transition-all ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground glow-primary"
              : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
          }`}
        >
          All
        </Badge>
        {categories.map(cat => (
          <Badge
            key={cat}
            onClick={() => onCategoryChange(cat === selectedCategory ? null : cat)}
            className={`cursor-pointer text-xs transition-all ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground glow-primary"
                : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
            }`}
          >
            {cat}
          </Badge>
        ))}
      </div>
    </div>
  );
}
