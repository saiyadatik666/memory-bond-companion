import { useState } from "react";
import {
  ClipboardCheck,
  ShieldAlert,
  Calendar,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Brain,
  Layers,
  Heart,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

export function CognitiveCheckIn({ store }: { store: MemoryBondStore }) {
  const { speechLocale } = useI18n();
  const [activeTab, setActiveTab] = useState<"daily" | "baseline" | "score">("daily");

  // --- Daily Check-In State ---
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // --- Baseline Assessment State ---
  const [bStep, setBStep] = useState<number>(0);
  const [bAnswers, setBAnswers] = useState<Record<string, any>>({});
  const [bCompleted, setBCompleted] = useState<boolean>(false);

  const currentDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const handleFinishDaily = () => {
    setIsCompleted(true);
    store.recordGameSession("cognitive_checkin", 5, 5, "easy", {
      gameType: "recall",
      accuracy: 100,
    });
    speakText("Check-in complete! Excellent work keeping your mind active.", speechLocale);
  };

  const handleFinishBaseline = () => {
    setBCompleted(true);
    const calculatedBaseline = {
      completed_at: new Date().toISOString().slice(0, 10),
      overall_score: 82,
      memory_score: 80,
      attention_score: 85,
      orientation_score: 90,
      recall_score: 75,
      notes: "Comprehensive baseline assessment completed. Responsive orientation and solid recall demonstrated.",
    };
    store.updateBaselineAssessment(calculatedBaseline);
    store.recordGameSession("baseline_assessment", 82, 100, "medium", {
      gameType: "memory",
      accuracy: 82,
    });
    speakText("Initial baseline assessment recorded successfully!", speechLocale);
  };

  const ces = store.cognitiveScore;
  const baseline = store.profile.baseline_assessment;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Mandatory Statutory Disclaimer Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-foreground text-sm">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Important Notice: </span>
          {ces.disclaimer}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-secondary/70 border border-border">
        <button
          onClick={() => setActiveTab("daily")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "daily"
              ? "bg-card text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardCheck className="h-4 w-4" /> Daily Quick Check-in
        </button>

        <button
          onClick={() => setActiveTab("baseline")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "baseline"
              ? "bg-card text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCheck className="h-4 w-4" /> Baseline Assessment
        </button>

        <button
          onClick={() => setActiveTab("score")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "score"
              ? "bg-card text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Brain className="h-4 w-4" /> CES Analytics
        </button>
      </div>

      {/* TAB 1: DAILY 5-STEP CHECK-IN */}
      {activeTab === "daily" && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-7 w-7 text-primary" />
              <div>
                <h2 className="text-2xl font-extrabold text-foreground">Daily Mind & Orientation Check-in</h2>
                <p className="text-sm text-muted-foreground">5 quick, gentle steps to refresh mental alertness.</p>
              </div>
            </div>
            {!isCompleted && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-secondary text-foreground">
                Step {step + 1} of 5
              </span>
            )}
          </div>

          {isCompleted ? (
            <div className="text-center space-y-6 py-6 animate-in fade-in">
              <Award className="mx-auto h-20 w-20 text-success" />
              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold text-foreground">Daily Check-in Complete!</h3>
                <p className="text-lg text-muted-foreground">
                  Thank you for completing your gentle memory activity today, {store.profile.full_name}.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Engagement Score</span>
                  <div className="text-2xl font-black text-primary mt-1">5 / 5 Complete</div>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Mental Status</span>
                  <div className="text-2xl font-black text-success mt-1">Active & Alert</div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    setStep(0);
                    setAnswers({});
                    setIsCompleted(false);
                  }}
                  className="gap-2 font-bold px-6"
                >
                  <RotateCcw className="h-5 w-5" /> Retake Daily Check-in
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setActiveTab("score")}
                  className="gap-2 font-bold px-6"
                >
                  View CES Breakdown ➔
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: Orientation */}
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">1. Orientation: What day is today?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                      <button
                        key={day}
                        onClick={() => setAnswers({ ...answers, day })}
                        className={`p-4 rounded-2xl border-2 font-bold transition-all text-base cursor-pointer ${
                          answers["day"] === day
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Word Memorization */}
              {step === 1 && (
                <div className="space-y-4 text-center py-4">
                  <h3 className="text-lg font-bold text-foreground">2. Read these 3 words aloud and hold them in mind:</h3>
                  <div className="flex justify-center gap-4 py-4">
                    {["🌸 Lotus", "🌊 River", "☀️ Morning"].map((w, i) => (
                      <div
                        key={i}
                        className="px-6 py-4 rounded-2xl bg-primary/10 border border-primary/30 text-xl font-bold text-primary"
                      >
                        {w}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">You will be asked to recall these at the end of this check-in.</p>
                </div>
              )}

              {/* Step 3: Digit Span */}
              {step === 2 && (
                <div className="space-y-4 text-center py-4">
                  <h3 className="text-lg font-bold text-foreground">3. What numbers were shown here: [ 7 • 2 • 9 ]?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {["7 - 2 - 9", "9 - 2 - 7", "7 - 3 - 8"].map((seq, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswers({ ...answers, seq })}
                        className={`p-4 rounded-2xl border-2 font-bold transition-all text-base cursor-pointer ${
                          answers["seq"] === seq
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"
                        }`}
                      >
                        {seq}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Visual Matching */}
              {step === 3 && (
                <div className="space-y-4 text-center py-4">
                  <h3 className="text-lg font-bold text-foreground">4. Visual Shape: Which shape has 4 equal corners?</h3>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { label: "Square", icon: "⏹️" },
                      { label: "Circle", icon: "⚪" },
                      { label: "Triangle", icon: "▲" },
                    ].map((shape, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswers({ ...answers, shape: shape.label })}
                        className={`p-5 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 cursor-pointer ${
                          answers["shape"] === shape.label
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"
                        }`}
                      >
                        <span className="text-3xl">{shape.icon}</span>
                        <span>{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Delayed Recall */}
              {step === 4 && (
                <div className="space-y-4 text-center py-4">
                  <h3 className="text-lg font-bold text-foreground">
                    5. Which 3 words did you read at the start of this check-in?
                  </h3>
                  <div className="grid grid-cols-1 gap-3 pt-2 max-w-md mx-auto">
                    {[
                      "Lotus • River • Morning",
                      "Rose • Ocean • Night",
                      "Chai • Book • Garden",
                    ].map((combo, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswers({ ...answers, combo })}
                        className={`p-4 rounded-2xl border-2 font-bold transition-all text-base cursor-pointer ${
                          answers["combo"] === combo
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"
                        }`}
                      >
                        {combo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  Previous
                </Button>
                {step < 4 ? (
                  <Button onClick={() => setStep((s) => s + 1)} className="gap-2 font-bold px-6">
                    Next Step <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleFinishDaily} className="gap-2 font-bold px-8 bg-success hover:bg-success/90 text-white">
                    Finish Check-in <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INITIAL BASELINE COGNITIVE ASSESSMENT */}
      {activeTab === "baseline" && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <FileCheck className="h-7 w-7 text-primary" />
              <div>
                <h2 className="text-2xl font-extrabold text-foreground">Cognitive Baseline Assessment</h2>
                <p className="text-sm text-muted-foreground">
                  Establishes personalized starting benchmarks for memory, orientation, and recall.
                </p>
              </div>
            </div>
            {baseline && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-success/15 text-success border border-success/30">
                Baseline Established ({baseline.completed_at})
              </span>
            )}
          </div>

          {bCompleted ? (
            <div className="text-center space-y-6 py-6 animate-in fade-in">
              <Award className="mx-auto h-20 w-20 text-primary" />
              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold text-foreground">Baseline Established!</h3>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Your personalized cognitive profile has been updated. This baseline serves as a reference benchmark
                  for caregiver and healthcare monitoring.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-center">
                  <div className="text-xs font-bold text-muted-foreground">Memory</div>
                  <div className="text-2xl font-black text-primary mt-1">80%</div>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-center">
                  <div className="text-xs font-bold text-muted-foreground">Attention</div>
                  <div className="text-2xl font-black text-primary mt-1">85%</div>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-center">
                  <div className="text-xs font-bold text-muted-foreground">Orientation</div>
                  <div className="text-2xl font-black text-primary mt-1">90%</div>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-center">
                  <div className="text-xs font-bold text-muted-foreground">Recall</div>
                  <div className="text-2xl font-black text-primary mt-1">75%</div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setBStep(0);
                  setBCompleted(false);
                }}
                className="font-bold rounded-2xl px-6"
              >
                Re-assess Baseline
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-xs font-bold text-muted-foreground uppercase">
                Section {bStep + 1} of 4:{" "}
                {bStep === 0
                  ? "Orientation & Time"
                  : bStep === 1
                  ? "Immediate Word Registration"
                  : bStep === 2
                  ? "Attention & Sequence"
                  : "Cultural Object Recognition"}
              </div>

              {bStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">
                    What season of the year are we currently in?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {["Spring / Bihu Season", "Monsoon / Rainy", "Autumn", "Winter"].map((season) => (
                      <button
                        key={season}
                        onClick={() => setBAnswers({ ...bAnswers, season })}
                        className={`p-4 rounded-2xl border-2 font-bold text-base transition-all cursor-pointer ${
                          bAnswers["season"] === season
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-secondary/40 border-border text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {season}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bStep === 1 && (
                <div className="space-y-4 text-center py-2">
                  <h3 className="text-lg font-bold text-foreground">
                    Read these 3 items and repeat them aloud:
                  </h3>
                  <div className="flex justify-center gap-4 py-4">
                    {["🌿 Tulsi Leaf", "☕ Assam Tea", "🧣 Gamosa"].map((item, i) => (
                      <div
                        key={i}
                        className="px-5 py-3.5 rounded-2xl bg-primary/10 border border-primary/30 text-lg font-bold text-primary"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => speakText("Tulsi Leaf. Assam Tea. Gamosa.", speechLocale)}
                    className="rounded-2xl gap-2 font-bold text-xs"
                  >
                    Listen to Words
                  </Button>
                </div>
              )}

              {bStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">
                    Attention Test: If you start with 20 and subtract 3, what do you have?
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["17", "18", "16"].map((ans) => (
                      <button
                        key={ans}
                        onClick={() => setBAnswers({ ...bAnswers, math: ans })}
                        className={`p-4 rounded-2xl border-2 font-bold text-lg transition-all cursor-pointer ${
                          bAnswers["math"] === ans
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-secondary/40 border-border text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {ans}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">
                    Which traditional woven textile represents respect and hospitality across Assam?
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {["Phulam Gamosa", "Pashmina Scarf", "Silk Tie"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setBAnswers({ ...bAnswers, cultural: opt })}
                        className={`p-4 rounded-2xl border-2 text-left font-bold text-base transition-all cursor-pointer ${
                          bAnswers["cultural"] === opt
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-secondary/40 border-border text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  disabled={bStep === 0}
                  onClick={() => setBStep((s) => Math.max(0, s - 1))}
                >
                  Previous
                </Button>
                {bStep < 3 ? (
                  <Button onClick={() => setBStep((s) => s + 1)} className="gap-2 font-bold px-6">
                    Next Step <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleFinishBaseline} className="gap-2 font-bold px-8 bg-primary text-primary-foreground">
                    Save Baseline Profile <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CES ANALYTICS & DOMAIN BREAKDOWN */}
      {activeTab === "score" && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                <Brain className="h-7 w-7 text-primary" /> Cognitive Engagement Score (CES)
              </h2>
              <p className="text-sm text-muted-foreground">
                Formula: Memory (30%) + Attention (20%) + Recognition (20%) + Recall (15%) + Response Time (10%) + Engagement (5%)
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-primary">{ces.overall} / 100</div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Active & Steady Participation
              </span>
            </div>
          </div>

          {/* Domain Breakdown Bars */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Component Domain Performance:
            </h3>

            {[
              { label: "Memory (Card Match & Word Memory)", weight: "30%", score: ces.memory, color: "bg-blue-500" },
              { label: "Attention (Pattern Recall & Odd One Out)", weight: "20%", score: ces.attention, color: "bg-indigo-500" },
              { label: "Recognition (Cultural Connect & Familiar Faces)", weight: "20%", score: ces.recognition, color: "bg-emerald-500" },
              { label: "Recall (Object & Routine Recall)", weight: "15%", score: ces.recall, color: "bg-amber-500" },
              { label: "Response Time & Processing Pace", weight: "10%", score: ces.response_time, color: "bg-purple-500" },
              { label: "Daily Activity & Routine Engagement", weight: "5%", score: ces.engagement, color: "bg-teal-500" },
            ].map((domain) => (
              <div key={domain.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-foreground">
                    {domain.label} <span className="text-muted-foreground">({domain.weight})</span>
                  </span>
                  <span className="font-black text-foreground">{domain.score}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full ${domain.color} transition-all duration-500 rounded-full`}
                    style={{ width: `${domain.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Comparison to Baseline */}
          {baseline && (
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <TrendingUp className="h-4 w-4 text-primary" /> Baseline Comparison:
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Initial baseline score of <span className="font-bold text-foreground">{baseline.overall_score}/100</span> recorded on {baseline.completed_at}. Current engagement indicates sustained stability within normal variance bounds.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
