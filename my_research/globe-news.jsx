import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";

// ============================================================
// NEWS CHANNELS DATA (embedded for the globe)
// ============================================================
const NEWS_DATA = {
  // ASIA
  India: {
    continent: "Asia",
    channels: [
      { name: "NDTV 24x7", lang: "English", url: "https://www.youtube.com/@NDTV", type: "Private", scope: "national" },
      { name: "Aaj Tak", lang: "Hindi", url: "https://www.youtube.com/@aajtak", type: "Private", scope: "national" },
      { name: "DD News", lang: "Hindi", url: "https://www.youtube.com/@DDNewslive", type: "Public", scope: "national" },
      { name: "WION", lang: "English", url: "https://www.youtube.com/@WIONews", type: "Private", scope: "national" },
      { name: "Zee News", lang: "Hindi", url: "https://www.youtube.com/@zeenews", type: "Private", scope: "national" },
    ],
    states: {
      "Andhra Pradesh": [
        { name: "TV9 Telugu", lang: "Telugu", url: "https://www.youtube.com/@TV9Telugu" },
        { name: "ABN Andhra Jyothi", lang: "Telugu", url: "https://www.youtube.com/@ABNTelugu" },
        { name: "Sakshi TV", lang: "Telugu", url: "https://www.youtube.com/@SakshiTV" },
      ],
      Telangana: [
        { name: "V6 News Telugu", lang: "Telugu", url: "https://www.youtube.com/@V6NewsTelugu" },
        { name: "T News", lang: "Telugu", url: "https://www.youtube.com/@TNewsLive" },
        { name: "HMTV", lang: "Telugu", url: "https://www.youtube.com/@hmtvnewslive" },
      ],
      "Tamil Nadu": [
        { name: "Thanthi TV", lang: "Tamil", url: "https://www.youtube.com/@ThanthiTV" },
        { name: "Puthiya Thalaimurai", lang: "Tamil", url: "https://www.youtube.com/@PuthiyaThalaimurai" },
        { name: "Polimer News", lang: "Tamil", url: "https://www.youtube.com/@PolimerNews" },
      ],
      Kerala: [
        { name: "Manorama News", lang: "Malayalam", url: "https://www.youtube.com/@manoramanews" },
        { name: "Mathrubhumi News", lang: "Malayalam", url: "https://www.youtube.com/@MathrubhumiNews" },
        { name: "Asianet News", lang: "Malayalam", url: "https://www.youtube.com/@AsianetNews" },
      ],
      Karnataka: [
        { name: "TV9 Kannada", lang: "Kannada", url: "https://www.youtube.com/@TV9Kannada" },
        { name: "Public TV", lang: "Kannada", url: "https://www.youtube.com/@PublicTVKannada" },
      ],
      Maharashtra: [
        { name: "ABP Majha", lang: "Marathi", url: "https://www.youtube.com/@ABPMajha" },
        { name: "TV9 Marathi", lang: "Marathi", url: "https://www.youtube.com/@TV9Marathi" },
      ],
      Gujarat: [
        { name: "TV9 Gujarati", lang: "Gujarati", url: "https://www.youtube.com/@TV9Gujarati" },
      ],
      "West Bengal": [
        { name: "ABP Ananda", lang: "Bengali", url: "https://www.youtube.com/@ABPAnanda" },
        { name: "Zee 24 Ghanta", lang: "Bengali", url: "https://www.youtube.com/@Zee24Ghanta" },
      ],
      Punjab: [
        { name: "PTC News", lang: "Punjabi", url: "https://www.youtube.com/@PTCNews" },
      ],
      Rajasthan: [
        { name: "First India News", lang: "Hindi", url: "https://www.youtube.com/@FirstIndiaNews" },
      ],
      "Uttar Pradesh": [
        { name: "News18 UP Uttarakhand", lang: "Hindi", url: "https://www.youtube.com/@News18UPUttarakhand" },
      ],
      Bihar: [
        { name: "News18 Bihar Jharkhand", lang: "Hindi", url: "https://www.youtube.com/@News18BiharJharkhand" },
      ],
      Odisha: [
        { name: "OTV", lang: "Odia", url: "https://www.youtube.com/@OTVKhabar" },
        { name: "Kanak News", lang: "Odia", url: "https://www.youtube.com/@KanakNewsOfficial" },
      ],
      Assam: [
        { name: "News Live", lang: "Assamese", url: "https://www.youtube.com/@NewsLive" },
      ],
      "Madhya Pradesh": [
        { name: "News18 MP CG", lang: "Hindi", url: "https://www.youtube.com/@News18MPCG" },
      ],
      Goa: [
        { name: "Prudent Media", lang: "Konkani", url: "https://www.youtube.com/@PrudentMedia" },
      ],
    },
  },
  China: { continent: "Asia", channels: [{ name: "CGTN", lang: "English/Chinese", url: "https://www.youtube.com/@CGTNOfficial", type: "State" }] },
  Japan: { continent: "Asia", channels: [{ name: "NHK World-Japan", lang: "English/Japanese", url: "https://www.youtube.com/@NHKWORLDJAPAN", type: "Public" }] },
  "S. Korea": { continent: "Asia", channels: [{ name: "KBS World", lang: "Korean", url: "https://www.youtube.com/@KBSWorldTV", type: "Public" }] },
  Pakistan: { continent: "Asia", channels: [{ name: "ARY News", lang: "Urdu", url: "https://www.youtube.com/@ARYNEWSASIA", type: "Private" }] },
  Bangladesh: { continent: "Asia", channels: [{ name: "Jamuna TV", lang: "Bengali", url: "https://www.youtube.com/@JamunaTelevision", type: "Private" }] },
  "Sri Lanka": { continent: "Asia", channels: [{ name: "Hiru News", lang: "Sinhala", url: "https://www.youtube.com/@HiruNews", type: "Private" }] },
  Nepal: { continent: "Asia", channels: [{ name: "Kantipur TV", lang: "Nepali", url: "https://www.youtube.com/@KantipurTV", type: "Private" }] },
  Myanmar: { continent: "Asia", channels: [{ name: "DVB News", lang: "Burmese", url: "https://www.youtube.com/@DVBTVNews", type: "Independent" }] },
  Thailand: { continent: "Asia", channels: [{ name: "Thai PBS", lang: "Thai", url: "https://www.youtube.com/@ThaiPBS", type: "Public" }] },
  Vietnam: { continent: "Asia", channels: [{ name: "VTV News", lang: "Vietnamese", url: "https://www.youtube.com/@VTV24", type: "State" }] },
  Indonesia: { continent: "Asia", channels: [{ name: "Kompas TV", lang: "Indonesian", url: "https://www.youtube.com/@KompasTV", type: "Private" }] },
  Malaysia: { continent: "Asia", channels: [{ name: "Astro AWANI", lang: "Malay", url: "https://www.youtube.com/@astroawani", type: "Private" }] },
  Philippines: { continent: "Asia", channels: [{ name: "ABS-CBN News", lang: "Filipino", url: "https://www.youtube.com/@ABSCBNNews", type: "Private" }] },
  Singapore: { continent: "Asia", channels: [{ name: "CNA", lang: "English", url: "https://www.youtube.com/@channelnewsasia", type: "State-linked" }] },
  Taiwan: { continent: "Asia", channels: [{ name: "TVBS News", lang: "Mandarin", url: "https://www.youtube.com/@TVBSNEWS01", type: "Private" }] },
  Afghanistan: { continent: "Asia", channels: [{ name: "TOLOnews", lang: "Dari/Pashto", url: "https://www.youtube.com/@TOLOnews", type: "Private" }] },
  Cambodia: { continent: "Asia", channels: [{ name: "Fresh News", lang: "Khmer", url: "https://www.youtube.com/@FreshNewsAsia", type: "Private" }] },
  Mongolia: { continent: "Asia", channels: [{ name: "MNB World", lang: "Mongolian", url: "https://www.youtube.com/@MNBworld", type: "Public" }] },
  // MIDDLE EAST
  Qatar: { continent: "Middle East", channels: [{ name: "Al Jazeera English", lang: "English/Arabic", url: "https://www.youtube.com/@AlJazeeraEnglish", type: "State-funded" }] },
  "United Arab Emirates": { continent: "Middle East", channels: [{ name: "Al Arabiya", lang: "Arabic", url: "https://www.youtube.com/@AlArabiya", type: "Private" }] },
  "Saudi Arabia": { continent: "Middle East", channels: [{ name: "Al Ekhbariya", lang: "Arabic", url: "https://www.youtube.com/@alekhbariya", type: "State" }] },
  Turkey: { continent: "Middle East", channels: [{ name: "TRT World", lang: "English/Turkish", url: "https://www.youtube.com/@trtworld", type: "Public" }] },
  Iran: { continent: "Middle East", channels: [{ name: "Press TV", lang: "English/Persian", url: "https://www.youtube.com/@PressTVEN", type: "State" }] },
  Israel: { continent: "Middle East", channels: [{ name: "i24NEWS", lang: "English/Hebrew", url: "https://www.youtube.com/@i24NEWSen", type: "Private" }] },
  Iraq: { continent: "Middle East", channels: [{ name: "Rudaw Media", lang: "Kurdish/Arabic", url: "https://www.youtube.com/@RudawMedia", type: "Private" }] },
  Lebanon: { continent: "Middle East", channels: [{ name: "Al Mayadeen", lang: "Arabic", url: "https://www.youtube.com/@AlMayadeen", type: "Private" }] },
  Jordan: { continent: "Middle East", channels: [{ name: "Roya News", lang: "Arabic", url: "https://www.youtube.com/@RoyaNews", type: "Private" }] },
  // EUROPE
  "United Kingdom": { continent: "Europe", channels: [{ name: "BBC News", lang: "English", url: "https://www.youtube.com/@BBCNews", type: "Public" }] },
  Germany: { continent: "Europe", channels: [{ name: "DW News", lang: "English/German", url: "https://www.youtube.com/@dwnews", type: "Public" }] },
  France: { continent: "Europe", channels: [{ name: "France 24", lang: "French/English", url: "https://www.youtube.com/@FRANCE24English", type: "Public" }] },
  Italy: { continent: "Europe", channels: [{ name: "Rai News 24", lang: "Italian", url: "https://www.youtube.com/@rainews", type: "Public" }] },
  Spain: { continent: "Europe", channels: [{ name: "RTVE Noticias", lang: "Spanish", url: "https://www.youtube.com/@rtve", type: "Public" }] },
  Netherlands: { continent: "Europe", channels: [{ name: "NOS", lang: "Dutch", url: "https://www.youtube.com/@NOS", type: "Public" }] },
  Poland: { continent: "Europe", channels: [{ name: "TVN24", lang: "Polish", url: "https://www.youtube.com/@tvn24", type: "Private" }] },
  Ukraine: { continent: "Europe", channels: [{ name: "NEXTA Live", lang: "Ukrainian", url: "https://www.youtube.com/@nextalive", type: "Independent" }] },
  Russia: { continent: "Europe", channels: [{ name: "RT", lang: "English/Russian", url: "https://www.youtube.com/@RT", type: "State" }] },
  Sweden: { continent: "Europe", channels: [{ name: "SVT Nyheter", lang: "Swedish", url: "https://www.youtube.com/@svt", type: "Public" }] },
  Norway: { continent: "Europe", channels: [{ name: "NRK", lang: "Norwegian", url: "https://www.youtube.com/@nrk", type: "Public" }] },
  Switzerland: { continent: "Europe", channels: [{ name: "SRF News", lang: "German/French", url: "https://www.youtube.com/@SRF", type: "Public" }] },
  Ireland: { continent: "Europe", channels: [{ name: "RTÉ News", lang: "English", url: "https://www.youtube.com/@rtenews", type: "Public" }] },
  Romania: { continent: "Europe", channels: [{ name: "Digi24", lang: "Romanian", url: "https://www.youtube.com/@Digi24HD", type: "Private" }] },
  Serbia: { continent: "Europe", channels: [{ name: "N1 Info", lang: "Serbian", url: "https://www.youtube.com/@N1info", type: "Private" }] },
  // NORTH AMERICA
  "United States of America": { continent: "N. America", channels: [{ name: "Associated Press", lang: "English", url: "https://www.youtube.com/@AssociatedPress", type: "Wire Service" }] },
  Canada: { continent: "N. America", channels: [{ name: "CBC News", lang: "English/French", url: "https://www.youtube.com/@cbcnews", type: "Public" }] },
  Mexico: { continent: "N. America", channels: [{ name: "Televisa Noticias", lang: "Spanish", url: "https://www.youtube.com/@televisanoticias", type: "Private" }] },
  Cuba: { continent: "N. America", channels: [{ name: "CubaTV", lang: "Spanish", url: "https://www.youtube.com/@CanalCaribeTV", type: "State" }] },
  Jamaica: { continent: "N. America", channels: [{ name: "TVJ News", lang: "English", url: "https://www.youtube.com/@televisionjamaica", type: "Private" }] },
  Guatemala: { continent: "N. America", channels: [{ name: "Prensa Libre", lang: "Spanish", url: "https://www.youtube.com/@prensalibregt", type: "Private" }] },
  Honduras: { continent: "N. America", channels: [{ name: "HCH Televisión", lang: "Spanish", url: "https://www.youtube.com/@HCHTelevisionDigital", type: "Private" }] },
  "Costa Rica": { continent: "N. America", channels: [{ name: "Teletica", lang: "Spanish", url: "https://www.youtube.com/@Teletica", type: "Private" }] },
  Panama: { continent: "N. America", channels: [{ name: "TVN Panama", lang: "Spanish", url: "https://www.youtube.com/@tvnpanama", type: "Private" }] },
  "Dominican Rep.": { continent: "N. America", channels: [{ name: "Noticias SIN", lang: "Spanish", url: "https://www.youtube.com/@NoticiasSIN", type: "Private" }] },
  Haiti: { continent: "N. America", channels: [{ name: "Radio Télé Métropole", lang: "French/Creole", url: "https://www.youtube.com/@metropolehaiti", type: "Private" }] },
  "El Salvador": { continent: "N. America", channels: [{ name: "TCS Noticias", lang: "Spanish", url: "https://www.youtube.com/@TCSNoticias", type: "Private" }] },
  // SOUTH AMERICA
  Brazil: { continent: "S. America", channels: [{ name: "Globo News", lang: "Portuguese", url: "https://www.youtube.com/@globonews", type: "Private" }] },
  Argentina: { continent: "S. America", channels: [{ name: "TN (Todo Noticias)", lang: "Spanish", url: "https://www.youtube.com/@todonoticias", type: "Private" }] },
  Colombia: { continent: "S. America", channels: [{ name: "Caracol Noticias", lang: "Spanish", url: "https://www.youtube.com/@NoticiasCaracol", type: "Private" }] },
  Chile: { continent: "S. America", channels: [{ name: "CNN Chile", lang: "Spanish", url: "https://www.youtube.com/@CNNChile", type: "Private" }] },
  Peru: { continent: "S. America", channels: [{ name: "RPP Noticias", lang: "Spanish", url: "https://www.youtube.com/@RPPNoticias", type: "Private" }] },
  Venezuela: { continent: "S. America", channels: [{ name: "Globovisión", lang: "Spanish", url: "https://www.youtube.com/@Globovision", type: "Private" }] },
  Ecuador: { continent: "S. America", channels: [{ name: "Ecuavisa", lang: "Spanish", url: "https://www.youtube.com/@ecuavisa", type: "Private" }] },
  Uruguay: { continent: "S. America", channels: [{ name: "Telenoche", lang: "Spanish", url: "https://www.youtube.com/@Canal4Uruguay", type: "Private" }] },
  Paraguay: { continent: "S. America", channels: [{ name: "ABC TV", lang: "Spanish", url: "https://www.youtube.com/@ABCTVParaguay", type: "Private" }] },
  Bolivia: { continent: "S. America", channels: [{ name: "Red UNO", lang: "Spanish", url: "https://www.youtube.com/@redunobolivia", type: "Private" }] },
  // AFRICA
  Nigeria: { continent: "Africa", channels: [{ name: "Channels Television", lang: "English", url: "https://www.youtube.com/@channelstelevision", type: "Private" }] },
  "South Africa": { continent: "Africa", channels: [{ name: "eNCA", lang: "English", url: "https://www.youtube.com/@eNCA", type: "Private" }] },
  Kenya: { continent: "Africa", channels: [{ name: "Citizen TV", lang: "English/Swahili", url: "https://www.youtube.com/@citizentvkenya", type: "Private" }] },
  Egypt: { continent: "Africa", channels: [{ name: "CBC Egypt", lang: "Arabic", url: "https://www.youtube.com/@CBCeGYPT", type: "Private" }] },
  Morocco: { continent: "Africa", channels: [{ name: "2M TV", lang: "Arabic/French", url: "https://www.youtube.com/@2MMaroc", type: "Public" }] },
  Algeria: { continent: "Africa", channels: [{ name: "Echorouk News", lang: "Arabic", url: "https://www.youtube.com/@EchoroukNews", type: "Private" }] },
  Ghana: { continent: "Africa", channels: [{ name: "Joy News", lang: "English", url: "https://www.youtube.com/@JoyNewsOnTV", type: "Private" }] },
  Ethiopia: { continent: "Africa", channels: [{ name: "Fana TV", lang: "Amharic", url: "https://www.youtube.com/@FanaBroadcasting", type: "State" }] },
  Tanzania: { continent: "Africa", channels: [{ name: "ITV Tanzania", lang: "Swahili", url: "https://www.youtube.com/@ITVTanzania", type: "Private" }] },
  Uganda: { continent: "Africa", channels: [{ name: "NTV Uganda", lang: "English", url: "https://www.youtube.com/@NTVUganda", type: "Private" }] },
  // OCEANIA
  Australia: { continent: "Oceania", channels: [{ name: "ABC News Australia", lang: "English", url: "https://www.youtube.com/@ABCNewsAustralia", type: "Public" }] },
  "New Zealand": { continent: "Oceania", channels: [{ name: "TVNZ", lang: "English", url: "https://www.youtube.com/@1NEWS", type: "Public" }] },
};

