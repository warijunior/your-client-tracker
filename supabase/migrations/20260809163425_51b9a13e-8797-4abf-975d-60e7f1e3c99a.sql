-- HYDRATION GOALS
CREATE TABLE public.hydration_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL,
  daily_goal_ml integer NOT NULL DEFAULT 3000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hydration_goals TO authenticated;
GRANT ALL ON public.hydration_goals TO service_role;
ALTER TABLE public.hydration_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage hydration goals" ON public.hydration_goals FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Students view own hydration goal" ON public.hydration_goals FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE TRIGGER update_hydration_goals_updated_at BEFORE UPDATE ON public.hydration_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WATER LOGS
CREATE TABLE public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  amount_ml integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT ALL ON public.water_logs TO service_role;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students insert own water logs" ON public.water_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY "Students view own water logs" ON public.water_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Students delete own water logs" ON public.water_logs FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- SUPPLEMENTS
CREATE TABLE public.supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL,
  name text NOT NULL,
  dosage numeric,
  unit text NOT NULL DEFAULT 'g',
  schedule text,
  frequency text,
  notes text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplements TO authenticated;
GRANT ALL ON public.supplements TO service_role;
ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage supplements" ON public.supplements FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Students view own supplements" ON public.supplements FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE TRIGGER update_supplements_updated_at BEFORE UPDATE ON public.supplements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SUPPLEMENT LOGS
CREATE TABLE public.supplement_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplement_id uuid NOT NULL REFERENCES public.supplements(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplement_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplement_logs TO authenticated;
GRANT ALL ON public.supplement_logs TO service_role;
ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students insert own supplement logs" ON public.supplement_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY "View supplement logs" ON public.supplement_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Students delete own supplement logs" ON public.supplement_logs FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- EXAM FOLLOWUPS
CREATE TABLE public.exam_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL,
  required boolean NOT NULL DEFAULT false,
  guidance text,
  next_date date,
  periodicity text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_followups TO authenticated;
GRANT ALL ON public.exam_followups TO service_role;
ALTER TABLE public.exam_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage exam followups" ON public.exam_followups FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Students view own exam followups" ON public.exam_followups FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE TRIGGER update_exam_followups_updated_at BEFORE UPDATE ON public.exam_followups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();