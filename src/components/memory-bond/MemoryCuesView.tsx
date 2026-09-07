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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MemoryBondStore, MemoryCue } from "@/lib/memoryBondStore";
import { speakText } from "@/lib/voiceParser";

export function MemoryCuesView({ store }: { store: MemoryBondStore }) {
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
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
    speakText(`${cue.title}. ${cue.detail}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" /> Memory Cues & Familiar Notes
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Quick reassuring references for family names, key locations, addresses, and daily instructions.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold text-base h-12 px-6 rounded-2xl">
          <Plus className="h-5 w-5" /> Add Memory Cue
        </Button>
      </div>

      {/* Cues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {store.memoryCues.map((cue) => (
          <div
            key={cue.id}
            className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                    {getCategoryIcon(cue.category)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{cue.title}</h3>
                    <span className="text-xs uppercase font-bold text-primary tracking-wider">
                      {cue.category} Reference
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => store.deleteMemoryCue(cue.id)}
                  className="rounded-xl text-destructive hover:bg-destructive/10 p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-base text-foreground leading-relaxed pt-2 font-medium">
                {cue.detail}
              </p>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
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
        ))}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Add New Memory Cue</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Cue Question or Title *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g. "Where are my house keys?" or "My daughter Sunita"'
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                  <SelectTrigger className="rounded-xl mt-1">
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
                  placeholder="e.g. Keys are kept on the small hook beside the entrance shoe cabinet."
                  className="rounded-xl mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">
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
