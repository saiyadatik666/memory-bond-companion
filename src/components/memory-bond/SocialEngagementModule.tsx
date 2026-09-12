import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  Plus,
  Send,
  Image as ImageIcon,
  Music,
  Smile,
  ShieldAlert,
  Sparkles,
  Users,
  CheckCircle2,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore, SocialPost } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, startSpeechRecognition } from "@/lib/voiceParser";

export function SocialEngagementModule({ store }: { store: MemoryBondStore }) {
  const { speechLocale } = useI18n();
  const [activeVoiceReplyPostId, setActiveVoiceReplyPostId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");
  const [isPlayingAudioId, setIsPlayingAudioId] = useState<string | null>(null);

  // New Post Modal State
  const [isNewPostOpen, setIsNewPostOpen] = useState<boolean>(false);
  const [newAuthor, setNewAuthor] = useState<string>("Sunita Sharma");
  const [newRelation, setNewRelation] = useState<string>("Daughter");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [newMediaType, setNewMediaType] = useState<"photo" | "voice" | "story" | "song">("photo");
  const [newMediaUrl, setNewMediaUrl] = useState<string>("");

  const reactionsList = [
    { emoji: "❤️", label: "Loved" },
    { emoji: "🙏", label: "Pranam & Blessings" },
    { emoji: "😊", label: "Brought Smile" },
    { emoji: "🌸", label: "Sent Flower" },
  ];

  // Start voice reply recording for a senior
  const handleStartVoiceReply = (postId: string) => {
    setActiveVoiceReplyPostId(postId);
    setSpokenTranscript("");
    setIsRecording(true);

    const stopFn = startSpeechRecognition(
      speechLocale,
      (text) => {
        setSpokenTranscript(text);
      },
      (err) => {
        console.warn("Speech error in voice reply:", err);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    // Safety timeout in case speech doesn't end automatically
    setTimeout(() => {
      if (stopFn) stopFn();
      setIsRecording(false);
    }, 15000);
  };

  const handleSendVoiceReply = (postId: string) => {
    if (!spokenTranscript.trim()) return;
    store.addSocialVoiceReply(postId, spokenTranscript.trim());
    speakText("Your voice reply has been sent to your family!", speechLocale);
    setSpokenTranscript("");
    setActiveVoiceReplyPostId(null);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    store.addSocialPost({
      author_name: newAuthor,
      relationship: newRelation,
      title: newTitle,
      content: newContent,
      media_type: newMediaType,
      media_url: newMediaUrl || (newMediaType === "photo" ? "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80" : undefined),
      audio_duration: newMediaType === "voice" || newMediaType === "song" ? 25 : undefined,
    });

    setNewTitle("");
    setNewContent("");
    setNewMediaUrl("");
    setIsNewPostOpen(false);
  };

  const toggleSimulatedAudio = (postId: string, text: string) => {
    if (isPlayingAudioId === postId) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudioId(null);
    } else {
      setIsPlayingAudioId(postId);
      speakText(text, speechLocale);
      // Auto reset after rough reading time
      const readSeconds = Math.max(3, Math.ceil(text.split(" ").length / 2.5));
      setTimeout(() => {
        setIsPlayingAudioId(null);
      }, readSeconds * 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Statutory Medical & Emotional Wellbeing Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-foreground text-sm">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Social Connection & Emotional Well-Being: </span>
          Regular contact with loved ones through familiar voices, photos, and stories reduces isolation and promotes
          cognitive stimulation. This is an assistive companion module, not a medical treatment.
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-rose-500/15 via-pink-500/10 to-primary/10 border-2 border-rose-500/25 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider">
              <Heart className="h-3.5 w-3.5 fill-current" /> Family Greetings & Memories
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
              Heartfelt Family Bond Feed
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Listen to voice greetings from children and grandchildren, view family photographs, and send warm one-tap blessings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsNewPostOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-md gap-2 h-12 px-6"
            >
              <Plus className="h-5 w-5" /> Share Family Greeting
            </Button>
          </div>
        </div>

        {/* Family stats strip */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-rose-500/20 text-center">
          <div className="rounded-2xl bg-card/60 p-3 border border-border">
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {store.socialFeed.length}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase">Family Messages</div>
          </div>
          <div className="rounded-2xl bg-card/60 p-3 border border-border">
            <div className="text-xl sm:text-2xl font-black text-primary">
              {store.socialFeed.reduce((acc, p) => acc + p.reactions.length, 0)}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase">Blessings Sent</div>
          </div>
          <div className="rounded-2xl bg-card/60 p-3 border border-border">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              100%
            </div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase">Love Connection</div>
          </div>
        </div>
      </div>

      {/* Social Feed List */}
      <div className="space-y-6">
        {store.socialFeed.map((post) => {
          const isAudioPlaying = isPlayingAudioId === post.id;
          const isReplyingToThis = activeVoiceReplyPostId === post.id;

          return (
            <div
              key={post.id}
              className="rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xs hover:shadow-md transition-all space-y-5"
            >
              {/* Author & Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-700 dark:text-rose-300 font-black text-lg flex items-center justify-center border border-rose-500/30">
                    {post.author_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{post.author_name}</h3>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      {post.relationship} • {new Date(post.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText(`${post.title}. ${post.content}`, speechLocale)}
                  className="rounded-2xl gap-1.5 font-bold text-xs h-9"
                  title="Read greeting aloud"
                >
                  <Volume2 className="h-4 w-4 text-primary" /> Read Aloud
                </Button>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h4 className="text-xl font-black text-foreground">{post.title}</h4>
                <p className="text-base text-foreground/90 leading-relaxed">{post.content}</p>
              </div>

              {/* Media Display */}
              {post.media_type === "photo" && post.media_url && (
                <div className="overflow-hidden rounded-2xl border border-border bg-secondary/30 max-h-96">
                  <img
                    src={post.media_url}
                    alt={post.title}
                    className="w-full h-auto object-cover max-h-96 hover:scale-101 transition-transform"
                    onError={(e) => {
                      // Fallback if network image fails
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {(post.media_type === "voice" || post.media_type === "song") && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center">
                      <Music className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-foreground">
                        {post.media_type === "song" ? "Folk Melody Clip" : "Family Voice Note"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {post.audio_duration ? `${post.audio_duration}s recorded audio` : "Audio message"}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => toggleSimulatedAudio(post.id, post.content)}
                    className="rounded-2xl gap-2 font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {isAudioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isAudioPlaying ? "Pause Audio" : "Play Voice Note"}
                  </Button>
                </div>
              )}

              {/* Senior Reaction Strip */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tap to send a warm reply:
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {reactionsList.map((rx) => {
                    const hasReacted = post.reactions.some((r) => r.reaction.includes(rx.label));
                    return (
                      <button
                        key={rx.label}
                        onClick={() => {
                          store.addSocialReaction(post.id, `${rx.emoji} ${rx.label}`);
                          speakText(`Sent ${rx.label} to ${post.author_name}`, speechLocale);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-bold text-sm transition-all cursor-pointer ${
                          hasReacted
                            ? "bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs"
                            : "bg-secondary/40 border-border text-foreground hover:bg-secondary/80 hover:border-rose-400"
                        }`}
                      >
                        <span className="text-lg">{rx.emoji}</span>
                        <span>{rx.label}</span>
                      </button>
                    );
                  })}

                  <Button
                    variant="outline"
                    onClick={() => handleStartVoiceReply(post.id)}
                    className="rounded-2xl gap-2 font-bold text-sm h-11 px-4 text-primary border-primary/40 hover:bg-primary/10 ml-auto"
                  >
                    <Mic className="h-4 w-4" /> Speak Voice Reply
                  </Button>
                </div>

                {/* Live Voice Reply Recording Box */}
                {isReplyingToThis && (
                  <div className="p-4 rounded-2xl border-2 border-primary/40 bg-primary/10 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        {isRecording ? (
                          <>
                            <span className="w-3 h-3 rounded-full bg-destructive animate-ping" />
                            <span className="text-destructive font-black">Listening... Speak your message now</span>
                          </>
                        ) : (
                          <span>Your Spoken Reply:</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveVoiceReplyPostId(null)}
                        className="text-xs font-bold"
                      >
                        Cancel
                      </Button>
                    </div>

                    <input
                      type="text"
                      value={spokenTranscript}
                      onChange={(e) => setSpokenTranscript(e.target.value)}
                      placeholder={isRecording ? "Listening to your voice..." : "Type or speak your reply here..."}
                      className="w-full p-3 rounded-xl border border-border bg-card text-foreground font-semibold text-base focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />

                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartVoiceReply(post.id)}
                        className="gap-1.5 font-bold text-xs rounded-xl"
                      >
                        <Mic className="h-3.5 w-3.5" /> Re-record Voice
                      </Button>

                      <Button
                        size="sm"
                        disabled={!spokenTranscript.trim()}
                        onClick={() => handleSendVoiceReply(post.id)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl text-xs gap-1.5 px-5"
                      >
                        <Send className="h-3.5 w-3.5" /> Send to Family
                      </Button>
                    </div>
                  </div>
                )}

                {/* Display Existing Senior Voice & Text Replies */}
                {post.voice_replies.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-muted-foreground uppercase">
                      Your Sent Replies:
                    </div>
                    {post.voice_replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-3.5 rounded-2xl bg-secondary/50 border border-border flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-primary">Senior Reply:</span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(reply.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground italic">"{reply.transcript}"</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => speakText(reply.transcript, speechLocale)}
                          className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-primary"
                          title="Listen to reply"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW POST MODAL */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="rounded-3xl border-2 border-border bg-card p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-rose-500" />
                <h3 className="text-xl font-black text-foreground">Share Family Memory</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNewPostOpen(false)}
                className="font-bold text-base"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Your Name</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full mt-1 p-3 rounded-2xl border border-border bg-background text-foreground font-semibold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Relationship (e.g. Daughter, Grandson)</label>
                <input
                  type="text"
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  className="w-full mt-1 p-3 rounded-2xl border border-border bg-background text-foreground font-semibold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Greeting Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Thinking of you Baba!"
                  className="w-full mt-1 p-3 rounded-2xl border border-border bg-background text-foreground font-semibold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Message / Memory Story</label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write a warm greeting or family update that will bring comfort..."
                  className="w-full mt-1 p-3 rounded-2xl border border-border bg-background text-foreground font-semibold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Type of Greeting</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(["photo", "voice", "story"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewMediaType(type)}
                      className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                        newMediaType === type
                          ? "bg-rose-500 text-white border-rose-500 font-black"
                          : "bg-secondary border-border text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {newMediaType === "photo" && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Photo URL (Optional)</label>
                  <input
                    type="url"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://... (or leave empty for default family photo)"
                    className="w-full mt-1 p-3 rounded-2xl border border-border bg-background text-foreground font-semibold text-sm"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewPostOpen(false)}
                  className="rounded-2xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl px-6"
                >
                  Post to Feed
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
