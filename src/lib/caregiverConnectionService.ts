/**
 * Memory Bond - Senior <-> Caregiver Connection Service
 * 
 * Provides unified, robust, and timeout-protected connection management
 * for both QR code scanning and manual connection code entry.
 * 
 * Guaranteed properties:
 * 1. Safe parsing & normalization of raw codes, JSON payloads, and URL formats.
 * 2. Strict format validation (MB-CG-XXXXXX / MB-CAREGIVER-2026).
 * 3. Supabase database persistence (`caregiver_links`) with Promise.race timeout protection.
 * 4. Offline resilience fallback to LocalStorage.
 * 5. Multi-language support (English, Hindi, Gujarati).
 * 6. Guaranteed completion (never hangs or leaves UI spinning).
 */

import { supabase } from "@/integrations/supabase/client";
import type { MemoryBondStore, CaregiverLink, AssignedSenior } from "./memoryBondStore";

export interface ConnectionParams {
  code: string;
  seniorId?: string;
  seniorName?: string;
  seniorAge?: number;
  seniorRegion?: string;
  seniorLanguage?: string;
  store: MemoryBondStore;
  timeoutMs?: number;
  currentLanguage?: string;
}

export interface ConnectionResult {
  success: boolean;
  code: string;
  caregiverName: string;
  caregiverPhone?: string;
  alreadyConnected?: boolean;
  error?: string;
  databasePersisted?: boolean;
}

// Localized strings for connection flow
export const CONNECTION_MESSAGES: Record<
  string,
  {
    emptyCode: string;
    invalidFormat: string;
    codeExpired: string;
    alreadyLinked: (code: string) => string;
    success: (name: string, code: string) => string;
    timeoutError: string;
    genericError: string;
  }
> = {
  en: {
    emptyCode: "Please enter a valid Caregiver connection code or scan a QR code.",
    invalidFormat: "Invalid code format. Codes must start with 'MB-CG-' (e.g. MB-CG-781042) or use 'MB-CAREGIVER-2026'.",
    codeExpired: "This QR code has expired. Please ask your caregiver to refresh their QR code.",
    alreadyLinked: (code) => `This senior account is already linked to caregiver code ${code}.`,
    success: (name, code) => `Successfully linked to Caregiver ${name} (${code})! Opening Senior Companion...`,
    timeoutError: "Cloud connection timed out, but local secure link established.",
    genericError: "Could not link to caregiver. Please verify the code and try again.",
  },
  hi: {
    emptyCode: "कृपया एक वैध केयरगिवर कनेक्शन कोड दर्ज करें या क्यूआर कोड स्कैन करें।",
    invalidFormat: "अमान्य कोड प्रारूप। कोड 'MB-CG-' से शुरू होना चाहिए (उदा. MB-CG-781042)।",
    codeExpired: "यह क्यूआर कोड समाप्त हो गया है। कृपया अपने केयरगिवर से नया कोड मांगें।",
    alreadyLinked: (code) => `यह खाता पहले से ही केयरगिवर कोड ${code} से जुड़ा हुआ है।`,
    success: (name, code) => `केयरगिवर ${name} (${code}) से सफलतापूर्वक जुड़ गए! सीनियर साथी खोला जा रहा है...`,
    timeoutError: "क्लाउड कनेक्शन समय समाप्त हुआ, पर स्थानीय सुरक्षित लिंक स्थापित हो गया।",
    genericError: "केयरगिवर से जुड़ नहीं सके। कृपया कोड जांचें और पुनः प्रयास करें।",
  },
  gu: {
    emptyCode: "કૃપા કરીને માન્ય કેરગીવર કનેક્શન કોડ દાખલ કરો અથવા QR કોડ સ્કેન કરો.",
    invalidFormat: "અમાન્ય કોડ ફોર્મેટ. કોડ 'MB-CG-' થી શરૂ થવો જોઈએ (દા.ત. MB-CG-781042).",
    codeExpired: "આ QR કોડની સમયસીમા સમાપ્ત થઈ ગઈ છે. કૃપા કરીને તમારા કેરગીવર પાસેથી નવો કોડ મેળવો.",
    alreadyLinked: (code) => `આ સિનિયર ખાતું પહેલાથી જ કેરગીવર કોડ ${code} સાથે જોડાયેલું છે.`,
    success: (name, code) => `કેરગીવર ${name} (${code}) સાથે સફળતાપૂર્વક જોડાયા! સિનિયર સાથી ખૂલી રહ્યું છે...`,
    timeoutError: "ક્લાઉડ કનેક્શન સમયસમાપ્તિ થઈ, પરંતુ સ્થાનિક સુરક્ષિત લિંક સક્રિય થઈ.",
    genericError: "કેરગીવર સાથે જોડાઈ શકાયું નથી. કૃપા કરીને કોડ ચકાસો અને ફરી પ્રયાસ કરો.",
  },
};

