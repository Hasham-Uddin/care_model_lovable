
CREATE TABLE public.academy_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL DEFAULT 'suggestion',
  message TEXT NOT NULL,
  rating INTEGER,
  lesson_id TEXT,
  level_id TEXT,
  route TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own feedback" ON public.academy_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own feedback" ON public.academy_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all feedback" ON public.academy_feedback
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::user_role));
