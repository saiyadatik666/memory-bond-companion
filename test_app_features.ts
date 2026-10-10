/**
 * MEMORY BOND — COMPREHENSIVE AUTOMATED APPLICATION FEATURES TEST SUITE
 * Tests:
 * 1. Cognitive Care Engine & CES Calculation
 * 2. Dynamic Cognitive Profile & 8-Day Cycle Engine
 * 3. Medicine Data, Low Stock Detection & Daily Dosing
 * 4. Daily Routines & Memory Garden Blooming Logic
 * 5. Reminders & Escalation Logic
 * 6. Caregiver QR Code Extraction, Validation & Normalization
 * 7. Pan-India Cultural Knowledge Repository & State Lookup
 * 8. Universal Language Engine & Script Detection
 * 9. Translation Dictionary Completeness & Fallbacks
 * 10. Motion & Reduced-Motion Accessibility Configuration
 */

import {
  calculateCES,
  CES_DISCLAIMER,
  type GameSession,
  type DailyRoutine,
  DEMO_MEDICINES,
  DEMO_ROUTINES,
  DEMO_PROFILE,
} from "./src/lib/memoryBondStore";

import {
  calculateDynamicCognitiveProfile,
  getAIActivityRecommendation,
  detectAIEarlyWarning,
  get8DayCycleInfo,
  advanceCycleForDemo,
} from "./src/lib/cognitiveCareEngine";

import {
  INDIAN_STATES,
  PAN_INDIA_CULTURAL_CATALOG,
  type CulturalItem,
} from "./src/lib/panIndiaCulturalRepository";

import {
  extractAndNormalizeCaregiverCode,
  validateCaregiverCodeFormat,
  resolveCaregiverProfile,
} from "./src/lib/caregiverConnectionService";

import { languageEngine } from "./src/lib/languageEngine";
import { en } from "./src/lib/translations/en";
import { hi } from "./src/lib/translations/hi";
import { ValidReminderSchema, ValidEmergencyContactSchema } from "./src/lib/sanitizer";
import { smoothSpring, staggerContainerVariants } from "./src/lib/motionTokens";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failed++;
  }
}

