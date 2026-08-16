CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_exists boolean;
  v_trainer_invite_exists boolean;
  v_has_any_admin boolean;
  v_assigned_role app_role;
  v_clean_email text;
BEGIN
  -- Normalize email: trim whitespace and remove trailing dots which sometimes appear in Hotmail/Outlook imports
  v_clean_email := LOWER(TRIM(TRAILING '.' FROM TRIM(NEW.email)));

  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', v_clean_email)
  ON CONFLICT (user_id) DO UPDATE SET 
    email = v_clean_email,
    full_name = EXCLUDED.full_name;

  SELECT EXISTS (
    SELECT 1 FROM public.trainer_invites WHERE LOWER(TRIM(TRAILING '.' FROM TRIM(email))) = v_clean_email AND used_at IS NULL
  ) INTO v_trainer_invite_exists;

  SELECT EXISTS (
    SELECT 1 FROM public.students WHERE LOWER(TRIM(TRAILING '.' FROM TRIM(email))) = v_clean_email AND user_id IS NULL
  ) INTO v_student_exists;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  ) INTO v_has_any_admin;

  IF v_trainer_invite_exists THEN
    v_assigned_role := 'trainer';
    UPDATE public.trainer_invites 
    SET used_at = now() 
    WHERE LOWER(TRIM(TRAILING '.' FROM TRIM(email))) = v_clean_email AND used_at IS NULL;
  ELSIF v_student_exists THEN
    v_assigned_role := 'student';
    UPDATE public.students 
    SET user_id = NEW.id 
    WHERE LOWER(TRIM(TRAILING '.' FROM TRIM(email))) = v_clean_email AND user_id IS NULL;
  ELSIF NOT v_has_any_admin THEN
    v_assigned_role := 'admin';
  ELSE
    v_assigned_role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, v_assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

UPDATE public.students SET email = LOWER(TRIM(TRAILING '.' FROM TRIM(email))) WHERE email IS NOT NULL;
UPDATE public.trainer_invites SET email = LOWER(TRIM(TRAILING '.' FROM TRIM(email)));
UPDATE public.profiles SET email = LOWER(TRIM(TRAILING '.' FROM TRIM(email))) WHERE email IS NOT NULL;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;