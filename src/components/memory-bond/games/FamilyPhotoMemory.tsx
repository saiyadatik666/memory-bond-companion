import { useState, useMemo, useRef } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Users, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryCue } from "@/lib/memoryBondStore";

interface FamilyProfile {
  name: string;
  relation: string;
  avatar: string;
  detail: string;
  question: string;
  options: string[];
  correctAnswer: string;
  voiceMessage?: string;
}

const DEFAULT_FAMILY_PROFILES: FamilyProfile[] = [
  {
    name: "Sunita Sharma",
    relation: "Daughter (Primary Caregiver)",
    avatar: "👩‍💼",
    detail: "Brings herbal tea on Sundays and calls daily at 5 PM.",
    question: "Who is this family member who visits every Sunday with homemade tea?",
    options: ["Sunita (Daughter)", "Meera (Nurse)", "Ananya (Neighbor)", "Pooja (Pharmacist)"],
    correctAnswer: "Sunita (Daughter)",
    voiceMessage: "Namaste Pitaji! Remember to take your morning walk. I will visit you this Sunday with warm herbal tea!",
  },
  {
    name: "Aarav",
    relation: "Grandson (Age 8)",
    avatar: "👦",
    detail: "Loves to show his school art drawings and dance Bihu.",
    question: "Who is your grandson who loves to show you his colorful drawings?",
    options: ["Aarav", "Rohan", "Kabir", "Arjun"],
    correctAnswer: "Aarav",
    voiceMessage: "Dadu! I drew a big green tea garden in my drawing book for you. See you soon!",
  },
  {
    name: "Rajesh Sharma",
    relation: "Son",
    avatar: "👨‍💻",
    detail: "Works as a software engineer in Bengaluru and video calls on weekends.",
    question: "Which son calls you from Bengaluru every Saturday evening?",
    options: ["Rajesh", "Vikram", "Suresh", "Manoj"],
    correctAnswer: "Rajesh",
    voiceMessage: "Pranam Pitaji. Sending love from Bengaluru. Hope your blood pressure check was good today!",
  },
  {
    name: "Deepali Bora",
    relation: "Lifelong Friend from Tezpur",
    avatar: "👵",
    detail: "Went to school together and shared memories of monsoon picnics.",
    question: "Which cherished school friend from Tezpur visited during last Bihu?",
    options: ["Deepali Bora", "Geeta Devi", "Rani Kalita", "Sita Sharma"],
    correctAnswer: "Deepali Bora",
    voiceMessage: "Ramesh-da, remembering our school days by the Tezpur hills. Wishing you peaceful health!",
  },
  {
    name: "Kamala",
    relation: "Elder Sister",
    avatar: "🧕",
    detail: "Sings melodious Borgeet and sends Assam winter pitha sweets.",
    question: "Who is your loving elder sister who sings soothing traditional hymns?",
    options: ["Kamala", "Lata", "Usha", "Shanti"],
    correctAnswer: "Kamala",
    voiceMessage: "May Lord Krishna keep you blessed and peaceful always, my dear brother.",
  },
  {
    name: "Ancestral Brahmaputra Home",
    relation: "Beloved Village Home",
    avatar: "🏡",
    detail: "Surrounded by swaying bamboo groves and fragrant tea gardens.",
    question: "Where was your childhood ancestral home located?",
    options: ["Near the Brahmaputra banks in Assam", "In Mumbai city", "In Delhi center", "In Chennai port"],
    correctAnswer: "Near the Brahmaputra banks in Assam",
    voiceMessage: "The river breezes and bamboo groves of our ancestral home bring tranquility to the soul.",
  },
  {
    name: "Ananya",
    relation: "Granddaughter (Age 14)",
    avatar: "👧",
    detail: "Plays the classical sitar and recites traditional poetry for you.",
    question: "Which granddaughter plays melodious sitar music when she visits?",
    options: ["Ananya", "Rhea", "Pooja", "Maya"],
    correctAnswer: "Ananya",
    voiceMessage: "Pranam Dadu! I learned a new peaceful raga on my sitar to play for you this weekend.",
  },
  {
    name: "Dr. Deepen Barua",
    relation: "Trusted Family Physician (Cardiologist)",
    avatar: "👨‍⚕️",
    detail: "Has monitored your blood pressure and heart health with care for 15 years.",
    question: "Who is your caring cardiologist who checks your morning medicines?",
    options: ["Dr. Deepen Barua", "Dr. Mehta", "Dr. Sen", "Dr. Rao"],
    correctAnswer: "Dr. Deepen Barua",
    voiceMessage: "Namaste Ramesh-ji. Keep up your gentle morning walks and timely hydration!",
  },
  {
    name: "Vikram Sharma",
    relation: "Younger Brother in Jorhat",
    avatar: "👨‍🦳",
    detail: "Owns a peaceful organic tea garden and sends freshly plucked orthodox tea.",
    question: "Which brother lives in Jorhat and sends organic tea leaves?",
    options: ["Vikram", "Sunil", "Ashok", "Kishore"],
    correctAnswer: "Vikram",
    voiceMessage: "Pranam Bhaiya! The spring tea harvest in Jorhat is wonderfully fragrant this year.",
  },
  {
    name: "Mother's Cherished Memory",
    relation: "Beloved Mother",
    avatar: "🌸",
    detail: "Taught you compassion, morning prayers, and how to cook traditional khar.",
    question: "What values and wisdom did your mother instill in your heart?",
    options: ["Compassion, peace, and morning prayers", "Worry and haste", "Loud arguments", "Cold distance"],
    correctAnswer: "Compassion, peace, and morning prayers",
    voiceMessage: "Her gentle smile and soothing lullabies continue to warm every morning.",
  },
  {
    name: "1975 Vintage Bicycle",
    relation: "College Days Companion",
    avatar: "🚲",
    detail: "Rode along the river road every morning to teach at Cotton College.",
    question: "What vehicle did you ride along the scenic river road in 1975?",
    options: ["Green Raleigh Bicycle", "Speeding sports car", "Heavy cargo truck", "Aeroplane"],
    correctAnswer: "Green Raleigh Bicycle",
    voiceMessage: "Ringing the bicycle bell on crisp autumn mornings was pure joy.",
  },
  {
    name: "Belona Tea Garden Walk",
    relation: "Favorite Peaceful Trail",
    avatar: "🍃",
    detail: "Walking path shaded by tall shade trees and singing birds.",
    question: "Where did you enjoy peaceful evening strolls among fragrant greenery?",
    options: ["Belona Tea Garden Trail", "Crowded highway", "Underground tunnel", "Noisy airport"],
    correctAnswer: "Belona Tea Garden Trail",
    voiceMessage: "The gentle rustle of tea leaves in the breeze brought deep relaxation.",
  },
  {
    name: "Silver Wedding Anniversary in Shillong",
    relation: "Milestone Celebration",
    avatar: "💐",
    detail: "A joyful autumn holiday enjoying pine trees and Elephant Falls.",
    question: "In which hill station did you celebrate your joyful silver anniversary?",
    options: ["Shillong", "Goa", "Jaipur", "Agra"],
    correctAnswer: "Shillong",
    voiceMessage: "The misty pines and cool pine air made that week unforgettable.",
  },
  {
    name: "Grandfather's Rocking Chair",
    relation: "Family Heirloom",
    avatar: "🪑",
    detail: "Handcrafted from solid teak wood, placed by the sunny veranda window.",
    question: "What cherished wooden furniture sits comfortably by your veranda window?",
    options: ["Handcrafted Teak Rocking Chair", "Plastic stool", "Steel ladder", "Glass desk"],
    correctAnswer: "Handcrafted Teak Rocking Chair",
    voiceMessage: "Rocking gently while reading morning newspapers has brought decades of peace.",
  },
  {
    name: "Cotton University Graduation",
    relation: "Academic Milestone",
    avatar: "🎓",
    detail: "Graduated with honors in literature, celebrated with sweets and family.",
    question: "Which historic institution in Guwahati did you graduate from?",
    options: ["Cotton University (College)", "Oxford", "Harvard", "Tokyo University"],
    correctAnswer: "Cotton University (College)",
    voiceMessage: "Receiving your degree with mother and father watching was a moment of supreme pride.",
  },
  {
    name: "Moniram's Colony Store",
    relation: "Friendly Neighborhood Grocer",
    avatar: "🏪",
    detail: "Always saves the sweetest red apples and fresh local ginger for you.",
    question: "Who is the friendly neighborhood shopkeeper who reserves fresh fruit for you?",
    options: ["Moniram", "Harish", "Gopal", "Shyam"],
    correctAnswer: "Moniram",
    voiceMessage: "Dada! I have kept aside fresh garden ginger and honey for your morning tea.",
  },
  {
    name: "Bihu Festival Cooking",
    relation: "Festive Family Tradition",
    avatar: "🫓",
    detail: "Making coconut pitha and til laru together around the warm hearth.",
    question: "What traditional sweets did the family prepare together for Bihu?",
    options: ["Coconut pitha and til laru", "Ice cream cake", "French fries", "Pizza slices"],
    correctAnswer: "Coconut pitha and til laru",
    voiceMessage: "The sweet aroma of roasted sesame and jaggery filled the whole house.",
  },
  {
    name: "1985 Family Ambassador Car",
    relation: "First Family Automobile",
    avatar: "🚗",
    detail: "White Ambassador car that took the whole family on holiday to Tezpur.",
    question: "What classic car carried the family on picnics across Assam?",
    options: ["White Ambassador Car", "Race car", "Tractor", "Helicopter"],
    correctAnswer: "White Ambassador Car",
    voiceMessage: "Singing old Hindi and Assamese songs on the Tezpur road was pure happiness.",
  },
  {
    name: "Sacred Veranda Gita Room",
    relation: "Spiritual Sanctuary",
    avatar: "🪔",
    detail: "Soft brass oil lamp lit every evening during twilight sandhya aarti.",
    question: "What peaceful evening ritual is performed in the Gita room?",
    options: ["Lighting the evening brass diya and quiet reflection", "Playing loud rock music", "Watching television", "Strenuous weights"],
    correctAnswer: "Lighting the evening brass diya and quiet reflection",
    voiceMessage: "The golden glow of the brass lamp brings peaceful clarity to the home.",
  },
  {
    name: "Kamakhya Temple Steps",
    relation: "Sacred Pilgrimage",
    avatar: "🛕",
    detail: "Panoramic view of the Brahmaputra River from the Nilachal hill.",
    question: "What scenic vista opens up from the Nilachal hill temple steps?",
    options: ["Panoramic Brahmaputra River view", "Desert sand dunes", "Frozen icebergs", "Factory chimneys"],
    correctAnswer: "Panoramic Brahmaputra River view",
    voiceMessage: "The sacred river flowing silently below brings stillness to all worries.",
  },
  {
    name: "Bruno the Golden Retriever",
    relation: "Faithful Companion",
    avatar: "🐕",
    detail: "Walked faithfully beside you in the garden and sat beside your rocking chair.",
    question: "What was the name of your loyal golden companion who loved garden walks?",
    options: ["Bruno", "Tiger", "Leo", "Tommy"],
    correctAnswer: "Bruno",
    voiceMessage: "Bruno's gentle wagging tail and warm companionship brought decades of warmth.",
  },
  {
    name: "Saraighat Bridge Crossing",
    relation: "Historic Journey",
    avatar: "🌉",
    detail: "Crossing the great river on the morning express train to Guwahati.",
    question: "Which historic bridge carries the train across the majestic Brahmaputra?",
    options: ["Saraighat Bridge", "Howrah Bridge", "Golden Gate Bridge", "London Bridge"],
    correctAnswer: "Saraighat Bridge",
    voiceMessage: "Watching the mighty river currents rush beneath the bridge was breathtaking.",
  },
  {
    name: "Cousin Manoj's Orchard",
    relation: "Dibrugarh Countryside",
    avatar: "🌳",
    detail: "Rows of sweet litchi trees and buzzing honeybees in the summer warmth.",
    question: "What fruit orchard did cousin Manoj tend in Dibrugarh?",
    options: ["Sweet litchi and orange trees", "Pineapple greenhouse", "Cactus nursery", "Wheat silo"],
    correctAnswer: "Sweet litchi and orange trees",
    voiceMessage: "Tasting sun-warmed litchis freshly plucked from the branches was heavenly.",
  },
  {
    name: "Gita's Homemade Sweets",
    relation: "Sister-in-law",
    avatar: "🍯",
    detail: "Always packs homemade cardamom sweets whenever you visit.",
    question: "Who is known for packing delicious homemade sweets with extra love?",
    options: ["Gita", "Rekha", "Neelam", "Suman"],
    correctAnswer: "Gita",
    voiceMessage: "Bhaiya, I have packed special digestive sweets made with pure ginger and jaggery.",
  },
  {
    name: "Daughter Sunita's Wedding",
    relation: "Unforgettable Milestone",
    avatar: "👰",
    detail: "Sunita looking radiant in traditional Assam muga silk mekhela chador.",
    question: "What traditional silk attire did Sunita wear on her joyful wedding day?",
    options: ["Golden Muga Silk Mekhela Chador", "Denim jeans", "Western gown", "Cotton jumpsuit"],
    correctAnswer: "Golden Muga Silk Mekhela Chador",
    voiceMessage: "Seeing Sunita smiling joyfully beside her loving husband was a blessing beyond measure.",
  },
  {
    name: "Aarav's Balcony Rose Garden",
    relation: "Shared Grandfather-Grandson Project",
    avatar: "🌹",
    detail: "Planted three fragrant pink rose saplings in earthen pots together.",
    question: "What shared flower garden did you and Aarav plant in the balcony?",
    options: ["Fragrant pink rose pots", "Vegetable farm", "Orchard forest", "Cactus patch"],
    correctAnswer: "Fragrant pink rose pots",
    voiceMessage: "Dadu, look! The rose we planted has bloomed with three beautiful pink petals!",
  },
  {
    name: "Tezpur Village Primary School",
    relation: "Early Foundations",
    avatar: "🏫",
    detail: "Wooden chalkboard, ringing brass school bell, and lifelong friends.",
    question: "What simple instrument announced recess and morning assembly at school?",
    options: ["Ringing brass school bell", "Electronic siren", "Fog horn", "Drum kit"],
    correctAnswer: "Ringing brass school bell",
    voiceMessage: "The clear chime of the brass bell marked happy mornings of learning and laughter.",
  },
  {
    name: "Kaziranga Nature Excursion",
    relation: "Wildlife Wonder",
    avatar: "🦏",
    detail: "Spotting the majestic one-horned rhinoceros peacefully grazing in morning mist.",
    question: "Which iconic gentle giant did you observe in Kaziranga National Park?",
    options: ["Great Indian One-horned Rhinoceros", "Polar Bear", "African Giraffe", "Penguin"],
    correctAnswer: "Great Indian One-horned Rhinoceros",
    voiceMessage: "The golden elephant grass and peaceful wildlife filled everyone with awe.",
  },
  {
    name: "Grandmother's Handwoven Shawl",
    relation: "Priceless Heirlooms",
    avatar: "🧣",
    detail: "Woven on a traditional wooden handloom with red butterfly motifs.",
    question: "What motifs were intricately woven into grandmother's red shawl?",
    options: ["Delicate butterfly and lotus motifs", "Printed logos", "Checkered squares", "Plain plastic"],
    correctAnswer: "Delicate butterfly and lotus motifs",
    voiceMessage: "Wrapping the warm handwoven shawl feels like a loving embrace from grandmother.",
  },
  {
    name: "Golden Family Reunion",
    relation: "Whole Family Together",
    avatar: "👨‍👩‍👧‍👦",
    detail: "All four generations gathered around the big dining table laughing and sharing memories.",
    question: "What is the greatest blessing of the golden family reunion?",
    options: ["All generations gathered in love, health, and harmony", "Fast food only", "Arguments and noise", "Silence"],
    correctAnswer: "All generations gathered in love, health, and harmony",
    voiceMessage: "Surrounded by children, grandchildren, and dear siblings is life's sweetest treasure.",
  },
];

