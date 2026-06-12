
CREATE TABLE public.ai_consent_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ai_consent_user_version ON public.ai_consent_log(user_id, consent_version);

ALTER TABLE public.ai_consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent" ON public.ai_consent_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consent" ON public.ai_consent_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent" ON public.ai_consent_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));
