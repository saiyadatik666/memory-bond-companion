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
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { MemoryBondStore, EmergencyContact } from "@/lib/memoryBondStore";

export function FamilyManagementView({ store }: { store: MemoryBondStore }) {
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [relationship, setRelationship] = useState<string>("Family");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isEmergency, setIsEmergency] = useState<boolean>(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const contact: Omit<EmergencyContact, "id"> = {
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
      priority: store.contacts.length + 1,
      is_emergency: isEmergency,
    };
    const trimmedEmail = email.trim();
    store.addContact(trimmedEmail ? { ...contact, email: trimmedEmail } : contact);

    setIsAddOpen(false);
    setName("");
    setPhone("");
    setEmail("");
  };

  const toggleEmergencyStatus = (id: string, currentStatus: boolean) => {
    store.updateContact(id, { is_emergency: !currentStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Family Circle & Emergency Contacts
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Trusted relatives and caregivers linked to emergency alerts, reminders, and daily check-ins.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold text-base h-12 px-6 rounded-2xl">
          <Plus className="h-5 w-5" /> Add Family Contact
        </Button>
      </div>

      {/* Contacts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {store.contacts.map((contact, idx) => (
          <div
            key={contact.id}
            className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {contact.name}
                      {contact.is_emergency && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive">
                          Emergency SOS
                        </span>
                      )}
                    </h3>
                    <p className="text-sm font-semibold text-primary">{contact.relationship}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => store.deleteContact(contact.id)}
                  className="rounded-xl text-destructive hover:bg-destructive/10 p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 pt-2 text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-mono font-bold">{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span>Priority #{idx + 1}</span>
                  <span>•</span>
                  <span>Receives SOS: {contact.is_emergency ? "Yes" : "No"}</span>
                </div>
                <Switch
                  checked={contact.is_emergency}
                  onCheckedChange={() => toggleEmergencyStatus(contact.id, contact.is_emergency)}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-2 text-sm font-bold bg-secondary hover:bg-secondary/80 px-4 py-2.5 rounded-xl text-foreground transition-all"
              >
                <PhoneCall className="h-4 w-4 text-primary" /> Call Now
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Add Family Member</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunita Sharma"
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Relationship</Label>
                <Input
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Daughter, Son, Neighbor, Doctor"
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

              <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40">
                <div>
                  <div className="text-sm font-bold text-foreground">Emergency Contact</div>
                  <div className="text-xs text-muted-foreground">Receive instant SOS emergency alerts</div>
                </div>
                <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6">
                  Save Contact
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
