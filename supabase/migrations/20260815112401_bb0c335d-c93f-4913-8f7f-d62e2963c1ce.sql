ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS evaluation_type text DEFAULT 'complete' CHECK (evaluation_type IN ('complete', 'simplified'));

COMMENT ON COLUMN public.assessments.evaluation_type IS 'Type of physical assessment: complete or simplified';

GRANT ALL ON public.assessments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;