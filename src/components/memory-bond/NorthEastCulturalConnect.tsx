import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapPin,
  Sparkles,
  Volume2,
  Award,
  Heart,
  BookOpen,
  ArrowLeft,
  Info,
  Search,
  Filter,
  BookmarkPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Compass,
  Layers,
  Play,
  RotateCcw,
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
  getCulturalItemImage,
  FEATURED_CULTURAL_EXPERIENCE,
  NER_SHOWCASE_ITEMS,
  type CulturalItem,
  type CulturalCategory,
} from "@/lib/panIndiaCulturalRepository";

// Available Region filters
const REGION_FILTERS = [
  { id: "all", label: "All India (सम्पूर्ण भारत)", countLabel: "2000+" },
  { id: "North-East", label: "North Eastern Region (पूर्वोत्तर)", countLabel: "8 States" },
  { id: "North", label: "North India", countLabel: "उत्तर" },
  { id: "South", label: "South India", countLabel: "दक्षिण" },
  { id: "West", label: "West India", countLabel: "पश्चिम" },
  { id: "East", label: "East India", countLabel: "पूर्व" },
  { id: "Central", label: "Central India", countLabel: "मध्य" },
];

// Curated Category Carousel configuration with high-res thumbnails
const CATEGORY_CAROUSEL = [
  { id: "all", label: "All India", native: "सम्पूर्ण भारत", img: "/images/cultural/diwali_lamps.jpg" },
  { id: "ner", label: "North East Region", native: "উত্তৰ-পূৰ্বাঞ্চল", img: "/images/cultural/bihu_dance.jpg" },
  { id: "festivals", label: "Festivals", native: "त्योहार", img: "/images/cultural/diwali_lamps.jpg" },
  { id: "dance", label: "Traditional Dance", native: "पारंपरिक नृत्य", img: "/images/cultural/bihu_dance.jpg" },
  { id: "music", label: "Folk & Sacred Music", native: "संगीत व वाद्य", img: "/images/cultural/indian_music.jpg" },
  { id: "food", label: "Traditional Food", native: "पारंपरिक भोजन", img: "/images/cultural/traditional_food.jpg" },
  { id: "crafts", label: "Handicrafts & Silk", native: "हस्तशिल्प व हथकरघा", img: "/images/cultural/handicrafts_weaving.jpg" },
  { id: "architecture", label: "Heritage Places", native: "ऐतिहासिक धरोहर", img: "/images/cultural/tripura_palace.jpg" },
  { id: "nature", label: "Sacred Rivers & Nature", native: "प्रकृति व नदियां", img: "/images/cultural/living_root_bridge.jpg" },
];

const ITEMS_PER_PAGE = 24;

