const BRAND = "Bashline";
const TAGLINE = "Independent reporting. A wider view.";
const DEFAULT_PASSCODE = "editor2026";

const CATEGORIES = [
  { id: "world", label: "World" },
  { id: "politics", label: "Politics & Geopolitics" },
  { id: "entertainment", label: "Entertainment" },
  { id: "business", label: "Business" },
  { id: "sports", label: "Sports" },
  { id: "technology", label: "Technology" },
  { id: "health", label: "Health" },
  { id: "opinion", label: "Opinion" },
  { id: "analysis", label: "Analysis" },
  { id: "beyond", label: "Beyond the Headlines" },
  { id: "africa", label: "Africa" },
  { id: "americas", label: "Americas" },
  { id: "asia", label: "Asia" },
  { id: "europe", label: "Europe" },
  { id: "middle-east", label: "Middle East" },
  { id: "oceania", label: "Oceania" },
];

// CITY_COORDS is built below from the full CAPITALS list

const WORLD_CLOCKS = [
  { label: "NEW YORK", tz: "America/New_York" },
  { label: "LONDON", tz: "Europe/London" },
  { label: "DUBAI", tz: "Asia/Dubai" },
  { label: "TOKYO", tz: "Asia/Tokyo" },
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "moments ago";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function img(seed, w = 1200, h = 800) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

const SEED_ARTICLES = [
  {
    id: "a1", title: "Regional Blocs Resume Trade Talks as Tariff Deadline Looms",
    dek: "Negotiators from three continents return to the table this week, with agricultural tariffs and digital-services rules the last unresolved sticking points.",
    category: "politics", author: "M. Okafor", dateline: "Brussels",
    date: "2026-07-13T09:00:00Z", image: img("tradetalks"),
    breaking: true, trending: true, featured: true, type: "news",
    body: [
      "Trade envoys reconvened in Brussels on Monday for a fourth round of talks aimed at averting a tariff snapback that would hit an estimated $80 billion in annual cross-border trade.",
      "The talks, which stalled in the spring over disagreements on data-localization rules, have taken on new urgency as a self-imposed August deadline approaches. Officials on both sides described the mood as 'cautiously constructive' but declined to characterize a deal as imminent.",
      "At the center of the dispute is a proposed carve-out for agricultural subsidies, which one bloc argues distorts competition and the other frames as essential food-security policy. A senior negotiator said a compromise text is circulating but has not been formally tabled.",
      "Analysts note that failure to reach an agreement would not trigger an immediate tariff increase, but would restart a 90-day countdown clause written into the expiring framework. Markets have so far shown limited reaction, though currency traders are watching the talks closely.",
      "A further session is expected before the end of the month, with mid-level technical staff continuing work on the text in the interim."
    ]
  },
  {
    id: "a2", title: "Ceasefire Monitors Report Reduced Shelling Along Contact Line",
    dek: "International observers say artillery exchanges have dropped by roughly a third over the past ten days, though both sides dispute the underlying cause.",
    category: "world", author: "T. Ivanenko", dateline: "Kyiv",
    date: "2026-07-12T14:20:00Z", image: img("frontline"),
    breaking: false, trending: true, featured: false, type: "news",
    body: [
      "Monitors stationed along the contact line reported a marked decline in artillery activity over the past ten days, according to a summary released Sunday.",
      "The reduction has not been formally attributed to any agreement, and officials from both sides offered competing explanations, ranging from weather disruption to a deliberate operational pause.",
      "Humanitarian groups operating in the region cautioned against reading too much into the lull, noting that similar quiet periods in the past have preceded renewed offensives rather than de-escalation.",
      "Diplomats say back-channel discussions continue, though no formal talks have been scheduled."
    ]
  },
  {
    id: "a3", title: "Central Bank Holds Rates, Signals Data-Dependent Path Ahead",
    dek: "Policymakers kept the benchmark rate unchanged for a third straight meeting, citing sticky services inflation and a resilient labor market.",
    category: "world", author: "R. Chen", dateline: "Washington, D.C.",
    date: "2026-07-11T18:00:00Z", image: img("centralbank"),
    breaking: false, trending: false, featured: false, type: "news",
    body: [
      "The central bank left its benchmark interest rate unchanged Wednesday, extending a pause that began in the spring as officials weigh persistent services inflation against signs of cooling in goods prices.",
      "In prepared remarks, the chair described the current stance as 'appropriately restrictive' while declining to rule out further action later in the year.",
      "Futures markets modestly trimmed expectations for a rate cut before year-end, pushing implied odds below 40 percent.",
      "The decision was not unanimous; two committee members reportedly favored a quarter-point cut, according to people familiar with the discussion."
    ]
  },
  {
    id: "a4", title: "Coalition Government Survives Confidence Vote by Narrow Margin",
    dek: "A minority coalition cleared its first major parliamentary test, but the seven-vote margin exposes fragile footing ahead of a contentious budget debate.",
    category: "politics", author: "H. Larsen", dateline: "London",
    date: "2026-07-10T20:15:00Z", image: img("parliament"),
    breaking: false, trending: true, featured: false, type: "news",
    body: [
      "The governing coalition survived a confidence motion Thursday evening by a margin of seven votes, a result that steadies the government in the short term but underscores how thin its working majority has become.",
      "The vote was called by the opposition after weeks of friction over proposed changes to energy subsidies. Several backbenchers from the ruling coalition abstained rather than vote against their own government, a sign of internal strain that officials played down.",
      "Attention now turns to next month's budget vote, widely seen as a tougher test given the scale of proposed spending cuts.",
      "Political analysts say the government's position remains workable but leaves little room for further defections."
    ]
  },
  {
    id: "a5", title: "Chipmakers Warn Export Controls Could Reshape Supply Chains for a Decade",
    dek: "Industry executives say new licensing rules on advanced semiconductor equipment are already prompting firms to duplicate production lines across jurisdictions.",
    category: "analysis", author: "J. Park", dateline: "Tokyo",
    date: "2026-07-09T11:00:00Z", image: img("semiconductors"),
    breaking: false, trending: false, featured: false, type: "analysis",
    body: [
      "Executives across the semiconductor industry say a tightening web of export controls on advanced chipmaking equipment is forcing a level of supply-chain duplication not seen since the industry began globalizing in the 1990s.",
      "Firms that once ran a single advanced fabrication line for a global customer base are now weighing parallel investments to serve markets subject to different licensing regimes — an expensive hedge against a policy environment executives describe as unpredictable.",
      "The shift carries real costs: analysts estimate duplicated capacity could add tens of billions of dollars in capital expenditure industry-wide over the next five years, costs likely to be passed on to consumers of everything from phones to cars.",
      "Some governments are offering subsidies to offset the burden, but the patchwork of incentives is itself becoming a source of friction between allied economies.",
      "The longer-term effect, several executives argued, may be a less efficient but more resilient global chip supply — a trade-off many now consider unavoidable."
    ]
  },
  {
    id: "a6", title: "Water-Sharing Dispute Resurfaces as Drought Grips River Basin",
    dek: "A three-decade-old agreement is under renewed strain as upstream and downstream states clash over falling reservoir levels.",
    category: "world", author: "A. Mensah", dateline: "Nairobi",
    date: "2026-07-08T08:30:00Z", image: img("riverbasin"),
    breaking: false, trending: false, featured: false, type: "news",
    body: [
      "A long-standing water-sharing agreement governing one of the region's major river basins is facing its most serious test in years, as a prolonged drought pushes reservoir levels to their lowest point in three decades.",
      "Downstream farmers say reduced releases from upstream dams threaten this season's harvest, while upstream officials point to their own shrinking hydropower capacity as justification for the cuts.",
      "Regional bodies have called for emergency talks, though previous attempts to revise the allocation formula have taken years to negotiate.",
      "Climate researchers say the basin's rainfall variability is likely to increase, meaning disputes of this kind may become more frequent rather than less."
    ]
  },
  {
    id: "a7", title: "The Quiet Return of Industrial Policy",
    dek: "Governments that spent forty years dismantling subsidies and tariffs are rebuilding them — and calling it something else.",
    category: "beyond", author: "S. Whitfield", dateline: "Washington, D.C.",
    date: "2026-07-07T10:00:00Z", image: img("industrypolicy"),
    breaking: false, trending: false, featured: false, type: "analysis",
    body: [
      "For most of the past two generations, industrial policy was something governments in wealthy democracies mostly disavowed in public even when they practiced it in private. Picking winners was for planned economies; markets, the thinking went, would allocate capital better than ministries could.",
      "That consensus has quietly collapsed. Subsidy programs for semiconductors, batteries, and critical minerals now run into the hundreds of billions of dollars across multiple economies, often justified not in the language of industrial strategy but of national security or supply-chain resilience.",
      "The relabeling matters. Framing subsidies as security measures makes them easier to defend politically and harder to challenge under trade rules built for an earlier era. It also makes them harder to unwind — a security rationale does not expire the way an infant-industry argument eventually should.",
      "What's easy to miss in the daily headlines about individual deals is the cumulative shift: a return to a world where governments treat the location of production, not just its price, as a strategic variable. That is a genuine break from the last four decades, and it will outlast any single administration or election cycle.",
      "The deeper question is not whether this approach works for any one factory or one country, but what happens when every major economy plays the same game at once — a version of industrial policy with no clear equilibrium, only escalation."
    ]
  },
  {
    id: "a8", title: "Why Ceasefires Fail More Often Than They Hold",
    dek: "A look at the pattern behind fragile truces — and what separates the rare ones that stick from the many that don't.",
    category: "beyond", author: "T. Ivanenko", dateline: "Kyiv",
    date: "2026-07-06T09:00:00Z", image: img("ceasefirepattern"),
    breaking: false, trending: false, featured: false, type: "analysis",
    body: [
      "Every ceasefire is announced as if it might be the last one needed. Most are not. Research on armed conflicts since 1990 suggests a majority of ceasefires break down within a year, and a significant share collapse within the first month.",
      "The pattern has less to do with the sincerity of either side and more to do with structure. Ceasefires negotiated without a credible monitoring mechanism, without a political track running alongside the military one, and without a third party willing to impose costs for violations tend to fail at far higher rates than those with all three.",
      "This is worth remembering every time a truce is announced to relief and cautious celebration: the announcement is the easy part. What determines whether it holds is usually decided in the unglamorous details that rarely make headlines — verification protocols, prisoner exchange mechanics, and who exactly answers for the first violation.",
      "None of this means ceasefires are not worth pursuing. It means the right question, on the day one is announced, is rarely 'will it hold' in the abstract, but 'does this one have the scaffolding that history suggests it needs.'"
    ]
  },
  {
    id: "a9", title: "The Migration Numbers Nobody Is Debating — Because Nobody Agrees on Them",
    dek: "Three governments, three wildly different estimates of the same border crossings. The discrepancy is itself the story.",
    category: "opinion", author: "S. Whitfield", dateline: "Brussels",
    date: "2026-07-05T12:00:00Z", image: img("migrationdata"),
    breaking: false, trending: false, featured: false, type: "opinion",
    body: [
      "Ask three governments how many people crossed a shared border last month and you will, with some regularity, get three different answers — not off by a rounding error, but by a factor of two or more. This is not usually fraud. It is method: one country counts entries, another counts unique individuals, a third counts only those who file a claim.",
      "I've spent enough time comparing these figures to conclude that the disagreement itself is more informative than any single number. A government that counts generously is usually building a case for more resources. One that counts conservatively is usually managing a domestic political narrative. Neither is lying, exactly, but neither is neutral either.",
      "My own view, for what it's worth, is that the public debate would be healthier if commentators spent less energy citing whichever number flatters their argument and more energy asking which counting method produced it. The politics of migration are contentious enough without also fighting over arithmetic that a shared methodology could resolve in an afternoon.",
      "This is a solvable problem. That it remains unsolved after years of political attention tells you something about how useful the ambiguity is to everyone involved."
    ]
  },
  {
    id: "a10", title: "Opinion: The Summit Communiqué Nobody Will Read Still Matters",
    dek: "Diplomatic language is often mocked as empty. It isn't. The wording is frequently the entire negotiation.",
    category: "opinion", author: "M. Okafor", dateline: "Brussels",
    date: "2026-07-04T15:00:00Z", image: img("communique"),
    breaking: false, trending: false, featured: false, type: "opinion",
    body: [
      "Summit communiqués are easy to mock: pages of hedged, passive-voice language that most readers, reasonably, skip entirely. I used to skip them too, until I sat through enough closed-door drafting sessions to understand that the hedging is not a failure of the process. It is the process.",
      "A single verb — 'urges' versus 'calls on,' 'notes' versus 'welcomes' — can be the product of six hours of argument between delegations that agree on almost nothing else. The document that results is deliberately boring because boring is what consensus among rivals looks like on paper.",
      "I'd argue the right way to read a communiqué is not as a statement of intent but as a snapshot of exactly how much disagreement a group of governments were willing to paper over in public. Read that way, the document that seems to say nothing is often the most honest account of the summit that exists.",
      "None of this is an argument that communiqués deserve more front-page attention. It's an argument for taking them more seriously exactly where they currently get the least: in the fine print, where the actual negotiation lives."
    ]
  }
];

const CAPITALS = [
  { city: "Algiers", country: "Algeria", coords: "36.8°N 3.1°E" },
  { city: "Luanda", country: "Angola", coords: "8.8°S 13.2°E" },
  { city: "Porto-Novo", country: "Benin", coords: "6.5°N 2.6°E" },
  { city: "Gaborone", country: "Botswana", coords: "24.7°S 25.9°E" },
  { city: "Ouagadougou", country: "Burkina Faso", coords: "12.4°N 1.5°W" },
  { city: "Gitega", country: "Burundi", coords: "3.4°S 29.9°E" },
  { city: "Praia", country: "Cabo Verde", coords: "14.9°N 23.5°W" },
  { city: "Yaoundé", country: "Cameroon", coords: "3.9°N 11.5°E" },
  { city: "Bangui", country: "Central African Republic", coords: "4.4°N 18.6°E" },
  { city: "N'Djamena", country: "Chad", coords: "12.1°N 15.0°E" },
  { city: "Moroni", country: "Comoros", coords: "11.7°S 43.3°E" },
  { city: "Brazzaville", country: "Congo", coords: "4.3°S 15.3°E" },
  { city: "Kinshasa", country: "DR Congo", coords: "4.3°S 15.3°E" },
  { city: "Djibouti City", country: "Djibouti", coords: "11.6°N 43.1°E" },
  { city: "Cairo", country: "Egypt", coords: "30.0°N 31.2°E" },
  { city: "Malabo", country: "Equatorial Guinea", coords: "3.8°N 8.8°E" },
  { city: "Asmara", country: "Eritrea", coords: "15.3°N 38.9°E" },
  { city: "Mbabane", country: "Eswatini", coords: "26.3°S 31.1°E" },
  { city: "Addis Ababa", country: "Ethiopia", coords: "9.0°N 38.7°E" },
  { city: "Libreville", country: "Gabon", coords: "0.4°N 9.5°E" },
  { city: "Banjul", country: "Gambia", coords: "13.5°N 16.6°W" },
  { city: "Accra", country: "Ghana", coords: "5.6°N 0.2°W" },
  { city: "Conakry", country: "Guinea", coords: "9.5°N 13.7°W" },
  { city: "Bissau", country: "Guinea-Bissau", coords: "11.9°N 15.6°W" },
  { city: "Yamoussoukro", country: "Ivory Coast", coords: "6.8°N 5.3°W" },
  { city: "Nairobi", country: "Kenya", coords: "1.3°S 36.8°E" },
  { city: "Maseru", country: "Lesotho", coords: "29.3°S 27.5°E" },
  { city: "Monrovia", country: "Liberia", coords: "6.3°N 10.8°W" },
  { city: "Tripoli", country: "Libya", coords: "32.9°N 13.2°E" },
  { city: "Antananarivo", country: "Madagascar", coords: "18.9°S 47.5°E" },
  { city: "Lilongwe", country: "Malawi", coords: "13.9°S 33.8°E" },
  { city: "Bamako", country: "Mali", coords: "12.6°N 8.0°W" },
  { city: "Nouakchott", country: "Mauritania", coords: "18.1°N 15.9°W" },
  { city: "Port Louis", country: "Mauritius", coords: "20.2°S 57.5°E" },
  { city: "Rabat", country: "Morocco", coords: "34.0°N 6.8°W" },
  { city: "Maputo", country: "Mozambique", coords: "25.9°S 32.6°E" },
  { city: "Windhoek", country: "Namibia", coords: "22.6°S 17.1°E" },
  { city: "Niamey", country: "Niger", coords: "13.5°N 2.1°E" },
  { city: "Abuja", country: "Nigeria", coords: "9.1°N 7.4°E" },
  { city: "Kigali", country: "Rwanda", coords: "1.9°S 30.1°E" },
  { city: "São Tomé", country: "São Tomé and Príncipe", coords: "0.3°N 6.7°E" },
  { city: "Dakar", country: "Senegal", coords: "14.7°N 17.4°W" },
  { city: "Victoria", country: "Seychelles", coords: "4.6°S 55.5°E" },
  { city: "Freetown", country: "Sierra Leone", coords: "8.5°N 13.2°W" },
  { city: "Mogadishu", country: "Somalia", coords: "2.0°N 45.3°E" },
  { city: "Pretoria", country: "South Africa", coords: "25.7°S 28.2°E" },
  { city: "Juba", country: "South Sudan", coords: "4.9°N 31.6°E" },
  { city: "Khartoum", country: "Sudan", coords: "15.6°N 32.5°E" },
  { city: "Dodoma", country: "Tanzania", coords: "6.2°S 35.7°E" },
  { city: "Lomé", country: "Togo", coords: "6.1°N 1.2°E" },
  { city: "Tunis", country: "Tunisia", coords: "36.8°N 10.2°E" },
  { city: "Kampala", country: "Uganda", coords: "0.3°N 32.6°E" },
  { city: "Lusaka", country: "Zambia", coords: "15.4°S 28.3°E" },
  { city: "Harare", country: "Zimbabwe", coords: "17.8°S 31.0°E" },

  { city: "St. John's", country: "Antigua and Barbuda", coords: "17.1°N 61.8°W" },
  { city: "Buenos Aires", country: "Argentina", coords: "34.6°S 58.4°W" },
  { city: "Nassau", country: "Bahamas", coords: "25.0°N 77.3°W" },
  { city: "Bridgetown", country: "Barbados", coords: "13.1°N 59.6°W" },
  { city: "Belmopan", country: "Belize", coords: "17.3°N 88.8°W" },
  { city: "Sucre", country: "Bolivia", coords: "19.0°S 65.3°W" },
  { city: "Brasília", country: "Brazil", coords: "15.8°S 47.9°W" },
  { city: "São Paulo", country: "Brazil", coords: "23.6°S 46.6°W" },
  { city: "Ottawa", country: "Canada", coords: "45.4°N 75.7°W" },
  { city: "Santiago", country: "Chile", coords: "33.4°S 70.6°W" },
  { city: "Bogotá", country: "Colombia", coords: "4.7°N 74.1°W" },
  { city: "San José", country: "Costa Rica", coords: "9.9°N 84.1°W" },
  { city: "Havana", country: "Cuba", coords: "23.1°N 82.4°W" },
  { city: "Roseau", country: "Dominica", coords: "15.3°N 61.4°W" },
  { city: "Santo Domingo", country: "Dominican Republic", coords: "18.5°N 69.9°W" },
  { city: "Quito", country: "Ecuador", coords: "0.2°S 78.5°W" },
  { city: "San Salvador", country: "El Salvador", coords: "13.7°N 89.2°W" },
  { city: "St. George's", country: "Grenada", coords: "12.1°N 61.7°W" },
  { city: "Guatemala City", country: "Guatemala", coords: "14.6°N 90.5°W" },
  { city: "Georgetown", country: "Guyana", coords: "6.8°N 58.2°W" },
  { city: "Port-au-Prince", country: "Haiti", coords: "18.6°N 72.3°W" },
  { city: "Tegucigalpa", country: "Honduras", coords: "14.1°N 87.2°W" },
  { city: "Kingston", country: "Jamaica", coords: "18.0°N 76.8°W" },
  { city: "Mexico City", country: "Mexico", coords: "19.4°N 99.1°W" },
  { city: "Managua", country: "Nicaragua", coords: "12.1°N 86.3°W" },
  { city: "Panama City", country: "Panama", coords: "9.0°N 79.5°W" },
  { city: "Asunción", country: "Paraguay", coords: "25.3°S 57.6°W" },
  { city: "Lima", country: "Peru", coords: "12.0°S 77.0°W" },
  { city: "Basseterre", country: "Saint Kitts and Nevis", coords: "17.3°N 62.7°W" },
  { city: "Castries", country: "Saint Lucia", coords: "14.0°N 61.0°W" },
  { city: "Kingstown", country: "Saint Vincent and the Grenadines", coords: "13.2°N 61.2°W" },
  { city: "Paramaribo", country: "Suriname", coords: "5.9°N 55.2°W" },
  { city: "Port of Spain", country: "Trinidad and Tobago", coords: "10.7°N 61.5°W" },
  { city: "Washington, D.C.", country: "United States", coords: "38.9°N 77.0°W" },
  { city: "Montevideo", country: "Uruguay", coords: "34.9°S 56.2°W" },
  { city: "Caracas", country: "Venezuela", coords: "10.5°N 66.9°W" },

  { city: "Kabul", country: "Afghanistan", coords: "34.6°N 69.2°E" },
  { city: "Yerevan", country: "Armenia", coords: "40.2°N 44.5°E" },
  { city: "Baku", country: "Azerbaijan", coords: "40.4°N 49.9°E" },
  { city: "Manama", country: "Bahrain", coords: "26.2°N 50.6°E" },
  { city: "Dhaka", country: "Bangladesh", coords: "23.8°N 90.4°E" },
  { city: "Thimphu", country: "Bhutan", coords: "27.5°N 89.6°E" },
  { city: "Bandar Seri Begawan", country: "Brunei", coords: "4.9°N 114.9°E" },
  { city: "Phnom Penh", country: "Cambodia", coords: "11.6°N 104.9°E" },
  { city: "Beijing", country: "China", coords: "39.9°N 116.4°E" },
  { city: "Nicosia", country: "Cyprus", coords: "35.2°N 33.4°E" },
  { city: "Tbilisi", country: "Georgia", coords: "41.7°N 44.8°E" },
  { city: "New Delhi", country: "India", coords: "28.6°N 77.2°E" },
  { city: "Jakarta", country: "Indonesia", coords: "6.2°S 106.8°E" },
  { city: "Tehran", country: "Iran", coords: "35.7°N 51.4°E" },
  { city: "Baghdad", country: "Iraq", coords: "33.3°N 44.4°E" },
  { city: "Jerusalem", country: "Israel", coords: "31.8°N 35.2°E" },
  { city: "Tokyo", country: "Japan", coords: "35.7°N 139.7°E" },
  { city: "Amman", country: "Jordan", coords: "31.9°N 35.9°E" },
  { city: "Astana", country: "Kazakhstan", coords: "51.2°N 71.4°E" },
  { city: "Kuwait City", country: "Kuwait", coords: "29.4°N 48.0°E" },
  { city: "Bishkek", country: "Kyrgyzstan", coords: "42.9°N 74.6°E" },
  { city: "Vientiane", country: "Laos", coords: "17.9°N 102.6°E" },
  { city: "Beirut", country: "Lebanon", coords: "33.9°N 35.5°E" },
  { city: "Kuala Lumpur", country: "Malaysia", coords: "3.1°N 101.7°E" },
  { city: "Malé", country: "Maldives", coords: "4.2°N 73.5°E" },
  { city: "Ulaanbaatar", country: "Mongolia", coords: "47.9°N 106.9°E" },
  { city: "Naypyidaw", country: "Myanmar", coords: "19.7°N 96.1°E" },
  { city: "Kathmandu", country: "Nepal", coords: "27.7°N 85.3°E" },
  { city: "Pyongyang", country: "North Korea", coords: "39.0°N 125.8°E" },
  { city: "Muscat", country: "Oman", coords: "23.6°N 58.5°E" },
  { city: "Islamabad", country: "Pakistan", coords: "33.7°N 73.1°E" },
  { city: "Ramallah", country: "Palestine", coords: "31.9°N 35.2°E" },
  { city: "Manila", country: "Philippines", coords: "14.6°N 121.0°E" },
  { city: "Doha", country: "Qatar", coords: "25.3°N 51.5°E" },
  { city: "Riyadh", country: "Saudi Arabia", coords: "24.7°N 46.7°E" },
  { city: "Singapore", country: "Singapore", coords: "1.35°N 103.8°E" },
  { city: "Seoul", country: "South Korea", coords: "37.6°N 127.0°E" },
  { city: "Colombo", country: "Sri Lanka", coords: "6.9°N 79.9°E" },
  { city: "Damascus", country: "Syria", coords: "33.5°N 36.3°E" },
  { city: "Taipei", country: "Taiwan", coords: "25.0°N 121.6°E" },
  { city: "Dushanbe", country: "Tajikistan", coords: "38.6°N 68.8°E" },
  { city: "Bangkok", country: "Thailand", coords: "13.8°N 100.5°E" },
  { city: "Dili", country: "Timor-Leste", coords: "8.6°S 125.6°E" },
  { city: "Ankara", country: "Turkey", coords: "39.9°N 32.9°E" },
  { city: "Ashgabat", country: "Turkmenistan", coords: "37.9°N 58.4°E" },
  { city: "Abu Dhabi", country: "United Arab Emirates", coords: "24.5°N 54.4°E" },
  { city: "Tashkent", country: "Uzbekistan", coords: "41.3°N 69.2°E" },
  { city: "Hanoi", country: "Vietnam", coords: "21.0°N 105.8°E" },
  { city: "Sana'a", country: "Yemen", coords: "15.4°N 44.2°E" },

  { city: "Tirana", country: "Albania", coords: "41.3°N 19.8°E" },
  { city: "Andorra la Vella", country: "Andorra", coords: "42.5°N 1.5°E" },
  { city: "Vienna", country: "Austria", coords: "48.2°N 16.4°E" },
  { city: "Minsk", country: "Belarus", coords: "53.9°N 27.6°E" },
  { city: "Brussels", country: "Belgium", coords: "50.8°N 4.4°E" },
  { city: "Sarajevo", country: "Bosnia and Herzegovina", coords: "43.9°N 18.4°E" },
  { city: "Sofia", country: "Bulgaria", coords: "42.7°N 23.3°E" },
  { city: "Zagreb", country: "Croatia", coords: "45.8°N 16.0°E" },
  { city: "Prague", country: "Czech Republic", coords: "50.1°N 14.4°E" },
  { city: "Copenhagen", country: "Denmark", coords: "55.7°N 12.6°E" },
  { city: "Tallinn", country: "Estonia", coords: "59.4°N 24.8°E" },
  { city: "Helsinki", country: "Finland", coords: "60.2°N 24.9°E" },
  { city: "Paris", country: "France", coords: "48.9°N 2.4°E" },
  { city: "Berlin", country: "Germany", coords: "52.5°N 13.4°E" },
  { city: "Athens", country: "Greece", coords: "38.0°N 23.7°E" },
  { city: "Budapest", country: "Hungary", coords: "47.5°N 19.0°E" },
  { city: "Reykjavík", country: "Iceland", coords: "64.1°N 21.9°W" },
  { city: "Dublin", country: "Ireland", coords: "53.3°N 6.3°W" },
  { city: "Rome", country: "Italy", coords: "41.9°N 12.5°E" },
  { city: "Pristina", country: "Kosovo", coords: "42.7°N 21.2°E" },
  { city: "Riga", country: "Latvia", coords: "56.9°N 24.1°E" },
  { city: "Vaduz", country: "Liechtenstein", coords: "47.1°N 9.5°E" },
  { city: "Vilnius", country: "Lithuania", coords: "54.7°N 25.3°E" },
  { city: "Luxembourg City", country: "Luxembourg", coords: "49.6°N 6.1°E" },
  { city: "Valletta", country: "Malta", coords: "35.9°N 14.5°E" },
  { city: "Chișinău", country: "Moldova", coords: "47.0°N 28.9°E" },
  { city: "Monaco", country: "Monaco", coords: "43.7°N 7.4°E" },
  { city: "Podgorica", country: "Montenegro", coords: "42.4°N 19.3°E" },
  { city: "Amsterdam", country: "Netherlands", coords: "52.4°N 4.9°E" },
  { city: "Skopje", country: "North Macedonia", coords: "42.0°N 21.4°E" },
  { city: "Oslo", country: "Norway", coords: "59.9°N 10.8°E" },
  { city: "Warsaw", country: "Poland", coords: "52.2°N 21.0°E" },
  { city: "Lisbon", country: "Portugal", coords: "38.7°N 9.1°W" },
  { city: "Bucharest", country: "Romania", coords: "44.4°N 26.1°E" },
  { city: "Moscow", country: "Russia", coords: "55.8°N 37.6°E" },
  { city: "San Marino", country: "San Marino", coords: "43.9°N 12.5°E" },
  { city: "Belgrade", country: "Serbia", coords: "44.8°N 20.5°E" },
  { city: "Bratislava", country: "Slovakia", coords: "48.1°N 17.1°E" },
  { city: "Ljubljana", country: "Slovenia", coords: "46.1°N 14.5°E" },
  { city: "Madrid", country: "Spain", coords: "40.4°N 3.7°W" },
  { city: "Stockholm", country: "Sweden", coords: "59.3°N 18.1°E" },
  { city: "Bern", country: "Switzerland", coords: "46.9°N 7.4°E" },
  { city: "Kyiv", country: "Ukraine", coords: "50.4°N 30.5°E" },
  { city: "London", country: "United Kingdom", coords: "51.5°N 0.1°W" },
  { city: "Vatican City", country: "Vatican City", coords: "41.9°N 12.5°E" },

  { city: "Canberra", country: "Australia", coords: "35.3°S 149.1°E" },
  { city: "Suva", country: "Fiji", coords: "18.1°S 178.4°E" },
  { city: "Tarawa", country: "Kiribati", coords: "1.3°N 172.9°E" },
  { city: "Majuro", country: "Marshall Islands", coords: "7.1°N 171.4°E" },
  { city: "Palikir", country: "Micronesia", coords: "6.9°N 158.2°E" },
  { city: "Yaren", country: "Nauru", coords: "0.5°S 166.9°E" },
  { city: "Wellington", country: "New Zealand", coords: "41.3°S 174.8°E" },
  { city: "Ngerulmud", country: "Palau", coords: "7.5°N 134.6°E" },
  { city: "Port Moresby", country: "Papua New Guinea", coords: "9.5°S 147.2°E" },
  { city: "Apia", country: "Samoa", coords: "13.8°S 171.8°W" },
  { city: "Honiara", country: "Solomon Islands", coords: "9.4°S 159.9°E" },
  { city: "Nuku'alofa", country: "Tonga", coords: "21.1°S 175.2°W" },
  { city: "Funafuti", country: "Tuvalu", coords: "8.5°S 179.2°E" },
  { city: "Port Vila", country: "Vanuatu", coords: "17.7°S 168.3°E" },
];

const CITY_COORDS = {};
CAPITALS.forEach(function (c) { CITY_COORDS[c.city] = c.coords; });
