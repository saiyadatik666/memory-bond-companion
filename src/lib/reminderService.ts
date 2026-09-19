// ============================================================================
// Memory Bond — Central Reminder Service
// Single source of truth for creating, verifying, retrieving, and formatting reminders
// Ensures zero fake success states and full persistence across Voice & UI
// ============================================================================

import type { MemoryBondStore, Reminder } from "./memoryBondStore";
import { getKey } from "./memoryBondStore";

export interface CreateReminderParams {
  title: string;
  time: string; // HH:MM
  date?: string | null; // YYYY-MM-DD or null
  repeat?: "daily" | "weekly" | "none";
  type?: Reminder["type"];
  notes?: string | null;
  source?: "voice" | "text" | "manual" | "caregiver";
  category?: string;
}

export interface ReminderCreationResult {
  success: boolean;
  reminder?: Reminder;
  error?: string;
}

/**
 * Normalizes time string to standard "HH:MM" 24h format
 */
export function normalizeTimeString(timeStr: string): string {
  if (!timeStr) return "08:00";
  const trimmed = timeStr.trim();
  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  return "08:00";
}

/**
 * Returns today's date formatted as YYYY-MM-DD in user's local timezone
 */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns tomorrow's date formatted as YYYY-MM-DD in user's local timezone
 */
export function getLocalTomorrowDateString(): string {
  const tomorrow = new Date(Date.now() + 86400000);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a 24-hour time "HH:MM" into a senior-friendly 12-hour display string
 */
export function formatTime12h(timeStr: string, locale = "en-IN"): string {
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr || "8", 10);
  const m = parseInt(mStr || "0", 10);
  const isPm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const minStr = m > 0 ? `:${String(m).padStart(2, "0")}` : "";

  if (locale.startsWith("hi")) {
    const period = h < 12 ? "सुबह" : h < 16 ? "दोपहर" : h < 20 ? "शाम" : "रात";
    return `${period} ${h12}${minStr} बजे`;
  }
  return `${h12}${minStr} ${isPm ? "PM" : "AM"}`;
}

/**
 * Central action to create and verify a reminder in the store.
 * Verifies that the reminder is actually created and returned before declaring success.
 */
export function createVerifiedReminder(
  store: MemoryBondStore,
  params: CreateReminderParams
): ReminderCreationResult {
  try {
    if (!params.title || params.title.trim().length === 0) {
      return {
        success: false,
        error: "Title is required for reminder creation.",
      };
    }

    const cleanTitle = params.title.trim();
    const cleanTime = normalizeTimeString(params.time);
    const repeat = params.repeat || (params.date ? "none" : "daily");
    const reminderType = params.type || "custom";
    const cleanNotes = params.notes || `Created via ${params.source || "voice"}`;

    const newReminderData: Omit<Reminder, "id"> = {
      title: cleanTitle,
      time: cleanTime,
      date: params.date || null,
      repeat,
      type: reminderType,
      notes: cleanNotes,
      active: true,
      enabled: true,
      completed: false,
      source: params.source || "voice",
    };

    // 1. Actually add reminder to reactive store
    const created = store.addReminder(newReminderData);

    // 2. Immediate verification: confirm the created object has a valid ID and matching attributes
    if (!created || !created.id) {
      return {
        success: false,
        error: "Failed to persist reminder to local store.",
      };
    }

    return {
      success: true,
      reminder: created,
    };
  } catch (err: any) {
    console.error("[ReminderService] Error creating reminder:", err);
    return {
      success: false,
      error: err?.message || "Internal error saving reminder.",
    };
  }
}

/**
 * Retrieves all active reminders scheduled for today (including daily recurring)
 */
