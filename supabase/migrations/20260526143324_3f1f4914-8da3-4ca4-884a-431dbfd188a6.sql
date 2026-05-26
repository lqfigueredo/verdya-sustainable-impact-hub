-- Enums
CREATE TYPE public.content_type AS ENUM ('article','pdf','link','video','guide');
CREATE TYPE public.content_difficulty AS ENUM ('beginner','intermediate','advanced');

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_pt text NOT NULL,
  description_en text,
  description_pt text,
  icon text NOT NULL DEFAULT 'Leaf',
  color text NOT NULL DEFAULT '#1F4D3A',
  "order" int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER categories_touch BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- content_items
CREATE TABLE public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  type public.content_type NOT NULL DEFAULT 'article',
  title_en text NOT NULL,
  title_pt text NOT NULL,
  summary_en text,
  summary_pt text,
  body_en text,
  body_pt text,
  external_url text,
  file_url text,
  cover_image_url text,
  difficulty public.content_difficulty NOT NULL DEFAULT 'beginner',
  reading_time_min int NOT NULL DEFAULT 5,
  tags text[] NOT NULL DEFAULT '{}',
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_items_category_idx ON public.content_items(category_id);
CREATE INDEX content_items_published_idx ON public.content_items(published);
CREATE INDEX content_items_tags_idx ON public.content_items USING GIN(tags);

GRANT SELECT ON public.content_items TO anon, authenticated;
GRANT ALL ON public.content_items TO service_role;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published content viewable by everyone" ON public.content_items
  FOR SELECT USING (published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage content" ON public.content_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER content_items_touch BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- favorites
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('content-files','content-files', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Content files public read" ON storage.objects FOR SELECT USING (bucket_id = 'content-files');
CREATE POLICY "Admins upload content files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update content files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'content-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete content files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'content-files' AND public.has_role(auth.uid(),'admin'));

-- Seed categories
INSERT INTO public.categories (slug, name_en, name_pt, description_en, description_pt, icon, color, "order") VALUES
('carbon-accounting','Carbon Accounting','Contabilidade de Carbono','Measure, report and reduce greenhouse gas emissions across scopes 1, 2 and 3.','Meça, reporte e reduza emissões de gases de efeito estufa nos escopos 1, 2 e 3.','Cloud','#1F4D3A',1),
('csrd','CSRD & Reporting','CSRD e Relatórios','Navigate the Corporate Sustainability Reporting Directive and ESRS standards.','Navegue pela Diretiva de Relatórios de Sustentabilidade Corporativa e padrões ESRS.','FileText','#2E6B52',2),
('circular-economy','Circular Economy','Economia Circular','Design out waste — products, materials and business models that regenerate.','Elimine o desperdício — produtos, materiais e modelos de negócio que regeneram.','Recycle','#7BA686',3),
('biodiversity','Biodiversity & Nature','Biodiversidade e Natureza','Assess nature-related risks and opportunities through TNFD and SBTN frameworks.','Avalie riscos e oportunidades relacionados à natureza com TNFD e SBTN.','Trees','#3F7D5C',4),
('social-impact','Social Impact','Impacto Social','Human rights, diversity, community engagement and the S in ESG.','Direitos humanos, diversidade, engajamento comunitário e o S do ESG.','Users','#C97B5A',5),
('governance','Governance','Governança','Board oversight, ethics, transparency and ESG-linked incentives.','Supervisão do conselho, ética, transparência e incentivos ligados a ESG.','Scale','#8B5E3C',6);

-- Seed 3 placeholder content items per category
INSERT INTO public.content_items (category_id, type, title_en, title_pt, summary_en, summary_pt, body_en, body_pt, difficulty, reading_time_min, tags, published, featured)
SELECT c.id, t.type::public.content_type, t.title_en, t.title_pt, t.summary_en, t.summary_pt,
  '# ' || t.title_en || E'\n\nThis is a placeholder article body. Replace with real content.\n\n## Key takeaways\n\n- Point one\n- Point two\n- Point three',
  '# ' || t.title_pt || E'\n\nEste é um corpo de artigo de exemplo. Substitua pelo conteúdo real.\n\n## Principais aprendizados\n\n- Ponto um\n- Ponto dois\n- Ponto três',
  t.difficulty::public.content_difficulty, t.reading_time_min, t.tags, true, t.featured
FROM public.categories c
CROSS JOIN LATERAL (VALUES
  ('article', 'Introduction to ' || c.name_en, 'Introdução a ' || c.name_pt, 'A primer covering the fundamentals and why it matters now.', 'Uma introdução aos fundamentos e por que isso importa agora.', 'beginner', 6, ARRAY['intro','fundamentals'], true),
  ('guide',   'Practitioner Guide: ' || c.name_en, 'Guia Prático: ' || c.name_pt, 'A step-by-step playbook for sustainability teams.', 'Um manual passo a passo para equipes de sustentabilidade.', 'intermediate', 12, ARRAY['playbook','team'], false),
  ('link',    'Recommended Reading on ' || c.name_en, 'Leitura Recomendada sobre ' || c.name_pt, 'Curated external resource from leading ESG voices.', 'Recurso externo selecionado das principais vozes do ESG.', 'advanced', 8, ARRAY['external','deep-dive'], false)
) AS t(type, title_en, title_pt, summary_en, summary_pt, difficulty, reading_time_min, tags, featured);