ALTER TABLE private.user_roles SET SCHEMA public;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
COMMENT ON TABLE public.user_roles IS '@graphql({"exposed": false})';