create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view', 'interaction')),
  route text not null check (char_length(route) between 1 and 80),
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from public, anon, authenticated;

create or replace function public.get_usage_analytics(p_days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with settings as (
    select greatest(1, least(coalesce(p_days, 30), 90)) as days
  ),
  daily_counts as (
    select
      created_at::date as day,
      count(*) filter (where event_type = 'page_view') as views,
      count(*) filter (where event_type = 'interaction') as interactions
    from public.analytics_events, settings
    where created_at >= current_date - (settings.days - 1)
      and created_at < current_date + 1
    group by created_at::date
  ),
  page_counts as (
    select
      route,
      count(*) filter (where event_type = 'page_view') as views,
      count(*) filter (where event_type = 'interaction') as interactions
    from public.analytics_events, settings
    where created_at >= current_date - (settings.days - 1)
      and created_at < current_date + 1
    group by route
  )
  select jsonb_build_object(
    'daily', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'date', to_char(days.day, 'YYYY-MM-DD'),
            'views', coalesce(daily_counts.views, 0),
            'interactions', coalesce(daily_counts.interactions, 0)
          ) order by days.day
        ),
        '[]'::jsonb
      )
      from settings
      cross join lateral generate_series(
        current_date - (settings.days - 1),
        current_date,
        interval '1 day'
      ) as days(day)
      left join daily_counts on daily_counts.day = days.day::date
    ),
    'pages', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'path', page_counts.route,
            'views', page_counts.views,
            'interactions', page_counts.interactions
          ) order by page_counts.views + page_counts.interactions desc, page_counts.route
        ),
        '[]'::jsonb
      )
      from page_counts
    ),
    'totals', (
      select jsonb_build_object(
        'views', coalesce(sum(daily_counts.views), 0),
        'interactions', coalesce(sum(daily_counts.interactions), 0)
      )
      from daily_counts
    )
  )
$$;

revoke all on function public.get_usage_analytics(integer) from public, anon, authenticated;
grant execute on function public.get_usage_analytics(integer) to service_role;