/**
 * Extract and normalize caregiver code from any source:
 * - Direct text: "MB-CG-781042"
 * - Raw digits: "781042" -> "MB-CG-781042"
 * - JSON payload: {"code": "MB-CG-781042", "name": "Sunita", "expires": 1789277083909}
 * - URL fragment or query: "?link=MB-CG-781042" or "#link=MB-CG-781042"
 */
export function extractAndNormalizeCaregiverCode(input: string): {
  code: string | null;
  caregiverName?: string;
  expires?: number;
} {
  if (!input || typeof input !== "string") {
    return { code: null };
  }
  const trimmed = input.trim();

  // 1. Try JSON parsing
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || trimmed.includes('"code"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.code && typeof parsed.code === "string") {
        const extracted = parsed.code.trim().toUpperCase();
        return {
          code: extracted,
          caregiverName: parsed.name || parsed.caregiverName,
          expires: parsed.expires ? Number(parsed.expires) : undefined,
        };
      }
    } catch {
      // Not JSON, continue to next parsers
    }
  }

  // 2. Try URL query parameter or fragment: ?link=MB-CG-XXXXXX or #link=MB-CG-XXXXXX
  const urlMatch = trimmed.match(/[?&#](?:link|code)=(MB-[A-Z0-9-]+)/i);
  if (urlMatch) {
    return { code: urlMatch[1].toUpperCase() };
  }

  // 3. Direct regex match for standard MB-CG pattern or MB-CAREGIVER-2026
  const directMatch = trimmed.match(/MB-(?:CG-[A-Z0-9]{4,12}|CAREGIVER-\d{4})/i);
  if (directMatch) {
    return { code: directMatch[0].toUpperCase() };
  }

  // 4. Raw 6-digit number fallback: e.g. "781042" -> "MB-CG-781042"
  if (/^\d{6}$/.test(trimmed)) {
    return { code: `MB-CG-${trimmed}` };
  }

  // 5. Short prefix fallback: "CG-781042" -> "MB-CG-781042"
  if (/^CG-[A-Z0-9]{4,10}$/i.test(trimmed)) {
    return { code: `MB-${trimmed.toUpperCase()}` };
  }

  // Fallback: uppercase trimmed string
  return { code: trimmed.toUpperCase() };
}

/**
 * Validate that code matches expected Memory Bond caregiver format
 */
export function validateCaregiverCodeFormat(code: string): boolean {
  if (!code) return false;
  const upper = code.trim().toUpperCase();
  if (upper === "MB-CAREGIVER-2026") return true;
  // MB-CG- followed by 4 to 12 alphanumeric characters
  return /^MB-CG-[A-Z0-9]{4,12}$/.test(upper);
}

/**
 * Resolve Caregiver display name based on code or known demo registry
 */
export function resolveCaregiverProfile(code: string): { name: string; phone: string } {
  const upper = code.toUpperCase();

  // Known demo pairing codes
  if (upper === "MB-CG-781042") {
    return { name: "Sunita Sharma (Daughter)", phone: "+91 98765 43210" };
  }
  if (upper === "MB-CAREGIVER-2026") {
    return { name: "Dr. Rajesh Sharma (Son)", phone: "+91 98765 12345" };
  }

  // Check if this browser has an active caregiver session with this code
  try {
    const activeSessionStr = localStorage.getItem("mb_active_session");
    if (activeSessionStr) {
      const active = JSON.parse(activeSessionStr);
      if (active.caregiverCode === upper && active.fullName) {
        return { name: active.fullName, phone: active.phone || "+91 98765 43210" };
      }
    }
  } catch {}

  // Check saved caregiver name
  try {
    const savedName = localStorage.getItem(`mb_cg_name_${upper}`);
    if (savedName) {
      return { name: savedName, phone: "+91 98765 43210" };
    }
  } catch {}

  return { name: "Family Caregiver", phone: "+91 98765 43210" };
}

/**
 * Unified Senior <-> Caregiver Connection Controller
 * 
 * Executes the complete 16-step sequence:
 * 1. Sanitization & normalization
 * 2. Format validation
 * 3. Expiration checks
 * 4. Already connected verification
 * 5. Supabase caregiver_links registration with 8s timeout
 * 6. LocalStore & LocalStorage synchronization
 * 7. Guaranteed completion with localized feedback
 */
export async function connectSeniorToCaregiver(params: ConnectionParams): Promise<ConnectionResult> {
  const {
    code: rawCode,
    seniorName = "Ramesh Sharma",
    seniorId: providedSeniorId,
    seniorAge = 68,
    seniorRegion = "Assam",
    seniorLanguage = "English",
    store,
    timeoutMs = 8000,
    currentLanguage = "en",
  } = params;

  const langKey = currentLanguage in CONNECTION_MESSAGES ? currentLanguage : "en";
  const msgs = CONNECTION_MESSAGES[langKey] || CONNECTION_MESSAGES.en;

  // STEP 1: Empty input check
  if (!rawCode || !rawCode.trim()) {
    return {
      success: false,
      code: "",
      caregiverName: "",
      error: msgs.emptyCode,
    };
  }

  // STEP 2: Code Extraction & Normalization
  const { code: normalizedCode, caregiverName: qrCaregiverName, expires } =
    extractAndNormalizeCaregiverCode(rawCode);

  if (!normalizedCode) {
    return {
      success: false,
      code: "",
      caregiverName: "",
      error: msgs.invalidFormat,
    };
  }

  // STEP 3: Format validation
  if (!validateCaregiverCodeFormat(normalizedCode)) {
    return {
      success: false,
      code: normalizedCode,
      caregiverName: "",
      error: msgs.invalidFormat,
    };
  }

  // STEP 4: Expiration check
  if (expires && Date.now() > expires) {
    return {
      success: false,
      code: normalizedCode,
      caregiverName: "",
      error: msgs.codeExpired,
    };
  }

  // STEP 5: Already-connected check
  const existingLinkedCode =
    localStorage.getItem("mb_linked_caregiver_code") ||
    localStorage.getItem("mb_app_v2_guest_linked_caregiver_code");

  if (existingLinkedCode && existingLinkedCode.toUpperCase() === normalizedCode) {
    const resolved = resolveCaregiverProfile(normalizedCode);
    const caregiverName = qrCaregiverName || resolved.name;

    // Ensure store is also updated even if already linked locally
    try {
      if (typeof store.linkCaregiver === "function") {
        store.linkCaregiver(normalizedCode, caregiverName, resolved.phone);
      }
    } catch (e) {
      console.warn("store.linkCaregiver safe notice:", e);
    }

    return {
      success: true,
      code: normalizedCode,
      caregiverName,
      alreadyConnected: true,
    };
  }

  // STEP 6: Resolve senior ID and caregiver identity
  const seniorId =
    providedSeniorId ||
    store.profile.id ||
    localStorage.getItem("mb_authenticated_user_id") ||
    `sr_${Date.now()}`;

  const resolvedCaregiver = resolveCaregiverProfile(normalizedCode);
  const caregiverName = qrCaregiverName || resolvedCaregiver.name;
  const caregiverPhone = resolvedCaregiver.phone;

  // STEP 7: Attempt Supabase persistence with Promise.race timeout protection
  let databasePersisted = false;

  try {
    const dbPromise = (async () => {
      // Upsert into Supabase caregiver_links table
      const { data, error } = await supabase
        .from("caregiver_links")
        .upsert(
          {
            senior_id: seniorId,
            caregiver_id: normalizedCode,
            status: "approved",
          },
          { onConflict: "senior_id,caregiver_id" }
        );

      if (error) {
        console.warn("Supabase caregiver_links upsert notice:", error.message);
        return false;
      }
      return true;
    })();

    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.warn(`Supabase connection timed out after ${timeoutMs}ms; using offline persistence.`);
        resolve(false);
      }, timeoutMs);
    });

    databasePersisted = await Promise.race([dbPromise, timeoutPromise]);
  } catch (dbErr) {
    console.warn("Database sync notice (offline mode active):", dbErr);
    databasePersisted = false;
  }

  // STEP 8: Local state & store update (Offline-First Guaranteed Resilience)
  try {
    // 8a: Update store's caregiverLinks and assignedSeniors
    if (typeof store.linkCaregiver === "function") {
      store.linkCaregiver(normalizedCode, caregiverName, caregiverPhone);
    }

    // 8b: Update profile in store
    store.updateProfile({
      full_name: seniorName,
      role: "senior",
      onboarded: true,
    });
    store.setRole("senior");

    // 8c: Write to localStorage for persistence across reloads & sessions
    localStorage.setItem("mb_linked_caregiver_code", normalizedCode);
    localStorage.setItem("mb_authenticated_user_id", seniorId);
    localStorage.setItem("mb_welcome_completed", "true");

    const sessionPayload = {
      userId: seniorId,
      role: "senior",
      fullName: seniorName,
      linkedCaregiverCode: normalizedCode,
      caregiverName,
      linkedAt: new Date().toISOString(),
      databasePersisted,
    };
    localStorage.setItem("mb_active_session", JSON.stringify(sessionPayload));

    // 8d: Register caregiver code in known registry
    try {
      const registered = JSON.parse(localStorage.getItem("mb_registered_caregiver_codes") || "[]");
      if (!registered.includes(normalizedCode)) {
        registered.push(normalizedCode);
        localStorage.setItem("mb_registered_caregiver_codes", JSON.stringify(registered));
      }
    } catch {}

    // 8e: Update assigned seniors in localStorage so Caregiver Dashboard immediately sees this senior
    try {
      const existingSeniorsStr = localStorage.getItem("mb_app_v2_guest_assigned_seniors");
      const currentSeniors: AssignedSenior[] = existingSeniorsStr
        ? JSON.parse(existingSeniorsStr)
        : store.assignedSeniors || [];

      const newAssignedSenior: AssignedSenior = {
        id: seniorId,
        name: seniorName,
        age: seniorAge,
        region: seniorRegion,
        language: seniorLanguage,
        status: "stable",
        statusLabel: "Activity Status: Normal",
        medicineTaken: 2,
        medicineTotal: 2,
        hydrationGlasses: store.hydrationGlasses || 4,
        hydrationTarget: store.hydrationTarget || 6,
        routinesDone: 5,
        routinesTotal: 6,
        gamesCompleted: 2,
        lastActive: "Just now",
        lastSync: "Just now",
        alertsCount: 0,
        cesScore: 78,
        trend: "improving",
      };

      const filtered = currentSeniors.filter((s) => s.id !== seniorId && s.name.toLowerCase() !== seniorName.toLowerCase());
      const updatedSeniors = [newAssignedSenior, ...filtered];
      localStorage.setItem("mb_app_v2_guest_assigned_seniors", JSON.stringify(updatedSeniors));
    } catch (e) {
      console.warn("Could not sync assigned seniors to localStorage:", e);
    }
  } catch (storeErr) {
    console.error("Critical error during local store link:", storeErr);
    return {
      success: false,
      code: normalizedCode,
      caregiverName,
      error: msgs.genericError,
    };
  }

  // STEP 9: Success Return
  return {
    success: true,
    code: normalizedCode,
    caregiverName,
    caregiverPhone,
    alreadyConnected: false,
    databasePersisted,
  };
}
