-- Zirna Rahbi EduTrack — Row-Level Security Policies
-- Run this once in the Supabase SQL Editor after `npx prisma migrate dev`.
--
-- ═══════════════════════════════════════════════════════════════════════
-- IMPORTANT — READ BEFORE RUNNING
-- ═══════════════════════════════════════════════════════════════════════
-- Prisma (via DATABASE_URL) connects to Supabase using the `postgres`
-- role, which has the BYPASSRLS attribute and therefore ignores every
-- policy below. That means these policies do NOT protect data reached
-- through our own Next.js backend (Server Components and API routes
-- using src/lib/db.ts) — that path is protected instead by
-- application-level checks (requireRole() / getCurrentUser() in
-- src/lib/auth.ts) plus explicit WHERE clauses scoping each query to the
-- right student/parent/teacher. That is the real security boundary for
-- this app today.
--
-- These policies exist as defense-in-depth for anything that talks to
-- Supabase directly with the anon/authenticated key instead of going
-- through our backend — e.g. Supabase's auto-generated REST/GraphQL API,
-- Realtime subscriptions, or any future client-side supabase-js queries
-- (a likely path for a future feature like live notifications). Keeping
-- these correct now means we won't have to retrofit security later.
-- ═══════════════════════════════════════════════════════════════════════

-- Helper: returns the calling user's role by reading our own `users`
-- table. SECURITY DEFINER lets it read `users` even though `users` itself
-- has RLS enabled below — otherwise this function would be blocked from
-- reading the very table it's supposed to check, and every policy that
-- depends on it would fail closed.
create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role::text from public.users where id = auth.uid();
$$;

-- ───────────────────────────────────────────────────────────────────────
-- users
-- ───────────────────────────────────────────────────────────────────────
alter table public.users enable row level security;

create policy "users_select_self_or_admin"
  on public.users for select
  using (id = auth.uid() or public.current_role() = 'ADMIN');

create policy "users_admin_manage"
  on public.users for all
  using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────
-- staff_profiles
-- ───────────────────────────────────────────────────────────────────────
alter table public.staff_profiles enable row level security;

create policy "staff_profiles_select_self_or_admin"
  on public.staff_profiles for select
  using (user_id = auth.uid() or public.current_role() = 'ADMIN');

create policy "staff_profiles_admin_manage"
  on public.staff_profiles for all
  using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────
-- students
-- ───────────────────────────────────────────────────────────────────────
alter table public.students enable row level security;

create policy "students_staff_select"
  on public.students for select
  using (public.current_role() in ('ADMIN', 'TEACHER', 'ASSISTANT'));

create policy "students_parent_select_own_child"
  on public.students for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = students.id and psl.parent_user_id = auth.uid()
    )
  );

create policy "students_admin_manage"
  on public.students for all
  using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────
-- parent_student_links
-- ───────────────────────────────────────────────────────────────────────
alter table public.parent_student_links enable row level security;

create policy "psl_parent_select_own"
  on public.parent_student_links for select
  using (parent_user_id = auth.uid() or public.current_role() = 'ADMIN');

create policy "psl_admin_manage"
  on public.parent_student_links for all
  using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────
-- subjects / student_subjects
-- ───────────────────────────────────────────────────────────────────────
alter table public.subjects enable row level security;

create policy "subjects_select_all_authenticated"
  on public.subjects for select
  using (auth.uid() is not null);

create policy "subjects_admin_manage"
  on public.subjects for all
  using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

alter table public.student_subjects enable row level security;

create policy "student_subjects_staff_select"
  on public.student_subjects for select
  using (public.current_role() in ('ADMIN', 'TEACHER', 'ASSISTANT'));

create policy "student_subjects_parent_select_own_child"
  on public.student_subjects for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = student_subjects.student_id and psl.parent_user_id = auth.uid()
    )
  );

create policy "student_subjects_admin_manage"
  on public.student_subjects for all
  using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────
-- attendance_records
-- ───────────────────────────────────────────────────────────────────────
alter table public.attendance_records enable row level security;

create policy "attendance_staff_select"
  on public.attendance_records for select
  using (public.current_role() in ('ADMIN', 'TEACHER', 'ASSISTANT'));

create policy "attendance_parent_select_own_child"
  on public.attendance_records for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = attendance_records.student_id and psl.parent_user_id = auth.uid()
    )
  );