export function FamilyPhotoMemory({
  onComplete,
  level = 1,
  memoryCues = [],
  cycleNumber = 1,
  cycleSeed = 0,
  adaptiveDifficulty = "medium",
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  memoryCues?: MemoryCue[];
  cycleNumber?: number;
  cycleSeed?: number;
  adaptiveDifficulty?: string;
  nerState?: string;
}) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  // Merge Personal Memory Bank cues if available and scale across 30 levels
  const activeProfiles = useMemo(() => {
    const customProfiles: FamilyProfile[] = memoryCues
      .filter((c) => ["person", "family_member", "child", "friend", "home", "place", "village"].includes(c.category))
      .map((c) => ({
        name: c.title,
        relation: c.category === "home" || c.category === "place" || c.category === "village" ? "Beloved Place" : "Family Member",
        avatar: c.category === "home" || c.category === "place" || c.category === "village" ? "🏡" : "👵",
        detail: c.detail,
        question: `Do you recognize this cherished personal memory: ${c.title}?`,
        options: [c.title, "Temple Visit", "Hospital Visit", "Shopping Market"],
        correctAnswer: c.title,
        voiceMessage: c.detail,
      }));

    const pool = customProfiles.length > 0 ? [...customProfiles, ...DEFAULT_FAMILY_PROFILES] : DEFAULT_FAMILY_PROFILES;
    // For level L in [1..30], pick 2 profiles by offset (permuted by 8-Day Cycle)
    const cycleOffset = (cycleNumber - 1) * 3;
    const offset = ((level - 1) * 2 + cycleOffset) % pool.length;
    return [pool[offset], pool[(offset + 1) % pool.length]];
  }, [memoryCues, level, cycleNumber]);

  const current = activeProfiles[currentIdx];

  const playVoiceMessage = () => {
    if (!current?.voiceMessage || isPlayingVoice) return;
    setIsPlayingVoice(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(current.voiceMessage);
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingVoice(false), 2500);
    }
  };

  const handleNext = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsPlayingVoice(false);

    const isCorrect = selected === current?.correctAnswer;
    const nextScore = score + (isCorrect ? 1 : 0);
    if (isCorrect) setScore(nextScore);

    setSelected(null);
    if (currentIdx + 1 < activeProfiles.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setIsFinished(true);
      const elapsedMs = Math.max(2000, Date.now() - startTimeRef.current);
      const accuracy = Math.round((nextScore / activeProfiles.length) * 100);
      onComplete(nextScore, activeProfiles.length, {
        gameType: "recognition",
        accuracy,
        responseTimeMs: Math.round(elapsedMs / activeProfiles.length),
        attempts: activeProfiles.length,
        errors: activeProfiles.length - nextScore,
      });
    }
  };

  if (!current) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 6: Family Photo & Memory Recall (Level {level})</h3>
          <p className="text-sm text-muted-foreground">Reconnect with familiar faces, personal places, and loved ones.</p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
          Card {currentIdx + 1} / {activeProfiles.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <Users className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">Beautiful memories!</h4>
          <p className="text-lg text-muted-foreground">
            You recognized {score} of {activeProfiles.length} family profiles and personal memories with warmth.
          </p>
          <Button
            size="lg"
            onClick={() => {
              setCurrentIdx(0);
              setSelected(null);
              setScore(0);
              setIsFinished(false);
              startTimeRef.current = Date.now();
            }}
            className="gap-2 font-bold px-8 cursor-pointer"
          >
            <RotateCcw className="h-5 w-5" /> Play Again
          </Button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
            <div className="w-28 h-28 rounded-full bg-primary/10 border-4 border-primary/20 mx-auto flex items-center justify-center text-6xl shadow-inner">
              {current.avatar}
            </div>
            <h4 className="text-xl font-bold text-foreground">{current.question}</h4>
            <p className="text-sm text-muted-foreground italic">"{current.detail}"</p>

            {/* Voice Message playback option */}
            {current.voiceMessage && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={playVoiceMessage}
                  className={`rounded-2xl gap-2 text-xs font-bold cursor-pointer ${
                    isPlayingVoice ? "bg-primary text-primary-foreground animate-pulse" : "text-primary border-primary/30"
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                  {isPlayingVoice ? "Playing Voice Message..." : "Hear Voice Message 🔊"}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {current.options.map((opt, idx) => {
                const isSelected = selected === opt;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelected(opt)}
                    className={`p-4 rounded-2xl border-2 font-bold text-base transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="lg" disabled={!selected} onClick={handleNext} className="px-8 font-bold cursor-pointer">
              {currentIdx + 1 === activeProfiles.length ? "Finish Recall" : "Next Face"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
