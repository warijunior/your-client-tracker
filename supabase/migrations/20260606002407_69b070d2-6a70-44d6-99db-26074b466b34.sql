-- Extend roles with 'trainer'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trainer';

-- Convites para treinadores (somente admin pode criar)
CREATE TABLE IF NOT EXISTS public.trainer_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_invites TO authenticated;
GRANT ALL ON public.trainer_invites TO service_role;

ALTER TABLE public.trainer_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage trainer invites" ON public.trainer_invites;
CREATE POLICY "Admins manage trainer invites"
  ON public.trainer_invites
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Atualiza trigger de signup para reconhecer convites de treinador
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
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  SELECT EXISTS (
    SELECT 1 FROM public.trainer_invites WHERE email = NEW.email AND used_at IS NULL
  ) INTO v_trainer_invite_exists;

  SELECT EXISTS (
    SELECT 1 FROM public.students WHERE email = NEW.email AND user_id IS NULL
  ) INTO v_student_exists;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  ) INTO v_has_any_admin;

  IF v_trainer_invite_exists THEN
    v_assigned_role := 'trainer';
    UPDATE public.trainer_invites SET used_at = now() WHERE email = NEW.email AND used_at IS NULL;
  ELSIF v_student_exists THEN
    v_assigned_role := 'student';
    UPDATE public.students SET user_id = NEW.id WHERE email = NEW.email AND user_id IS NULL;
  ELSIF NOT v_has_any_admin THEN
    v_assigned_role := 'admin';
  ELSE
    v_assigned_role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_assigned_role);
  RETURN NEW;
END;
$$;

-- Bootstrap: cria conta admin direto no auth (idempotente)
DO $$
DECLARE
  v_uid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'maviaelbr2@gmail.com') THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'maviaelbr2@gmail.com', crypt('87831265', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrador"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid, jsonb_build_object('sub', v_uid::text, 'email', 'maviaelbr2@gmail.com'), 'email', v_uid::text, now(), now(), now());

    -- Garante papel admin mesmo se o trigger tiver atribuído outro
    DELETE FROM public.user_roles WHERE user_id = v_uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin');
  ELSE
    -- Caso o usuário já exista, garante senha e papel admin
    UPDATE auth.users
       SET encrypted_password = crypt('87831265', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now())
     WHERE email = 'maviaelbr2@gmail.com';

    DELETE FROM public.user_roles
     WHERE user_id = (SELECT id FROM auth.users WHERE email = 'maviaelbr2@gmail.com');
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin' FROM auth.users WHERE email = 'maviaelbr2@gmail.com';
  END IF;
END $$;
