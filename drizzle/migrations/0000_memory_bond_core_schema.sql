-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'senior',
  language TEXT NOT NULL DEFAULT 'en',
  age_range TEXT,
  phone TEXT,
  font_size TEXT NOT NULL DEFAULT 'normal',
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  voice_enabled BOOLEAN NOT NULL DEFAULT true,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.caregiver_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL,
  senior_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (caregiver_id, senior_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caregiver_links TO authenticated;
GRANT ALL ON public.caregiver_links TO service_role;
ALTER TABLE public.caregiver_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access(target_user UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT target_user = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.caregiver_links l
      WHERE l.senior_id = target_user
        AND l.caregiver_id = auth.uid()
        AND l.status = 'accepted'
    );
$$;

CREATE POLICY "profiles readable by self and caregiver" ON public.profiles
  FOR SELECT TO authenticated USING (public.can_access(id));
CREATE POLICY "profiles insert own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update accessible" ON public.profiles
  FOR UPDATE TO authenticated USING (public.can_access(id)) WITH CHECK (public.can_access(id));

CREATE POLICY "links select own" ON public.caregiver_links
  FOR SELECT TO authenticated USING (caregiver_id = auth.uid() OR senior_id = auth.uid());
CREATE POLICY "links insert own" ON public.caregiver_links
  FOR INSERT TO authenticated WITH CHECK (caregiver_id = auth.uid() OR senior_id = auth.uid());
CREATE POLICY "links delete own" ON public.caregiver_links
  FOR DELETE TO authenticated USING (caregiver_id = auth.uid() OR senior_id = auth.uid());

-- MEDICINES
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  unit TEXT NOT NULL DEFAULT 'tablet',
  stock NUMERIC NOT NULL DEFAULT 0,
  daily_usage NUMERIC NOT NULL DEFAULT 1,
  refill_threshold NUMERIC NOT NULL DEFAULT 5,
  warn_days INTEGER NOT NULL DEFAULT 5,
  times TEXT[] NOT NULL DEFAULT ARRAY['08:00'],
  frequency TEXT NOT NULL DEFAULT 'daily',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  instructions TEXT,
  doctor TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.medicine_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'taken',
  scheduled_time TEXT,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.medicine_refills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  time TEXT NOT NULL DEFAULT '08:00',
  date DATE,
  repeat TEXT NOT NULL DEFAULT 'daily',
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'doctor',
  date DATE NOT NULL,
  time TEXT NOT NULL DEFAULT '10:00',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.daily_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  time TEXT NOT NULL DEFAULT '07:00',
  activity TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'sun',
  done_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.memory_cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'person',
  title TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.memory_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  kind TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  is_emergency BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  location_status TEXT NOT NULL DEFAULT 'unavailable',
  notified TEXT,
  demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_key TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicines, public.medicine_logs, public.medicine_refills, public.reminders, public.reminder_logs, public.appointments, public.daily_routines, public.memory_cues, public.memory_journal, public.emergency_contacts, public.sos_events, public.game_sessions, public.notifications TO authenticated;
GRANT ALL ON public.medicines, public.medicine_logs, public.medicine_refills, public.reminders, public.reminder_logs, public.appointments, public.daily_routines, public.memory_cues, public.memory_journal, public.emergency_contacts, public.sos_events, public.game_sessions, public.notifications TO service_role;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['medicines','medicine_logs','medicine_refills','reminders','reminder_logs','appointments','daily_routines','memory_cues','memory_journal','emergency_contacts','sos_events','game_sessions','notifications']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "accessible rows" ON public.%I FOR ALL TO authenticated USING (public.can_access(user_id)) WITH CHECK (public.can_access(user_id));', t);
  END LOOP;
END $$;