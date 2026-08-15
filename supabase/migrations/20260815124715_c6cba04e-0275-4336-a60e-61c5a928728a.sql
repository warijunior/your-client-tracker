-- Add prescribed_cardio_minutes to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS prescribed_cardio_minutes integer DEFAULT 0;

-- Add prescribed_minutes to cardio_logs table to keep history
ALTER TABLE public.cardio_logs ADD COLUMN IF NOT EXISTS prescribed_minutes integer DEFAULT 0;

-- Grant permissions
GRANT SELECT, UPDATE(prescribed_cardio_minutes) ON public.students TO authenticated;
GRANT SELECT, INSERT(prescribed_minutes), UPDATE(prescribed_minutes) ON public.cardio_logs TO authenticated;
GRANT ALL ON public.students TO service_role;
GRANT ALL ON public.cardio_logs TO service_role;
