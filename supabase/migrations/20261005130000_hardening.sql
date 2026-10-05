-- Hardening after the Supabase advisors review:
--   * role-check helpers move to a schema that is not exposed through the Data API,
--   * foreign keys get covering indexes,
--   * "manage" policies no longer overlap the public SELECT policies.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function private.is_staff() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.is_staff() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

-- admin_users
drop policy "staff read staff" on public.admin_users;
drop policy "admins manage staff" on public.admin_users;
create policy "staff read staff" on public.admin_users
  for select to authenticated using ((select private.is_staff()));
create policy "admins add staff" on public.admin_users
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins edit staff" on public.admin_users
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins remove staff" on public.admin_users
  for delete to authenticated using ((select private.is_admin()));

-- products
drop policy "public reads visible products" on public.products;
drop policy "staff manage products" on public.products;
create policy "read visible products" on public.products
  for select to anon, authenticated using (not is_hidden or (select private.is_staff()));
create policy "staff add products" on public.products
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff edit products" on public.products
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff remove products" on public.products
  for delete to authenticated using ((select private.is_staff()));

-- banners
drop policy "public reads live banners" on public.banners;
drop policy "staff manage banners" on public.banners;
create policy "read live banners" on public.banners
  for select to anon, authenticated using (
    (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
    or (select private.is_staff())
  );
create policy "staff add banners" on public.banners
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff edit banners" on public.banners
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff remove banners" on public.banners
  for delete to authenticated using ((select private.is_staff()));

-- leads / events / audit
drop policy "staff read leads" on public.leads;
drop policy "staff update leads" on public.leads;
drop policy "admins delete leads" on public.leads;
create policy "staff read leads" on public.leads
  for select to authenticated using ((select private.is_staff()));
create policy "staff update leads" on public.leads
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "admins delete leads" on public.leads
  for delete to authenticated using ((select private.is_admin()));

drop policy "staff read lead events" on public.lead_events;
drop policy "staff add lead events" on public.lead_events;
create policy "staff read lead events" on public.lead_events
  for select to authenticated using ((select private.is_staff()));
create policy "staff add lead events" on public.lead_events
  for insert to authenticated with check ((select private.is_staff()));

drop policy "staff read audit" on public.audit_log;
drop policy "staff add audit" on public.audit_log;
create policy "staff read audit" on public.audit_log
  for select to authenticated using ((select private.is_staff()));
create policy "staff add audit" on public.audit_log
  for insert to authenticated with check ((select private.is_staff()));

-- storage
drop policy "staff upload media" on storage.objects;
drop policy "staff update media" on storage.objects;
drop policy "staff delete media" on storage.objects;
create policy "staff upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select private.is_staff()));
create policy "staff update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select private.is_staff()));
create policy "staff delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select private.is_staff()));

drop function public.is_staff();
drop function public.is_admin();

create index audit_log_actor_idx on public.audit_log (actor);
create index lead_events_actor_idx on public.lead_events (actor);
create index leads_assigned_to_idx on public.leads (assigned_to);
