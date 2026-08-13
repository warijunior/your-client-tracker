-- 1. progress-photos: remove public read, scope to owner/student/trainer
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;

CREATE POLICY "Progress photos viewable by owner student or trainer"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'progress-photos' AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id::text = (storage.foldername(name))[2]
        AND (s.trainer_id = auth.uid() OR s.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Progress photos upload by owner or trainer"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id::text = (storage.foldername(name))[2]
      AND (s.trainer_id = auth.uid() OR s.user_id = auth.uid())
  )
);

-- 2. exercise-media: consolidate duplicated/conflicting policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for exercise-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated view exercise-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for exercise-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload exercise-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update for exercise-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update exercise-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete exercise-media" ON storage.objects;

CREATE POLICY "exercise_media_read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'exercise-media');

CREATE POLICY "exercise_media_staff_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exercise-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer')));

CREATE POLICY "exercise_media_staff_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'exercise-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer')))
WITH CHECK (bucket_id = 'exercise-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer')));

CREATE POLICY "exercise_media_staff_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exercise-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer')));

-- 3. notifications: restrict insert targets
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications for related users"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE (s.trainer_id = auth.uid() AND s.user_id = notifications.user_id)
       OR (s.user_id = auth.uid() AND s.trainer_id = notifications.user_id)
  )
);
