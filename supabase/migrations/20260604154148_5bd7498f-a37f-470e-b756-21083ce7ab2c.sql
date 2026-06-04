CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_exists boolean;
  v_has_any_admin boolean;
  v_assigned_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  -- Check whether this email was pre-registered as a student by a trainer
  SELECT EXISTS (
    SELECT 1 FROM public.students WHERE email = NEW.email AND user_id IS NULL
  ) INTO v_student_exists;

  -- Bootstrap: if there is no admin yet in the system, the very first signup becomes admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  ) INTO v_has_any_admin;

  IF v_student_exists THEN
    v_assigned_role := 'student';
    UPDATE public.students SET user_id = NEW.id WHERE email = NEW.email AND user_id IS NULL;
  ELSIF NOT v_has_any_admin THEN
    -- First user ever becomes the trainer/admin
    v_assigned_role := 'admin';
  ELSE
    -- Default: any other public signup is just a regular student account (no linked student record)
    v_assigned_role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_assigned_role);

  RETURN NEW;
END;
$function$;