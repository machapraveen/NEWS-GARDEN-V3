import { describe, expect, it, vi, beforeEach } from "vitest";
import { NEWS_CHANNELS, getChannelHomeUrl, getChannelLiveUrl } from "@/data/newsChannels";
import { analyzeCredibility } from "@/lib/api/news";
import type { NewsArticle } from "@/data/mockNews";

describe("News Channels Live URL & Handle Integrity", () => {
  it("generates auto-live URLs for all global and Indian state channels", () => {
    let totalChecked = 0;
    for (const country of Object.values(NEWS_CHANNELS)) {
      if (country.channels) {
        for (const ch of country.channels) {
          const home = getChannelHomeUrl(ch);
          const live = getChannelLiveUrl(ch);
          expect(home).toMatch(/^https:\/\/www\.youtube\.com\//);
          if (ch.url.includes("youtube.com/@")) {
            expect(live).toMatch(/\/live$/);
          } else if (ch.url.includes("results?search_query=")) {
            expect(live).toContain("sp=EgJAAQ%253D%253D");
          }
          totalChecked++;
        }
      }
      if (country.states) {
        for (const stateChannels of Object.values(country.states)) {
          for (const ch of stateChannels) {
            const live = getChannelLiveUrl(ch);
            expect(live).toMatch(/^https:\/\/www\.youtube\.com\//);
            totalChecked++;
          }
        }
      }
    }
    expect(totalChecked).toBeGreaterThan(200);
  });
});

describe("Real-Time News Credibility & Hoax Verification Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("debunks 'Modi was shot in street' as FALSE_HOAX with real-time timestamp and zero short-article false flags", async () => {
    // Mock fetch to simulate legacy edge function returning 65% + short article flag
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        credibilityScore: 65,
        verdict: "suspicious",
        bertLabel: "Real",
        redFlags: ["Very short article — insufficient content for verification"],
        articles: [],
      }),
    } as Response);

    const claim = {
      headline: "Modi was shot in street",
      summary: "Modi was shot in street",
      fullText: "Modi was shot in street",
      source: "User Claim Submission",
    } as NewsArticle;

    const result = await analyzeCredibility(claim);
    expect(result.isTrue).toBe(false);
    expect(result.verdict).toBe("FALSE_HOAX");
    expect(result.truthPercentage).toBeLessThanOrEqual(10);
    expect(result.falsePercentage).toBeGreaterThanOrEqual(90);
    expect(result.verifiedAt).toBeTruthy();
    expect(result.sourcesScanned).toBeGreaterThanOrEqual(48);
    expect(
      result.redFlags.some((f) => f.toLowerCase().includes("very short article"))
    ).toBe(false);
  });

  it("verifies 'NASA James Webb Telescope discovers water on exoplanet' as TRUE_VERIFIED with real-time timestamp", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        credibilityScore: 65,
        articles: [],
      }),
    } as Response);

    const claim = {
      headline: "NASA James Webb Telescope discovers water on exoplanet",
      summary: "NASA James Webb Telescope discovers water on exoplanet",
      fullText: "NASA James Webb Telescope discovers water on exoplanet",
      source: "User Claim Submission",
    } as NewsArticle;

    const result = await analyzeCredibility(claim);
    expect(result.isTrue).toBe(true);
    expect(result.verdict).toBe("TRUE_VERIFIED");
    expect(result.truthPercentage).toBeGreaterThanOrEqual(90);
    expect(result.falsePercentage).toBeLessThanOrEqual(10);
    expect(result.verifiedAt).toBeTruthy();
  });
});

