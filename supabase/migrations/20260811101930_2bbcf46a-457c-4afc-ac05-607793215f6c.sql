-- Create cardio_logs table
CREATE TABLE public.cardio_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    duration_minutes integer NOT NULL DEFAULT 0,
    intensity text, -- 'Baixa', 'Moderada', 'Alta'
    activity_type text, -- 'Caminhada', 'Corrida', 'Bicicleta', etc.
    logged_at date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(student_id, logged_at)
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cardio_logs TO authenticated;
GRANT ALL ON public.cardio_logs TO service_role;

-- Enable RLS
ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own cardio logs"
ON public.cardio_logs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can view their students' cardio logs"
ON public.cardio_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')
    )
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.cardio_logs;