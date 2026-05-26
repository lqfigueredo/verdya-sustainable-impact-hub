
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can unsubscribe by email" ON public.newsletter_subscribers;
REVOKE UPDATE ON public.newsletter_subscribers FROM anon;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    unsubscribed_at IS NULL
    AND char_length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND language_pref IN ('en','pt')
  );
