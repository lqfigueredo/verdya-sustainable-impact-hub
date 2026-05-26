# Revisão de Código — Verdya

Fiz uma varredura do projeto (rotas, libs, componentes, banco e linter). Abaixo está o que encontrei, agrupado por prioridade. Cada item indica o arquivo e o que ajustar. Posso executar todos ou apenas um subconjunto — me diga o que prefere.

## 🔴 Alta prioridade (correção/segurança)

1. **Links mortos no Footer** (`src/components/Footer.tsx`)
   - Todas as colunas (`aboutLinks`, `exploreLinks`, `legalLinks`) e ícones sociais usam `href="#"`. Mapear cada link de tradução para rota real (`/library`, `/events`, `/community`, `/newsletter`, `/about`, `/privacy`, `/terms`) e remover ícones sociais ou apontar para URLs reais.

2. **Links âncora quebrados no Header** (`src/components/Header.tsx`)
   - `/#resources` e `/#about` não existem como seções com ID na home. Criar rotas reais `/about` e `/resources` (com `head()` próprio) **ou** remover do menu até existirem páginas.

3. **Avisos do Supabase Linter** (4 WARN)
   - Bucket público `content-files` permite listagem — adicionar policy restritiva em `storage.objects` ou tornar privado com URLs assinadas.
   - 3 funções `SECURITY DEFINER` expostas ao Data API: `touch_updated_at`, `handle_new_user`, `handle_new_forum_reply` — revogar `EXECUTE` de `anon`/`authenticated` (elas só rodam via trigger). `has_role` precisa permanecer executável.

4. **Profile usa `useEffect` + fetch direto** (`src/routes/profile.tsx`)
   - Substituir por `useQuery` para cache e estado de erro consistentes; remover variável `loading` morta (nunca é usada no JSX).

5. **`AUTHOR_SELECT` expõe `bio` em listas públicas do fórum** (`src/lib/forum.ts:41`)
   - Listas só precisam de `id, full_name, avatar_url, company`. Manter `bio/country` só na query do tópico individual.

## 🟡 Média prioridade (UX/consistência)

6. **Send confirmation de evento é só em inglês** (`src/lib/email.functions.ts`)
   - `sendEventConfirmation` envia `title_en` fixo. Aceitar `lang` ou ler `language_pref` do subscriber/perfil e usar `title_pt/description_pt` quando aplicável.

7. **Markdown→HTML do email é frágil** (`src/lib/email.functions.ts:mdToHtml`)
   - Não trata listas, quebras simples nem code blocks; `\n\n` antes do escape pode quebrar. Trocar por `marked` (já compatível com Worker) ou expandir regex (listas, `\n` simples, blocos `\`\`\``).

8. **Admin dashboard "atividade recente" só mostra conteúdo** (`src/routes/admin.index.tsx`)
   - Adicionar tópicos do fórum, novas inscrições em eventos e novos assinantes da newsletter para dar visão real.

9. **Botão "Nova categoria" leva para listagem** (`src/routes/admin.index.tsx`)
   - Apontar para `/admin/categories` com `?new=1` e abrir o modal de criação automaticamente.

10. **Filtro de profanidade simples** (`src/lib/forum.ts:detectFlag`)
    - Hoje só marca `flagged=true` mas a UI não usa essa flag. Adicionar coluna no admin de fórum (criar `/admin/forum`) listando itens flagged para revisão; senão o filtro é inútil.

11. **Loaders sem `ensureQueryData`**
    - Várias rotas usam `useQuery` em cliente sem prefetch no loader → flash de loading no SSR. Aplicar padrão `ensureQueryData` em `community.index`, `events.index`, `library.index`, `dashboard`.

12. **`errorComponent`/`notFoundComponent` faltando**
    - Só 2 de 27 rotas definem. Adicionar pelo menos `errorComponent` global nas rotas com loaders (community, events, library, admin).

## 🟢 Baixa prioridade (polish)

13. **Centralizar detecção de idioma** — repetido em ~10 arquivos:
    `const lang = i18n.language?.startsWith("pt") ? "pt" : "en";`
    Criar `useLang()` em `src/hooks/use-lang.ts`.

14. **Avatar do usuário no Header** — só mostra iniciais, ignora `user_metadata.avatar_url`. Usar componente `<Avatar>` do shadcn.

15. **Page `/profile` não tem aba "Meus eventos"** — embora o dashboard mostre, faz sentido espelhar no profile com tabs (Editar / Meus eventos / Favoritos).

16. **`FROM_DEFAULT = onboarding@resend.dev`** — domínio sandbox, só envia para o próprio dono da conta Resend. Documentar/avisar admin que precisa configurar domínio verificado antes de "Enviar a todos".

17. **`src/routeTree.gen.ts` editado manualmente?** — confirmar que está em sync (regenera automaticamente, mas vale rodar build para garantir).

18. **SEO**: rodar `seo_chat--trigger_scan` depois das correções de rotas para validar metadata novo.

## Como prefere prosseguir?

Sugiro executar em 3 ondas:
- **Onda 1 (segurança + links):** itens 1, 2, 3, 4, 5
- **Onda 2 (admin + email):** itens 6, 7, 8, 9, 10
- **Onda 3 (polish):** itens 11–18

Me diga "vai com tudo", "só onda 1", ou liste os números que quer.