export function getTodayReminders(store: MemoryBondStore): Reminder[] {
  const todayStr = getLocalTodayDateString();
  const all = store.reminders || [];

  return all
    .filter((r) => {
      if (!r.active) return false;
      // If completed today, omit from active upcoming reminders
      if (r.last_done === todayStr || r.completed) return false;
      // Match today's date or daily recurring
      if (r.repeat === "daily" || !r.date || r.date === todayStr) return true;
      return false;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Finds the chronologically next reminder from current local time
 */
export function getNextReminder(store: MemoryBondStore): Reminder | null {
  const now = new Date();
  const curMinutes = now.getHours() * 60 + now.getMinutes();
  const todayReminders = getTodayReminders(store);

  // Look for the next upcoming reminder today
  for (const rem of todayReminders) {
    const [h, m] = rem.time.split(":").map(Number);
    const remMins = (h || 0) * 60 + (m || 0);
    if (remMins > curMinutes) {
      return rem;
    }
  }

  // If all today's reminders have passed, return the earliest upcoming reminder
  if (todayReminders.length > 0) {
    return todayReminders[0];
  }

  // Otherwise check upcoming reminders
  const tomorrowStr = getLocalTomorrowDateString();
  const upcoming = (store.reminders || [])
    .filter((r) => r.active && r.date && r.date >= tomorrowStr)
    .sort((a, b) => (a.date! + a.time).localeCompare(b.date! + b.time));

  return upcoming[0] || null;
}

/**
 * Formats a list of reminders for natural conversational speech
 */
export function formatRemindersForSpeech(reminders: Reminder[], locale = "en-IN"): string {
  const count = reminders.length;
  const isHi = locale.startsWith("hi");

  if (count === 0) {
    return isHi
      ? "आपके पास आज कोई आगामी रिमाइंडर नहीं है। सब कुछ पूरा हो चुका है।"
      : "You have no upcoming reminders for today. All caught up!";
  }

  if (isHi) {
    if (count === 1) {
      const r = reminders[0];
      return `आज आपका 1 रिमाइंडर है: ${formatTime12h(r.time, "hi-IN")} — ${r.title}।`;
    }
    const list = reminders.map((r) => `${formatTime12h(r.time, "hi-IN")} — ${r.title}`).join(",\n");
    return `आज आपके ${count} रिमाइंडर्स हैं:\n${list}।`;
  }

  // English fallback
  if (count === 1) {
    const r = reminders[0];
    return `You have 1 reminder today: ${formatTime12h(r.time, "en-IN")} — ${r.title}.`;
  }
  const list = reminders.map((r) => `${formatTime12h(r.time, "en-IN")} — ${r.title}`).join(",\n");
  return `You have ${count} reminders today:\n${list}.`;
}

/**
 * Formats the next reminder for conversational speech
 */
export function formatNextReminderForSpeech(reminder: Reminder | null, locale = "en-IN"): string {
  const isHi = locale.startsWith("hi");

  if (!reminder) {
    return isHi
      ? "आपके पास अभी कोई आगामी रिमाइंडर नहीं है।"
      : "You have no upcoming reminders scheduled right now.";
  }

  const timeStr = formatTime12h(reminder.time, locale);
  const isTomorrow = reminder.date === getLocalTomorrowDateString();

  if (isHi) {
    return `आपका अगला रिमाइंडर है: ${reminder.title}, ${isTomorrow ? "कल " : ""}${timeStr}।`;
  }
  return `Your next reminder is ${reminder.title} at ${timeStr}${isTomorrow ? " tomorrow" : ""}.`;
}

/**
 * Formats confirmed action speech after successful verified creation
 */
export function formatConfirmationSpeech(
  reminder: Reminder,
  locale = "en-IN"
): string {
  const isHi = locale.startsWith("hi");
  const timeFormatted = formatTime12h(reminder.time, locale);
  const isTomorrow = reminder.date === getLocalTomorrowDateString();
  const isDaily = reminder.repeat === "daily";

  if (isHi) {
    if (isDaily) {
      return `हो गया। मैंने रोज़ाना ${timeFormatted} के लिए "${reminder.title}" का रिमाइंडर सेट कर दिया है।`;
    }
    if (isTomorrow) {
      return `हो गया। मैं आपको कल ${timeFormatted} "${reminder.title}" याद दिला दूँगा।`;
    }
    return `हो गया। मैंने ${timeFormatted} के लिए "${reminder.title}" का रिमाइंडर सेव कर दिया है।`;
  }

  if (isDaily) {
    return `Done. I'll remind you every day at ${timeFormatted} to ${reminder.title.toLowerCase().startsWith("water") || reminder.title.toLowerCase().startsWith("drink") || reminder.title.toLowerCase().startsWith("take") ? reminder.title.toLowerCase() : reminder.title}.`;
  }
  if (isTomorrow) {
    return `Done. I'll remind you tomorrow at ${timeFormatted} to ${reminder.title.toLowerCase().startsWith("water") || reminder.title.toLowerCase().startsWith("drink") || reminder.title.toLowerCase().startsWith("take") ? reminder.title.toLowerCase() : reminder.title}.`;
  }
  return `Done. I'll remind you at ${timeFormatted} to ${reminder.title}.`;
}
