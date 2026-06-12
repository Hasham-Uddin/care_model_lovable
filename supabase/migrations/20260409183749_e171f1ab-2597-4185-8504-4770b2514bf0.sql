CREATE TABLE public.policy_consent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, policy_version)
);

ALTER TABLE public.policy_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent"
ON public.policy_consent FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent"
ON public.policy_consent FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);