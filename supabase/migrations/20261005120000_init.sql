-- sofiivkawater.com — catalogue, homepage banners and CRM (orders / callbacks / contacts).
--
-- Access model:
--   * anon (public site)   — read visible products and active banners only.
--   * authenticated staff  — rows in public.admin_users; full access through RLS.
--   * service role (server API routes) — inserts leads; bypasses RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text not null default '',
  role       text not null default 'manager' check (role in ('admin', 'manager')),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

create or replace function public.is_admin()
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

revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
-- slug + category form the public URL and sku is the Meta Pixel / feed content id:
-- both must stay stable once a product is live.
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  sku         text unique,
  category    text not null,
  name        text not null,
  price       numeric(12, 2) not null default 0 check (price >= 0),
  old_price   numeric(12, 2) check (old_price is null or old_price >= 0),
  in_stock    boolean not null default true,
  cta_type    text not null default 'buy' check (cta_type in ('buy', 'request')),
  description text not null default '',
  image       text,
  images      jsonb not null default '[]'::jsonb,
  details     jsonb not null default '{}'::jsonb,
  -- Remaining Product fields (line, type, purpose, problem, filters, features, ...).
  attributes  jsonb not null default '{}'::jsonb,
  is_hidden   boolean not null default false,
  is_hit      boolean not null default false,
  is_promo    boolean not null default false,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index products_category_idx on public.products (category, sort);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Homepage banners
-- ---------------------------------------------------------------------------
create table public.banners (
  id            uuid primary key default gen_random_uuid(),
  placement     text not null default 'hero' check (placement in ('hero', 'side')),
  eyebrow       text not null default '',
  title         text not null,
  subtitle      text not null default '',
  cta_label     text not null default '',
  href          text not null default '/',
  image_desktop text,
  image_mobile  text,
  theme         text not null default 'dark' check (theme in ('dark', 'light')),
  sort          integer not null default 0,
  is_active     boolean not null default true,
  starts_at     timestamptz,
  ends_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index banners_placement_idx on public.banners (placement, sort);
create trigger banners_touch before update on public.banners
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- CRM: one table for orders, callback requests and contact-form messages
-- ---------------------------------------------------------------------------
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  number          bigint generated always as identity unique,
  external_id     text not null unique,
  kind            text not null check (kind in ('order', 'callback', 'contact')),
  status          text not null default 'new' check (
    status in ('new', 'contacting', 'confirmed', 'awaiting_shipment', 'shipped', 'completed', 'cancelled')
  ),
  customer_name   text not null default '',
  phone           text not null default '',
  email           text,
  address         text,
  comment         text,
  message         text,
  items           jsonb not null default '[]'::jsonb,
  total           numeric(12, 2) not null default 0,
  currency        text not null default 'UAH',
  payment_method  text not null default 'none' check (payment_method in ('cod', 'bank_transfer', 'cash', 'none')),
  payment_status  text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'not_required')),
  source          text not null default 'sofiivkawater.com',
  source_detail   text,
  -- Ads attribution — feeds Meta CAPI / GA4 Measurement Protocol conversions.
  lead_event_id   text,
  landing_page    text,
  referrer        text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,
  fbclid          text,
  fbp             text,
  fbc             text,
  gclid           text,
  ga_client_id    text,
  client_ip       text,
  user_agent      text,
  assigned_to     uuid references public.admin_users (user_id) on delete set null,
  manager_note    text,
  completed_at    timestamptz,
  -- {"lead": {"state": "sent", "at": "..."}, "purchase": {...}}
  tracking        jsonb not null default '{}'::jsonb,
  telegram_sent   boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index leads_created_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status, created_at desc);
create index leads_kind_idx on public.leads (kind, created_at desc);
create index leads_phone_idx on public.leads (phone);
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

create table public.lead_events (
  id         bigint generated always as identity primary key,
  lead_id    uuid not null references public.leads (id) on delete cascade,
  actor      uuid references public.admin_users (user_id) on delete set null,
  type       text not null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lead_events_lead_idx on public.lead_events (lead_id, created_at);

-- ---------------------------------------------------------------------------
-- Audit of catalogue / banner edits
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid references public.admin_users (user_id) on delete set null,
  entity     text not null,
  entity_id  text not null,
  action     text not null,
  diff       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.products    enable row level security;
alter table public.banners     enable row level security;
alter table public.leads       enable row level security;
alter table public.lead_events enable row level security;
alter table public.audit_log   enable row level security;

create policy "staff read staff" on public.admin_users
  for select to authenticated using ((select public.is_staff()));
create policy "admins manage staff" on public.admin_users
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public reads visible products" on public.products
  for select to anon, authenticated using (not is_hidden or (select public.is_staff()));
create policy "staff manage products" on public.products
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "public reads live banners" on public.banners
  for select to anon, authenticated using (
    (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
    or (select public.is_staff())
  );
create policy "staff manage banners" on public.banners
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff read leads" on public.leads
  for select to authenticated using ((select public.is_staff()));
create policy "staff update leads" on public.leads
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "admins delete leads" on public.leads
  for delete to authenticated using ((select public.is_admin()));

create policy "staff read lead events" on public.lead_events
  for select to authenticated using ((select public.is_staff()));
create policy "staff add lead events" on public.lead_events
  for insert to authenticated with check ((select public.is_staff()));

create policy "staff read audit" on public.audit_log
  for select to authenticated using ((select public.is_staff()));
create policy "staff add audit" on public.audit_log
  for insert to authenticated with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Storage: public bucket for product photos and banners
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "staff upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.is_staff()));
create policy "staff update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select public.is_staff()));
create policy "staff delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.is_staff()));
