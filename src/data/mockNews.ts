export type Sentiment = "positive" | "negative" | "neutral";
export type Category = "Politics" | "Technology" | "Sports" | "Health" | "Science" | "Business" | "Entertainment" | "Environment";

export interface NamedEntity {
  text: string;
  type: "person" | "place" | "organization";
}

export interface CrossSource {
  source: string;
  headline: string;
  agrees: boolean;
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  fullText: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  timestamp: string;
  category: Category;
  sentiment: Sentiment;
  sentimentScore: number;
  credibilityScore: number;
  bertConfidence: number;
  communityReports: number;
  location: {
    city: string;
    district: string;
    state: string;
    country: string;
    continent: string;
    lat: number;
    lng: number;
  };
  entities: NamedEntity[];
  crossSources: CrossSource[];
  aiSummary: string;
}

export const mockArticles: NewsArticle[] = [
  {
    id: "1",
    headline: "Tokyo Launches AI-Powered Traffic Management System",
    summary: "Tokyo Metropolitan Government deploys cutting-edge AI system to optimize traffic flow across 12,000 intersections.",
    fullText: "In a landmark move for urban infrastructure, the Tokyo Metropolitan Government has officially launched an AI-powered traffic management system that monitors and optimizes traffic flow across 12,000 intersections in real-time. The system uses deep learning algorithms trained on five years of traffic data to predict congestion patterns and dynamically adjust signal timing. Early results show a 23% reduction in average commute times during peak hours. The project, developed in partnership with NTT Data and the University of Tokyo, represents a ¥50 billion investment in smart city infrastructure. Transportation Minister Tetsuo Saito praised the initiative as a model for other megacities facing similar congestion challenges.",
    source: "Nikkei Asia",
    timestamp: "2025-02-10T09:30:00Z",
    category: "Technology",
    sentiment: "positive",
    sentimentScore: 0.87,
    credibilityScore: 92,
    bertConfidence: 0.95,
    communityReports: 2,
    location: { city: "Tokyo", district: "Chiyoda", state: "Tokyo", country: "Japan", continent: "Asia", lat: 35.6762, lng: 139.6503 },
    entities: [
      { text: "Tokyo Metropolitan Government", type: "organization" },
      { text: "NTT Data", type: "organization" },
      { text: "Tetsuo Saito", type: "person" },
      { text: "University of Tokyo", type: "organization" },
      { text: "Tokyo", type: "place" },
    ],
    crossSources: [
      { source: "Japan Times", headline: "Tokyo's AI Traffic System Goes Live", agrees: true },
      { source: "Reuters", headline: "Japan Capital Introduces Smart Traffic Grid", agrees: true },
    ],
    aiSummary: "Tokyo deploys AI traffic system across 12,000 intersections, reducing commute times by 23%. A ¥50B smart city investment developed with NTT Data and University of Tokyo.",
  },
  {
    id: "2",
    headline: "Amazon Rainforest Deforestation Hits Record Low",
    summary: "Brazil reports lowest deforestation rate in the Amazon in 15 years following aggressive enforcement policies.",
    fullText: "Brazil's National Institute for Space Research (INPE) announced that deforestation in the Amazon rainforest dropped to its lowest level in 15 years during 2024. The 4,200 square kilometers cleared represent a 45% decrease from the previous year. Environmental Minister Marina Silva attributed the success to strengthened enforcement operations, including the deployment of satellite monitoring systems and increased penalties for illegal logging. Indigenous community patrols have also played a crucial role in protecting vulnerable areas. International environmental organizations welcomed the news but cautioned that sustained effort is needed to maintain the trend.",
    source: "Reuters",
    timestamp: "2025-02-09T14:00:00Z",
    category: "Environment",
    sentiment: "positive",
    sentimentScore: 0.92,
    credibilityScore: 95,
    bertConfidence: 0.97,
    communityReports: 0,
    location: { city: "Manaus", district: "Centro", state: "Amazonas", country: "Brazil", continent: "South America", lat: -3.119, lng: -60.0217 },
    entities: [
      { text: "INPE", type: "organization" },
      { text: "Marina Silva", type: "person" },
      { text: "Amazon", type: "place" },
      { text: "Brazil", type: "place" },
    ],
    crossSources: [
      { source: "BBC News", headline: "Amazon Deforestation Drops Sharply", agrees: true },
      { source: "Al Jazeera", headline: "Brazil Celebrates Forest Protection Milestone", agrees: true },
    ],
    aiSummary: "Amazon deforestation hits 15-year low with 45% decrease. Success driven by satellite monitoring, enforcement, and indigenous patrols.",
  },
  {
    id: "3",
    headline: "Controversial Election Results Spark Protests in Nairobi",
    summary: "Thousands take to the streets in Nairobi after opposition alleges widespread vote manipulation in regional elections.",
    fullText: "Thousands of demonstrators flooded the streets of Nairobi following the announcement of regional election results that the opposition Kenya Democratic Alliance (KDA) has called fraudulent. Opposition leader Raila Odinga demanded a full recount, citing irregularities at over 200 polling stations. The Independent Electoral and Boundaries Commission (IEBC) has defended the integrity of the process, stating that international observers found no systemic issues. Police deployed tear gas to disperse crowds near the parliament building, and at least 15 people were reported injured. The African Union has called for calm and dialogue between all parties.",
    source: "BBC News",
    timestamp: "2025-02-10T16:45:00Z",
    category: "Politics",
    sentiment: "negative",
    sentimentScore: 0.23,
    credibilityScore: 78,
    bertConfidence: 0.82,
    communityReports: 14,
    location: { city: "Nairobi", district: "Central", state: "Nairobi County", country: "Kenya", continent: "Africa", lat: -1.2921, lng: 36.8219 },
    entities: [
      { text: "Raila Odinga", type: "person" },
      { text: "KDA", type: "organization" },
      { text: "IEBC", type: "organization" },
      { text: "African Union", type: "organization" },
      { text: "Nairobi", type: "place" },
    ],
    crossSources: [
      { source: "Al Jazeera", headline: "Kenya Opposition Cries Foul Over Election", agrees: true },
      { source: "Daily Nation", headline: "IEBC Defends Election Process", agrees: false },
    ],
    aiSummary: "Nairobi protests erupt over alleged election fraud. Opposition demands recount as IEBC defends results. 15 injured in clashes.",
  },
  {
    id: "4",
    headline: "SpaceX Successfully Tests Starship Orbital Refueling",
    summary: "SpaceX achieves first-ever orbital fuel transfer between two Starship vehicles, a critical milestone for Mars missions.",
    fullText: "SpaceX has successfully demonstrated orbital propellant transfer between two Starship vehicles in low Earth orbit, marking a crucial milestone toward enabling deep space missions. The test, conducted 400 kilometers above Earth, transferred approximately 10 tonnes of liquid oxygen and methane between the tanker and depot variants. NASA Administrator Bill Nelson congratulated SpaceX, noting this technology is essential for the Artemis program's lunar landing missions. CEO Elon Musk called it 'the key that unlocks Mars' during a post-test press conference. The demonstration was watched live by over 8 million viewers worldwide.",
    source: "Space.com",
    timestamp: "2025-02-08T20:00:00Z",
    category: "Science",
    sentiment: "positive",
    sentimentScore: 0.95,
    credibilityScore: 88,
    bertConfidence: 0.91,
    communityReports: 1,
    location: { city: "Cape Canaveral", district: "Brevard", state: "Florida", country: "United States", continent: "North America", lat: 28.3922, lng: -80.6077 },
    entities: [
      { text: "SpaceX", type: "organization" },
      { text: "NASA", type: "organization" },
      { text: "Bill Nelson", type: "person" },
      { text: "Elon Musk", type: "person" },
    ],
    crossSources: [
      { source: "NASA.gov", headline: "Orbital Refueling Test Success", agrees: true },
      { source: "The Verge", headline: "SpaceX Refuels Starship in Orbit", agrees: true },
    ],
    aiSummary: "SpaceX achieves first orbital fuel transfer between Starships. 10 tonnes transferred at 400km altitude. Key milestone for Mars and Artemis missions.",
  },
  {
    id: "5",
    headline: "EU Passes Landmark Digital Privacy Regulation",
    summary: "European Parliament approves new regulation requiring AI systems to disclose training data sources and algorithmic decision-making processes.",
    fullText: "The European Parliament has passed the AI Transparency Act with a decisive 420-115 vote, requiring all AI systems operating within the EU to disclose their training data sources, provide explanations for algorithmic decisions affecting individuals, and undergo mandatory bias audits. The regulation, which takes effect in January 2026, has been praised by digital rights organizations as the most comprehensive AI governance framework in the world. Tech industry groups have expressed concern about compliance costs, with lobby group DigitalEurope estimating implementation costs of €2.3 billion across the sector. Commissioner Thierry Breton called it 'a new chapter in digital rights for European citizens.'",
    source: "Financial Times",
    timestamp: "2025-02-09T11:20:00Z",
    category: "Politics",
    sentiment: "neutral",
    sentimentScore: 0.52,
    credibilityScore: 96,
    bertConfidence: 0.94,
    communityReports: 3,
    location: { city: "Brussels", district: "European Quarter", state: "Brussels-Capital", country: "Belgium", continent: "Europe", lat: 50.8503, lng: 4.3517 },
    entities: [
      { text: "European Parliament", type: "organization" },
      { text: "Thierry Breton", type: "person" },
      { text: "DigitalEurope", type: "organization" },
    ],
    crossSources: [
      { source: "Politico EU", headline: "EU AI Transparency Act Passes", agrees: true },
      { source: "TechCrunch", headline: "EU's Sweeping AI Rules Win Final Vote", agrees: true },
    ],
    aiSummary: "EU passes AI Transparency Act requiring disclosure of training data and bias audits. Takes effect Jan 2026. Industry estimates €2.3B compliance costs.",
  },
  {
    id: "6",
    headline: "Premier League Title Race Heats Up After Manchester Derby",
    summary: "Manchester City defeats United 3-1 in a thrilling derby, closing the gap at the top of the Premier League table.",
    fullText: "Manchester City reignited their Premier League title challenge with a commanding 3-1 victory over Manchester United at the Etihad Stadium. Erling Haaland scored twice in the first half before Kevin De Bruyne added a spectacular long-range goal in the 67th minute. Marcus Rashford scored a consolation for United in stoppage time. The result moves City to within two points of leaders Arsenal with a game in hand. Manager Pep Guardiola declared the title race 'far from over' and praised his team's defensive discipline. The derby attracted a global TV audience of over 900 million viewers.",
    source: "Sky Sports",
    timestamp: "2025-02-09T17:30:00Z",
    category: "Sports",
    sentiment: "neutral",
    sentimentScore: 0.55,
    credibilityScore: 94,
    bertConfidence: 0.96,
    communityReports: 0,
    location: { city: "Manchester", district: "Eastlands", state: "Greater Manchester", country: "United Kingdom", continent: "Europe", lat: 53.4831, lng: -2.2004 },
    entities: [
      { text: "Manchester City", type: "organization" },
      { text: "Erling Haaland", type: "person" },
      { text: "Kevin De Bruyne", type: "person" },
      { text: "Pep Guardiola", type: "person" },
    ],
    crossSources: [
      { source: "BBC Sport", headline: "City Dominate Derby to Close Gap", agrees: true },
      { source: "ESPN", headline: "Haaland Brace Sinks United", agrees: true },
    ],
    aiSummary: "Man City beats United 3-1. Haaland brace and De Bruyne screamer close gap on Arsenal to 2 points. 900M global viewers.",
  },
  {
    id: "7",
    headline: "India's ISRO Successfully Deploys Space Station Module",
    summary: "India becomes fifth nation to launch a crewed space station module, marking a historic achievement for the Gaganyaan program.",
    fullText: "The Indian Space Research Organisation (ISRO) has successfully deployed its first space station module, Bharatiya Antariksha Station (BAS-1), into low Earth orbit. The module, launched aboard the GSLV Mk III heavy-lift rocket from Sriharikota, will serve as the foundation for India's planned space station. Prime Minister Narendra Modi addressed ISRO scientists at the mission control center, calling it 'a giant leap for India and all of humanity.' The module carries experimental payloads from 15 Indian universities and will be operational for initial experiments within 60 days.",
    source: "The Hindu",
    timestamp: "2025-02-10T06:15:00Z",
    category: "Science",
    sentiment: "positive",
    sentimentScore: 0.94,
    credibilityScore: 90,
    bertConfidence: 0.93,
    communityReports: 1,
    location: { city: "Sriharikota", district: "Tirupati", state: "Andhra Pradesh", country: "India", continent: "Asia", lat: 13.72, lng: 80.23 },
    entities: [
      { text: "ISRO", type: "organization" },
      { text: "Narendra Modi", type: "person" },
      { text: "Sriharikota", type: "place" },
    ],
    crossSources: [
      { source: "Times of India", headline: "ISRO Launches First Space Station Module", agrees: true },
      { source: "Nature", headline: "India Enters Space Station Era", agrees: true },
    ],
    aiSummary: "ISRO deploys BAS-1 space station module. India becomes 5th nation with space station capability. Carries 15 university payloads.",
  },
  {
    id: "8",
    headline: "Fake Cure for Cancer Virus Goes Viral on Social Media",
    summary: "Health authorities warn about a fraudulent claim that a common household spice can cure cancer, spreading rapidly across platforms.",
    fullText: "The World Health Organization has issued an urgent advisory after a viral social media post claiming that turmeric mixed with baking soda can cure all forms of cancer amassed over 50 million views across platforms. The post, originating from an unverified account, features fabricated testimonials and a fake documentary-style video. Oncologists worldwide have condemned the claim as dangerous misinformation that could lead patients to abandon proven treatments. Facebook and X (Twitter) have begun removing the content, but it continues to spread through private messaging groups. Dr. Tedros Adhanom Ghebreyesus urged the public to rely on verified medical advice.",
    source: "WHO Press Release",
    timestamp: "2025-02-10T12:00:00Z",
    category: "Health",
    sentiment: "negative",
    sentimentScore: 0.12,
    credibilityScore: 15,
    bertConfidence: 0.98,
    communityReports: 347,
    location: { city: "Geneva", district: "Cité", state: "Geneva", country: "Switzerland", continent: "Europe", lat: 46.2044, lng: 6.1432 },
    entities: [
      { text: "WHO", type: "organization" },
      { text: "Tedros Adhanom Ghebreyesus", type: "person" },
      { text: "Facebook", type: "organization" },
    ],
    crossSources: [
      { source: "Snopes", headline: "Turmeric Cancer Cure Claim is False", agrees: true },
      { source: "FactCheck.org", headline: "Viral Cancer Cure Post Debunked", agrees: true },
      { source: "NaturalNews.com", headline: "Big Pharma Tries to Hide Turmeric Cure", agrees: false },
    ],
    aiSummary: "WHO warns about viral fake cancer cure post with 50M views. Turmeric-baking soda claim debunked by oncologists worldwide. Platforms removing content.",
  },
  {
    id: "9",
    headline: "Sydney Opera House Gets Solar-Powered Roof Upgrade",
    summary: "Australia's iconic Sydney Opera House completes installation of transparent solar panels integrated into its famous sail-shaped roofs.",
    fullText: "The Sydney Opera House has completed a $180 million renovation that includes the installation of specially designed transparent solar panels integrated into its iconic sail-shaped roof structures. The panels, developed by Australian startup SunDriven, generate enough electricity to power the entire venue while maintaining the building's distinctive appearance. Heritage architects worked closely with engineers to ensure the UNESCO World Heritage site's visual integrity was preserved. NSW Premier Chris Minns called the project a 'perfect marriage of heritage preservation and clean energy innovation.' The Opera House now aims to be carbon-negative by 2027.",
    source: "Sydney Morning Herald",
    timestamp: "2025-02-08T03:45:00Z",
    category: "Environment",
    sentiment: "positive",
    sentimentScore: 0.89,
    credibilityScore: 91,
    bertConfidence: 0.92,
    communityReports: 0,
    location: { city: "Sydney", district: "Bennelong Point", state: "New South Wales", country: "Australia", continent: "Oceania", lat: -33.8568, lng: 151.2153 },
    entities: [
      { text: "Sydney Opera House", type: "place" },
      { text: "SunDriven", type: "organization" },
      { text: "Chris Minns", type: "person" },
    ],
    crossSources: [
      { source: "The Guardian", headline: "Opera House Goes Solar", agrees: true },
      { source: "ABC News AU", headline: "Solar Panels Crown Iconic Sails", agrees: true },
    ],
    aiSummary: "Sydney Opera House gets $180M transparent solar roof. Powers entire venue while preserving UNESCO heritage appearance. Carbon-negative target by 2027.",
  },
  {
    id: "10",
    headline: "Mexico City Faces Severe Water Crisis",
    summary: "Mexico City declares water emergency as reservoir levels drop to 28%, affecting 22 million residents.",
    fullText: "Mexico City has declared a state of water emergency as the Cutzamala reservoir system, which supplies 30% of the capital's water, dropped to just 28% capacity — the lowest level in recorded history. Mayor Martí Batres announced emergency rationing measures affecting 22 million residents in the metropolitan area. Water deliveries by tanker trucks have tripled, but long queues and distribution conflicts have been reported in southern neighborhoods. Climate scientists attribute the crisis to consecutive years of below-average rainfall compounded by aging infrastructure that loses 40% of water to leaks. The federal government has allocated 15 billion pesos for emergency infrastructure repairs.",
    source: "El Universal",
    timestamp: "2025-02-10T08:00:00Z",
    category: "Environment",
    sentiment: "negative",
    sentimentScore: 0.15,
    credibilityScore: 88,
    bertConfidence: 0.90,
    communityReports: 5,
    location: { city: "Mexico City", district: "Cuauhtémoc", state: "CDMX", country: "Mexico", continent: "North America", lat: 19.4326, lng: -99.1332 },
    entities: [
      { text: "Martí Batres", type: "person" },
      { text: "Cutzamala", type: "place" },
      { text: "Mexico City", type: "place" },
    ],
    crossSources: [
      { source: "AP News", headline: "Mexico City Water Rationing Begins", agrees: true },
      { source: "The Guardian", headline: "Megacity Faces Day Zero Water Crisis", agrees: true },
    ],
    aiSummary: "Mexico City declares water emergency. Reservoirs at 28% capacity, 22M affected. 40% water lost to leaks. 15B peso emergency fund allocated.",
  },
  {
    id: "11",
    headline: "Samsung Unveils Foldable Laptop with Rollable Display",
    summary: "Samsung introduces the Galaxy Book Fold, featuring a 17-inch display that rolls down to a compact 12-inch form factor.",
    fullText: "Samsung Electronics has unveiled the Galaxy Book Fold at Mobile World Congress in Barcelona, featuring a revolutionary rollable OLED display that extends from 12 inches to 17 inches with the press of a button. The device uses Samsung's proprietary UTG (Ultra Thin Glass) technology and a precision motor system to smoothly expand the screen. Priced at $2,499, the laptop targets creative professionals and business executives. Samsung's head of mobile, TM Roh, demonstrated the device during the keynote, showing seamless multitasking between compact and expanded modes. Pre-orders begin March 1 with shipping expected in April.",
    source: "The Verge",
    timestamp: "2025-02-10T10:30:00Z",
    category: "Technology",
    sentiment: "positive",
    sentimentScore: 0.78,
    credibilityScore: 93,
    bertConfidence: 0.94,
    communityReports: 1,
    location: { city: "Barcelona", district: "Fira Gran Via", state: "Catalonia", country: "Spain", continent: "Europe", lat: 41.3874, lng: 2.1686 },
    entities: [
      { text: "Samsung Electronics", type: "organization" },
      { text: "TM Roh", type: "person" },
      { text: "Barcelona", type: "place" },
    ],
    crossSources: [
      { source: "CNET", headline: "Samsung's Rollable Laptop Is Real", agrees: true },
      { source: "Engadget", headline: "Galaxy Book Fold Hands-On Preview", agrees: true },
    ],
    aiSummary: "Samsung launches Galaxy Book Fold with 12-to-17-inch rollable OLED. Uses UTG glass tech. $2,499, pre-orders March 1.",
  },
  {
    id: "12",
    headline: "WHO Declares Mpox Outbreak Under Control in Central Africa",
    summary: "World Health Organization downgrades Mpox alert level after vaccination campaign reaches 85% of target population in DRC.",
    fullText: "The World Health Organization has downgraded the Mpox (monkeypox) Public Health Emergency of International Concern (PHEIC) in Central Africa after a successful vaccination campaign reached 85% of the target population in the Democratic Republic of Congo. The MVA-BN vaccine, distributed through a partnership with GAVI and UNICEF, was administered to over 12 million people across six countries. New case numbers have dropped by 94% since the peak in September 2024. WHO Regional Director Dr. Matshidiso Moeti praised the rapid international response but emphasized the need for continued surveillance. The DRC government has committed to maintaining routine Mpox vaccination in its national immunization program.",
    source: "WHO Bulletin",
    timestamp: "2025-02-09T09:00:00Z",
    category: "Health",
    sentiment: "positive",
    sentimentScore: 0.88,
    credibilityScore: 97,
    bertConfidence: 0.96,
    communityReports: 0,
    location: { city: "Kinshasa", district: "Gombe", state: "Kinshasa Province", country: "DR Congo", continent: "Africa", lat: -4.4419, lng: 15.2663 },
    entities: [
      { text: "WHO", type: "organization" },
      { text: "Matshidiso Moeti", type: "person" },
      { text: "GAVI", type: "organization" },
      { text: "UNICEF", type: "organization" },
    ],
    crossSources: [
      { source: "The Lancet", headline: "Central Africa Mpox Vaccination Success", agrees: true },
      { source: "AP News", headline: "WHO Lowers Mpox Alert After DRC Campaign", agrees: true },
    ],
    aiSummary: "WHO downgrades Mpox emergency. 85% vaccination coverage in DRC, 94% case drop. 12M vaccinated across 6 countries via GAVI/UNICEF partnership.",
  },
  {
    id: "13",
    headline: "Egypt Unveils New Archaeological Discovery Near Pyramids",
    summary: "Archaeologists discover a 4,500-year-old tomb complex near Giza containing unprecedented artifacts from the Old Kingdom period.",
    fullText: "Egypt's Supreme Council of Antiquities has announced the discovery of a sprawling tomb complex dating back 4,500 years, located just 500 meters from the Great Pyramid of Giza. The complex contains 16 interconnected burial chambers filled with painted limestone statues, golden amulets, and papyrus scrolls believed to contain administrative records from the reign of Pharaoh Khufu. Lead archaeologist Dr. Zahi Hawass described the find as 'the most significant discovery near the pyramids in over a century.' The tomb's exceptional preservation is attributed to a natural limestone seal that kept the chambers airtight. Egypt's Tourism Minister announced plans to open a dedicated exhibition at the Grand Egyptian Museum.",
    source: "National Geographic",
    timestamp: "2025-02-08T15:00:00Z",
    category: "Science",
    sentiment: "positive",
    sentimentScore: 0.91,
    credibilityScore: 89,
    bertConfidence: 0.88,
    communityReports: 2,
    location: { city: "Giza", district: "Haram", state: "Giza Governorate", country: "Egypt", continent: "Africa", lat: 29.9792, lng: 31.1342 },
    entities: [
      { text: "Zahi Hawass", type: "person" },
      { text: "Khufu", type: "person" },
      { text: "Giza", type: "place" },
      { text: "Grand Egyptian Museum", type: "organization" },
    ],
    crossSources: [
      { source: "BBC News", headline: "Ancient Tomb Found Near Pyramids", agrees: true },
      { source: "Smithsonian", headline: "Giza Yields Major Archaeological Find", agrees: true },
    ],
    aiSummary: "4,500-year-old tomb complex found 500m from Great Pyramid. 16 chambers with statues, golden amulets, Khufu-era papyrus scrolls. Best-preserved find in a century.",
  },
  {
    id: "14",
    headline: "New York City Bans Facial Recognition in Public Housing",
    summary: "NYC Council passes legislation prohibiting the use of facial recognition technology in all public housing complexes.",
    fullText: "The New York City Council has passed a groundbreaking ordinance banning the use of facial recognition technology in all 335 public housing developments managed by NYCHA, affecting approximately 400,000 residents. The legislation, sponsored by Council Member Shahana Hanif, comes after a two-year advocacy campaign by tenant organizations who argued the technology disproportionately misidentifies people of color. The ACLU praised the ban as a 'model for cities nationwide.' NYCHA had been piloting facial recognition-based entry systems in 15 buildings since 2023. Mayor Eric Adams, who initially supported the technology, signed the bill citing 'legitimate privacy concerns raised by residents.'",
    source: "New York Times",
    timestamp: "2025-02-09T18:45:00Z",
    category: "Politics",
    sentiment: "neutral",
    sentimentScore: 0.48,
    credibilityScore: 94,
    bertConfidence: 0.93,
    communityReports: 6,
    location: { city: "New York", district: "Manhattan", state: "New York", country: "United States", continent: "North America", lat: 40.7128, lng: -74.006 },
    entities: [
      { text: "NYC Council", type: "organization" },
      { text: "Shahana Hanif", type: "person" },
      { text: "NYCHA", type: "organization" },
      { text: "ACLU", type: "organization" },
      { text: "Eric Adams", type: "person" },
    ],
    crossSources: [
      { source: "The Guardian", headline: "NYC Bans Facial Recognition in Public Housing", agrees: true },
      { source: "Wired", headline: "New York Takes Stand Against Surveillance Tech", agrees: true },
    ],
    aiSummary: "NYC bans facial recognition in 335 public housing buildings affecting 400K residents. Passed after advocacy citing racial bias in identification.",
  },
  {
    id: "15",
    headline: "Record-Breaking Heatwave Sweeps Across Southeast Asia",
    summary: "Thailand, Vietnam, and Philippines report temperatures exceeding 45°C as extreme heatwave disrupts daily life.",
    fullText: "A prolonged heatwave across Southeast Asia has shattered temperature records in multiple countries, with Thailand recording 46.1°C in Tak province — the highest temperature ever recorded in the country. Vietnam's Hanoi reached 44.8°C while Manila hit 43.2°C. Schools in all three countries have shifted to online learning, and outdoor work has been banned during peak hours. The Thai Ministry of Public Health reported a 300% increase in heat-related hospital admissions. Meteorologists link the extreme heat to a developing El Niño pattern combined with climate change-driven warming. The ASEAN Disaster Management Committee has activated regional emergency protocols.",
    source: "Bangkok Post",
    timestamp: "2025-02-10T05:00:00Z",
    category: "Environment",
    sentiment: "negative",
    sentimentScore: 0.18,
    credibilityScore: 87,
    bertConfidence: 0.89,
    communityReports: 3,
    location: { city: "Bangkok", district: "Phra Nakhon", state: "Bangkok", country: "Thailand", continent: "Asia", lat: 13.7563, lng: 100.5018 },
    entities: [
      { text: "ASEAN", type: "organization" },
      { text: "Thailand", type: "place" },
      { text: "Vietnam", type: "place" },
      { text: "Philippines", type: "place" },
    ],
    crossSources: [
      { source: "CNN", headline: "Deadly Heat Grips Southeast Asia", agrees: true },
      { source: "Al Jazeera", headline: "SE Asia Heatwave Breaks All Records", agrees: true },
    ],
    aiSummary: "SE Asia heatwave: Thailand hits 46.1°C record. Schools go online, outdoor work banned. 300% spike in heat hospitalizations. El Niño + climate change blamed.",
  },
  {
    id: "16",
    headline: "Argentina's Economy Shows Signs of Recovery",
    summary: "Argentina posts first positive GDP growth in four quarters as economic reforms begin to take effect.",
    fullText: "Argentina's economy grew by 1.2% in Q4 2024, marking the first positive quarterly growth in over a year. The National Statistics Institute (INDEC) reported that agricultural exports, driven by a record soybean harvest, and a recovering tech sector led the rebound. Inflation, while still high at 8% monthly, has decelerated from a peak of 25% monthly in early 2024. Economy Minister Luis Caputo credited the government's fiscal austerity program and deregulation measures. However, poverty rates remain above 40%, and labor unions continue to protest against reduced social spending. The IMF described the results as 'encouraging but fragile.'",
    source: "La Nación",
    timestamp: "2025-02-09T13:00:00Z",
    category: "Business",
    sentiment: "neutral",
    sentimentScore: 0.58,
    credibilityScore: 85,
    bertConfidence: 0.87,
    communityReports: 4,
    location: { city: "Buenos Aires", district: "Microcentro", state: "Buenos Aires", country: "Argentina", continent: "South America", lat: -34.6037, lng: -58.3816 },
    entities: [
      { text: "INDEC", type: "organization" },
      { text: "Luis Caputo", type: "person" },
      { text: "IMF", type: "organization" },
    ],
    crossSources: [
      { source: "Bloomberg", headline: "Argentina GDP Turns Positive", agrees: true },
      { source: "The Economist", headline: "Argentina's Fragile Recovery Begins", agrees: true },
    ],
    aiSummary: "Argentina GDP grows 1.2% in Q4 2024, first positive quarter in a year. Inflation slows but poverty above 40%. IMF calls recovery 'fragile.'",
  },
  {
    id: "17",
    headline: "K-Pop Group BTS Announces Reunion World Tour",
    summary: "BTS confirms a 50-city world tour starting in Seoul, their first group performance since members completed military service.",
    fullText: "Global K-pop sensation BTS has announced 'Beyond: The Return,' a 50-city world tour marking their reunion after all seven members completed South Korea's mandatory military service. The tour kicks off at Seoul's Olympic Stadium on May 15, with dates across Asia, North America, Europe, and Latin America. HYBE Corporation reported that pre-registration for ticket sales exceeded 20 million within the first 24 hours. The announcement caused HYBE's stock price to surge 18% on the Korean Stock Exchange. Group leader RM shared an emotional video message thanking fans for their patience, saying 'ARMY waited for us, and now we're coming home to you.'",
    source: "Korea Herald",
    timestamp: "2025-02-10T02:00:00Z",
    category: "Entertainment",
    sentiment: "positive",
    sentimentScore: 0.96,
    credibilityScore: 92,
    bertConfidence: 0.95,
    communityReports: 0,
    location: { city: "Seoul", district: "Songpa", state: "Seoul", country: "South Korea", continent: "Asia", lat: 37.5665, lng: 126.978 },
    entities: [
      { text: "BTS", type: "organization" },
      { text: "HYBE Corporation", type: "organization" },
      { text: "RM", type: "person" },
      { text: "Seoul", type: "place" },
    ],
    crossSources: [
      { source: "Billboard", headline: "BTS World Tour Announced", agrees: true },
      { source: "Variety", headline: "BTS Reunion Tour Pre-Registration Breaks Records", agrees: true },
    ],
    aiSummary: "BTS announces 50-city 'Beyond: The Return' world tour post-military service. 20M pre-registrations in 24 hours. HYBE stock surges 18%.",
  },
  {
    id: "18",
    headline: "Canada Launches Universal Basic Income Pilot in Ontario",
    summary: "Ontario begins three-year UBI pilot providing $2,000/month to 10,000 randomly selected residents across five cities.",
    fullText: "The Canadian province of Ontario has launched the largest Universal Basic Income pilot in North American history, providing $2,000 CAD monthly to 10,000 randomly selected residents across Toronto, Ottawa, Hamilton, Thunder Bay, and Lindsay. The three-year program, funded by a combination of federal and provincial budgets totaling $720 million, aims to study the impact of unconditional cash transfers on employment, health outcomes, and social mobility. Finance Minister Peter Bethlenfalvy said the pilot will provide 'definitive Canadian data' on UBI's viability. Participants were selected through a lottery system from 450,000 applicants. Economists from the University of Toronto and McGill University will evaluate results.",
    source: "Globe and Mail",
    timestamp: "2025-02-08T12:30:00Z",
    category: "Politics",
    sentiment: "neutral",
    sentimentScore: 0.55,
    credibilityScore: 90,
    bertConfidence: 0.91,
    communityReports: 8,
    location: { city: "Toronto", district: "Downtown", state: "Ontario", country: "Canada", continent: "North America", lat: 43.6532, lng: -79.3832 },
    entities: [
      { text: "Peter Bethlenfalvy", type: "person" },
      { text: "University of Toronto", type: "organization" },
      { text: "McGill University", type: "organization" },
      { text: "Ontario", type: "place" },
    ],
    crossSources: [
      { source: "CBC News", headline: "Ontario UBI Pilot Begins", agrees: true },
      { source: "Financial Post", headline: "Canada's $720M Basic Income Experiment", agrees: true },
    ],
    aiSummary: "Ontario launches $720M UBI pilot: $2K/month to 10K residents across 5 cities for 3 years. Selected from 450K applicants. U of T and McGill evaluating.",
  },
  {
    id: "19",
    headline: "Earthquake Strikes Southern Turkey, Magnitude 5.8",
    summary: "A moderate earthquake near Antalya causes structural damage to older buildings; no casualties reported so far.",
    fullText: "A magnitude 5.8 earthquake struck the Antalya province in southern Turkey at 3:42 AM local time, with the epicenter located 15 kilometers northeast of the coastal resort city. The quake, at a depth of 12 kilometers, was felt across a wide area including Cyprus and parts of Syria. Turkey's Disaster and Emergency Management Authority (AFAD) reported structural damage to 45 older buildings, with 12 partial collapses. Remarkably, no fatalities have been reported, though 23 people received hospital treatment for minor injuries. The relatively low casualty count has been attributed to the early morning timing and improved building codes implemented after the devastating 2023 earthquakes.",
    source: "Anadolu Agency",
    timestamp: "2025-02-10T01:42:00Z",
    category: "Environment",
    sentiment: "negative",
    sentimentScore: 0.28,
    credibilityScore: 91,
    bertConfidence: 0.94,
    communityReports: 2,
    location: { city: "Antalya", district: "Muratpaşa", state: "Antalya Province", country: "Turkey", continent: "Asia", lat: 36.8969, lng: 30.7133 },
    entities: [
      { text: "AFAD", type: "organization" },
      { text: "Antalya", type: "place" },
      { text: "Turkey", type: "place" },
    ],
    crossSources: [
      { source: "USGS", headline: "M5.8 Earthquake Near Antalya, Turkey", agrees: true },
      { source: "Reuters", headline: "Turkey Earthquake Causes Damage, No Deaths", agrees: true },
    ],
    aiSummary: "M5.8 earthquake hits Antalya, Turkey. 45 buildings damaged, 12 partial collapses. No fatalities, 23 minor injuries. Improved building codes credited.",
  },
  {
    id: "20",
    headline: "Nigerian Fintech Startup Raises $200M Series C",
    summary: "Lagos-based Paystack rival Moniepoint secures $200M funding round, valued at $2B, to expand across Africa.",
    fullText: "Nigerian fintech company Moniepoint has raised $200 million in a Series C funding round led by Google's Africa Investment Fund, with participation from Tiger Global and the International Finance Corporation (IFC). The round values the Lagos-based company at $2 billion, making it one of Africa's most valuable startups. Moniepoint processes over $15 billion in annual transaction volume and serves 600,000 businesses across Nigeria, Ghana, and Kenya. CEO Tosin Eniolorunda announced plans to expand to 10 additional African markets by 2026 and launch a digital banking product targeting SMEs. The raise reflects growing global investor confidence in Africa's fintech sector, which attracted $3.2 billion in venture capital in 2024.",
    source: "TechCrunch",
    timestamp: "2025-02-09T07:00:00Z",
    category: "Business",
    sentiment: "positive",
    sentimentScore: 0.82,
    credibilityScore: 93,
    bertConfidence: 0.92,
    communityReports: 1,
    location: { city: "Lagos", district: "Victoria Island", state: "Lagos State", country: "Nigeria", continent: "Africa", lat: 6.5244, lng: 3.3792 },
    entities: [
      { text: "Moniepoint", type: "organization" },
      { text: "Tosin Eniolorunda", type: "person" },
      { text: "Google", type: "organization" },
      { text: "Tiger Global", type: "organization" },
      { text: "IFC", type: "organization" },
    ],
    crossSources: [
      { source: "Bloomberg", headline: "Moniepoint Hits $2B Valuation", agrees: true },
      { source: "Financial Times", headline: "African Fintech Boom Continues with Moniepoint Raise", agrees: true },
    ],
    aiSummary: "Lagos fintech Moniepoint raises $200M Series C at $2B valuation. Processes $15B annually for 600K businesses. Expanding to 10 more African markets.",
  },
];

