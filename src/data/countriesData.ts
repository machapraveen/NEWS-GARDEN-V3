// ==============================================================================
// 195 Sovereign Countries & Territories Official Directory
// 193 UN Member States + 2 UN Observers (Holy See & Palestine) = Exactly 195 Countries
// Complete with ISO 2-letter codes, official flags, capitals, coordinates, and geopolitical regions
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
  code: string; // ISO 2-letter lowercase
  flag: string;
  capital: string;
  region: GeopoliticalRegion;
  lat: number;
  lng: number;
  gnewsCode?: string; // If GNews top-headlines directly supports this 2-letter code
}

export const COUNTRIES_DATA: CountryInfo[] = [
  // ─── MIDDLE EAST (15) ───
  { name: 'United Arab Emirates', code: 'ae', flag: '🇦🇪', capital: 'Abu Dhabi', region: 'Middle East', lat: 24.4539, lng: 54.3773, gnewsCode: 'ae' },
  { name: 'Saudi Arabia', code: 'sa', flag: '🇸🇦', capital: 'Riyadh', region: 'Middle East', lat: 24.7136, lng: 46.6753, gnewsCode: 'sa' },
  { name: 'Israel', code: 'il', flag: '🇮🇱', capital: 'Jerusalem', region: 'Middle East', lat: 31.7683, lng: 35.2137, gnewsCode: 'il' },
  { name: 'Palestine', code: 'ps', flag: '🇵🇸', capital: 'Ramallah', region: 'Middle East', lat: 31.9038, lng: 35.2034 },
  { name: 'Qatar', code: 'qa', flag: '🇶🇦', capital: 'Doha', region: 'Middle East', lat: 25.2854, lng: 51.5310 },
  { name: 'Turkey', code: 'tr', flag: '🇹🇷', capital: 'Ankara', region: 'Middle East', lat: 39.9334, lng: 32.8597, gnewsCode: 'tr' },
  { name: 'Kuwait', code: 'kw', flag: '🇰🇼', capital: 'Kuwait City', region: 'Middle East', lat: 29.3759, lng: 47.9774 },
  { name: 'Oman', code: 'om', flag: '🇴🇲', capital: 'Muscat', region: 'Middle East', lat: 23.5880, lng: 58.3829 },
  { name: 'Bahrain', code: 'bh', flag: '🇧🇭', capital: 'Manama', region: 'Middle East', lat: 26.2285, lng: 50.5860 },
  { name: 'Jordan', code: 'jo', flag: '🇯🇴', capital: 'Amman', region: 'Middle East', lat: 31.9454, lng: 35.9284 },
  { name: 'Lebanon', code: 'lb', flag: '🇱🇧', capital: 'Beirut', region: 'Middle East', lat: 33.8938, lng: 35.5018 },
  { name: 'Iraq', code: 'iq', flag: '🇮🇶', capital: 'Baghdad', region: 'Middle East', lat: 33.3152, lng: 44.3661 },
  { name: 'Iran', code: 'ir', flag: '🇮🇷', capital: 'Tehran', region: 'Middle East', lat: 35.6892, lng: 51.3890 },
  { name: 'Yemen', code: 'ye', flag: '🇾🇪', capital: 'Sana\'a', region: 'Middle East', lat: 15.3694, lng: 44.1910 },
  { name: 'Syria', code: 'sy', flag: '🇸🇾', capital: 'Damascus', region: 'Middle East', lat: 33.5138, lng: 36.2765 },

  // ─── AMERICAS (35) ───
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
  { name: 'Guatemala', code: 'gt', flag: '🇬🇹', capital: 'Guatemala City', region: 'Americas', lat: 14.6349, lng: -90.5069 },
  { name: 'Dominican Republic', code: 'do', flag: '🇩🇴', capital: 'Santo Domingo', region: 'Americas', lat: 18.4861, lng: -69.9312 },
  { name: 'Haiti', code: 'ht', flag: '🇭🇹', capital: 'Port-au-Prince', region: 'Americas', lat: 18.5944, lng: -72.3074 },
  { name: 'Bolivia', code: 'bo', flag: '🇧🇴', capital: 'Sucre', region: 'Americas', lat: -19.0196, lng: -65.2619 },
  { name: 'Honduras', code: 'hn', flag: '🇭🇳', capital: 'Tegucigalpa', region: 'Americas', lat: 14.0723, lng: -87.1921 },
  { name: 'Paraguay', code: 'py', flag: '🇵🇾', capital: 'Asunción', region: 'Americas', lat: -25.2637, lng: -57.5759 },
  { name: 'Nicaragua', code: 'ni', flag: '🇳🇮', capital: 'Managua', region: 'Americas', lat: 12.1150, lng: -86.2362 },
  { name: 'El Salvador', code: 'sv', flag: '🇸🇻', capital: 'San Salvador', region: 'Americas', lat: 13.6929, lng: -89.2182 },
  { name: 'Costa Rica', code: 'cr', flag: '🇨🇷', capital: 'San José', region: 'Americas', lat: 9.9281, lng: -84.0907 },
  { name: 'Panama', code: 'pa', flag: '🇵🇦', capital: 'Panama City', region: 'Americas', lat: 8.9824, lng: -79.5199 },
  { name: 'Uruguay', code: 'uy', flag: '🇺🇾', capital: 'Montevideo', region: 'Americas', lat: -34.9011, lng: -56.1645 },
  { name: 'Jamaica', code: 'jm', flag: '🇯🇲', capital: 'Kingston', region: 'Americas', lat: 17.9712, lng: -76.7928 },
  { name: 'Trinidad and Tobago', code: 'tt', flag: '🇹🇹', capital: 'Port of Spain', region: 'Americas', lat: 10.6549, lng: -61.5019 },
  { name: 'Guyana', code: 'gy', flag: '🇬🇾', capital: 'Georgetown', region: 'Americas', lat: 6.8013, lng: -58.1551 },
  { name: 'Suriname', code: 'sr', flag: '🇸🇷', capital: 'Paramaribo', region: 'Americas', lat: 5.8520, lng: -55.2038 },
  { name: 'Bahamas', code: 'bs', flag: '🇧🇸', capital: 'Nassau', region: 'Americas', lat: 25.0443, lng: -77.3504 },
  { name: 'Belize', code: 'bz', flag: '🇧🇿', capital: 'Belmopan', region: 'Americas', lat: 17.2510, lng: -88.7590 },
  { name: 'Barbados', code: 'bb', flag: '🇧🇧', capital: 'Bridgetown', region: 'Americas', lat: 13.1939, lng: -59.5432 },
  { name: 'Saint Lucia', code: 'lc', flag: '🇱🇨', capital: 'Castries', region: 'Americas', lat: 14.0101, lng: -60.9875 },
  { name: 'Saint Vincent and the Grenadines', code: 'vc', flag: '🇻🇨', capital: 'Kingstown', region: 'Americas', lat: 13.1600, lng: -61.2248 },
  { name: 'Grenada', code: 'gd', flag: '🇬🇩', capital: 'St. George\'s', region: 'Americas', lat: 12.0561, lng: -61.7488 },
  { name: 'Antigua and Barbuda', code: 'ag', flag: '🇦🇬', capital: 'St. John\'s', region: 'Americas', lat: 17.1274, lng: -61.8468 },
  { name: 'Dominica', code: 'dm', flag: '🇩🇲', capital: 'Roseau', region: 'Americas', lat: 15.3092, lng: -61.3794 },
  { name: 'Saint Kitts and Nevis', code: 'kn', flag: '🇰🇳', capital: 'Basseterre', region: 'Americas', lat: 17.3578, lng: -62.7830 },

  // ─── EUROPE (45) ───
  { name: 'United Kingdom', code: 'gb', flag: '🇬🇧', capital: 'London', region: 'Europe', lat: 51.5074, lng: -0.1278, gnewsCode: 'gb' },
  { name: 'Germany', code: 'de', flag: '🇩🇪', capital: 'Berlin', region: 'Europe', lat: 52.5200, lng: 13.4050, gnewsCode: 'de' },
  { name: 'France', code: 'fr', flag: '🇫🇷', capital: 'Paris', region: 'Europe', lat: 48.8566, lng: 2.3522, gnewsCode: 'fr' },
  { name: 'Italy', code: 'it', flag: '🇮🇹', capital: 'Rome', region: 'Europe', lat: 41.9028, lng: 12.4964, gnewsCode: 'it' },
  { name: 'Spain', code: 'es', flag: '🇪🇸', capital: 'Madrid', region: 'Europe', lat: 40.4168, lng: -3.7038, gnewsCode: 'es' },
  { name: 'Ukraine', code: 'ua', flag: '🇺🇦', capital: 'Kyiv', region: 'Europe', lat: 50.4501, lng: 30.5234, gnewsCode: 'ua' },
  { name: 'Poland', code: 'pl', flag: '🇵🇱', capital: 'Warsaw', region: 'Europe', lat: 52.2297, lng: 21.0122 },
  { name: 'Romania', code: 'ro', flag: '🇷🇴', capital: 'Bucharest', region: 'Europe', lat: 44.4268, lng: 26.1025, gnewsCode: 'ro' },
  { name: 'Netherlands', code: 'nl', flag: '🇳🇱', capital: 'Amsterdam', region: 'Europe', lat: 52.3676, lng: 4.9041, gnewsCode: 'nl' },
  { name: 'Belgium', code: 'be', flag: '🇧🇪', capital: 'Brussels', region: 'Europe', lat: 50.8503, lng: 4.3517 },
  { name: 'Czech Republic', code: 'cz', flag: '🇨🇿', capital: 'Prague', region: 'Europe', lat: 50.0755, lng: 14.4378 },
  { name: 'Greece', code: 'gr', flag: '🇬🇷', capital: 'Athens', region: 'Europe', lat: 37.9838, lng: 23.7275, gnewsCode: 'gr' },
  { name: 'Portugal', code: 'pt', flag: '🇵🇹', capital: 'Lisbon', region: 'Europe', lat: 38.7223, lng: -9.1393, gnewsCode: 'pt' },
  { name: 'Sweden', code: 'se', flag: '🇸🇪', capital: 'Stockholm', region: 'Europe', lat: 59.3293, lng: 18.0686, gnewsCode: 'se' },
  { name: 'Hungary', code: 'hu', flag: '🇭🇺', capital: 'Budapest', region: 'Europe', lat: 47.4979, lng: 19.0402 },
  { name: 'Belarus', code: 'by', flag: '🇧🇾', capital: 'Minsk', region: 'Europe', lat: 53.9006, lng: 27.5590 },
  { name: 'Austria', code: 'at', flag: '🇦🇹', capital: 'Vienna', region: 'Europe', lat: 48.2082, lng: 16.3738 },
  { name: 'Switzerland', code: 'ch', flag: '🇨🇭', capital: 'Bern', region: 'Europe', lat: 46.9480, lng: 7.4474, gnewsCode: 'ch' },
  { name: 'Bulgaria', code: 'bg', flag: '🇧🇬', capital: 'Sofia', region: 'Europe', lat: 42.6977, lng: 23.3219 },
  { name: 'Serbia', code: 'rs', flag: '🇷🇸', capital: 'Belgrade', region: 'Europe', lat: 44.7866, lng: 20.4489 },
  { name: 'Denmark', code: 'dk', flag: '🇩🇰', capital: 'Copenhagen', region: 'Europe', lat: 55.6761, lng: 12.5683 },
  { name: 'Finland', code: 'fi', flag: '🇫🇮', capital: 'Helsinki', region: 'Europe', lat: 60.1699, lng: 24.9384 },
  { name: 'Norway', code: 'no', flag: '🇳🇴', capital: 'Oslo', region: 'Europe', lat: 59.9139, lng: 10.7522, gnewsCode: 'no' },
  { name: 'Slovakia', code: 'sk', flag: '🇸🇰', capital: 'Bratislava', region: 'Europe', lat: 48.1486, lng: 17.1077 },
  { name: 'Ireland', code: 'ie', flag: '🇮🇪', capital: 'Dublin', region: 'Europe', lat: 53.3498, lng: -6.2603, gnewsCode: 'ie' },
  { name: 'Croatia', code: 'hr', flag: '🇭🇷', capital: 'Zagreb', region: 'Europe', lat: 45.8150, lng: 15.9819 },
  { name: 'Bosnia and Herzegovina', code: 'ba', flag: '🇧🇦', capital: 'Sarajevo', region: 'Europe', lat: 43.8563, lng: 18.4131 },
  { name: 'Albania', code: 'al', flag: '🇦🇱', capital: 'Tirana', region: 'Europe', lat: 41.3275, lng: 19.8187 },
  { name: 'Lithuania', code: 'lt', flag: '🇱🇹', capital: 'Vilnius', region: 'Europe', lat: 54.6872, lng: 25.2797 },
  { name: 'Moldova', code: 'md', flag: '🇲🇩', capital: 'Chișinău', region: 'Europe', lat: 47.0105, lng: 28.8638 },
  { name: 'Slovenia', code: 'si', flag: '🇸🇮', capital: 'Ljubljana', region: 'Europe', lat: 46.0569, lng: 14.5058 },
  { name: 'North Macedonia', code: 'mk', flag: '🇲🇰', capital: 'Skopje', region: 'Europe', lat: 41.9981, lng: 21.4254 },
  { name: 'Latvia', code: 'lv', flag: '🇱🇻', capital: 'Riga', region: 'Europe', lat: 56.9496, lng: 24.1052 },
  { name: 'Estonia', code: 'ee', flag: '🇪🇪', capital: 'Tallinn', region: 'Europe', lat: 59.4370, lng: 24.7536 },
  { name: 'Cyprus', code: 'cy', flag: '🇨🇾', capital: 'Nicosia', region: 'Europe', lat: 35.1856, lng: 33.3823 },
  { name: 'Luxembourg', code: 'lu', flag: '🇱🇺', capital: 'Luxembourg City', region: 'Europe', lat: 49.6116, lng: 6.1319 },
  { name: 'Montenegro', code: 'me', flag: '🇲🇪', capital: 'Podgorica', region: 'Europe', lat: 42.4304, lng: 19.2594 },
  { name: 'Malta', code: 'mt', flag: '🇲🇹', capital: 'Valletta', region: 'Europe', lat: 35.8989, lng: 14.5146 },
  { name: 'Iceland', code: 'is', flag: '🇮🇸', capital: 'Reykjavik', region: 'Europe', lat: 64.1466, lng: -21.9426 },
  { name: 'Andorra', code: 'ad', flag: '🇦🇩', capital: 'Andorra la Vella', region: 'Europe', lat: 42.5063, lng: 1.5218 },
  { name: 'Monaco', code: 'mc', flag: '🇲🇨', capital: 'Monaco', region: 'Europe', lat: 43.7384, lng: 7.4246 },
  { name: 'Liechtenstein', code: 'li', flag: '🇱🇮', capital: 'Vaduz', region: 'Europe', lat: 47.1410, lng: 9.5209 },
  { name: 'San Marino', code: 'sm', flag: '🇸🇲', capital: 'San Marino', region: 'Europe', lat: 43.9424, lng: 12.4578 },
  { name: 'Holy See', code: 'va', flag: '🇻🇦', capital: 'Vatican City', region: 'Europe', lat: 41.9029, lng: 12.4534 },
  { name: 'Russia', code: 'ru', flag: '🇷🇺', capital: 'Moscow', region: 'Europe', lat: 55.7558, lng: 37.6173, gnewsCode: 'ru' },

  // ─── ASIA-PACIFIC (46) ───
  { name: 'India', code: 'in', flag: '🇮🇳', capital: 'New Delhi', region: 'Asia-Pacific', lat: 28.6139, lng: 77.2090, gnewsCode: 'in' },
  { name: 'China', code: 'cn', flag: '🇨🇳', capital: 'Beijing', region: 'Asia-Pacific', lat: 39.9042, lng: 116.4074, gnewsCode: 'cn' },
  { name: 'Indonesia', code: 'id', flag: '🇮🇩', capital: 'Jakarta', region: 'Asia-Pacific', lat: -6.2088, lng: 106.8456 },
  { name: 'Pakistan', code: 'pk', flag: '🇵🇰', capital: 'Islamabad', region: 'Asia-Pacific', lat: 33.6844, lng: 73.0479, gnewsCode: 'pk' },
  { name: 'Bangladesh', code: 'bd', flag: '🇧🇩', capital: 'Dhaka', region: 'Asia-Pacific', lat: 23.8103, lng: 90.4125 },
  { name: 'Japan', code: 'jp', flag: '🇯🇵', capital: 'Tokyo', region: 'Asia-Pacific', lat: 35.6762, lng: 139.6503, gnewsCode: 'jp' },
  { name: 'Philippines', code: 'ph', flag: '🇵🇭', capital: 'Manila', region: 'Asia-Pacific', lat: 14.5995, lng: 120.9842, gnewsCode: 'ph' },
  { name: 'Vietnam', code: 'vn', flag: '🇻🇳', capital: 'Hanoi', region: 'Asia-Pacific', lat: 21.0278, lng: 105.8342 },
  { name: 'Thailand', code: 'th', flag: '🇹🇭', capital: 'Bangkok', region: 'Asia-Pacific', lat: 13.7563, lng: 100.5018 },
  { name: 'Myanmar', code: 'mm', flag: '🇲🇲', capital: 'Naypyidaw', region: 'Asia-Pacific', lat: 19.7633, lng: 96.0785 },
  { name: 'South Korea', code: 'kr', flag: '🇰🇷', capital: 'Seoul', region: 'Asia-Pacific', lat: 37.5665, lng: 126.9780 },
  { name: 'North Korea', code: 'kp', flag: '🇰🇵', capital: 'Pyongyang', region: 'Asia-Pacific', lat: 39.0392, lng: 125.7625 },
  { name: 'Afghanistan', code: 'af', flag: '🇦🇫', capital: 'Kabul', region: 'Asia-Pacific', lat: 34.5553, lng: 69.2075 },
  { name: 'Uzbekistan', code: 'uz', flag: '🇺🇿', capital: 'Tashkent', region: 'Asia-Pacific', lat: 41.2995, lng: 69.2401 },
  { name: 'Malaysia', code: 'my', flag: '🇲🇾', capital: 'Kuala Lumpur', region: 'Asia-Pacific', lat: 3.1390, lng: 101.6869 },
  { name: 'Nepal', code: 'np', flag: '🇳🇵', capital: 'Kathmandu', region: 'Asia-Pacific', lat: 27.7172, lng: 85.3240 },
  { name: 'Australia', code: 'au', flag: '🇦🇺', capital: 'Canberra', region: 'Asia-Pacific', lat: -35.2809, lng: 149.1300, gnewsCode: 'au' },
  { name: 'Sri Lanka', code: 'lk', flag: '🇱🇰', capital: 'Colombo', region: 'Asia-Pacific', lat: 6.9271, lng: 79.8612 },
  { name: 'Kazakhstan', code: 'kz', flag: '🇰🇿', capital: 'Astana', region: 'Asia-Pacific', lat: 51.1694, lng: 71.4491 },
  { name: 'Cambodia', code: 'kh', flag: '🇰🇭', capital: 'Phnom Penh', region: 'Asia-Pacific', lat: 11.5564, lng: 104.9282 },
  { name: 'Papua New Guinea', code: 'pg', flag: '🇵🇬', capital: 'Port Moresby', region: 'Asia-Pacific', lat: -9.4438, lng: 147.1803 },
  { name: 'Tajikistan', code: 'tj', flag: '🇹🇯', capital: 'Dushanbe', region: 'Asia-Pacific', lat: 38.5598, lng: 68.7870 },
  { name: 'Laos', code: 'la', flag: '🇱🇦', capital: 'Vientiane', region: 'Asia-Pacific', lat: 17.9757, lng: 102.6331 },
  { name: 'Kyrgyzstan', code: 'kg', flag: '🇰🇬', capital: 'Bishkek', region: 'Asia-Pacific', lat: 42.8746, lng: 74.5698 },
  { name: 'Turkmenistan', code: 'tm', flag: '🇹🇲', capital: 'Ashgabat', region: 'Asia-Pacific', lat: 37.9601, lng: 58.3261 },
  { name: 'Singapore', code: 'sg', flag: '🇸🇬', capital: 'Singapore', region: 'Asia-Pacific', lat: 1.3521, lng: 103.8198, gnewsCode: 'sg' },
  { name: 'New Zealand', code: 'nz', flag: '🇳🇿', capital: 'Wellington', region: 'Asia-Pacific', lat: -41.2865, lng: 174.7762 },
  { name: 'Mongolia', code: 'mn', flag: '🇲🇳', capital: 'Ulaanbaatar', region: 'Asia-Pacific', lat: 47.9188, lng: 106.9176 },
  { name: 'Armenia', code: 'am', flag: '🇦🇲', capital: 'Yerevan', region: 'Asia-Pacific', lat: 40.1792, lng: 44.4991 },
  { name: 'Azerbaijan', code: 'az', flag: '🇦🇿', capital: 'Baku', region: 'Asia-Pacific', lat: 40.4093, lng: 49.8671 },
  { name: 'Georgia', code: 'ge', flag: '🇬🇪', capital: 'Tbilisi', region: 'Asia-Pacific', lat: 41.7151, lng: 44.8271 },
  { name: 'Timor-Leste', code: 'tl', flag: '🇹🇱', capital: 'Dili', region: 'Asia-Pacific', lat: -8.5569, lng: 125.5603 },
  { name: 'Fiji', code: 'fj', flag: '🇫🇯', capital: 'Suva', region: 'Asia-Pacific', lat: -18.1416, lng: 178.4419 },
  { name: 'Bhutan', code: 'bt', flag: '🇧🇹', capital: 'Thimphu', region: 'Asia-Pacific', lat: 27.4728, lng: 89.6393 },
  { name: 'Solomon Islands', code: 'sb', flag: '🇸🇧', capital: 'Honiara', region: 'Asia-Pacific', lat: -9.4456, lng: 159.9729 },
  { name: 'Maldives', code: 'mv', flag: '🇲🇻', capital: 'Malé', region: 'Asia-Pacific', lat: 4.1755, lng: 73.5093 },
  { name: 'Brunei', code: 'bn', flag: '🇧🇳', capital: 'Bandar Seri Begawan', region: 'Asia-Pacific', lat: 4.9031, lng: 114.9398 },
  { name: 'Vanuatu', code: 'vu', flag: '🇻🇺', capital: 'Port Vila', region: 'Asia-Pacific', lat: -17.7333, lng: 168.3273 },
  { name: 'Samoa', code: 'ws', flag: '🇼🇸', capital: 'Apia', region: 'Asia-Pacific', lat: -13.8333, lng: -171.7667 },
  { name: 'Kiribati', code: 'ki', flag: '🇰🇮', capital: 'Tarawa', region: 'Asia-Pacific', lat: 1.4518, lng: 172.9717 },
  { name: 'Micronesia', code: 'fm', flag: '🇫🇲', capital: 'Palikir', region: 'Asia-Pacific', lat: 6.9248, lng: 158.1611 },
  { name: 'Tonga', code: 'to', flag: '🇹🇴', capital: 'Nuku\'alofa', region: 'Asia-Pacific', lat: -21.1789, lng: -175.1982 },
  { name: 'Marshall Islands', code: 'mh', flag: '🇲🇭', capital: 'Majuro', region: 'Asia-Pacific', lat: 7.1315, lng: 171.1845 },
  { name: 'Palau', code: 'pw', flag: '🇵🇼', capital: 'Ngerulmud', region: 'Asia-Pacific', lat: 7.5004, lng: 134.6242 },
  { name: 'Nauru', code: 'nr', flag: '🇳🇷', capital: 'Yaren', region: 'Asia-Pacific', lat: -0.5228, lng: 166.9315 },
  { name: 'Tuvalu', code: 'tv', flag: '🇹🇻', capital: 'Funafuti', region: 'Asia-Pacific', lat: -8.5167, lng: 179.2167 },

  // ─── AFRICA (54) ───
  { name: 'Nigeria', code: 'ng', flag: '🇳🇬', capital: 'Abuja', region: 'Africa', lat: 9.0579, lng: 7.4951, gnewsCode: 'ng' },
  { name: 'Ethiopia', code: 'et', flag: '🇪🇹', capital: 'Addis Ababa', region: 'Africa', lat: 9.0249, lng: 38.7469 },
  { name: 'Egypt', code: 'eg', flag: '🇪🇬', capital: 'Cairo', region: 'Africa', lat: 30.0444, lng: 31.2357, gnewsCode: 'eg' },
  { name: 'Democratic Republic of the Congo', code: 'cd', flag: '🇨🇩', capital: 'Kinshasa', region: 'Africa', lat: -4.4419, lng: 15.2663 },
  { name: 'Tanzania', code: 'tz', flag: '🇹🇿', capital: 'Dodoma', region: 'Africa', lat: -6.1630, lng: 35.7516 },
  { name: 'South Africa', code: 'za', flag: '🇿🇦', capital: 'Pretoria', region: 'Africa', lat: -25.7479, lng: 28.2293 },
  { name: 'Kenya', code: 'ke', flag: '🇰🇪', capital: 'Nairobi', region: 'Africa', lat: -1.2921, lng: 36.8219 },
  { name: 'Uganda', code: 'ug', flag: '🇺🇬', capital: 'Kampala', region: 'Africa', lat: 0.3476, lng: 32.5825 },
  { name: 'Sudan', code: 'sd', flag: '🇸🇩', capital: 'Khartoum', region: 'Africa', lat: 15.5007, lng: 32.5599 },
  { name: 'Algeria', code: 'dz', flag: '🇩🇿', capital: 'Algiers', region: 'Africa', lat: 36.7538, lng: 3.0588 },
  { name: 'Morocco', code: 'ma', flag: '🇲🇦', capital: 'Rabat', region: 'Africa', lat: 34.0209, lng: -6.8416 },
  { name: 'Angola', code: 'ao', flag: '🇦🇴', capital: 'Luanda', region: 'Africa', lat: -8.8390, lng: 13.2894 },
  { name: 'Ghana', code: 'gh', flag: '🇬🇭', capital: 'Accra', region: 'Africa', lat: 5.6037, lng: -0.1870 },
  { name: 'Mozambique', code: 'mz', flag: '🇲🇿', capital: 'Maputo', region: 'Africa', lat: -25.9692, lng: 32.5732 },
  { name: 'Madagascar', code: 'mg', flag: '🇲🇬', capital: 'Antananarivo', region: 'Africa', lat: -18.8792, lng: 47.5079 },
  { name: 'Ivory Coast', code: 'ci', flag: '🇨🇮', capital: 'Yamoussoukro', region: 'Africa', lat: 6.8276, lng: -5.2893 },
  { name: 'Cameroon', code: 'cm', flag: '🇨🇲', capital: 'Yaoundé', region: 'Africa', lat: 3.8480, lng: 11.5021 },
  { name: 'Niger', code: 'ne', flag: '🇳🇪', capital: 'Niamey', region: 'Africa', lat: 13.5116, lng: 2.1254 },
  { name: 'Mali', code: 'ml', flag: '🇲🇱', capital: 'Bamako', region: 'Africa', lat: 12.6392, lng: -8.0029 },
  { name: 'Burkina Faso', code: 'bf', flag: '🇧🇫', capital: 'Ouagadougou', region: 'Africa', lat: 12.3714, lng: -1.5197 },
  { name: 'Malawi', code: 'mw', flag: '🇲🇼', capital: 'Lilongwe', region: 'Africa', lat: -13.9626, lng: 33.7741 },
  { name: 'Zambia', code: 'zm', flag: '🇿🇲', capital: 'Lusaka', region: 'Africa', lat: -15.3875, lng: 28.3228 },
  { name: 'Chad', code: 'td', flag: '🇹🇩', capital: 'N\'Djamena', region: 'Africa', lat: 12.1348, lng: 15.0557 },
  { name: 'Somalia', code: 'so', flag: '🇸🇴', capital: 'Mogadishu', region: 'Africa', lat: 2.0469, lng: 45.3182 },
  { name: 'Senegal', code: 'sn', flag: '🇸🇳', capital: 'Dakar', region: 'Africa', lat: 14.7167, lng: -17.4677 },
  { name: 'Zimbabwe', code: 'zw', flag: '🇿🇼', capital: 'Harare', region: 'Africa', lat: -17.8252, lng: 31.0335 },
  { name: 'Guinea', code: 'gn', flag: '🇬🇳', capital: 'Conakry', region: 'Africa', lat: 9.6412, lng: -13.5784 },
  { name: 'Rwanda', code: 'rw', flag: '🇷🇼', capital: 'Kigali', region: 'Africa', lat: -1.9403, lng: 29.8739 },
  { name: 'Benin', code: 'bj', flag: '🇧🇯', capital: 'Porto-Novo', region: 'Africa', lat: 6.4969, lng: 2.6289 },
  { name: 'Burundi', code: 'bi', flag: '🇧🇮', capital: 'Gitega', region: 'Africa', lat: -3.4273, lng: 29.9246 },
  { name: 'Tunisia', code: 'tn', flag: '🇹🇳', capital: 'Tunis', region: 'Africa', lat: 36.8065, lng: 10.1815 },
  { name: 'South Sudan', code: 'ss', flag: '🇸🇸', capital: 'Juba', region: 'Africa', lat: 4.8594, lng: 31.5713 },
  { name: 'Togo', code: 'tg', flag: '🇹🇬', capital: 'Lomé', region: 'Africa', lat: 6.1725, lng: 1.2314 },
  { name: 'Sierra Leone', code: 'sl', flag: '🇸🇱', capital: 'Freetown', region: 'Africa', lat: 8.4840, lng: -13.2299 },
  { name: 'Libya', code: 'ly', flag: '🇱🇾', capital: 'Tripoli', region: 'Africa', lat: 32.8872, lng: 13.1913 },
  { name: 'Congo', code: 'cg', flag: '🇨🇬', capital: 'Brazzaville', region: 'Africa', lat: -4.2634, lng: 15.2429 },
  { name: 'Liberia', code: 'lr', flag: '🇱🇷', capital: 'Monrovia', region: 'Africa', lat: 6.3156, lng: -10.8074 },
  { name: 'Central African Republic', code: 'cf', flag: '🇨🇫', capital: 'Bangui', region: 'Africa', lat: 4.3947, lng: 18.5582 },
  { name: 'Mauritania', code: 'mr', flag: '🇲🇷', capital: 'Nouakchott', region: 'Africa', lat: 18.0735, lng: -15.9582 },
  { name: 'Eritrea', code: 'er', flag: '🇪🇷', capital: 'Asmara', region: 'Africa', lat: 15.3229, lng: 38.9251 },
  { name: 'Namibia', code: 'na', flag: '🇳🇦', capital: 'Windhoek', region: 'Africa', lat: -22.5609, lng: 17.0658 },
  { name: 'Gambia', code: 'gm', flag: '🇬🇲', capital: 'Banjul', region: 'Africa', lat: 13.4549, lng: -16.5790 },
  { name: 'Botswana', code: 'bw', flag: '🇧🇼', capital: 'Gaborone', region: 'Africa', lat: -24.6282, lng: 25.9231 },
  { name: 'Gabon', code: 'ga', flag: '🇬🇦', capital: 'Libreville', region: 'Africa', lat: 0.4162, lng: 9.4673 },
  { name: 'Lesotho', code: 'ls', flag: '🇱🇸', capital: 'Maseru', region: 'Africa', lat: -29.3151, lng: 27.4869 },
  { name: 'Guinea-Bissau', code: 'gw', flag: '🇬🇼', capital: 'Bissau', region: 'Africa', lat: 11.8816, lng: -15.6178 },
  { name: 'Equatorial Guinea', code: 'gq', flag: '🇬🇶', capital: 'Malabo', region: 'Africa', lat: 3.7504, lng: 8.7371 },
  { name: 'Mauritius', code: 'mu', flag: '🇲🇺', capital: 'Port Louis', region: 'Africa', lat: -20.1609, lng: 57.5012 },
  { name: 'Eswatini', code: 'sz', flag: '🇸🇿', capital: 'Mbabane', region: 'Africa', lat: -26.3054, lng: 31.1367 },
  { name: 'Djibouti', code: 'dj', flag: '🇩🇯', capital: 'Djibouti City', region: 'Africa', lat: 11.5721, lng: 43.1456 },
  { name: 'Comoros', code: 'km', flag: '🇰🇲', capital: 'Moroni', region: 'Africa', lat: -11.7172, lng: 43.2473 },
  { name: 'Cape Verde', code: 'cv', flag: '🇨🇻', capital: 'Praia', region: 'Africa', lat: 14.9330, lng: -23.5133 },
  { name: 'Sao Tome and Principe', code: 'st', flag: '🇸🇹', capital: 'São Tomé', region: 'Africa', lat: 0.3302, lng: 6.7273 },
  { name: 'Seychelles', code: 'sc', flag: '🇸🇨', capital: 'Victoria', region: 'Africa', lat: -4.6191, lng: 55.4513 },
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
