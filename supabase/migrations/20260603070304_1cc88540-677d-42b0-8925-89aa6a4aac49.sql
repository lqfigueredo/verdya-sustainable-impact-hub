
-- 1) Profiles: restrict broad email exposure
DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) Safe public projection of profiles (no email) accessible to all signed-in/anon users
CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  bio text,
  company text,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.bio, p.company, p.country
  FROM public.profiles p
  WHERE p.id = ANY(COALESCE(_ids, ARRAY[]::uuid[]));
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO anon, authenticated;

-- 3) Newsletter: replace open INSERT policy with a security-definer RPC that silently
-- handles duplicates to prevent email enumeration.
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;

CREATE OR REPLACE FUNCTION public.subscribe_newsletter(_email text, _language_pref text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean text := lower(trim(_email));
BEGIN
  IF clean IS NULL
     OR char_length(clean) < 3
     OR char_length(clean) > 255
     OR clean !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF _language_pref NOT IN ('en','pt') THEN
    RAISE EXCEPTION 'invalid_language';
  END IF;

  INSERT INTO public.newsletter_subscribers (email, language_pref, subscribed_at, unsubscribed_at)
  VALUES (clean, _language_pref, now(), NULL)
  ON CONFLICT (email) DO UPDATE
    SET language_pref = EXCLUDED.language_pref,
        subscribed_at = COALESCE(public.newsletter_subscribers.subscribed_at, EXCLUDED.subscribed_at),
        unsubscribed_at = NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.subscribe_newsletter(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(text, text) TO anon, authenticated;

-- 4) Storage: drop duplicate policies and the broad listing policy on the content-files bucket.
-- Public buckets still serve files via the /storage/v1/object/public/... endpoint without an
-- explicit SELECT policy, so direct file access continues to work.
DROP POLICY IF EXISTS "Content files public read" ON storage.objects;
DROP POLICY IF EXISTS "content-files public read" ON storage.objects;
DROP POLICY IF EXISTS "content-files admin write" ON storage.objects;
DROP POLICY IF EXISTS "content-files admin update" ON storage.objects;
DROP POLICY IF EXISTS "content-files admin delete" ON storage.objects;

-- 5) Lock down has_role: it is only used inside RLS policies (which evaluate as the
-- table owner and ignore EXECUTE grants on referenced functions), so signed-in users
-- have no reason to call it directly.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
