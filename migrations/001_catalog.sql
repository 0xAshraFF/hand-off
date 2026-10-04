-- Supabase/Postgres 15+. Ingestion uses the server-side service_role only.
create table public.providers (
  id text primary key,
  name text not null,
  homepage_url text,
  created_at timestamptz not null default now()
);

create table public.tools (
  id text primary key,
  provider_id text not null references public.providers(id),
  name text not null,
  kind text not null,
  status text not null default 'unverified',
  source_url text not null,
  hardware text,
  availability text,
  access jsonb not null default '{}'::jsonb,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.models (
  id text primary key,
  tool_id text not null references public.tools(id),
  provider_model_id text,
  version text,
  context_tokens integer check (context_tokens > 0),
  metadata jsonb not null default '{}'::jsonb
);

create table public.capabilities (
  id text primary key,
  label text not null
);

create table public.tool_capabilities (
  tool_id text not null references public.tools(id),
  capability_id text not null references public.capabilities(id),
  supported boolean not null,
  evidence_url text,
  primary key (tool_id, capability_id)
);

create table public.regions (
  id text primary key,
  label text not null
);

create table public.source_urls (
  id bigint generated always as identity primary key,
  url text not null unique check (url ~ '^https://'),
  provider_id text references public.providers(id),
  source_type text not null check
    (source_type in ('official_api','official_pricing','official_docs','trusted_aggregator','manual')),
  created_at timestamptz not null default now()
);

create table public.pricing (
  observation_key text unique,
  id bigint generated always as identity primary key,
  tool_id text not null references public.tools(id),
  region_id text references public.regions(id),
  source_url_id bigint references public.source_urls(id),
  pricing_type text not null,
  currency text not null,
  scope text not null default '',
  unit text,
  unit_cost numeric(20,8) check (unit_cost >= 0),
  input_per_1m numeric(20,8) check (input_per_1m >= 0),
  cached_input_per_1m numeric(20,8) check (cached_input_per_1m >= 0),
  output_per_1m numeric(20,8) check (output_per_1m >= 0),
  status text not null check (status in ('verified','estimated','unknown')),
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  check (
    status <> 'verified' or (source_url_id is not null and verified_at is not null)
  )
);

create index pricing_lookup on public.pricing
  (tool_id, region_id, scope, observed_at desc);

-- Append one row for every successful price observation, including unchanged prices.
create table public.price_history (
  observation_key text unique,
  id bigint generated always as identity primary key,
  tool_id text not null references public.tools(id),
  source_url_id bigint references public.source_urls(id),
  source_check_id bigint,
  observed_at timestamptz not null default now(),
  changed boolean not null,
  previous_price jsonb,
  observed_price jsonb not null,
  parser_version text
);

create table public.free_tiers (
  observation_key text unique,
  id bigint generated always as identity primary key,
  tool_id text not null references public.tools(id),
  region_id text references public.regions(id),
  source_url_id bigint references public.source_urls(id),
  available boolean not null,
  unconditional boolean not null default false,
  eligibility text,
  quota jsonb,
  starts_at timestamptz,
  expires_at timestamptz,
  verified_at timestamptz,
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create table public.subscriptions (
  observation_key text unique,
  id bigint generated always as identity primary key,
  tool_id text not null references public.tools(id),
  name text not null,
  source_url_id bigint references public.source_urls(id),
  monthly_usd numeric(20,8) check (monthly_usd >= 0),
  access_mode text not null,
  includes_api_credits boolean not null default false,
  limits jsonb not null default '{}'::jsonb,
  verified_at timestamptz
);

create table public.offers (
  id text primary key,
  tool_id text not null references public.tools(id),
  source_url_id bigint references public.source_urls(id),
  title text not null,
  eligibility text,
  limits text,
  starts_at timestamptz,
  expires_at timestamptz,
  status text not null default 'unverified',
  verified_at timestamptz,
  details jsonb not null default '{}'::jsonb,
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

-- Append one row for each offer observation, expiry, or removal.
create table public.offer_history (
  observation_key text unique,
  id bigint generated always as identity primary key,
  offer_id text not null references public.offers(id),
  source_url_id bigint references public.source_urls(id),
  observed_at timestamptz not null default now(),
  changed boolean not null,
  previous_offer jsonb,
  observed_offer jsonb,
  event text not null check (event in ('observed','changed','expired','removed','failed'))
);

create table public.source_checks (
  observation_key text unique,
  id bigint generated always as identity primary key,
  source_url_id bigint not null references public.source_urls(id),
  tool_id text references public.tools(id),
  check_kind text not null check (check_kind in ('price','offer','capability','reachability')),
  checked_at timestamptz not null default now(),
  ok boolean not null,
  price_verified boolean not null default false,
  change_detected boolean,
  parser_version text,
  note text not null
);

alter table public.price_history
  add constraint price_history_source_check_fk
  foreign key (source_check_id) references public.source_checks(id);

create table public.quality_evidence (
  observation_key text unique,
  id bigint generated always as identity primary key,
  tool_id text not null references public.tools(id),
  capability_id text references public.capabilities(id),
  evidence_type text not null,
  source_url_id bigint references public.source_urls(id),
  summary text not null,
  reviewed_at timestamptz,
  score numeric(8,4),
  methodology text
);

create table public.benchmarks (
  id bigint generated always as identity primary key,
  name text not null,
  version text,
  task text not null,
  source_url_id bigint references public.source_urls(id),
  methodology text,
  published_at timestamptz
);

create table public.model_routes (
  id bigint generated always as identity primary key,
  model_id text not null references public.models(id),
  provider_id text not null references public.providers(id),
  route_name text not null,
  api_model_id text,
  region_id text references public.regions(id),
  access_mode text not null,
  status text not null default 'unverified',
  source_url_id bigint references public.source_urls(id),
  unique nulls not distinct (model_id, provider_id, route_name, region_id)
);

create table public.catalog_tags (
  tool_id text not null references public.tools(id),
  tag text not null,
  primary key (tool_id, tag)
);

create index source_checks_recent on public.source_checks
  (source_url_id, checked_at desc);
create index price_history_recent on public.price_history
  (tool_id, observed_at desc);
create index offer_history_recent on public.offer_history
  (offer_id, observed_at desc);
create index tool_capabilities_task on public.tool_capabilities
  (capability_id, supported);

-- Client roles can read catalog facts. Only service_role ingests changes.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'providers','tools','models','capabilities','tool_capabilities',
    'regions','source_urls','pricing','price_history','free_tiers',
    'subscriptions','offers','offer_history','source_checks',
    'quality_evidence','benchmarks','model_routes','catalog_tags'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      'catalog_read_' || table_name, table_name
    );
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
  end loop;
end $$;

grant usage, select on all sequences in schema public to service_role;

create view public.catalog_current_prices
with (security_invoker = true) as
select distinct on (p.tool_id, p.region_id, p.scope)
  p.*
from public.pricing p
order by p.tool_id, p.region_id, p.scope, p.observed_at desc, p.id desc;

create view public.catalog_active_offers
with (security_invoker = true) as
select *
from public.offers
where status = 'verified'
  and source_url_id is not null and verified_at is not null
  and verified_at <= now() and verified_at >= now() - interval '36 hours'
  and (starts_at is null or starts_at <= now())
  and (expires_at is null or expires_at > now());

create view public.catalog_public_items
with (security_invoker = true) as
select t.*, p.name as provider_name,
  coalesce(array_agg(distinct ct.tag) filter (where ct.tag is not null), '{}') as tags
from public.tools t
join public.providers p on p.id = t.provider_id
left join public.catalog_tags ct on ct.tool_id = t.id
where t.status = 'active'
group by t.id, p.name;

grant select on public.catalog_current_prices,
  public.catalog_active_offers, public.catalog_public_items
  to anon, authenticated, service_role;

