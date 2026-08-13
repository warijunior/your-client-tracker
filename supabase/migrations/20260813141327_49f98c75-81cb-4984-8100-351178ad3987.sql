-- Ensure storage buckets exist and have correct RLS policies
-- Note: Buckets are created via tools, but RLS policies are managed here.

DO $$ 
BEGIN
    -- 1. Policies for 'exercise-media' bucket
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for exercise-media' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access for exercise-media" ON storage.objects
        FOR SELECT TO public USING (bucket_id = 'exercise-media');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload for exercise-media' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Upload for exercise-media" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'exercise-media');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Update for exercise-media' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Update for exercise-media" ON storage.objects
        FOR UPDATE TO authenticated USING (bucket_id = 'exercise-media');
    END IF;

    -- 2. Policies for 'avatars' bucket
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access for avatars" ON storage.objects
        FOR SELECT TO public USING (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload for avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Upload for avatars" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Update for avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Update for avatars" ON storage.objects
        FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
    END IF;
END $$;
