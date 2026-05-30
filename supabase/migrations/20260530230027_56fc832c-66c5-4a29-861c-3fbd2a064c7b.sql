CREATE POLICY "Backend can manage blueprint jobs"
ON public.blueprint_jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);