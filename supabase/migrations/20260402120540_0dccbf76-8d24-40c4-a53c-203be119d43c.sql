
-- Fix sessions policy (was dropped in failed migration)
DROP POLICY IF EXISTS "Facilitators can manage their sessions" ON public.sessions;

CREATE POLICY "Facilitators can manage their sessions"
ON public.sessions
FOR ALL
TO authenticated
USING (
  is_project_facilitator(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Monitors can view sessions" ON public.sessions;
CREATE POLICY "Monitors can view sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'monitor'::user_role));

DROP POLICY IF EXISTS "Monitors can view projects" ON public.projects;
CREATE POLICY "Monitors can view projects"
ON public.projects
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'monitor'::user_role));

DROP POLICY IF EXISTS "Monitors can view interrogations" ON public.interrogations;
CREATE POLICY "Monitors can view interrogations"
ON public.interrogations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'monitor'::user_role));

DROP POLICY IF EXISTS "Monitors can view artifacts" ON public.artifacts;
CREATE POLICY "Monitors can view artifacts"
ON public.artifacts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'monitor'::user_role));
