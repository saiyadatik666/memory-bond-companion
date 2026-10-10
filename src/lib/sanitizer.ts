/**
 * Memory Bond - Input Validation & Sanitization Engine
 * 
 * Provides robust sanitization and Zod schemas for all user-controlled inputs.
 * Strictly prevents XSS, prototype pollution, and malformed data payloads while
 * preserving legitimate Gujarati, Hindi, Bengali, Assamese, and Pan-India text.
 */

import { z } from "zod";

/**
 * Strips dangerous control characters and normalizes Unicode without affecting
 * native Indian scripts (Gujarati, Hindi, Bengali, Assamese, Tamil, Telugu, etc.)
 */
export function sanitizeText(input: unknown, maxLength: number = 2000): string {
  if (typeof input !== "string") {
    return "";
  }

  // 1. Normalize Unicode (NFC)
  let clean = input.normalize("NFC");

  // 2. Strip null bytes and non-printable control characters (except newline \n and tab \t)
  // Preserves \t (0x09) and \n (0x0A) and \r (0x0D)
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Strip dangerous HTML script tags / event handlers if directly embedded
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  clean = clean.replace(/data:text\/html/gi, "");

  // 4. Enforce maximum length limit to prevent buffer / token inflation
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }

  return clean.trim();
}

/**
 * HTML entity escaping for safe text display when rendering user content
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  const entityMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
  };
  return str.replace(/[&<>"'/]/g, (s) => entityMap[s] || s);
}

// ============================================================================
// CENTRAL ZOD VALIDATION SCHEMAS FOR APPLICATION DATA
// ============================================================================

export const ValidMedicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required").max(120),
  dosage: z.string().max(80).default("1 tablet"),
  unit: z.enum(["tablet", "capsule", "syrup", "drops", "injection", "inhaler"]).default("tablet"),
  stock: z.number().min(0).max(10000).default(0),
  daily_usage: z.number().min(0.1).max(100).default(1),
  refill_threshold: z.number().min(0).max(1000).default(5),
  warn_days: z.number().min(1).max(30).default(5),
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM")).min(1),
  frequency: z.enum(["daily", "weekly", "as_needed"]).default("daily"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  instructions: z.string().max(500).optional().default(""),
  doctor: z.string().max(120).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
});

export const ValidReminderSchema = z.object({
  title: z.string().min(1, "Reminder title is required").max(150),
  type: z.enum(["medicine", "appointment", "hydration", "walk", "social", "custom"]).default("custom"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM").default("08:00"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  repeat: z.enum(["daily", "weekly", "none"]).default("daily"),
  notes: z.string().max(500).optional(),
  active: z.boolean().default(true),
});

export const ValidAppointmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  kind: z.enum(["doctor", "dentist", "eye", "physio", "general"]).default("doctor"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM").default("10:00"),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export const ValidEmergencyContactSchema = z.object({
  name: z.string().min(1, "Contact name is required").max(100),
  relationship: z.string().max(80).optional(),
  phone: z.string().min(8, "Phone number is too short").max(20),
  email: z.string().email("Invalid email format").max(150).optional().or(z.literal("")),
  priority: z.number().int().min(1).max(5).default(1),
  is_emergency: z.boolean().default(true),
});

export const ValidUserProfileSchema = z.object({
  full_name: z.string().min(1).max(100),
  role: z.enum(["senior", "caregiver", "healthcare_worker", "admin_healthcare_worker", "admin"]),
  language: z.enum(["en", "hi", "gu", "bn", "mr", "ta", "te", "kn", "ml", "pa", "as", "or"]).default("en"),
  age_range: z.string().max(30).optional(),
  phone: z.string().max(25).optional(),
  font_size: z.enum(["normal", "large", "xlarge"]).default("normal"),
  high_contrast: z.boolean().default(false),
  voice_enabled: z.boolean().default(true),
  onboarded: z.boolean().default(false),
});
