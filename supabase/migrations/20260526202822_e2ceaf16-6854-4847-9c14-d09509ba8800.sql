-- Revoke direct EXECUTE on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_forum_reply() FROM anon, authenticated, PUBLIC;

-- Restrict storage bucket `content-files`: keep public READ, lock down listing & writes to admins
DROP POLICY IF EXISTS "content-files public read" ON storage.objects;
DROP POLICY IF EXISTS "content-files admin write" ON storage.objects;
DROP POLICY IF EXISTS "content-files admin update" ON storage.objects;
DROP POLICY IF EXISTS "content-files admin delete" ON storage.objects;

CREATE POLICY "content-files public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'content-files');

CREATE POLICY "content-files admin write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "content-files admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'content-files' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'content-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "content-files admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'content-files' AND public.has_role(auth.uid(), 'admin'));