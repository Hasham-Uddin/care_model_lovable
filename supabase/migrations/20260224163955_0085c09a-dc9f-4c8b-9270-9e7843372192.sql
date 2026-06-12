-- Allow facilitators to update their artifacts (for saving updated content)
CREATE POLICY "Facilitators can update their artifacts"
ON public.artifacts
FOR UPDATE
USING (is_project_facilitator(auth.uid(), project_id))
WITH CHECK (is_project_facilitator(auth.uid(), project_id));