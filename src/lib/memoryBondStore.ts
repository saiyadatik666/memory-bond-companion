import { useState, useEffect, useCallback, useMemo } from "react";
import {
  calculateDynamicCognitiveProfile,
  getAIActivityRecommendation,
  detectAIEarlyWarning,
  getCognitiveTrends,
  calculatePersonalizationInsights,
  getCognitiveCareLoopSteps,
  get8DayCycleInfo,
  advanceCycleForDemo,
  type DynamicCognitiveProfile,
  type ActivityRecommendation,
  type EarlyWarningStatus,
  type HistoricalTrendPoint,
  type PersonalizationInsights,
  type CognitiveCareLoopStep,
  type EightDayCycleInfo,
  STATUTORY_WELLNESS_DISCLAIMER,
} from "./cognitiveCareEngine";

export type UserRole = "senior" | "caregiver" | "admin_healthcare_worker" | "healthcare_worker" | "admin";

export interface Profile {
  id: string;
  member_id: string;
  full_name: string;
  role: UserRole;
  language: string;
  age_range: string;
  phone: string;
  font_size: "normal" | "large" | "xlarge";
  high_contrast: boolean;
  voice_enabled: boolean;
  onboarded: boolean;
  easy_mode: boolean;
  reduced_motion?: boolean;
  voice_provider?: "web_speech" | "bhashini" | "google_cloud";
  selected_ner_state?: string;
  selected_state?: string;
  floating_bubble?: boolean;
  baseline_assessment?: {
    completed_at: string;
    overall_score: number;
    memory_score: number;
    attention_score: number;
    orientation_score: number;
    recall_score: number;
    notes?: string;
  };
  cognitive_profile?: DynamicCognitiveProfile;
  caregiver_alerts?: {
    missed_medicines: boolean;
    low_stock: boolean;
    sos_emergency: boolean;
    daily_routine: boolean;
  };
}

export interface CaregiverLink {
  id: string;
  caregiver_name: string;
  relationship: string;
  phone: string;
  status: "approved" | "pending" | "declined";
  linked_at: string;
  permissions: {
    medicines: boolean;
    appointments: boolean;
    games: boolean;
    sos: boolean;
    journal: boolean;
  };
}

export interface DailyRoutineCallSession {
  id: string;
  date: string;
  time: string;
  answers: { question: string; answer: string; topic: string }[];
  memory_saved?: string | null;
  summary: string;
}

export interface OfflineSyncItem {
  id: string;
  action: string;
  payload: any;
  timestamp: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  stock: number;
  daily_usage: number;
  refill_threshold: number;
  warn_days: number;
  times: string[];
  frequency: string;
  start_date: string;
  end_date: string | null;
  instructions: string;
  doctor: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface MedicineLog {
  id: string;
  medicine_id: string;
  scheduled_time: string | null;
  status: "taken" | "missed" | "skipped";
  taken_at: string;
}

export interface MedicineRefill {
  id: string;
  medicine_id: string;
  quantity: number;
  note: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  title: string;
  type: "medicine" | "appointment" | "shopping" | "routine" | "personal" | "family_call" | "hydration" | "walking" | "meal" | "custom";
  time: string;
  date: string | null;
  repeat: "daily" | "weekly" | "none";
  notes: string | null;
  active: boolean;
  last_done?: string | null;
}

export interface Appointment {
  id: string;
  title: string;
  kind: "doctor" | "hospital" | "test" | "family" | "other";
  date: string;
  time: string;
  location: string;
  notes: string;
}

export interface DailyRoutine {
  id: string;
  time: string;
  activity: string;
  icon: string;
  done_date: string | null;
}

export interface MemoryCue {
  id: string;
  category:
    | "person"
    | "family_member"
    | "child"
    | "friend"
    | "place"
    | "home"
    | "school"
    | "village"
    | "song"
    | "story"
    | "object"
    | "safety"
    | "instruction"
    | "routine"
    | "voice_memory"
    | "note";
  title: string;
  detail: string;
  photo_url?: string;
  voice_note_url?: string;
  author?: string;
  created_at?: string;
}

export interface MemoryJournalItem {
  id: string;
  title: string;
  body: string;
  entry_date: string;
  kind: "text" | "photo" | "voice";
  media_url?: string;
  audio_duration?: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  priority: number;
  is_emergency: boolean;
  photo_url?: string;
  voice_memory?: string;
  active_for_calls?: boolean;
}

export interface SosEvent {
  id: string;
  latitude: number | null;
  longitude: number | null;
  location_status: "granted" | "denied" | "unavailable" | "simulated";
  notified: string;
  emergency_description?: string;
  demo: boolean;
  created_at: string;
}

export interface GameSession {
  id: string;
  game_key: string;
  score: number;
  total: number;
  difficulty: "easy" | "medium" | "challenging";
  accuracy?: number; // 0-100%
  response_time_ms?: number; // Response time in ms
  attempts?: number;
  errors?: number;
  completion_rate?: number; // 0-100%
  game_type?: "memory" | "attention" | "recognition" | "recall" | "cultural";
  engagement_level?: "high" | "normal" | "low";
  level?: number;
  cycle_number?: number;
  created_at: string;
}

export interface SocialPost {
  id: string;
  author_name: string;
  relationship: string;
  title: string;
  content: string;
  media_type: "photo" | "voice" | "story" | "song";
  media_url?: string;
  audio_duration?: number;
  created_at: string;
  reactions: { id: string; user_name: string; reaction: string; timestamp: string }[];
  voice_replies: { id: string; audio_url?: string; transcript: string; created_at: string }[];
}

export interface ClinicalNote {
  id: string;
  worker_name: string;
  designation: string;
  date: string;
  observation: string;
  triage_status: "green" | "yellow" | "red";
  action_plan: string;
  follow_up_date: string;
}

export interface ReminderEscalation {
  id: string;
  reminder_id: string;
  reminder_title: string;
  reminder_type: string;
  scheduled_time: string;
  stage: 1 | 2 | 3; // 1 = initial alert, 2 = second reminder, 3 = caregiver escalated
  status: "pending" | "second_notice" | "caregiver_alerted" | "resolved";
  first_sent_at: string;
  second_sent_at?: string;
  caregiver_alerted_at?: string;
  resolved_at?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  role: string;
  action: string;
  details: string;
}

export interface CognitiveEngagementScore {
  overall: number; // 0 - 100
  memory: number; // 30%
  attention: number; // 20%
  recognition: number; // 20%
  recall: number; // 15%
  response_time: number; // 10%
  consistency?: number; // Performance regularity and low variance
  engagement: number; // 5%
  disclaimer: string;
}

// STORAGE KEYS (Strict User Account Data Isolation)
const STORAGE_PREFIX = "mb_app_v2_";
export const getActiveUserId = (): string => {
  if (typeof window === "undefined") return "guest";
  try {
    return localStorage.getItem("mb_authenticated_user_id") || "guest";
  } catch {
    return "guest";
  }
};

export const getKey = (key: string): string => {
  const uid = getActiveUserId();
  return `${STORAGE_PREFIX}${uid}_${key}`;
};

export const getStoredItemWithFallback = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const userSpecific = localStorage.getItem(getKey(key));
    if (userSpecific !== null) return userSpecific;
    // Fallback to legacy un-isolated key if migrating
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    return null;
  }
};

// Helper: Today YYYY-MM-DD
export const getTodayDateString = () => new Date().toISOString().slice(0, 10);

// Statutory non-diagnostic disclaimer
export const CES_DISCLAIMER =
  "This score is for tracking cognitive engagement, daily activity participation, and memory exercise performance. It is NOT a medical diagnosis and should never be used to diagnose dementia or any neurological disease.";

// Realistic Initial Demo Dataset (North Eastern Region / Indian context - Ramesh Das, 68, Assam)
export const DEMO_PROFILE: Profile = {
  id: "demo-senior-ramesh",
  member_id: "MB-NER-781003-RAMESH",
  full_name: "Ramesh Das",
  role: "senior",
  language: "en",
  age_range: "68",
  phone: "+91 98640 55123",
  font_size: "large",
  high_contrast: false,
  voice_enabled: true,
  onboarded: true,
  easy_mode: false,
  reduced_motion: false,
  voice_provider: "web_speech",
  selected_ner_state: "Assam",
  selected_state: "Assam",
  floating_bubble: true,
  baseline_assessment: {
    completed_at: "2026-02-10",
    overall_score: 76,
    memory_score: 75,
    attention_score: 80,
    orientation_score: 85,
    recall_score: 70,
    notes: "Initial cognitive baseline established. Normal alert responses with pleasant orientation.",
  },
  caregiver_alerts: {
    missed_medicines: true,
    low_stock: true,
    sos_emergency: true,
    daily_routine: true,
  },
};

export interface MemoryStory {
  id: string;
  title: string;
  category: "family" | "cultural" | "childhood" | "milestone";
  imageUrl: string;
  description: string;
  familyContext: string;
  addedBy: string;
  relationship: string;
  question: string;
  voiceAudioUrl?: string;
  voicePrompt?: string;
  dateAdded: string;
  reactions: { date: string; remembered: boolean; note?: string }[];
}

