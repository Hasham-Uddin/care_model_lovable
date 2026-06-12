
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS next_steps text,
  ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;