// Helper to get unique locations for globe markers
export interface GlobeMarker {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  continent: string;
  sentiment: Sentiment;
  sentimentScore: number;
  articleCount: number;
  topArticle: NewsArticle;
}

export function getGlobeMarkers(articles: NewsArticle[] = mockArticles): GlobeMarker[] {
  const locationMap = new Map<string, NewsArticle[]>();
  articles.forEach(article => {
    const key = `${article.location.lat},${article.location.lng}`;
    if (!locationMap.has(key)) locationMap.set(key, []);
    locationMap.get(key)!.push(article);
  });

  return Array.from(locationMap.entries()).map(([, arts]) => {
    const top = arts.sort((a, b) => b.sentimentScore - a.sentimentScore)[0];
    const avgSentiment = arts.reduce((s, a) => s + a.sentimentScore, 0) / arts.length;
    const sentiment: Sentiment = avgSentiment > 0.6 ? "positive" : avgSentiment < 0.4 ? "negative" : "neutral";
    return {
      id: top.id,
      lat: top.location.lat,
      lng: top.location.lng,
      city: top.location.city,
      country: top.location.country,
      continent: top.location.continent,
      sentiment,
      sentimentScore: avgSentiment,
      articleCount: arts.length,
      topArticle: top,
    };
  });
}