export const DEMO_MEMORY_STORIES: MemoryStory[] = [
  {
    id: "story-1",
    title: "Family Picnic by the Lake",
    category: "family",
    imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80",
    description: "Family picnic near the serene lake on a peaceful Sunday morning.",
    familyContext: "Daughter Sunita and grandson Aarav brought homemade vegetable luchi and warm Assam red tea in a thermos.",
    addedBy: "Sunita Das",
    relationship: "Daughter",
    question: "Do you remember this sunny family picnic near the lake?",
    voicePrompt: "Ramesh-ji, do you remember this peaceful family picnic with Sunita and young Aarav by the lake?",
    dateAdded: "2026-02-18",
    reactions: [{ date: "2026-03-01", remembered: true, note: "Smiled and mentioned Aarav running after butterflies" }],
  },
  {
    id: "story-2",
    title: "Handcrafting Traditional Bamboo Jaapi",
    category: "cultural",
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
    description: "Crafting a traditional woven sun hat with dried Tokou palm leaves.",
    familyContext: "Your elder brother Vikram brought fresh Tokou palm leaves from Jorhat for the harvest festival.",
    addedBy: "Vikram Das",
    relationship: "Brother",
    question: "Do you remember crafting this traditional Jaapi with Brother Vikram?",
    voicePrompt: "Look at this handmade Jaapi. Remember how carefully we shaped the bamboo ribs together on the veranda?",
    dateAdded: "2026-02-22",
    reactions: [],
  },
  {
    id: "story-3",
    title: "Grandson Aarav's First Bihu Dance",
    category: "family",
    imageUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=600&auto=format&fit=crop&q=80",
    description: "Aarav wearing his first Phulam Gamosa and beating the small wooden dhol drum.",
    familyContext: "You gifted Aarav his first little Bihu dhol on his 6th birthday.",
    addedBy: "Anita Das",
    relationship: "Caregiver & Family",
    question: "Do you remember Aarav dancing to the Bihu dhol in his new kurta?",
    voicePrompt: "Here is your grandson Aarav dancing happily with the wooden drum you gifted him!",
    dateAdded: "2026-03-05",
    reactions: [],
  },
];

export interface AssignedSenior {
  id: string;
  name: string;
  age: number;
  region: string;
  language: string;
  status: "stable" | "needs_attention" | "urgent";
  statusLabel: string;
  medicineTaken: number;
  medicineTotal: number;
  hydrationGlasses: number;
  hydrationTarget: number;
  routinesDone: number;
  routinesTotal: number;
  gamesCompleted: number;
  lastActive: string;
  lastSync: string;
  alertsCount: number;
  recentAlert?: string;
  cesScore: number;
  trend: "improving" | "stable" | "declining";
}

export const DEMO_ASSIGNED_SENIORS: AssignedSenior[] = [
  {
    id: "senior-ramesh",
    name: "Ramesh Das",
    age: 68,
    region: "Assam",
    language: "Assamese / English",
    status: "stable",
    statusLabel: "Activity Status: Normal",
    medicineTaken: 2,
    medicineTotal: 2,
    hydrationGlasses: 4,
    hydrationTarget: 6,
    routinesDone: 5,
    routinesTotal: 6,
    gamesCompleted: 2,
    lastActive: "10 minutes ago",
    lastSync: "2 minutes ago",
    alertsCount: 0,
    cesScore: 76,
    trend: "improving",
  },
  {
    id: "senior-biren",
    name: "Biren Gogoi",
    age: 76,
    region: "Assam",
    language: "Assamese",
    status: "needs_attention",
    statusLabel: "Activity pattern needs attention",
    medicineTaken: 1,
    medicineTotal: 2,
    hydrationGlasses: 3,
    hydrationTarget: 6,
    routinesDone: 3,
    routinesTotal: 6,
    gamesCompleted: 1,
    lastActive: "2 hours ago",
    lastSync: "15 minutes ago",
    alertsCount: 1,
    recentAlert: "Missed scheduled evening Donepezil dose",
    cesScore: 54,
    trend: "declining",
  },
  {
    id: "senior-meena",
    name: "Meena Barman",
    age: 81,
    region: "Meghalaya",
    language: "Khasi / English",
    status: "urgent",
    statusLabel: "Priority follow-up needed",
    medicineTaken: 0,
    medicineTotal: 2,
    hydrationGlasses: 2,
    hydrationTarget: 6,
    routinesDone: 1,
    routinesTotal: 6,
    gamesCompleted: 0,
    lastActive: "5 hours ago",
    lastSync: "1 hour ago",
    alertsCount: 2,
    recentAlert: "Extended morning inactivity and 2 missed routines",
    cesScore: 48,
    trend: "declining",
  },
  {
    id: "senior-tashi",
    name: "Tashi Namgyal",
    age: 71,
    region: "Sikkim",
    language: "Nepali / English",
    status: "stable",
    statusLabel: "Activity Status: Normal",
    medicineTaken: 2,
    medicineTotal: 2,
    hydrationGlasses: 5,
    hydrationTarget: 6,
    routinesDone: 6,
    routinesTotal: 6,
    gamesCompleted: 2,
    lastActive: "25 minutes ago",
    lastSync: "5 minutes ago",
    alertsCount: 0,
    cesScore: 82,
    trend: "improving",
  },
  {
    id: "senior-lalrin",
    name: "Lalrintluanga",
    age: 74,
    region: "Mizoram",
    language: "Mizo / English",
    status: "stable",
    statusLabel: "Activity Status: Normal",
    medicineTaken: 1,
    medicineTotal: 1,
    hydrationGlasses: 4,
    hydrationTarget: 6,
    routinesDone: 4,
    routinesTotal: 6,
    gamesCompleted: 1,
    lastActive: "40 minutes ago",
    lastSync: "8 minutes ago",
    alertsCount: 0,
    cesScore: 73,
    trend: "stable",
  },
];

export const DEMO_CAREGIVER_LINKS: CaregiverLink[] = [
  {
    id: "cg-1",
    caregiver_name: "Sunita Sharma",
    relationship: "Daughter / Primary Caregiver",
    phone: "+91 98765 43210",
    status: "approved",
    linked_at: "2026-01-15",
    permissions: {
      medicines: true,
      appointments: true,
      games: true,
      sos: true,
      journal: false,
    },
  },
  {
    id: "cg-2",
    caregiver_name: "Rajesh Sharma",
    relationship: "Son (Bengaluru)",
    phone: "+91 98765 43211",
    status: "approved",
    linked_at: "2026-02-01",
    permissions: {
      medicines: true,
      appointments: true,
      games: true,
      sos: true,
      journal: false,
    },
  },
];

export const DEMO_ROUTINE_CALLS: DailyRoutineCallSession[] = [
  {
    id: "drc-1",
    date: getTodayDateString(),
    time: "09:15",
    answers: [
      { topic: "Morning & Sleep", question: "How did you sleep last night?", answer: "Slept peacefully for 7 hours." },
      { topic: "Chai & Breakfast", question: "Did you have warm breakfast and tea?", answer: "Yes, had Assam tea and roti with vegetable sabzi." },
      { topic: "Medicine", question: "Did you take morning medicine?", answer: "Yes, took Amlodipine 5mg on time." },
      { topic: "Garden & Outdoor", question: "Did you step out in fresh air?", answer: "Sat in the balcony and watered the holy tulsi plant." },
    ],
    summary: "Ramesh was in great spirits this morning, reported peaceful sleep and confirmed morning medicine adherence.",
    memory_saved: null,
  },
];

export const DEMO_MEDICINES: Medicine[] = [
  {
    id: "med-1",
    name: "Amlodipine (Norvasc)",
    dosage: "5 mg",
    unit: "tablet",
    stock: 14,
    daily_usage: 1,
    refill_threshold: 6,
    warn_days: 5,
    times: ["08:30"],
    frequency: "daily",
    start_date: "2026-01-01",
    end_date: null,
    instructions: "Take once daily in the morning with a full glass of water after breakfast.",
    doctor: "Dr. Deepen Barua (Cardiologist)",
    notes: "Monitors blood pressure. Do not skip.",
  },
  {
    id: "med-2",
    name: "Donepezil Hydrochloride",
    dosage: "5 mg",
    unit: "tablet",
    stock: 4, // LOW STOCK - triggers warning!
    daily_usage: 1,
    refill_threshold: 6,
    warn_days: 5,
    times: ["20:30"],
    frequency: "daily",
    start_date: "2026-02-15",
    end_date: null,
    instructions: "Take 1 tablet every night before sleep. With or without food.",
    doctor: "Dr. Nilotpal Dutta (Neurologist)",
    notes: "For memory assistance. Essential daily schedule.",
  },
  {
    id: "med-3",
    name: "Vitamin B-Complex & D3",
    dosage: "1 capsule",
    unit: "capsule",
    stock: 24,
    daily_usage: 1,
    refill_threshold: 5,
    warn_days: 4,
    times: ["13:00"],
    frequency: "daily",
    start_date: "2026-01-10",
    end_date: null,
    instructions: "Take with lunch for optimal absorption.",
    doctor: "Dr. Deepen Barua",
    notes: "General nerve health & vitality.",
  },
];

