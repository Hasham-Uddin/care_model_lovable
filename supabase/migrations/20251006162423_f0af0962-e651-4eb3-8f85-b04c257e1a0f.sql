-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team members can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Facilitators can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Team members can view sessions for their projects" ON public.sessions;
DROP POLICY IF EXISTS "Team members can view artifacts" ON public.artifacts;
DROP POLICY IF EXISTS "Team members can create artifacts" ON public.artifacts;

-- Create security definer function to check if user is facilitator of a project
CREATE OR REPLACE FUNCTION public.is_project_facilitator(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = _project_id
      AND facilitator_id = _user_id
  )
$$;

-- Create security definer function to get project_id from session_id
CREATE OR REPLACE FUNCTION public.get_project_from_session(_session_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT project_id
  FROM public.sessions
  WHERE id = _session_id
  LIMIT 1
$$;

-- Recreate projects policies without recursion
CREATE POLICY "Facilitators can view their projects"
ON public.projects
FOR SELECT
USING (facilitator_id = auth.uid());

-- Recreate sessions policies using security definer function
CREATE POLICY "Facilitators can manage their sessions"
ON public.sessions
FOR ALL
USING (public.is_project_facilitator(auth.uid(), project_id));

-- Recreate artifacts policies using security definer function
CREATE POLICY "Facilitators can view their artifacts"
ON public.artifacts
FOR SELECT
USING (public.is_project_facilitator(auth.uid(), project_id));

CREATE POLICY "Facilitators can create artifacts"
ON public.artifacts
FOR INSERT
WITH CHECK (public.is_project_facilitator(auth.uid(), project_id));

-- Recreate interrogations policies using security definer function
DROP POLICY IF EXISTS "Team members can view interrogations" ON public.interrogations;
DROP POLICY IF EXISTS "Team members can create interrogations" ON public.interrogations;

CREATE POLICY "Facilitators can view their interrogations"
ON public.interrogations
FOR SELECT
USING (public.is_project_facilitator(auth.uid(), project_id));

CREATE POLICY "Facilitators can create interrogations"
ON public.interrogations
FOR INSERT
WITH CHECK (public.is_project_facilitator(auth.uid(), project_id));