create policy "attendance_staff_write_own_entries"
  on public.attendance_records for insert
  with check (
    public.current_role() in ('ADMIN', 'TEACHER', 'ASSISTANT')
    and marked_by = auth.uid()
  );

create policy "attendance_staff_update_own_entries"
  on public.attendance_records for update
  using (public.current_role() = 'ADMIN' or marked_by = auth.uid())
  with check (public.current_role() = 'ADMIN' or marked_by = auth.uid());

create policy "attendance_admin_delete"
  on public.attendance_records for delete
  using (public.current_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────
-- assessments
-- ───────────────────────────────────────────────────────────────────────
alter table public.assessments enable row level security;

create policy "assessments_staff_select"
  on public.assessments for select
  using (public.current_role() in ('ADMIN', 'TEACHER', 'ASSISTANT'));

create policy "assessments_parent_select_relevant"
  on public.assessments for select
  using (
    exists (
      select 1
      from public.student_subjects ss
      join public.parent_student_links psl on psl.student_id = ss.student_id
      where ss.subject_id = assessments.subject_id and psl.parent_user_id = auth.uid()
    )
  );

create policy "assessments_teacher_write_own_subject"
  on public.assessments for insert
  with check (
    public.current_role() = 'ADMIN'
    or (
      public.current_role() = 'TEACHER'
      and exists (
        select 1 from public.student_subjects ss
        where ss.subject_id = assessments.subject_id and ss.teacher_id = auth.uid()
      )
    )
  );

create policy "assessments_teacher_update_own_subject"
  on public.assessments for update
  using (
    public.current_role() = 'ADMIN'
    or (public.current_role() = 'TEACHER' and created_by = auth.uid())
  )
  with check (
    public.current_role() = 'ADMIN'
    or (public.current_role() = 'TEACHER' and created_by = auth.uid())
  );

create policy "assessments_admin_delete"
  on public.assessments for delete
  using (public.current_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────
-- assessment_marks
-- ───────────────────────────────────────────────────────────────────────
alter table public.assessment_marks enable row level security;

create policy "marks_staff_select"
  on public.assessment_marks for select
  using (public.current_role() in ('ADMIN', 'TEACHER', 'ASSISTANT'));

create policy "marks_parent_select_own_child"
  on public.assessment_marks for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = assessment_marks.student_id and psl.parent_user_id = auth.uid()
    )
  );

create policy "marks_teacher_write_own_subject"
  on public.assessment_marks for insert
  with check (
    public.current_role() = 'ADMIN'
    or (
      public.current_role() = 'TEACHER'
      and exists (
        select 1
        from public.assessments a
        join public.student_subjects ss
          on ss.subject_id = a.subject_id and ss.student_id = assessment_marks.student_id
        where a.id = assessment_marks.assessment_id and ss.teacher_id = auth.uid()
      )
    )
  );

create policy "marks_teacher_update_own_entries"
  on public.assessment_marks for update
  using (public.current_role() = 'ADMIN' or entered_by = auth.uid())
  with check (public.current_role() = 'ADMIN' or entered_by = auth.uid());

create policy "marks_admin_delete"
  on public.assessment_marks for delete
  using (public.current_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────
-- fee_structures / fee_payments
-- ───────────────────────────────────────────────────────────────────────
alter table public.fee_structures enable row level security;

create policy "fee_structures_admin_select"
  on public.fee_structures for select
  using (public.current_role() = 'ADMIN');

create policy "fee_structures_admin_manage"
  on public.fee_structures for all
  using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

alter table public.fee_payments enable row level security;

create policy "fee_payments_admin_select"
  on public.fee_payments for select
  using (public.current_role() = 'ADMIN');

create policy "fee_payments_parent_select_own_child"
  on public.fee_payments for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = fee_payments.student_id and psl.parent_user_id = auth.uid()
    )
  );

create policy "fee_payments_admin_manage"
  on public.fee_payments for all
  using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────
-- report_cards
-- ───────────────────────────────────────────────────────────────────────
alter table public.report_cards enable row level security;

create policy "report_cards_admin_select"
  on public.report_cards for select
  using (public.current_role() = 'ADMIN');

create policy "report_cards_parent_select_own_child"
  on public.report_cards for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = report_cards.student_id and psl.parent_user_id = auth.uid()
    )
  );

create policy "report_cards_admin_manage"
  on public.report_cards for all
  using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');