export const DEMO_ROUTINES: DailyRoutine[] = [
  { id: "rt-1", time: "07:00", activity: "Morning Gentle Stretching & Breathing", icon: "sun", done_date: getTodayDateString() },
  { id: "rt-2", time: "07:45", activity: "Warm Assam Chai & Light Breakfast", icon: "coffee", done_date: getTodayDateString() },
  { id: "rt-3", time: "08:30", activity: "Morning Blood Pressure Medicine", icon: "pill", done_date: getTodayDateString() },
  { id: "rt-4", time: "10:30", activity: "Cognitive Memory Game & Brain Exercise", icon: "brain", done_date: null },
  { id: "rt-5", time: "13:00", activity: "Nutritious Lunch & Vitamin B-Complex", icon: "utensils", done_date: null },
  { id: "rt-6", time: "16:30", activity: "Evening Balcony Walk (20 minutes)", icon: "footprints", done_date: null },
  { id: "rt-7", time: "17:30", activity: "Evening Tea & Call with Daughter Sunita", icon: "phone", done_date: null },
  { id: "rt-8", time: "20:30", activity: "Dinner & Night Memory Medicine", icon: "moon", done_date: null },
  { id: "rt-9", time: "22:00", activity: "Relaxing Flute Music & Rest", icon: "bed", done_date: null },
];

export const DEMO_REMINDERS: Reminder[] = [
  { id: "rem-1", title: "Drink warm water with lemon", type: "hydration", time: "07:15", date: null, repeat: "daily", notes: "Keeps digestion active", active: true, last_done: getTodayDateString() },
  { id: "rem-2", title: "Take Amlodipine 5mg", type: "medicine", time: "08:30", date: null, repeat: "daily", notes: "After morning toast", active: true, last_done: getTodayDateString() },
  { id: "rem-3", title: "Play 1 Memory Card Match game", type: "routine", time: "10:30", date: null, repeat: "daily", notes: "Keeps focus sharp", active: true },
  { id: "rem-4", title: "Gentle 20-minute evening walk", type: "walking", time: "16:30", date: null, repeat: "daily", notes: "In balcony or apartment garden", active: true },
  { id: "rem-5", title: "Pick up fresh ginger & tea from colony market", type: "shopping", time: "17:00", date: null, repeat: "none", notes: "From colony market", active: true },
  { id: "rem-6", title: "Take Donepezil 5mg", type: "medicine", time: "20:30", date: null, repeat: "daily", notes: "Before sleep", active: true },
];

export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: "app-1",
    title: "Dr. Nilotpal Dutta - Neurological Review",
    kind: "doctor",
    date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    time: "10:30",
    location: "Guwahati Neurological Clinic, Room 204, GS Road",
    notes: "Bring previous prescription, blood reports, and 2-week memory log.",
  },
  {
    id: "app-2",
    title: "Fasting Blood Sugar & Lipid Profile",
    kind: "test",
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    time: "08:00",
    location: "Apollo Diagnostics Center, Silpukhuri",
    notes: "Fasting required from 10 PM night before. Water is allowed.",
  },
];

export const DEMO_CUES: MemoryCue[] = [
  {
    id: "cue-1",
    category: "person",
    title: "Sunita (My Loving Daughter)",
    detail: "Lives in Beltola (15 mins away). She calls every evening at 5 PM and visits on Sundays with grandson Aarav.",
  },
  {
    id: "cue-2",
    category: "object",
    title: "Reading Glasses Location",
    detail: "Kept inside the blue velvet case on the small wooden table next to my armchair in the living room.",
  },
  {
    id: "cue-3",
    category: "place",
    title: "Home Address",
    detail: "House No. 14, Brahmaputra View Enclave, Silpukhuri, Guwahati, Assam - 781003. Near Kali Mandir.",
  },
  {
    id: "cue-4",
    category: "safety",
    title: "Main Gate Spare Key",
    detail: "The spare gate key is hanging safely inside the wooden key cabinet next to the shoe rack.",
  },
  {
    id: "cue-5",
    category: "instruction",
    title: "Morning Garden Routine",
    detail: "Water the holy basil (tulsi) plant and orchids in the balcony after having the first glass of warm water.",
  },
];

export const DEMO_JOURNAL: MemoryJournalItem[] = [
  {
    id: "jou-1",
    title: "Rongali Bihu Celebration with Family",
    body: "Grandson Aarav wore a traditional Assamese kurta and danced Bihu. Sunita brought homemade pitha and laru. A joyful sunny afternoon filled with laughter.",
    entry_date: "2026-04-14",
    kind: "text",
  },
  {
    id: "jou-2",
    title: "Kaziranga Safari with Children",
    body: "We saw two one-horned rhinos near the water stream and wild elephants. The morning mist was magical over the tall elephant grass.",
    entry_date: "2025-11-20",
    kind: "text",
  },
  {
    id: "jou-3",
    title: "Voice Note: Sunita's Sunday Reminder",
    body: "Baba, don't worry about the grocery list! I have ordered your herbal tea and will bring it over this Sunday. Love you!",
    entry_date: getTodayDateString(),
    kind: "voice",
    audio_duration: 12,
  },
];

export const DEMO_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "em-1",
    name: "Sunita Sharma",
    relationship: "Daughter / Primary Caregiver",
    phone: "+91 98765 43210",
    email: "sunita.sharma@example.com",
    priority: 1,
    is_emergency: true,
    active_for_calls: true,
    photo_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    voice_memory: "यह सुनीता हैं, आपकी बेटी। वे हर रविवार आपसे मिलने आती हैं और रोज़ शाम 5 बजे फोन करती हैं।",
  },
  {
    id: "em-2",
    name: "Rahul Sharma",
    relationship: "Son",
    phone: "+91 98765 43211",
    email: "rahul.sharma@example.com",
    priority: 2,
    is_emergency: true,
    active_for_calls: true,
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    voice_memory: "यह राहुल हैं, आपके बेटे। वे बेंगलुरु में रहते हैं और वीकेंड पर वीडियो कॉल करते हैं।",
  },
  {
    id: "em-3",
    name: "Aarav Sharma",
    relationship: "Grandson",
    phone: "+91 98765 43215",
    priority: 3,
    is_emergency: false,
    active_for_calls: false,
    photo_url: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300&auto=format&fit=crop&q=80",
    voice_memory: "यह आरव है, आपका प्यारा पोता। इसे आपके साथ खेलना बहुत पसंद है।",
  },
  {
    id: "em-4",
    name: "Dr. Deepen Barua",
    relationship: "Family Doctor (Cardiologist)",
    phone: "+91 98640 12345",
    email: "dr.barua@clinic.in",
    priority: 4,
    is_emergency: true,
    active_for_calls: true,
    photo_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80",
    voice_memory: "यह डॉ. दीपेन बरुआ हैं, आपके पारिवारिक डॉक्टर।",
  },
  {
    id: "em-5",
    name: "National Senior Helpline / Police",
    relationship: "Emergency SOS Services",
    phone: "14567",
    priority: 5,
    is_emergency: true,
    active_for_calls: true,
    voice_memory: "यह राष्ट्रीय वरिष्ठ नागरिक आपातकालीन हेल्पलाइन है।",
  },
];

export interface AppNotification {
  id: string;
  category:
    | "sos"
    | "medicine_low"
    | "medicine_missed"
    | "medicine_due"
    | "appointment"
    | "caregiver_alert"
    | "reminder"
    | "routine"
    | "general";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    category: "medicine_low",
    title: "Medicine Running Low: Donepezil 5mg",
    body: "Only 4 tablets remaining (Threshold: 6). Please arrange a refill soon. Caregiver Sunita has been notified.",
    read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif-2",
    category: "appointment",
    title: "Upcoming Doctor Visit",
    body: "Dr. Nilotpal Dutta - Neurological Review in 3 days (10:30 AM).",
    read: false,
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "notif-3",
    category: "caregiver_alert",
    title: "Daily Morning Check Complete",
    body: "Amlodipine dose was confirmed taken at 08:30 AM today.",
    read: true,
    created_at: new Date(Date.now() - 28800000).toISOString(),
  },
];

