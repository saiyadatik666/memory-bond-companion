import React, { useState } from "react";
import {
  Users,
  Heart,
  MessageCircle,
  HelpCircle,
  BookOpen,
  Phone,
  Volume2,
  Plus,
  Sparkles,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import { SocialEngagementModule } from "./SocialEngagementModule";
import { MemoryCuesView } from "./MemoryCuesView";
import { MemoryJournalView } from "./MemoryJournalView";

export interface FamilyTreeViewProps {
  store: MemoryBondStore;
  initialTab?: "tree" | "greetings" | "cues" | "journal";
}

export function FamilyTreeView({ store, initialTab = "tree" }: FamilyTreeViewProps) {
  const { t, speechLocale } = useI18n();
  const [activeTab, setActiveTab] = useState<"tree" | "greetings" | "cues" | "journal">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Filter contacts
  const contacts = store.contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.relationship.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSpeakMember = (id: string, name: string, relationship: string, voiceMemory?: string) => {
    stopSpeaking();
    setSpeakingId(id);
    const textToSpeak = voiceMemory || `यह ${name} हैं, आपके ${relationship}।`;
    speakText(textToSpeak, speechLocale, () => {
      setSpeakingId(null);
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-500/15 via-purple-500/10 to-amber-500/15 border-2 border-rose-500/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Users className="h-9 w-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  Family & Memory Hub
                </span>
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Connections
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                FAMILY TREE
              </h1>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">
                Your loved ones, family greetings, memory cues, and cherished stories in one caring place.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-rose-500/20">
          <button
            onClick={() => setActiveTab("tree")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all cursor-pointer ${
              activeTab === "tree"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-card hover:bg-rose-500/10 text-foreground border border-border"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Family Members</span>
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 text-white font-bold">
              {store.contacts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("greetings")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all cursor-pointer ${
              activeTab === "greetings"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-card hover:bg-rose-500/10 text-foreground border border-border"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Family Greetings</span>
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 text-white font-bold">
              {store.socialPosts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("cues")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all cursor-pointer ${
              activeTab === "cues"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-card hover:bg-rose-500/10 text-foreground border border-border"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Memory Cues</span>
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 text-white font-bold">
              {store.memoryCues.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("journal")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all cursor-pointer ${
              activeTab === "journal"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-card hover:bg-rose-500/10 text-foreground border border-border"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Cherished Notes</span>
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 text-white font-bold">
              {store.memoryJournal.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: FAMILY MEMBERS VISUAL TREE */}
      {activeTab === "tree" && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search family member or relation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground text-sm font-semibold focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* Family Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="group rounded-3xl border-2 border-border bg-card p-5 space-y-4 hover:border-rose-500/60 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={contact.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"}
                      alt={contact.name}
                      className="w-18 h-18 rounded-2xl object-cover border-2 border-rose-500/40 shadow-xs"
                    />
                    {contact.is_emergency && (
                      <span className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-500 text-white" title="Emergency Contact">
                        <Heart className="h-3 w-3 fill-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                      {contact.relationship}
                    </span>
                    <h3 className="text-xl font-black text-foreground truncate mt-1">
                      {contact.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                      {contact.phone}
                    </p>
                  </div>
                </div>

                {contact.voice_memory && (
                  <p className="text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-xl border border-border/50">
                    "{contact.voice_memory}"
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSpeakMember(contact.id, contact.name, contact.relationship, contact.voice_memory)}
                    className={`flex-1 rounded-xl text-xs gap-1.5 font-bold cursor-pointer transition-all ${
                      speakingId === contact.id
                        ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                        : "hover:border-rose-500 hover:text-rose-600"
                    }`}
                  >
                    <Volume2 className="h-4 w-4" />
                    {speakingId === contact.id ? "Speaking..." : "Hear Info"}
                  </Button>

                  <a
                    href={`tel:${contact.phone}`}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>

          {contacts.length === 0 && (
            <div className="text-center py-12 rounded-3xl border-2 border-dashed border-border bg-card p-6 space-y-3">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-bold text-foreground">No Family Members Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No family members match your search.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FAMILY GREETINGS & MESSAGES */}
      {activeTab === "greetings" && (
        <SocialEngagementModule store={store} />
      )}

      {/* TAB 3: MEMORY CUES */}
      {activeTab === "cues" && (
        <MemoryCuesView store={store} />
      )}

      {/* TAB 4: CHERISHED NOTES */}
      {activeTab === "journal" && (
        <MemoryJournalView store={store} />
      )}
    </div>
  );
}
