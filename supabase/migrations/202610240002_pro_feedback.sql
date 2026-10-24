create table if not exists public.pro_feedback (
  id bigint generated always as identity primary key,
  session_hash text not null,
  customer_email text not null,
  feedback_type text not null check (feedback_type in ('review', 'support')),
  rating integer,
  message text not null check (char_length(message) between 10 and 2000),
  created_at timestamptz not null default now(),
  constraint pro_feedback_rating_check check (
    (feedback_type = 'review' and rating between 1 and 5)
    or (feedback_type = 'support' and rating is null)
  )
);

create index if not exists pro_feedback_created_at_idx
  on public.pro_feedback (created_at desc);

alter table public.pro_feedback enable row level security;
revoke all on public.pro_feedback from public, anon, authenticated;
