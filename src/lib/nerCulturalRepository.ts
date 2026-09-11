// ===========================================================================
// Memory Bond — North Eastern Region (NER) Cultural Content Repository
// Culturally Familiar Objects, Themes, Instruments & Regional Memories
// SIH 2026 — SIH26003 (Elderly Cognitive Care in North Eastern Region)
// ===========================================================================

export type NERState =
  | "all"
  | "Assam"
  | "Meghalaya"
  | "Nagaland"
  | "Mizoram"
  | "Manipur"
  | "Arunachal Pradesh"
  | "Tripura"
  | "Sikkim";

export interface CulturalItemDetail {
  id: string;
  state: NERState;
  category: "object" | "theme" | "music" | "nature" | "attire" | "craft";
  name: string;
  nativeName?: string;
  icon: string;
  pairTarget?: { name: string; icon: string }; // For MatchTheObject game
  audioCueText?: string;
  description: string;
  reminiscenceStory: string;
}

export const NER_STATES: Array<{ id: NERState; label: string; native: string }> = [
  { id: "all", label: "All North East States", native: "সমগ্ৰ উত্তৰ-পূৰ্বাঞ্চল" },
  { id: "Assam", label: "Assam", native: "অসম" },
  { id: "Meghalaya", label: "Meghalaya", native: "মেঘালয়" },
  { id: "Nagaland", label: "Nagaland", native: "নাগালেণ্ড" },
  { id: "Mizoram", label: "Mizoram", native: "মিজোৰাম" },
  { id: "Manipur", label: "Manipur", native: "মণিপুৰ" },
  { id: "Arunachal Pradesh", label: "Arunachal Pradesh", native: "অৰুণাচল প্ৰদেশ" },
  { id: "Tripura", label: "Tripura", native: "ত্ৰিপুৰা" },
  { id: "Sikkim", label: "Sikkim", native: "ছিকিম" },
];

