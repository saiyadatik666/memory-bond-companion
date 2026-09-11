import { useState, useMemo } from "react";
import {
  MapPin,
  Sparkles,
  Volume2,
  Award,
  Heart,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Music,
  ArrowRight,
  Info,
  Search,
  Filter,
  BookmarkPlus,
  Check,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";
import {
  PAN_INDIA_CULTURAL_CATALOG,
  INDIAN_STATES,
  CULTURAL_CATEGORIES,
  getCulturalItemsByState,
  searchCulturalItems,
  type CulturalItem,
  type CulturalCategory,
} from "@/lib/panIndiaCulturalRepository";

export function NorthEastCulturalConnect({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale } = useI18n();

  // Selected state: defaults to user's saved state or "All India"
  const defaultState = store.profile.selected_state || store.profile.selected_ner_state || "All India";
  const [selectedState, setSelectedState] = useState<string>(defaultState);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"explore" | "quiz">("explore");
  const [savedToJournalId, setSavedToJournalId] = useState<string | null>(null);

  // Quiz Mode State
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Filter items based on selected state, category, and search query
  const filteredItems = useMemo(() => {
    let list = selectedState === "All India" ? PAN_INDIA_CULTURAL_CATALOG : getCulturalItemsByState(selectedState);
    if (selectedCategory !== "all") {
      list = list.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.reminiscenceStory.toLowerCase().includes(q) ||
          (item.nativeName && item.nativeName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedState, selectedCategory, searchQuery]);

  // Handle State Change and persist to user profile
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    if (store && typeof store.updateProfile === "function") {
      store.updateProfile({ selected_state: state });
    }
    setQuizIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setQuizFinished(false);
  };

  // Audio narration
  const handlePlayAudio = (item: CulturalItem) => {
    const speech = item.audioCueText || `${item.name}. ${item.reminiscenceStory}`;
    speakText(speech, speechLocale);
  };

  // Save to Memory Journal
  const handleSaveToJournal = (item: CulturalItem) => {
    store.addJournalEntry({
      title: `Cultural Memory: ${item.name} (${item.state})`,
      body: `${item.reminiscenceStory}\n\nCultural Description: ${item.description}`,
      entry_date: new Date().toISOString().slice(0, 10),
      kind: "text",
    });
    setSavedToJournalId(item.id);
    setTimeout(() => setSavedToJournalId(null), 2500);
  };

  // Quiz Items
  const quizItems = useMemo(() => {
    return filteredItems.slice(0, 10);
  }, [filteredItems]);

  const currentQuizItem = quizItems[quizIndex] || filteredItems[0];

  const quizOptions = useMemo(() => {
    if (!currentQuizItem) return [];
    const correct = currentQuizItem.name;
    const others = filteredItems
      .filter((it) => it.id !== currentQuizItem.id)
      .map((it) => it.name)
      .slice(0, 3);
    return [correct, ...others].sort(() => 0.5 - Math.random());
  }, [currentQuizItem, filteredItems]);

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || !currentQuizItem) return;
    setIsSubmitted(true);
    const isCorrect = selectedOption === currentQuizItem.name;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
    const voiceMsg = isCorrect
      ? "Wonderful! You remembered this correctly."
      : `That was close! This is ${currentQuizItem.name}.`;
    speakText(voiceMsg, speechLocale);
  };

  const handleNextQuiz = () => {
    if (quizIndex + 1 < quizItems.length) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setQuizFinished(true);
      store.recordGameSession("cultural_hub_quiz", quizScore, quizItems.length, "easy", {
        gameType: "cultural",
        accuracy: Math.round((quizScore / quizItems.length) * 100),
      });
    }
  };

  const handleResetQuiz = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setQuizScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-primary bg-primary/15 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5" /> Cultural Hub — 1000+ Items Across India
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                {PAN_INDIA_CULTURAL_CATALOG.length}+ Curated Items
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              India Cultural Memories (सांस्कृतिक धरोहर)
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore timeless traditions, regional cuisine, folk music, festivals, and crafts from across Indian states to awaken cherished personal memories.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <Button
              variant={activeTab === "explore" ? "default" : "outline"}
              onClick={() => setActiveTab("explore")}
              className="font-bold rounded-2xl h-11 px-5 gap-2"
            >
              <BookOpen className="h-4 w-4" /> Explore Memories ({filteredItems.length})
            </Button>
            <Button
              variant={activeTab === "quiz" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("quiz");
                handleResetQuiz();
              }}
              className="font-bold rounded-2xl h-11 px-5 gap-2"
            >
              <Award className="h-4 w-4" /> Cultural Memory Quiz
            </Button>
          </div>
        </div>

        {/* 2. Interactive State Selection & Category Filter Bar */}
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* State Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Select Indian State / Region:
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full h-11 rounded-xl bg-background border border-input px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            >
              <option value="All India">🇮🇳 All India (सम्पूर्ण भारत - 1000+ Items)</option>
              <optgroup label="Western India">
                <option value="Gujarat">Gujarat (ગુજરાત)</option>
                <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
                <option value="Goa">Goa (गोंय)</option>
              </optgroup>
              <optgroup label="Northern India">
                <option value="Punjab">Punjab (ਪੰਜਾਬ)</option>
                <option value="Rajasthan">Rajasthan (राजस्थान)</option>
                <option value="Uttar Pradesh">Uttar Pradesh (उत्तर प्रदेश)</option>
                <option value="Haryana">Haryana (हरियाणा)</option>
                <option value="Himachal Pradesh">Himachal Pradesh (हिमाचल)</option>
                <option value="Uttarakhand">Uttarakhand (उत्तराखंड)</option>
                <option value="Jammu & Kashmir">Jammu & Kashmir (कश्मीर)</option>
                <option value="Delhi">Delhi (दिल्ली)</option>
              </optgroup>
              <optgroup label="Southern India">
                <option value="Kerala">Kerala (കേരളം)</option>
                <option value="Tamil Nadu">Tamil Nadu (தமிழ்நாடு)</option>
                <option value="Karnataka">Karnataka (ಕರ್ನಾಟಕ)</option>
                <option value="Andhra Pradesh">Andhra Pradesh (ఆంధ్రప్రదేశ్)</option>
                <option value="Telangana">Telangana (తెలంగాణ)</option>
              </optgroup>
              <optgroup label="Eastern & Central India">
                <option value="West Bengal">West Bengal (পশ্চিমবঙ্গ)</option>
                <option value="Odisha">Odisha (ଓଡ଼ିଶା)</option>
                <option value="Bihar">Bihar (बिहार)</option>
                <option value="Jharkhand">Jharkhand (झारखंड)</option>
                <option value="Madhya Pradesh">Madhya Pradesh (मध्य प्रदेश)</option>
                <option value="Chhattisgarh">Chhattisgarh (छत्तीसगढ़)</option>
              </optgroup>
              <optgroup label="North-Eastern Region">
                <option value="Assam">Assam (অসম)</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Manipur">Manipur (মণিপুৰ)</option>
                <option value="Nagaland">Nagaland</option>
                <option value="Mizoram">Mizoram</option>
                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                <option value="Tripura">Tripura (ত্রিপুরা)</option>
                <option value="Sikkim">Sikkim (सिक्किम)</option>
              </optgroup>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-primary" /> Cultural Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 rounded-xl bg-background border border-input px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            >
              <option value="all">All Categories (सभी श्रेणियां)</option>
              {CULTURAL_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-primary" /> Search Memories:
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search food, saree, festival, dhol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl pl-9"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Body: Explore Mode vs Quiz Mode */}
      {activeTab === "explore" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-muted-foreground">
              Showing <span className="text-foreground font-black">{filteredItems.length}</span> cultural memories
              {selectedState !== "All India" && ` from ${selectedState}`}:
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-card p-12 text-center space-y-3">
              <p className="text-2xl">🔍</p>
              <h4 className="text-lg font-bold text-foreground">No cultural memories found</h4>
              <p className="text-sm text-muted-foreground">
                Try searching for a different keyword or select "All India".
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="rounded-xl font-bold"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/40 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl shadow-xs group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          {item.state}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xl font-black text-foreground leading-snug">
                        {item.name}
                      </h4>
                      {item.nativeName && (
                        <p className="text-sm font-semibold text-primary/80 font-sans">
                          {item.nativeName}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Nostalgic Reminiscence Story Card */}
                    <div className="rounded-2xl bg-secondary/50 p-3.5 border border-border/60 text-xs font-medium text-foreground leading-relaxed italic">
                      "{item.reminiscenceStory}"
                    </div>
                  </div>

                  {/* Actions: Listen Audio & Save to Journal */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayAudio(item)}
                      className="flex-1 rounded-xl font-bold text-xs gap-1.5 h-9"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-primary" /> Listen
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSaveToJournal(item)}
                      className="flex-1 rounded-xl font-bold text-xs gap-1.5 h-9"
                    >
                      {savedToJournalId === item.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success" /> Saved!
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-3.5 w-3.5" /> Save Memory
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Quiz Mode */
        <div className="rounded-3xl border-2 border-primary/30 bg-card p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
          {!quizFinished && currentQuizItem ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>Question {quizIndex + 1} of {quizItems.length}</span>
                <span className="text-primary font-black">Score: {quizScore}</span>
              </div>

              <div className="text-center space-y-3 py-4">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/30 mx-auto flex items-center justify-center text-5xl shadow-sm">
                  {currentQuizItem.icon}
                </div>
                <h3 className="text-2xl font-black text-foreground">
                  Which cultural tradition or item is this?
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  "{currentQuizItem.reminiscenceStory}"
                </p>
              </div>

              <div className="space-y-2.5">
                {quizOptions.map((opt) => {
                  let btnStyle = "border-border hover:bg-secondary";
                  if (isSubmitted) {
                    if (opt === currentQuizItem.name) {
                      btnStyle = "bg-success/20 border-success text-success font-black";
                    } else if (opt === selectedOption) {
                      btnStyle = "bg-destructive/20 border-destructive text-destructive line-through";
                    }
                  } else if (opt === selectedOption) {
                    btnStyle = "border-primary bg-primary/10 font-black";
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isSubmitted}
                      className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-base transition-all flex items-center justify-between ${btnStyle} cursor-pointer`}
                    >
                      <span>{opt}</span>
                      {isSubmitted && opt === currentQuizItem.name && (
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                {!isSubmitted ? (
                  <Button
                    onClick={handleCheckAnswer}
                    disabled={!selectedOption}
                    className="w-full h-12 rounded-xl font-black text-base"
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuiz}
                    className="w-full h-12 rounded-xl font-black text-base gap-2 bg-primary"
                  >
                    {quizIndex + 1 < quizItems.length ? "Next Question" : "Complete Quiz"}{" "}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Results */
            <div className="text-center space-y-6 py-6 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-3xl bg-primary/20 text-primary mx-auto flex items-center justify-center">
                <Award className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-foreground">Quiz Completed!</h3>
                <p className="text-sm text-muted-foreground font-semibold">
                  You scored <span className="font-black text-primary text-lg">{quizScore}</span> out of{" "}
                  <span className="font-black text-foreground text-lg">{quizItems.length}</span>!
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleResetQuiz} className="rounded-xl font-bold gap-2">
                  <RotateCcw className="h-4 w-4" /> Play Again
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("explore")} className="rounded-xl font-bold">
                  Back to Explore
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
