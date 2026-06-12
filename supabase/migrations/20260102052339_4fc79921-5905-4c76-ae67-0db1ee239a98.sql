-- Allow facilitators to delete their own projects
CREATE POLICY "Facilitators can delete their projects" 
ON public.projects 
FOR DELETE 
USING (facilitator_id = auth.uid());