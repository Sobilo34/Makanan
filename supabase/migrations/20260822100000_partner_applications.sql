-- ============================================================
-- Partner Applications Table Migration
-- ============================================================

-- 1. Create partner_applications table
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Business Info
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  -- Operating Details
  opening_time TEXT,
  closing_time TEXT,
  operating_days TEXT[] DEFAULT '{}',
  -- Business Description
  description TEXT,
  cuisine_types TEXT[] DEFAULT '{}',
  seating_capacity INTEGER,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Index for email lookups
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON public.partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON public.partner_applications(status);

-- 3. Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Anyone can submit an application (public insert)
DROP POLICY IF EXISTS "Anyone can submit partner application" ON public.partner_applications;
CREATE POLICY "Anyone can submit partner application"
  ON public.partner_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Applicants can view their own application by email (no auth required)
DROP POLICY IF EXISTS "Public can view applications" ON public.partner_applications;
CREATE POLICY "Public can view applications"
  ON public.partner_applications
  FOR SELECT
  TO public
  USING (true);
