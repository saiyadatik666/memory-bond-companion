import type { MemoryBondStore } from "./memoryBondStore";

export type VoiceIntent =
  | {
      type: "TAKE_MEDICINE";
      medicineId?: string;
      medicineName?: string;
      confirmationMessage: string;
    }
  | {
      type: "CREATE_REMINDER";
      title: string;
      time: string;
      reminderType: "medicine" | "shopping" | "appointment" | "personal" | "family_call" | "routine" | "hydration" | "meal" | "custom";
      confirmationMessage: string;
    }
  | {
      type: "CREATE_APPOINTMENT";
      title: string;
      date: string;
      time: string;
      location?: string;
      confirmationMessage: string;
    }
  | {
      type: "NAVIGATE";
      targetView: string;
      confirmationMessage: string;
    }
  | {
      type: "QUERY_NEXT_REMINDER";
      message: string;
    }
  | {
      type: "UNKNOWN";
      original: string;
      confirmationMessage: string;
    };

// Normalizes time string e.g. "8 PM" -> "20:00", "8:30 am" -> "08:30"
export function extractTime(text: string): string {
  const t = text.toLowerCase();
  // match patterns like 8:30 pm, 8 pm, 20:00, 10 am
  const matchWithMinutes = t.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/);
  if (matchWithMinutes) {
    let hours = parseInt(matchWithMinutes[1], 10);
    const minutes = matchWithMinutes[2];
    const meridiem = matchWithMinutes[3];
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  const matchHourOnly = t.match(/(\d{1,2})\s*(am|pm)/);
  if (matchHourOnly) {
    let hours = parseInt(matchHourOnly[1], 10);
    const meridiem = matchHourOnly[2];
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:00`;
  }

  if (t.includes("tonight") || t.includes("night") || t.includes("रात")) return "20:00";
  if (t.includes("morning") || t.includes("सुबह") || t.includes("ৰাতিপুৱা")) return "08:30";
  if (t.includes("afternoon") || t.includes("दोपहर")) return "13:00";
  if (t.includes("evening") || t.includes("शाम") || t.includes("সন্ধিয়া")) return "17:30";

  return "09:00";
}

export function parseVoiceIntent(rawText: string, store: MemoryBondStore): VoiceIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. "I took my medicine" / "Took medicine" / "दवा ले ली" / "ঔষধ খাইছো"
  if (
    lower.includes("took my medicine") ||
    lower.includes("took medicine") ||
    lower.includes("taken medicine") ||
    lower.includes("i took it") ||
    lower.includes("dawa le li") ||
    lower.includes("दवा ले ली") ||
    lower.includes("dawai le li") ||
    lower.includes("ঔষধ খাইছো")
  ) {
    // Find candidate medicine (e.g. first pending or matching)
    const nextMed = store.medicines[0];
    return {
      type: "TAKE_MEDICINE",
      medicineId: nextMed?.id,
      medicineName: nextMed?.name || "Scheduled Medicine",
      confirmationMessage: nextMed
        ? `You want to record that you took ${nextMed.name}. Save this confirmation?`
        : "You want to record that you took your medicine. Confirm?",
    };
  }

  // 2. Navigation commands: "Show my medicines", "Show games", "Go home", etc.
  if (lower.includes("show my medicines") || lower.includes("open medicines") || lower.includes("दवाइयाँ दिखाओ")) {
    return {
      type: "NAVIGATE",
      targetView: "medicines",
      confirmationMessage: "Opening your Medicines screen.",
    };
  }
  if (lower.includes("show games") || lower.includes("play games") || lower.includes("memory games")) {
    return {
      type: "NAVIGATE",
      targetView: "games",
      confirmationMessage: "Opening Memory Games.",
    };
  }
  if (lower.includes("show reminders") || lower.includes("my reminders")) {
    return {
      type: "NAVIGATE",
      targetView: "reminders",
      confirmationMessage: "Opening your Reminders.",
    };
  }
  if (lower.includes("routine") || lower.includes("दिनचर्या")) {
    return {
      type: "NAVIGATE",
      targetView: "routine",
      confirmationMessage: "Opening your Daily Routine.",
    };
  }

  // 3. Query Next Reminder: "What's my next reminder?" / "Next medicine"
  if (lower.includes("what is my next reminder") || lower.includes("what's my next reminder") || lower.includes("next reminder")) {
    const active = store.reminders.filter((r) => r.active)[0];
    const message = active
      ? `Your next reminder is "${active.title}" at ${active.time}.`
      : "You have no pending reminders for today.";
    return {
      type: "QUERY_NEXT_REMINDER",
      message,
    };
  }

  // 4. Appointments: "Doctor appointment is on Friday at 10 AM", "appointment on ..."
  if (lower.includes("appointment") || lower.includes("doctor") || lower.includes("अपॉइंटमेंट") || lower.includes("ডাক্তাৰ")) {
    const time = extractTime(lower);
    const cleanTitle = text.replace(/remind me|schedule|create/gi, "").trim();
    // approximate date 3 days ahead or tomorrow
    const futureDate = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

    return {
      type: "CREATE_APPOINTMENT",
      title: cleanTitle || "Doctor Appointment",
      date: futureDate,
      time,
      confirmationMessage: `You want to save an appointment: "${cleanTitle || "Doctor Visit"}" at ${time}. Save it?`,
    };
  }

  // 5. Reminders with Medicine, Calling, Shopping, or General
  if (lower.includes("remind me") || lower.includes("याद दिलाना") || lower.includes("remind")) {
    const time = extractTime(lower);
    let reminderType: "medicine" | "shopping" | "family_call" | "routine" | "custom" = "custom";

    if (lower.includes("medicine") || lower.includes("pill") || lower.includes("tablet") || lower.includes("दवा")) {
      reminderType = "medicine";
    } else if (lower.includes("buy") || lower.includes("vegetable") || lower.includes("shop") || lower.includes("मार्केट") || lower.includes("बाजार")) {
      reminderType = "shopping";
    } else if (lower.includes("call") || lower.includes("phone") || lower.includes("son") || lower.includes("daughter") || lower.includes("फोन")) {
      reminderType = "family_call";
    } else if (lower.includes("walk") || lower.includes("water") || lower.includes("exercise") || lower.includes("टहलना")) {
      reminderType = "routine";
    }

    // Clean prompt string for title
    let title = text
      .replace(/^remind me to\s*/i, "")
      .replace(/^remind me\s*/i, "")
      .replace(/at\s+\d+.*$/i, "")
      .replace(/on\s+.*$/i, "")
      .trim();

    if (!title) title = "General Reminder";

    return {
      type: "CREATE_REMINDER",
      title,
      time,
      reminderType,
      confirmationMessage: `You want a reminder at ${time} to "${title}". Save it?`,
    };
  }

  // Fallback / Unknown
  return {
    type: "UNKNOWN",
    original: text,
    confirmationMessage: `Did you say: "${text}"? Would you like to create a reminder for this?`,
  };
}

// Text to speech helper
export function speakText(text: string, speechLocale = "en-IN") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // Stop any pending utterances
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLocale;
  utterance.rate = 0.9; // Slightly slower for senior clarity
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