// Rich 4-week cognitive sessions for healthcare trends (Week 1 = 52, Week 2 = 58, Week 3 = 53, Week 4 = 60)
export const DEMO_GAME_SESSIONS: GameSession[] = [
  // Week 4 (Most recent) - average ~60
  { id: "gs-w4-1", game_key: "card_match", score: 6, total: 6, difficulty: "easy", accuracy: 100, response_time_ms: 3200, attempts: 6, errors: 0, completion_rate: 100, game_type: "memory", engagement_level: "high", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "gs-w4-2", game_key: "cultural_ner", score: 4, total: 5, difficulty: "medium", accuracy: 80, response_time_ms: 4100, attempts: 5, errors: 1, completion_rate: 100, game_type: "cultural", engagement_level: "high", created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: "gs-w4-3", game_key: "object_recall", score: 5, total: 6, difficulty: "easy", accuracy: 83, response_time_ms: 3800, attempts: 6, errors: 1, completion_rate: 100, game_type: "recall", engagement_level: "high", created_at: new Date(Date.now() - 259200000).toISOString() },

  // Week 3 - average ~53
  { id: "gs-w3-1", game_key: "pattern_recall", score: 3, total: 6, difficulty: "medium", accuracy: 50, response_time_ms: 5400, attempts: 6, errors: 3, completion_rate: 85, game_type: "attention", engagement_level: "normal", created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "gs-w3-2", game_key: "word_memory", score: 3, total: 5, difficulty: "easy", accuracy: 60, response_time_ms: 4900, attempts: 5, errors: 2, completion_rate: 90, game_type: "memory", engagement_level: "normal", created_at: new Date(Date.now() - 9 * 86400000).toISOString() },

  // Week 2 - average ~58
  { id: "gs-w2-1", game_key: "card_match", score: 5, total: 6, difficulty: "easy", accuracy: 83, response_time_ms: 3900, attempts: 7, errors: 1, completion_rate: 100, game_type: "memory", engagement_level: "high", created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: "gs-w2-2", game_key: "routine_recall", score: 4, total: 5, difficulty: "easy", accuracy: 80, response_time_ms: 3600, attempts: 5, errors: 1, completion_rate: 100, game_type: "recall", engagement_level: "high", created_at: new Date(Date.now() - 17 * 86400000).toISOString() },

  // Week 1 - average ~52
  { id: "gs-w1-1", game_key: "card_match", score: 3, total: 6, difficulty: "easy", accuracy: 50, response_time_ms: 5800, attempts: 8, errors: 3, completion_rate: 80, game_type: "memory", engagement_level: "normal", created_at: new Date(Date.now() - 21 * 86400000).toISOString() },
  { id: "gs-w1-2", game_key: "sequence_memory", score: 3, total: 5, difficulty: "easy", accuracy: 60, response_time_ms: 5100, attempts: 6, errors: 2, completion_rate: 85, game_type: "attention", engagement_level: "normal", created_at: new Date(Date.now() - 25 * 86400000).toISOString() },
];

export const DEMO_MEDICINE_LOGS: MedicineLog[] = [
  { id: "ml-1", medicine_id: "med-1", scheduled_time: "08:30", status: "taken", taken_at: new Date().toISOString() },
  { id: "ml-2", medicine_id: "med-1", scheduled_time: "08:30", status: "taken", taken_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "ml-3", medicine_id: "med-2", scheduled_time: "20:30", status: "taken", taken_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "ml-4", medicine_id: "med-3", scheduled_time: "13:00", status: "taken", taken_at: new Date(Date.now() - 86400000).toISOString() },
];

export const DEMO_SOCIAL_POSTS: SocialPost[] = [
  {
    id: "sp-1",
    author_name: "Sunita Sharma",
    relationship: "Daughter (Beltola)",
    title: "Aarav in his Bihu dress!",
    content: "Baba, looking at how big Aarav has gotten! He is practicing his Bihu dhol beats for you. We are bringing homemade pitha this Sunday afternoon!",
    media_type: "photo",
    media_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    reactions: [
      { id: "rx-1", user_name: "Ramesh Sharma", reaction: "❤️ Loved", timestamp: new Date(Date.now() - 7200000).toISOString() },
    ],
    voice_replies: [
      { id: "vr-1", transcript: "Aarav looks like a prince! Sunita, please bring sesame laru if you can. Love you all.", created_at: new Date(Date.now() - 3600000).toISOString() },
    ],
  },
  {
    id: "sp-2",
    author_name: "Rajesh Sharma",
    relationship: "Son (Bengaluru)",
    title: "Morning Flute & Wishing you a peaceful day",
    content: "Namaste Pitaji! Sending you this relaxing 20-second melody recorded by grandson Vivek. Please remember to drink your morning warm water!",
    media_type: "voice",
    audio_duration: 20,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    reactions: [
      { id: "rx-2", user_name: "Ramesh Sharma", reaction: "🙏 Blessed", timestamp: new Date(Date.now() - 82000000).toISOString() },
    ],
    voice_replies: [],
  },
];

export const DEMO_CLINICAL_NOTES: ClinicalNote[] = [
  {
    id: "cn-1",
    worker_name: "Ananya Goswami, CHW",
    designation: "Community Healthcare Worker (ASHA / PHC Beltola)",
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    observation: "Home visit completed. Blood pressure 128/82 mmHg. Ramesh Sharma confirmed regular adherence to morning Amlodipine. Cognitive engagement scores trending upward with good orientation. High social interaction with family.",
    triage_status: "green",
    action_plan: "Continue daily routine reminders and weekly cognitive card match exercises. Next checkup scheduled with Dr. Nilotpal Dutta.",
    follow_up_date: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
  },
  {
    id: "cn-2",
    worker_name: "Dr. Nilotpal Dutta",
    designation: "Consultant Neurologist (GNRC Clinic)",
    date: new Date(Date.now() - 16 * 86400000).toISOString().slice(0, 10),
    observation: "Routine memory assessment. Patient demonstrates good recognition of familiar faces and cultural cues. Donepezil tolerance satisfactory. Caregiver Sunita reports good adherence.",
    triage_status: "green",
    action_plan: "Maintain current medicine dosage. Encourage daily hydration and interactive routine calls.",
    follow_up_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
  },
];

export const DEMO_REMINDER_ESCALATIONS: ReminderEscalation[] = [
  {
    id: "esc-1",
    reminder_id: "rem-2",
    reminder_title: "Take Amlodipine 5mg",
    reminder_type: "medicine",
    scheduled_time: "08:30",
    stage: 1,
    status: "resolved",
    first_sent_at: new Date(Date.now() - 7200000).toISOString(),
    resolved_at: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: "esc-2",
    reminder_id: "rem-1",
    reminder_title: "Drink warm water with lemon",
    reminder_type: "hydration",
    scheduled_time: "07:15",
    stage: 1,
    status: "resolved",
    first_sent_at: new Date(Date.now() - 14400000).toISOString(),
    resolved_at: new Date(Date.now() - 12000000).toISOString(),
  },
];

export const DEMO_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "aud-1",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    role: "caregiver",
    action: "VIEW_JOURNAL_PERMITTED",
    details: "Caregiver Sunita Sharma accessed authorized memory journal entry.",
  },
  {
    id: "aud-2",
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    role: "healthcare_worker",
    action: "RECORD_CLINICAL_NOTE",
    details: "CHW Ananya Goswami added observation note for Ramesh Sharma.",
  },
];

// Cognitive Engagement Score (CES) Calculator
export function calculateCES(sessions: GameSession[], routinesDoneCount: number, routinesTotal: number): CognitiveEngagementScore {
  if (sessions.length === 0) {
    return {
      overall: 72,
      memory: 74,
      attention: 70,
      recognition: 75,
      recall: 68,
      response_time: 72,
      consistency: 70,
      engagement: 75,
      disclaimer: CES_DISCLAIMER,
    };
  }

  // Split sessions by type
  const memorySessions = sessions.filter((s) => s.game_type === "memory" || s.game_key === "card_match" || s.game_key === "word_memory" || s.game_key === "sequence_memory");
  const attentionSessions = sessions.filter((s) => s.game_type === "attention" || s.game_key === "pattern_recall" || s.game_key === "find_difference");
  const recognitionSessions = sessions.filter((s) => s.game_type === "recognition" || s.game_key === "match_object" || s.game_key === "family_photo" || s.game_type === "cultural");
  const recallSessions = sessions.filter((s) => s.game_type === "recall" || s.game_key === "object_recall" || s.game_key === "routine_recall" || s.game_key === "voice_quiz");

  const calcAvg = (items: GameSession[], defaultVal: number) => {
    if (items.length === 0) return defaultVal;
    const sum = items.reduce((acc, curr) => {
      const accScore = curr.accuracy !== undefined ? curr.accuracy : (curr.total > 0 ? (curr.score / curr.total) * 100 : 70);
      return acc + accScore;
    }, 0);
    return Math.round(sum / items.length);
  };

  const memScore = calcAvg(memorySessions, 74);
  const attScore = calcAvg(attentionSessions, 72);
  const recScore = calcAvg(recognitionSessions, 76);
  const recallScore = calcAvg(recallSessions, 70);

  // Response Time score: < 4000ms is 85+, 4000-7000ms is 70, > 7000ms is 55
  const avgResponseTime = sessions.reduce((acc, s) => acc + (s.response_time_ms || 4200), 0) / sessions.length;
  let responseTimeScore = 75;
  if (avgResponseTime < 3500) responseTimeScore = 90;
  else if (avgResponseTime < 5000) responseTimeScore = 78;
  else if (avgResponseTime < 7000) responseTimeScore = 65;
  else responseTimeScore = 50;

  // Consistency score: low variance across recent sessions
  const accuracies = sessions.slice(0, 8).map((s) => s.accuracy ?? 70);
  const meanAcc = accuracies.reduce((a, b) => a + b, 0) / (accuracies.length || 1);
  const variance = accuracies.reduce((sum, val) => sum + Math.pow(val - meanAcc, 2), 0) / (accuracies.length || 1);
  const consistencyScore = Math.max(10, Math.min(100, Math.round(100 - Math.sqrt(variance) * 2.2)));

  // Engagement score: based on routines completion + session count
  const routineRatio = routinesTotal > 0 ? routinesDoneCount / routinesTotal : 0.5;
  const engagementScore = Math.min(100, Math.round(routineRatio * 60 + Math.min(sessions.length * 8, 40)));

  // Weighted Overall: Memory 30%, Attention 20%, Recognition 20%, Recall 15%, ResponseTime 10%, Engagement 5%
  const overall = Math.round(
    memScore * 0.30 +
    attScore * 0.20 +
    recScore * 0.20 +
    recallScore * 0.15 +
    responseTimeScore * 0.10 +
    engagementScore * 0.05
  );

  return {
    overall: Math.max(10, Math.min(100, overall)),
    memory: memScore,
    attention: attScore,
    recognition: recScore,
    recall: recallScore,
    response_time: responseTimeScore,
    consistency: consistencyScore,
    engagement: engagementScore,
    disclaimer: CES_DISCLAIMER,
  };
}

