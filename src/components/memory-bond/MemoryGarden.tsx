import { useState } from "react";
import {
  Flower2,
  Droplets,
  Sparkles,
  Heart,
  Pill,
  Sun,
  BookOpen,
  Volume2,
  CheckCircle2,
  Leaf,
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
  color: string;
  glowColor: string;
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
    (l) => l.date === todayStr && l.status === "taken"
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
  const hydrationBloomed = hydrationReminder ? hydrationReminder.last_done === todayStr : routinesDone > 0;

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
      progressText: hydrationBloomed ? "Bloomed: Fresh & hydrated" : "Thirsty: Drink a warm glass of water",
      details: "Water nourishes your mind, memory, and energy throughout the day.",
      color: "from-sky-500/20 to-blue-500/10 border-sky-500/40 text-sky-400",
      glowColor: "rgba(56, 189, 248, 0.4)",
    },
    {
      id: "medicine",
      name: "Healing Lotus (আরোগ্য কমল)",
      flower: "🌸",
      tag: "Medicine",
      bloomed: medsBloomed,
      progressText: `${medsDone}/${medsTotal || 1} Daily Doses Taken`,
      details: "Timely medicines protect vitality and keep body & brain in peaceful balance.",
      color: "from-rose-500/20 to-pink-500/10 border-rose-500/40 text-rose-400",
      glowColor: "rgba(244, 63, 94, 0.4)",
    },
    {
      id: "mind",
      name: "Wisdom Marigold (মেধা গাঁদা)",
      flower: "🏵️",
      tag: "Cognitive Play",
      bloomed: gamesBloomed,
      progressText: `${gamesDoneToday} Games Played Today`,
      details: "Gentle puzzles stimulate memory pathways and active focus without stress.",
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400",
      glowColor: "rgba(245, 158, 11, 0.4)",
    },
    {
      id: "routine",
      name: "Morning Sunflower (সূর্যমুখী)",
      flower: "🌻",
      tag: "Daily Habits",
      bloomed: routinesBloomed,
      progressText: `${routinesDone}/${routinesTotal || 1} Routines Complete`,
      details: "Calm daily routines create structure and comforting predictability.",
      color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/40 text-yellow-400",
      glowColor: "rgba(234, 179, 8, 0.4)",
    },
    {
      id: "memory",
      name: "Cherished Jasmine (স্মৃতি বেলি)",
      flower: "🌼",
      tag: "Personal Memories",
      bloomed: memoryBloomed,
      progressText: memoryBloomed ? "Memory Bank Enriched" : "Ready for a voice note",
      details: "Speaking memories preserves beloved family moments and lifelong stories.",
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-400",
      glowColor: "rgba(168, 85, 247, 0.4)",
    },
    {
      id: "heritage",
      name: "Assam Tea Sprout (অসমীয়া চাহ)",
      flower: "🌿",
      tag: "Cultural Connect",
      bloomed: culturalBloomed,
      progressText: culturalBloomed ? "Heritage Reminiscence Active" : "Recall North East heritage",
      details: "Familiar North Eastern memories (Jaapi, Bihu, Tea) comfort the heart.",
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400",
      glowColor: "rgba(16, 185, 129, 0.4)",
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

  // Compact Home Card View
  if (compact) {
    return (
      <div className="rounded-3xl border-2 border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-2xl text-primary">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">Today's Memory Garden (स्मृति वाटिका)</h3>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary/15 text-primary">
                  {bloomPercent}% Bloomed
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Each healthy routine and memory game blossoms a flower today.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={speakGardenStatus}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            title="Listen to Memory Garden status"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        {/* Progress meter */}
        <div className="w-full bg-secondary/80 rounded-full h-3 overflow-hidden border border-border/40">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(12, bloomPercent)}%` }}
          />
        </div>

        {/* 6 Blooming Flowers Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
          {blooms.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => handleFlowerTap(b)}
              className={`rounded-2xl border-2 p-3 text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-105 active:scale-95 ${
                b.bloomed
                  ? "border-primary/50 bg-primary/10 shadow-xs"
                  : "border-border/60 bg-secondary/30 opacity-70 hover:opacity-100"
              }`}
            >
              <span className={`text-2xl sm:text-3xl transition-transform ${b.bloomed ? "animate-pulse" : "grayscale"}`}>
                {b.flower}
              </span>
              <span className="text-[11px] font-black text-foreground truncate w-full">{b.tag}</span>
              <span className="text-[9px] font-bold text-muted-foreground">
                {b.bloomed ? "✓ Bloomed" : "Budding"}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic Encouragement / Explanation */}
        {selectedBloom && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="text-xs">
              <span className="font-black text-primary">{selectedBloom.name}: </span>
              <span className="text-foreground font-semibold">{selectedBloom.details}</span>
            </div>
            <button
              onClick={() => setSelectedBloom(null)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground shrink-0"
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
      <div className="rounded-3xl border-2 border-primary/40 bg-gradient-to-b from-card to-secondary/30 p-6 sm:p-8 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-black uppercase tracking-wider mb-2">
              <Leaf className="h-4 w-4" /> Personal Senior Growth Sanctuary
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Memory Garden (স্মৃতি वाटिका)
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-2xl">
              A peaceful, uplifting digital landscape representing your daily cognitive vitality, hydration, and family bonds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-card px-5 py-3 text-center shadow-xs">
              <div className="text-3xl font-black text-primary">{bloomPercent}%</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Today's Bloom</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={speakGardenStatus}
              className="rounded-2xl gap-2 font-bold h-12 px-4 text-primary border-primary/30"
            >
              <Volume2 className="h-5 w-5" /> Hear Status
            </Button>
          </div>
        </div>

        {/* Visual Soil & Flowers Layout */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blooms.map((b) => (
            <div
              key={b.id}
              onClick={() => handleFlowerTap(b)}
              className={`rounded-3xl border-2 p-5 transition-all cursor-pointer hover:border-primary hover:shadow-md flex flex-col justify-between h-48 bg-card ${
                b.bloomed ? "border-primary/40" : "border-border/60 opacity-80"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="text-4xl p-2 rounded-2xl bg-secondary/60 border border-border/40">
                  {b.flower}
                </div>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full ${
                    b.bloomed
                      ? "bg-success/20 text-success"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {b.bloomed ? "✓ Bloomed" : "Nurturing"}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-foreground">{b.name}</h4>
                <p className="text-xs text-primary font-bold mt-0.5">{b.progressText}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{b.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
