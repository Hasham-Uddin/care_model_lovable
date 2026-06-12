
-- Drop restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Facilitators can create organizations" ON organizations;

-- SELECT: Authenticated users can view orgs they're associated with OR admins can view all
CREATE POLICY "Authenticated users can view organizations" ON organizations
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.organization_id = organizations.id
    AND projects.facilitator_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- INSERT: Any authenticated user can create organizations (needed for project creation)
CREATE POLICY "Authenticated users can create organizations" ON organizations
FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE: Facilitators who have projects with the org, or admins
CREATE POLICY "Facilitators can update their organizations" ON organizations
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.organization_id = organizations.id
    AND projects.facilitator_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.organization_id = organizations.id
    AND projects.facilitator_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- DELETE: Admins only
CREATE POLICY "Admins can delete organizations" ON organizations
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));