export const NER_CULTURAL_CATALOG: CulturalItemDetail[] = [
  // --- ASSAM ---
  {
    id: "gamosa",
    state: "Assam",
    category: "attire",
    name: "Phulam Gamosa",
    nativeName: "ফুলাম গামোচা",
    icon: "🧣",
    pairTarget: { name: "Handloom (Taat Xal)", icon: "🧵" },
    audioCueText: "Listen to the gentle rhythmic sound of the Assamese handloom weaving red flowers onto white cotton.",
    description: "Sacred white woven cotton scarf with delicate red floral motifs, given with reverence to elders.",
    reminiscenceStory: "Remembering Rongali Bihu mornings when children touch elders' feet and present fresh handwoven Phulam Gamosa.",
  },
  {
    id: "jaapi",
    state: "Assam",
    category: "craft",
    name: "Assam Jaapi",
    nativeName: "জাপি",
    icon: "👒",
    pairTarget: { name: "Tokou Palm Leaves", icon: "🌴" },
    audioCueText: "The gentle rustle of Tokou palm leaves dried under the autumn sun to make traditional Jaapi.",
    description: "Conical sun and rain hat hand-crafted from tight cane, bamboo, and Tokou leaves.",
    reminiscenceStory: "Farmers working peacefully in golden paddy fields sheltered by cooling bamboo Jaapis.",
  },
  {
    id: "assam_tea",
    state: "Assam",
    category: "nature",
    name: "Orthodox Tea Leaves",
    nativeName: "অসম চাহ",
    icon: "☕",
    pairTarget: { name: "Clay Kulhar / Cup", icon: "🍵" },
    audioCueText: "The gentle simmering of fresh Assam black tea with warm ginger and cardamoms on a winter morning.",
    description: "World-renowned rich malty black tea picked from the lush misty gardens along the Brahmaputra valley.",
    reminiscenceStory: "The fragrant steam rising from morning red chai shared on the veranda with family.",
  },
  {
    id: "kaji_nemu",
    state: "Assam",
    category: "nature",
    name: "Kaji Nemu (Assam Lemon)",
    nativeName: "কাজী নেমু",
    icon: "🍋",
    pairTarget: { name: "Steamed Rice & Masor Tenga", icon: "🍲" },
    audioCueText: "The uplifting fresh citrus fragrance of sliced Kaji Nemu squeezed over hot rice.",
    description: "Fragrant, elongated GI-tagged lemon with thin rind, renowned for refreshing traditional thalis.",
    reminiscenceStory: "A hot summer lunch of masor tenga with freshly picked kaji nemu and fresh mint.",
  },
  {
    id: "pepa_dhol",
    state: "Assam",
    category: "music",
    name: "Bihu Pepa",
    nativeName: "পেঁপা",
    icon: "🎺",
    pairTarget: { name: "Bihu Dhol Drum", icon: "🥁" },
    audioCueText: "The high-spirited call of the buffalo horn Pepa welcoming the springtime Rongali Bihu.",
    description: "Indigenous wind instrument carved from buffalo horn, playing vibrant melodies of spring.",
    reminiscenceStory: "Hearing the exhilarating rhythm of Dhol and Pepa echoing across green riverbanks.",
  },
  {
    id: "xorai",
    state: "Assam",
    category: "craft",
    name: "Bell-Metal Xorai",
    nativeName: "শৰাই",
    icon: "🪔",
    pairTarget: { name: "Tamul & Paan Leaves", icon: "🍃" },
    audioCueText: "The resonant chiming bell metal crafted with devotion by Sarthebari artisans.",
    description: "Elegant bell-metal offering tray on a stand, covered with Gamosa for welcoming esteemed guests.",
    reminiscenceStory: "Offering betel nut (tamul-paan) on a glistening bronze Xorai at the family prayer room.",
  },

  // --- MEGHALAYA ---
  {
    id: "root_bridge",
    state: "Meghalaya",
    category: "nature",
    name: "Living Root Bridge",
    nativeName: "Jingkieng Jri",
    icon: "🌿",
    pairTarget: { name: "Rainforest Stream", icon: "🏞️" },
    audioCueText: "Listen to the tranquil waterfall and monsoon mist over the ancient Khasi living root bridges.",
    description: "Ancient bio-engineering marvel hand-guided from living Ficus elastica tree roots over gushing rivers.",
    reminiscenceStory: "Crossing the sacred forest streams surrounded by gentle monsoon rain and wild orchids.",
  },
  {
    id: "khasi_basket",
    state: "Meghalaya",
    category: "craft",
    name: "Khasi Conical Basket (Khoh)",
    nativeName: "Khoh",
    icon: "🧺",
    pairTarget: { name: "Cane Headstrap (Star)", icon: "🎒" },
    audioCueText: "The soft squeak of woven cane baskets carried up the hill trails laden with fresh oranges.",
    description: "Distinctive conical bamboo basket carried with a woven strap across the forehead.",
    reminiscenceStory: "Market days in Cherrapunji with baskets brimming with golden wild honey and mountain oranges.",
  },

  // --- NAGALAND ---
  {
    id: "hornbill",
    state: "Nagaland",
    category: "nature",
    name: "Great Hornbill Feather",
    nativeName: "Hornbill",
    icon: "🪶",
    pairTarget: { name: "Warrior Headgear", icon: "👑" },
    audioCueText: "The powerful whoosh of the Hornbill's wings gliding over misty Naga hills.",
    description: "Majestic forest bird celebrated as a revered tribal symbol of grace, loyalty, and bravery.",
    reminiscenceStory: "Gathering by the communal hearth during winter festivals, listening to folktales of valor.",
  },
  {
    id: "log_drum",
    state: "Nagaland",
    category: "music",
    name: "Naga Log Drum",
    nativeName: "Log Drum",
    icon: "🪵",
    pairTarget: { name: "Wooden Beaters", icon: "🥢" },
    audioCueText: "The deep, thunderous pulse of the community log drum echoing across mountain valleys.",
    description: "Massive ceremonial hollowed log drum carved from a single hardwood tree trunk.",
    reminiscenceStory: "The synchronized beat of village youth playing the log drum to celebrate bountiful harvests.",
  },

  // --- MIZORAM ---
  {
    id: "cheraw_bamboo",
    state: "Mizoram",
    category: "music",
    name: "Cheraw Bamboo Staves",
    nativeName: "Cheraw Lam",
    icon: "🎋",
    pairTarget: { name: "Puan Colorful Skirt", icon: "👗" },
    audioCueText: "The rhythmic clacking of smooth bamboo poles tapping together in tempo.",
    description: "Horizontal bamboo poles tapped rhythmically on the ground while dancers step in and out with agility.",
    reminiscenceStory: "Spring festival of Chapchar Kut filled with laughter, songs, and colorful traditional Puan skirts.",
  },

  // --- MANIPUR ---
  {
    id: "loktak_lake",
    state: "Manipur",
    category: "nature",
    name: "Floating Phumdi Island",
    nativeName: "Loktak Pat",
    icon: "🌊",
    pairTarget: { name: "Sangai Dancing Deer", icon: "🦌" },
    audioCueText: "The gentle lapping of clear water against traditional wooden dugout canoes on Loktak Lake.",
    description: "Unique floating biomass islands supporting rare dancing deer and calm lakeside villages.",
    reminiscenceStory: "Morning sunrise over the calm lake with blooming pink water lilies and drifting fishermen.",
  },

  // --- ARUNACHAL PRADESH ---
  {
    id: "apatani_bamboo",
    state: "Arunachal Pradesh",
    category: "craft",
    name: "Ziro Bamboo Groves",
    nativeName: "Apatani Bamboo",
    icon: "🎍",
    pairTarget: { name: "Wet Rice Terrace", icon: "🌾" },
    audioCueText: "The soothing whisper of pine and bamboo groves swaying in the cool breeze of Ziro valley.",
    description: "Sustainable bamboo groves and terraced fish-paddy cultivation created with ancestral harmony.",
    reminiscenceStory: "Walking along emerald green terraced valleys with fresh mountain air and wooden houses.",
  },

  // --- TRIPURA ---
  {
    id: "tripura_cane",
    state: "Tripura",
    category: "craft",
    name: "Tripura Cane Lantern",
    nativeName: "বেতের বাতি",
    icon: "🏮",
    pairTarget: { name: "Fine Bamboo Splints", icon: "🎋" },
    audioCueText: "The rhythmic slicing of fresh green bamboo splints by skilled craftspeople.",
    description: "Delicate cane lamps and screens woven with geometric elegance by indigenous artisans.",
    reminiscenceStory: "Warm evening lamplight glowing through woven bamboo screens at festive gatherings.",
  },

  // --- SIKKIM ---
  {
    id: "prayer_wheel",
    state: "Sikkim",
    category: "craft",
    name: "Himalayan Prayer Wheel",
    nativeName: "Mani Wheel",
    icon: "☸️",
    pairTarget: { name: "Sacred Chants & Bell", icon: "🔔" },
    audioCueText: "The gentle rotating whirr and soft bell chime of the brass prayer wheel spinning clockwise.",
    description: "Spinning bronze prayer wheel engraved with peaceful mantras for compassion and mindfulness.",
    reminiscenceStory: "Early morning walks around the quiet monastery with views of snow-capped Kanchenjunga.",
  },
];

