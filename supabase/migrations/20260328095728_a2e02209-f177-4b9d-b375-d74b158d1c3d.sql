
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS on user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Add email and user_id to students table
ALTER TABLE public.students ADD COLUMN email TEXT;
ALTER TABLE public.students ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Create checkins table
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  training_done BOOLEAN NOT NULL DEFAULT false,
  weight NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, check_date)
);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- 7. RLS for checkins - students can manage their own
CREATE POLICY "Students can view own checkins" ON public.checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own checkins" ON public.checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own checkins" ON public.checkins
  FOR UPDATE USING (auth.uid() = user_id);

-- Trainers can view checkins of their students
CREATE POLICY "Trainers can view student checkins" ON public.checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = checkins.student_id AND s.trainer_id = auth.uid()
    )
  );

-- 8. Auto-assign admin role to existing users (trainers)
-- and update handle_new_user to assign admin role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign role based on metadata, default to admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'admin'));
  
  -- If student role, try to link to students table
  IF (NEW.raw_user_meta_data->>'role') = 'student' THEN
    UPDATE public.students SET user_id = NEW.id WHERE email = NEW.email AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 9. Students RLS: allow students to view their own student record
CREATE POLICY "Students can view own record" ON public.students
  FOR SELECT USING (auth.uid() = user_id);
