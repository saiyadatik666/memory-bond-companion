import { useState, useMemo, useEffect, useRef } from "react";
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
  ArrowLeft,
  Info,
  Search,
  Filter,
  BookmarkPlus,
  Check,
  Languages,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Compass,
  Layers,
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
  getCulturalItemsByRegion,
  type CulturalItem,
  type CulturalCategory,
} from "@/lib/panIndiaCulturalRepository";

// Available Region filters
const REGION_FILTERS = [
  { id: "all", label: "All India (सम्पूर्ण भारत)", countLabel: "2000+" },
  { id: "North", label: "North India", countLabel: "उत्तर" },
  { id: "South", label: "South India", countLabel: "दक्षिण" },
  { id: "West", label: "West India", countLabel: "पश्चिम" },
  { id: "East", label: "East India", countLabel: "पूर्व" },
  { id: "Central", label: "Central India", countLabel: "मध्य" },
  { id: "North-East", label: "North-East India", countLabel: "पूर्वोत्तर" },
];

const ITEMS_PER_PAGE = 24;

export function NorthEastCulturalConnect({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale } = useI18n();
  const catalogTopRef = useRef<HTMLDivElement>(null);

  // Normalize initial state
  const rawState = store.profile?.selected_state || store.profile?.selected_ner_state || "All India";
  const initialSelectedState = useMemo(() => {
    const s = (rawState || "").toLowerCase().trim();
    if (!s || s === "all" || s === "all india" || s === "pan-india" || s === "pan india") {
      return "All India";
    }
    return rawState;
  }, [rawState]);

  const [selectedState, setSelectedState] = useState<string>(initialSelectedState);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"explore" | "quiz">("explore");
  const [savedToJournalId, setSavedToJournalId] = useState<string | null>(null);

  // Pagination & Active Detail Item
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeItem, setActiveItem] = useState<CulturalItem | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeItem) {
        setActiveItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeItem]);

  // Quiz Mode State
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Filter items based on selected state, region, category, and search query across the 2000+ catalog
  const filteredItems = useMemo(() => {
    let list: CulturalItem[] = PAN_INDIA_CULTURAL_CATALOG;

    // Filter by state if a specific state is selected
    if (selectedState && selectedState !== "All India" && selectedState !== "all") {
      const s = selectedState.toLowerCase().trim();
      list = list.filter(
        (item) => item.state.toLowerCase() === s || item.state.toLowerCase().includes(s)
      );
    }

    // Filter by region if specified and state is "All India"
    if (selectedRegion !== "all" && (selectedState === "All India" || selectedState === "all")) {
      const reg = selectedRegion.toLowerCase().trim();
      list = list.filter((item) => item.region.toLowerCase() === reg);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.reminiscenceStory.toLowerCase().includes(q) ||
          item.state.toLowerCase().includes(q) ||
          (item.nativeName && item.nativeName.toLowerCase().includes(q)) ||
          (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [selectedState, selectedRegion, selectedCategory, searchQuery]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedState, selectedRegion, selectedCategory, searchQuery]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (catalogTopRef.current) {
      catalogTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle State Change and persist to user profile
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    if (state !== "All India") {
      setSelectedRegion("all");
    }
    if (store && typeof store.updateProfile === "function") {
      store.updateProfile({ selected_state: state });
    }
    setQuizIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setQuizFinished(false);
  };

  // Handle Region Change
  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    if (regionId !== "all") {
      setSelectedState("All India");
    }
  };

  // Audio narration
  const handlePlayAudio = (item: CulturalItem) => {
    const speech = item.audioCueText || `${item.name}. ${item.description}. ${item.reminiscenceStory}`;
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

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedState("All India");
    setSelectedRegion("all");
    setSelectedCategory("all");
    setSearchQuery("");
  };

  // Quiz Items
  const quizItems = useMemo(() => {
    const pool = filteredItems.length >= 4 ? filteredItems : PAN_INDIA_CULTURAL_CATALOG;
    return pool.slice(0, 10);
  }, [filteredItems]);

  const currentQuizItem = quizItems[quizIndex] || quizItems[0] || PAN_INDIA_CULTURAL_CATALOG[0];

  const quizOptions = useMemo(() => {
    if (!currentQuizItem) return [];
    const correct = currentQuizItem.name;
    const pool = filteredItems.length >= 4 ? filteredItems : PAN_INDIA_CULTURAL_CATALOG;
    const others = pool
      .filter((it) => it.id !== currentQuizItem.id && it.name !== correct)
      .map((it) => it.name)
      .slice(0, 3);

    // Fallback if not enough unique items in pool
    const fallbacks = ["Kathakali Dance", "Warli Art", "Mysore Pak", "Bihu Celebration"];
    while (others.length < 3) {
      const fb = fallbacks.find((f) => f !== correct && !others.includes(f)) || `Cultural Tradition ${others.length + 1}`;
      others.push(fb);
    }

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
      ? `Wonderful! You remembered ${currentQuizItem.name} correctly.`
      : `That was close! This is ${currentQuizItem.name} from ${currentQuizItem.state}.`;
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-primary bg-primary/15 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5" /> Cultural Hub — Pan-India Heritage
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground bg-secondary/80 px-2.5 py-0.5 rounded-full">
                <Layers className="h-3 w-3" />
                <strong className="text-foreground">{PAN_INDIA_CULTURAL_CATALOG.length}</strong> Total Curated Memories
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              India Cultural Memories (सांस्कृतिक धरोहर)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Explore timeless traditions, regional dishes, folk melodies, festivals, heirloom crafts, and sacred customs across all 30 Indian states to awaken cherished nostalgic memories.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-row lg:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant={activeTab === "explore" ? "default" : "outline"}
              onClick={() => setActiveTab("explore")}
              className="flex-1 sm:flex-initial font-black rounded-2xl h-11 px-4 gap-2 text-xs sm:text-sm"
            >
              <BookOpen className="h-4 w-4" /> Explore ({filteredItems.length})
            </Button>
            <Button
              variant={activeTab === "quiz" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("quiz");
                handleResetQuiz();
              }}
              className="flex-1 sm:flex-initial font-black rounded-2xl h-11 px-4 gap-2 text-xs sm:text-sm"
            >
              <Award className="h-4 w-4" /> Memory Quiz
            </Button>
          </div>
        </div>

        {/* 2. Interactive Region Filter Pills */}
        <div className="mt-6 pt-5 border-t border-border">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-primary" /> Select Cultural Zone:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {REGION_FILTERS.map((r) => {
              const isSelected =
                (r.id === "all" && selectedRegion === "all" && selectedState === "All India") ||
                (selectedRegion === r.id && selectedState === "All India");
              return (
                <button
                  key={r.id}
                  onClick={() => handleRegionChange(r.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                      : "bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/80"
                  }`}
                >
                  <span>{r.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-primary-foreground/20 text-white" : "bg-muted text-muted-foreground"}`}>
                    {r.countLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Interactive State Selection, Category Filter & Search Bar */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* State Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Indian State / Region:
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full h-11 rounded-xl bg-background border border-input px-3 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
            >
              <option value="All India">🇮🇳 All India (सम्पूर्ण भारत - {PAN_INDIA_CULTURAL_CATALOG.length}+ Items)</option>
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
              className="w-full h-11 rounded-xl bg-background border border-input px-3 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
            >
              <option value="all">All 15 Categories (सभी श्रेणियां)</option>
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
                placeholder="Search saree, food, festival, dhol, state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl pl-9 pr-8 text-xs sm:text-sm"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-3 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main Content Area */}
      <div ref={catalogTopRef} className="scroll-mt-6">
        {activeTab === "explore" ? (
          <div className="space-y-6">
            {/* Status Summary & Senior-friendly page indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                Showing{" "}
                <span className="text-foreground font-black">
                  {filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                  –
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
                </span>{" "}
                of <span className="text-foreground font-black">{filteredItems.length}</span> cultural memories
                {selectedState !== "All India" && ` in ${selectedState}`}
                {selectedRegion !== "all" && selectedState === "All India" && ` (${selectedRegion} India)`}
                {selectedCategory !== "all" && ` • ${selectedCategory}`}:
              </p>

              {/* Quick Reset button if filters are active */}
              {(selectedState !== "All India" || selectedRegion !== "all" || selectedCategory !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-primary hover:text-primary/80 h-8 px-2.5 self-start sm:self-auto"
                >
                  Reset all filters
                </Button>
              )}
            </div>

            {/* Empty State vs Card Grid */}
            {filteredItems.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border bg-card p-10 sm:p-14 text-center space-y-4">
                <p className="text-4xl">🔍</p>
                <h4 className="text-lg sm:text-xl font-black text-foreground">No cultural memories found</h4>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  We couldn't find any memories matching your current filters. Tap below to browse all 2000+ items across India.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    variant="default"
                    onClick={handleResetFilters}
                    className="rounded-xl font-black text-xs sm:text-sm h-10 px-5"
                  >
                    View All India Catalog ({PAN_INDIA_CULTURAL_CATALOG.length} Items)
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* 24-Item Paginated Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:shadow-md transition-all hover:border-primary/50 flex flex-col justify-between space-y-4 group cursor-pointer"
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
                          <h4 className="text-lg sm:text-xl font-black text-foreground leading-snug group-hover:text-primary transition-colors">
                            {item.name}
                          </h4>
                          {item.nativeName && (
                            <p className="text-xs sm:text-sm font-semibold text-primary/80 font-sans">
                              {item.nativeName}
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Nostalgic Reminiscence Story Card */}
                        <div className="rounded-2xl bg-secondary/50 p-3.5 border border-border/60 text-xs font-medium text-foreground leading-relaxed italic line-clamp-3">
                          "{item.reminiscenceStory}"
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div
                        className="flex items-center gap-2 pt-2 border-t border-border/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlayAudio(item)}
                          className="flex-1 rounded-xl font-bold text-xs gap-1.5 h-9"
                          title="Listen with voice narrator"
                        >
                          <Volume2 className="h-3.5 w-3.5 text-primary" /> Listen
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSaveToJournal(item)}
                          className="flex-1 rounded-xl font-bold text-xs gap-1.5 h-9"
                          title="Save this memory to journal"
                        >
                          {savedToJournalId === item.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-success" /> Saved!
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="h-3.5 w-3.5 text-primary" /> Save
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveItem(item)}
                          className="rounded-xl font-bold text-xs px-2.5 h-9"
                          title="View complete details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 5. Senior-Friendly Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border mt-8">
                    <div className="text-xs sm:text-sm font-bold text-muted-foreground text-center sm:text-left">
                      Page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong> ({filteredItems.length} total memories)
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded-xl font-black text-xs h-10 px-3.5 gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Button>

                      {/* Numbered Quick Page Buttons (Show up to 5 surrounding pages) */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                          .filter((p) => {
                            if (totalPages <= 7) return true;
                            if (p === 1 || p === totalPages) return true;
                            return Math.abs(p - currentPage) <= 1;
                          })
                          .map((p, idx, arr) => {
                            const prev = arr[idx - 1];
                            const showEllipsis = prev && p - prev > 1;
                            return (
                              <span key={p} className="flex items-center">
                                {showEllipsis && (
                                  <span className="px-1 text-xs text-muted-foreground">…</span>
                                )}
                                <button
                                  onClick={() => handlePageChange(p)}
                                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                                    currentPage === p
                                      ? "bg-primary text-primary-foreground font-black shadow-xs"
                                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {p}
                                </button>
                              </span>
                            );
                          })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="rounded-xl font-black text-xs h-10 px-3.5 gap-1"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
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
                  <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary">
                    {currentQuizItem.state} ({currentQuizItem.region} India)
                  </div>
                  <h3 className="text-2xl font-black text-foreground">
                    Which cultural tradition or item is this?
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto italic">
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
                        className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm sm:text-base transition-all flex items-center justify-between ${btnStyle} cursor-pointer`}
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
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground">Quiz Completed!</h3>
                  <p className="text-sm text-muted-foreground font-semibold">
                    You scored <span className="font-black text-primary text-lg">{quizScore}</span> out of{" "}
                    <span className="font-black text-foreground text-lg">{quizItems.length}</span>!
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
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

      {/* ========================================================================= */}
      {/* 6. Item Details Modal with Back Navigation                                */}
      {/* ========================================================================= */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-card border-2 border-primary/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Back Navigation & Close */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveItem(null)}
                className="rounded-xl font-bold text-xs sm:text-sm gap-1.5 h-9"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Cultural Hub
              </Button>
              <button
                onClick={() => setActiveItem(null)}
                className="w-9 h-9 rounded-full bg-secondary hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Header: Icon, Tags & Names */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-5xl sm:text-6xl shrink-0 shadow-inner">
                {activeItem.icon}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-0.5 rounded-full">
                    {activeItem.state}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                    {activeItem.region} India
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase bg-secondary px-2.5 py-0.5 rounded-full">
                    {activeItem.category}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                  {activeItem.name}
                </h3>
                {activeItem.nativeName && (
                  <p className="text-base sm:text-lg font-bold text-primary font-sans">
                    {activeItem.nativeName}
                  </p>
                )}
              </div>
            </div>

            {/* Cultural Description Section */}
            <div className="space-y-2 bg-secondary/30 rounded-2xl p-4 sm:p-5 border border-border/70">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" /> Cultural Significance & History:
              </h5>
              <p className="text-sm sm:text-base text-foreground leading-relaxed">
                {activeItem.description}
              </p>
            </div>

            {/* Nostalgic Reminiscence Section */}
            <div className="space-y-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 sm:p-5 border-2 border-primary/20">
              <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-primary fill-primary" /> Cherished Nostalgic Memory:
              </h5>
              <p className="text-sm sm:text-base text-foreground font-medium italic leading-relaxed">
                "{activeItem.reminiscenceStory}"
              </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handlePlayAudio(activeItem)}
                className="w-full sm:w-auto flex-1 h-12 rounded-xl font-bold text-sm gap-2"
              >
                <Volume2 className="h-4 w-4 text-primary" /> Listen with Voice Narrator
              </Button>
              <Button
                variant="default"
                onClick={() => handleSaveToJournal(activeItem)}
                className="w-full sm:w-auto flex-1 h-12 rounded-xl font-bold text-sm gap-2"
              >
                {savedToJournalId === activeItem.id ? (
                  <>
                    <Check className="h-4 w-4 text-white" /> Saved to Memory Journal!
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" /> Save to Memory Journal
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
