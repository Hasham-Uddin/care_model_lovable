DROP POLICY IF EXISTS "Authenticated users can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Facilitators can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can delete organizations" ON public.organizations;

CREATE POLICY "Authenticated users can view organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Facilitators and admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects
    WHERE projects.organization_id = organizations.id
      AND projects.facilitator_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects
    WHERE projects.organization_id = organizations.id
      AND projects.facilitator_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can delete organizations"
ON public.organizations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role));