# Revisão do fluxo Verdya — deixar pronto para uso

Após varrer landing, header, perfil, admin, eventos e newsletter, identifiquei conteúdo "decorativo" que precisa virar dado real, telas faltando e traduções incompletas. Abaixo o plano objetivo.

## 1. Provisionar usuário administrador

- Criar conta em `auth.users` com e-mail **lqfigueredo@gmail.com** (via migration usando `supabase_admin`/`auth.admin` API) com senha inicial temporária (a definir com você — sugiro gerar uma e te entregar para troca no primeiro login).
- O trigger `handle_new_user` já cria automaticamente `profiles` + role `member`.
- Promover esse usuário a `admin` inserindo linha em `public.user_roles (user_id, role='admin')`.

> Preciso confirmar com você: definir senha inicial agora ou enviar e-mail de "definir senha"? (ver perguntas abaixo)

## 2. Landing page — trocar mocks por dados reais

**Hero (`src/components/landing/Hero.tsx`)**
- Remover o card fixo "Marina S. — Head of ESG · São Paulo" e o badge "Live circle · 12 peers" (são fictícios).
- Substituir por mini stats reais: nº de conteúdos publicados, nº de membros, próximo evento — buscados do Supabase via server fn pública.
- Ligar os CTAs: "Começar" → `/signup`, "Explorar biblioteca" → `/library`.

**Featured (`src/components/landing/Featured.tsx`)**
- Hoje lê 3 cards do arquivo de tradução (estáticos). Trocar para query real em `content_items` onde `featured=true AND published=true` (limite 3), exibindo título por idioma, categoria, tempo de leitura e link para `/library/$contentId`. "Ver todos" → `/library`.

**Próximos eventos**
- Montar o componente `<UpcomingEvents />` na landing (entre Featured e HowItWorks) e também numa nova seção do dashboard.

**Newsletter footer**
- Já funcional, mas faltam chaves `newsletter.eyebrow/title/subtitle/placeholder/button/disclaimer` — completar tradução PT/EN.

## 3. Dashboard do usuário logado

Hoje o item de menu "Dashboard" no header aponta para `/profile`. Criar rota real **`/dashboard`** (protegida) com:
- Saudação + avatar.
- Cards: itens favoritos recentes, próximas inscrições em eventos, últimos tópicos do fórum que o usuário criou/respondeu, notificações não lidas.
- Atalho "Minhas inscrições" (eventos passados + futuros) — também adicionar bloco "Meus eventos" dentro de `/profile`.
- Header passa a apontar "Dashboard" para `/dashboard`.

## 4. Admin Dashboard (`/admin`)

Atualmente os stats já vêm do banco (total conteúdo/usuários/publicados/drafts) — está OK. Ajustes:
- Trocar "Recent activity" para incluir também novos usuários, novos tópicos do fórum e novas inscrições em eventos (não só conteúdo).
- Botão "+ Nova categoria" hoje só navega para a lista; abrir o modal de criação diretamente.

## 5. Traduções faltantes (PT + EN)

Adicionar seções completas em `src/locales/en.json` e `pt.json`:
- `events.*` (lista, detalhe, registrar, cancelar, online/presencial, contagem regressiva, add to calendar)
- `newsletterPage.*` (página dedicada + sucesso/erro)
- `adminEvents.*` e `adminNewsletter.*` (formulários, "enviar teste", "enviar a todos", export CSV)
- `dashboard.*` (saudação, blocos)
- `newsletter.*` (chaves usadas na seção do footer)

## 6. Limpeza / polish

- Header: links `/#resources` e `/#about` só funcionam na home — usar `<Link to="/" hash="resources">` para funcionarem de qualquer página.
- Footer: garantir que links sociais/legais não apontem para `#`.
- Página `/newsletter` dedicada: hoje tem texto, validar que não está duplicando o que já existe na landing.

## Detalhes técnicos

- Para a query pública de stats e featured na landing, usar `createServerFn` GET com `supabaseAdmin` (sem auth) filtrando por `published=true` (sem expor PII).
- Para o admin user: migration com bloco `DO $$ ... auth.users insert ... $$` usando `crypt()` do `pgcrypto`; em seguida `INSERT INTO public.user_roles ... ON CONFLICT DO NOTHING`. O `profile` é criado pelo trigger.
- Nenhuma mudança de schema é necessária além do seed do admin.

## Perguntas antes de implementar

1. **Senha do admin** `lqfigueredo@gmail.com`: gero uma temporária (te entrego no chat) ou prefere que eu deixe sem senha e você usa "Esqueci minha senha" no primeiro acesso?
2. Confirma que quer rota nova `/dashboard` (separada de `/profile`) ou prefere transformar `/profile` em hub único com abas (Visão geral / Editar perfil / Meus eventos / Favoritos)?
3. Posso remover o badge "Live circle · 12 peers" e o card "Marina S." do Hero (são placeholders), substituindo por números reais do banco? Ou prefere manter o mock visual até ter mais dados?