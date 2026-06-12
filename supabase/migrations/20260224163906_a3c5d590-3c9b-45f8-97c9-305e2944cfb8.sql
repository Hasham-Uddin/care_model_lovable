-- Allow facilitators to update their interrogation records (for saving model_revision and verdict)
CREATE POLICY "Facilitators can update their interrogations"
ON public.interrogations
FOR UPDATE
USING (is_project_facilitator(auth.uid(), project_id))
WITH CHECK (is_project_facilitator(auth.uid(), project_id));