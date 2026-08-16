CREATE OR REPLACE FUNCTION public.search_profile_by_email(search_email text)
RETURNS TABLE (user_id uuid, full_name text, email text) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is authenticated and is a trainer or admin
  IF NOT (
    public.has_role(auth.uid(), 'trainer') OR 
    public.has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas treinadores ou administradores podem buscar perfis.';
  END IF;

  RETURN QUERY
  SELECT u.id as user_id, p.full_name, u.email::text
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id
  WHERE lower(u.email) = lower(trim(search_email));
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_profile_by_email(text) TO authenticated;