// Dynamic Difficulty Adaptation Engine
export function getRecommendedDifficulty(
  gameKey: string,
  sessions: GameSession[],
  currentDifficulty: "easy" | "medium" | "challenging" = "easy"
): { recommended: "easy" | "medium" | "challenging"; rationale: string; nextItemsCount: number } {
  const relevant = sessions.filter((s) => s.game_key === gameKey || !gameKey).slice(0, 3);
  if (relevant.length === 0) {
    return { recommended: "easy", rationale: "Standard relaxed starting pace.", nextItemsCount: 3 };
  }

  const avgAccuracy = relevant.reduce((sum, s) => sum + (s.accuracy !== undefined ? s.accuracy : (s.score / s.total) * 100), 0) / relevant.length;
  const avgTime = relevant.reduce((sum, s) => sum + (s.response_time_ms || 4000), 0) / relevant.length;

  if (avgAccuracy > 80 && avgTime < 4500) {
    const nextDiff = currentDifficulty === "easy" ? "medium" : "challenging";
    return {
      recommended: nextDiff,
      rationale: "Accuracy > 80% with prompt responses. AI adapted difficulty higher for cognitive stimulus.",
      nextItemsCount: nextDiff === "challenging" ? 7 : 5,
    };
  } else if (avgAccuracy < 50) {
    return {
      recommended: "easy",
      rationale: "Accuracy < 50%. AI reduced difficulty for a gentle, pressure-free experience.",
      nextItemsCount: 3,
    };
  }

  return {
    recommended: currentDifficulty,
    rationale: "Accuracy between 50%–80%. Current difficulty maintained for balanced practice.",
    nextItemsCount: currentDifficulty === "challenging" ? 7 : currentDifficulty === "medium" ? 5 : 3,
  };
}