const CONTINENT_COLORS = {
  Asia: "#FF6B35",
  "Middle East": "#E8AA14",
  Europe: "#4ECDC4",
  "N. America": "#7B68EE",
  "S. America": "#FF69B4",
  Africa: "#45B7D1",
  Oceania: "#98D8C8",
};

const GEOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function GlobeNewsExplorer() {
  const svgRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [rotation, setRotation] = useState([0, -20, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showIndia, setShowIndia] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const animRef = useRef(null);
  const dragRef = useRef({ start: null, startRotation: null });
  const size = 520;

  // Load GeoJSON
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((topology) => {
        // topojson to geojson
        const countries = topojsonFeature(topology, topology.objects.countries);
        setGeoData(countries);
      })
      .catch(() => {});
  }, []);

  // Simple topojson feature extraction
  function topojsonFeature(topology, object) {
    const arcs = topology.arcs;
    function arcToCoords(arcIndex) {
      const reverse = arcIndex < 0;
      const arc = arcs[reverse ? ~arcIndex : arcIndex];
      let coords = [],
        x = 0,
        y = 0;
      for (const [dx, dy] of arc) {
        x += dx;
        y += dy;
        coords.push([
          x * topology.transform.scale[0] + topology.transform.translate[0],
          y * topology.transform.scale[1] + topology.transform.translate[1],
        ]);
      }
      if (reverse) coords.reverse();
      return coords;
    }
    function resolveRing(ring) {
      let coords = [];
      for (const arcIdx of ring) {
        const c = arcToCoords(arcIdx);
        coords = coords.concat(coords.length ? c.slice(1) : c);
      }
      return coords;
    }
    function resolveGeometry(geom) {
      if (geom.type === "Polygon") {
        return { type: "Polygon", coordinates: geom.arcs.map(resolveRing) };
      } else if (geom.type === "MultiPolygon") {
        return {
          type: "MultiPolygon",
          coordinates: geom.arcs.map((poly) => poly.map(resolveRing)),
        };
      }
      return geom;
    }
    return {
      type: "FeatureCollection",
      features: object.geometries.map((g) => ({
        type: "Feature",
        properties: g.properties || {},
        id: g.id,
        geometry: resolveGeometry(g),
      })),
    };
  }

  // Country name mapping from ID
  const COUNTRY_NAMES = useMemo(
    () => ({
      4: "Afghanistan", 8: "Albania", 12: "Algeria", 24: "Angola",
      32: "Argentina", 36: "Australia", 40: "Austria", 50: "Bangladesh",
      56: "Belgium", 64: "Bhutan", 68: "Bolivia", 70: "Bosnia and Herz.",
      72: "Botswana", 76: "Brazil", 96: "Brunei", 100: "Bulgaria",
      104: "Myanmar", 108: "Burundi", 116: "Cambodia", 120: "Cameroon",
      124: "Canada", 140: "Central African Rep.", 144: "Sri Lanka",
      148: "Chad", 152: "Chile", 156: "China", 170: "Colombia",
      178: "Congo", 180: "Dem. Rep. Congo", 188: "Costa Rica",
      191: "Croatia", 192: "Cuba", 196: "Cyprus", 203: "Czech Rep.",
      208: "Denmark", 214: "Dominican Rep.", 218: "Ecuador",
      818: "Egypt", 222: "El Salvador", 226: "Eq. Guinea",
      232: "Eritrea", 233: "Estonia", 231: "Ethiopia", 242: "Fiji",
      246: "Finland", 250: "France", 266: "Gabon", 270: "Gambia",
      268: "Georgia", 276: "Germany", 288: "Ghana", 300: "Greece",
      320: "Guatemala", 324: "Guinea", 328: "Guyana", 332: "Haiti",
      340: "Honduras", 348: "Hungary", 352: "Iceland", 356: "India",
      360: "Indonesia", 364: "Iran", 368: "Iraq", 372: "Ireland",
      376: "Israel", 380: "Italy", 384: "Ivory Coast", 388: "Jamaica",
      392: "Japan", 400: "Jordan", 398: "Kazakhstan", 404: "Kenya",
      408: "North Korea", 410: "S. Korea", 414: "Kuwait",
      418: "Laos", 422: "Lebanon", 426: "Lesotho", 430: "Liberia",
      434: "Libya", 440: "Lithuania", 442: "Luxembourg",
      450: "Madagascar", 454: "Malawi", 458: "Malaysia", 466: "Mali",
      478: "Mauritania", 484: "Mexico", 496: "Mongolia",
      498: "Moldova", 504: "Morocco", 508: "Mozambique",
      516: "Namibia", 524: "Nepal", 528: "Netherlands",
      554: "New Zealand", 558: "Nicaragua", 562: "Niger",
      566: "Nigeria", 578: "Norway", 512: "Oman", 586: "Pakistan",
      591: "Panama", 598: "Papua New Guinea", 600: "Paraguay",
      604: "Peru", 608: "Philippines", 616: "Poland",
      620: "Portugal", 630: "Puerto Rico", 634: "Qatar",
      642: "Romania", 643: "Russia", 646: "Rwanda",
      682: "Saudi Arabia", 686: "Senegal", 688: "Serbia",
      694: "Sierra Leone", 702: "Singapore", 703: "Slovakia",
      704: "Vietnam", 705: "Slovenia", 706: "Somalia",
      710: "South Africa", 716: "Zimbabwe", 724: "Spain",
      728: "S. Sudan", 736: "Sudan", 740: "Suriname",
      748: "Swaziland", 752: "Sweden", 756: "Switzerland",
      760: "Syria", 762: "Tajikistan", 764: "Thailand", 768: "Togo",
      780: "Trinidad and Tobago", 784: "United Arab Emirates",
      788: "Tunisia", 792: "Turkey", 795: "Turkmenistan",
      800: "Uganda", 804: "Ukraine", 826: "United Kingdom",
      834: "Tanzania", 840: "United States of America",
      854: "Burkina Faso", 858: "Uruguay", 860: "Uzbekistan",
      862: "Venezuela", 887: "Yemen", 894: "Zambia",
    }),
    []
  );

  function getCountryName(feature) {
    return (
      feature.properties?.name ||
      COUNTRY_NAMES[parseInt(feature.id)] ||
      `ID:${feature.id}`
    );
  }

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
      .scale(size / 2 - 10)
      .translate([size / 2, size / 2])
      .rotate(rotation)
      .clipAngle(90);
  }, [rotation, size]);

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  // Drag handlers
  const handleMouseDown = useCallback(
    (e) => {
      setIsDragging(true);
      setAutoRotate(false);
      const rect = svgRef.current.getBoundingClientRect();
      dragRef.current = {
        start: [e.clientX - rect.left, e.clientY - rect.top],
        startRotation: [...rotation],
      };
    },
    [rotation]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !dragRef.current.start) return;
      const rect = svgRef.current.getBoundingClientRect();
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

  const handleCountryClick = useCallback((feature) => {
    const name = getCountryName(feature);
    const data = NEWS_DATA[name];
    if (data) {
      setSelectedCountry(name);
      setSelectedState(null);
      if (name === "India") setShowIndia(true);
      else setShowIndia(false);
    }
  }, []);

  function getCountryColor(name) {
    const data = NEWS_DATA[name];
    if (!data) return "#1a2332";
    return CONTINENT_COLORS[data.continent] || "#4a5568";
  }

  // Search filter
  const filteredStates = useMemo(() => {
    if (!showIndia || !NEWS_DATA.India?.states) return {};
    if (!searchQuery) return NEWS_DATA.India.states;
    const q = searchQuery.toLowerCase();
    const result = {};
    for (const [state, channels] of Object.entries(NEWS_DATA.India.states)) {
      if (
        state.toLowerCase().includes(q) ||
        channels.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.lang.toLowerCase().includes(q)
        )
      ) {
        result[state] = channels;
      }
    }
    return result;
  }, [showIndia, searchQuery]);

  const totalChannels = useMemo(() => {
    let count = 0;
    for (const d of Object.values(NEWS_DATA)) {
      count += d.channels?.length || 0;
      if (d.states)
        for (const chs of Object.values(d.states)) count += chs.length;
    }
    return count;
  }, []);

  const graticule = useMemo(() => d3.geoGraticule10(), []);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e17 0%, #0d1b2a 40%, #1b2838 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: "flex",
        flexDirection: "column",
        color: "#e0e6ed",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.2)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF6B35, #4ECDC4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🌍
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>
              Global News Explorer
            </div>
            <div style={{ fontSize: 11, color: "#7a8ba0" }}>
              {Object.keys(NEWS_DATA).length} Countries • {totalChannels}+ Channels
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setAutoRotate(!autoRotate);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.15)",
              background: autoRotate
                ? "rgba(78,205,196,0.2)"
                : "rgba(255,255,255,0.05)",
              color: autoRotate ? "#4ECDC4" : "#7a8ba0",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {autoRotate ? "⏸ Pause" : "▶ Rotate"}
          </button>
          {selectedCountry && (
            <button
              onClick={() => {
                setSelectedCountry(null);
                setShowIndia(false);
                setSelectedState(null);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid rgba(255,107,53,0.3)",
                background: "rgba(255,107,53,0.15)",
                color: "#FF6B35",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ✕ Close Panel
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Globe */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            minWidth: 0,
          }}
        >
          {/* Glow effect */}
          <div
            style={{
              position: "absolute",
              width: size + 40,
              height: size + 40,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <svg
            ref={svgRef}
            width={size}
            height={size}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Ocean */}
            <defs>
              <radialGradient id="ocean" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#1a3a5c" />
                <stop offset="100%" stopColor="#0a1628" />
              </radialGradient>
              <radialGradient id="atmosphere" cx="40%" cy="35%">
                <stop offset="85%" stopColor="transparent" />
                <stop offset="100%" stopColor="rgba(78,205,196,0.12)" />
              </radialGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 10}
              fill="url(#ocean)"
            />

            {/* Graticule */}
            <path
              d={pathGenerator(graticule)}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={0.5}
            />

            {/* Countries */}
            {geoData?.features?.map((feature, i) => {
              const name = getCountryName(feature);
              const hasData = !!NEWS_DATA[name];
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
                      ? "#FF6B35"
                      : isHovered && hasData
                      ? "#4ECDC4"
                      : hasData
                      ? getCountryColor(name) + "88"
                      : "#1a2332"
                  }
                  stroke={
                    isSelected
                      ? "#FF6B35"
                      : hasData
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.06)"
                  }
                  strokeWidth={isSelected ? 1.5 : 0.4}
                  style={{
                    cursor: hasData ? "pointer" : "default",
                    transition: "fill 0.3s",
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

            {/* Atmosphere glow */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 10}
              fill="none"
              stroke="rgba(78,205,196,0.15)"
              strokeWidth={2}
            />
          </svg>

          {/* Hover tooltip */}
          {hoveredCountry && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "8px 16px",
                background: "rgba(0,0,0,0.8)",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: NEWS_DATA[hoveredCountry]
                  ? "1px solid rgba(78,205,196,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
                pointerEvents: "none",
              }}
            >
              {hoveredCountry}
              {NEWS_DATA[hoveredCountry] && (
                <span style={{ color: "#4ECDC4", marginLeft: 8 }}>
                  {NEWS_DATA[hoveredCountry].channels?.length || 0} channel
                  {(NEWS_DATA[hoveredCountry].channels?.length || 0) !== 1
                    ? "s"
                    : ""}
                  {NEWS_DATA[hoveredCountry].states &&
                    ` + ${Object.keys(NEWS_DATA[hoveredCountry].states).length} states`}
                </span>
              )}
            </div>
          )}

          {/* Legend */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              maxWidth: 200,
            }}
          >
            {Object.entries(CONTINENT_COLORS).map(([name, color]) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  color: "#7a8ba0",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: color,
                  }}
                />
                {name}
              </div>
            ))}
          </div>

          {/* Instruction */}
          {!selectedCountry && (
            <div
              style={{
                position: "absolute",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "6px 16px",
                background: "rgba(0,0,0,0.6)",
                borderRadius: 20,
                fontSize: 11,
                color: "#7a8ba0",
                pointerEvents: "none",
              }}
            >
              🖱 Drag to rotate • Click colored countries to explore channels
            </div>
          )}
        </div>

        {/* Side Panel */}
        {selectedCountry && (
          <div
            style={{
              width: 360,
              background: "rgba(13,27,42,0.95)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              overflowY: "auto",
              flexShrink: 0,
              animation: "slideIn 0.3s ease",
            }}
          >
            <style>{`
              @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
              .ch-card:hover { background: rgba(255,255,255,0.06) !important; }
              .yt-btn:hover { background: #c4302b !important; }
              .state-btn:hover { background: rgba(78,205,196,0.15) !important; }
              ::-webkit-scrollbar { width: 6px; }
              ::-webkit-scrollbar-track { background: transparent; }
              ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
            `}</style>

            {/* Country Header */}
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: `linear-gradient(135deg, ${
                  CONTINENT_COLORS[NEWS_DATA[selectedCountry]?.continent] ||
                  "#FF6B35"
                }15, transparent)`,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {selectedCountry}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: CONTINENT_COLORS[NEWS_DATA[selectedCountry]?.continent],
                  fontWeight: 600,
                }}
              >
                {NEWS_DATA[selectedCountry]?.continent}
              </div>
            </div>

            {/* National Channels */}
            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  color: "#7a8ba0",
                  marginBottom: 12,
                }}
              >
                {selectedCountry === "India"
                  ? "National Channels"
                  : "News Channels"}
              </div>
              {NEWS_DATA[selectedCountry]?.channels?.map((ch, i) => (
                <div
                  key={i}
                  className="ch-card"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    marginBottom: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        {ch.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          fontSize: 11,
                          color: "#7a8ba0",
                        }}
                      >
                        <span>{ch.lang}</span>
                        {ch.type && (
                          <>
                            <span>•</span>
                            <span
                              style={{
                                color:
                                  ch.type === "Public"
                                    ? "#4ECDC4"
                                    : ch.type === "State"
                                    ? "#E8AA14"
                                    : "#FF69B4",
                              }}
                            >
                              {ch.type}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="yt-btn"
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: "#FF0000",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      ▶ YouTube
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* India States */}
            {showIndia && NEWS_DATA.India?.states && (
              <div
                style={{
                  padding: "0 20px 20px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    color: "#7a8ba0",
                    marginBottom: 12,
                  }}
                >
                  State-Wise Channels ({Object.keys(NEWS_DATA.India.states).length} States)
                </div>

                {/* Search */}
                <input
                  type="text"
                  placeholder="🔍 Search state or language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "#e0e6ed",
                    fontSize: 12,
                    marginBottom: 12,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                {Object.entries(filteredStates).map(([state, channels]) => (
                  <div key={state} style={{ marginBottom: 4 }}>
                    <button
                      className="state-btn"
                      onClick={() =>
                        setSelectedState(
                          selectedState === state ? null : state
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.06)",
                        background:
                          selectedState === state
                            ? "rgba(78,205,196,0.12)"
                            : "rgba(255,255,255,0.02)",
                        color:
                          selectedState === state ? "#4ECDC4" : "#c0c8d4",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background 0.2s",
                      }}
                    >
                      <span>{state}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#7a8ba0",
                          fontWeight: 400,
                        }}
                      >
                        {channels.length} ch{" "}
                        {selectedState === state ? "▴" : "▾"}
                      </span>
                    </button>

                    {selectedState === state && (
                      <div style={{ padding: "8px 0 8px 8px" }}>
                        {channels.map((ch, i) => (
                          <div
                            key={i}
                            className="ch-card"
                            style={{
                              padding: "10px 12px",
                              borderRadius: 8,
                              marginBottom: 6,
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.04)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              transition: "background 0.2s",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                {ch.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#7a8ba0",
                                }}
                              >
                                {ch.lang}
                              </div>
                            </div>
                            <a
                              href={ch.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="yt-btn"
                              style={{
                                padding: "5px 10px",
                                borderRadius: 5,
                                background: "#FF0000",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                textDecoration: "none",
                                transition: "background 0.2s",
                                flexShrink: 0,
                              }}
                            >
                              ▶ YT
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
