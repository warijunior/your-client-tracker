CREATE POLICY "Authenticated can view exercises"
ON public.exercises
FOR SELECT
TO authenticated
USING (true);