// Memory Bond Reactive Store
export function useMemoryBondStore() {
  // Offline / Online status
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing] = useState<boolean>(false);
  const [offlineModeForced, setOfflineModeForced] = useState<boolean>(false);

  // Active Profile & Role
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const saved = localStorage.getItem(getKey("profile"));
      return saved ? JSON.parse(saved) : DEMO_PROFILE;
    } catch {
      return DEMO_PROFILE;
    }
  });

  // Medicines
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("medicines"));
      return saved ? JSON.parse(saved) : DEMO_MEDICINES;
    } catch {
      return DEMO_MEDICINES;
    }
  });

  const [medicineLogs, setMedicineLogs] = useState<MedicineLog[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("medicine_logs"));
      return saved ? JSON.parse(saved) : DEMO_MEDICINE_LOGS;
    } catch {
      return DEMO_MEDICINE_LOGS;
    }
  });

  // Reminders
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("reminders"));
      return saved ? JSON.parse(saved) : DEMO_REMINDERS;
    } catch {
      return DEMO_REMINDERS;
    }
  });

  // Daily Routines
  const [routines, setRoutines] = useState<DailyRoutine[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("routines"));
      return saved ? JSON.parse(saved) : DEMO_ROUTINES;
    } catch {
      return DEMO_ROUTINES;
    }
  });

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("appointments"));
      return saved ? JSON.parse(saved) : DEMO_APPOINTMENTS;
    } catch {
      return DEMO_APPOINTMENTS;
    }
  });

  // Memory Cues
  const [memoryCues, setMemoryCues] = useState<MemoryCue[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("cues"));
      return saved ? JSON.parse(saved) : DEMO_CUES;
    } catch {
      return DEMO_CUES;
    }
  });

  // Memory Journal
  const [journal, setJournal] = useState<MemoryJournalItem[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("journal"));
      return saved ? JSON.parse(saved) : DEMO_JOURNAL;
    } catch {
      return DEMO_JOURNAL;
    }
  });

  // Emergency Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("contacts"));
      return saved ? JSON.parse(saved) : DEMO_EMERGENCY_CONTACTS;
    } catch {
      return DEMO_EMERGENCY_CONTACTS;
    }
  });

  // SOS Events
  const [sosEvents, setSosEvents] = useState<SosEvent[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("sos_events"));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Game Sessions
  const [gameSessions, setGameSessions] = useState<GameSession[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("game_sessions"));
      return saved ? JSON.parse(saved) : DEMO_GAME_SESSIONS;
    } catch {
      return DEMO_GAME_SESSIONS;
    }
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("notifications"));
      return saved ? JSON.parse(saved) : DEMO_NOTIFICATIONS;
    } catch {
      return DEMO_NOTIFICATIONS;
    }
  });

  // Caregiver Links
  const [caregiverLinks, setCaregiverLinks] = useState<CaregiverLink[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("caregiver_links"));
      return saved ? JSON.parse(saved) : DEMO_CAREGIVER_LINKS;
    } catch {
      return DEMO_CAREGIVER_LINKS;
    }
  });

  // Daily Routine Calls
  const [routineCalls, setRoutineCalls] = useState<DailyRoutineCallSession[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("routine_calls"));
      return saved ? JSON.parse(saved) : DEMO_ROUTINE_CALLS;
    } catch {
      return DEMO_ROUTINE_CALLS;
    }
  });

  // Social Engagement Posts
  const [socialFeed, setSocialFeed] = useState<SocialPost[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("social_feed"));
      return saved ? JSON.parse(saved) : DEMO_SOCIAL_POSTS;
    } catch {
      return DEMO_SOCIAL_POSTS;
    }
  });

  // Clinical Notes (Healthcare Worker)
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("clinical_notes"));
      return saved ? JSON.parse(saved) : DEMO_CLINICAL_NOTES;
    } catch {
      return DEMO_CLINICAL_NOTES;
    }
  });

  // Offline Sync Queue
  const [syncQueue, setSyncQueue] = useState<OfflineSyncItem[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("sync_queue"));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reminder Escalation Tracker (Stage 1: Sent -> Stage 2: Second Notice -> Stage 3: Caregiver Escalated)
  const [reminderEscalations, setReminderEscalations] = useState<ReminderEscalation[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("reminder_escalations"));
      return saved ? JSON.parse(saved) : DEMO_REMINDER_ESCALATIONS;
    } catch {
      return DEMO_REMINDER_ESCALATIONS;
    }
  });

  // Audit Log for sensitive patient privacy compliance
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("audit_log"));
      return saved ? JSON.parse(saved) : DEMO_AUDIT_LOG;
    } catch {
      return DEMO_AUDIT_LOG;
    }
  });

  // Hydration Tracking State (SIH 2026 Section 13)
  const [hydrationGlasses, setHydrationGlasses] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(getKey("hydration_glasses"));
      return saved ? parseInt(saved, 10) : 4;
    } catch {
      return 4;
    }
  });

  const [hydrationTarget, setHydrationTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(getKey("hydration_target"));
      return saved ? parseInt(saved, 10) : 6;
    } catch {
      return 6;
    }
  });

  // Memory Stories (SIH 2026 Section 22)
  const [memoryStories, setMemoryStories] = useState<MemoryStory[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("memory_stories"));
      return saved ? JSON.parse(saved) : DEMO_MEMORY_STORIES;
    } catch {
      return DEMO_MEMORY_STORIES;
    }
  });

  // Multi-Senior Monitoring for Caregivers & Healthcare Workers (SIH 2026 Section 16 & 19)
  const [assignedSeniors, setAssignedSeniors] = useState<AssignedSenior[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("assigned_seniors"));
      return saved ? JSON.parse(saved) : DEMO_ASSIGNED_SENIORS;
    } catch {
      return DEMO_ASSIGNED_SENIORS;
    }
  });

  // Sync Timestamp & Status (SIH 2026 Section 26)
  const [lastSyncTime, setLastSyncTime] = useState<string>("2 minutes ago");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(getKey("profile"), JSON.stringify(profile));
      localStorage.setItem(getKey("medicines"), JSON.stringify(medicines));
      localStorage.setItem(getKey("medicine_logs"), JSON.stringify(medicineLogs));
      localStorage.setItem(getKey("reminders"), JSON.stringify(reminders));
      localStorage.setItem(getKey("routines"), JSON.stringify(routines));
      localStorage.setItem(getKey("appointments"), JSON.stringify(appointments));
      localStorage.setItem(getKey("cues"), JSON.stringify(memoryCues));
      localStorage.setItem(getKey("journal"), JSON.stringify(journal));
      localStorage.setItem(getKey("contacts"), JSON.stringify(contacts));
      localStorage.setItem(getKey("sos_events"), JSON.stringify(sosEvents));
      localStorage.setItem(getKey("game_sessions"), JSON.stringify(gameSessions));
      localStorage.setItem(getKey("notifications"), JSON.stringify(notifications));
      localStorage.setItem(getKey("caregiver_links"), JSON.stringify(caregiverLinks));
      localStorage.setItem(getKey("routine_calls"), JSON.stringify(routineCalls));
      localStorage.setItem(getKey("social_feed"), JSON.stringify(socialFeed));
      localStorage.setItem(getKey("clinical_notes"), JSON.stringify(clinicalNotes));
      localStorage.setItem(getKey("sync_queue"), JSON.stringify(syncQueue));
      localStorage.setItem(getKey("reminder_escalations"), JSON.stringify(reminderEscalations));
      localStorage.setItem(getKey("audit_log"), JSON.stringify(auditLog));
      localStorage.setItem(getKey("hydration_glasses"), String(hydrationGlasses));
      localStorage.setItem(getKey("hydration_target"), String(hydrationTarget));
      localStorage.setItem(getKey("memory_stories"), JSON.stringify(memoryStories));
      localStorage.setItem(getKey("assigned_seniors"), JSON.stringify(assignedSeniors));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }, [profile, medicines, medicineLogs, reminders, routines, appointments, memoryCues, journal, contacts, sosEvents, gameSessions, notifications, caregiverLinks, routineCalls, socialFeed, clinicalNotes, syncQueue, reminderEscalations, auditLog, hydrationGlasses, hydrationTarget, memoryStories, assignedSeniors]);

  // Network online/offline listener with automatic sync flush
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      try {
        const queued = localStorage.getItem(getKey("sync_queue"));
        if (queued) {
          const items: OfflineSyncItem[] = JSON.parse(queued);
          if (items.length > 0) {
            const notif: AppNotification = {
              id: `sync-${Date.now()}`,
              category: "general",
              title: "Cloud Synchronized",
              body: `Synced ${items.length} offline update(s) securely to Memory Bond.`,
              read: false,
              created_at: new Date().toISOString(),
            };
            setNotifications((prev) => [notif, ...prev]);
            setSyncQueue([]);
            localStorage.setItem(getKey("sync_queue"), JSON.stringify([]));
          }
        }
      } catch (e) {
        console.warn("Sync queue flush error:", e);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Apply Font Size and High Contrast to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-scale-normal", "text-scale-large", "text-scale-xlarge", "contrast-boost");

    if (profile.font_size === "large") root.classList.add("text-scale-large");
    else if (profile.font_size === "xlarge") root.classList.add("text-scale-xlarge");
    else root.classList.add("text-scale-normal");

    if (profile.high_contrast) {
      root.classList.add("contrast-boost");
    }
  }, [profile.font_size, profile.high_contrast]);

  // --- ACTIONS ---

  const setRole = useCallback((role: UserRole) => {
    setProfile((prev) => ({ ...prev, role }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  // Offline Sync Queue Helper (Queues real actions when offline)
  const enqueueOfflineAction = useCallback(
    (action: string, payload: any) => {
      if (offlineModeForced || !isOnline) {
        const item: OfflineSyncItem = {
          id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          action,
          payload,
          timestamp: new Date().toISOString(),
        };
        setSyncQueue((prev) => [...prev, item]);
      }
    },
    [offlineModeForced, isOnline]
  );

  // Smart Medicine Dose status (taken, missed, skipped)
  const markMedicineStatus = useCallback(
    (id: string, status: "taken" | "missed" | "skipped", note?: string) => {
      const scheduledTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      enqueueOfflineAction("MARK_MEDICINE_STATUS", { id, status, note, scheduledTime });

      if (status === "taken") {
        setMedicines((prev) =>
          prev.map((med) => {
            if (med.id !== id) return med;
            const newStock = Math.max(0, med.stock - 1);
            const daysRemaining = med.daily_usage > 0 ? newStock / med.daily_usage : 99;

            if (newStock <= med.refill_threshold || daysRemaining <= 3) {
              const alertNotif: AppNotification = {
                id: `low-${id}-${Date.now()}`,
                category: "medicine_low",
                title: `Refill Alert: ${med.name}`,
                body: `Only ${newStock} ${med.unit}s remaining (~${Math.floor(daysRemaining)} days left). Caregiver has been alerted.`,
                read: false,
                created_at: new Date().toISOString(),
              };
              setNotifications((n) => [alertNotif, ...n]);
            }

            return { ...med, stock: newStock };
          })
        );
      } else if (status === "missed") {
        const missedNotif: AppNotification = {
          id: `missed-${id}-${Date.now()}`,
          category: "medicine_missed",
          title: "Missed Medicine Dose Recorded",
          body: `Dose was marked missed at ${scheduledTime}. Note: ${note || "Follow schedule closely"}.`,
          read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications((n) => [missedNotif, ...n]);
      }

      const log: MedicineLog = {
        id: `log-${Date.now()}`,
        medicine_id: id,
        scheduled_time: scheduledTime,
        status,
        taken_at: new Date().toISOString(),
      };
      setMedicineLogs((logs) => [log, ...logs]);
    },
    [enqueueOfflineAction]
  );

  const takeMedicine = useCallback((id: string) => {
    markMedicineStatus(id, "taken");
  }, [markMedicineStatus]);

  const refillMedicine = useCallback((id: string, quantity: number, note?: string) => {
    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id !== id) return med;
        const newStock = med.stock + quantity;
        return { ...med, stock: newStock };
      })
    );

    const notif: AppNotification = {
      id: `refill-${Date.now()}`,
      category: "caregiver_alert",
      title: "Medicine Refill Added",
      body: `Added +${quantity} units to stock. Note: ${note || "Regular refill"}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((n) => [notif, ...n]);
  }, []);

  const addMedicine = useCallback((med: Omit<Medicine, "id">) => {
    const newMed: Medicine = {
      ...med,
      id: `med-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMedicines((prev) => [...prev, newMed]);
  }, []);

  const updateMedicine = useCallback((id: string, patch: Partial<Medicine>) => {
    setMedicines((prev) =>
      prev.map((med) => (med.id === id ? { ...med, ...patch, updated_at: new Date().toISOString() } : med))
    );
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Reminders
  const addReminder = useCallback((rem: Omit<Reminder, "id">) => {
    const newRem: Reminder = { ...rem, id: `rem-${Date.now()}` };
    enqueueOfflineAction("ADD_REMINDER", newRem);
    setReminders((prev) => [...prev, newRem]);
  }, [enqueueOfflineAction]);

  const updateReminder = useCallback((id: string, patch: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }, []);

  const markReminderDone = useCallback((id: string) => {
    setReminders((prev) => prev.map((r): Reminder => (r.id === id ? { ...r, last_done: getTodayDateString() } : r)));
  }, []);

  const snoozeReminder = useCallback((id: string, minutes: number) => {
    const now = new Date(Date.now() + minutes * 60000);
    const newTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, time: newTime, last_done: null } : r))
    );
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Routines
  const toggleRoutineDone = useCallback((id: string) => {
    const today = getTodayDateString();
    enqueueOfflineAction("TOGGLE_ROUTINE", { id, date: today });
    setRoutines((prev) =>
      prev.map((rt): DailyRoutine => (rt.id === id ? { ...rt, done_date: rt.done_date === today ? null : today } : rt))
    );
  }, [enqueueOfflineAction]);

  const addRoutine = useCallback((rt: Omit<DailyRoutine, "id">) => {
    const newRt: DailyRoutine = { ...rt, id: `rt-${Date.now()}` };
    setRoutines((prev) => [...prev, newRt]);
  }, []);

  // Appointments
  const addAppointment = useCallback((app: Omit<Appointment, "id">) => {
    const newApp: Appointment = { ...app, id: `app-${Date.now()}` };
    setAppointments((prev) => [...prev, newApp]);
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Memory Cues
  const addMemoryCue = useCallback((cue: Omit<MemoryCue, "id">) => {
    const newCue: MemoryCue = { ...cue, id: `cue-${Date.now()}` };
    setMemoryCues((prev) => [...prev, newCue]);
  }, []);

  const deleteMemoryCue = useCallback((id: string) => {
    setMemoryCues((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Journal
  const addJournalEntry = useCallback((item: Omit<MemoryJournalItem, "id">) => {
    const newItem: MemoryJournalItem = { ...item, id: `jou-${Date.now()}` };
    enqueueOfflineAction("ADD_JOURNAL", newItem);
    setJournal((prev) => [newItem, ...prev]);
  }, [enqueueOfflineAction]);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournal((prev) => prev.filter((j) => j.id !== id));
  }, []);

  // Emergency Contacts
  const addContact = useCallback((contact: Omit<EmergencyContact, "id">) => {
    const newContact: EmergencyContact = { ...contact, id: `em-${Date.now()}` };
    setContacts((prev) => [...prev, newContact]);
  }, []);

  const updateContact = useCallback((id: string, patch: Partial<EmergencyContact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Game Sessions with rich cognitive metrics
  const recordGameSession = useCallback((
    gameKey: string,
    score: number,
    total: number,
    difficulty: "easy" | "medium" | "challenging",
    extra?: {
      accuracy?: number;
      responseTimeMs?: number;
      attempts?: number;
      errors?: number;
      gameType?: "memory" | "attention" | "recognition" | "recall" | "cultural";
      level?: number;
      cycleNumber?: number;
    }
  ) => {
    const accuracy = extra?.accuracy !== undefined ? extra.accuracy : (total > 0 ? Math.round((score / total) * 100) : 100);
    const activeCycle = get8DayCycleInfo(gameSessions);
    const session: GameSession = {
      id: `gs-${Date.now()}`,
      game_key: gameKey,
      score,
      total,
      difficulty,
      accuracy,
      response_time_ms: extra?.responseTimeMs || 3500,
      attempts: extra?.attempts || total,
      errors: extra?.errors || Math.max(0, total - score),
      completion_rate: 100,
      game_type: extra?.gameType || "memory",
      engagement_level: accuracy >= 75 ? "high" : "normal",
      level: extra?.level,
      cycle_number: extra?.cycleNumber || activeCycle.cycleNumber,
      created_at: new Date().toISOString(),
    };
    enqueueOfflineAction("RECORD_GAME_SESSION", session);
    setGameSessions((prev) => [session, ...prev]);
  }, [enqueueOfflineAction, gameSessions]);

  // SOS Trigger
  const triggerSos = useCallback(
    (params?: {
      latitude: number | null;
      longitude: number | null;
      status: "granted" | "denied" | "unavailable" | "simulated";
      emergencyDescription?: string;
    }) => {
      const newEvent: SosEvent = {
        id: `sos-${Date.now()}`,
        latitude: params?.latitude ?? 26.1822, // Guwahati coordinates as realistic default
        longitude: params?.longitude ?? 91.7617,
        location_status: params?.status ?? "simulated",
        notified: contacts.filter((c) => c.is_emergency).map((c) => c.name).join(", ") || "All Emergency Contacts",
        emergency_description: params?.emergencyDescription,
        demo: true,
        created_at: new Date().toISOString(),
      };

      setSosEvents((prev) => [newEvent, ...prev]);

      const sosNotif: AppNotification = {
        id: `sos-alert-${Date.now()}`,
        category: "sos",
        title: "EMERGENCY SOS ALERT ACTIVATED",
        body: `Senior ${profile.full_name} triggered an SOS. Details: ${params?.emergencyDescription || "Assistance requested"}. Notified: ${newEvent.notified}.`,
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [sosNotif, ...prev]);

      return newEvent;
    },
    [contacts, profile.full_name]
  );

  // SOS Cancel: immediately halt emergency state, clear notifications & log safety
  const cancelActiveSos = useCallback(() => {
    setNotifications((prev) =>
      prev.filter((n) => !(n.category === "sos" && !n.read))
    );
    const cancelLog: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      role: profile.role,
      action: "SOS_CANCELLED",
      details: `Active SOS emergency cancelled by user (${profile.full_name}). Emergency alerts disarmed safely.`,
    };
    setAuditLog((prev) => [cancelLog, ...prev]);
  }, [profile.role, profile.full_name]);

  // Social Engagement Actions
  const addSocialPost = useCallback((post: Omit<SocialPost, "id" | "created_at" | "reactions" | "voice_replies">) => {
    const newPost: SocialPost = {
      ...post,
      id: `sp-${Date.now()}`,
      created_at: new Date().toISOString(),
      reactions: [],
      voice_replies: [],
    };
    setSocialFeed((prev) => [newPost, ...prev]);
  }, []);

  const addSocialReaction = useCallback((postId: string, reaction: string) => {
    setSocialFeed((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const newReaction = {
          id: `rx-${Date.now()}`,
          user_name: profile.full_name,
          reaction,
          timestamp: new Date().toISOString(),
        };
        return { ...post, reactions: [newReaction, ...post.reactions] };
      })
    );
  }, [profile.full_name]);

  const addSocialVoiceReply = useCallback((postId: string, transcript: string) => {
    setSocialFeed((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const newReply = {
          id: `vr-${Date.now()}`,
          transcript,
          created_at: new Date().toISOString(),
        };
        return { ...post, voice_replies: [...post.voice_replies, newReply] };
      })
    );
  }, []);

  // Clinical Notes Actions (Healthcare Worker)
  const addClinicalNote = useCallback((note: Omit<ClinicalNote, "id" | "date">) => {
    const newNote: ClinicalNote = {
      ...note,
      id: `cn-${Date.now()}`,
      date: getTodayDateString(),
    };
    setClinicalNotes((prev) => [newNote, ...prev]);
  }, []);

  // Baseline Cognitive Assessment Action
  const updateBaselineAssessment = useCallback((assessment: Profile["baseline_assessment"]) => {
    setProfile((prev) => ({ ...prev, baseline_assessment: assessment }));
  }, []);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Hydration Actions (SIH 2026 Section 13)
  const drinkGlassOfWater = useCallback(() => {
    setHydrationGlasses((prev) => {
      const next = Math.min(10, prev + 1);
      enqueueOfflineAction("DRINK_WATER", { glasses: next, timestamp: new Date().toISOString() });
      const notif: AppNotification = {
        id: `hyd-${Date.now()}`,
        category: "routine",
        title: "Hydration Recorded 💧",
        body: `Good job Ramesh! 1 glass of water recorded (${next} of ${hydrationTarget} glasses today).`,
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((n) => [notif, ...n]);

      // Update in assigned seniors list for caregiver
      setAssignedSeniors((seniors) =>
        seniors.map((s) => (s.id === "senior-ramesh" ? { ...s, hydrationGlasses: next } : s))
      );

      return next;
    });
  }, [hydrationTarget, enqueueOfflineAction]);

  // Memory Story Actions (SIH 2026 Section 22)
  const recordMemoryStoryReaction = useCallback(
    (storyId: string, remembered: boolean, note?: string) => {
      setMemoryStories((prev) =>
        prev.map((s) => {
          if (s.id !== storyId) return s;
          const newReaction = {
            date: getTodayDateString(),
            remembered,
            note: note || (remembered ? "Confirmed personal memory recognition" : "Looked with gentle interest"),
          };
          return { ...s, reactions: [newReaction, ...s.reactions] };
        })
      );
      enqueueOfflineAction("MEMORY_STORY_REACTION", {
        storyId,
        remembered,
        note,
        timestamp: new Date().toISOString(),
      });
    },
    [enqueueOfflineAction]
  );

  // Reset to rich realistic demo data
  const resetToDemoData = useCallback(() => {
    setProfile(DEMO_PROFILE);
    setMedicines(DEMO_MEDICINES);
    setMedicineLogs(DEMO_MEDICINE_LOGS);
    setReminders(DEMO_REMINDERS);
    setRoutines(DEMO_ROUTINES);
    setAppointments(DEMO_APPOINTMENTS);
    setMemoryCues(DEMO_CUES);
    setJournal(DEMO_JOURNAL);
    setContacts(DEMO_EMERGENCY_CONTACTS);
    setGameSessions(DEMO_GAME_SESSIONS);
    setNotifications(DEMO_NOTIFICATIONS);
    setCaregiverLinks(DEMO_CAREGIVER_LINKS);
    setRoutineCalls(DEMO_ROUTINE_CALLS);
    setSocialFeed(DEMO_SOCIAL_POSTS);
    setClinicalNotes(DEMO_CLINICAL_NOTES);
    setSyncQueue([]);
    setSosEvents([]);
    setReminderEscalations(DEMO_REMINDER_ESCALATIONS);
    setAuditLog(DEMO_AUDIT_LOG);
    setHydrationGlasses(4);
    setHydrationTarget(6);
    setMemoryStories(DEMO_MEMORY_STORIES);
    setAssignedSeniors(DEMO_ASSIGNED_SENIORS);
    setLastSyncTime("Just now");
    setSyncStatus("idle");
  }, []);

  const effectiveOnline = !offlineModeForced && isOnline;

  // Immediate Manual Offline Sync Flush with Realistic Visual States (SIH 2026 Section 26)
  const triggerSyncNow = useCallback(() => {
    setSyncStatus("syncing");
    const count = syncQueue.length;

    setTimeout(() => {
      setSyncQueue([]);
      try {
        localStorage.setItem(getKey("sync_queue"), JSON.stringify([]));
      } catch (e) {
        console.warn("Error clearing sync queue:", e);
      }
      setLastSyncTime("Just now");
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 3500);

      // Update assigned senior Ramesh lastSync
      setAssignedSeniors((prev) =>
        prev.map((s) => (s.id === "senior-ramesh" ? { ...s, lastSync: "Just now" } : s))
      );

      const syncNotif: AppNotification = {
        id: `sync-manual-${Date.now()}`,
        category: "general",
        title: "✅ Cloud Synchronization Complete",
        body:
          count > 0
            ? `Successfully synchronized ${count} pending offline activity updates to cloud servers.`
            : "Cloud servers verified. All patient activities, reminders, and game scores are up to date.",
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [syncNotif, ...prev]);
    }, 500);
  }, [syncQueue.length]);

  // Reminder Escalations (Stage 1 -> Stage 2 -> Stage 3 with Caregiver Alert)
  const escalateReminder = useCallback((id: string, stage: 1 | 2 | 3) => {
    setReminderEscalations((prev) =>
      prev.map((esc) => {
        if (esc.id !== id) return esc;
        const nowIso = new Date().toISOString();
        const updated: ReminderEscalation = {
          ...esc,
          stage,
          second_sent_at: stage >= 2 ? (esc.second_sent_at || nowIso) : esc.second_sent_at,
          caregiver_escalated_at: stage === 3 ? nowIso : esc.caregiver_escalated_at,
          status: stage === 3 ? "caregiver_alerted" : "active",
        };
        if (stage === 3) {
          const alertNotif: AppNotification = {
            id: `esc-alert-${Date.now()}`,
            category: "caregiver_alert",
            title: `CRITICAL ESCALATION: ${esc.reminder_title}`,
            body: `Senior missed reminder after 2 notices. Caregiver has been alerted at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            read: false,
            created_at: nowIso,
          };
          setNotifications((n) => [alertNotif, ...n]);
        }
        return updated;
      })
    );
  }, []);

  const resolveReminderEscalation = useCallback((id: string) => {
    setReminderEscalations((prev) =>
      prev.map((esc) => (esc.id === id ? { ...esc, status: "resolved", resolved_at: new Date().toISOString() } : esc))
    );
  }, []);

  const simulateEscalationFlow = useCallback((reminderTitle = "Donepezil 5mg (Night Dose)") => {
    const newEscId = `esc-${Date.now()}`;
    const initial: ReminderEscalation = {
      id: newEscId,
      reminder_id: `sim-rem-${Date.now()}`,
      reminder_title: reminderTitle,
      reminder_type: "medicine",
      scheduled_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      stage: 1,
      status: "active",
      first_sent_at: new Date().toISOString(),
    };
    setReminderEscalations((prev) => [initial, ...prev]);

    // Fast-forward demo progression: Stage 2 in 1.8s, Stage 3 in 3.8s
    setTimeout(() => {
      setReminderEscalations((prev) =>
        prev.map((e) =>
          e.id === newEscId ? { ...e, stage: 2, second_sent_at: new Date().toISOString() } : e
        )
      );
    }, 1800);

    setTimeout(() => {
      setReminderEscalations((prev) =>
        prev.map((e) => {
          if (e.id !== newEscId) return e;
          const nowIso = new Date().toISOString();
          const alertNotif: AppNotification = {
            id: `esc-notif-${Date.now()}`,
            category: "caregiver_alert",
            title: `CAREGIVER ALERT: Missed Medicine (${reminderTitle})`,
            body: `Senior did not respond to Stage 1 and Stage 2 notices. Escalated to family/caregiver emergency contacts.`,
            read: false,
            created_at: nowIso,
          };
          setNotifications((n) => [alertNotif, ...n]);
          return { ...e, stage: 3, status: "caregiver_alerted", caregiver_escalated_at: nowIso };
        })
      );
    }, 3800);
  }, []);

  // Sensitive patient privacy compliance audit logger
  const logAuditAction = useCallback((action: string, details: string, role: UserRole = profile.role) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      role,
      action,
      details,
    };
    setAuditLog((prev) => [entry, ...prev]);
  }, [profile.role]);

  // Conversation History for Voice Assistant
  const [conversationHistory, setConversationHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(getKey("conversationHistory"));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addConversation = useCallback((entry: string) => {
    setConversationHistory((prev) => {
      const next = [...prev, entry];
      localStorage.setItem(getKey("conversationHistory"), JSON.stringify(next));
      return next;
    });
  }, []);

  const getRecentConversations = useCallback((limit = 10) => {
    return conversationHistory.slice(-limit);
  }, [conversationHistory]);

  // Dynamic Cognitive Engagement Score & AI Care Loop
  const todayStr = getTodayDateString();
  const routinesDoneToday = routines.filter((r) => r.done_date === todayStr).length;
  const cognitiveScore = calculateCES(gameSessions, routinesDoneToday, routines.length);

  const dynamicCognitiveProfile = calculateDynamicCognitiveProfile(gameSessions, routines);
  const activityRecommendation = getAIActivityRecommendation(dynamicCognitiveProfile, gameSessions);
  const earlyWarningStatus = detectAIEarlyWarning(gameSessions);
  const personalizationInsights = calculatePersonalizationInsights(gameSessions, profile.full_name);
  const cognitiveCareLoopSteps = getCognitiveCareLoopSteps(dynamicCognitiveProfile, activityRecommendation, gameSessions[0]);

  const setSelectedNerState = useCallback((nerState: string) => {
    setProfile((prev) => ({ ...prev, selected_ner_state: nerState }));
  }, []);

  return {
    // Network & Demo state
    isOnline: effectiveOnline,
    isSyncing,
    offlineModeForced,
    setOfflineModeForced,
    resetToDemoData,
    triggerSyncNow,

    // Profile & Role
    profile,
    setRole,
    updateProfile,
    updateBaselineAssessment,
    setSelectedNerState,

    // Personalization & Complete Care Loop
    personalizationInsights,
    cognitiveCareLoopSteps,

    // Medicines
    medicines,
    medicineLogs,
    takeMedicine,
    refillMedicine,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    markMedicineStatus,

    // Reminders & 3-Stage Escalation
    reminders,
    addReminder,
    updateReminder,
    toggleReminder,
    markReminderDone,
    snoozeReminder,
    deleteReminder,
    reminderEscalations,
    escalateReminder,
    resolveReminderEscalation,
    simulateEscalationFlow,

    // Daily Routines
    routines,
    toggleRoutineDone,
    addRoutine,

    // Appointments
    appointments,
    addAppointment,
    deleteAppointment,

    // Memory Cues (Digital Personal Memory Bank)
    memoryCues,
    addMemoryCue,
    deleteMemoryCue,

    // Journal
    journal,
    addJournalEntry,
    deleteJournalEntry,

    // Emergency Contacts
    contacts,
    addContact,
    updateContact,
    deleteContact,

    // SOS
    sosEvents,
    triggerSos,
    cancelActiveSos,

    // Games & Cognitive Scores
    gameSessions,
    recordGameSession,
    cognitiveScore,
    dynamicCognitiveProfile,
    activityRecommendation,
    earlyWarningStatus,
    cycleInfo: useMemo(() => get8DayCycleInfo(gameSessions), [gameSessions]),
    advanceCycle: useCallback(() => {
      advanceCycleForDemo();
      setGameSessions((prev) => [...prev]);
    }, []),
    getCognitiveTrends: useCallback(
      (tf?: "daily" | "weekly" | "monthly") => getCognitiveTrends(gameSessions, tf),
      [gameSessions]
    ),

    // Social Feed (Family Engagement)
    socialFeed,
    addSocialPost,
    addSocialReaction,
    addSocialVoiceReply,

    // Clinical Notes & Privacy Audit (Healthcare Worker)
    clinicalNotes,
    addClinicalNote,
    auditLog,
    logAuditAction,

    // Notifications
    notifications,
    markNotificationRead,
    markAllNotificationsRead,

    // Caregiver Links
    caregiverLinks,
    approveCaregiverLink: useCallback((id: string) => {
      setCaregiverLinks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "approved" as const } : c))
      );
    }, []),
    rejectCaregiverLink: useCallback((id: string) => {
      setCaregiverLinks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "declined" as const } : c))
      );
    }, []),
    addCaregiverLink: useCallback((link: Omit<CaregiverLink, "id" | "linked_at">) => {
      const newLink: CaregiverLink = {
        ...link,
        id: `cg-${Date.now()}`,
        linked_at: new Date().toISOString().slice(0, 10),
      };
      setCaregiverLinks((prev) => [...prev, newLink]);
    }, []),

    // Daily Routine Call
    routineCalls,
    recordDailyRoutineCall: useCallback((session: Omit<DailyRoutineCallSession, "id">) => {
      const newSession: DailyRoutineCallSession = {
        ...session,
        id: `drc-${Date.now()}`,
      };
      setRoutineCalls((prev) => [newSession, ...prev]);

      const notif: AppNotification = {
        id: `drc-notif-${Date.now()}`,
        category: "routine",
        title: "Daily Routine Call Completed",
        body: `Senior completed daily check-in: ${session.summary}`,
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
      return newSession;
    }, []),

    // Hydration (SIH 2026 Section 13)
    hydrationGlasses,
    hydrationTarget,
    drinkGlassOfWater,

    // Memory Stories (SIH 2026 Section 22)
    memoryStories,
    recordMemoryStoryReaction,

    // Multi-Senior Monitoring for Caregivers & Healthcare Workers (SIH 2026 Section 16 & 19)
    assignedSeniors,

    // Sync Status & Timestamp (SIH 2026 Section 26)
    lastSyncTime,
    syncStatus,

    // Senior / Easy Mode
    toggleEasyMode,

    // Sync Queue
    syncQueue,

    // Conversation History
    addConversation,
    getRecentConversations,
  };
}

export type MemoryBondStore = ReturnType<typeof useMemoryBondStore>;
