
-- Fix 1: Restrict profiles UPDATE to exclude role column
-- Drop the existing permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create a new policy that only allows updating non-role fields
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Fix 2: Restrict organizations SELECT to facilitators only (not public)
DROP POLICY IF EXISTS "Anyone can view organizations" ON organizations;

CREATE POLICY "Authenticated users can view their organizations" ON organizations
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.organization_id = organizations.id
    AND projects.facilitator_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Fix 3: Add DELETE policies for artifacts and interrogations
CREATE POLICY "Facilitators can delete their artifacts" ON artifacts
FOR DELETE USING (is_project_facilitator(auth.uid(), project_id));

CREATE POLICY "Facilitators can delete their interrogations" ON interrogations
FOR DELETE USING (is_project_facilitator(auth.uid(), project_id));
