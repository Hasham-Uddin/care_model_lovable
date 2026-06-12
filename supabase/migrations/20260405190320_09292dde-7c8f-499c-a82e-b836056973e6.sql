
CREATE TABLE public.ai_literacy_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  survey_phase TEXT NOT NULL CHECK (survey_phase IN ('pre', 'mid', 'post')),
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id, survey_phase)
);

ALTER TABLE public.ai_literacy_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own survey responses"
ON public.ai_literacy_surveys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own survey responses"
ON public.ai_literacy_surveys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own survey responses"
ON public.ai_literacy_surveys FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all survey responses"
ON public.ai_literacy_surveys FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Monitors can view all survey responses"
ON public.ai_literacy_surveys FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'monitor'));
