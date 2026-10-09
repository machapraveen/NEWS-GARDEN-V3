// ==============================================================================
// Global Information Conduits & Inter-Continental Cable Pathways
// Inspired by vasturiano/globe.gl 'submarine-cables' & 'random-paths' examples
// ==============================================================================

export interface GlobalCablePath {
  id: string;
  name: string;
  region: string;
  color: string;
  coords: [number, number][]; // [lng, lat] coordinates following trans-oceanic cables
}

// Key inter-continental fiber-optic conduits linking global news corridors
export const GLOBAL_NEWS_CABLES: GlobalCablePath[] = [
  // Trans-Atlantic: London -> New York
  {
    id: "cable-atlantic-north",
    name: "Trans-Atlantic Express (London - New York)",
    region: "Atlantic",
    color: "#38bdf8", // Cyan
    coords: [
      [-0.1278, 51.5074], // London
      [-10.5, 50.0],
      [-25.0, 48.0],
      [-45.0, 44.0],
      [-60.0, 42.0],
      [-74.006, 40.7128], // New York
    ],
  },
  // Trans-Pacific: Tokyo -> San Francisco
  {
    id: "cable-pacific-north",
    name: "Pacific Rim Fiber (Tokyo - San Francisco)",
    region: "Pacific",
    color: "#a855f7", // Purple
    coords: [
      [139.6503, 35.6762], // Tokyo
      [160.0, 38.0],
      [180.0, 40.0],
      [-160.0, 41.0],
      [-140.0, 39.0],
      [-122.4194, 37.7749], // San Francisco
    ],
  },
  // Indo-Mediterranean: Mumbai -> Marseille
  {
    id: "cable-sea-me-we",
    name: "SEA-ME-WE Conduit (Mumbai - Marseille)",
    region: "Indian / Med",
    color: "#10b981", // Emerald
    coords: [
      [72.8777, 19.076], // Mumbai
      [60.0, 18.0],
      [48.0, 13.0],
      [43.0, 12.5], // Bab el-Mandeb
      [34.0, 26.0], // Red Sea
      [32.3, 31.0], // Suez
      [24.0, 35.0], // Mediterranean
      [14.0, 38.0],
      [5.3698, 43.2965], // Marseille
    ],
  },
  // Asia-Pacific Gateway: Singapore -> Tokyo
  {
    id: "cable-apg",
    name: "Asia Pacific Gateway (Singapore - Tokyo)",
    region: "East Asia",
    color: "#f59e0b", // Amber
    coords: [
      [103.8198, 1.3521], // Singapore
      [108.0, 10.0],
      [115.0, 18.0],
      [121.5, 25.0], // Taiwan Strait
      [130.0, 31.0],
      [139.6503, 35.6762], // Tokyo
    ],
  },
  // South Atlantic Cable: Rio de Janeiro -> Lisbon
  {
    id: "cable-ella-link",
    name: "EllaLink (Rio de Janeiro - Lisbon)",
    region: "South Atlantic",
    color: "#06b6d4", // Electric Cyan
    coords: [
      [-43.1729, -22.9068], // Rio de Janeiro
      [-35.0, -10.0],
      [-25.0, 5.0],
      [-20.0, 20.0],
      [-15.0, 30.0],
      [-9.1393, 38.7223], // Lisbon
    ],
  },
  // Pan-American: Miami -> Panama -> Santiago
  {
    id: "cable-pan-am",
    name: "Pan-American Oceanic Route (Miami - Santiago)",
    region: "Americas",
    color: "#ec4899", // Rose Pink
    coords: [
      [-80.1918, 25.7617], // Miami
      [-82.0, 18.0],
      [-79.5199, 8.9824], // Panama
      [-80.0, 0.0],
      [-78.0, -12.0], // Peru
      [-71.5, -25.0],
      [-70.6693, -33.4489], // Santiago
    ],
  },
  // Africa Coastal Concourse: Cape Town -> Lagos -> Lisbon
  {
    id: "cable-ace-africa",
    name: "ACE African Coast (Cape Town - Lisbon)",
    region: "West Africa",
    color: "#f43f5e", // Crimson Coral
    coords: [
      [18.4241, -33.9249], // Cape Town
      [12.0, -20.0],
      [5.0, -5.0],
      [3.3792, 6.5244], // Lagos
      [-15.0, 12.0],
      [-18.0, 25.0],
      [-9.1393, 38.7223], // Lisbon
    ],
  },
  // Southern Cross: Sydney -> Auckland -> Los Angeles
  {
    id: "cable-southern-cross",
    name: "Southern Cross Cable (Sydney - Los Angeles)",
    region: "South Pacific",
    color: "#14b8a6", // Teal
    coords: [
      [151.2093, -33.8688], // Sydney
      [174.7633, -36.8485], // Auckland
      [-175.0, -20.0],
      [-155.0, 0.0],
      [-135.0, 20.0],
      [-118.2437, 34.0522], // Los Angeles
    ],
  },
];
