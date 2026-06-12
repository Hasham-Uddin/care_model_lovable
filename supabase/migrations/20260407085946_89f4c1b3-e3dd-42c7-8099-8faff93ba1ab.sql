CREATE POLICY "Facilitators can view project survey responses"
ON public.ai_literacy_surveys
FOR SELECT
TO authenticated
USING (
  is_project_facilitator(auth.uid(), project_id)
);