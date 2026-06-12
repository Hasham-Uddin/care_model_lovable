CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));