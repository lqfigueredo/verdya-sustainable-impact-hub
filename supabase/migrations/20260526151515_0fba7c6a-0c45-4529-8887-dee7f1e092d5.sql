-- Enum for reaction types
CREATE TYPE public.reaction_type AS ENUM ('like', 'insightful', 'agree');
CREATE TYPE public.reaction_target AS ENUM ('topic', 'reply');

-- forum_topics
CREATE TABLE public.forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  tags text[] NOT NULL DEFAULT '{}',
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pinned boolean NOT NULL DEFAULT false,
  locked boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_reply_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_topics TO authenticated;
GRANT ALL ON public.forum_topics TO service_role;

ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics viewable by authenticated"
  ON public.forum_topics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members create topics"
  ON public.forum_topics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors update own topics"
  ON public.forum_topics FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins manage topics"
  ON public.forum_topics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors delete own topics"
  ON public.forum_topics FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

CREATE INDEX idx_forum_topics_last_reply ON public.forum_topics(last_reply_at DESC);
CREATE INDEX idx_forum_topics_category ON public.forum_topics(category);

CREATE TRIGGER trg_forum_topics_updated
  BEFORE UPDATE ON public.forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- forum_replies
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  parent_reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_replies TO authenticated;
GRANT ALL ON public.forum_replies TO service_role;

ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies viewable by authenticated"
  ON public.forum_replies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members create replies"
  ON public.forum_replies FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (SELECT 1 FROM public.forum_topics t WHERE t.id = topic_id AND t.locked = true)
  );

CREATE POLICY "Authors update own replies"
  ON public.forum_replies FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors delete own replies"
  ON public.forum_replies FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins manage replies"
  ON public.forum_replies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_forum_replies_topic ON public.forum_replies(topic_id, created_at);

-- forum_reactions
CREATE TABLE public.forum_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.reaction_target NOT NULL,
  target_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type public.reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, user_id, reaction_type)
);

GRANT SELECT, INSERT, DELETE ON public.forum_reactions TO authenticated;
GRANT ALL ON public.forum_reactions TO service_role;

ALTER TABLE public.forum_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by authenticated"
  ON public.forum_reactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users add own reactions"
  ON public.forum_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own reactions"
  ON public.forum_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage reactions"
  ON public.forum_reactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_forum_reactions_target ON public.forum_reactions(target_type, target_id);

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- Trigger: bump topic last_reply_at and create notifications on new reply
CREATE OR REPLACE FUNCTION public.handle_new_forum_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  topic_author uuid;
  topic_title text;
  parent_author uuid;
BEGIN
  -- Update last_reply_at
  UPDATE public.forum_topics
    SET last_reply_at = NEW.created_at
    WHERE id = NEW.topic_id
    RETURNING author_id, title INTO topic_author, topic_title;

  -- Notify topic author (not self)
  IF topic_author IS NOT NULL AND topic_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      topic_author,
      'reply_to_topic',
      jsonb_build_object(
        'topic_id', NEW.topic_id,
        'reply_id', NEW.id,
        'topic_title', topic_title,
        'author_id', NEW.author_id
      )
    );
  END IF;

  -- Notify parent reply author (not self, not duplicate of topic author)
  IF NEW.parent_reply_id IS NOT NULL THEN
    SELECT author_id INTO parent_author FROM public.forum_replies WHERE id = NEW.parent_reply_id;
    IF parent_author IS NOT NULL
       AND parent_author <> NEW.author_id
       AND parent_author <> topic_author THEN
      INSERT INTO public.notifications (user_id, type, payload)
      VALUES (
        parent_author,
        'reply_to_reply',
        jsonb_build_object(
          'topic_id', NEW.topic_id,
          'reply_id', NEW.id,
          'parent_reply_id', NEW.parent_reply_id,
          'topic_title', topic_title,
          'author_id', NEW.author_id
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handle_new_forum_reply
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_forum_reply();