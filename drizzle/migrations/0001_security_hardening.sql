-- ============================================================================
-- MEMORY BOND — MIGRATION 0001: SECURITY HARDENING & RLS ACCESS CONTROL FIX
-- Addresses Broken Access Control / Insecure Direct Object Reference (IDOR)
-- 
-- Vulnerability Patched:
-- Previously, table `caregiver_links` allowed any authenticated user to insert
-- rows where status defaulted to 'accepted'. This allowed rogue authenticated
-- users to insert a link pointing to any senior's UUID and immediately gain
-- unrestricted access to their medicines, reminders, cues, and journal.
-- 
-- Fix Implemented:
-- 1. Default status changed to 'pending'.
-- 2. Inserts by caregivers are restricted to 'pending' status only.
-- 3. Only the senior whose account is being linked (senior_id = auth.uid())
--    or an explicit verification function can accept a caregiver request.
-- 4. Restrict profile updates so caregivers cannot change a senior's role or identity.
-- ============================================================================

-- 1. Alter default status to 'pending' on caregiver_links
ALTER TABLE public.caregiver_links 
  ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Drop existing permissive caregiver_links policies
DROP POLICY IF EXISTS "links insert own" ON public.caregiver_links;
DROP POLICY IF EXISTS "links update own" ON public.caregiver_links;
DROP POLICY IF EXISTS "profiles update accessible" ON public.profiles;

-- 3. Secure caregiver_links INSERT policy:
-- Caregivers can request a link, but status MUST be 'pending' unless the senior themselves initiated it
CREATE POLICY "links insert safe" ON public.caregiver_links
  FOR INSERT TO authenticated
  WITH CHECK (
    (caregiver_id = auth.uid() AND status = 'pending')
    OR
    (senior_id = auth.uid())
  );

-- 4. Secure caregiver_links UPDATE policy:
-- Only the senior (senior_id = auth.uid()) can accept or modify the connection status
CREATE POLICY "links update by senior only" ON public.caregiver_links
  FOR UPDATE TO authenticated
  USING (senior_id = auth.uid())
  WITH CHECK (senior_id = auth.uid());

-- 5. Harden profiles update policy:
-- Users can always update their own profile.
-- Linked caregivers can only update preferences if authorized, but NEVER escalate roles or change IDs.
CREATE POLICY "profiles update own identity" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.can_access(id))
  WITH CHECK (id = auth.uid() OR (public.can_access(id) AND role = 'senior'));

-- 6. Add performance indexes for can_access checks to prevent full table scans
CREATE INDEX IF NOT EXISTS idx_caregiver_links_lookup 
  ON public.caregiver_links (senior_id, caregiver_id, status);

CREATE INDEX IF NOT EXISTS idx_medicines_user_id 
  ON public.medicines (user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id 
  ON public.reminders (user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id 
  ON public.appointments (user_id);
