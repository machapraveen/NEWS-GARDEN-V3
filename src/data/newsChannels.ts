// ============================================================
// News Channels Data — Global News Channel Directory
// ============================================================

export interface Channel {
  name: string;
  lang: string;
  url: string;
  type?: string;
  scope?: 'global' | 'national' | 'state';
}

export interface CountryData {
  continent: string;
  channels: Channel[];
  states?: Record<string, Channel[]>;
}

export type NewsChannelsMap = Record<string, CountryData>;

export const CONTINENT_COLORS: Record<string, string> = {
  'Asia': '#FF6B35',
  'Middle East': '#E8AA14',
  'Europe': '#4ECDC4',
  'N. America': '#7B68EE',
  'S. America': '#FF69B4',
  'Africa': '#45B7D1',
  'Oceania': '#98D8C8',
};

// Country ID → Name mapping for topojson features
export const COUNTRY_ID_MAP: Record<number, string> = {
  4: 'Afghanistan', 8: 'Albania', 12: 'Algeria', 24: 'Angola',
  32: 'Argentina', 36: 'Australia', 40: 'Austria', 50: 'Bangladesh',
  56: 'Belgium', 64: 'Bhutan', 68: 'Bolivia', 70: 'Bosnia and Herz.',
  72: 'Botswana', 76: 'Brazil', 96: 'Brunei', 100: 'Bulgaria',
  104: 'Myanmar', 108: 'Burundi', 116: 'Cambodia', 120: 'Cameroon',
  124: 'Canada', 140: 'Central African Rep.', 144: 'Sri Lanka',
  148: 'Chad', 152: 'Chile', 156: 'China', 170: 'Colombia',
  178: 'Congo', 180: 'Dem. Rep. Congo', 188: 'Costa Rica',
  191: 'Croatia', 192: 'Cuba', 196: 'Cyprus', 203: 'Czech Rep.',
  208: 'Denmark', 214: 'Dominican Rep.', 218: 'Ecuador',
  818: 'Egypt', 222: 'El Salvador', 226: 'Eq. Guinea',
  232: 'Eritrea', 233: 'Estonia', 231: 'Ethiopia', 242: 'Fiji',
  246: 'Finland', 250: 'France', 266: 'Gabon', 270: 'Gambia',
  268: 'Georgia', 276: 'Germany', 288: 'Ghana', 300: 'Greece',
  320: 'Guatemala', 324: 'Guinea', 328: 'Guyana', 332: 'Haiti',
  340: 'Honduras', 348: 'Hungary', 352: 'Iceland', 356: 'India',
  360: 'Indonesia', 364: 'Iran', 368: 'Iraq', 372: 'Ireland',
  376: 'Israel', 380: 'Italy', 384: 'Ivory Coast', 388: 'Jamaica',
  392: 'Japan', 400: 'Jordan', 398: 'Kazakhstan', 404: 'Kenya',
  408: 'North Korea', 410: 'S. Korea', 414: 'Kuwait',
  418: 'Laos', 422: 'Lebanon', 426: 'Lesotho', 430: 'Liberia',
  434: 'Libya', 440: 'Lithuania', 442: 'Luxembourg',
  450: 'Madagascar', 454: 'Malawi', 458: 'Malaysia', 466: 'Mali',
  478: 'Mauritania', 484: 'Mexico', 496: 'Mongolia',
  498: 'Moldova', 504: 'Morocco', 508: 'Mozambique',
  516: 'Namibia', 524: 'Nepal', 528: 'Netherlands',
  554: 'New Zealand', 558: 'Nicaragua', 562: 'Niger',
  566: 'Nigeria', 578: 'Norway', 512: 'Oman', 586: 'Pakistan',
  591: 'Panama', 598: 'Papua New Guinea', 600: 'Paraguay',
  604: 'Peru', 608: 'Philippines', 616: 'Poland',
  620: 'Portugal', 630: 'Puerto Rico', 634: 'Qatar',
  642: 'Romania', 643: 'Russia', 646: 'Rwanda',
  682: 'Saudi Arabia', 686: 'Senegal', 688: 'Serbia',
  694: 'Sierra Leone', 702: 'Singapore', 703: 'Slovakia',
  704: 'Vietnam', 705: 'Slovenia', 706: 'Somalia',
  710: 'South Africa', 716: 'Zimbabwe', 724: 'Spain',
  728: 'S. Sudan', 736: 'Sudan', 740: 'Suriname',
  748: 'Swaziland', 752: 'Sweden', 756: 'Switzerland',
  760: 'Syria', 762: 'Tajikistan', 764: 'Thailand', 768: 'Togo',
  780: 'Trinidad and Tobago', 784: 'United Arab Emirates',
  788: 'Tunisia', 792: 'Turkey', 795: 'Turkmenistan',
  800: 'Uganda', 804: 'Ukraine', 826: 'United Kingdom',
  834: 'Tanzania', 840: 'United States of America',
  854: 'Burkina Faso', 858: 'Uruguay', 860: 'Uzbekistan',
  862: 'Venezuela', 887: 'Yemen', 894: 'Zambia',
};

