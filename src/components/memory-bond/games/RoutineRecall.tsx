import { useState, useMemo } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoutineQuestion {
  question: string;
  options: string[];
  correct: number;
  reflection: string;
}

const ALL_ROUTINE_QUESTIONS: RoutineQuestion[] = [
  {
    question: "Daily Sequence: Wake up ➔ Brush teeth ➔ Breakfast ➔ What comes right after breakfast?",
    options: ["Morning Medicine & Water", "Running a marathon", "Going to deep sleep", "Skipping the day"],
    correct: 0,
    reflection: "Taking scheduled medicine right after breakfast ensures your stomach is protected and comfortable!",
  },
  {
    question: "What is typically the healthiest thing to drink right after waking up in the morning?",
    options: ["A warm glass of water or lemon water", "Cold soda with ice", "Heavy sugary syrup", "Direct bitter medicine"],
    correct: 0,
    reflection: "Warm water gently awakens your digestive system and hydrates your brain!",
  },
  {
    question: "When taking morning blood pressure tablets, what is recommended?",
    options: ["Skip whenever you feel fine", "Take consistently around the same time after breakfast", "Only take at midnight", "Take 4 tablets at once"],
    correct: 1,
    reflection: "Consistency at the same time each morning keeps blood pressure smooth and steady.",
  },
  {
    question: "When is the most pleasant and safe time for a gentle outdoor walk in the garden?",
    options: ["During peak hot midday sun", "Pleasant early morning or mild evening breeze", "In pitch darkness without lights", "During heavy thunderstorms"],
    correct: 1,
    reflection: "Early morning or mild evening walks give fresh oxygen and keep joints flexible.",
  },
  {
    question: "After returning from your gentle evening walk, what is the best routine step?",
    options: ["Drink a glass of water and rest calmly", "Eat heavy oily food immediately", "Do heavy lifting", "Skip dinner entirely"],
    correct: 0,
    reflection: "Hydrating and resting after walking lets heart rate settle gently.",
  },
  {
    question: "Before preparing for sleep at night, which habit promotes peaceful rest?",
    options: ["Watching loud screens in the dark", "Dimming the lights and reflecting calmly", "Drinking strong coffee", "Checking stressful news"],
    correct: 1,
    reflection: "Dimming lights and quiet reflection helps the brain transition naturally to rejuvenating sleep.",
  },
  {
    question: "For a nutritious lunch, what gives gentle sustained energy for the afternoon?",
    options: ["Balanced meal with steamed rice, dal, and fresh vegetables", "Only raw spices", "Heavy deep-fried pastries", "Skipping lunch entirely"],
    correct: 0,
    reflection: "Warm dal, rice, and fresh vegetables provide fiber, vitamins, and comfortable digestion.",
  },
  {
    question: "When reading your holy book or morning newspaper, what protects eyesight?",
    options: ["Reading in dim moonlight", "Ensuring comfortable, bright natural lighting", "Holding paper 2 inches from eyes", "Staring into direct strobe lights"],
    correct: 1,
    reflection: "Good, glare-free natural lighting prevents eye strain and headaches.",
  },
  {
    question: "What is a wonderful afternoon practice to preserve cherished life memories?",
    options: ["Recording thoughts or stories in your Memory Journal", "Throwing away old photo albums", "Isolating completely in silence", "Worrying about the past"],
    correct: 0,
    reflection: "Writing or speaking reflections keeps memories vivid and brings gratitude.",
  },
  {
    question: "How often should you take sips of water during the day to stay well hydrated?",
    options: ["Only once every two days", "A few sips every 1 to 2 hours", "Only when extremely dizzy", "Never drink water"],
    correct: 1,
    reflection: "Regular sips keep blood circulation smooth and brain cells refreshed.",
  },
  {
    question: "What type of footwear prevents slips and falls inside the home?",
    options: ["Slippery plastic soles", "Anti-skid slippers with good grip", "Walking barefoot on wet tiles", "Loose oversized socks"],
    correct: 1,
    reflection: "Anti-skid soles provide solid balance on tiles and hardwood floors.",
  },
  {
    question: "Before heading to a scheduled doctor consultation, what is most helpful to carry?",
    options: ["Old shopping receipts", "Current prescription, recent reports, and symptom notes", "Empty medicine boxes only", "Heavy luggage"],
    correct: 1,
    reflection: "Keeping current medicines and notes organized helps the doctor provide accurate advice.",
  },
  {
    question: "If you feel a little fatigued after lunch, what is the best restorative routine?",
    options: ["A peaceful 20-minute power rest or gentle nap", "Strenuous aerobic exercise", "Drinking 4 cups of espresso", "Skipping rest for 24 hours"],
    correct: 0,
    reflection: "A brief 20-minute rest recharges mental clarity without disrupting night sleep.",
  },
  {
    question: "During the night, how can you make trips to the bathroom safe and easy?",
    options: ["Leave obstacles on the floor", "Keep a soft hallway nightlight on and floor clear", "Navigate in pitch blackness", "Run quickly in the dark"],
    correct: 1,
    reflection: "A soft nightlight guides footsteps safely without harsh glare.",
  },
  {
    question: "What is a gentle way to keep attention and focus agile every morning?",
    options: ["Playing a relaxing Memory Bond card or puzzle game", "Staring at a blank wall", "Avoiding all mental activity", "Watching stressful commercials"],
    correct: 0,
    reflection: "Short cognitive games stimulate synaptic connections and focus.",
  },
  {
    question: "Connecting with loved ones: what brings warmth and emotional joy to your day?",
    options: ["A pleasant evening phone call with daughter Sunita or son Rajesh", "Ignoring all family calls", "Deleting family photos", "Refusing to talk"],
    correct: 0,
    reflection: "Hearing loved ones' voices releases oxytocin and fosters deep peace.",
  },
  {
    question: "Tending to balcony plants like Tulsi or flowering pots provides:",
    options: ["Fresh air, gentle arm movement, and peaceful nature connection", "Unnecessary burden", "Toxic fumes", "Indoor boredom"],
    correct: 0,
    reflection: "Watering green plants connects us with nature's calming rhythms.",
  },
  {
    question: "When should evening dinner ideally be enjoyed for peaceful sleep?",
    options: ["Right as your head touches the pillow", "At least 2 hours before sleeping", "At 3:00 AM midnight", "Dinner should never be eaten"],
    correct: 1,
    reflection: "Allowing 2 hours for digestion ensures restful, uninterrupted sleep.",
  },
  {
    question: "When should you request a medicine refill from the pharmacy?",
    options: ["When the bottle has been empty for a week", "When 5 to 7 days of medication remain", "Never refill medicines", "After missing 10 doses"],
    correct: 1,
    reflection: "Refilling with 5 days buffer prevents missing essential doses.",
  },
  {
    question: "Listening to gentle classical flute or morning bhajans helps to:",
    options: ["Calm the heartbeat, lower stress, and bring serenity", "Raise blood pressure dangerously", "Cause confusion", "Disrupt peace"],
    correct: 0,
    reflection: "Melodious music lowers cortisol and brings mental harmony.",
  },
  {
    question: "Gentle seated joint mobility (ankle rolls, wrist circles) does what?",
    options: ["Lubricates joints and improves circulation safely", "Breaks bones", "Causes sudden exhaustion", "Has zero benefit"],
    correct: 0,
    reflection: "Gentle rotations keep stiffness away and support walking comfort.",
  },
  {
    question: "On a warm summer afternoon, what precaution is essential?",
    options: ["Wear heavy dark woolens", "Stay in the shade, wear light cotton, and drink water", "Sit under direct blazing midday sun", "Avoid fluids"],
    correct: 1,
    reflection: "Light cotton and hydration prevent overheating and dehydration.",
  },
  {
    question: "During cool winter mornings in the North East, what brings healthy comfort?",
    options: ["Stepping out without clothes", "A warm shawl and a cup of ginger tulsi tea", "Drinking ice cubes", "Cold bath in the wind"],
    correct: 1,
    reflection: "Warm layers and ginger tea protect the chest and throat.",
  },
  {
    question: "Where is the best place to keep reading glasses and house keys?",
    options: ["Randomly hidden under heavy furniture", "In a designated wooden tray or key holder always in the same spot", "In the trash bin", "Lost behind cushions"],
    correct: 1,
    reflection: "A consistent spot eliminates searching stress and keeps belongings safe.",
  },
  {
    question: "When feeling rushed or flustered, what is a quick calming practice?",
    options: ["Take 3 to 5 slow, deep belly breaths", "Panic and run around", "Hold breath for 2 minutes", "Scream loudly"],
    correct: 0,
    reflection: "Deep breaths activate the parasympathetic system and restore calm.",
  },
  {
    question: "Sharing traditional stories and recipes with grandchildren like Aarav:",
    options: ["Passes on rich cultural wisdom and deepens family bonds", "Is a waste of time", "Confuses the children", "Causes friction"],
    correct: 0,
    reflection: "Intergenerational storytelling enriches young minds and brings joy.",
  },
  {
    question: "What is a wholesome evening snack with your warm cup of tea?",
    options: ["A handful of roasted nuts or warm murmura (puffed rice)", "Three bars of sweet chocolate", "Stale oily leftovers", "Salty chips only"],
    correct: 0,
    reflection: "Light puffed rice or nuts provide healthy crunch without heaviness.",
  },
  {
    question: "If feeling unwell or dizzy, what is the first safety action?",
    options: ["Sit down comfortably and press the Red SOS Button to alert family", "Try to climb stairs quickly", "Hide the feeling from everyone", "Drive a car"],
    correct: 0,
    reflection: "Sitting prevents falls, and the SOS button immediately alerts caregivers.",
  },
  {
    question: "A short 10-minute indoor stroll in the living room after dinner helps:",
    options: ["Smooth digestion and relaxes leg muscles before bed", "Causes stomach upset", "Prevents sleeping forever", "Is dangerous"],
    correct: 0,
    reflection: "A leisurely gentle stroll aids gastrointestinal transit and calms the body.",
  },
  {
    question: "True cognitive wellness and longevity comes from:",
    options: ["A harmonious balance of timely medicine, restful sleep, hydration, and cheerful thoughts", "Stress, worry, and skipping meals", "Complete isolation", "Never talking to family"],
    correct: 0,
    reflection: "Harmonious daily habits nurture mind, body, and spirit beautifully!",
  },
];

