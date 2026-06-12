-- 1. Lock down data_purchases: remove public select, restrict to admins
DROP POLICY IF EXISTS "Anyone can view completed purchases" ON public.data_purchases;
CREATE POLICY "Admins can view purchases"
ON public.data_purchases FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role));

-- 2. Lock down project_invitations anonymous select; provide a token-scoped RPC instead
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.project_invitations;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  email text,
  full_name text,
  role project_role,
  expires_at timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, project_id, email, full_name, role, expires_at, accepted_at
  FROM public.project_invitations
  WHERE token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(uuid) TO anon, authenticated;

-- 3. Lock down academy_certificates: remove anon-readable-all policy, add code-scoped RPC
DROP POLICY IF EXISTS "Anyone can verify by code" ON public.academy_certificates;

CREATE OR REPLACE FUNCTION public.verify_certificate(p_code text)
RETURNS TABLE (
  learner_name text,
  level_title text,
  score numeric,
  awarded_at timestamptz,
  verification_code text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT learner_name, level_title, score, awarded_at, verification_code
  FROM public.academy_certificates
  WHERE verification_code = upper(p_code)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;