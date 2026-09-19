// ============================================================================
// Real Device Notification & Reminder Service
// Web Audio API Audio Chime + HTML5 Notification API + Scheduled Watcher
// ============================================================================

import type { MemoryBondStore } from "./memoryBondStore";
import { getLocalTodayDateString } from "./reminderService";

// In-memory set of triggered notification keys to prevent repeat alerts in the same minute
const triggeredAlertKeys = new Set<string>();

/**
 * Play a soothing, harmonic 3-tone chime for seniors using Web Audio API
 */
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const tones = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.15 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.7);
    });
  } catch (err) {
    console.debug("[NotificationService] Audio chime failed or restricted by autoplay policy:", err);
  }
}

/**
 * Request HTML5 notification permission from browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const perm = await Notification.requestPermission();
    return perm === "granted";
  }

  return false;
}

/**
 * Dispatch real native device notification outside browser tab
 */
export function sendDeviceNotification(
  title: string,
  options?: {
    body?: string;
    tag?: string;
    icon?: string;
    badge?: string;
    soundChime?: boolean;
    data?: any;
  }
): boolean {
  if (options?.soundChime !== false) {
    playNotificationChime();
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    const notif = new Notification(title, {
      body: options?.body || "Memory Bond Reminder",
      icon: options?.icon || "/favicon.ico",
      tag: options?.tag,
      data: options?.data,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (err) {
    console.debug("[NotificationService] Device notification error:", err);
    return false;
  }
}

/**
 * Check active medicines and general reminders against the user's local time
 */
export function checkScheduledReminders(store: MemoryBondStore) {
  if (typeof window === "undefined") return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMins = String(now.getMinutes()).padStart(2, "0");
  const currentTimeKey = `${currentHours}:${currentMins}`;
  const todayDateStr = getLocalTodayDateString(now);
  const currentDayOfWeek = now.getDay();

  // 1. Check Medicine Schedules
  (store.medicines || []).forEach((med) => {
    (med.times || []).forEach((schedTime) => {
      const formattedSched = schedTime.trim().slice(0, 5);
      if (formattedSched === currentTimeKey) {
        const alertKey = `med_${med.id}_${todayDateStr}_${formattedSched}`;
        if (!triggeredAlertKeys.has(alertKey)) {
          triggeredAlertKeys.add(alertKey);

          const title = `💊 Medicine Reminder: ${med.name}`;
          const body = `It is ${schedTime}. Please take ${med.dosage}. ${med.instructions || ""}`;

          sendDeviceNotification(title, {
            body,
            tag: `med-${med.id}`,
            soundChime: true,
          });

          store.addNotification({
            title,
            body,
            category: "medicine_due",
            action_url: "/?tab=medicines",
          });
        }
      }
    });
  });

  // 2. Check General Reminders (including voice-created and recurring)
  (store.reminders || []).forEach((rem) => {
    if (!rem.active || rem.enabled === false) return;
    if (rem.completed && rem.last_done === todayDateStr) return;

    const remTime = (rem.time || "").trim().slice(0, 5);

    // Repeat schedule evaluation
    if (rem.repeat === "daily") {
      // Fires every day at scheduled time
    } else if (rem.repeat === "weekly") {
      if (rem.date) {
        const remDateObj = new Date(rem.date + "T00:00:00");
        if (remDateObj.getDay() !== currentDayOfWeek) return;
      }
    } else {
      // Non-recurring: must match today's date
      if (rem.date && rem.date !== todayDateStr) return;
    }

    if (remTime === currentTimeKey) {
      const alertKey = `rem_${rem.id}_${todayDateStr}_${remTime}`;
      if (!triggeredAlertKeys.has(alertKey)) {
        triggeredAlertKeys.add(alertKey);

        const title = `⏰ Reminder: ${rem.title}`;
        const body = rem.notes || `Scheduled for ${rem.time}`;

        sendDeviceNotification(title, {
          body,
          tag: `rem-${rem.id}`,
          soundChime: true,
        });

        store.addNotification({
          title,
          body,
          category: "general",
          action_url: "/?tab=reminders",
        });
      }
    }
  });

  // 3. Automated Birthday Reminders (Requirement 25)
  // Check contacts birthdays: 1 day before and day-of
  const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowMonthDay = `${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  (store.contacts || []).forEach((contact) => {
    if (!contact.birthday) return;
    const bdayRaw = contact.birthday.slice(-5); // "MM-DD"

    // Today's Birthday
    if (bdayRaw === currentMonthDay) {
      const alertKey = `bday_today_${contact.id}_${todayDateStr}`;
      if (!triggeredAlertKeys.has(alertKey)) {
        triggeredAlertKeys.add(alertKey);

        const isHi = store.profile.language === "hi";
        const isGu = store.profile.language === "gu";
        const title = isHi
          ? `🎂 आज ${contact.name} का जन्मदिन है!`
          : isGu
          ? `🎂 આજે ${contact.name} નો જન્મદિવસ છે!`
          : `🎂 Today is ${contact.name}'s Birthday!`;
        const body = isHi
          ? `अपने ${contact.relationship} ${contact.name} को शुभकामनाएँ दें!`
          : isGu
          ? `તમારા ${contact.relationship} ${contact.name} ને શુભેચ્છા પાઠવો!`
          : `Wish your ${contact.relationship} ${contact.name} a wonderful day!`;

        sendDeviceNotification(title, { body, soundChime: true });
        store.addNotification({
          title,
          body,
          category: "general",
          action_url: "/?tab=family",
        });
      }
    }

    // Tomorrow's Birthday
    if (bdayRaw === tomorrowMonthDay) {
      const alertKey = `bday_tmrw_${contact.id}_${todayDateStr}`;
      if (!triggeredAlertKeys.has(alertKey)) {
        triggeredAlertKeys.add(alertKey);

        const isHi = store.profile.language === "hi";
        const isGu = store.profile.language === "gu";
        const title = isHi
          ? `🎉 कल ${contact.name} का जन्मदिन है!`
          : isGu
          ? `🎉 કાલે ${contact.name} નો જન્મદિવસ છે!`
          : `🎉 Tomorrow is ${contact.name}'s Birthday!`;
        const body = isHi
          ? `कल आपके ${contact.relationship} ${contact.name} का जन्मदिन है।`
          : isGu
          ? `કાલે તમારા ${contact.relationship} ${contact.name} નો જન્મદિવસ છે.`
          : `Tomorrow is your ${contact.relationship} ${contact.name}'s birthday.`;

        sendDeviceNotification(title, { body, soundChime: true });
        store.addNotification({
          title,
          body,
          category: "general",
          action_url: "/?tab=family",
        });
      }
    }
  });

  // 4. Medicine Stock Refill Alert for Caregivers (Requirement 16)
  (store.medicines || []).forEach((med) => {
    const daysLeft = med.daily_usage > 0 ? Math.floor(med.stock / med.daily_usage) : 999;
    if (daysLeft <= 3 && med.stock > 0) {
      const alertKey = `stock_low_${med.id}_${todayDateStr}`;
      if (!triggeredAlertKeys.has(alertKey)) {
        triggeredAlertKeys.add(alertKey);

        const title = `⚠️ Refill Warning: ${med.name}`;
        const body = `Remaining stock: ${med.stock} ${med.unit}s (~${daysLeft} days left). Caregiver notified for timely refill.`;

        store.addNotification({
          title,
          body,
          category: "medicine_low",
          action_url: "/?tab=medicines",
        });
      }
    }
  });
}
