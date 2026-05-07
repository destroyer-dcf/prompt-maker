-- Prompt Manager - Supabase RLS policies
-- Ejecutar este script en Supabase SQL Editor después de crear tablas.

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.tags enable row level security;
alter table public.collections enable row level security;
alter table public.templates enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.prompt_variants enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.api_keys enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert
on public.profiles
for insert
to authenticated
with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete
on public.profiles
for delete
to authenticated
using (public.is_admin());

drop policy if exists tags_select on public.tags;
create policy tags_select
on public.tags
for select
to authenticated
using (true);

drop policy if exists tags_insert on public.tags;
create policy tags_insert
on public.tags
for insert
to authenticated
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists tags_update on public.tags;
create policy tags_update
on public.tags
for update
to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists tags_delete on public.tags;
create policy tags_delete
on public.tags
for delete
to authenticated
using (created_by = auth.uid() or public.is_admin());

drop policy if exists collections_select on public.collections;
create policy collections_select
on public.collections
for select
to authenticated
using (author_id = auth.uid() or public.is_admin());

drop policy if exists collections_insert on public.collections;
create policy collections_insert
on public.collections
for insert
to authenticated
with check (author_id = auth.uid() or public.is_admin());

drop policy if exists collections_update on public.collections;
create policy collections_update
on public.collections
for update
to authenticated
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

drop policy if exists collections_delete on public.collections;
create policy collections_delete
on public.collections
for delete
to authenticated
using (author_id = auth.uid() or public.is_admin());

drop policy if exists templates_select on public.templates;
create policy templates_select
on public.templates
for select
to authenticated
using (author_id = auth.uid() or visibility = 'public' or public.is_admin());

drop policy if exists templates_insert on public.templates;
create policy templates_insert
on public.templates
for insert
to authenticated
with check (author_id = auth.uid() or public.is_admin());

drop policy if exists templates_update on public.templates;
create policy templates_update
on public.templates
for update
to authenticated
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

drop policy if exists templates_delete on public.templates;
create policy templates_delete
on public.templates
for delete
to authenticated
using (author_id = auth.uid() or public.is_admin());

drop policy if exists prompts_select on public.prompts;
create policy prompts_select
on public.prompts
for select
to authenticated
using (author_id = auth.uid() or visibility = 'public' or public.is_admin());

drop policy if exists prompts_insert on public.prompts;
create policy prompts_insert
on public.prompts
for insert
to authenticated
with check (author_id = auth.uid() or public.is_admin());

drop policy if exists prompts_update on public.prompts;
create policy prompts_update
on public.prompts
for update
to authenticated
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

drop policy if exists prompts_delete on public.prompts;
create policy prompts_delete
on public.prompts
for delete
to authenticated
using (author_id = auth.uid() or public.is_admin());

drop policy if exists prompt_versions_select on public.prompt_versions;
create policy prompt_versions_select
on public.prompt_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.prompts p
    where p.id = prompt_id
      and (p.author_id = auth.uid() or p.visibility = 'public' or public.is_admin())
  )
);

drop policy if exists prompt_versions_insert on public.prompt_versions;
create policy prompt_versions_insert
on public.prompt_versions
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.prompts p
    where p.id = prompt_id
      and (p.author_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists prompt_versions_update on public.prompt_versions;
create policy prompt_versions_update
on public.prompt_versions
for update
to authenticated
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

drop policy if exists prompt_versions_delete on public.prompt_versions;
create policy prompt_versions_delete
on public.prompt_versions
for delete
to authenticated
using (author_id = auth.uid() or public.is_admin());

drop policy if exists prompt_variants_select on public.prompt_variants;
create policy prompt_variants_select
on public.prompt_variants
for select
to authenticated
using (
  exists (
    select 1
    from public.prompts p
    where p.id = prompt_id
      and (p.author_id = auth.uid() or p.visibility = 'public' or public.is_admin())
  )
);

drop policy if exists prompt_variants_insert on public.prompt_variants;
create policy prompt_variants_insert
on public.prompt_variants
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.prompts p
    where p.id = prompt_id
      and (p.author_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists prompt_variants_update on public.prompt_variants;
create policy prompt_variants_update
on public.prompt_variants
for update
to authenticated
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

drop policy if exists prompt_variants_delete on public.prompt_variants;
create policy prompt_variants_delete
on public.prompt_variants
for delete
to authenticated
using (author_id = auth.uid() or public.is_admin());

drop policy if exists favorites_select on public.favorites;
create policy favorites_select
on public.favorites
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists favorites_insert on public.favorites;
create policy favorites_insert
on public.favorites
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists favorites_delete on public.favorites;
create policy favorites_delete
on public.favorites
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_select on public.notifications;
create policy notifications_select
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert
on public.notifications
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update
on public.notifications
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete
on public.notifications
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists api_keys_select on public.api_keys;
create policy api_keys_select
on public.api_keys
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists api_keys_insert on public.api_keys;
create policy api_keys_insert
on public.api_keys
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists api_keys_update on public.api_keys;
create policy api_keys_update
on public.api_keys
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists api_keys_delete on public.api_keys;
create policy api_keys_delete
on public.api_keys
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

commit;
