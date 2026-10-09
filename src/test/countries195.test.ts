import { describe, it, expect } from "vitest";
import { COUNTRIES_DATA } from "@/data/countriesData";
import { generateAll195Articles, mergeWithGlobal195News, getGlobal195Articles } from "@/data/global195News";

describe("195 Sovereign Countries & Global News Coverage", () => {
  it("should have exactly 195 sovereign countries in directory", () => {
    expect(COUNTRIES_DATA.length).toBe(195);
  });

  it("should have 195 unique ISO codes", () => {
    const codes = COUNTRIES_DATA.map(c => c.code.toLowerCase());
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(195);
  });

  it("should have 195 unique country names", () => {
    const names = COUNTRIES_DATA.map(c => c.name.toLowerCase());
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(195);
  });

  it("should have valid coordinates and capitals for all 195 countries", () => {
    COUNTRIES_DATA.forEach(c => {
      expect(typeof c.lat).toBe("number");
      expect(typeof c.lng).toBe("number");
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lng).toBeGreaterThanOrEqual(-180);
      expect(c.lng).toBeLessThanOrEqual(180);
      expect(c.capital.length).toBeGreaterThan(0);
      expect(c.flag.length).toBeGreaterThan(0);
    });
  });

  it("should generate verified news dispatches covering all 195 sovereign nations", () => {
    const articles = generateAll195Articles();
    expect(articles.length).toBe(585); // 3 rich verified articles per country across all 195 nations

    const countryNames = new Set(articles.map(a => a.location.country.toLowerCase()));
    expect(countryNames.size).toBe(195);
  });

  it("mergeWithGlobal195News should guarantee 195 nations even if live API is empty", () => {
    const merged = mergeWithGlobal195News([]);
    expect(merged.length).toBeGreaterThanOrEqual(195);

    const covered = new Set(merged.map(a => a.location.country.toLowerCase()));
    expect(covered.size).toBe(195);
  });

  it("mergeWithGlobal195News should merge live articles and supplement all remaining countries", () => {
    const liveSample = [
      {
        id: "live-1",
        headline: "Live Tokyo Breaking News",
        summary: "Live report",
        fullText: "Full live report",
        source: "NHK",
        timestamp: new Date().toISOString(),
        category: "Technology" as const,
        sentiment: "positive" as const,
        sentimentScore: 0.9,
        credibilityScore: 95,
        bertConfidence: 0.9,
        communityReports: 0,
        location: {
          city: "Tokyo",
          district: "Tokyo",
          state: "Japan",
          country: "Japan",
          continent: "Asia-Pacific",
          lat: 35.6762,
          lng: 139.6503,
        },
        entities: [],
        crossSources: [],
        aiSummary: "Summary",
      },
    ];

    const merged = mergeWithGlobal195News(liveSample);
    expect(merged.length).toBeGreaterThanOrEqual(195);

    // Japan live story must be preserved
    const japanStories = merged.filter(a => a.location.country.toLowerCase() === "japan");
    expect(japanStories.some(a => a.id === "live-1")).toBe(true);

    // Total unique countries must still be 195
    const countries = new Set(merged.map(a => a.location.country.toLowerCase()));
    expect(countries.size).toBe(195);
  });
});
