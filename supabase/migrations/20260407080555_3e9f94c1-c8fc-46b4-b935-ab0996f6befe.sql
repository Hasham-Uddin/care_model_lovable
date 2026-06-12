
-- Create enum for project-scoped team roles
CREATE TYPE public.project_role AS ENUM ('care_team_leader', 'care_team_member');

-- Project members table (project-scoped roles)
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role project_role NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Project invitations table
CREATE TABLE public.project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role project_role NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(token)
);

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
  )
$$;

-- Security definer function to check if user is a care team leader on a project
CREATE OR REPLACE FUNCTION public.is_care_team_leader(_user_id UUID, _project_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
      AND role = 'care_team_leader'
  )
$$;

-- RLS policies for project_members
CREATE POLICY "Facilitators can manage their project members"
ON public.project_members FOR ALL
TO authenticated
USING (
  is_project_facilitator(auth.uid(), project_id) 
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Care team leaders can manage members on their project"
ON public.project_members FOR ALL
TO authenticated
USING (
  is_care_team_leader(auth.uid(), project_id)
);

CREATE POLICY "Members can view their own membership"
ON public.project_members FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policies for project_invitations
CREATE POLICY "Facilitators can manage invitations"
ON public.project_invitations FOR ALL
TO authenticated
USING (
  is_project_facilitator(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Care team leaders can create member invitations"
ON public.project_invitations FOR INSERT
TO authenticated
WITH CHECK (
  is_care_team_leader(auth.uid(), project_id)
  AND role = 'care_team_member'
);

CREATE POLICY "Care team leaders can view their project invitations"
ON public.project_invitations FOR SELECT
TO authenticated
USING (
  is_care_team_leader(auth.uid(), project_id)
);

CREATE POLICY "Anyone can view invitation by token"
ON public.project_invitations FOR SELECT
TO anon, authenticated
USING (true);

-- Update existing RLS on projects to allow members to view
CREATE POLICY "Project members can view their projects"
ON public.projects FOR SELECT
TO authenticated
USING (is_project_member(auth.uid(), id));

-- Care team leaders can update projects (like facilitators)
CREATE POLICY "Care team leaders can update their projects"
ON public.projects FOR UPDATE
TO authenticated
USING (is_care_team_leader(auth.uid(), id));

-- Update sessions RLS for project members
CREATE POLICY "Project members can view sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (is_project_member(auth.uid(), project_id));

-- Care team leaders can manage sessions
CREATE POLICY "Care team leaders can manage sessions"
ON public.sessions FOR ALL
TO authenticated
USING (is_care_team_leader(auth.uid(), project_id));

-- Update artifacts RLS for project members  
CREATE POLICY "Project members can view artifacts"
ON public.artifacts FOR SELECT
TO authenticated
USING (is_project_member(auth.uid(), project_id));

-- Care team leaders can manage artifacts
CREATE POLICY "Care team leaders can create artifacts"
ON public.artifacts FOR INSERT
TO authenticated
WITH CHECK (is_care_team_leader(auth.uid(), project_id));

CREATE POLICY "Care team leaders can update artifacts"
ON public.artifacts FOR UPDATE
TO authenticated
USING (is_care_team_leader(auth.uid(), project_id));

-- Update interrogations RLS for project members
CREATE POLICY "Project members can view interrogations"
ON public.interrogations FOR SELECT
TO authenticated
USING (is_project_member(auth.uid(), project_id));

-- Project members can create interrogations (participate)
CREATE POLICY "Project members can create interrogations"
ON public.interrogations FOR INSERT
TO authenticated
WITH CHECK (is_project_member(auth.uid(), project_id));

-- Care team leaders can update/delete interrogations
CREATE POLICY "Care team leaders can update interrogations"
ON public.interrogations FOR UPDATE
TO authenticated
USING (is_care_team_leader(auth.uid(), project_id));

-- Allow members to add notes to sessions (update notes field)
-- Already covered by care team leader policy above
-- Members need a separate update policy for adding notes
CREATE POLICY "Project members can update session notes"
ON public.sessions FOR UPDATE
TO authenticated
USING (is_project_member(auth.uid(), project_id));
