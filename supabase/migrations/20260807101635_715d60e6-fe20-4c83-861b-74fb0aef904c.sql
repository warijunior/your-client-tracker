
-- Adicionando colunas de mídia se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'video_url') THEN
        ALTER TABLE public.exercises ADD COLUMN video_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'image_url') THEN
        ALTER TABLE public.exercises ADD COLUMN image_url text;
    END IF;
END $$;

-- Garantir que treinadores também podem gerenciar exercícios (não só admins)
-- Primeiro removemos a antiga política de visualização se necessário para evitar conflitos (opcional)
-- DROP POLICY IF EXISTS "Staff can view exercises" ON public.exercises;

-- Nova política para treinadores gerenciarem (INSERT, UPDATE, DELETE)
CREATE POLICY "Trainers can insert exercises"
  ON public.exercises FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'trainer'));

CREATE POLICY "Trainers can update exercises"
  ON public.exercises FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'trainer'));

CREATE POLICY "Trainers can delete exercises"
  ON public.exercises FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'trainer'));