/**
 * Filter items by state or return all North East items
 */
export function getCulturalItemsByState(state: NERState = "all"): CulturalItemDetail[] {
  if (state === "all") return NER_CULTURAL_CATALOG;
  const filtered = NER_CULTURAL_CATALOG.filter((item) => item.state === state);
  return filtered.length > 0 ? filtered : NER_CULTURAL_CATALOG;
}

/**
 * Get items adapted for specific cognitive games (MemoryCardMatch, ObjectRecall, MatchTheObject, etc.)
 */
export function getCulturalGamePack(state: NERState = "all", count = 6) {
  const pool = getCulturalItemsByState(state);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(pool.length, count));
}

export function getCulturalCardsForMemoryMatch(state: NERState = "all", pairCount = 4): Array<{ icon: string; name: string }> {
  const pack = getCulturalGamePack(state, Math.max(pairCount, 8));
  return pack.slice(0, pairCount).map((item) => ({
    icon: item.icon,
    name: item.name,
  }));
}

export function getCulturalObjectsForRecall(state: NERState = "all", count = 6): Array<{ id: string; icon: string; name: string }> {
  const pack = getCulturalGamePack(state, Math.max(count, 12));
  return pack.slice(0, count).map((item) => ({
    id: item.id,
    icon: item.icon,
    name: item.name,
  }));
}

export function getCulturalPairsForMatching(
  state: NERState = "all",
  count = 5
): Array<{ id: string; itemA: { name: string; icon: string }; itemB: { name: string; icon: string } }> {
  const pool = getCulturalItemsByState(state).filter((item) => item.pairTarget);
  const selected = (pool.length >= count ? pool : NER_CULTURAL_CATALOG.filter((i) => i.pairTarget)).slice(0, count);

  return selected.map((item) => ({
    id: item.id,
    itemA: { name: item.name, icon: item.icon },
    itemB: item.pairTarget ? { name: item.pairTarget.name, icon: item.pairTarget.icon } : { name: "Cultural Pair", icon: "✨" },
  }));
}

export function getCulturalWordsForMemory(state: NERState = "all", count = 5): string[] {
  const pool = getCulturalItemsByState(state);
  const words = pool.map((p) => p.nativeName || p.name);
  return words.slice(0, count);
}
