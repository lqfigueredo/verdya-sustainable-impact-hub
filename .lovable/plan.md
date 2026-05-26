## Verdya Admin Panel

Build a complete admin panel at `/admin` gated by `AdminRoute`, covering Dashboard, Content Manager, Categories, Users, and Settings.

### 1. Database (one migration)

- Create `site_settings` table: `key` (text PK), `value` (jsonb), `updated_at`. Public read, admin write.
- Add helper view-less query: count of content items by status will use existing `content_items`.
- Grants + RLS for `site_settings` (anon SELECT, admin ALL).

### 2. Layout & routing

- `src/routes/admin.tsx` — layout route wrapped in `AdminRoute`, renders shadcn `SidebarProvider` + `AppAdminSidebar` + topbar (admin name, "Back to site", language toggle) + `<Outlet />`.
- Child routes (flat dot convention):
  - `admin.index.tsx` — Dashboard
  - `admin.content.index.tsx` — Content list
  - `admin.content.new.tsx` — New content form
  - `admin.content.$id.edit.tsx` — Edit content form
  - `admin.categories.tsx` — Categories CRUD
  - `admin.users.tsx` — Users table
  - `admin.settings.tsx` — Site settings
- New `AppAdminSidebar` component with Lucide icons, active-route highlighting, collapsible.

### 3. Dashboard (`/admin`)

- 4 stats cards using TanStack Query: total content, total users, published this month, draft count.
- Recent activity feed: latest 10 content items (created_at desc) showing title, type, status, author.
- Quick action buttons routing to new content / categories.

### 4. Content Manager

- Reusable `DataTable` based on `@tanstack/react-table` + shadcn `Table`. Install `@tanstack/react-table`.
- Columns: cover thumbnail, title (current lang), type badge, category, status badge, author full_name, created_at, row actions (Edit, Delete).
- Toolbar: search (title_en/title_pt ilike), filter selects for type / category / status. Bulk row selection with publish / unpublish / delete actions (AlertDialog confirmation).
- "+ New content" button → `/admin/content/new`.

### 5. Content form (new + edit)

- `react-hook-form` + `zod` (already installed via shadcn form).
- Install `@uiw/react-md-editor` for markdown body.
- Tabs (shadcn `Tabs`): "English" and "Portuguese", each with title, summary, body (markdown).
- Common fields: category select, type select, difficulty select, tags input (chip input — simple comma-separated input with badge chips), reading time, external_url.
- File uploads to `content-files` bucket: cover image (image/*) + file (pdf/*). Show preview for cover, filename for pdf. Use unique paths `user-id/filename`.
- Switches: Published, Featured.
- Footer buttons: "Save draft" (published=false), "Publish" (published=true), Cancel.
- On submit: insert or update via supabase client; toast; navigate back to list.

### 6. Categories

- List sorted by `order` asc; each row shows icon, color swatch, names (EN/PT), slug, inline edit & delete buttons.
- Form (modal Dialog) for create/edit: slug, name_en, name_pt, description_en, description_pt, icon (text input + Lucide preview), color (`<input type="color">`), order.
- Drag-to-reorder: install `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. On reorder, update `order` for affected rows.

### 7. Users

- Table: avatar, full_name, email, country, joined (`created_at`), role (badge), actions.
- Filter by role select.
- Role toggle: AlertDialog "Promote to admin" / "Demote to member" → insert/delete in `user_roles`. Cannot demote self.
- "View" action opens Dialog with full profile (bio, company, country, avatar large).
- Pulls users from `profiles` left-joined with `user_roles`.

### 8. Settings

- Form to edit keyed settings stored in `site_settings`:
  - `site_title` (text)
  - `hero_text_en`, `hero_text_pt` (textarea)
  - `featured_content_ids` (multi-select from content_items)
  - `social_links` (twitter/linkedin/instagram URLs)
- Single "Save" button upserts all keys.

### 9. UX polish

- All destructive actions → shadcn `AlertDialog` confirmation.
- All CRUD → sonner toast (success/error).
- Optimistic updates via TanStack Query mutations + `setQueryData` rollback.
- Loading states use shadcn `Skeleton` components (table rows, cards).
- Header gets an "Admin" link entry already shown for admins (already wired).

### 10. i18n

- Add `admin.*` keys to `src/locales/en.json` and `pt.json` for all labels, table headers, buttons, toasts, dialog text.

### Technical notes

- New packages: `@tanstack/react-table`, `@uiw/react-md-editor`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- Storage uploads use existing `content-files` bucket (already public read / admin write).
- All queries scoped via existing RLS (admin role bypasses through "Admins manage *" policies).
- Self-demotion guard in users page (compare to `useAuth().user.id`).
- Routes registered automatically via TanStack Router file-based routing.
