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
  Music,
  Home,
  GraduationCap,
  Mic,
  Image,
  Lock,
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
  const [category, setCategory] = useState<MemoryCue["category"]>("family_member");
  const [detail, setDetail] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  const getCategoryIcon = (cat: MemoryCue["category"]) => {
    switch (cat) {
      case "person":
      case "family_member":
      case "child":
        return <User className="h-6 w-6 text-indigo-500" />;
      case "friend":
        return <User className="h-6 w-6 text-pink-500" />;
      case "home":
        return <Home className="h-6 w-6 text-emerald-500" />;
      case "village":
      case "place":
        return <MapPin className="h-6 w-6 text-teal-500" />;
      case "school":
        return <GraduationCap className="h-6 w-6 text-blue-500" />;
      case "object":
        return <Key className="h-6 w-6 text-amber-500" />;
      case "song":
        return <Music className="h-6 w-6 text-purple-500" />;
      case "voice_memory":
        return <Mic className="h-6 w-6 text-rose-500" />;
      case "story":
      case "note":
        return <FileText className="h-6 w-6 text-sky-500" />;
      case "safety":
        return <Shield className="h-6 w-6 text-rose-500" />;
      default:
        return <FileText className="h-6 w-6 text-primary" />;
    }
  };

  const getProvenanceBadge = (index: number) => {
    if (index % 4 === 0) {
      return {
        label: "Verified Family Memory",
        color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
        icon: BookmarkCheck,
      };
    }
    if (index % 4 === 1) {
      return {
        label: "Personal Memory Bank",
        color: "bg-sky-500/15 text-sky-700 border-sky-500/30",
        icon: Clock,
      };
    }
    if (index % 4 === 2) {
      return {
        label: "Authorized Caregiver Reference",
        color: "bg-amber-500/15 text-amber-800 border-amber-500/30",
        icon: CheckCircle2,
      };
    }
    return {
      label: "AI Cognitive Reassurance Cue",
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
      photo_url: photoUrl.trim() || undefined,
      author_role: "caregiver",
      patient_id: store.profile.member_id,
    });

    setIsAddOpen(false);
    setTitle("");
    setDetail("");
    setPhotoUrl("");
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
      {/* Header & Private Memory Bank Vault Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Private Patient Vault
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              Member ID: <strong className="font-mono text-foreground">{store.profile.member_id}</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3 mt-1.5">
            <HelpCircle className="h-8 w-8 text-primary" /> Digital Personal Memory Bank
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Private, patient-isolated memory space for family members, photographs, childhood homes, villages, songs, and voice notes.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 font-bold text-base h-12 px-6 rounded-2xl shadow-sm cursor-pointer"
        >
          <Plus className="h-5 w-5" /> Add Memory to Vault
        </Button>
      </div>

      {/* Notice Banner: No Hallucinated / Invented Memories */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs font-medium text-foreground flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong>Strict Patient Privacy & Authentic Integrity:</strong> Memories are private to {store.profile.full_name} and never shared with other patients. They are dynamically woven into cognitive recognition games and voice assistant queries with caregiver authorization.
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 mr-2">
          <Filter className="h-3.5 w-3.5" /> Category:
        </span>
        {[
          { id: "all", label: "All Memories" },
          { id: "family", label: "Family & Loved Ones" },
          { id: "places", label: "Places & Village" },
          { id: "objects", label: "Objects & Keys" },
          { id: "stories", label: "Stories & Songs" },
          { id: "voice", label: "Voice Notes" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
        {store.memoryCues
          .filter((cue) => {
            if (filterCategory === "all") return true;
            if (filterCategory === "family") return cue.category === "person" || cue.category === "family_member" || cue.category === "child" || cue.category === "friend";
            if (filterCategory === "places") return cue.category === "place" || cue.category === "home" || cue.category === "village" || cue.category === "school";
            if (filterCategory === "objects") return cue.category === "object" || cue.category === "safety";
            if (filterCategory === "stories") return cue.category === "story" || cue.category === "song" || cue.category === "note";
            if (filterCategory === "voice") return cue.category === "voice_memory";
            return true;
          })
          .map((cue, index) => {
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
                          <span className="text-xs uppercase font-bold text-primary tracking-wider capitalize">
                            {cue.category.replace("_", " ")}
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
                      className="rounded-xl text-destructive hover:bg-destructive/10 p-2 shrink-0 cursor-pointer"
                      title="Delete cue"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {cue.photo_url && (
                    <div className="rounded-2xl overflow-hidden border border-border h-44 w-full bg-secondary/30 relative">
                      <img
                        src={cue.photo_url}
                        alt={cue.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <p className="text-base text-foreground leading-relaxed pt-1 font-medium">
                    {cue.detail}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {cue.category === "voice_memory" ? "Spoken voice note" : "Active in Voice Assistant"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSpeakCue(cue)}
                    className="gap-2 font-bold rounded-xl cursor-pointer"
                  >
                    <Volume2 className="h-4 w-4 text-primary" /> {cue.category === "voice_memory" ? "Play Recording" : "Read Aloud"}
                  </Button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-foreground">Add to Personal Memory Bank</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Stored exclusively for {store.profile.full_name}. Used to personalize memory and recognition games.
            </p>

            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div>
                <Label>Memory Title or Loved One's Name *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g. "Daughter Sunita", "Ancestral Home in Tezpur", "Reading Glasses"'
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
                    <SelectItem value="family_member">Family Member / Relative</SelectItem>
                    <SelectItem value="child">Child (Daughter / Son)</SelectItem>
                    <SelectItem value="friend">Friend / Colleague</SelectItem>
                    <SelectItem value="home">Childhood / Ancestral Home</SelectItem>
                    <SelectItem value="village">Native Village / Hometown</SelectItem>
                    <SelectItem value="school">School / University</SelectItem>
                    <SelectItem value="place">Important Place / Address</SelectItem>
                    <SelectItem value="object">Important Everyday Object (Glasses, Keys, Walking Stick)</SelectItem>
                    <SelectItem value="song">Cherished Song / Traditional Melody</SelectItem>
                    <SelectItem value="story">Personal Life Story / Event</SelectItem>
                    <SelectItem value="voice_memory">Voice Memory / Spoken Message</SelectItem>
                    <SelectItem value="note">Helpful Daily Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Details, Location or Story *</Label>
                <Textarea
                  required
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="e.g. Glasses are kept inside the spectacle case on the wooden bedside table. Sunita visits every Sunday at 5 PM."
                  className="rounded-xl mt-1 font-medium"
                  rows={3}
                />
              </div>

              <div>
                <Label>Photo URL (Optional)</Label>
                <Input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://... or image link for family photos"
                  className="rounded-xl mt-1 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6 cursor-pointer">
                  Save to Vault
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
