CREATE POLICY "Admins can view all artifacts"
ON public.artifacts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can view all interrogations"
ON public.interrogations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));