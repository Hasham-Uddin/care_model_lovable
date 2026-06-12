-- 1. Create user_roles table (move roles out of profiles)
CREATE TYPE public.user_role AS ENUM ('admin', 'facilitator', 'team_member', 'evaluator', 'org_viewer', 'researcher');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 
  CASE role::text
    WHEN 'facilitator' THEN 'facilitator'::user_role
    WHEN 'team_member' THEN 'team_member'::user_role
    WHEN 'evaluator' THEN 'evaluator'::user_role
    WHEN 'org_viewer' THEN 'org_viewer'::user_role
    ELSE 'facilitator'::user_role
  END
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Update pricing structure in data_purchases
ALTER TABLE public.data_purchases
  ADD COLUMN IF NOT EXISTS pricing_tier TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS bundle_type TEXT,
  ADD COLUMN IF NOT EXISTS is_annual_license BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verified_via_webhook BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_verified_at TIMESTAMP WITH TIME ZONE;

-- 3. Create pricing tiers table
CREATE TABLE public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  tier_type TEXT NOT NULL CHECK (tier_type IN ('per_record', 'bundle', 'annual_license')),
  price_per_record NUMERIC,
  bundle_price NUMERIC,
  annual_price NUMERIC,
  min_records INTEGER,
  max_records INTEGER,
  description TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing tiers"
  ON public.pricing_tiers FOR SELECT
  USING (is_active = true);

-- Insert pricing tiers
INSERT INTO public.pricing_tiers (tier_name, tier_type, price_per_record, min_records, max_records, description, features) VALUES
  ('researcher', 'per_record', 5.00, 500, 5000, 'For startups and researchers', '{"anonymized": true, "consented": true, "governance_ready": true}'::jsonb),
  ('standard', 'per_record', 10.00, 500, 10000, 'Standard per-record pricing', '{"anonymized": true, "consented": true, "governance_ready": true}'::jsonb),
  ('enterprise', 'per_record', 15.00, 1000, NULL, 'Enterprise per-record with premium support', '{"anonymized": true, "consented": true, "governance_ready": true, "premium_support": true}'::jsonb);

INSERT INTO public.pricing_tiers (tier_name, tier_type, bundle_price, description, features) VALUES
  ('hiring_bias_pack', 'bundle', 150000.00, 'Hiring Bias Pack - 10k records', '{"records": 10000, "focus": "hiring", "audit_ready": true}'::jsonb),
  ('healthcare_equity_pack', 'bundle', 250000.00, 'Healthcare Equity Pack - 15k records', '{"records": 15000, "focus": "healthcare", "audit_ready": true}'::jsonb),
  ('civic_public_pack', 'bundle', 100000.00, 'Civic / Public Sector AI Pack - 8k records', '{"records": 8000, "focus": "civic", "audit_ready": true}'::jsonb);

INSERT INTO public.pricing_tiers (tier_name, tier_type, annual_price, description, features) VALUES
  ('annual_standard', 'annual_license', 250000.00, 'Annual access with monthly refreshes', '{"monthly_refreshes": true, "governance_docs": true, "consent_ledger": true, "audit_reports": true}'::jsonb),
  ('annual_premium', 'annual_license', 500000.00, 'Premium annual with advisory hours', '{"monthly_refreshes": true, "governance_docs": true, "consent_ledger": true, "audit_reports": true, "advisory_hours": 20}'::jsonb),
  ('annual_enterprise', 'annual_license', 1000000.00, 'Enterprise annual with unlimited advisory', '{"monthly_refreshes": true, "governance_docs": true, "consent_ledger": true, "audit_reports": true, "advisory_hours": "unlimited", "dedicated_support": true}'::jsonb);

-- 4. Anti-gaming: contribution thresholds and quality review
CREATE TABLE public.contribution_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  min_contributions_for_payout INTEGER NOT NULL DEFAULT 10,
  quality_score NUMERIC DEFAULT 0,
  last_quality_review_at TIMESTAMP WITH TIME ZONE,
  is_eligible_for_payout BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE public.contribution_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators can view their org thresholds"
  ON public.contribution_thresholds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.organization_id = contribution_thresholds.organization_id
    AND p.facilitator_id = auth.uid()
  ));

CREATE TABLE public.quality_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interrogation_id UUID REFERENCES public.interrogations(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id),
  quality_score NUMERIC NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  review_notes TEXT,
  is_approved BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quality_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evaluators can manage quality reviews"
  ON public.quality_reviews FOR ALL
  USING (public.has_role(auth.uid(), 'evaluator') OR public.has_role(auth.uid(), 'admin'));

