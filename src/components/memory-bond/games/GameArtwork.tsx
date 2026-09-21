import type { FC } from "react";

interface GameArtworkProps {
  gameId: string;
  className?: string;
  compact?: boolean;
}

export const GameArtwork: FC<GameArtworkProps> = ({ gameId, className = "", compact = false }) => {
  const containerClasses = `relative overflow-hidden rounded-2xl flex items-center justify-center select-none ${className}`;
  const heightClass = compact ? "h-32" : "h-44 sm:h-48";

  switch (gameId) {
    // 1. Pattern Recognition / Match
    case "pattern_recall":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-indigo-900/10 border border-indigo-500/20`}
        >
          {/* Subtle decorative background rings */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="w-48 h-48 rounded-full border-2 border-indigo-400 dashed" />
            <div className="absolute w-32 h-32 rounded-full border border-indigo-300" />
          </div>

          <div className="relative z-10 flex items-center gap-2 sm:gap-3 px-3">
            {/* Pattern Card 1 */}
            <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-white dark:bg-card border-2 border-indigo-400/80 shadow-md flex flex-col items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500 shadow-sm flex items-center justify-center text-white text-xs font-black">
                ●
              </div>
              <span className="text-[9px] font-bold text-muted-foreground mt-1">1st</span>
            </div>

            {/* Connecting Arrow */}
            <span className="text-indigo-400 font-black text-sm">→</span>

            {/* Pattern Card 2 */}
            <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-white dark:bg-card border-2 border-rose-400/80 shadow-md flex flex-col items-center justify-center transform rotate-2 hover:rotate-0 transition-transform">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-500 shadow-sm flex items-center justify-center text-white text-xs font-black">
                ●
              </div>
              <span className="text-[9px] font-bold text-muted-foreground mt-1">2nd</span>
            </div>

            {/* Connecting Arrow */}
            <span className="text-indigo-400 font-black text-sm">→</span>

            {/* Pattern Card 3 */}
            <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-white dark:bg-card border-2 border-emerald-400/80 shadow-md flex flex-col items-center justify-center transform -rotate-1 hover:rotate-0 transition-transform">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center text-white text-xs font-black">
                ●
              </div>
              <span className="text-[9px] font-bold text-muted-foreground mt-1">3rd</span>
            </div>

            {/* Mystery / Next Card */}
            <span className="text-indigo-400 font-black text-sm">→</span>

            <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-indigo-600 text-white border-2 border-indigo-300 shadow-lg flex flex-col items-center justify-center animate-pulse">
              <span className="text-lg font-black">?</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-200">Next</span>
            </div>
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
            Pattern Sequence
          </div>
        </div>
      );

    // 2. Memory Card Match
    case "card_match":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-teal-900/10 border border-teal-500/20`}
        >
          <div className="relative z-10 flex items-center gap-3 px-4">
            {/* Flipped Matched Pair 1 */}
            <div className="w-14 h-18 sm:w-16 sm:h-22 rounded-xl bg-white dark:bg-card border-2 border-teal-500 shadow-lg flex flex-col items-center justify-center transform -rotate-6">
              <span className="text-2xl sm:text-3xl">🌸</span>
              <span className="text-[9px] font-black text-teal-700 dark:text-teal-300 mt-1">Match!</span>
            </div>

            {/* Flipped Matched Pair 2 */}
            <div className="w-14 h-18 sm:w-16 sm:h-22 rounded-xl bg-white dark:bg-card border-2 border-teal-500 shadow-lg flex flex-col items-center justify-center transform rotate-6">
              <span className="text-2xl sm:text-3xl">🌸</span>
              <span className="text-[9px] font-black text-teal-700 dark:text-teal-300 mt-1">Match!</span>
            </div>

            {/* Decorative Face-Down Cards */}
            <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 border-2 border-teal-400 shadow-md flex items-center justify-center text-white/80 opacity-85 transform rotate-12">
              <div className="w-6 h-6 rounded-md border border-white/40 flex items-center justify-center text-[10px] font-black">
                MB
              </div>
            </div>
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
            Pair Matching
          </div>
        </div>
      );

    // 3. Real Memory Recall (🍎, ☕, 🔑, 🌸)
    case "real_memory":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-sky-500/15 via-blue-500/10 to-indigo-900/10 border border-sky-500/20`}
        >
          <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 px-3">
            {[
              { icon: "🍎", label: "Apple", color: "border-rose-400/70" },
              { icon: "☕", label: "Chai Cup", color: "border-amber-400/70" },
              { icon: "🔑", label: "Home Key", color: "border-yellow-400/70" },
              { icon: "🌸", label: "Lotus", color: "border-pink-400/70" },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`w-14 h-18 sm:w-16 sm:h-20 rounded-xl bg-white dark:bg-card border-2 ${item.color} shadow-md flex flex-col items-center justify-center p-1 hover:scale-105 transition-transform`}
              >
                <span className="text-2xl sm:text-3xl">{item.icon}</span>
                <span className="text-[9px] font-bold text-foreground/80 mt-1 truncate max-w-full">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
            Everyday Keepsakes
          </div>
        </div>
      );

    // 4. Number Sequence Memory
    case "sequence_memory":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-900/10 border border-emerald-500/20`}
        >
          <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
            {[2, 5, 8, 4].map((num, idx) => (
              <div
                key={idx}
                className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-white dark:bg-card border-2 border-emerald-500/70 shadow-md flex flex-col items-center justify-center"
              >
                <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">
                  {num}
                </span>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: idx + 1 }).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-emerald-500" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            Calm Numbers
          </div>
        </div>
      );

    // 5. Visual Attention / Odd One Out (Find Difference)
    case "find_difference":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-violet-900/10 border border-violet-500/20`}
        >
          <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-2.5 p-2 bg-white/60 dark:bg-card/60 backdrop-blur-xs rounded-2xl border border-violet-300/40 shadow-sm">
            {["🌿", "🌿", "🌿", "🌿", "🌿", "🦋", "🌿", "🌿"].map((icon, idx) => (
              <div
                key={idx}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-lg sm:text-xl ${
                  icon === "🦋"
                    ? "bg-amber-400/30 border-2 border-amber-500 scale-110 shadow-xs animate-bounce"
                    : "bg-violet-100 dark:bg-violet-950/40 border border-violet-300/60"
                }`}
              >
                {icon}
              </div>
            ))}
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30">
            Odd One Out
          </div>
        </div>
      );

    // 6. Word Memory Recall
    case "word_memory":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-blue-500/15 via-sky-500/10 to-indigo-900/10 border border-blue-500/20`}
        >
          <div className="relative z-10 flex flex-col items-center gap-2 w-full max-w-xs px-4">
            <div className="w-full bg-white dark:bg-card rounded-xl p-3 border-2 border-blue-400/70 shadow-md space-y-1.5">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Memory Words:
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 text-xs font-black text-blue-700 dark:text-blue-300">
                  Morning
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs font-black text-emerald-700 dark:text-emerald-300">
                  Family
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-xs font-black text-amber-700 dark:text-amber-300">
                  Smile
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            Word Recall
          </div>
        </div>
      );

    // 7. Family Photo Memory
    case "family_photo":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-rose-500/15 via-pink-500/10 to-rose-900/10 border border-rose-500/20`}
        >
          <div className="relative z-10 flex items-center gap-3">
            {/* Framed Photo Cards */}
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-white dark:bg-card border-4 border-amber-200 dark:border-amber-900/60 shadow-lg flex flex-col items-center justify-center p-1 transform -rotate-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-2xl shadow-inner">
                👵
              </div>
              <span className="text-[10px] font-black text-foreground mt-1">Dadi</span>
            </div>

            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-white dark:bg-card border-4 border-amber-200 dark:border-amber-900/60 shadow-lg flex flex-col items-center justify-center p-1 transform rotate-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-400 flex items-center justify-center text-2xl shadow-inner">
                👴
              </div>
              <span className="text-[10px] font-black text-foreground mt-1">Dadaji</span>
            </div>
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            Family Album
          </div>
        </div>
      );

    // 8. Daily Routine Recall
    case "routine_recall":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-900/10 border border-amber-500/20`}
        >
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            {[
              { icon: "🌅", time: "Morning", task: "Wake Up" },
              { icon: "🍵", time: "8:00 AM", task: "Warm Chai" },
              { icon: "💊", time: "9:00 AM", task: "Medicine" },
              { icon: "🌳", time: "Evening", task: "Walk" },
            ].map((step, idx) => (
              <div
                key={idx}
                className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl bg-white dark:bg-card border-2 border-amber-400/60 shadow-md flex flex-col items-center justify-center p-1"
              >
                <span className="text-2xl">{step.icon}</span>
                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {step.task}
                </span>
              </div>
            ))}
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            Daily Routine
          </div>
        </div>
      );

    // 9. Match the Object
    case "match_object":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-teal-900/10 border border-teal-500/20`}
        >
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-16 h-20 sm:w-18 sm:h-22 rounded-xl bg-white dark:bg-card border-2 border-teal-400 shadow-md flex flex-col items-center justify-center">
              <span className="text-3xl">🫖</span>
              <span className="text-[10px] font-bold text-muted-foreground mt-1">Teapot</span>
            </div>

            <div className="flex flex-col items-center gap-0.5 text-teal-600 dark:text-teal-400 font-black">
              <span className="text-xs">Pairs with</span>
              <span className="text-base">⟷</span>
            </div>

            <div className="w-16 h-20 sm:w-18 sm:h-22 rounded-xl bg-white dark:bg-card border-2 border-teal-400 shadow-md flex flex-col items-center justify-center">
              <span className="text-3xl">🍵</span>
              <span className="text-[10px] font-bold text-muted-foreground mt-1">Cup</span>
            </div>
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
            Object Partners
          </div>
        </div>
      );

    // 10. Voice Memory Quiz
    case "voice_quiz":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-sky-500/15 via-blue-500/10 to-sky-900/10 border border-sky-500/20`}
        >
          <div className="relative z-10 flex items-center gap-4 bg-white/70 dark:bg-card/70 backdrop-blur-xs px-5 py-3 rounded-2xl border border-sky-300/60 shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-2xl shadow-md">
              📻
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <span className="text-sm font-black animate-pulse">● Audio Playing</span>
              </div>
              <div className="flex items-center gap-1">
                {[12, 24, 18, 28, 14, 22, 10, 26].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-sky-500/80"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            Audio Quiz
          </div>
        </div>
      );

    // 11. North East Cultural Memory Keepsakes
    case "ner_cultural_memory":
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-emerald-500/15 via-amber-500/10 to-emerald-900/10 border border-emerald-500/20`}
        >
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            {[
              { icon: "👒", name: "Assam Jaapi" },
              { icon: "🧣", name: "Phulam Gamosa" },
              { icon: "🍃", name: "Green Tea" },
              { icon: "🎋", name: "Bamboo Craft" },
            ].map((ner, idx) => (
              <div
                key={idx}
                className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl bg-white dark:bg-card border-2 border-emerald-500/60 shadow-md flex flex-col items-center justify-center p-1"
              >
                <span className="text-2xl sm:text-3xl">{ner.icon}</span>
                <span className="text-[9px] font-bold text-foreground text-center truncate max-w-full mt-1">
                  {ner.name}
                </span>
              </div>
            ))}
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            NER Keepsakes
          </div>
        </div>
      );

    // 12. Keepsake Memory Tray (Object Recall)
    case "object_recall":
    default:
      return (
        <div
          className={`${containerClasses} ${heightClass} bg-gradient-to-br from-cyan-500/15 via-teal-500/10 to-blue-900/10 border border-cyan-500/20`}
        >
          <div className="relative z-10 flex items-center gap-2 sm:gap-3 bg-white/60 dark:bg-card/60 backdrop-blur-xs p-3 rounded-2xl border border-cyan-300/50 shadow-sm">
            {[
              { icon: "🔔", label: "Brass Bell" },
              { icon: "📿", label: "Prayer Mala" },
              { icon: "👓", label: "Spectacles" },
              { icon: "🏵️", label: "Marigold" },
            ].map((obj, idx) => (
              <div
                key={idx}
                className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-white dark:bg-card border border-cyan-400/60 shadow-xs flex flex-col items-center justify-center"
              >
                <span className="text-xl sm:text-2xl">{obj.icon}</span>
                <span className="text-[8px] font-bold text-muted-foreground mt-0.5 truncate max-w-full">
                  {obj.label}
                </span>
              </div>
            ))}
          </div>

          <div className="absolute bottom-2 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
            Memory Tray
          </div>
        </div>
      );
  }
};
