-- Backfill project facilitators as CARE Team Leaders where missing from project_members.
-- The PDF Team & Acknowledgments page reads from project_members; facilitators were
-- stored only on projects.facilitator_id until invites were accepted.

INSERT INTO public.project_members (project_id, user_id, role)
SELECT p.id, p.facilitator_id, 'care_team_leader'::public.project_role
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.project_members pm
  WHERE pm.project_id = p.id
    AND pm.user_id = p.facilitator_id
);
