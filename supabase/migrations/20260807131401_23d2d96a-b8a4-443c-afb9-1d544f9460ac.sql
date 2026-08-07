-- Add avatar_url and status to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Ensure RLS policies for students
-- First drop existing if any to avoid conflicts, or just use CREATE POLICY if not exists (not supported in all pg versions)
-- We will use a DO block to safely add policies

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Trainers can delete their own students'
    ) THEN
        CREATE POLICY "Trainers can delete their own students" 
        ON public.students 
        FOR DELETE 
        TO authenticated 
        USING (trainer_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Trainers can update their own students'
    ) THEN
        CREATE POLICY "Trainers can update their own students" 
        ON public.students 
        FOR UPDATE 
        TO authenticated 
        USING (trainer_id = auth.uid())
        WITH CHECK (trainer_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Students can update their own profile'
    ) THEN
        CREATE POLICY "Students can update their own profile"
        ON public.students
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
END
$$;

GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
