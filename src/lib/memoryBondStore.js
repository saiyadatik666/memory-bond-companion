import { useState, useEffect, useCallback } from "react";
// STORAGE KEYS
const STORAGE_PREFIX = "mb_app_v1_";
const getKey = (key) => `${STORAGE_PREFIX}${key}`;
// Helper: Today YYYY-MM-DD
export const getTodayDateString = () => new Date().toISOString().slice(0, 10);
// Realistic Initial Demo Dataset (North Eastern Region / Indian context)
export const DEMO_PROFILE = {
    id: "demo-senior-ramesh",
    full_name: "Ramesh Sharma",
    role: "senior",
    language: "en",
    age_range: "70-79",
    phone: "+91 98640 55123",
    font_size: "large",
    high_contrast: false,
    voice_enabled: true,
    onboarded: true,
};
export const DEMO_MEDICINES = [
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
        start_date: "2025-01-01",
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
        stock: 5, // LOW STOCK - will trigger alert!
        daily_usage: 1,
        refill_threshold: 6,
        warn_days: 5,
        times: ["20:30"],
        frequency: "daily",
        start_date: "2025-02-15",
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
        start_date: "2025-01-10",
        end_date: null,
        instructions: "Take with lunch for optimal absorption.",
        doctor: "Dr. Deepen Barua",
        notes: "General nerve health & vitality.",
    },
];
export const DEMO_ROUTINES = [
    { id: "rt-1", time: "07:00", activity: "Morning Gentle Stretching & Breathing", icon: "sun", done_date: getTodayDateString() },
    { id: "rt-2", time: "07:45", activity: "Warm Assam Chai & Breakfast", icon: "coffee", done_date: getTodayDateString() },
    { id: "rt-3", time: "08:30", activity: "Morning Blood Pressure Medicine", icon: "pill", done_date: getTodayDateString() },
    { id: "rt-4", time: "10:30", activity: "Cognitive Memory Game & Brain Exercise", icon: "brain", done_date: null },
    { id: "rt-5", time: "13:00", activity: "Nutritious Lunch & Vitamin B-Complex", icon: "utensils", done_date: null },
    { id: "rt-6", time: "17:00", activity: "Evening Tea & Call with Daughter Sunita", icon: "phone", done_date: null },
    { id: "rt-7", time: "20:30", activity: "Dinner & Night Memory Medicine", icon: "moon", done_date: null },
    { id: "rt-8", time: "22:00", activity: "Relaxing Flute Music & Rest", icon: "bed", done_date: null },
];
export const DEMO_REMINDERS = [
    { id: "rem-1", title: "Drink warm water with lemon", type: "hydration", time: "07:15", date: null, repeat: "daily", notes: "Keeps digestion active", active: true },
    { id: "rem-2", title: "Take Amlodipine 5mg", type: "medicine", time: "08:30", date: null, repeat: "daily", notes: "After morning toast", active: true },
    { id: "rem-3", title: "Play 1 Memory Card Match game", type: "routine", time: "10:30", date: null, repeat: "daily", notes: "Keeps focus sharp", active: true },
    { id: "rem-4", title: "Pick up fresh vegetables & ginger", type: "shopping", time: "16:30", date: null, repeat: "none", notes: "From colony market", active: true },
    { id: "rem-5", title: "Take Donepezil 5mg", type: "medicine", time: "20:30", date: null, repeat: "daily", notes: "Before sleep", active: true },
];
export const DEMO_APPOINTMENTS = [
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
export const DEMO_CUES = [
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
export const DEMO_JOURNAL = [
    {
        id: "jou-1",
        title: "Rongali Bihu Celebration with Family",
        body: "Grandson Aarav wore a traditional Assamese kurta and danced Bihu. Sunita brought homemade pitha and laru. A joyful sunny afternoon filled with laughter.",
        entry_date: "2025-04-14",
        kind: "text",
    },
    {
        id: "jou-2",
        title: "Kaziranga Safari with Children",
        body: "We saw two one-horned rhinos near the water stream and wild elephants. The morning mist was magical over the tall elephant grass.",
        entry_date: "2024-11-20",
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
export const DEMO_EMERGENCY_CONTACTS = [
    {
        id: "em-1",
        name: "Sunita Sharma (Daughter)",
        relationship: "Daughter / Primary Caregiver",
        phone: "+91 98765 43210",
        email: "sunita.sharma@example.com",
        priority: 1,
        is_emergency: true,
    },
    {
        id: "em-2",
        name: "Rajesh Sharma (Son)",
        relationship: "Son (Lives in Bengaluru)",
        phone: "+91 98765 43211",
        email: "rajesh.sharma@example.com",
        priority: 2,
        is_emergency: true,
    },
    {
        id: "em-3",
        name: "Dr. Deepen Barua",
        relationship: "Family Doctor",
        phone: "+91 98640 12345",
        email: "dr.barua@clinic.in",
        priority: 3,
        is_emergency: false,
    },
    {
        id: "em-4",
        name: "National Senior Helpline / Police",
        relationship: "Emergency SOS Services",
        phone: "14567",
        priority: 4,
        is_emergency: true,
    },
];
export const DEMO_NOTIFICATIONS = [
    {
        id: "notif-1",
        category: "medicine_low",
        title: "Medicine Running Low: Donepezil 5mg",
        body: "Only 5 tablets remaining (Threshold: 6). Please arrange a refill soon. Caregiver has been alerted.",
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
export const DEMO_GAME_SESSIONS = [
    { id: "gs-1", game_key: "card_match", score: 6, total: 6, difficulty: "easy", created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: "gs-2", game_key: "object_recall", score: 4, total: 4, difficulty: "easy", created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: "gs-3", game_key: "pattern_recall", score: 5, total: 6, difficulty: "medium", created_at: new Date(Date.now() - 259200000).toISOString() },
];
export const DEMO_MEDICINE_LOGS = [
    { id: "ml-1", medicine_id: "med-1", scheduled_time: "08:30", status: "taken", taken_at: new Date().toISOString() },
    { id: "ml-2", medicine_id: "med-1", scheduled_time: "08:30", status: "taken", taken_at: new Date(Date.now() - 86400000).toISOString() },
    { id: "ml-3", medicine_id: "med-2", scheduled_time: "20:30", status: "taken", taken_at: new Date(Date.now() - 86400000).toISOString() },
];
// Memory Bond Reactive Store
export function useMemoryBondStore() {
    // Offline / Online status
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing] = useState(false);
    const [offlineModeForced, setOfflineModeForced] = useState(false);
    // Active Profile & Role
    const [profile, setProfile] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("profile"));
            return saved ? JSON.parse(saved) : DEMO_PROFILE;
        }
        catch {
            return DEMO_PROFILE;
        }
    });
    // Medicines
    const [medicines, setMedicines] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("medicines"));
            return saved ? JSON.parse(saved) : DEMO_MEDICINES;
        }
        catch {
            return DEMO_MEDICINES;
        }
    });
    const [medicineLogs, setMedicineLogs] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("medicine_logs"));
            return saved ? JSON.parse(saved) : DEMO_MEDICINE_LOGS;
        }
        catch {
            return DEMO_MEDICINE_LOGS;
        }
    });
    // Reminders
    const [reminders, setReminders] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("reminders"));
            return saved ? JSON.parse(saved) : DEMO_REMINDERS;
        }
        catch {
            return DEMO_REMINDERS;
        }
    });
    // Daily Routines
    const [routines, setRoutines] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("routines"));
            return saved ? JSON.parse(saved) : DEMO_ROUTINES;
        }
        catch {
            return DEMO_ROUTINES;
        }
    });
    // Appointments
    const [appointments, setAppointments] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("appointments"));
            return saved ? JSON.parse(saved) : DEMO_APPOINTMENTS;
        }
        catch {
            return DEMO_APPOINTMENTS;
        }
    });
    // Memory Cues
    const [memoryCues, setMemoryCues] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("cues"));
            return saved ? JSON.parse(saved) : DEMO_CUES;
        }
        catch {
            return DEMO_CUES;
        }
    });
    // Memory Journal
    const [journal, setJournal] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("journal"));
            return saved ? JSON.parse(saved) : DEMO_JOURNAL;
        }
        catch {
            return DEMO_JOURNAL;
        }
    });
    // Emergency Contacts
    const [contacts, setContacts] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("contacts"));
            return saved ? JSON.parse(saved) : DEMO_EMERGENCY_CONTACTS;
        }
        catch {
            return DEMO_EMERGENCY_CONTACTS;
        }
    });
    // SOS Events
    const [sosEvents, setSosEvents] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("sos_events"));
            return saved ? JSON.parse(saved) : [];
        }
        catch {
            return [];
        }
    });
    // Game Sessions
    const [gameSessions, setGameSessions] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("game_sessions"));
            return saved ? JSON.parse(saved) : DEMO_GAME_SESSIONS;
        }
        catch {
            return DEMO_GAME_SESSIONS;
        }
    });
    // Notifications
    const [notifications, setNotifications] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey("notifications"));
            return saved ? JSON.parse(saved) : DEMO_NOTIFICATIONS;
        }
        catch {
            return DEMO_NOTIFICATIONS;
        }
    });
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
        }
        catch (e) {
            console.warn("LocalStorage save error:", e);
        }
    }, [profile, medicines, medicineLogs, reminders, routines, appointments, memoryCues, journal, contacts, sosEvents, gameSessions, notifications]);
    // Network online/offline listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
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
        if (profile.font_size === "large")
            root.classList.add("text-scale-large");
        else if (profile.font_size === "xlarge")
            root.classList.add("text-scale-xlarge");
        else
            root.classList.add("text-scale-normal");
        if (profile.high_contrast) {
            root.classList.add("contrast-boost");
        }
    }, [profile.font_size, profile.high_contrast]);
    // --- ACTIONS ---
    const setRole = useCallback((role) => {
        setProfile((prev) => ({ ...prev, role }));
    }, []);
    const updateProfile = useCallback((patch) => {
        setProfile((prev) => ({ ...prev, ...patch }));
    }, []);
    // Take medicine dose
    const takeMedicine = useCallback((id) => {
        setMedicines((prev) => prev.map((med) => {
            if (med.id !== id)
                return med;
            const newStock = Math.max(0, med.stock - 1);
            // Check if now low stock
            if (newStock <= med.refill_threshold) {
                const alertNotif = {
                    id: `low-${id}-${Date.now()}`,
                    category: "medicine_low",
                    title: `Low Stock: ${med.name}`,
                    body: `Only ${newStock} ${med.unit}s remaining (Refill threshold: ${med.refill_threshold}). Please refill soon.`,
                    read: false,
                    created_at: new Date().toISOString(),
                };
                setNotifications((n) => [alertNotif, ...n]);
            }
            return { ...med, stock: newStock };
        }));
        const log = {
            id: `log-${Date.now()}`,
            medicine_id: id,
            scheduled_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "taken",
            taken_at: new Date().toISOString(),
        };
        setMedicineLogs((logs) => [log, ...logs]);
    }, []);
    // Refill medicine stock
    const refillMedicine = useCallback((id, quantity, note) => {
        setMedicines((prev) => prev.map((med) => {
            if (med.id !== id)
                return med;
            const newStock = med.stock + quantity;
            return { ...med, stock: newStock };
        }));
        const notif = {
            id: `refill-${Date.now()}`,
            category: "caregiver_alert",
            title: "Medicine Refill Added",
            body: `Added +${quantity} units to stock. Note: ${note || "Regular refill"}`,
            read: false,
            created_at: new Date().toISOString(),
        };
        setNotifications((n) => [notif, ...n]);
    }, []);
    // Add new medicine
    const addMedicine = useCallback((med) => {
        const newMed = {
            ...med,
            id: `med-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setMedicines((prev) => [...prev, newMed]);
    }, []);
    const updateMedicine = useCallback((id, patch) => {
        setMedicines((prev) => prev.map((med) => (med.id === id ? { ...med, ...patch, updated_at: new Date().toISOString() } : med)));
    }, []);
    const deleteMedicine = useCallback((id) => {
        setMedicines((prev) => prev.filter((m) => m.id !== id));
    }, []);
    // Reminders
    const addReminder = useCallback((rem) => {
        const newRem = { ...rem, id: `rem-${Date.now()}` };
        setReminders((prev) => [...prev, newRem]);
    }, []);
    const toggleReminder = useCallback((id) => {
        setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
    }, []);
    const markReminderDone = useCallback((id) => {
        setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, last_done: getTodayDateString() } : r)));
    }, []);
    const deleteReminder = useCallback((id) => {
        setReminders((prev) => prev.filter((r) => r.id !== id));
    }, []);
    // Routines
    const toggleRoutineDone = useCallback((id) => {
        const today = getTodayDateString();
        setRoutines((prev) => prev.map((rt) => (rt.id === id ? { ...rt, done_date: rt.done_date === today ? null : today } : rt)));
    }, []);
    const addRoutine = useCallback((rt) => {
        const newRt = { ...rt, id: `rt-${Date.now()}` };
        setRoutines((prev) => [...prev, newRt]);
    }, []);
    // Appointments
    const addAppointment = useCallback((app) => {
        const newApp = { ...app, id: `app-${Date.now()}` };
        setAppointments((prev) => [...prev, newApp]);
    }, []);
    const deleteAppointment = useCallback((id) => {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
    }, []);
    // Memory Cues
    const addMemoryCue = useCallback((cue) => {
        const newCue = { ...cue, id: `cue-${Date.now()}` };
        setMemoryCues((prev) => [...prev, newCue]);
    }, []);
    const deleteMemoryCue = useCallback((id) => {
        setMemoryCues((prev) => prev.filter((c) => c.id !== id));
    }, []);
    // Journal
    const addJournalEntry = useCallback((item) => {
        const newItem = { ...item, id: `jou-${Date.now()}` };
        setJournal((prev) => [newItem, ...prev]);
    }, []);
    const deleteJournalEntry = useCallback((id) => {
        setJournal((prev) => prev.filter((j) => j.id !== id));
    }, []);
    // Contacts
    const addContact = useCallback((contact) => {
        const newContact = { ...contact, id: `em-${Date.now()}` };
        setContacts((prev) => [...prev, newContact]);
    }, []);
    const updateContact = useCallback((id, patch) => {
        setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    }, []);
    const deleteContact = useCallback((id) => {
        setContacts((prev) => prev.filter((c) => c.id !== id));
    }, []);
    // Game Sessions
    const recordGameSession = useCallback((gameKey, score, total, difficulty) => {
        const session = {
            id: `gs-${Date.now()}`,
            game_key: gameKey,
            score,
            total,
            difficulty,
            created_at: new Date().toISOString(),
        };
        setGameSessions((prev) => [session, ...prev]);
    }, []);
    // SOS Trigger
    const triggerSos = useCallback((coords) => {
        const newEvent = {
            id: `sos-${Date.now()}`,
            latitude: coords?.latitude ?? 26.1822, // Guwahati coordinates as realistic default
            longitude: coords?.longitude ?? 91.7617,
            location_status: coords?.status ?? "simulated",
            notified: contacts.filter((c) => c.is_emergency).map((c) => c.name).join(", ") || "All Emergency Contacts",
            demo: true,
            created_at: new Date().toISOString(),
        };
        setSosEvents((prev) => [newEvent, ...prev]);
        const sosNotif = {
            id: `sos-alert-${Date.now()}`,
            category: "sos",
            title: "EMERGENCY SOS ALERT ACTIVATED",
            body: `Senior ${profile.full_name} initiated an emergency call. Notified: ${newEvent.notified}. Location: ${newEvent.latitude?.toFixed(4)}, ${newEvent.longitude?.toFixed(4)}`,
            read: false,
            created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [sosNotif, ...prev]);
        return newEvent;
    }, [contacts, profile.full_name]);
    // Notifications
    const markNotificationRead = useCallback((id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }, []);
    const markAllNotificationsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);
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
        setSosEvents([]);
    }, []);
    const effectiveOnline = !offlineModeForced && isOnline;
    // Conversation History for Voice Assistant
    const [conversationHistory, setConversationHistory] = useState(() => {
        try {
            const saved = localStorage.getItem(getKey('conversationHistory'));
            return saved ? JSON.parse(saved) : [];
        }
        catch {
            return [];
        }
    });
    const addConversation = useCallback((entry) => {
        setConversationHistory((prev) => {
            const next = [...prev, entry];
            localStorage.setItem(getKey('conversationHistory'), JSON.stringify(next));
            return next;
        });
    }, []);
    const getRecentConversations = useCallback((limit = 10) => {
        return conversationHistory.slice(-limit);
    }, [conversationHistory]);
    return {
        // Network & Demo state
        isOnline: effectiveOnline,
        isSyncing,
        offlineModeForced,
        setOfflineModeForced,
        resetToDemoData,
        // Profile & Role
        profile,
        setRole,
        updateProfile,
        // Medicines
        medicines,
        medicineLogs,
        takeMedicine,
        refillMedicine,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        // Reminders
        reminders,
        addReminder,
        toggleReminder,
        markReminderDone,
        deleteReminder,
        // Daily Routines
        routines,
        toggleRoutineDone,
        addRoutine,
        // Appointments
        appointments,
        addAppointment,
        deleteAppointment,
        // Memory Cues
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
        // Games
        gameSessions,
        recordGameSession,
        // Notifications
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        // Conversation History
        addConversation,
        getRecentConversations,
    };
}
