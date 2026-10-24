alter table public.pro_feedback
  add column if not exists major text;

alter table public.pro_feedback
  add constraint pro_feedback_major_check
    check (major is null or char_length(major) between 2 and 120);

