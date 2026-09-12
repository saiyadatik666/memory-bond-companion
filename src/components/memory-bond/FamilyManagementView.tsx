import { useState } from "react";
import {
  Users,
  Plus,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Edit2,
  PhoneCall,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Key,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { MemoryBondStore, EmergencyContact, CaregiverLink } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

export function FamilyManagementView({ store }: { store: MemoryBondStore }) {
  const { t } = useI18n();
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [relationship, setRelationship] = useState<string>("Family");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isEmergency, setIsEmergency] = useState<boolean>(true);
  const [activeForCalls, setActiveForCalls] = useState<boolean>(true);
  const [photoUrl, setPhotoUrl] = useState<string>("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80");
  const [voiceMemory, setVoiceMemory] = useState<string>("यह राहुल हैं, आपके बेटे।");

  const PHOTO_PRESETS = [
    { label: "Son / Man", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" },
    { label: "Daughter / Woman", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80" },
    { label: "Grandson / Boy", url: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300&auto=format&fit=crop&q=80" },
    { label: "Granddaughter / Girl", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80" },
    { label: "Doctor / Healthcare", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80" },
  ];

  const handleCopyMemberId = () => {
    navigator.clipboard.writeText(store.profile.member_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const contact: Omit<EmergencyContact, "id"> = {
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
      priority: store.contacts.length + 1,
      is_emergency: isEmergency,
      active_for_calls: activeForCalls,
      photo_url: photoUrl || undefined,
      voice_memory: voiceMemory.trim() || undefined,
    };
    const trimmedEmail = email.trim();
    store.addContact(trimmedEmail ? { ...contact, email: trimmedEmail } : contact);

    setIsAddOpen(false);
    setName("");
    setPhone("");
    setEmail("");
    setVoiceMemory("");
  };

  const toggleEmergencyStatus = (id: string, currentStatus: boolean) => {
    store.updateContact(id, { is_emergency: !currentStatus });
  };

  const toggleCallsStatus = (id: string, currentStatus: boolean) => {
    store.updateContact(id, { active_for_calls: !currentStatus });
  };

  return (
    <div className="space-y-6">
      {/* 1. Senior Member ID & QR Code Pairing Card (Section 15) */}
      <div className="rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-card to-primary/5 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-primary bg-primary/10 px-3.5 py-1 rounded-full">
              <Key className="h-3.5 w-3.5" /> {t("seniorMemberId") || "Senior Member ID & Pairing"}
            </span>
            <h3 className="text-2xl font-black text-foreground">
              Connect Caregivers & Family
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Family members can scan this QR code or enter your unique Member ID in their Caregiver app to link accounts securely.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="px-4 py-2.5 rounded-xl bg-secondary font-mono font-black text-base text-foreground border border-border">
                {store.profile.member_id}
              </div>
              <Button
                variant="outline"
                onClick={handleCopyMemberId}
                className="gap-1.5 font-bold rounded-xl h-11"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy ID"}
              </Button>
            </div>
          </div>

          {/* Clean Visual QR Code SVG Representation */}
          <div className="p-4 rounded-3xl bg-white border-2 border-border shadow-md flex flex-col items-center justify-center text-center">
            <svg
              className="w-36 h-36"
              viewBox="0 0 100 100"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Corner position squares */}
              <rect x="10" y="10" width="24" height="24" rx="4" fill="#0f172a" />
              <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
              <rect x="18" y="18" width="8" height="8" fill="#0f172a" />

              <rect x="66" y="10" width="24" height="24" rx="4" fill="#0f172a" />
              <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
              <rect x="74" y="18" width="8" height="8" fill="#0f172a" />

              <rect x="10" y="66" width="24" height="24" rx="4" fill="#0f172a" />
              <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
              <rect x="18" y="74" width="8" height="8" fill="#0f172a" />

              {/* Data matrix pattern */}
              <rect x="40" y="12" width="6" height="6" fill="#0f172a" />
              <rect x="50" y="12" width="6" height="6" fill="#0f172a" />
              <rect x="44" y="24" width="8" height="8" fill="#0f172a" />
              <rect x="40" y="40" width="8" height="8" fill="#0f172a" />
              <rect x="52" y="40" width="8" height="8" fill="#0f172a" />
              <rect x="20" y="44" width="6" height="6" fill="#0f172a" />
              <rect x="70" y="44" width="8" height="8" fill="#0f172a" />
              <rect x="82" y="44" width="6" height="6" fill="#0f172a" />
              <rect x="40" y="52" width="8" height="8" fill="#0f172a" />
              <rect x="52" y="52" width="8" height="8" fill="#0f172a" />
              <rect x="40" y="68" width="6" height="6" fill="#0f172a" />
              <rect x="50" y="68" width="6" height="6" fill="#0f172a" />
              <rect x="44" y="80" width="8" height="8" fill="#0f172a" />
              <rect x="68" y="68" width="8" height="8" fill="#0f172a" />
              <rect x="80" y="80" width="8" height="8" fill="#0f172a" />
            </svg>
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mt-1.5">
              Scan with Caregiver App
            </span>
          </div>
        </div>
      </div>

      {/* 2. Linked Caregivers & Approvals List (Section 15: Role-based permissions) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {t("linkedCaregivers") || "Linked Caregivers & Approvals"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Authorize who can view your medicine status, appointments, and emergency alerts.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-foreground">
            {store.caregiverLinks.length} Caregiver(s)
          </span>
        </div>

        <div className="space-y-3">
          {store.caregiverLinks.map((link) => (
            <div
              key={link.id}
              className="p-4 rounded-2xl border border-border bg-card/60 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-base text-foreground">
                  <span>{link.caregiver_name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-primary">
                    {link.relationship}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      link.status === "approved"
                        ? "bg-success/20 text-success"
                        : "bg-warning/20 text-warning"
                    }`}
                  >
                    {link.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Authorized Permissions:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md border ${
                      link.permissions.medicines
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary text-muted-foreground line-through opacity-60"
                    }`}
                  >
                    Medicines
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border ${
                      link.permissions.appointments
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary text-muted-foreground line-through opacity-60"
                    }`}
                  >
                    Appointments
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border ${
                      link.permissions.games
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary text-muted-foreground line-through opacity-60"
                    }`}
                  >
                    Game Progress
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border ${
                      link.permissions.sos
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary text-muted-foreground line-through opacity-60"
                    }`}
                  >
                    SOS Alerts
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border ${
                      link.permissions.journal
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary text-muted-foreground line-through opacity-60"
                    }`}
                  >
                    Journal (Private)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {link.status === "pending" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => store.approveCaregiverLink(link.id)}
                      className="bg-success text-white font-bold rounded-xl gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" /> {t("approveCaregiver") || "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => store.rejectCaregiverLink(link.id)}
                      className="font-bold rounded-xl"
                    >
                      {t("rejectCaregiver") || "Decline"}
                    </Button>
                  </>
                ) : (
                  <span className="text-xs font-bold text-success flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Connected & Authorized
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Family Members & Emergency Contacts List */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-primary" /> Family Members & Emergency Circle
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage family contacts, photo memories, voice context ("ये कौन हैं?"), and alert settings.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold text-sm h-11 px-5 rounded-2xl">
          <Plus className="h-4 w-4" /> Add Family Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {store.contacts.map((contact, idx) => (
          <div
            key={contact.id}
            className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  {contact.photo_url ? (
                    <img
                      src={contact.photo_url}
                      alt={contact.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/25 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary shrink-0">
                      {contact.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                      {contact.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {contact.relationship}
                      </span>
                      {contact.is_emergency ? (
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> SOS #{idx + 1}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          Family Circle
                        </span>
                      )}
                      {contact.active_for_calls !== false && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          Active for Calls
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => store.deleteContact(contact.id)}
                  className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2"
                  title="Remove contact"
                  aria-label={`Remove ${contact.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Spoken Voice Memory Context */}
              {contact.voice_memory && (
                <div className="rounded-2xl bg-secondary/50 border border-border p-3.5 flex items-center justify-between gap-3">
                  <div className="text-xs text-foreground italic space-y-0.5">
                    <span className="font-bold not-italic text-primary text-[10px] uppercase tracking-wider block">
                      Saved Voice Memory ("ये कौन हैं?")
                    </span>
                    "{contact.voice_memory}"
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => speakText(contact.voice_memory || "", "hi-IN")}
                    className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 shrink-0 bg-card border-border hover:bg-secondary"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-primary" /> Listen
                  </Button>
                </div>
              )}

              <div className="space-y-1.5 pt-1 text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-mono font-bold text-base">{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>

              {/* Alert & Calling Toggles */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Receive Emergency SOS Alerts:</span>
                  <Switch
                    checked={contact.is_emergency}
                    onCheckedChange={() => toggleEmergencyStatus(contact.id, contact.is_emergency)}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Active for Regular Routine Calls:</span>
                  <Switch
                    checked={contact.active_for_calls !== false}
                    onCheckedChange={() => toggleCallsStatus(contact.id, contact.active_for_calls !== false)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/80 flex justify-end gap-2">
              <a
                href={`tel:${contact.phone}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-black bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 rounded-2xl shadow-xs transition-all hover:scale-[1.01]"
              >
                <PhoneCall className="h-4 w-4" /> Call {contact.name.split(" ")[0]}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Family Member Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95 my-auto">
            <h3 className="text-2xl font-black text-foreground">Add Family Member</h3>
            <p className="text-xs text-muted-foreground">
              Add photos, relationships, and voice context so the assistant and senior always recognize them.
            </p>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Relationship *</Label>
                <Input
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Son, Daughter, Grandson, Sister, Caregiver"
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Phone Number *</Label>
                <Input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="rounded-xl mt-1 font-mono"
                />
              </div>

              <div>
                <Label>Email Address (Optional)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="family@example.com"
                  className="rounded-xl mt-1"
                />
              </div>

              {/* Photo Selector */}
              <div className="space-y-1.5">
                <Label>Photo / Avatar</Label>
                <div className="flex gap-2 items-center flex-wrap">
                  {PHOTO_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setPhotoUrl(preset.url)}
                      className={`p-1 rounded-xl border-2 transition-all ${
                        photoUrl === preset.url ? "border-primary ring-2 ring-primary/30" : "border-border opacity-70"
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Memory / Context */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Voice Memory / Context Note</Label>
                  <button
                    type="button"
                    onClick={() => setVoiceMemory(`यह ${name || "राहुल"} हैं, आपके ${relationship || "बेटे"}।`)}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Auto-Fill Example
                  </button>
                </div>
                <Input
                  value={voiceMemory}
                  onChange={(e) => setVoiceMemory(e.target.value)}
                  placeholder="e.g. यह राहुल हैं, आपके बेटे।"
                  className="rounded-xl"
                />
                <p className="text-[11px] text-muted-foreground">
                  Spoken when the senior asks "ये कौन हैं?" or in Family Gathering memory games.
                </p>
              </div>

              {/* Emergency SOS & Call Toggles */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40">
                  <div>
                    <div className="text-xs font-bold text-foreground">Emergency SOS Alerts</div>
                    <div className="text-[11px] text-muted-foreground">Receives emergency calls & SMS broadcasts</div>
                  </div>
                  <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40">
                  <div>
                    <div className="text-xs font-bold text-foreground">Active for Calls</div>
                    <div className="text-[11px] text-muted-foreground">Enabled for routine contact and checking in</div>
                  </div>
                  <Switch checked={activeForCalls} onCheckedChange={setActiveForCalls} />
                </div>
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
                  Save Family Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
