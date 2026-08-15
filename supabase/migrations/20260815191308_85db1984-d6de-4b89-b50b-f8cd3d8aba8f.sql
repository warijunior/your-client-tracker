-- Ensure students table has correct paths (relative paths instead of full URLs with tokens)
UPDATE students 
SET avatar_url = substring(avatar_url from '/avatars/(.+)\?t=')
WHERE avatar_url LIKE '%/avatars/%?t=%';

-- Also handle cases where there might be a token but no public/ path yet
UPDATE students 
SET avatar_url = split_part(avatar_url, '?', 1)
WHERE avatar_url LIKE '%?t=%';

-- Finally ensure it's just the filename/path
UPDATE students
SET avatar_url = CASE 
    WHEN avatar_url LIKE 'https://%' THEN split_part(avatar_url, '/avatars/', 2)
    ELSE avatar_url
END
WHERE avatar_url IS NOT NULL;
