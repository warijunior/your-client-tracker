CREATE SCHEMA IF NOT EXISTS private;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        ALTER TABLE public.user_roles SET SCHEMA private;
    END IF;
END $$;

REVOKE USAGE ON SCHEMA public FROM authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocols TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cardio_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hydration_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplement_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_followups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon;
    END IF;
END $$;