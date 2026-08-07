-- Storage policies for 'avatars' bucket
-- Allow public read access to avatars (via signed URLs or public access if we make it public, but user wants privacy/security usually)
-- Let's make it public for simple usage as it's just profile photos, but the tool said "private bucket"
-- If it's private, we need specific policies on storage.objects

DO $$
BEGIN
    -- Policy for users to upload their own avatar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload their own avatar'
    ) THEN
        CREATE POLICY "Users can upload their own avatar"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    -- Policy for users to update their own avatar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update their own avatar'
    ) THEN
        CREATE POLICY "Users can update their own avatar"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    -- Policy for users to delete their own avatar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete their own avatar'
    ) THEN
        CREATE POLICY "Users can delete their own avatar"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    -- Policy for everyone (authenticated) to view avatars
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated users can view avatars'
    ) THEN
        CREATE POLICY "Authenticated users can view avatars"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'avatars');
    END IF;
END
$$;
