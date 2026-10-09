// ==============================================================================
// 195 Sovereign Countries & Territories Data Directory
// Includes ISO 2-letter codes, flags, capitals, coordinates, and geopolitical regions
// ==============================================================================

export type GeopoliticalRegion =
  | 'All'
  | 'Middle East'
  | 'Americas'
  | 'Europe'
  | 'Asia-Pacific'
  | 'Africa';

export interface CountryInfo {
  name: string;
  code: string; // ISO 2-letter
  flag: string;
  capital: string;
  region: GeopoliticalRegion;
  lat: number;
  lng: number;
  gnewsCode?: string; // If GNews top-headlines directly supports this 2-letter code
}

export const COUNTRIES_DATA: CountryInfo[] = [
  // ─── MIDDLE EAST & NORTH AFRICA (MENA) ───
  { name: 'United Arab Emirates', code: 'ae', flag: '🇦🇪', capital: 'Abu Dhabi', region: 'Middle East', lat: 24.4539, lng: 54.3773, gnewsCode: 'ae' },
  { name: 'Saudi Arabia', code: 'sa', flag: '🇸🇦', capital: 'Riyadh', region: 'Middle East', lat: 24.7136, lng: 46.6753, gnewsCode: 'sa' },
  { name: 'Egypt', code: 'eg', flag: '🇪🇬', capital: 'Cairo', region: 'Middle East', lat: 30.0444, lng: 31.2357, gnewsCode: 'eg' },
  { name: 'Israel', code: 'il', flag: '🇮🇱', capital: 'Jerusalem', region: 'Middle East', lat: 31.7683, lng: 35.2137, gnewsCode: 'il' },
  { name: 'Qatar', code: 'qa', flag: '🇶🇦', capital: 'Doha', region: 'Middle East', lat: 25.2854, lng: 51.5310 },
  { name: 'Turkey', code: 'tr', flag: '🇹🇷', capital: 'Ankara', region: 'Middle East', lat: 39.9334, lng: 32.8597, gnewsCode: 'tr' },
  { name: 'Kuwait', code: 'kw', flag: '🇰🇼', capital: 'Kuwait City', region: 'Middle East', lat: 29.3759, lng: 47.9774 },
  { name: 'Oman', code: 'om', flag: '🇴🇲', capital: 'Muscat', region: 'Middle East', lat: 23.5880, lng: 58.3829 },
  { name: 'Bahrain', code: 'bh', flag: '🇧🇭', capital: 'Manama', region: 'Middle East', lat: 26.2285, lng: 50.5860 },
  { name: 'Jordan', code: 'jo', flag: '🇯🇴', capital: 'Amman', region: 'Middle East', lat: 31.9454, lng: 35.9284 },
  { name: 'Lebanon', code: 'lb', flag: '🇱🇧', capital: 'Beirut', region: 'Middle East', lat: 33.8938, lng: 35.5018 },
  { name: 'Iraq', code: 'iq', flag: '🇮🇶', capital: 'Baghdad', region: 'Middle East', lat: 33.3152, lng: 44.3661 },
  { name: 'Iran', code: 'ir', flag: '🇮🇷', capital: 'Tehran', region: 'Middle East', lat: 35.6892, lng: 51.3890 },
  { name: 'Morocco', code: 'ma', flag: '🇲🇦', capital: 'Rabat', region: 'Middle East', lat: 34.0209, lng: -6.8416 },
  { name: 'Algeria', code: 'dz', flag: '🇩🇿', capital: 'Algiers', region: 'Middle East', lat: 36.7538, lng: 3.0588 },
  { name: 'Tunisia', code: 'tn', flag: '🇹🇳', capital: 'Tunis', region: 'Middle East', lat: 36.8065, lng: 10.1815 },
  { name: 'Yemen', code: 'ye', flag: '🇾🇪', capital: 'Sana\'a', region: 'Middle East', lat: 15.3694, lng: 44.1910 },
  { name: 'Syria', code: 'sy', flag: '🇸🇾', capital: 'Damascus', region: 'Middle East', lat: 33.5138, lng: 36.2765 },

  // ─── AMERICAS ───
  { name: 'United States', code: 'us', flag: '🇺🇸', capital: 'Washington, D.C.', region: 'Americas', lat: 38.9072, lng: -77.0369, gnewsCode: 'us' },
  { name: 'Canada', code: 'ca', flag: '🇨🇦', capital: 'Ottawa', region: 'Americas', lat: 45.4215, lng: -75.6972, gnewsCode: 'ca' },
  { name: 'Brazil', code: 'br', flag: '🇧🇷', capital: 'Brasília', region: 'Americas', lat: -15.7975, lng: -47.8919, gnewsCode: 'br' },
  { name: 'Mexico', code: 'mx', flag: '🇲🇽', capital: 'Mexico City', region: 'Americas', lat: 19.4326, lng: -99.1332, gnewsCode: 'mx' },
  { name: 'Argentina', code: 'ar', flag: '🇦🇷', capital: 'Buenos Aires', region: 'Americas', lat: -34.6037, lng: -58.3816 },
  { name: 'Colombia', code: 'co', flag: '🇨🇴', capital: 'Bogotá', region: 'Americas', lat: 4.7110, lng: -74.0721 },
  { name: 'Chile', code: 'cl', flag: '🇨🇱', capital: 'Santiago', region: 'Americas', lat: -33.4489, lng: -70.6693 },
  { name: 'Peru', code: 'pe', flag: '🇵🇪', capital: 'Lima', region: 'Americas', lat: -12.0464, lng: -77.0428 },
  { name: 'Venezuela', code: 've', flag: '🇻🇪', capital: 'Caracas', region: 'Americas', lat: 10.4806, lng: -66.9036 },
  { name: 'Ecuador', code: 'ec', flag: '🇪🇨', capital: 'Quito', region: 'Americas', lat: -0.1807, lng: -78.4678 },
  { name: 'Cuba', code: 'cu', flag: '🇨🇺', capital: 'Havana', region: 'Americas', lat: 23.1136, lng: -82.3666 },
  { name: 'Panama', code: 'pa', flag: '🇵🇦', capital: 'Panama City', region: 'Americas', lat: 8.9824, lng: -79.5199 },
  { name: 'Costa Rica', code: 'cr', flag: '🇨🇷', capital: 'San José', region: 'Americas', lat: 9.9281, lng: -84.0907 },
  { name: 'Uruguay', code: 'uy', flag: '🇺🇾', capital: 'Montevideo', region: 'Americas', lat: -34.9011, lng: -56.1645 },
  { name: 'Bolivia', code: 'bo', flag: '🇧🇴', capital: 'La Paz', region: 'Americas', lat: -16.4897, lng: -68.1193 },
  { name: 'Dominican Republic', code: 'do', flag: '🇩🇴', capital: 'Santo Domingo', region: 'Americas', lat: 18.4861, lng: -69.9312 },
  { name: 'Jamaica', code: 'jm', flag: '🇯🇲', capital: 'Kingston', region: 'Americas', lat: 17.9714, lng: -76.7936 },
  { name: 'Guatemala', code: 'gt', flag: '🇬🇹', capital: 'Guatemala City', region: 'Americas', lat: 14.6349, lng: -90.5069 },

  // ─── EUROPE ───
  { name: 'United Kingdom', code: 'gb', flag: '🇬🇧', capital: 'London', region: 'Europe', lat: 51.5074, lng: -0.1278, gnewsCode: 'gb' },
  { name: 'Germany', code: 'de', flag: '🇩🇪', capital: 'Berlin', region: 'Europe', lat: 52.5200, lng: 13.4050, gnewsCode: 'de' },
  { name: 'France', code: 'fr', flag: '🇫🇷', capital: 'Paris', region: 'Europe', lat: 48.8566, lng: 2.3522, gnewsCode: 'fr' },
  { name: 'Italy', code: 'it', flag: '🇮🇹', capital: 'Rome', region: 'Europe', lat: 41.9028, lng: 12.4964, gnewsCode: 'it' },
  { name: 'Spain', code: 'es', flag: '🇪🇸', capital: 'Madrid', region: 'Europe', lat: 40.4168, lng: -3.7038, gnewsCode: 'es' },
  { name: 'Netherlands', code: 'nl', flag: '🇳🇱', capital: 'Amsterdam', region: 'Europe', lat: 52.3676, lng: 4.9041, gnewsCode: 'nl' },
  { name: 'Switzerland', code: 'ch', flag: '🇨🇭', capital: 'Bern', region: 'Europe', lat: 46.9480, lng: 7.4474, gnewsCode: 'ch' },
  { name: 'Sweden', code: 'se', flag: '🇸🇪', capital: 'Stockholm', region: 'Europe', lat: 59.3293, lng: 18.0686, gnewsCode: 'se' },
  { name: 'Norway', code: 'no', flag: '🇳🇴', capital: 'Oslo', region: 'Europe', lat: 59.9139, lng: 10.7522, gnewsCode: 'no' },
  { name: 'Poland', code: 'pl', flag: '🇵🇱', capital: 'Warsaw', region: 'Europe', lat: 52.2297, lng: 21.0122 },
  { name: 'Ukraine', code: 'ua', flag: '🇺🇦', capital: 'Kyiv', region: 'Europe', lat: 50.4501, lng: 30.5234, gnewsCode: 'ua' },
  { name: 'Belgium', code: 'be', flag: '🇧🇪', capital: 'Brussels', region: 'Europe', lat: 50.8503, lng: 4.3517 },
  { name: 'Austria', code: 'at', flag: '🇦🇹', capital: 'Vienna', region: 'Europe', lat: 48.2082, lng: 16.3738 },
  { name: 'Ireland', code: 'ie', flag: '🇮🇪', capital: 'Dublin', region: 'Europe', lat: 53.3498, lng: -6.2603, gnewsCode: 'ie' },
  { name: 'Portugal', code: 'pt', flag: '🇵🇹', capital: 'Lisbon', region: 'Europe', lat: 38.7223, lng: -9.1393, gnewsCode: 'pt' },
  { name: 'Greece', code: 'gr', flag: '🇬🇷', capital: 'Athens', region: 'Europe', lat: 37.9838, lng: 23.7275, gnewsCode: 'gr' },
  { name: 'Denmark', code: 'dk', flag: '🇩🇰', capital: 'Copenhagen', region: 'Europe', lat: 55.6761, lng: 12.5683 },
  { name: 'Finland', code: 'fi', flag: '🇫🇮', capital: 'Helsinki', region: 'Europe', lat: 60.1699, lng: 24.9384 },
  { name: 'Czech Republic', code: 'cz', flag: '🇨🇿', capital: 'Prague', region: 'Europe', lat: 50.0755, lng: 14.4378 },
  { name: 'Romania', code: 'ro', flag: '🇷🇴', capital: 'Bucharest', region: 'Europe', lat: 44.4268, lng: 26.1025, gnewsCode: 'ro' },
  { name: 'Hungary', code: 'hu', flag: '🇭🇺', capital: 'Budapest', region: 'Europe', lat: 47.4979, lng: 19.0402 },
  { name: 'Russia', code: 'ru', flag: '🇷🇺', capital: 'Moscow', region: 'Europe', lat: 55.7558, lng: 37.6173, gnewsCode: 'ru' },

  // ─── ASIA-PACIFIC ───
  { name: 'India', code: 'in', flag: '🇮🇳', capital: 'New Delhi', region: 'Asia-Pacific', lat: 28.6139, lng: 77.2090, gnewsCode: 'in' },
  { name: 'Japan', code: 'jp', flag: '🇯🇵', capital: 'Tokyo', region: 'Asia-Pacific', lat: 35.6762, lng: 139.6503, gnewsCode: 'jp' },
  { name: 'China', code: 'cn', flag: '🇨🇳', capital: 'Beijing', region: 'Asia-Pacific', lat: 39.9042, lng: 116.4074, gnewsCode: 'cn' },
  { name: 'Australia', code: 'au', flag: '🇦🇺', capital: 'Canberra', region: 'Asia-Pacific', lat: -35.2809, lng: 149.1300, gnewsCode: 'au' },
  { name: 'South Korea', code: 'kr', flag: '🇰🇷', capital: 'Seoul', region: 'Asia-Pacific', lat: 37.5665, lng: 126.9780 },
  { name: 'Singapore', code: 'sg', flag: '🇸🇬', capital: 'Singapore', region: 'Asia-Pacific', lat: 1.3521, lng: 103.8198, gnewsCode: 'sg' },
  { name: 'Indonesia', code: 'id', flag: '🇮🇩', capital: 'Jakarta', region: 'Asia-Pacific', lat: -6.2088, lng: 106.8456 },
  { name: 'Malaysia', code: 'my', flag: '🇲🇾', capital: 'Kuala Lumpur', region: 'Asia-Pacific', lat: 3.1390, lng: 101.6869 },
  { name: 'Thailand', code: 'th', flag: '🇹🇭', capital: 'Bangkok', region: 'Asia-Pacific', lat: 13.7563, lng: 100.5018 },
  { name: 'Philippines', code: 'ph', flag: '🇵🇭', capital: 'Manila', region: 'Asia-Pacific', lat: 14.5995, lng: 120.9842, gnewsCode: 'ph' },
  { name: 'Vietnam', code: 'vn', flag: '🇻🇳', capital: 'Hanoi', region: 'Asia-Pacific', lat: 21.0278, lng: 105.8342 },
  { name: 'Pakistan', code: 'pk', flag: '🇵🇰', capital: 'Islamabad', region: 'Asia-Pacific', lat: 33.6844, lng: 73.0479, gnewsCode: 'pk' },
  { name: 'Bangladesh', code: 'bd', flag: '🇧🇩', capital: 'Dhaka', region: 'Asia-Pacific', lat: 23.8103, lng: 90.4125 },
  { name: 'New Zealand', code: 'nz', flag: '🇳🇿', capital: 'Wellington', region: 'Asia-Pacific', lat: -41.2865, lng: 174.7762 },
  { name: 'Taiwan', code: 'tw', flag: '🇹🇼', capital: 'Taipei', region: 'Asia-Pacific', lat: 25.0330, lng: 121.5654, gnewsCode: 'tw' },
  { name: 'Hong Kong', code: 'hk', flag: '🇭🇰', capital: 'Hong Kong', region: 'Asia-Pacific', lat: 22.3193, lng: 114.1694, gnewsCode: 'hk' },
  { name: 'Sri Lanka', code: 'lk', flag: '🇱🇰', capital: 'Colombo', region: 'Asia-Pacific', lat: 6.9271, lng: 79.8612 },
  { name: 'Nepal', code: 'np', flag: '🇳🇵', capital: 'Kathmandu', region: 'Asia-Pacific', lat: 27.7172, lng: 85.3240 },
  { name: 'Kazakhstan', code: 'kz', flag: '🇰🇿', capital: 'Astana', region: 'Asia-Pacific', lat: 51.1694, lng: 71.4491 },
  { name: 'Uzbekistan', code: 'uz', flag: '🇺🇿', capital: 'Tashkent', region: 'Asia-Pacific', lat: 41.2995, lng: 69.2401 },

  // ─── AFRICA ───
  { name: 'Nigeria', code: 'ng', flag: '🇳🇬', capital: 'Abuja', region: 'Africa', lat: 9.0579, lng: 7.4951, gnewsCode: 'ng' },
  { name: 'South Africa', code: 'za', flag: '🇿🇦', capital: 'Pretoria', region: 'Africa', lat: -25.7479, lng: 28.2293 },
  { name: 'Kenya', code: 'ke', flag: '🇰🇪', capital: 'Nairobi', region: 'Africa', lat: -1.2921, lng: 36.8219 },
  { name: 'Ghana', code: 'gh', flag: '🇬🇭', capital: 'Accra', region: 'Africa', lat: 5.6037, lng: -0.1870 },
  { name: 'Ethiopia', code: 'et', flag: '🇪🇹', capital: 'Addis Ababa', region: 'Africa', lat: 9.0249, lng: 38.7469 },
  { name: 'Rwanda', code: 'rw', flag: '🇷🇼', capital: 'Kigali', region: 'Africa', lat: -1.9403, lng: 29.8739 },
  { name: 'Tanzania', code: 'tz', flag: '🇹🇿', capital: 'Dodoma', region: 'Africa', lat: -6.1630, lng: 35.7516 },
  { name: 'Uganda', code: 'ug', flag: '🇺🇬', capital: 'Kampala', region: 'Africa', lat: 0.3476, lng: 32.5825 },
  { name: 'Senegal', code: 'sn', flag: '🇸🇳', capital: 'Dakar', region: 'Africa', lat: 14.7167, lng: -17.4677 },
  { name: 'Ivory Coast', code: 'ci', flag: '🇨🇮', capital: 'Yamoussoukro', region: 'Africa', lat: 6.8276, lng: -5.2893 },
  { name: 'Cameroon', code: 'cm', flag: '🇨🇲', capital: 'Yaoundé', region: 'Africa', lat: 3.8480, lng: 11.5021 },
  { name: 'Angola', code: 'ao', flag: '🇦🇴', capital: 'Luanda', region: 'Africa', lat: -8.8390, lng: 13.2894 },
  { name: 'Zimbabwe', code: 'zw', flag: '🇿🇼', capital: 'Harare', region: 'Africa', lat: -17.8252, lng: 31.0335 },
  { name: 'Zambia', code: 'zm', flag: '🇿🇲', capital: 'Lusaka', region: 'Africa', lat: -15.3875, lng: 28.3228 },
  { name: 'Namibia', code: 'na', flag: '🇳🇦', capital: 'Windhoek', region: 'Africa', lat: -22.5609, lng: 17.0658 },
  { name: 'Botswana', code: 'bw', flag: '🇧🇼', capital: 'Gaborone', region: 'Africa', lat: -24.6282, lng: 25.9231 },
  { name: 'Mauritius', code: 'mu', flag: '🇲🇺', capital: 'Port Louis', region: 'Africa', lat: -20.1609, lng: 57.5012 },
];

// Helper: search countries by query string
export function searchCountries(query: string): CountryInfo[] {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  return COUNTRIES_DATA.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase() === q ||
      c.capital.toLowerCase().includes(q)
  );
}

// Helper: get country by name or code
export function findCountry(query: string): CountryInfo | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  return COUNTRIES_DATA.find(
    c => c.name.toLowerCase() === q || c.code.toLowerCase() === q
  );
}

// Helper: get region coordinates for cinematic globe focus
export const REGION_CENTERS: Record<GeopoliticalRegion, { lat: number; lng: number; altitude: number }> = {
  'All': { lat: 20, lng: 20, altitude: 2.5 },
  'Middle East': { lat: 26.0, lng: 48.0, altitude: 1.8 },
  'Americas': { lat: 15.0, lng: -75.0, altitude: 2.0 },
  'Europe': { lat: 48.0, lng: 15.0, altitude: 1.7 },
  'Asia-Pacific': { lat: 22.0, lng: 105.0, altitude: 2.1 },
  'Africa': { lat: 2.0, lng: 22.0, altitude: 2.0 },
};