export function getArticlesByLocation(lat: number, lng: number): NewsArticle[] {
  return mockArticles.filter(a => a.location.lat === lat && a.location.lng === lng);
}

export function getArticleById(id: string): NewsArticle | undefined {
  return mockArticles.find(a => a.id === id);
}

export function getArticlesByCategory(category: Category): NewsArticle[] {
  return mockArticles.filter(a => a.category === category);
}

export const categories: Category[] = ["Politics", "Technology", "Sports", "Health", "Science", "Business", "Entertainment", "Environment"];

export function getGeographicLevels(article: NewsArticle) {
  const levels = [
    { level: "City", name: article.location.city },
    { level: "District", name: article.location.district },
    { level: "State", name: article.location.state },
    { level: "Country", name: article.location.country },
    { level: "Continent", name: article.location.continent },
    { level: "World", name: "Global" },
  ];

  return levels.map(l => {
    let articles: NewsArticle[];
    switch (l.level) {
      case "City": articles = mockArticles.filter(a => a.location.city === article.location.city); break;
      case "District": articles = mockArticles.filter(a => a.location.district === article.location.district); break;
      case "State": articles = mockArticles.filter(a => a.location.state === article.location.state); break;
      case "Country": articles = mockArticles.filter(a => a.location.country === article.location.country); break;
      case "Continent": articles = mockArticles.filter(a => a.location.continent === article.location.continent); break;
      case "World": articles = [...mockArticles]; break;
      default: articles = [];
    }
    return { ...l, articles: articles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), topArticle: articles[0] };
  });
}
