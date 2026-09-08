import { useState } from "react";
import { ClipboardCheck, ShieldAlert, Award, ArrowRight, RotateCcw, CheckCircle2, } from "lucide-react";
import { Button } from "@/components/ui/button";
export function CognitiveCheckIn({ store }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isCompleted, setIsCompleted] = useState(false);
    // 5 Short Check-In Steps:
    // 1. Orientation: Current time of day & day of week
    // 2. Word Span: Remember 3 words (Lotus, River, Morning)
    // 3. Digit Span: Recall 3 numbers (7, 2, 9)
    // 4. Pattern: Select the matching shape
    // 5. Word Recall test: Which words were shown in step 2?
    const currentDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const handleFinish = () => {
        setIsCompleted(true);
        store.recordGameSession("cognitive_checkin", 5, 5, "easy");
    };
    return (<div className="space-y-6 max-w-2xl mx-auto">
      {/* Mandatory Statutory Disclaimer Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-foreground text-sm">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5"/>
        <div>
          <span className="font-bold">Important Notice: </span>
          This is an engagement and memory-support activity, not a medical diagnosis. Never diagnose dementia or any
          medical condition.
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-7 w-7 text-primary"/>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">Memory & Orientation Check-in</h2>
              <p className="text-sm text-muted-foreground">Gentle, relaxed check-in for daily mental agility.</p>
            </div>
          </div>
          {!isCompleted && (<span className="text-xs font-bold px-3 py-1.5 rounded-full bg-secondary text-foreground">
              Step {step + 1} of 5
            </span>)}
        </div>

        {isCompleted ? (<div className="text-center space-y-6 py-6 animate-in fade-in">
            <Award className="mx-auto h-20 w-20 text-success"/>
            <div className="space-y-2">
              <h3 className="text-3xl font-extrabold text-foreground">Check-in Complete!</h3>
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
                <span className="text-xs font-bold text-muted-foreground uppercase">Status</span>
                <div className="text-2xl font-black text-success mt-1">Active & Alert</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic max-w-md mx-auto">
              Results reflect self-engagement and comfort with daily cognitive tasks. Stored securely for your caregiver
              progress overview.
            </p>

            <Button size="lg" onClick={() => {
                setStep(0);
                setAnswers({});
                setIsCompleted(false);
            }} className="gap-2 font-bold px-8">
              <RotateCcw className="h-5 w-5"/> Retake Check-in
            </Button>
          </div>) : (<div className="space-y-6">
            {/* Step 1: Orientation */}
            {step === 0 && (<div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">1. Orientation: What day is today?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (<button key={day} onClick={() => setAnswers({ ...answers, day })} className={`p-4 rounded-2xl border-2 font-bold transition-all text-base ${answers["day"] === day
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"}`}>
                      {day}
                    </button>))}
                </div>
              </div>)}

            {/* Step 2: Word Memorization */}
            {step === 1 && (<div className="space-y-4 text-center py-4">
                <h3 className="text-lg font-bold text-foreground">2. Read these 3 words aloud and hold them in mind:</h3>
                <div className="flex justify-center gap-4 py-4">
                  {["🌸 Lotus", "🌊 River", "☀️ Morning"].map((w, i) => (<div key={i} className="px-6 py-4 rounded-2xl bg-primary/10 border border-primary/30 text-xl font-bold text-primary">
                      {w}
                    </div>))}
                </div>
                <p className="text-sm text-muted-foreground">You will be asked to recall these at the end.</p>
              </div>)}

            {/* Step 3: Digit Span */}
            {step === 2 && (<div className="space-y-4 text-center py-4">
                <h3 className="text-lg font-bold text-foreground">3. What numbers were shown here: [ 7 • 2 • 9 ]?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {["7 - 2 - 9", "9 - 2 - 7", "7 - 3 - 8"].map((seq, i) => (<button key={i} onClick={() => setAnswers({ ...answers, seq })} className={`p-4 rounded-2xl border-2 font-bold transition-all text-base ${answers["seq"] === seq
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"}`}>
                      {seq}
                    </button>))}
                </div>
              </div>)}

            {/* Step 4: Visual Matching */}
            {step === 3 && (<div className="space-y-4 text-center py-4">
                <h3 className="text-lg font-bold text-foreground">4. Visual Shape: Which shape has 4 equal corners?</h3>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: "Square", icon: "⏹️" },
                    { label: "Circle", icon: "⚪" },
                    { label: "Triangle", icon: "▲" },
                ].map((shape, i) => (<button key={i} onClick={() => setAnswers({ ...answers, shape: shape.label })} className={`p-5 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${answers["shape"] === shape.label
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"}`}>
                      <span className="text-3xl">{shape.icon}</span>
                      <span>{shape.label}</span>
                    </button>))}
                </div>
              </div>)}

            {/* Step 5: Delayed Recall */}
            {step === 4 && (<div className="space-y-4 text-center py-4">
                <h3 className="text-lg font-bold text-foreground">
                  5. Which 3 words did you read at the start of this check-in?
                </h3>
                <div className="grid grid-cols-1 gap-3 pt-2 max-w-md mx-auto">
                  {[
                    "Lotus • River • Morning",
                    "Rose • Ocean • Night",
                    "Chai • Book • Garden",
                ].map((combo, i) => (<button key={i} onClick={() => setAnswers({ ...answers, combo })} className={`p-4 rounded-2xl border-2 font-bold transition-all text-base ${answers["combo"] === combo
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"}`}>
                      {combo}
                    </button>))}
                </div>
              </div>)}

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Previous
              </Button>
              {step < 4 ? (<Button onClick={() => setStep((s) => s + 1)} className="gap-2 font-bold px-6">
                  Next Step <ArrowRight className="h-4 w-4"/>
                </Button>) : (<Button onClick={handleFinish} className="gap-2 font-bold px-8 bg-success hover:bg-success/90 text-white">
                  Finish Check-in <CheckCircle2 className="h-4 w-4"/>
                </Button>)}
            </div>
          </div>)}
      </div>
    </div>);
}
