CREATE POLICY "Students can view their own protocols"
ON public.protocols
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = protocols.student_id
      AND s.user_id = auth.uid()
  )
);