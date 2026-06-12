
-- Academy progress per lesson
CREATE TABLE public.academy_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  score NUMERIC,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progress" ON public.academy_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON public.academy_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.academy_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all progress" ON public.academy_progress
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::user_role));

CREATE TRIGGER academy_progress_updated_at
  BEFORE UPDATE ON public.academy_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Academy certificates per level
CREATE TABLE public.academy_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level_id TEXT NOT NULL,
  level_title TEXT NOT NULL,
  learner_name TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  verification_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, level_id)
);

ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own certificates" ON public.academy_certificates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own certificates" ON public.academy_certificates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all certificates" ON public.academy_certificates
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Anyone can verify by code" ON public.academy_certificates
  FOR SELECT TO anon, authenticated USING (true);
