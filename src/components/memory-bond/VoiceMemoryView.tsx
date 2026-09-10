import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Loader2,
  Sparkles,
  Volume2,
  Save,
  Trash2,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import { processVoiceMemory } from "@/lib/voiceMemory.functions";
import { LANGUAGES, useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import type { MemoryBondStore } from "@/lib/memoryBondStore";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-failed"));
    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export function VoiceMemoryView({ store }: { store: MemoryBondStore }) {
  const { t, lang, speechLocale } = useI18n();
  const process = useServerFn(processVoiceMemory);

  const [recordLang, setRecordLang] = useState<string>(lang);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [summaryGu, setSummaryGu] = useState("");
  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => setRecordLang(lang), [lang]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeaking();
    };
  }, []);

  const langSpeech =
    LANGUAGES.find((l) => l.code === recordLang)?.speech ?? speechLocale;

  const reset = () => {
    setTranscript("");
    setSummaryGu("");
    setTitle("");
    setSaved(false);
    setError(null);
  };

  const startRecording = async () => {
    reset();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((tr) => tr.stop());
      };
      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(
        t("micDenied") ||
          "Microphone permission is needed to record your memory.",
      );
    }
  };

  const stopRecording = () => {
    try {
      recorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const transcribe = async () => {
    if (!blobRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const audioBase64 = await blobToBase64(blobRef.current);
      const result = await process({
        data: {
          audioBase64,
          mimeType: blobRef.current.type || "audio/webm",
          language: recordLang,
        },
      });
      setTranscript(result.transcript);
      setSummaryGu(result.summaryGu);
      setTitle(result.title);
      if (!result.transcript) {
        setError(
          t("noSpeechHeard") ||
            "No speech was heard in that recording. Please record again.",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!transcript) return;
    store.addJournalEntry({
      title: title || (t("voiceMemory") || "Voice memory"),
      body: summaryGu ? `${transcript}\n\n— ${summaryGu}` : transcript,
      entry_date: new Date().toISOString().slice(0, 10),
      kind: "voice",
      ...(audioUrl ? { media_url: audioUrl } : {}),
      audio_duration: seconds,
    });
    setSaved(true);
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Mic className="h-6 w-6 text-primary" />
          {t("voiceMemory") || "Voice Memory"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("voiceMemoryHint") ||
            "Speak your memory in your own language. We write it down and add a short Gujarati summary."}
        </p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-bold">
            <Languages className="h-4 w-4" />
            {t("language") || "Language"}
          </Label>
          <select
            value={recordLang}
            onChange={(e) => setRecordLang(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native} — {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col items-center gap-3 py-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            className={`h-28 w-28 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground hover:scale-105"
            }`}
          >
            {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
          </button>
          <p className="text-lg font-black tabular-nums">{mmss}</p>
          <p className="text-xs text-muted-foreground text-center">
            {isRecording
              ? t("recordingNow") || "Recording… tap the square when you finish."
              : t("tapToRecord") || "Tap the microphone and start speaking."}
          </p>
        </div>

        {audioUrl && !isRecording && (
          <div className="flex flex-wrap items-center gap-2">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <Button variant="outline" onClick={togglePlay} className="rounded-2xl">
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? t("pause") || "Pause" : t("listen") || "Listen"}
            </Button>
            <Button onClick={transcribe} disabled={busy} className="rounded-2xl">
              {busy ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {busy
                ? t("transcribing") || "Writing it down…"
                : t("transcribeAndSummarize") || "Transcribe + Gujarati summary"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                blobRef.current = null;
                setAudioUrl(null);
                setSeconds(0);
                reset();
              }}
              className="rounded-2xl text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete") || "Delete"}
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm font-semibold text-destructive bg-destructive/10 rounded-2xl px-4 py-3">
            {error}
          </p>
        )}
      </section>

      {transcript && (
        <section className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="space-y-2">
            <Label className="text-sm font-bold">
              {t("transcript") || "What you said"}
            </Label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={5}
              className="rounded-2xl text-base"
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl"
              onClick={() => speakText(transcript, langSpeech)}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {t("readAloud") || "Read aloud"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("gujaratiSummary") || "Gujarati summary (ગુજરાતી સારાંશ)"}
            </Label>
            <Textarea
              value={summaryGu}
              onChange={(e) => setSummaryGu(e.target.value)}
              rows={4}
              className="rounded-2xl text-base"
              lang="gu"
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl"
              onClick={() => speakText(summaryGu, "gu-IN")}
              disabled={!summaryGu}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {t("readAloudGujarati") || "Read the Gujarati summary"}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saved} className="rounded-2xl">
              <Save className="h-4 w-4 mr-2" />
              {saved
                ? t("savedToJournal") || "Saved to memory journal"
                : t("saveToJournal") || "Save to memory journal"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