export function RoutineRecall({
  onComplete,
  level = 1,
  cycleNumber = 1,
  cycleSeed = 0,
  adaptiveDifficulty = "medium",
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  cycleNumber?: number;
  cycleSeed?: number;
  adaptiveDifficulty?: string;
  nerState?: string;
  memoryCues?: any[];
}) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);

  // Each level selects 2 distinct questions (permuted by 8-Day Cycle)
  const activeQuestions = useMemo(() => {
    const cycleOffset = (cycleNumber - 1) * 7;
    const base = ((level - 1) * 2 + cycleOffset) % ALL_ROUTINE_QUESTIONS.length;
    return [
      ALL_ROUTINE_QUESTIONS[base],
      ALL_ROUTINE_QUESTIONS[(base + 1) % ALL_ROUTINE_QUESTIONS.length],
    ];
  }, [level, cycleNumber]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const startTimeRef = useState<{ current: number }>({ current: Date.now() })[0];

  const currentQ = activeQuestions[currentIdx];

  if (!currentQ) return null;

  const handleSelect = (idx: number) => {
    setSelectedOpt(idx);
  };

  const handleNext = () => {
    const isCorrect = selectedOpt === currentQ.correct;
    const nextScore = score + (isCorrect ? 1 : 0);
    if (isCorrect) {
      setScore(nextScore);
    } else {
      setMistakes((m) => m + 1);
    }
    setSelectedOpt(null);
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      const elapsedMs = Math.max(1200, Date.now() - startTimeRef.current);
      const calculatedAcc = Math.round((nextScore / activeQuestions.length) * 100);
      setIsFinished(true);
      onComplete(nextScore, activeQuestions.length, {
        gameType: "recall",
        accuracy: calculatedAcc,
        responseTimeMs: elapsedMs,
        attempts: activeQuestions.length + mistakes,
        errors: mistakes + (isCorrect ? 0 : 1),
      });
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 5: Daily Routine Recall</h3>
          <p className="text-sm text-muted-foreground">Calm questions to reinforce peaceful, healthy daily habits.</p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
          Question {currentIdx + 1} / {activeQuestions.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <Heart className="mx-auto h-16 w-16 text-success fill-success/20" />
          <h4 className="text-3xl font-extrabold text-foreground">Heartwarming effort!</h4>
          <p className="text-lg text-muted-foreground">
            You completed the routine reflection with {score} / {activeQuestions.length} thoughtful answers.
          </p>
          <Button
            size="lg"
            onClick={() => {
              setCurrentIdx(0);
              setSelectedOpt(null);
              setScore(0);
              setIsFinished(false);
            }}
            className="gap-2 font-bold px-8"
          >
            <RotateCcw className="h-5 w-5" /> Review Again
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h4 className="text-xl font-bold text-foreground leading-relaxed mb-6">
              {currentQ.question}
            </h4>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-medium text-base ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/30 hover:bg-secondary/60 border-border"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={selectedOpt === null}
              onClick={handleNext}
              className="px-8 font-bold"
            >
              {currentIdx + 1 === activeQuestions.length ? "Finish Activity" : "Next Question"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
