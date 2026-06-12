-- Create table to track organization contributions (interrogations they've contributed)
CREATE TABLE public.organization_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  interrogation_count INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_start, period_end)
);

-- Create table to track data purchases
CREATE TABLE public.data_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  record_count INTEGER NOT NULL,
  price_per_record NUMERIC(10,4) NOT NULL DEFAULT 0.10,
  total_amount NUMERIC(12,2) NOT NULL,
  platform_share NUMERIC(12,2) NOT NULL, -- 75%
  community_share NUMERIC(12,2) NOT NULL, -- 25%
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track organization earnings from purchases
CREATE TABLE public.organization_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.data_purchases(id) ON DELETE CASCADE,
  contribution_percentage NUMERIC(5,4) NOT NULL, -- Their share of total contributions
  earned_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track monthly payouts to organizations
CREATE TABLE public.organization_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payout_month DATE NOT NULL, -- First day of the month
  total_earned NUMERIC(12,2) NOT NULL,
  total_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, payout_month)
);

-- Add Stripe account ID to organizations for payouts
ALTER TABLE public.organizations 
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN payout_enabled BOOLEAN DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.organization_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_contributions
CREATE POLICY "Facilitators can view their org contributions"
ON public.organization_contributions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.organization_id = organization_contributions.organization_id
    AND p.facilitator_id = auth.uid()
  )
);

-- RLS policies for organization_earnings (orgs can view their own earnings)
CREATE POLICY "Facilitators can view their org earnings"
ON public.organization_earnings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.organization_id = organization_earnings.organization_id
    AND p.facilitator_id = auth.uid()
  )
);

-- RLS policies for organization_payouts
CREATE POLICY "Facilitators can view their org payouts"
ON public.organization_payouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.organization_id = organization_payouts.organization_id
    AND p.facilitator_id = auth.uid()
  )
);

-- Data purchases are public for transparency (anyone can see aggregate stats)
CREATE POLICY "Anyone can view completed purchases"
ON public.data_purchases FOR SELECT
USING (status = 'completed');

-- Create function to calculate contribution percentages
CREATE OR REPLACE FUNCTION public.calculate_contribution_percentages()
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  total_contributions INTEGER,
  percentage NUMERIC(5,4)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH total AS (
    SELECT COALESCE(SUM(interrogation_count), 0) as total_count
    FROM organization_contributions
  ),
  org_totals AS (
    SELECT 
      oc.organization_id,
      o.name as organization_name,
      SUM(oc.interrogation_count) as org_count
    FROM organization_contributions oc
    JOIN organizations o ON o.id = oc.organization_id
    GROUP BY oc.organization_id, o.name
  )
  SELECT 
    ot.organization_id,
    ot.organization_name,
    ot.org_count::INTEGER as total_contributions,
    CASE 
      WHEN (SELECT total_count FROM total) = 0 THEN 0
      ELSE ROUND(ot.org_count::NUMERIC / (SELECT total_count FROM total), 4)
    END as percentage
  FROM org_totals ot
  ORDER BY ot.org_count DESC
$$;

-- Create trigger to update contribution counts when interrogations are added
CREATE OR REPLACE FUNCTION public.update_contribution_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  current_month_start DATE;
  current_month_end DATE;
BEGIN
  -- Get the organization ID from the project
  SELECT p.organization_id INTO org_id
  FROM projects p
  WHERE p.id = NEW.project_id;

  -- Get current month boundaries
  current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Upsert contribution count
  INSERT INTO organization_contributions (organization_id, project_id, interrogation_count, period_start, period_end)
  VALUES (org_id, NEW.project_id, 1, current_month_start, current_month_end)
  ON CONFLICT (organization_id, period_start, period_end)
  DO UPDATE SET 
    interrogation_count = organization_contributions.interrogation_count + 1,
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_interrogation_created
AFTER INSERT ON public.interrogations
FOR EACH ROW
EXECUTE FUNCTION public.update_contribution_counts();