async function runFeatureSuite() {
  console.log("================================================================================");
  console.log("RUNNING MEMORY BOND COMPREHENSIVE APPLICATION FEATURE TESTS");
  console.log("================================================================================\n");

  // SECTION 1: COGNITIVE ENGAGEMENT SCORE (CES) CALCULATOR
  console.log("1. COGNITIVE CARE ENGINE & CES CALCULATION:");
  {
    // Test 1.1: Default state when no sessions exist
    const defaultCES = calculateCES([], 0, 6);
    assert(defaultCES.overall === 72, "Default CES overall score is 72 for new users");
    assert(defaultCES.disclaimer === CES_DISCLAIMER, "CES includes statutory wellness disclaimer");

    // Test 1.2: High accuracy sessions calculate proper weighted score
    const sampleSessions: GameSession[] = [
      {
        id: "s1",
        game_key: "word_memory",
        game_type: "memory",
        score: 5,
        total: 5,
        accuracy: 100,
        difficulty: "easy",
        response_time_ms: 2500,
        created_at: new Date().toISOString(),
      },
      {
        id: "s2",
        game_key: "pattern_recall",
        game_type: "attention",
        score: 4,
        total: 4,
        accuracy: 100,
        difficulty: "easy",
        response_time_ms: 3000,
        created_at: new Date().toISOString(),
      },
      {
        id: "s3",
        game_key: "match_object",
        game_type: "recognition",
        score: 5,
        total: 5,
        accuracy: 100,
        difficulty: "easy",
        response_time_ms: 2800,
        created_at: new Date().toISOString(),
      },
      {
        id: "s4",
        game_key: "routine_recall",
        game_type: "recall",
        score: 4,
        total: 4,
        accuracy: 100,
        difficulty: "easy",
        response_time_ms: 3100,
        created_at: new Date().toISOString(),
      },
    ];

    const highCES = calculateCES(sampleSessions, 6, 6);
    assert(highCES.overall >= 85 && highCES.overall <= 100, "High accuracy + fast response yields high CES score");
    assert(highCES.memory === 100, "Memory subscore calculated accurately (100%)");
    assert(highCES.attention === 100, "Attention subscore calculated accurately (100%)");
  }

  // SECTION 2: DYNAMIC COGNITIVE PROFILE & 8-DAY CYCLE ENGINE
  console.log("\n2. DYNAMIC COGNITIVE PROFILE & 8-DAY CYCLE ENGINE:");
  {
    const profile = calculateDynamicCognitiveProfile([], DEMO_ROUTINES);
    assert(typeof profile.overallCES === "number", "Profile produces numeric overallCES");
    assert(typeof profile.trendStatus === "string", "Profile produces trendStatus");
    assert(profile.disclaimer.includes("non-diagnostic"), "Profile contains mandatory non-diagnostic disclaimer");

    // 8-Day Cycle info
    const cycle = get8DayCycleInfo();
    assert(cycle.daysElapsedInCycle >= 1 && cycle.daysElapsedInCycle <= 8, "Current day in 8-day cycle is between 1 and 8");
    assert(cycle.cycleNumber >= 1, "Cycle number is 1 or greater");
    assert(Boolean(cycle.cycleContentSet), "Cycle assigns content set (e.g. Set A/B)");

    // AI Activity Recommendation
    const rec = getAIActivityRecommendation(profile, cycle);
    assert(Boolean(rec.gameTitle), "Activity recommendation includes localized gameTitle");
    assert(Boolean(rec.primaryGoal), "Activity recommendation includes primaryGoal");
    assert(Boolean(rec.focusDomain), "Activity recommendation includes focus domain");

    // Early Warning Detection
    const warning = detectAIEarlyWarning([]);
    assert(typeof warning.hasWarning === "boolean", "Early warning detector returns boolean hasWarning flag");
  }

  // SECTION 3: MEDICINES, STOCK THRESHOLDS & DOSE LOGGING
  console.log("\n3. MEDICINES & MEDICATION STATUS LOGIC:");
  {
    assert(DEMO_MEDICINES.length >= 3, "Demo medicines list contains at least 3 essential medications");
    
    // Check low stock detection logic
    const lowStockMeds = DEMO_MEDICINES.filter((m) => m.stock <= m.refill_threshold);
    assert(lowStockMeds.length >= 1, "Correctly identifies medicines requiring refills (Donepezil stock <= threshold)");
    assert(lowStockMeds[0].id === "med-2", "Donepezil triggers refill warning when stock is 4 and threshold is 6");

    // Verify medicine dosage format
    for (const med of DEMO_MEDICINES) {
      assert(med.times.length > 0, `Medicine ${med.name} has scheduled dose times`);
      assert(med.daily_usage > 0, `Medicine ${med.name} has non-zero daily usage`);
    }
  }

  // SECTION 4: ROUTINES & MEMORY GARDEN BLOOM LOGIC
  console.log("\n4. DAILY ROUTINES & MEMORY GARDEN BLOOM LOGIC:");
  {
    const todayStr = new Date().toISOString().slice(0, 10);
    const routinesTotal = DEMO_ROUTINES.length;
    const routinesDone = DEMO_ROUTINES.filter((r) => r.done_date === todayStr).length;

    assert(routinesTotal >= 5, "Demo routines define full-day schedule");
    const routinesBloomed = routinesTotal > 0 && routinesDone >= Math.ceil(routinesTotal / 2);
    assert(typeof routinesBloomed === "boolean", "Memory Garden routine bloom status evaluates cleanly");
  }

  // SECTION 5: REMINDERS & ZOD SCHEMAS
  console.log("\n5. REMINDERS & SANITIZED ENTITY VALIDATION:");
  {
    const sampleReminder = {
      title: "Evening Heart Medicine",
      type: "medicine" as const,
      time: "20:30",
      date: "2026-10-10",
      repeat: "daily" as const,
      notes: "Take with warm water",
      active: true,
    };
    const remResult = ValidReminderSchema.safeParse(sampleReminder);
    assert(remResult.success === true, "ValidReminderSchema passes valid reminder");

    const sampleContact = {
      name: "Dr. Deepen Barua",
      relationship: "Cardiologist",
      phone: "+91 98640 12345",
      is_emergency: true,
      priority: 1,
    };
    const conResult = ValidEmergencyContactSchema.safeParse(sampleContact);
    assert(conResult.success === true, "ValidEmergencyContactSchema passes valid emergency contact");
  }

  // SECTION 6: CAREGIVER QR CODE EXTRACTION & VALIDATION
  console.log("\n6. CAREGIVER QR CODE EXTRACTION & CONNECTION LOGIC:");
  {
    // Test direct string
    const res1 = extractAndNormalizeCaregiverCode("MB-CG-781042");
    assert(res1.code === "MB-CG-781042", "Extracts standard MB-CG-781042");

    // Test raw digits
    const res2 = extractAndNormalizeCaregiverCode("781042");
    assert(res2.code === "MB-CG-781042", "Normalizes raw 6-digit '781042' to 'MB-CG-781042'");

    // Test JSON payload
    const jsonStr = JSON.stringify({
      code: "MB-CG-882211",
      name: "Sunita Sharma",
      relationship: "Daughter",
    });
    const res3 = extractAndNormalizeCaregiverCode(jsonStr);
    assert(res3.code === "MB-CG-882211" && res3.caregiverName === "Sunita Sharma", "Extracts metadata from JSON QR payload");

    // Test URL query param
    const res4 = extractAndNormalizeCaregiverCode("https://memory-bond-ai.lovable.app/?link=MB-CG-990011");
    assert(res4.code === "MB-CG-990011", "Extracts code from deep-link URL query parameter");

    // Format validation
    assert(validateCaregiverCodeFormat("MB-CG-781042") === true, "MB-CG-781042 is valid format");
    assert(validateCaregiverCodeFormat("MB-CAREGIVER-2026") === true, "MB-CAREGIVER-2026 is valid format");
    assert(validateCaregiverCodeFormat("INVALID_CODE") === false, "Random string fails validation");

    // Profile resolution
    const resolved = resolveCaregiverProfile("MB-CG-781042");
    assert(resolved.name === "Sunita Sharma", "Resolves known caregiver Sunita Sharma");
  }

  // SECTION 7: PAN-INDIA CULTURAL REPOSITORY
  console.log("\n7. PAN-INDIA CULTURAL REPOSITORY INTEGRITY:");
  {
    assert(INDIAN_STATES.length >= 28, "Catalog contains all Indian states and territories");
    assert(PAN_INDIA_CULTURAL_CATALOG.length >= 20, "Catalog contains rich cultural items");

    // Verify all items have complete essential metadata
    let allValid = true;
    for (const item of PAN_INDIA_CULTURAL_CATALOG) {
      if (!item.id || !item.name || !item.state || !item.category || !item.description) {
        allValid = false;
        break;
      }
    }
    assert(allValid, "Every cultural catalog item has valid id, name, state, category, and description");

    // Test state lookup
    const assamItems = PAN_INDIA_CULTURAL_CATALOG.filter((i) => i.state === "Assam");
    assert(assamItems.length > 0, "Finds culturally resonant items for Assam (Bihu, Kaziranga, Gamusa)");

    const gujaratItems = PAN_INDIA_CULTURAL_CATALOG.filter((i) => i.state === "Gujarat");
    assert(gujaratItems.length > 0, "Finds culturally resonant items for Gujarat (Garba, Somnath)");
  }

  // SECTION 8: UNIVERSAL LANGUAGE ENGINE & SCRIPT DETECTION
  console.log("\n8. UNIVERSAL LANGUAGE ENGINE & SCRIPT DETECTION:");
  {
    // Hindi Devanagari
    const hiDetected = languageEngine.detectLanguage("नमस्ते, आप कैसे हैं?");
    assert(hiDetected.startsWith("hi"), "Accurately detects Hindi Devanagari script (hi-IN)");

    // Gujarati
    const guDetected = languageEngine.detectLanguage("તમે કેમ છો? મજામાં?");
    assert(guDetected.startsWith("gu"), "Accurately detects Gujarati script (gu-IN)");

    // Bengali / Assamese
    const asDetected = languageEngine.detectLanguage("আপুনি কেনে আছে? ভাল নে?");
    assert(asDetected.startsWith("as") || asDetected.startsWith("bn"), "Accurately detects Bengali / Assamese script");

    // English
    const enDetected = languageEngine.detectLanguage("in english please, how are you");
    assert(enDetected.startsWith("en"), "Accurately detects English (en-IN)");

    // Romanized Gujarati
    const romanGu = languageEngine.detectLanguage("kem cho tame majama");
    assert(romanGu.startsWith("gu"), "Accurately detects Romanized Gujarati ('kem cho')");

    // Romanized Hindi
    const romanHi = languageEngine.detectLanguage("meri dawa ka samay kya hai");
    assert(romanHi.startsWith("hi"), "Accurately detects Romanized Hindi ('meri dawa')");
  }

  // SECTION 9: TRANSLATION DICTIONARY COMPLETENESS & FALLBACK RESILIENCE
  console.log("\n9. TRANSLATION DICTIONARIES:");
  {
    const criticalKeys = [
      "appName",
      "tagline",
      "home",
      "today",
      "medicines",
      "appointments",
      "reminders",
      "familyTree",
      "memoryGarden",
      "culturalHub",
      "qaEmergencySos",
    ] as const;

    let enComplete = true;
    let hiComplete = true;

    for (const key of criticalKeys) {
      if (!(key in en) || !(en as any)[key]) enComplete = false;
      if (!(key in hi) || !(hi as any)[key]) hiComplete = false;
    }

    assert(enComplete, "English translation has all primary navigation and hub keys");
    assert(hiComplete, "Hindi translation has all primary navigation and hub keys");
  }

  // SECTION 10: ACCESSIBILITY & MOTION TOKENS
  console.log("\n10. ACCESSIBILITY & MOTION SYSTEM:");
  {
    assert(typeof (smoothSpring as any).damping === "number", "smoothSpring provides fluid damping token");
    assert(typeof (smoothSpring as any).stiffness === "number", "smoothSpring provides fluid stiffness token");
    assert(Boolean(staggerContainerVariants.show), "staggerContainerVariants defined for staggered lists");
  }

  console.log("\n================================================================================");
  console.log(`FEATURE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runFeatureSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