-- 5. Monthly ledger for payout calculations
CREATE TABLE public.payout_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  period_month DATE NOT NULL,
  total_contributions INTEGER NOT NULL DEFAULT 0,
  contribution_percentage NUMERIC NOT NULL DEFAULT 0,
  gross_earnings NUMERIC NOT NULL DEFAULT 0,
  platform_fees NUMERIC NOT NULL DEFAULT 0,
  net_payout NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'approved', 'paid', 'failed')),
  calculated_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_payout_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period_month)
);

ALTER TABLE public.payout_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators can view their org ledger"
  ON public.payout_ledger FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.organization_id = payout_ledger.organization_id
    AND p.facilitator_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all ledger entries"
  ON public.payout_ledger FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Monthly close and payout calculation function
CREATE OR REPLACE FUNCTION public.calculate_monthly_payouts(target_month DATE)
RETURNS TABLE(
  organization_id UUID,
  organization_name TEXT,
  total_contributions INTEGER,
  contribution_percentage NUMERIC,
  gross_earnings NUMERIC,
  net_payout NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  month_start DATE;
  month_end DATE;
  total_community_share NUMERIC;
BEGIN
  -- Calculate month boundaries
  month_start := DATE_TRUNC('month', target_month)::DATE;
  month_end := (DATE_TRUNC('month', target_month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Get total community share from completed purchases in this period
  SELECT COALESCE(SUM(community_share), 0) INTO total_community_share
  FROM data_purchases
  WHERE status = 'completed'
    AND verified_via_webhook = true
    AND purchased_at >= month_start
    AND purchased_at < month_end + INTERVAL '1 day';
  
  -- Return calculated payouts
  RETURN QUERY
  WITH org_contributions AS (
    SELECT 
      oc.organization_id,
      o.name as organization_name,
      SUM(oc.interrogation_count) as total_count
    FROM organization_contributions oc
    JOIN organizations o ON o.id = oc.organization_id
    JOIN contribution_thresholds ct ON ct.organization_id = oc.organization_id
    WHERE oc.period_start >= month_start
      AND oc.period_end <= month_end
      AND ct.is_eligible_for_payout = true
      AND ct.min_contributions_for_payout <= (
        SELECT COALESCE(SUM(interrogation_count), 0)
        FROM organization_contributions
        WHERE organization_id = oc.organization_id
      )
    GROUP BY oc.organization_id, o.name
  ),
  total AS (
    SELECT COALESCE(SUM(total_count), 0) as grand_total FROM org_contributions
  )
  SELECT 
    oc.organization_id,
    oc.organization_name,
    oc.total_count::INTEGER,
    CASE WHEN (SELECT grand_total FROM total) = 0 THEN 0
         ELSE ROUND(oc.total_count::NUMERIC / (SELECT grand_total FROM total), 6)
    END as contribution_percentage,
    CASE WHEN (SELECT grand_total FROM total) = 0 THEN 0
         ELSE ROUND(total_community_share * oc.total_count::NUMERIC / (SELECT grand_total FROM total), 2)
    END as gross_earnings,
    CASE WHEN (SELECT grand_total FROM total) = 0 THEN 0
         ELSE ROUND(total_community_share * oc.total_count::NUMERIC / (SELECT grand_total FROM total), 2)
    END as net_payout
  FROM org_contributions oc
  ORDER BY oc.total_count DESC;
END;
$$;

-- 7. Function to finalize monthly payouts (insert into ledger)
CREATE OR REPLACE FUNCTION public.finalize_monthly_payouts(target_month DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  -- Only admins can finalize payouts
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can finalize monthly payouts';
  END IF;

  INSERT INTO payout_ledger (
    organization_id,
    period_month,
    total_contributions,
    contribution_percentage,
    gross_earnings,
    net_payout,
    status,
    calculated_at
  )
  SELECT 
    organization_id,
    DATE_TRUNC('month', target_month)::DATE,
    total_contributions,
    contribution_percentage,
    gross_earnings,
    net_payout,
    'calculated',
    now()
  FROM public.calculate_monthly_payouts(target_month)
  ON CONFLICT (organization_id, period_month) 
  DO UPDATE SET
    total_contributions = EXCLUDED.total_contributions,
    contribution_percentage = EXCLUDED.contribution_percentage,
    gross_earnings = EXCLUDED.gross_earnings,
    net_payout = EXCLUDED.net_payout,
    calculated_at = now(),
    status = 'calculated';
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- 8. Update organizations for Stripe Connect
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- 9. Trigger to initialize contribution thresholds for new organizations
CREATE OR REPLACE FUNCTION public.init_contribution_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO contribution_thresholds (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.init_contribution_threshold();

-- Initialize thresholds for existing organizations
INSERT INTO contribution_thresholds (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;