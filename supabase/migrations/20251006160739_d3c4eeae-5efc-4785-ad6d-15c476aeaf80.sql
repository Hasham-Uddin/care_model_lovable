-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE app_role AS ENUM ('facilitator', 'team_member', 'evaluator', 'org_viewer');
CREATE TYPE session_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE artifact_type AS ENUM (
  'problem_statement', 'community_group', 'timeline_event', 'invested_party', 
  'dataset', 'asset_map', 'solution', 'toc_node', 'cim_metric', 'data_plan'
);
CREATE TYPE interrogation_mode AS ENUM ('proximity', 'belief', 'timing');
CREATE TYPE harm_type AS ENUM (
  'bias', 'deficit_framing', 'cultural_misread', 'equity_gap', 
  'hallucination', 'data_misuse', 'stereotype', 'erasure'
);
CREATE TYPE verdict_type AS ENUM ('accept_revision', 'needs_more_revision', 'reject_provide_human');

-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'team_member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  mission TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facilitator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  data_donation_consent BOOLEAN DEFAULT false,
  data_anonymized BOOLEAN DEFAULT true,
  consent_revocable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions table (12 sessions per project)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_number INT NOT NULL CHECK (session_number BETWEEN 1 AND 12),
  session_name TEXT NOT NULL,
  status session_status DEFAULT 'not_started',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, session_number)
);

-- Artifacts table (worksheet content)
CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  artifact_type artifact_type NOT NULL,
  content JSONB NOT NULL,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interrogations table (TIR data)
CREATE TABLE public.interrogations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  mode interrogation_mode NOT NULL,
  user_prompt TEXT NOT NULL,
  context_artifacts JSONB,
  model_output TEXT NOT NULL,
  challenge_tags harm_type[] NOT NULL,
  affected_groups TEXT[] NOT NULL,
  evidence_refs TEXT[],
  human_feedback JSONB,
  model_revision TEXT,
  model_rationale TEXT,
  verdict verdict_type,
  redress_notes TEXT,
  consent BOOLEAN DEFAULT false,
  anonymized BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interrogations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Anyone can view organizations"
  ON public.organizations FOR SELECT
  USING (true);

CREATE POLICY "Facilitators can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('facilitator', 'evaluator')
  ));

-- RLS Policies for projects
CREATE POLICY "Team members can view their projects"
  ON public.projects FOR SELECT
  USING (
    facilitator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.artifacts a ON a.session_id = s.id
      WHERE s.project_id = projects.id
    )
  );

CREATE POLICY "Facilitators can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (facilitator_id = auth.uid());

CREATE POLICY "Facilitators can update their projects"
  ON public.projects FOR UPDATE
  USING (facilitator_id = auth.uid());

-- RLS Policies for sessions
CREATE POLICY "Team members can view sessions for their projects"
  ON public.sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = sessions.project_id
        AND (projects.facilitator_id = auth.uid())
    )
  );

CREATE POLICY "Facilitators can manage sessions"
  ON public.sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = sessions.project_id
        AND projects.facilitator_id = auth.uid()
    )
  );

-- RLS Policies for artifacts
CREATE POLICY "Team members can view artifacts"
  ON public.artifacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = artifacts.project_id
        AND projects.facilitator_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create artifacts"
  ON public.artifacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = artifacts.project_id
        AND projects.facilitator_id = auth.uid()
    )
  );

-- RLS Policies for interrogations
CREATE POLICY "Team members can view interrogations"
  ON public.interrogations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = interrogations.project_id
        AND projects.facilitator_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create interrogations"
  ON public.interrogations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = interrogations.project_id
        AND projects.facilitator_id = auth.uid()
    )
  );

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'facilitator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();