export const NEWS_CHANNELS: NewsChannelsMap = {
  // ========== ASIA ==========
  India: {
    continent: 'Asia',
    channels: [
      { name: 'NDTV 24x7', lang: 'English', url: 'https://www.youtube.com/@NDTV', type: 'Private', scope: 'national' },
      { name: 'Aaj Tak', lang: 'Hindi', url: 'https://www.youtube.com/@aajtak', type: 'Private', scope: 'national' },
      { name: 'NDTV India', lang: 'Hindi', url: 'https://www.youtube.com/@NDTVIndia', type: 'Private', scope: 'national' },
      { name: 'DD News', lang: 'Hindi', url: 'https://www.youtube.com/@DDNewslive', type: 'Public', scope: 'national' },
      { name: 'WION', lang: 'English', url: 'https://www.youtube.com/@WIONews', type: 'Private', scope: 'national' },
      { name: 'ABP News', lang: 'Hindi', url: 'https://www.youtube.com/@ABPNews', type: 'Private', scope: 'national' },
      { name: 'India Today', lang: 'English', url: 'https://www.youtube.com/@IndiaToday', type: 'Private', scope: 'national' },
      { name: 'Zee News', lang: 'Hindi', url: 'https://www.youtube.com/@zeenews', type: 'Private', scope: 'national' },
      { name: 'Republic World', lang: 'English', url: 'https://www.youtube.com/@RepublicWorld', type: 'Private', scope: 'national' },
      { name: 'News18 India', lang: 'Hindi', url: 'https://www.youtube.com/@News18India', type: 'Private', scope: 'national' },
      { name: 'TV9 Bharatvarsh', lang: 'Hindi', url: 'https://www.youtube.com/@TV9Bharatvarsh', type: 'Private', scope: 'national' },
      { name: 'CNN-News18', lang: 'English', url: 'https://www.youtube.com/@CNNnews18', type: 'Private', scope: 'national' },
      { name: 'The Quint', lang: 'English/Hindi', url: 'https://www.youtube.com/@TheQuint', type: 'Digital', scope: 'national' },
      { name: 'The Wire', lang: 'English/Hindi', url: 'https://www.youtube.com/@TheWireNews', type: 'Digital', scope: 'national' },
      { name: 'MIRROR NOW', lang: 'English', url: 'https://www.youtube.com/@MirrorNow', type: 'Private', scope: 'national' },
    ],
    states: {
      'Andhra Pradesh': [
        { name: 'TV9 Telugu', lang: 'Telugu', url: 'https://www.youtube.com/@TV9Telugu' },
        { name: 'ABN Andhra Jyothi', lang: 'Telugu', url: 'https://www.youtube.com/@ABNTelugu' },
        { name: 'Sakshi TV', lang: 'Telugu', url: 'https://www.youtube.com/@SakshiTV' },
        { name: 'NTV Telugu', lang: 'Telugu', url: 'https://www.youtube.com/@NTVTelugu' },
      ],
      'Telangana': [
        { name: 'V6 News Telugu', lang: 'Telugu', url: 'https://www.youtube.com/@V6NewsTelugu' },
        { name: 'T News', lang: 'Telugu', url: 'https://www.youtube.com/@TNewsLive' },
        { name: 'HMTV', lang: 'Telugu', url: 'https://www.youtube.com/@hmtvnewslive' },
      ],
      'Tamil Nadu': [
        { name: 'Thanthi TV', lang: 'Tamil', url: 'https://www.youtube.com/@ThanthiTV' },
        { name: 'Puthiya Thalaimurai', lang: 'Tamil', url: 'https://www.youtube.com/@PuthiyaThalaimurai' },
        { name: 'Sun News', lang: 'Tamil', url: 'https://www.youtube.com/@SunNews' },
        { name: 'Polimer News', lang: 'Tamil', url: 'https://www.youtube.com/@PolimerNews' },
        { name: 'News18 Tamil Nadu', lang: 'Tamil', url: 'https://www.youtube.com/@News18TamilNadu' },
      ],
      'Kerala': [
        { name: 'Manorama News', lang: 'Malayalam', url: 'https://www.youtube.com/@manoramanews' },
        { name: 'Mathrubhumi News', lang: 'Malayalam', url: 'https://www.youtube.com/@MathrubhumiNews' },
        { name: 'Asianet News', lang: 'Malayalam', url: 'https://www.youtube.com/@AsianetNews' },
        { name: 'MediaOne TV', lang: 'Malayalam', url: 'https://www.youtube.com/@MediaoneTVLive' },
        { name: 'Reporter TV', lang: 'Malayalam', url: 'https://www.youtube.com/@ReporterTV' },
      ],
      'Karnataka': [
        { name: 'TV9 Kannada', lang: 'Kannada', url: 'https://www.youtube.com/@TV9Kannada' },
        { name: 'Public TV', lang: 'Kannada', url: 'https://www.youtube.com/@PublicTVKannada' },
        { name: 'Suvarna News', lang: 'Kannada', url: 'https://www.youtube.com/@SuvarnaNewslive' },
      ],
      'Maharashtra': [
        { name: 'ABP Majha', lang: 'Marathi', url: 'https://www.youtube.com/@ABPMajha' },
        { name: 'TV9 Marathi', lang: 'Marathi', url: 'https://www.youtube.com/@TV9Marathi' },
        { name: 'Zee 24 Taas', lang: 'Marathi', url: 'https://www.youtube.com/@Zee24Taas' },
      ],
      'Gujarat': [
        { name: 'TV9 Gujarati', lang: 'Gujarati', url: 'https://www.youtube.com/@TV9Gujarati' },
        { name: 'ABP Asmita', lang: 'Gujarati', url: 'https://www.youtube.com/@ABPAsmita' },
      ],
      'West Bengal': [
        { name: 'ABP Ananda', lang: 'Bengali', url: 'https://www.youtube.com/@ABPAnanda' },
        { name: 'TV9 Bangla', lang: 'Bengali', url: 'https://www.youtube.com/@TV9Bangla' },
        { name: 'Zee 24 Ghanta', lang: 'Bengali', url: 'https://www.youtube.com/@Zee24Ghanta' },
      ],
      'Rajasthan': [
        { name: 'Zee Rajasthan', lang: 'Hindi', url: 'https://www.youtube.com/@ZeeRajasthan' },
        { name: 'First India News', lang: 'Hindi', url: 'https://www.youtube.com/@FirstIndiaNews' },
      ],
      'Uttar Pradesh': [
        { name: 'News18 UP Uttarakhand', lang: 'Hindi', url: 'https://www.youtube.com/@News18UPUttarakhand' },
      ],
      'Madhya Pradesh': [
        { name: 'News18 MP Chhattisgarh', lang: 'Hindi', url: 'https://www.youtube.com/@News18MPCG' },
      ],
      'Bihar': [
        { name: 'News18 Bihar Jharkhand', lang: 'Hindi', url: 'https://www.youtube.com/@News18BiharJharkhand' },
        { name: 'Zee Bihar Jharkhand', lang: 'Hindi', url: 'https://www.youtube.com/@ZeeBiharJharkhand' },
      ],
      'Odisha': [
        { name: 'OTV (Odisha TV)', lang: 'Odia', url: 'https://www.youtube.com/@OTVKhabar' },
        { name: 'Kanak News', lang: 'Odia', url: 'https://www.youtube.com/@KanakNewsOfficial' },
        { name: 'Argus News', lang: 'Odia', url: 'https://www.youtube.com/@ArgusNewsOdisha' },
      ],
      'Assam': [
        { name: 'News Live', lang: 'Assamese', url: 'https://www.youtube.com/@NewsLive' },
        { name: 'Pratidin Time', lang: 'Assamese', url: 'https://www.youtube.com/@PratidinTime' },
      ],
      'Punjab': [
        { name: 'PTC News', lang: 'Punjabi', url: 'https://www.youtube.com/@PTCNews' },
        { name: 'ABP Sanjha', lang: 'Punjabi', url: 'https://www.youtube.com/@ABPSanjha' },
      ],
      'Haryana': [
        { name: 'India News Haryana', lang: 'Hindi', url: 'https://www.youtube.com/@IndiaNewsHaryana' },
      ],
      'Goa': [
        { name: 'Prudent Media Goa', lang: 'Konkani/English', url: 'https://www.youtube.com/@PrudentMedia' },
      ],
      'Manipur': [
        { name: 'ISTV Live', lang: 'Manipuri', url: 'https://www.youtube.com/@ISTVNetwork' },
      ],
      'Jammu & Kashmir': [
        { name: 'Greater Kashmir TV', lang: 'Urdu/Hindi', url: 'https://www.youtube.com/@GreaterKashmirTV' },
      ],
      'Delhi': [
        { name: 'NDTV India (Delhi HQ)', lang: 'Hindi/English', url: 'https://www.youtube.com/@NDTVIndia' },
      ],
    },
  },
  China: { continent: 'Asia', channels: [{ name: 'CGTN', lang: 'English/Chinese', url: 'https://www.youtube.com/@CGTNOfficial', type: 'State' }] },
  Japan: { continent: 'Asia', channels: [{ name: 'NHK World-Japan', lang: 'English/Japanese', url: 'https://www.youtube.com/@NHKWORLDJAPAN', type: 'Public' }] },
  'S. Korea': { continent: 'Asia', channels: [{ name: 'KBS World', lang: 'Korean/English', url: 'https://www.youtube.com/@KBSWorldTV', type: 'Public' }] },
  Pakistan: { continent: 'Asia', channels: [{ name: 'ARY News', lang: 'Urdu', url: 'https://www.youtube.com/@ARYNEWSASIA', type: 'Private' }] },
  Bangladesh: { continent: 'Asia', channels: [{ name: 'Jamuna TV', lang: 'Bengali', url: 'https://www.youtube.com/@JamunaTelevision', type: 'Private' }] },
  'Sri Lanka': { continent: 'Asia', channels: [{ name: 'Hiru News', lang: 'Sinhala', url: 'https://www.youtube.com/@HiruNews', type: 'Private' }] },
  Nepal: { continent: 'Asia', channels: [{ name: 'Kantipur TV', lang: 'Nepali', url: 'https://www.youtube.com/@KantipurTV', type: 'Private' }] },
  Myanmar: { continent: 'Asia', channels: [{ name: 'DVB News', lang: 'Burmese', url: 'https://www.youtube.com/@DVBTVNews', type: 'Independent' }] },
  Thailand: { continent: 'Asia', channels: [{ name: 'Thai PBS', lang: 'Thai', url: 'https://www.youtube.com/@ThaiPBS', type: 'Public' }] },
  Vietnam: { continent: 'Asia', channels: [{ name: 'VTV News', lang: 'Vietnamese', url: 'https://www.youtube.com/@VTV24', type: 'State' }] },
  Indonesia: { continent: 'Asia', channels: [{ name: 'Kompas TV', lang: 'Indonesian', url: 'https://www.youtube.com/@KompasTV', type: 'Private' }] },
  Malaysia: { continent: 'Asia', channels: [{ name: 'Astro AWANI', lang: 'Malay/English', url: 'https://www.youtube.com/@astroawani', type: 'Private' }] },
  Philippines: { continent: 'Asia', channels: [{ name: 'ABS-CBN News', lang: 'Filipino/English', url: 'https://www.youtube.com/@ABSCBNNews', type: 'Private' }] },
  Singapore: { continent: 'Asia', channels: [{ name: 'CNA', lang: 'English', url: 'https://www.youtube.com/@channelnewsasia', type: 'State-linked' }] },
  Taiwan: { continent: 'Asia', channels: [{ name: 'TVBS News', lang: 'Mandarin', url: 'https://www.youtube.com/@TVBSNEWS01', type: 'Private' }] },
  Afghanistan: { continent: 'Asia', channels: [{ name: 'TOLOnews', lang: 'Dari/Pashto', url: 'https://www.youtube.com/@TOLOnews', type: 'Private' }] },
  Cambodia: { continent: 'Asia', channels: [{ name: 'Fresh News', lang: 'Khmer', url: 'https://www.youtube.com/@FreshNewsAsia', type: 'Private' }] },
  Mongolia: { continent: 'Asia', channels: [{ name: 'MNB World', lang: 'Mongolian', url: 'https://www.youtube.com/@MNBworld', type: 'Public' }] },

  // ========== MIDDLE EAST ==========
  Qatar: { continent: 'Middle East', channels: [{ name: 'Al Jazeera English', lang: 'English/Arabic', url: 'https://www.youtube.com/@AlJazeeraEnglish', type: 'State-funded' }] },
  'United Arab Emirates': { continent: 'Middle East', channels: [{ name: 'Al Arabiya', lang: 'Arabic', url: 'https://www.youtube.com/@AlArabiya', type: 'Private' }] },
  'Saudi Arabia': { continent: 'Middle East', channels: [{ name: 'Al Ekhbariya', lang: 'Arabic', url: 'https://www.youtube.com/@alekhbariya', type: 'State' }] },
  Turkey: { continent: 'Middle East', channels: [{ name: 'TRT World', lang: 'English/Turkish', url: 'https://www.youtube.com/@trtworld', type: 'Public' }] },
  Iran: { continent: 'Middle East', channels: [{ name: 'Press TV', lang: 'English/Persian', url: 'https://www.youtube.com/@PressTVEN', type: 'State' }] },
  Israel: { continent: 'Middle East', channels: [{ name: 'i24NEWS', lang: 'English/Hebrew', url: 'https://www.youtube.com/@i24NEWSen', type: 'Private' }] },
  Iraq: { continent: 'Middle East', channels: [{ name: 'Rudaw Media', lang: 'Kurdish/Arabic', url: 'https://www.youtube.com/@RudawMedia', type: 'Private' }] },
  Lebanon: { continent: 'Middle East', channels: [{ name: 'Al Mayadeen', lang: 'Arabic', url: 'https://www.youtube.com/@AlMayadeen', type: 'Private' }] },
  Jordan: { continent: 'Middle East', channels: [{ name: 'Roya News', lang: 'Arabic', url: 'https://www.youtube.com/@RoyaNews', type: 'Private' }] },

  // ========== EUROPE ==========
  'United Kingdom': { continent: 'Europe', channels: [{ name: 'BBC News', lang: 'English', url: 'https://www.youtube.com/@BBCNews', type: 'Public' }] },
  Germany: { continent: 'Europe', channels: [{ name: 'DW News', lang: 'English/German', url: 'https://www.youtube.com/@dwnews', type: 'Public' }] },
  France: { continent: 'Europe', channels: [{ name: 'France 24', lang: 'French/English', url: 'https://www.youtube.com/@FRANCE24English', type: 'Public' }] },
  Italy: { continent: 'Europe', channels: [{ name: 'Rai News 24', lang: 'Italian', url: 'https://www.youtube.com/@rainews', type: 'Public' }] },
  Spain: { continent: 'Europe', channels: [{ name: 'RTVE Noticias', lang: 'Spanish', url: 'https://www.youtube.com/@rtve', type: 'Public' }] },
  Netherlands: { continent: 'Europe', channels: [{ name: 'NOS', lang: 'Dutch', url: 'https://www.youtube.com/@NOS', type: 'Public' }] },
  Poland: { continent: 'Europe', channels: [{ name: 'TVN24', lang: 'Polish', url: 'https://www.youtube.com/@tvn24', type: 'Private' }] },
  Ukraine: { continent: 'Europe', channels: [{ name: 'NEXTA Live', lang: 'Ukrainian', url: 'https://www.youtube.com/@nextalive', type: 'Independent' }] },
  Russia: { continent: 'Europe', channels: [{ name: 'RT', lang: 'English/Russian', url: 'https://www.youtube.com/@RT', type: 'State' }] },
  Sweden: { continent: 'Europe', channels: [{ name: 'SVT Nyheter', lang: 'Swedish', url: 'https://www.youtube.com/@svt', type: 'Public' }] },
  Norway: { continent: 'Europe', channels: [{ name: 'NRK', lang: 'Norwegian', url: 'https://www.youtube.com/@nrk', type: 'Public' }] },
  Switzerland: { continent: 'Europe', channels: [{ name: 'SRF News', lang: 'German/French', url: 'https://www.youtube.com/@SRF', type: 'Public' }] },
  Ireland: { continent: 'Europe', channels: [{ name: 'RTE News', lang: 'English/Irish', url: 'https://www.youtube.com/@rtenews', type: 'Public' }] },
  Romania: { continent: 'Europe', channels: [{ name: 'Digi24', lang: 'Romanian', url: 'https://www.youtube.com/@Digi24HD', type: 'Private' }] },
  Serbia: { continent: 'Europe', channels: [{ name: 'N1 Info', lang: 'Serbian', url: 'https://www.youtube.com/@N1info', type: 'Private' }] },

  // ========== NORTH AMERICA ==========
  'United States of America': { continent: 'N. America', channels: [{ name: 'Associated Press', lang: 'English', url: 'https://www.youtube.com/@AssociatedPress', type: 'Wire Service' }] },
  Canada: { continent: 'N. America', channels: [{ name: 'CBC News', lang: 'English/French', url: 'https://www.youtube.com/@cbcnews', type: 'Public' }] },
  Mexico: { continent: 'N. America', channels: [{ name: 'Televisa Noticias', lang: 'Spanish', url: 'https://www.youtube.com/@televisanoticias', type: 'Private' }] },
  Cuba: { continent: 'N. America', channels: [{ name: 'CubaTV', lang: 'Spanish', url: 'https://www.youtube.com/@CanalCaribeTV', type: 'State' }] },
  Jamaica: { continent: 'N. America', channels: [{ name: 'TVJ News', lang: 'English', url: 'https://www.youtube.com/@televisionjamaica', type: 'Private' }] },
  Guatemala: { continent: 'N. America', channels: [{ name: 'Prensa Libre', lang: 'Spanish', url: 'https://www.youtube.com/@prensalibregt', type: 'Private' }] },
  Honduras: { continent: 'N. America', channels: [{ name: 'HCH Television', lang: 'Spanish', url: 'https://www.youtube.com/@HCHTelevisionDigital', type: 'Private' }] },
  'Costa Rica': { continent: 'N. America', channels: [{ name: 'Teletica', lang: 'Spanish', url: 'https://www.youtube.com/@Teletica', type: 'Private' }] },
  Panama: { continent: 'N. America', channels: [{ name: 'TVN Panama', lang: 'Spanish', url: 'https://www.youtube.com/@tvnpanama', type: 'Private' }] },
  'Dominican Rep.': { continent: 'N. America', channels: [{ name: 'Noticias SIN', lang: 'Spanish', url: 'https://www.youtube.com/@NoticiasSIN', type: 'Private' }] },
  Haiti: { continent: 'N. America', channels: [{ name: 'Radio Tele Metropole', lang: 'French/Creole', url: 'https://www.youtube.com/@metropolehaiti', type: 'Private' }] },
  'El Salvador': { continent: 'N. America', channels: [{ name: 'TCS Noticias', lang: 'Spanish', url: 'https://www.youtube.com/@TCSNoticias', type: 'Private' }] },

  // ========== SOUTH AMERICA ==========
  Brazil: { continent: 'S. America', channels: [{ name: 'Globo News', lang: 'Portuguese', url: 'https://www.youtube.com/@globonews', type: 'Private' }] },
  Argentina: { continent: 'S. America', channels: [{ name: 'TN (Todo Noticias)', lang: 'Spanish', url: 'https://www.youtube.com/@todonoticias', type: 'Private' }] },
  Colombia: { continent: 'S. America', channels: [{ name: 'Caracol Noticias', lang: 'Spanish', url: 'https://www.youtube.com/@NoticiasCaracol', type: 'Private' }] },
  Chile: { continent: 'S. America', channels: [{ name: 'CNN Chile', lang: 'Spanish', url: 'https://www.youtube.com/@CNNChile', type: 'Private' }] },
  Peru: { continent: 'S. America', channels: [{ name: 'RPP Noticias', lang: 'Spanish', url: 'https://www.youtube.com/@RPPNoticias', type: 'Private' }] },
  Venezuela: { continent: 'S. America', channels: [{ name: 'Globovision', lang: 'Spanish', url: 'https://www.youtube.com/@Globovision', type: 'Private' }] },
  Ecuador: { continent: 'S. America', channels: [{ name: 'Ecuavisa', lang: 'Spanish', url: 'https://www.youtube.com/@ecuavisa', type: 'Private' }] },
  Uruguay: { continent: 'S. America', channels: [{ name: 'Telenoche', lang: 'Spanish', url: 'https://www.youtube.com/@Canal4Uruguay', type: 'Private' }] },
  Paraguay: { continent: 'S. America', channels: [{ name: 'ABC TV', lang: 'Spanish', url: 'https://www.youtube.com/@ABCTVParaguay', type: 'Private' }] },
  Bolivia: { continent: 'S. America', channels: [{ name: 'Red UNO', lang: 'Spanish', url: 'https://www.youtube.com/@redunobolivia', type: 'Private' }] },

  // ========== AFRICA ==========
  Nigeria: { continent: 'Africa', channels: [{ name: 'Channels Television', lang: 'English', url: 'https://www.youtube.com/@channelstelevision', type: 'Private' }] },
  'South Africa': { continent: 'Africa', channels: [{ name: 'eNCA', lang: 'English', url: 'https://www.youtube.com/@eNCA', type: 'Private' }] },
  Kenya: { continent: 'Africa', channels: [{ name: 'Citizen TV Kenya', lang: 'English/Swahili', url: 'https://www.youtube.com/@citizentvkenya', type: 'Private' }] },
  Egypt: { continent: 'Africa', channels: [{ name: 'CBC Egypt', lang: 'Arabic', url: 'https://www.youtube.com/@CBCeGYPT', type: 'Private' }] },
  Morocco: { continent: 'Africa', channels: [{ name: '2M TV', lang: 'Arabic/French', url: 'https://www.youtube.com/@2MMaroc', type: 'Public' }] },
  Algeria: { continent: 'Africa', channels: [{ name: 'Echorouk News', lang: 'Arabic', url: 'https://www.youtube.com/@EchoroukNews', type: 'Private' }] },
  Ghana: { continent: 'Africa', channels: [{ name: 'Joy News', lang: 'English', url: 'https://www.youtube.com/@JoyNewsOnTV', type: 'Private' }] },
  Ethiopia: { continent: 'Africa', channels: [{ name: 'Fana TV', lang: 'Amharic', url: 'https://www.youtube.com/@FanaBroadcasting', type: 'State' }] },
  Tanzania: { continent: 'Africa', channels: [{ name: 'ITV Tanzania', lang: 'Swahili', url: 'https://www.youtube.com/@ITVTanzania', type: 'Private' }] },
  Uganda: { continent: 'Africa', channels: [{ name: 'NTV Uganda', lang: 'English', url: 'https://www.youtube.com/@NTVUganda', type: 'Private' }] },

  // ========== OCEANIA ==========
  Australia: { continent: 'Oceania', channels: [{ name: 'ABC News Australia', lang: 'English', url: 'https://www.youtube.com/@ABCNewsAustralia', type: 'Public' }] },
  'New Zealand': { continent: 'Oceania', channels: [{ name: 'TVNZ', lang: 'English', url: 'https://www.youtube.com/@1NEWS', type: 'Public' }] },
};

// Helper to count total channels
export function getTotalChannelCount(): number {
  let count = 0;
  for (const data of Object.values(NEWS_CHANNELS)) {
    count += data.channels?.length || 0;
    if (data.states) {
      for (const channels of Object.values(data.states)) {
        count += channels.length;
      }
    }
  }
  return count;
}

// Helper to get country name from topojson feature
export function getCountryName(feature: { properties?: { name?: string }; id?: string | number }): string {
  return (
    feature.properties?.name ||
    COUNTRY_ID_MAP[parseInt(String(feature.id))] ||
    `ID:${feature.id}`
  );
}
