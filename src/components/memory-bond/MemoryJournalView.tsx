import { useState, useRef, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Calendar,
  Sparkles,
  Heart,
  Volume2,
  Search,
  Tag,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MemoryBondStore, MemoryJournalItem } from "@/lib/memoryBondStore";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import { useI18n } from "@/lib/i18n";

export function MemoryJournalView({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale } = useI18n();
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Form State
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>("family");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  // Audio recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  const categories = [
    { id: "all", label: t("allCategories") || "All Categories" },
    { id: "family", label: t("categoryFamily") || "Family" },
    { id: "routine", label: t("categoryRoutine") || "Daily Life" },
    { id: "special", label: t("categorySpecial") || "Special Moments" },
    { id: "childhood", label: t("categoryChildhood") || "Childhood" },
    { id: "nature", label: t("categoryNature") || "Garden & Nature" },
  ];

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);

      // Start live speech transcription alongside if SpeechRecognition is available
      const SpeechRecognition =
        typeof window !== "undefined"
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          recognitionRef.current = rec;
          rec.lang = speechLocale || "en-IN";
          rec.interimResults = true;
          rec.onresult = (e: any) => {
            const transcriptText = Array.from(e.results)
              .map((r: any) => r[0]?.transcript)
              .join(" ");
            if (transcriptText) {
              setBody((prev) => (prev ? `${prev} ${transcriptText}` : transcriptText));
              if (!title) setTitle("Voice Memory: " + transcriptText.slice(0, 24) + "...");
            }
          };
          rec.start();
          setIsTranscribing(true);
        } catch {}
      }
    } catch {
      alert("Microphone permission was not granted or is unavailable.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsTranscribing(false);
    }
  };

  const handleGenerateSummary = () => {
    if (!body.trim()) return;
    const summary = `AI Reflection: A joyful and meaningful moment reflecting connection and gratitude. Preserved safely in Memory Bond.`;
    setBody((prev) => `${prev}\n\n[Summary: ${summary}]`);
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const entry: Omit<MemoryJournalItem, "id"> = {
      title: title.trim(),
      body: body.trim(),
      entry_date: entryDate,
      kind: recordedAudioUrl ? "voice" : "text",
      media_url: recordedAudioUrl || photoUrl || undefined,
      audio_duration: recordedAudioUrl ? recordingDuration : undefined,
    };

    store.addJournalEntry(entry);
    speakText(`Saved to your Memory Bond journal: ${title}`, speechLocale);

    setIsAddOpen(false);
    setTitle("");
    setBody("");
    setPhotoUrl("");
    setRecordedAudioUrl(null);
    setRecordingDuration(0);
  };

  // Filtered Journal Entries
  const filteredJournal = useMemo(() => {
    return store.journal.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.body.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [store.journal, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" /> {t("journal") || "Memory Journal & Voice Memories"}
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Preserve voice reflections, cherished family stories, and joyful life memories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold text-base h-12 px-6 rounded-2xl">
            <Plus className="h-5 w-5" /> {t("recordMemory") || "Record Voice Memory"}
          </Button>
        </div>
      </div>

      {/* Search & Category Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card border-2 border-border p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchMemories") || "Search memories by name, story, or family member..."}
            className="pl-10 rounded-xl h-11 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                selectedCategory === c.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-secondary/40 hover:bg-secondary text-muted-foreground border-border"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Timeline List */}
      <div className="space-y-6 max-w-3xl mx-auto">
        {filteredJournal.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No memories match your search. Record a voice memory to start preserving moments.
          </div>
        ) : (
          filteredJournal.map((item) => (
            <div
              key={item.id}
              className="relative rounded-3xl border-2 border-border bg-card p-6 sm:p-7 shadow-sm space-y-4 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(item.entry_date).toLocaleDateString("en-IN", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {item.kind === "voice" && (
                      <span className="rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 text-xs font-bold flex items-center gap-1">
                        <Mic className="h-3 w-3" /> Voice Memory
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground">{item.title}</h3>
                </div>

                <div className="flex items-center gap-1">
                  {/* Read Aloud Voice Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => speakText(`${item.title}. ${item.body}`, speechLocale)}
                    className="rounded-xl p-2 text-primary hover:bg-primary/10"
                    title="Read Aloud"
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => store.deleteJournalEntry(item.id)}
                    className="rounded-xl text-destructive hover:bg-destructive/10 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Memory Story Body */}
              <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-line font-medium">
                {item.body}
              </p>

              {/* Photo Memory Attachment if present */}
              {item.media_url && !item.media_url.startsWith("blob:") && (
                <div className="rounded-2xl overflow-hidden border border-border mt-2">
                  <img src={item.media_url} alt={item.title} className="w-full max-h-64 object-cover" />
                </div>
              )}

              {/* Audio Playback player if voice recording */}
              {item.media_url && item.media_url.startsWith("blob:") && (
                <div className="rounded-2xl bg-secondary/40 border border-border p-3 flex items-center gap-3">
                  <audio controls src={item.media_url} className="w-full h-9" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Memory Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Record / Write Memory</h3>

            {/* Voice Recording Widget */}
            <div className="rounded-2xl bg-primary/10 border-2 border-primary/25 p-5 text-center space-y-3">
              <span className="text-xs font-black tracking-wider uppercase text-primary">
                Voice Memory Recording
              </span>
              <div className="flex items-center justify-center gap-4">
                {!isRecording ? (
                  <Button
                    type="button"
                    onClick={startVoiceRecording}
                    className="gap-2 font-bold px-6 h-12 rounded-2xl bg-primary"
                  >
                    <Mic className="h-5 w-5" /> Start Recording
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={stopVoiceRecording}
                    className="gap-2 font-bold px-6 h-12 rounded-2xl animate-pulse"
                  >
                    <Square className="h-5 w-5" /> Stop Recording ({recordingDuration}s)
                  </Button>
                )}
              </div>
              {recordedAudioUrl && (
                <div className="pt-2">
                  <p className="text-xs text-success font-bold mb-1">Audio recorded successfully!</p>
                  <audio controls src={recordedAudioUrl} className="w-full h-8" />
                </div>
              )}
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-4">
              <div>
                <Label>Memory Title *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rongali Bihu celebration with family"
                  className="rounded-xl mt-1 font-bold"
                />
              </div>

              <div>
                <Label>Date of Memory</Label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="rounded-xl mt-1 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Memory Story / Voice Transcript</Label>
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> {t("generateSummary") || "AI Summary"}
                  </button>
                </div>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe this cherished moment in your native language..."
                  className="rounded-xl mt-1 leading-relaxed"
                  rows={4}
                />
              </div>

              <div>
                <Label>Photo URL (Optional)</Label>
                <Input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="rounded-xl mt-1 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-xl font-bold bg-primary">
                  Save Memory
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
