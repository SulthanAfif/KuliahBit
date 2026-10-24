alter table public.pro_feedback
  add column if not exists university text,
  add column if not exists semester integer;

alter table public.pro_feedback
  add constraint pro_feedback_university_check
    check (university is null or char_length(university) between 2 and 120),
  add constraint pro_feedback_semester_check
    check (semester is null or semester between 1 and 20);
