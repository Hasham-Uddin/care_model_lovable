-- Persistent client-side error logging table
CREATE TABLE public.client_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  route TEXT,
  action TEXT,
  error_message TEXT NOT NULL,
  error_name TEXT,
  stack_trace TEXT,
  component_stack TEXT,
  user_agent TEXT,
  viewport TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster admin queries
CREATE INDEX idx_client_error_logs_created_at ON public.client_error_logs (created_at DESC);
CREATE INDEX idx_client_error_logs_user_id ON public.client_error_logs (user_id);

-- Enable RLS
ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert an error (including unauthenticated users hitting a crash)
CREATE POLICY "Anyone can log errors"
ON public.client_error_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read errors
CREATE POLICY "Admins can view all error logs"
ON public.client_error_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role));
