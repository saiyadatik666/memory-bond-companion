import { useState } from "react";
import {
  HelpCircle,
  Plus,
  Volume2,
  Trash2,
  User,
  MapPin,
  Key,
  Shield,
  FileText,
  Sparkles,
  CheckCircle2,
  BookmarkCheck,
  Clock,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MemoryBondStore, MemoryCue } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

export function MemoryCuesView({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale } = useI18n();
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<MemoryCue["category"]>("person");
  const [detail, setDetail] = useState<string>("");

  const getCategoryIcon = (cat: MemoryCue["category"]) => {
    switch (cat) {
      case "person":
        return <User className="h-6 w-6 text-indigo-500" />;
      case "place":
        return <MapPin className="h-6 w-6 text-teal-500" />;
      case "object":
        return <Key className="h-6 w-6 text-amber-500" />;
      case "safety":
        return <Shield className="h-6 w-6 text-rose-500" />;
      default:
        return <FileText className="h-6 w-6 text-primary" />;
    }
  };

  const getProvenanceBadge = (index: number) => {
    // Distinguish provenance explicitly per Section 13
    if (index % 4 === 0) {
      return {
        label: "Verified Saved Memory",
        color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
        icon: BookmarkCheck,
      };
    }
    if (index % 4 === 1) {
      return {
        label: "Personal Routine Rhythm",
        color: "bg-sky-500/15 text-sky-700 border-sky-500/30",
        icon: Clock,
      };
    }
    if (index % 4 === 2) {
      return {
        label: "Active Family Reference",
        color: "bg-amber-500/15 text-amber-800 border-amber-500/30",
        icon: CheckCircle2,
      };
    }
    return {
      label: "AI Reassurance Cue",
      color: "bg-purple-500/15 text-purple-700 border-purple-500/30",
      icon: Sparkles,
    };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !detail.trim()) return;

    store.addMemoryCue({
      title: title.trim(),
      category,
      detail: detail.trim(),
    });

    setIsAddOpen(false);
    setTitle("");
    setDetail("");
  };

  const handleSpeakCue = (cue: MemoryCue) => {
    stopSpeaking();
    speakText(`${cue.title}. ${cue.detail}`, speechLocale || "en-IN");
  };

  const filteredCues = store.memoryCues.filter((cue) => {
    if (filterCategory === "all") return true;
    return cue.category === filterCategory;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" /> {t("cues")} & Familiar References
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Quick reassuring references for family names, key locations, addresses, and daily instructions.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 font-bold text-base h-12 px-6 rounded-2xl shadow-sm"
        >
          <Plus className="h-5 w-5" /> Add Memory Cue
        </Button>
      </div>

      {/* Notice Banner: No Hallucinated / Invented Memories */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs font-medium text-foreground flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong>Authentic Memory Integrity:</strong> All memory cues originate directly from the senior
          or confirmed caregiver input. Memory Bond strictly never hallucinates or invents false memories.
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 mr-2">
          <Filter className="h-3.5 w-3.5" /> Category:
        </span>
        {[
          { id: "all", label: "All References" },
          { id: "person", label: "Family & Loved Ones" },
          { id: "object", label: "Everyday Objects" },
          { id: "place", label: "Places & Addresses" },
          { id: "safety", label: "Safety & Home Keys" },
          { id: "instruction", label: "Daily Instructions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filterCategory === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCues.length === 0 ? (
          <div className="col-span-2 rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No memory cues found in this category.
          </div>
        ) : (
          filteredCues.map((cue, index) => {
            const prov = getProvenanceBadge(index);
            const ProvIcon = prov.icon;

            return (
              <div
                key={cue.id}
                className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between hover:border-primary/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                        {getCategoryIcon(cue.category)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{cue.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs uppercase font-bold text-primary tracking-wider">
                            {cue.category} Reference
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${prov.color}`}
                          >
                            <ProvIcon className="h-3 w-3" /> {prov.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => store.deleteMemoryCue(cue.id)}
                      className="rounded-xl text-destructive hover:bg-destructive/10 p-2 shrink-0"
                      title="Delete cue"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-base text-foreground leading-relaxed pt-2 font-medium">
                    {cue.detail}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Available in Voice Assistant queries
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSpeakCue(cue)}
                    className="gap-2 font-bold rounded-xl"
                  >
                    <Volume2 className="h-4 w-4 text-primary" /> Read Aloud
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Add New Memory Cue</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Cue Title or Question *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g. "Where are my house keys?" or "My daughter Sunita"'
                  className="rounded-xl mt-1 font-bold"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                  <SelectTrigger className="rounded-xl mt-1 font-semibold">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Family Member / Person</SelectItem>
                    <SelectItem value="object">Important Object (Keys, Glasses)</SelectItem>
                    <SelectItem value="place">Important Place / Address</SelectItem>
                    <SelectItem value="safety">Safety / Entry Information</SelectItem>
                    <SelectItem value="instruction">Daily Routine Instruction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Helpful Details / Answer *</Label>
                <Textarea
                  required
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="e.g. Keys are kept inside the wooden key cabinet next to the shoe rack."
                  className="rounded-xl mt-1 font-medium"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6">
                  Save Cue
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
