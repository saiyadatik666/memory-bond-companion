import { useState, useEffect, useRef, useMemo } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Clock, Volume2, Eye, EyeOff, Trophy, Award, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// The Keepsake Memory Tray (स्मृति थाली) — Genuinely Redesigned Cognitive Mechanic
// Kim's Game / Nostalgic Tray Inspection designed specifically for seniors
// 1. Observation Phase: Ornate keepsakes placed on the tray
// 2. Silk Cover Phase: Tray is covered with a soft silk veil
// 3. Mystery Reveal:
//    - Mode A (Levels 1-10): The Missing Keepsake (क्या गायब हुआ?)
//    - Mode B (Levels 11-20): The New Keepsake (कौन सी नई वस्तु आई?)
//    - Mode C (Levels 21-30): The Replaced Keepsake (क्या बदल गया?)
// ============================================================================

export interface KeepsakeItem {
  id: string;
  name: string;
  hindiName: string;
  regionalName?: string;
  icon: string;
  category: string;
  color: string;
  bgLight: string;
}

// 8 Thematic Collections for the 8-Day Refresh Cycle
const KEEPSAKE_CYCLES: Record<number, KeepsakeItem[]> = {
  // Cycle 1: Traditional Everyday Keepsakes
  1: [
    { id: "glasses", name: "Reading Glasses", hindiName: "पढ़ने का चश्मा", icon: "👓", category: "daily", color: "text-indigo-600 dark:text-indigo-400", bgLight: "bg-indigo-50 dark:bg-indigo-950/30" },
    { id: "keys", name: "Brass Gate Keys", hindiName: "पीतल की चाबियां", icon: "🔑", category: "daily", color: "text-amber-600 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "watch", name: "Pocket Watch", hindiName: "जेब घड़ी", icon: "⌚", category: "daily", color: "text-emerald-600 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "pen", name: "Fountain Pen", hindiName: "फाउंटेन पेन", icon: "🖋️", category: "daily", color: "text-blue-600 dark:text-blue-400", bgLight: "bg-blue-50 dark:bg-blue-950/30" },
    { id: "comb", name: "Neem Wooden Comb", hindiName: "नीम की कंघी", icon: "🪮", category: "daily", color: "text-orange-600 dark:text-orange-400", bgLight: "bg-orange-50 dark:bg-orange-950/30" },
    { id: "diary", name: "Family Diary", hindiName: "पुरानी डायरी", icon: "📖", category: "daily", color: "text-rose-600 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/30" },
    { id: "radio", name: "Transistor Radio", hindiName: "रेडियो", icon: "📻", category: "daily", color: "text-teal-600 dark:text-teal-400", bgLight: "bg-teal-50 dark:bg-teal-950/30" },
    { id: "torch", name: "Brass Torch", hindiName: "टॉर्च", icon: "🔦", category: "daily", color: "text-yellow-600 dark:text-yellow-400", bgLight: "bg-yellow-50 dark:bg-yellow-950/30" },
  ],

  // Cycle 2: Puja & Sacred Keepsakes
  2: [
    { id: "diya", name: "Brass Diya", hindiName: "पीतल का दीया", icon: "🪔", category: "puja", color: "text-amber-600 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "bell", name: "Puja Bell", hindiName: "मंदिर की घंटी", icon: "🔔", category: "puja", color: "text-yellow-600 dark:text-yellow-400", bgLight: "bg-yellow-50 dark:bg-yellow-950/30" },
    { id: "shankh", name: "Sacred Conch (Shankh)", hindiName: "पवित्र शंख", icon: "🐚", category: "puja", color: "text-sky-600 dark:text-sky-400", bgLight: "bg-sky-50 dark:bg-sky-950/30" },
    { id: "mala", name: "Tulsi Japa Mala", hindiName: "तुलसी की जप माला", icon: "📿", category: "puja", color: "text-emerald-600 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "book", name: "Holy Geeta", hindiName: "श्रीमद्भगवद्गीता", icon: "📜", category: "puja", color: "text-indigo-600 dark:text-indigo-400", bgLight: "bg-indigo-50 dark:bg-indigo-950/30" },
    { id: "flower", name: "Lotus Flower", hindiName: "कमल का फूल", icon: "🪷", category: "puja", color: "text-rose-600 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/30" },
    { id: "incense", name: "Agarbatti Stand", hindiName: "अगरबत्ती स्टैंड", icon: "🪞", category: "puja", color: "text-purple-600 dark:text-purple-400", bgLight: "bg-purple-50 dark:bg-purple-950/30" },
    { id: "kalash", name: "Brass Kalash", hindiName: "पीतल का कलश", icon: "🏺", category: "puja", color: "text-amber-700 dark:text-amber-300", bgLight: "bg-amber-100 dark:bg-amber-950/40" },
  ],

  // Cycle 3: Grandmother's Spice Box & Kitchen Keepsakes
  3: [
    { id: "cardamom", name: "Green Cardamom", hindiName: "हरी इलायची", icon: "🌱", category: "kitchen", color: "text-emerald-600 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "cinnamon", name: "Cinnamon Stick", hindiName: "दालचीनी", icon: "🪵", category: "kitchen", color: "text-amber-700 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "mortar", name: "Stone Mortar (Okhli)", hindiName: "पत्थर की ओखली", icon: "🥣", category: "kitchen", color: "text-stone-600 dark:text-stone-400", bgLight: "bg-stone-50 dark:bg-stone-950/30" },
    { id: "spoon", name: "Brass Spoon", hindiName: "पीतल का चमचा", icon: "🥄", category: "kitchen", color: "text-yellow-600 dark:text-yellow-400", bgLight: "bg-yellow-50 dark:bg-yellow-950/30" },
    { id: "pot", name: "Clay Water Cup", hindiName: "मिट्टी का कुल्हड़", icon: "🏺", category: "kitchen", color: "text-orange-700 dark:text-orange-400", bgLight: "bg-orange-50 dark:bg-orange-950/30" },
    { id: "nut", name: "Betel Nut (Supari)", hindiName: "सुपारी", icon: "🌰", category: "kitchen", color: "text-amber-800 dark:text-amber-500", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "tea_leaves", name: "CTC Tea Leaves", hindiName: "चाय की पत्ती", icon: "🍃", category: "kitchen", color: "text-emerald-700 dark:text-emerald-300", bgLight: "bg-emerald-100 dark:bg-emerald-950/40" },
    { id: "box", name: "Brass Masala Dabba", hindiName: "मसाला दानी", icon: "🥫", category: "kitchen", color: "text-amber-600 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
  ],

  // Cycle 4: Heritage, Coins & Postcards
  4: [
    { id: "coin", name: "Silver Rupee Coin", hindiName: "चांदी का सिक्का", icon: "🪙", category: "heritage", color: "text-slate-600 dark:text-slate-300", bgLight: "bg-slate-50 dark:bg-slate-900/40" },
    { id: "stamp", name: "Vintage Postage Stamp", hindiName: "डाक टिकट", icon: "✉️", category: "heritage", color: "text-blue-600 dark:text-blue-400", bgLight: "bg-blue-50 dark:bg-blue-950/30" },
    { id: "lock", name: "Heavy Brass Lock", hindiName: "पीतल का ताला", icon: "🔒", category: "heritage", color: "text-amber-600 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "magnifier", name: "Magnifying Glass", hindiName: "आवर्धक लेंस (कांच)", icon: "🔍", category: "heritage", color: "text-indigo-600 dark:text-indigo-400", bgLight: "bg-indigo-50 dark:bg-indigo-950/30" },
    { id: "envelope", name: "Handwritten Postcard", hindiName: "हाथ से लिखा पत्र", icon: "💌", category: "heritage", color: "text-rose-600 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/30" },
    { id: "feather", name: "Peacock Quill", hindiName: "मोर पंख", icon: "🪶", category: "heritage", color: "text-teal-600 dark:text-teal-400", bgLight: "bg-teal-50 dark:bg-teal-950/30" },
    { id: "bell_brass", name: "Brass Token", hindiName: "पीतल का पदक", icon: "🏅", category: "heritage", color: "text-yellow-600 dark:text-yellow-400", bgLight: "bg-yellow-50 dark:bg-yellow-950/30" },
    { id: "box_carved", name: "Carved Wooden Box", hindiName: "नक्काशीदार डिब्बी", icon: "📦", category: "heritage", color: "text-amber-700 dark:text-amber-300", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
  ],

  // Cycle 5: Garden, Tulsi & Nature Tokens
  5: [
    { id: "tulsi", name: "Holy Tulsi Leaf", hindiName: "तुलसी का पत्ता", icon: "🌿", category: "nature", color: "text-emerald-600 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "marigold", name: "Orange Marigold", hindiName: "गेंदे का फूल", icon: "🌼", category: "nature", color: "text-orange-500 dark:text-orange-400", bgLight: "bg-orange-50 dark:bg-orange-950/30" },
    { id: "pebble", name: "Smooth River Pebble", hindiName: "नदी का गोल पत्थर", icon: "🪨", category: "nature", color: "text-stone-600 dark:text-stone-400", bgLight: "bg-stone-50 dark:bg-stone-950/30" },
    { id: "rudraksha", name: "Panchamukhi Rudraksha", hindiName: "रुद्राक्ष का मनका", icon: "📿", category: "nature", color: "text-amber-800 dark:text-amber-500", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "flute", name: "Bamboo Flute", hindiName: "बांस की बांसुरी", icon: "🪈", category: "nature", color: "text-teal-600 dark:text-teal-400", bgLight: "bg-teal-50 dark:bg-teal-950/30" },
    { id: "clay_bird", name: "Clay Bird Whistle", hindiName: "मिट्टी की चिड़िया", icon: "🐤", category: "nature", color: "text-yellow-600 dark:text-yellow-400", bgLight: "bg-yellow-50 dark:bg-yellow-950/30" },
    { id: "mango_leaf", name: "Mango Leaf", hindiName: "आम का पत्ता", icon: "🍃", category: "nature", color: "text-green-600 dark:text-green-400", bgLight: "bg-green-50 dark:bg-green-950/30" },
    { id: "rose", name: "Garden Pink Rose", hindiName: "गुलाबी गुलाब", icon: "🌹", category: "nature", color: "text-rose-600 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/30" },
  ],

  // Cycle 6: Handloom, Silk & Craft Tokens
  6: [
    { id: "spool", name: "Golden Silk Spool", hindiName: "रेशम की रील", icon: "🧵", category: "craft", color: "text-amber-600 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "gamusa", name: "Woven Cotton Gamusa", hindiName: "सूती गमोसा का टुकड़ा", icon: "🧣", category: "craft", color: "text-rose-600 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/30" },
    { id: "needle", name: "Brass Embroidery Needle", hindiName: "पीतल की सुई", icon: "🪡", category: "craft", color: "text-indigo-600 dark:text-indigo-400", bgLight: "bg-indigo-50 dark:bg-indigo-950/30" },
    { id: "shuttle", name: "Wooden Loom Shuttle", hindiName: "हथकरघे की फिरकी", icon: "🛶", category: "craft", color: "text-amber-700 dark:text-amber-300", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "cotton", name: "Raw Cotton Flower", hindiName: "कपास का फूल", icon: "☁️", category: "craft", color: "text-sky-600 dark:text-sky-400", bgLight: "bg-sky-50 dark:bg-sky-950/30" },
    { id: "bead", name: "Clay Painted Bead", hindiName: "रंगीन मनका", icon: "🔮", category: "craft", color: "text-purple-600 dark:text-purple-400", bgLight: "bg-purple-50 dark:bg-purple-950/30" },
    { id: "bangle", name: "Glass Bangle", hindiName: "कांच की चूड़ी", icon: "⭕", category: "craft", color: "text-emerald-600 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "scissors", name: "Brass Tailor Scissors", hindiName: "पीतल की कैंची", icon: "✂️", category: "craft", color: "text-stone-600 dark:text-stone-300", bgLight: "bg-stone-50 dark:bg-stone-950/30" },
  ],

  // Cycle 7: Grandparents' Study & Nostalgia
  7: [
    { id: "inkpot", name: "Glass Inkpot", hindiName: "दवात (इंकपॉट)", icon: "🧪", category: "study", color: "text-blue-600 dark:text-blue-400", bgLight: "bg-blue-50 dark:bg-blue-950/30" },
    { id: "spectacle_case", name: "Velvet Glasses Case", hindiName: "चश्मे का डिब्बा", icon: "🕶️", category: "study", color: "text-purple-600 dark:text-purple-400", bgLight: "bg-purple-50 dark:bg-purple-950/30" },
    { id: "bookmark", name: "Leather Bookmark", hindiName: "किताब का मार्कर", icon: "🔖", category: "study", color: "text-amber-700 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "paperweight", name: "Glass Paperweight", hindiName: "कांच का पेपरवेट", icon: "💎", category: "study", color: "text-teal-600 dark:text-teal-400", bgLight: "bg-teal-50 dark:bg-teal-950/30" },
    { id: "calendar", name: "Desk Panchang", hindiName: "पंचांग / टेबल कैलेंडर", icon: "🗓️", category: "study", color: "text-rose-600 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/30" },
    { id: "clipping", name: "Newspaper Clipping", hindiName: "अख़बार की कतरन", icon: "📰", category: "study", color: "text-stone-600 dark:text-stone-400", bgLight: "bg-stone-50 dark:bg-stone-950/30" },
    { id: "stamp_pad", name: "Purple Stamp Pad", hindiName: "स्टैम्प पैड", icon: "📮", category: "study", color: "text-indigo-600 dark:text-indigo-400", bgLight: "bg-indigo-50 dark:bg-indigo-950/30" },
    { id: "bell_study", name: "Call Bell", hindiName: "मेज़ की घंटी", icon: "🛎️", category: "study", color: "text-yellow-600 dark:text-yellow-400", bgLight: "bg-yellow-50 dark:bg-yellow-950/30" },
  ],

  // Cycle 8: Traditional Music, Festivity & Joy
  8: [
    { id: "manjira", name: "Brass Cymbals (Manjira)", hindiName: "मंजीरा", icon: "🔔", category: "music", color: "text-amber-600 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
    { id: "dhol_stick", name: "Bihu Dhol Stick", hindiName: "ढोल की डंडी", icon: "🥢", category: "music", color: "text-orange-600 dark:text-orange-400", bgLight: "bg-orange-50 dark:bg-orange-950/30" },
    { id: "rattle", name: "Wooden Toy Rattle", hindiName: "लकड़ी का झुनझुना", icon: "🪇", category: "music", color: "text-rose-600 dark:text-rose-400", bgLight: "bg-rose-50 dark:bg-rose-950/30" },
    { id: "conch_sacred", name: "Temple Conch", hindiName: "पूजा का शंख", icon: "🐚", category: "music", color: "text-sky-600 dark:text-sky-400", bgLight: "bg-sky-50 dark:bg-sky-950/30" },
    { id: "dotara_string", name: "Dotara Silk String", hindiName: "दोतारा का तार", icon: "🎻", category: "music", color: "text-emerald-600 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "ghungroo", name: "Brass Ghungroo", hindiName: "घुंघरू", icon: "🪙", category: "music", color: "text-yellow-600 dark:text-yellow-400", bgLight: "bg-yellow-50 dark:bg-yellow-950/30" },
    { id: "harmonium_key", name: "Harmonium Key Token", hindiName: "हारमोनियम का सुर", icon: "🎹", category: "music", color: "text-indigo-600 dark:text-indigo-400", bgLight: "bg-indigo-50 dark:bg-indigo-950/30" },
    { id: "sweet_box", name: "Festive Sweet Box", hindiName: "मिठाई का डिब्बा", icon: "🍬", category: "music", color: "text-purple-600 dark:text-purple-400", bgLight: "bg-purple-50 dark:bg-purple-950/30" },
  ],
};

export interface ObjectRecallProps {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  nerState?: string;
  cycleNumber?: number;
  cycleSeed?: number;
  adaptiveDifficulty?: string;
}

export function ObjectRecall({
  onComplete,
  level = 1,
  cycleNumber = 1,
  adaptiveDifficulty = "medium",
}: ObjectRecallProps) {
  // Phase state machine:
  // "observe" -> User examines tray
  // "veiled" -> Silk veil covers tray (1.5s gentle animation)
  // "recall" -> Tray reveals with change, user identifies it
  // "answered" -> Shows feedback before auto-completing
  const [phase, setPhase] = useState<"observe" | "veiled" | "recall" | "answered">("observe");
  const [initialTray, setInitialTray] = useState<KeepsakeItem[]>([]);
  const [modifiedTray, setModifiedTray] = useState<KeepsakeItem[]>([]);
  const [targetItem, setTargetItem] = useState<KeepsakeItem | null>(null);
  const [options, setOptions] = useState<KeepsakeItem[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState<number>(10);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const recallStartTimeRef = useRef<number>(Date.now());

  // Determine game mode & difficulty parameters across 30 levels:
  // L1-10: Missing Keepsake (क्या गायब हुआ?)
  // L11-20: New Keepsake Arrival (कौन सी नई वस्तु आई?)
  // L21-30: Replaced Keepsake (क्या बदल गया?)
  const gameMode: "missing" | "added" | "replaced" =
    level <= 10 ? "missing" : level <= 20 ? "added" : "replaced";

  // Item count progression:
  // L1-3: 2 items (super gentle introduction)
  // L4-8: 3 items
  // L9-15: 4 items
  // L16-22: 5 items
  // L23-30: 6 items
  const trayItemCount =
    level <= 3 ? 2 :
    level <= 8 ? 3 :
    level <= 15 ? 4 :
    level <= 22 ? 5 : 6;

  // Options count progression:
  // L1: 2 choices (very easy)
  // L2-10: 3 choices
  // L11-30: 4 choices
  const choiceCount = level === 1 ? 2 : level <= 10 ? 3 : 4;

  // Base observation time in seconds (+40% if adaptive difficulty is easy)
  const baseObserveSeconds = Math.max(8, trayItemCount * 3 + (level > 15 ? 4 : 2));
  const allocatedSeconds = adaptiveDifficulty === "easy" ? Math.round(baseObserveSeconds * 1.4) : baseObserveSeconds;

  // Initialize round with deterministic 8-day cycle theme
  const startRound = () => {
    const cycleKey = (((cycleNumber - 1) % 8) + 1) as keyof typeof KEEPSAKE_CYCLES;
    const itemPool = KEEPSAKE_CYCLES[cycleKey] || KEEPSAKE_CYCLES[1];

    // Seeded rotation by level and cycle
    const offset = ((level - 1) * 2 + (cycleNumber - 1) * 3) % itemPool.length;
    const rotated = [...itemPool.slice(offset), ...itemPool.slice(0, offset)];

    // Select items for initial tray
    const initialItems = rotated.slice(0, trayItemCount);
    const unusedItems = rotated.slice(trayItemCount);

    let changedTray: KeepsakeItem[] = [];
    let mysteryItem: KeepsakeItem;
    let candidateChoices: KeepsakeItem[] = [];

    if (gameMode === "missing") {
      // One item vanishes from initial tray
      const removeIndex = Math.floor(Math.random() * initialItems.length);
      mysteryItem = initialItems[removeIndex];
      changedTray = initialItems.filter((_, idx) => idx !== removeIndex);

      // Choices: mysteryItem + distractors from unusedItems
      const distractors = unusedItems.slice(0, choiceCount - 1);
      candidateChoices = [mysteryItem, ...distractors].sort(() => Math.random() - 0.5);
    } else if (gameMode === "added") {
      // A new item arrives that was NOT on initial tray
      mysteryItem = unusedItems[0] || itemPool[itemPool.length - 1];
      changedTray = [...initialItems, mysteryItem].sort(() => Math.random() - 0.5);

      // Choices: mysteryItem + items already in initial tray
      const distractors = initialItems.slice(0, choiceCount - 1);
      candidateChoices = [mysteryItem, ...distractors].sort(() => Math.random() - 0.5);
    } else {
      // "replaced": one item on tray was replaced with a new one
      const replaceIdx = Math.floor(Math.random() * initialItems.length);
      const oldItem = initialItems[replaceIdx];
      const newItem = unusedItems[0] || itemPool[itemPool.length - 1];
      mysteryItem = newItem; // user identifies what became new/replaced

      changedTray = initialItems.map((item, idx) => (idx === replaceIdx ? newItem : item));
      const distractors = [...initialItems.filter((_, idx) => idx !== replaceIdx), oldItem].slice(0, choiceCount - 1);
      candidateChoices = [mysteryItem, ...distractors].sort(() => Math.random() - 0.5);
    }

    setInitialTray(initialItems);
    setModifiedTray(changedTray);
    setTargetItem(mysteryItem);
    setOptions(candidateChoices);
    setSelectedOptionId(null);
    setIsCorrect(null);
    setShowHint(false);
    setCountdown(allocatedSeconds);
    setPhase("observe");
    startTimeRef.current = Date.now();
  };

  useEffect(() => {
    startRound();
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [level, cycleNumber, adaptiveDifficulty]);

  // Observation Countdown Timer
  useEffect(() => {
    if (phase !== "observe") return;
    if (countdown <= 0) {
      triggerVeil();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  const triggerVeil = () => {
    setPhase("veiled");
    setTimeout(() => {
      setPhase("recall");
      recallStartTimeRef.current = Date.now();
    }, 1500); // 1.5 second silk cloth animation
  };

  // Senior Accessibility Voice Narration
  const speakTray = (items: KeepsakeItem[]) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const names = items.map((i) => i.hindiName).join(", ");
    const intro = phase === "observe" ? "थाली पर रखी वस्तुएं हैं: " : "अब थाली को ध्यान से देखें: ";
    const utterance = new SpeechSynthesisUtterance(`${intro}${names}।`);
    utterance.rate = 0.88;
    utterance.lang = "hi-IN";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Senior's Selection
  const handleSelectOption = (item: KeepsakeItem) => {
    if (phase !== "recall" || selectedOptionId) return;

    const elapsedRecallMs = Date.now() - recallStartTimeRef.current;
    const correct = item.id === targetItem?.id;

    setSelectedOptionId(item.id);
    setIsCorrect(correct);
    setPhase("answered");

    // Real score calculation:
    // Base 100 points for correct answer, speed bonus up to 25 points
    const speedBonus = correct ? Math.max(0, Math.round(25 - elapsedRecallMs / 1000)) : 0;
    const earnedScore = correct ? 100 + speedBonus : 0;

    // Real accuracy calculation
    const accuracy = correct ? 100 : 0;

    setTimeout(() => {
      onComplete(earnedScore, 125, {
        gameType: "recall",
        accuracy,
        responseTimeMs: elapsedRecallMs,
        attempts: 1,
        errors: correct ? 0 : 1,
        correctAnswers: correct ? 1 : 0,
        incorrectAnswers: correct ? 0 : 1,
        mode: gameMode,
      });
    }, 1800);
  };

  const getQuestionTitle = () => {
    if (gameMode === "missing") {
      return "थाली में से कौन सी वस्तु गायब हो गई?";
    }
    if (gameMode === "added") {
      return "थाली पर कौन सी नई वस्तु आई है?";
    }
    return "थाली में कौन सी नई वस्तु बदली गई?";
  };

  const getQuestionSubtitle = () => {
    if (gameMode === "missing") {
      return "Which keepsake item disappeared from the tray?";
    }
    if (gameMode === "added") {
      return "Which new keepsake was just placed on the tray?";
    }
    return "Which keepsake was replaced with a new item?";
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Game Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/40 border border-border rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl">
            🪙
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              The Keepsake Memory Tray <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">Level {level}</span>
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              स्मृति थाली — Day {cycleNumber} Refresh ({trayItemCount} Keepsakes)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {phase === "observe" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black">
              <Clock className="w-3.5 h-3.5 animate-pulse" /> {countdown}s
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => speakTray(phase === "observe" ? initialTray : modifiedTray)}
            disabled={isSpeaking || phase === "veiled"}
            className="rounded-xl text-xs font-bold gap-1.5 h-9"
          >
            <Volume2 className="w-3.5 h-3.5" />
            {isSpeaking ? "सुना रहे हैं..." : "सुनें (Listen)"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={startRound}
            className="rounded-xl text-xs font-bold gap-1 h-9 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Replay
          </Button>
        </div>
      </div>

      {/* Main Game Stage */}
      {phase === "observe" && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h4 className="text-xl sm:text-2xl font-black text-foreground">
              थाली की वस्तुओं को ध्यान से देखें
            </h4>
            <p className="text-sm text-muted-foreground font-semibold">
              Observe all keepsakes on the tray carefully. One change is about to happen!
            </p>
          </div>

          {/* The Ornate Keepsake Brass Tray UI */}
          <div className="relative rounded-3xl border-4 border-amber-500/40 bg-gradient-to-b from-amber-50/60 to-amber-100/30 dark:from-amber-950/20 dark:to-background p-6 sm:p-10 shadow-inner">
            <div className="absolute top-3 left-4 text-[11px] font-black uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 flex items-center gap-1">
              <span>✨ Traditional Keepsake Tray</span>
            </div>

            {/* Keepsakes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-4">
              {initialTray.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border-2 border-border bg-card p-4 sm:p-5 text-center shadow-sm space-y-2 transform transition-transform hover:scale-105"
                >
                  <div className="text-4xl sm:text-5xl">{item.icon}</div>
                  <div className="text-sm font-black text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground font-semibold">{item.hindiName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button: Senior is ready ahead of timer */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={triggerVeil}
              className="rounded-2xl px-8 py-6 text-base font-black bg-primary text-primary-foreground shadow-md hover:bg-primary/90 gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> मैंने देख लिया, आगे बढ़ें (I'm Ready)
            </Button>
          </div>
        </div>
      )}

      {/* Veil / Covered Phase with Silken Cloth Transition */}
      {phase === "veiled" && (
        <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-r from-rose-900/30 via-primary/20 to-purple-900/30 p-12 sm:p-16 text-center space-y-4 shadow-lg animate-in fade-in zoom-in-95">
          <div className="text-6xl animate-bounce">🧣</div>
          <h4 className="text-2xl font-black text-foreground">
            थाली पर रेशमी पर्दा डाला गया...
          </h4>
          <p className="text-sm text-muted-foreground font-semibold">
            Covering the tray softly... A mystery change is taking place!
          </p>
        </div>
      )}

      {/* Recall / Question Phase */}
      {(phase === "recall" || phase === "answered") && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black uppercase">
              {gameMode === "missing" ? "Missing Item" : gameMode === "added" ? "New Arrival" : "Replaced Item"}
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-foreground">
              {getQuestionTitle()}
            </h4>
            <p className="text-sm text-muted-foreground font-semibold">
              {getQuestionSubtitle()}
            </p>
          </div>

          {/* Modified Tray Display */}
          <div className="rounded-3xl border-3 border-border bg-secondary/30 p-5 sm:p-8 space-y-3">
            <div className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>थाली की वर्तमान स्थिति (Current Tray):</span>
              {showHint ? (
                <span className="text-primary font-black text-xs">संकेत: वस्तु {targetItem?.category} श्रेणी की थी</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  संकेत चाहिए? (Hint)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {modifiedTray.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card/80 p-3 sm:p-4 text-center space-y-1"
                >
                  <div className="text-3xl sm:text-4xl">{item.icon}</div>
                  <div className="text-xs sm:text-sm font-bold text-foreground">{item.name}</div>
                  <div className="text-[11px] text-muted-foreground">{item.hindiName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Senior Selection Cards */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-muted-foreground text-center">
              नीचे दिए गए विकल्पों में से सही उत्तर चुनें (Select your answer):
            </div>

            <div className={`grid ${choiceCount === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4"} gap-3 sm:gap-4`}>
              {options.map((item) => {
                const isSelected = selectedOptionId === item.id;
                const isTarget = item.id === targetItem?.id;

                let cardStyle = "border-2 border-border bg-card hover:border-primary/50 hover:shadow-md";
                if (phase === "answered") {
                  if (isTarget) {
                    cardStyle = "border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-md";
                  } else if (isSelected && !isTarget) {
                    cardStyle = "border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100";
                  } else {
                    cardStyle = "opacity-50 border border-border bg-secondary/30";
                  }
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectOption(item)}
                    disabled={phase === "answered"}
                    className={`rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${cardStyle}`}
                  >
                    <div className="text-4xl sm:text-5xl">{item.icon}</div>
                    <div className="text-sm font-black text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground font-semibold">{item.hindiName}</div>

                    {phase === "answered" && isTarget && (
                      <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        <CheckCircle2 className="w-4 h-4" /> सही उत्तर!
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Immediate Feedback Banner */}
          {phase === "answered" && (
            <div
              className={`rounded-2xl p-4 border text-center font-bold text-sm sm:text-base animate-in zoom-in-95 ${
                isCorrect
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300"
              }`}
            >
              {isCorrect ? (
                <span>शाबाश! आपने बिल्कुल सही पहचाना: {targetItem?.hindiName} ({targetItem?.name})। बहुत सुंदर स्मृति!</span>
              ) : (
                <span>बहुत अच्छा प्रयास! सही उत्तर था: {targetItem?.hindiName} ({targetItem?.name})।</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
