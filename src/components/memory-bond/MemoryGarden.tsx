import { useState } from "react";
import {
  Volume2,
  Leaf,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

interface BloomItem {
  id: string;
  name: string;
  flower: string;
  tag: string;
  bloomed: boolean;
  progressText: string;
  details: string;
  accentBg: string;
  accentBorder: string;
}

export function MemoryGarden({
  store,
  onNavigate,
  compact = false,
}: {
  store: MemoryBondStore;
  onNavigate?: (tab: string) => void;
  compact?: boolean;
}) {
  const { lang, speechLocale } = useI18n();
  const [selectedBloom, setSelectedBloom] = useState<BloomItem | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Medicines taken today
  const medsTotal = store.medicines.length;
  const medsDone = store.medicineLogs.filter(
    (l) => l.taken_at?.slice(0, 10) === todayStr && l.status === "taken"
  ).length;
  const medsBloomed = medsTotal > 0 && medsDone >= medsTotal;

  // 2. Routines done today
  const routinesTotal = store.routines.length;
  const routinesDone = store.routines.filter((r) => r.done_date === todayStr).length;
  const routinesBloomed = routinesTotal > 0 && routinesDone >= Math.ceil(routinesTotal / 2);

  // 3. Games played today
  const gamesDoneToday = store.gameSessions.filter(
    (s) => s.created_at && s.created_at.startsWith(todayStr)
  ).length;
  const gamesBloomed = gamesDoneToday >= 1;

  // 4. Hydration reminder done today
  const hydrationReminder = store.reminders.find((r) => r.type === "hydration");
  const hydrationBloomed = hydrationReminder ? hydrationReminder.last_done === todayStr : store.hydrationGlasses >= 3;

  // 5. Memory recorded today
  const journalToday = store.journal.filter((j) => j.entry_date === todayStr).length;
  const memoryBloomed = journalToday >= 1;

  // 6. Cultural Heritage
  const culturalBloomed = store.gameSessions.some((s) => s.game_type === "cultural");

  const blooms: BloomItem[] = [
    {
      id: "hydration",
      name: "Water Lily (জলপদ্ম)",
      flower: "🪷",
      tag: "Hydration",
      bloomed: hydrationBloomed,
      progressText: hydrationBloomed ? "Fresh & Hydrated" : "Thirsty: Drink warm water",
      details: "Water nourishes your memory, mind, and energy throughout the day.",
      accentBg: "bg-sky-50",
      accentBorder: "border-sky-200",
    },
    {
      id: "medicine",
      name: "Healing Lotus (আরোগ্য কমল)",
      flower: "🌸",
      tag: "Medicine",
      bloomed: medsBloomed,
      progressText: `${medsDone}/${medsTotal || 1} Doses Taken`,
      details: "Timely medicines protect vitality and keep body & brain in peaceful balance.",
      accentBg: "bg-rose-50",
      accentBorder: "border-rose-200",
    },
    {
      id: "mind",
      name: "Wisdom Marigold (মেধা গাঁদা)",
      flower: "🏵️",
      tag: "Mind Play",
      bloomed: gamesBloomed,
      progressText: `${gamesDoneToday} Games Played`,
      details: "Gentle puzzles stimulate memory pathways and active focus without stress.",
      accentBg: "bg-amber-50",
      accentBorder: "border-amber-200",
    },
    {
      id: "routine",
      name: "Morning Sunflower (সূর্যমুখী)",
      flower: "🌻",
      tag: "Habits",
      bloomed: routinesBloomed,
      progressText: `${routinesDone}/${routinesTotal || 1} Routines Complete`,
      details: "Calm daily routines create structure and comforting predictability.",
      accentBg: "bg-yellow-50",
      accentBorder: "border-yellow-200",
    },
    {
      id: "memory",
      name: "Cherished Jasmine (স্মৃতি বেলি)",
      flower: "🌼",
      tag: "Memories",
      bloomed: memoryBloomed,
      progressText: memoryBloomed ? "Memory Recorded" : "Ready for audio note",
      details: "Speaking memories preserves beloved family moments and lifelong stories.",
      accentBg: "bg-purple-50",
      accentBorder: "border-purple-200",
    },
    {
      id: "heritage",
      name: "Assam Tea Sprout (অসমীয়া চাহ)",
      flower: "🌿",
      tag: "Heritage",
      bloomed: culturalBloomed,
      progressText: culturalBloomed ? "Heritage Recalled" : "Recall cultural roots",
      details: "Familiar memories of home, Bihu, and Assam tea warm the heart.",
      accentBg: "bg-emerald-50",
      accentBorder: "border-emerald-200",
    },
  ];

  const totalBloomed = blooms.filter((b) => b.bloomed).length;
  const bloomPercent = Math.round((totalBloomed / blooms.length) * 100);

  const speakGardenStatus = () => {
    const text =
      lang === "hi"
        ? `आपका मेमोरी गार्डन आज ${bloomPercent} प्रतिशत खिला हुआ है। आपने ${totalBloomed} स्वास्थ्य और स्मृति कार्य पूरे कर लिए हैं।`
        : `Your Memory Garden is ${bloomPercent}% in bloom today. You have nurtured ${totalBloomed} healthy activities.`;
    speakText(text, speechLocale);
  };

  const handleFlowerTap = (item: BloomItem) => {
    setSelectedBloom(item);
    speakText(`${item.name}. ${item.progressText}. ${item.details}`, speechLocale);
  };

  // Compact Card View for Dashboard Side Panel
  if (compact) {
    return (
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-700 shrink-0">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground font-display">
                  Memory Garden
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {bloomPercent}% Bloomed
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Each healthy routine blossoms a flower today
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={speakGardenStatus}
            className="p-2 rounded-xl bg-secondary hover:bg-emerald-50 text-muted-foreground hover:text-emerald-700 transition-colors cursor-pointer"
            title="Hear Memory Garden status"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        {/* Peaceful Progress Bar */}
        <div className="w-full bg-secondary/80 rounded-full h-2.5 overflow-hidden border border-border/50">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(14, bloomPercent)}%` }}
          />
        </div>

        {/* 6 Blooming Flowers Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {blooms.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => handleFlowerTap(b)}
              className={`rounded-2xl border p-2 text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:scale-105 active:scale-95 ${
                b.bloomed
                  ? `${b.accentBg} ${b.accentBorder} shadow-xs`
                  : "border-border/60 bg-secondary/30 opacity-70 hover:opacity-100"
              }`}
            >
              <span className={`text-2xl transition-transform ${b.bloomed ? "animate-pulse" : "grayscale opacity-60"}`}>
                {b.flower}
              </span>
              <span className="text-[10px] font-black text-foreground truncate w-full">
                {b.tag}
              </span>
              <span className={`text-[9px] font-bold ${b.bloomed ? "text-emerald-700" : "text-muted-foreground"}`}>
                {b.bloomed ? "✓ Bloom" : "Bud"}
              </span>
            </button>
          ))}
        </div>

        {/* Gentle Encouragement Bubble */}
        {selectedBloom && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-start justify-between gap-2.5 animate-in fade-in">
            <div className="text-xs">
              <span className="font-black text-emerald-800">{selectedBloom.name}: </span>
              <span className="text-foreground/90 font-medium">{selectedBloom.details}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBloom(null)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full Expanded Memory Garden View
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-white via-emerald-50/30 to-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
              <Leaf className="h-4 w-4" /> Personal Growth & Mind Sanctuary
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight">
              Memory Garden (স্মৃতি বাটিকা)
            </h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-2xl font-medium">
              A peaceful, uplifting digital landscape representing your daily cognitive vitality, hydration, and family bonds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-center shadow-xs">
              <div className="text-3xl font-black text-emerald-600 font-display">{bloomPercent}%</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Today's Bloom</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={speakGardenStatus}
              className="rounded-2xl gap-2 font-bold h-12 px-4 text-emerald-800 border-emerald-200 bg-white hover:bg-emerald-50 cursor-pointer shadow-xs"
            >
              <Volume2 className="h-5 w-5 text-emerald-600" /> Hear Status
            </Button>
          </div>
        </div>

        {/* Visual Soil & Flowers Layout */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blooms.map((b) => (
            <div
              key={b.id}
              onClick={() => handleFlowerTap(b)}
              className={`rounded-3xl border p-5 transition-all cursor-pointer hover:shadow-md flex flex-col justify-between h-48 bg-white ${
                b.bloomed ? `${b.accentBorder} shadow-xs` : "border-border/60 opacity-80"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`text-4xl p-2.5 rounded-2xl ${b.accentBg} border ${b.accentBorder}`}>
                  {b.flower}
                </div>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full ${
                    b.bloomed
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {b.bloomed ? "✓ Bloomed" : "Nurturing"}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-foreground font-display">{b.name}</h4>
                <p className="text-xs text-emerald-700 font-bold mt-0.5">{b.progressText}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{b.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