export function NorthEastCulturalConnect({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale, lang } = useI18n();
  const catalogTopRef = useRef<HTMLDivElement>(null);
  const showcaseScrollRef = useRef<HTMLDivElement>(null);

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

  // Filter items based on selected state, region, category, and search query
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

  // Handle Quick Category Click
  const handleCategorySelect = (catId: string) => {
    if (catId === "ner") {
      setSelectedRegion("North-East");
      setSelectedState("All India");
      setSelectedCategory("all");
    } else if (catId === "all") {
      setSelectedRegion("all");
      setSelectedState("All India");
      setSelectedCategory("all");
    } else {
      setSelectedCategory(catId);
    }
    if (catalogTopRef.current) {
      catalogTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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

  // Scroll North East Showcase horizontally
  const scrollShowcase = (direction: "left" | "right") => {
    if (showcaseScrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      showcaseScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Localized UI helper
  const isHi = lang === "hi";
  const isGu = lang === "gu";
  const isAs = lang === "as";

  const uiText = {
    hubTitle: isHi
      ? "सांस्कृतिक धरोहर व यादें"
      : isGu
      ? "સાંસ્કૃતિક વારસો અને સ્મૃતિઓ"
      : isAs
      ? "সাংস্কৃতিক ঐতিহ্য আৰু স্মৃতি"
      : "Cultural Hub & Nostalgic Memories",
    hubSubtitle: isHi
      ? "भारत और पूर्वोत्तर क्षेत्र की समृद्ध परंपराएं, संगीत, नृत्य और स्वादिष्ट व्यंजनों की जीवंत तस्वीरें"
      : isGu
      ? "ભારત અને પૂર્વોત્તર ક્ષેત્રની સમૃદ્ધ પરંપરાઓ, સંગીત અને વાનગીઓની જીવંત તસવીરો"
      : isAs
      ? "ভাৰত আৰু উত্তৰ-পূৰ্বাঞ্চলৰ চহকী পৰম্পৰা, সংগীত আৰু খাদ্যৰ জীৱন্ত চিত্ৰ"
      : "Cherished traditions, authentic regional cuisines, sacred dances, and timeless arts across India & the North Eastern Region",
    featuredBadge: isHi ? "विशेष सांस्कृतिक अनुभव" : isGu ? "વિશેષ સાંસ્કૃતિક અનુભવ" : isAs ? "বিশেষ সাংস্কৃতিক অভিজ্ঞতা" : "Featured Cultural Experience",
    listenBtn: isHi ? "सुनें" : isGu ? "સાંભળો" : isAs ? "শুনক" : "Listen",
    saveBtn: isHi ? "सहेजें" : isGu ? "સાચવો" : isAs ? "সাঁচক" : "Save",
    savedBtn: isHi ? "सहेजा गया!" : isGu ? "સાચવ્યું!" : isAs ? "সংৰক্ষিত!" : "Saved!",
    viewDetails: isHi ? "विस्तार से देखें" : isGu ? "વિગતો જુઓ" : isAs ? "সবিশেষ চাওক" : "View Details",
    nerShowcaseTitle: isHi ? "पूर्वोत्तर क्षेत्र की धरोहर" : isGu ? "પૂર્વોત્તર ક્ષેત્રનો સાંસ્કૃતિક વારસો" : isAs ? "উত্তৰ-পূৰ্বাঞ্চলৰ বিশেষ সংস্কৃতি" : "North Eastern Region Showcase",
    nerShowcaseSub: isHi ? "असम, मेघालय, अरुणाचल, नागालैंड, मणिपुर, मिजोरम, त्रिपुरा और सिक्किम" : isGu ? "અસમ, મેઘાલય, અરુણાચલ, નાગાલેન્ડ, મણિપુર, મિઝોરમ, ત્રિપુરા અને સિક્કિમ" : isAs ? "অসম, মেঘালয়, অৰুণাচল, নাগালেণ্ড, মণিপুৰ, মিজোৰাম, ত্ৰিপুৰা আৰু ছিকিম" : "Authentic living traditions, handicrafts, and celebrations across all 8 NER states",
    allMemories: isHi ? "सांस्कृतिक यादें" : isGu ? "સાંસ્કૃતિક સ્મૃતિઓ" : isAs ? "সাংস্কৃতিক স্মৃতি" : "Cultural Memories",
    seeAll: isHi ? "सभी देखें" : isGu ? "બધા જુઓ" : isAs ? "সকলো চাওক" : "See All",
    quizTitle: isHi ? "स्मृति प्रश्नोत्तरी" : isGu ? "સ્મૃતિ ક્વિઝ" : isAs ? "স্মৃতি কুইজ" : "Memory Quiz",
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
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      {/* ========================================================================= */}
      {/* 1. Header Banner & Mode Switcher                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border-2 border-border/80 p-5 sm:p-7 rounded-3xl shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {uiText.hubTitle}
            </span>
            <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
              {PAN_INDIA_CULTURAL_CATALOG.length}+ Memories
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
            {uiText.hubTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {uiText.hubSubtitle}
          </p>
        </div>

        {/* Explore vs Quiz Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={activeTab === "explore" ? "default" : "outline"}
            onClick={() => setActiveTab("explore")}
            className="rounded-2xl font-black text-xs sm:text-sm h-11 px-4 gap-2 cursor-pointer"
          >
            <BookOpen className="h-4 w-4" /> {uiText.seeAll} ({filteredItems.length})
          </Button>
          <Button
            variant={activeTab === "quiz" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("quiz");
              handleResetQuiz();
            }}
            className="rounded-2xl font-black text-xs sm:text-sm h-11 px-4 gap-2 cursor-pointer"
          >
            <Award className="h-4 w-4" /> {uiText.quizTitle}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Featured Cultural Experience Hero Card (Section 5)                     */}
      {/* ========================================================================= */}
      {activeTab === "explore" && (
        <div
          onClick={() => setActiveItem(FEATURED_CULTURAL_EXPERIENCE)}
          className="group relative overflow-hidden rounded-3xl border-2 border-border bg-card shadow-lg cursor-pointer transition-all hover:shadow-xl hover:border-primary/50"
        >
          {/* Large Realistic Hero Photo */}
          <div className="relative h-72 sm:h-96 w-full overflow-hidden">
            <img
              src={FEATURED_CULTURAL_EXPERIENCE.imageUrl}
              alt={FEATURED_CULTURAL_EXPERIENCE.name}
              className="h-full w-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />
            {/* Soft dark gradient behind white text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

            {/* Badges Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <span className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {uiText.featuredBadge}
              </span>
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                {FEATURED_CULTURAL_EXPERIENCE.state} • North-East India
              </span>
            </div>

            {/* Bottom Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 space-y-2.5 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs">
                  {FEATURED_CULTURAL_EXPERIENCE.category.toUpperCase()}
                </span>
                {FEATURED_CULTURAL_EXPERIENCE.nativeName && (
                  <span className="text-sm font-bold text-amber-300">
                    {FEATURED_CULTURAL_EXPERIENCE.nativeName}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                {FEATURED_CULTURAL_EXPERIENCE.name}
              </h2>

              <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 max-w-3xl leading-relaxed">
                {FEATURED_CULTURAL_EXPERIENCE.description}
              </p>

              {/* Action Buttons */}
              <div
                className="flex items-center gap-3 pt-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  onClick={() => handlePlayAudio(FEATURED_CULTURAL_EXPERIENCE)}
                  size="sm"
                  className="rounded-2xl font-black text-xs h-10 px-4 bg-white text-slate-900 hover:bg-white/90 gap-2 shadow-md cursor-pointer"
                >
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span>{uiText.listenBtn}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveToJournal(FEATURED_CULTURAL_EXPERIENCE)}
                  className="rounded-2xl font-black text-xs h-10 px-4 bg-black/40 text-white border-white/30 hover:bg-black/60 gap-2 cursor-pointer"
                >
                  {savedToJournalId === FEATURED_CULTURAL_EXPERIENCE.id ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" /> {uiText.savedBtn}
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-4 w-4" /> {uiText.saveBtn}
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setActiveItem(FEATURED_CULTURAL_EXPERIENCE)}
                  className="rounded-2xl font-black text-xs h-10 px-4 bg-primary text-white hover:bg-primary/90 gap-1.5 ml-auto cursor-pointer"
                >
                  <span>{uiText.viewDetails}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Visual Categories Horizontal Carousel (Section 5)                      */}
      {/* ========================================================================= */}
      {activeTab === "explore" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" /> Cultural Categories & Regions
            </h3>
            <span className="text-xs font-bold text-muted-foreground">Tap to filter</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            {CATEGORY_CAROUSEL.map((cat) => {
              const isSelected =
                (cat.id === "all" && selectedCategory === "all" && selectedRegion === "all" && selectedState === "All India") ||
                (cat.id === "ner" && selectedRegion === "North-East") ||
                selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`group relative shrink-0 w-36 sm:w-44 h-24 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer text-left shadow-xs ${
                    isSelected
                      ? "border-primary scale-105 shadow-md ring-2 ring-primary/40"
                      : "border-border/80 hover:border-primary/60 hover:scale-102"
                  }`}
                >
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2.5 right-2 text-white">
                    <span className="text-xs font-black block truncate leading-tight">
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-gray-300 block truncate font-medium">
                      {cat.native}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Dedicated North Eastern Region Showcase (Section 6)                    */}
      {/* ========================================================================= */}
      {activeTab === "explore" && (
        <div className="space-y-4 bg-secondary/30 border-2 border-border/80 p-5 sm:p-7 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  North Eastern Region
                </span>
                <span className="text-xs font-bold text-muted-foreground">8 States Heritage</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                {uiText.nerShowcaseTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {uiText.nerShowcaseSub}
              </p>
            </div>

            {/* Carousel navigation buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => scrollShowcase("left")}
                className="w-10 h-10 rounded-2xl bg-card border border-border hover:bg-primary/10 hover:border-primary flex items-center justify-center text-foreground transition-colors cursor-pointer shadow-xs"
                title="Scroll left"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollShowcase("right")}
                className="w-10 h-10 rounded-2xl bg-card border border-border hover:bg-primary/10 hover:border-primary flex items-center justify-center text-foreground transition-colors cursor-pointer shadow-xs"
                title="Scroll right"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrolling Cards Gallery */}
          <div
            ref={showcaseScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth pt-1"
          >
            {NER_SHOWCASE_ITEMS.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="group shrink-0 w-72 sm:w-80 rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/60 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Photo with State Badge */}
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full bg-primary text-white shadow-md">
                        {item.state}
                      </span>
                    </div>
                    {item.isNew && (
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                          NEW
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-3 right-3 text-white">
                      <span className="text-xs font-bold text-amber-300 block truncate">
                        {item.nativeName}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2">
                    <h4 className="text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div
                  className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-border/40 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePlayAudio(item)}
                    className="rounded-xl font-bold text-xs h-9 px-3 gap-1.5 text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>{uiText.listenBtn}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveItem(item)}
                    className="rounded-xl font-black text-xs h-9 px-3 border-border hover:bg-secondary cursor-pointer"
                  >
                    <span>{uiText.viewDetails}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. State Selector, Filter & Search Controls                               */}
      {/* ========================================================================= */}
      <div className="bg-card border-2 border-border/80 p-5 sm:p-6 rounded-3xl space-y-4 shadow-xs">
        {/* Region Pills */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-primary" /> Filter by Zone:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {REGION_FILTERS.map((r) => {
              const isSelected =
                (r.id === "all" && selectedRegion === "all" && selectedState === "All India") ||
                (selectedRegion === r.id && selectedState === "All India");
              return (
                <button
                  key={r.id}
                  onClick={() => handleRegionChange(r.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                      : "bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border-border/80"
                  }`}
                >
                  <span>{r.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-primary-foreground/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.countLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 border-t border-border/60">
          {/* State Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> State / Territory:
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full h-11 rounded-xl bg-background border border-input px-3 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
            >
              <option value="All India">🇮🇳 All India (सम्पूर्ण भारत - {PAN_INDIA_CULTURAL_CATALOG.length}+ Items)</option>
              <optgroup label="North-Eastern Region (NER)">
                <option value="Assam">Assam (অসম)</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Manipur">Manipur (মণিপুৰ)</option>
                <option value="Nagaland">Nagaland</option>
                <option value="Mizoram">Mizoram</option>
                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                <option value="Tripura">Tripura (ত্ৰিপুৰা)</option>
                <option value="Sikkim">Sikkim (सिक्किम)</option>
              </optgroup>
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
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-primary" /> Category:
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
                placeholder="Search Bihu, Tea, Saree, Dance, Temple..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl pl-9 pr-8 text-xs sm:text-sm"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-3 text-muted-foreground hover:text-foreground p-0.5 rounded-full cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. Main Cultural Cards Grid (Section 7)                                    */}
      {/* ========================================================================= */}
      <div ref={catalogTopRef} className="scroll-mt-6 space-y-6">
        {activeTab === "explore" ? (
          <div className="space-y-6">
            {/* Status Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                Showing{" "}
                <span className="text-foreground font-black">
                  {filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                  –
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
                </span>{" "}
                of <span className="text-foreground font-black">{filteredItems.length}</span> {uiText.allMemories}
                {selectedState !== "All India" && ` in ${selectedState}`}
                {selectedRegion !== "all" && selectedState === "All India" && ` (${selectedRegion} India)`}
                {selectedCategory !== "all" && ` • ${selectedCategory}`}:
              </p>

              {(selectedState !== "All India" || selectedRegion !== "all" || selectedCategory !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-primary hover:text-primary/80 h-8 px-2.5 self-start sm:self-auto cursor-pointer"
                >
                  Reset all filters
                </Button>
              )}
            </div>

            {/* Empty State vs Cards Grid */}
            {filteredItems.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border bg-card p-10 sm:p-14 text-center space-y-4">
                <p className="text-4xl">🔍</p>
                <h4 className="text-lg sm:text-xl font-black text-foreground">No cultural memories found</h4>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  We couldn't find any memories matching your current filters. Tap below to browse all items across India.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    variant="default"
                    onClick={handleResetFilters}
                    className="rounded-xl font-black text-xs sm:text-sm h-10 px-5 cursor-pointer"
                  >
                    View All India Catalog ({PAN_INDIA_CULTURAL_CATALOG.length} Items)
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* 24-Item Photographic Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {paginatedItems.map((item) => {
                    const itemImage = getCulturalItemImage(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveItem(item)}
                        className="group rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/60 transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          {/* Large Realistic Photo Header with Badges */}
                          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-muted">
                            <img
                              src={itemImage}
                              alt={item.name}
                              loading="lazy"
                              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Subtle dark gradient behind text */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                              <span className="text-[11px] font-black uppercase tracking-wider text-white bg-primary px-3 py-0.5 rounded-full shadow-md">
                                {item.state}
                              </span>
                            </div>

                            <div className="absolute top-3 right-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20">
                                {item.category}
                              </span>
                            </div>

                            {/* Native Name on Photo */}
                            {item.nativeName && (
                              <div className="absolute bottom-2 left-3 right-3">
                                <span className="text-xs font-bold text-amber-300 drop-shadow-xs">
                                  {item.nativeName}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card Body */}
                          <div className="p-5 space-y-3">
                            <h4 className="text-lg sm:text-xl font-black text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
                              {item.name}
                            </h4>

                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>

                            {/* Nostalgic Reminiscence Story Snippet */}
                            <div className="rounded-2xl bg-secondary/50 p-3 border border-border/60 text-xs font-medium text-foreground leading-relaxed italic line-clamp-2">
                              "{item.reminiscenceStory}"
                            </div>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div
                          className="p-4 pt-0 border-t border-border/50 flex items-center gap-2 mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePlayAudio(item)}
                            className="flex-1 rounded-xl font-bold text-xs gap-1.5 h-10 cursor-pointer"
                            title="Listen with voice narrator"
                          >
                            <Volume2 className="h-4 w-4 text-primary" /> {uiText.listenBtn}
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSaveToJournal(item)}
                            className="flex-1 rounded-xl font-bold text-xs gap-1.5 h-10 cursor-pointer"
                            title="Save this memory to journal"
                          >
                            {savedToJournalId === item.id ? (
                              <>
                                <Check className="h-4 w-4 text-emerald-600" /> {uiText.savedBtn}
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="h-4 w-4 text-primary" /> {uiText.saveBtn}
                              </>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveItem(item)}
                            className="rounded-xl font-bold text-xs px-2.5 h-10 cursor-pointer hover:bg-secondary"
                            title="View full story"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border mt-8">
                    <div className="text-xs sm:text-sm font-bold text-muted-foreground text-center sm:text-left">
                      Page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong> ({filteredItems.length} memories)
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded-xl font-black text-xs h-10 px-3.5 gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Button>

                      {/* Numbered Quick Page Buttons */}
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
                                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                        className="rounded-xl font-black text-xs h-10 px-3.5 gap-1 cursor-pointer"
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
          /* ========================================================================= */
          /* Memory Quiz Mode                                                          */
          /* ========================================================================= */
          <div className="max-w-2xl mx-auto rounded-3xl border-2 border-primary/40 bg-card p-6 sm:p-8 space-y-6 shadow-sm">
            {!quizFinished ? (
              <>
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase text-primary tracking-wider">
                      Question {quizIndex + 1} of {quizItems.length}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-foreground">
                      Recognize the Cultural Memory
                    </h3>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary font-black text-xs">
                    Score: {quizScore}
                  </div>
                </div>

                {/* Cultural Clue Card with Photo */}
                <div className="rounded-2xl border border-border overflow-hidden bg-secondary/30">
                  <div className="relative h-48 w-full">
                    <img
                      src={getCulturalItemImage(currentQuizItem)}
                      alt={currentQuizItem.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 text-white">
                      <span className="text-xs font-bold text-amber-300">
                        From {currentQuizItem.state} ({currentQuizItem.region} India)
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1 text-center sm:text-left">
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      Category: {currentQuizItem.category}
                    </p>
                    <p className="text-sm font-semibold text-foreground italic">
                      "{currentQuizItem.reminiscenceStory}"
                    </p>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {quizOptions.map((opt) => {
                    const isPicked = selectedOption === opt;
                    const isCorrect = isSubmitted && opt === currentQuizItem.name;
                    const isWrong = isSubmitted && isPicked && opt !== currentQuizItem.name;

                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        disabled={isSubmitted}
                        className={`w-full p-4 rounded-2xl border-2 text-sm sm:text-base font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                          isCorrect
                            ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                            : isWrong
                            ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300"
                            : isPicked
                            ? "border-primary bg-primary/10 text-primary shadow-xs"
                            : "border-border hover:border-primary/40 bg-card text-foreground"
                        }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && <Check className="h-5 w-5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {!isSubmitted ? (
                    <Button
                      onClick={handleCheckAnswer}
                      disabled={!selectedOption}
                      className="w-full h-12 rounded-2xl font-black text-sm cursor-pointer"
                    >
                      Check Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuiz}
                      className="w-full h-12 rounded-2xl font-black text-sm bg-primary text-white hover:bg-primary/90 cursor-pointer"
                    >
                      {quizIndex + 1 < quizItems.length ? "Next Question ➔" : "View Results"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              /* Quiz Finished Screen */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center text-3xl">
                  🏆
                </div>
                <h3 className="text-2xl font-black text-foreground">Quiz Completed!</h3>
                <p className="text-base text-muted-foreground">
                  You scored <strong className="text-foreground">{quizScore}</strong> out of {quizItems.length}
                </p>
                <div className="flex items-center justify-center gap-3 pt-3">
                  <Button
                    onClick={handleResetQuiz}
                    className="rounded-2xl font-black text-sm h-12 px-6 cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" /> Play Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("explore")}
                    className="rounded-2xl font-black text-sm h-12 px-6 cursor-pointer"
                  >
                    Back to Explore
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. Photographic Cultural Detail Page / Modal (Section 8)                   */}
      {/* ========================================================================= */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-card border-2 border-primary/40 rounded-3xl overflow-hidden shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Full-bleed Hero Photo */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-muted">
              <img
                src={getCulturalItemImage(activeItem)}
                alt={activeItem.name}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

              {/* Close Button Top Right */}
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Back Button Top Left */}
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md flex items-center gap-1.5 text-xs font-bold text-white border border-white/20 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              {/* Bottom Details on Hero Image */}
              <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-white bg-primary px-3 py-0.5 rounded-full shadow-sm">
                    {activeItem.state}
                  </span>
                  <span className="text-[11px] font-bold text-white/90 bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20">
                    {activeItem.region} India
                  </span>
                  <span className="text-[11px] font-bold text-white/90 uppercase bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20">
                    {activeItem.category}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black drop-shadow-md">
                  {activeItem.name}
                </h3>
                {activeItem.nativeName && (
                  <p className="text-sm sm:text-base font-bold text-amber-300">
                    {activeItem.nativeName}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 pt-0 space-y-4">
              {/* Cultural Significance Section (Senior-friendly, concise) */}
              <div className="space-y-1.5 bg-secondary/40 rounded-2xl p-4 sm:p-5 border border-border/70">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-primary" /> Cultural Significance:
                </h5>
                <p className="text-sm sm:text-base text-foreground leading-relaxed">
                  {activeItem.description}
                </p>
              </div>

              {/* Nostalgic Reminiscence Story */}
              <div className="space-y-1.5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-2xl p-4 sm:p-5 border-2 border-primary/30">
                <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-primary fill-primary" /> Cherished Nostalgic Memory:
                </h5>
                <p className="text-sm sm:text-base text-foreground font-medium italic leading-relaxed">
                  "{activeItem.reminiscenceStory}"
                </p>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => handlePlayAudio(activeItem)}
                  className="w-full sm:w-auto flex-1 h-12 rounded-2xl font-black text-sm gap-2 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <Volume2 className="h-5 w-5" /> {uiText.listenBtn} with Voice Narrator
                </Button>

                <Button
                  variant="default"
                  onClick={() => handleSaveToJournal(activeItem)}
                  className="w-full sm:w-auto flex-1 h-12 rounded-2xl font-black text-sm gap-2 cursor-pointer"
                >
                  {savedToJournalId === activeItem.id ? (
                    <>
                      <Check className="h-5 w-5 text-white" /> Saved to Memory Journal!
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-5 w-5" /> Save to Memory Journal
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
