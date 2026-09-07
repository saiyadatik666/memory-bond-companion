import { useState, useRef } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MemoryBondStore, MemoryJournalItem } from "@/lib/memoryBondStore";
import { speakText } from "@/lib/voiceParser";

export function MemoryJournalView({ store }: { store: MemoryBondStore }) {
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Audio recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

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
    } catch (err) {
      alert("Microphone permission was not granted or is unavailable.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    store.addJournalEntry({
      title: title.trim(),
      body: body.trim(),
      entry_date: entryDate,
      kind: recordedAudioUrl ? "voice" : "text",
      media_url: recordedAudioUrl || undefined,
      audio_duration: recordingDuration || undefined,
    });

    setIsAddOpen(false);
    setTitle("");
    setBody("");
    setRecordedAudioUrl(null);
    setRecordingDuration(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" /> Memory Journal & Voice Notes
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Preserve cherished family moments, voice notes, and joyful life memories.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold text-base h-12 px-6 rounded-2xl">
          <Plus className="h-5 w-5" /> New Memory Entry
        </Button>
      </div>

      {/* Timeline List */}
      <div className="space-y-6 max-w-3xl mx-auto">
        {store.journal.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No memories saved yet. Record a voice note or add your first cherished moment.
          </div>
        ) : (
          store.journal.map((item, idx) => (
            <div
              key={item.id}
              className="relative rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4"
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
                      <span className="rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-xs font-bold">
                        Voice Note
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-foreground">{item.title}</h3>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => store.deleteJournalEntry(item.id)}
                  className="text-destructive hover:bg-destructive/10 rounded-xl p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {item.body && (
                <p className="text-base text-foreground leading-relaxed font-medium">
                  {item.body}
                </p>
              )}

              {/* Voice Note Audio Playback */}
              {item.media_url ? (
                <div className="rounded-2xl bg-secondary/50 p-4 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <span>Recorded Voice Message</span>
                  </div>
                  <audio controls src={item.media_url} className="w-full h-10" />
                </div>
              ) : item.kind === "voice" ? (
                <div className="rounded-2xl bg-primary/10 p-4 border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-foreground">Voice Note Playback</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => speakText(item.body || item.title)}
                    className="gap-2 font-bold rounded-xl"
                  >
                    <Play className="h-4 w-4" /> Play Audio
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Add Memory Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-5 my-8 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Add to Memory Journal</h3>

            <form onSubmit={handleSaveMemory} className="space-y-4">
              <div>
                <Label>Title / Event *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rongali Bihu celebration with children"
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Memory Date</Label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Story / Notes</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe the wonderful feeling, people present, songs, or laughter..."
                  className="rounded-xl mt-1"
                  rows={4}
                />
              </div>

              {/* Voice Recorder Box */}
              <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center space-y-3">
                <p className="text-sm font-bold text-foreground">Optional: Attach a Live Voice Note</p>
                {isRecording ? (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-destructive font-bold text-sm animate-pulse">
                      <Mic className="h-4 w-4" /> Recording in progress ({recordingDuration}s)
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={stopVoiceRecording}
                        className="gap-2 font-bold rounded-xl"
                      >
                        <Square className="h-4 w-4" /> Stop Recording
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {recordedAudioUrl ? (
                      <div className="space-y-2">
                        <p className="text-xs text-success font-bold">Voice note ready!</p>
                        <audio controls src={recordedAudioUrl} className="w-full h-8" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setRecordedAudioUrl(null)}
                          className="text-xs text-destructive"
                        >
                          Discard Audio
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startVoiceRecording}
                        className="gap-2 font-bold rounded-xl"
                      >
                        <Mic className="h-4 w-4 text-primary" /> Tap to Record Voice Note
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6">
                  Save to Journal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
