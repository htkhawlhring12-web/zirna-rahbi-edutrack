# Zirna Rahbi EduTrack — System Architecture & Design Document

**Prepared for:** Zirna Rahbi Study Centre
**Purpose:** Internal Student Performance Management System
**Status:** Architecture proposal — for review before development begins

---

## 1. Executive Summary

Zirna Rahbi EduTrack will be a web-based system that centralizes student records, attendance, marks, fees, and report cards for Zirna Rahbi Study Centre, with secure parent access. It is being designed for **16 students today, scaling to 40–50 within a year**, run by **3 staff members**.

Because the scale is small but the data is sensitive (grades, attendance, fee records, and access by parents of minors), the guiding principles for every decision below are:

1. **Security first** — parents must only ever see their own child's data. Nothing else.
2. **Low/zero cost** — the whole system should run within free tiers at this scale.
3. **Low maintenance burden** — you are a teacher, not a full-time engineer. The stack must be simple enough for one person to maintain.
4. **Room to grow** — homework, messaging, notifications, leaderboards, and AI insights should slot in later without a rewrite.

---

## 2. Recommended Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend + Backend | **Next.js** (React, App Router, TypeScript) | One framework handles both UI and server logic (API routes), which halves the complexity of what you have to deploy and maintain. Huge free learning resources and long-term community support. |
| Database | **PostgreSQL**, hosted on **Supabase** (free tier) | Relational data (students → marks → subjects → fees) fits a relational database far better than a NoSQL one. Supabase gives you a managed Postgres database, authentication, file storage, and row-level security — all in one free product. |
| ORM | **Prisma** | Type-safe database access from TypeScript, auto-generated migrations, and a schema file that doubles as documentation of your entire data model. |
| Authentication | **Supabase Auth** | Built-in email/password login, secure password hashing, session/token management. No need to build your own auth system (a place where homemade systems are most likely to have security holes). |
| Authorization | **PostgreSQL Row-Level Security (RLS)** | Enforces "a parent can only see their own child's data" at the *database* level, not just in application code — so even a bug in your frontend can't leak another family's data. |
| Styling / UI | **Tailwind CSS + shadcn/ui** | Free, modern, accessible component library. Produces a professional look without a designer. |
| Charts | **Recharts** | Free, React-native charting library for progress graphs. |
| Report card generation (PDF) | **@react-pdf/renderer** (or Puppeteer for HTML→PDF) | Generates printable, downloadable report cards server-side. |
| File storage | **Supabase Storage** | For report card PDFs, student photos, etc. Same free product as the database. |
| Hosting | **Vercel** (free Hobby tier) | Built by the creators of Next.js; deployment is push-to-deploy from GitHub. Free tier easily covers a 50-student internal tool. |
| Source control | **GitHub** (free private repo) | Version history, backup of your code, and a place to track development progress. |
| Email (future: notifications) | **Resend** (free tier, 3,000 emails/month) | For future fee reminders, report card notifications, etc. |

### Why not a simpler no-code tool (e.g. Airtable, Google Sheets)?
They cap out quickly on custom logic (report card PDF generation, role-based parent portals, automatic grade calculations across weekly/monthly/exam marks) and don't give you a real login system with per-student data isolation. You explicitly want something *professional and scalable* — a real application is the right call for that ambition, and the stack above is entirely free at your scale.

### Estimated cost at 50 students
**$0/month.** Vercel free tier, Supabase free tier (500MB database, 1GB file storage — a report-card system for 50 students will use a small fraction of this), and Resend free tier all comfortably cover you. You would only start looking at paid tiers in the hundreds-of-students range, and even then costs are modest (~$25/month).

---

## 3. User Roles & Permissions

| Role | Who | Access |
|---|---|---|
| **Admin** | You (Founder) | Full access: manage all students, staff accounts, subjects, fees, all marks/attendance, system settings. |
| **Teacher** | Chemistry teacher, and you for Maths/Physics | Can view all students, but can only **enter/edit marks and attendance for subjects they teach**. Cannot manage fees or create/delete staff accounts. |
| **Assistant Teacher** | Assistant | Configurable — typically attendance entry and basic data entry, no fee or grade-editing access unless you grant it. |
| **Parent** | Parents of enrolled students | Read-only. Can view **only their own child's** attendance, marks, progress graphs, report cards, and fee status. |
| *(Future)* **Student** | Enrolled students | Read-only self-view, once you're ready to give students direct logins. |

**Design principle:** Roles are stored as a field on each user's account, and every single database table with student data has a Row-Level Security policy attached — e.g. "a request tagged as role=parent may only SELECT rows where student.parent_id = the logged-in user's id." This means access control isn't just "hidden" in the UI (which a technically curious student or parent could bypass) — it's enforced by the database itself.

---

## 4. Database Schema

Below is the core relational schema. `snake_case` table/column names are used, which is Postgres/Prisma convention.

### 4.1 Core identity & roles

```
users
├── id (uuid, PK)                 -- comes from Supabase Auth
├── email
├── full_name
├── role (enum: admin, teacher, assistant, parent)
├── phone
├── is_active (boolean)
├── created_at
└── updated_at

staff_profiles
├── id (uuid, PK)
├── user_id (FK -> users.id)
├── subjects_taught (e.g. array or join table -> see subjects)
└── joined_date
```

### 4.2 Students & parents

```
students
├── id (uuid, PK)
├── full_name
├── class (enum: 8, 9, 10, 11, 12)
├── section (optional, e.g. "A")
├── date_of_birth
├── admission_date
├── school_name
├── contact_phone
├── address
├── photo_url (nullable, Supabase Storage path)
├── is_active (boolean)         -- for graduated/left students, keep history instead of deleting
├── created_at
└── updated_at

parent_student_links
├── id (uuid, PK)
├── parent_user_id (FK -> users.id)
├── student_id (FK -> students.id)
└── relationship (e.g. "Father", "Mother", "Guardian")
```

*A join table for parents is used (not a single `parent_id` column) because some students may have two registered parents/guardians, and some parents may have more than one child at the centre — both are common in real tuition centres.*

### 4.3 Subjects & classes

```
subjects
├── id (uuid, PK)
├── name (e.g. "Mathematics", "Physics", "Chemistry")
└── applicable_classes (e.g. [8,9,10,11,12])

student_subjects
├── id (uuid, PK)
├── student_id (FK -> students.id)
├── subject_id (FK -> subjects.id)
└── teacher_id (FK -> users.id)   -- who teaches this student this subject
```

### 4.4 Attendance

```
attendance_records
├── id (uuid, PK)
├── student_id (FK -> students.id)
├── date
├── status (enum: present, absent, late, excused)
├── subject_id (nullable FK)     -- null = whole-day attendance; set = per-class attendance
├── marked_by (FK -> users.id)
└── created_at
```

### 4.5 Marks — weekly tests, monthly tests, exams

Rather than three separate near-identical tables, one flexible table with an `assessment_type` keeps the schema clean and makes future assessment types (e.g. "quiz", "mock test") trivial to add:

```
assessments
├── id (uuid, PK)
├── subject_id (FK -> subjects.id)
├── class (enum: 8,9,10,11,12)
├── title (e.g. "Weekly Test 3 - Algebra", "Monthly Test - October", "Half-Yearly Exam")
├── assessment_type (enum: weekly_test, monthly_test, exam)
├── max_marks
├── date
├── chapter_topic (nullable text — enables future chapter-wise analysis)
├── created_by (FK -> users.id)
└── created_at

assessment_marks
├── id (uuid, PK)
├── assessment_id (FK -> assessments.id)
├── student_id (FK -> students.id)
├── marks_obtained
├── remarks (nullable)
├── entered_by (FK -> users.id)
└── updated_at
```

Percentages, averages, and progress trends are **computed values** — not stored — calculated as:
`(marks_obtained / max_marks) * 100`, then averaged across assessments per subject/period. This avoids stale/inconsistent stored numbers and is fast enough at this scale to compute on read.

### 4.6 At-Risk Students (Dashboard Widget)

This is the first thing you'll see when you log in each morning: a widget on the admin dashboard listing every student who trips one or more of four flags. Like percentages, this is **computed on read from existing data** — no new table is needed, just a query that runs across `attendance_records` and `assessment_marks` each time the dashboard loads.

**The four flags:**

| Flag | Rule | Data source |
|---|---|---|
| **Low attendance** | Attendance rate < 75%, calculated over a rolling window (default: current term/month — configurable) | `attendance_records`: present days ÷ total marked days |
| **Low average** | Average score across recent assessments < 40% | `assessment_marks` joined to `assessments`, weighted by `marks_obtained / max_marks` |
| **Consecutive absences** | 3 or more `absent` records in a row, in date order, with no `present`/`late`/`excused` between them | `attendance_records`, ordered by date per student |
| **Declining trend** | A student's scores are trending downward — e.g. the average of their last 3 assessments (per subject) is meaningfully lower than the 3 before that | `assessment_marks` over time, per subject, per student |

**How it's presented:**
- Each flagged student appears as a card/row showing their name, class, and **which flag(s)** triggered (a student can have more than one — e.g. low attendance *and* declining trend, which is often the more urgent combination).
- Sorted by severity — students matching more flags, or with more extreme values (e.g. 60% attendance vs. 74%), surface first.
- One click takes you into that student's full profile — attendance history, all marks, and contact details — so you can immediately decide whether to call the parent, have a word with the student, or flag it to the relevant subject teacher.
- Because it's computed live, it's always current — no manual refresh, no separate "at-risk list" to maintain.

**A note on thresholds:** the 75% / 40% / 3-in-a-row numbers above are sensible defaults, but they're stored as **configurable settings** (not hardcoded), so you can tune them later — e.g. tighten the average threshold to 50% for senior classes, or shorten the consecutive-absence trigger to 2 for exam-heavy periods — without needing a code change.

**Where this sits in the roadmap:** this depends on attendance and marks data already existing in the system, so it's a **Phase 2** feature (built right after attendance/marks entry and before/alongside the parent portal) rather than Phase 3 — see the updated roadmap below.

### 4.7 Fees

```
fee_structures
├── id (uuid, PK)
├── class (enum: 8,9,10,11,12)
├── amount
├── billing_cycle (enum: monthly, term, annual)
└── effective_from

fee_payments
├── id (uuid, PK)
├── student_id (FK -> students.id)
├── amount_due
├── amount_paid
├── due_date
├── paid_date (nullable)
├── status (enum: paid, partial, overdue, pending)
├── payment_method (nullable, e.g. cash, bank transfer)
├── recorded_by (FK -> users.id)
└── notes
```

### 4.7 Report cards (generated artifacts)

```
report_cards
├── id (uuid, PK)
├── student_id (FK -> students.id)
├── period_label (e.g. "October 2026 Monthly Report")
├── generated_pdf_url (Supabase Storage path)
├── generated_by (FK -> users.id)
└── generated_at
```

Storing a generated PDF snapshot (rather than only generating on-the-fly) means a report card a parent viewed in October still looks identical if you view it again in December, even if marks are corrected later — this is important for record-keeping integrity.

### 4.8 Tables reserved for future features (not built now, just planned for)

```
homework            -- assignment_title, subject_id, due_date, description, attachment_url
homework_submissions -- student_id, homework_id, status, submitted_at
notifications        -- user_id, title, message, is_read, created_at
messages              -- sender_id, recipient_id, body, sent_at
chapter_performance   -- rollup view, built from assessments.chapter_topic
ai_insights            -- student_id, insight_text, generated_at, model_version
```

Planning these now (without building them) means the *current* schema already has the hooks needed (e.g. `chapter_topic` on assessments) so you won't need disruptive schema migrations later.

---

## 5. Folder Structure (Next.js App Router)

```
zirna-rahbi-edutrack/
├── prisma/
│   ├── schema.prisma          -- single source of truth for DB schema
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── reset-password/
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   ├── students/
│   │   │   ├── staff/
│   │   │   ├── fees/
│   │   │   └── settings/
│   │   ├── (teacher)/
│   │   │   ├── attendance/
│   │   │   ├── marks-entry/
│   │   │   └── my-students/
│   │   ├── (parent)/
│   │   │   ├── my-child/
│   │   │   ├── progress/
│   │   │   └── report-cards/
│   │   └── api/
│   │       ├── students/
│   │       ├── attendance/
│   │       ├── assessments/
│   │       ├── fees/
│   │       └── report-cards/
│   ├── components/
│   │   ├── ui/                -- shadcn components
│   │   ├── charts/
│   │   └── report-card/
│   ├── lib/
│   │   ├── db.ts              -- Prisma client
│   │   ├── auth.ts            -- session/role helpers
│   │   └── validations/       -- Zod schemas for input validation
│   └── types/
├── public/
├── .env.local                 -- secrets, never committed
└── package.json
```

The **route groups** — `(admin)`, `(teacher)`, `(parent)` — map directly to your role model, so it's immediately visible in the codebase which pages belong to which role, and you can apply role-checking middleware per group.

---

## 6. Authentication & Security Design

1. **Login:** Email + password via Supabase Auth. Supabase handles password hashing (bcrypt) and secure session tokens — you never touch raw passwords.
2. **Staff and parent accounts:** Created by admin (you) through the app, not self-registered — prevents anyone from signing up and claiming to be a parent of a student who isn't theirs. New accounts get a one-time password-set link generated server-side (via the Supabase service-role key), rather than a temporary password being typed or transmitted anywhere — see `src/app/api/users/route.ts`.
3. **The real security boundary — application-level authorization:** Every page and API route calls `requireRole()`/`getCurrentUser()` (`src/lib/auth.ts`), which reads the authoritative role from our own `users` table, and every database query is written with explicit filters (e.g. a parent's queries are always scoped through `parent_student_links`, never a blanket "get all students"). **This — not Row-Level Security — is what actually protects data in this app**, because Prisma connects to Supabase using the `postgres` role, which has the `BYPASSRLS` attribute and therefore ignores RLS policies entirely. This is a common and important gotcha in Next.js + Prisma + Supabase stacks worth understanding clearly rather than assuming RLS alone is doing the job.
4. **Row-Level Security (RLS) — defense in depth:** `supabase/sql/001_rls_policies.sql` still enables RLS and writes the full policy set (parents can only `SELECT` their own child's rows in `students`, `assessment_marks`, `attendance_records`, `fee_payments`, etc.; teachers can only write marks/attendance for subjects they're linked to via `student_subjects`). These policies protect anything that talks to Supabase *directly* rather than through our Next.js backend — Supabase's auto-generated REST/GraphQL API, Realtime subscriptions, or any future client-side `supabase-js` calls (a likely path for a future feature like live notifications). Keeping them correct now avoids retrofitting security later.
5. **Role trust for fast redirects:** The `proxy.ts` file (Next.js's request-level gatekeeper) reads role from `app_metadata` only — never `user_metadata`, which a signed-in user can edit on themselves via the client SDK, and which would otherwise let someone grant themselves `ADMIN`. This check is just an optimistic UX redirect; point 3 above is the actual enforcement.
6. **HTTPS everywhere:** Enforced automatically by Vercel — no setup needed.
7. **Environment variables:** Database URLs and API keys stored in `.env.local`, never committed to GitHub. The service-role key in particular is never exposed to the browser — see `src/lib/supabase/admin.ts`.
8. **Input validation:** All form submissions validated server-side with Zod (not just client-side) before touching the database.
9. **Audit trail:** `entered_by`, `marked_by`, `recorded_by`, `generated_by` fields on every sensitive table — so you can always answer "who entered this mark / recorded this payment."
10. **Rate limiting on login:** To prevent brute-force password guessing (Supabase Auth supports this natively).
11. **Backups:** Supabase free tier includes automatic daily backups; you can also export data manually at any time.

---

## 7. Scalability Notes

At 16–50 students, this system will be nowhere near any technical limit — the design choices above are about **data integrity and security**, not raw performance. That said, the architecture scales cleanly to several hundred students without redesign, because:
- Postgres comfortably handles millions of rows; your entire dataset at 50 students over several years is a rounding error in comparison.
- Next.js + Vercel auto-scale server load.
- The `assessments` + `assessment_marks` design (rather than one row per test type) means adding new assessment types later requires zero schema changes.

---

## 8. Development Roadmap

### Phase 1 — Foundation & MVP (core value, usable day one)
- Project setup: Next.js + Supabase + Prisma wired together, deployed to Vercel.
- Auth system: login, roles, admin can create staff/parent accounts.
- Student CRUD: add/edit/view students, assign subjects.
- Attendance entry (daily, by subject).
- Marks entry: weekly tests, monthly tests, exams (using the unified `assessments` model).
- Auto-calculated percentages/averages per subject and overall.

### Phase 2 — Admin Dashboard, Parent Experience & Reporting
- **At-Risk Students widget** (see §4.6): the morning dashboard you land on after login — flags low attendance, low averages, 3+ consecutive absences, and declining trends, sorted by severity.
- Parent portal: secure login, view-only access to their child.
- Progress graphs (Recharts): trend of marks over time, per subject.
- Printable/downloadable PDF report cards.
- Fee tracking: record payments, view due/paid status (admin-entry, parent read-only view).

### Phase 3 — Polish & Operational Tools
- Configurable thresholds settings screen (tune the At-Risk flag numbers without a code change).
- Bulk actions (e.g. mark whole class present, enter marks for a whole class at once).
- Data export (CSV) for your own backups/reporting.
- Class/section filtering and search across students.

### Phase 4 — Future Features (schema already supports these)
- Homework management (assign, track submission).
- Notifications (fee due reminders, low attendance alerts) via Resend email.
- Parent-teacher messaging.
- Leaderboards (opt-in, carefully designed to motivate without discouraging weaker students).
- Chapter-wise performance analysis (using the `chapter_topic` field already in the schema).
- AI-powered performance insights (e.g. "this student's Physics scores dipped after Chapter 4 — may need revision focus there") — built later using the Anthropic API once enough historical data exists to make insights meaningful.

**Recommendation:** Build and start *using* Phase 1 + 2 with your actual 16 students before adding Phase 3/4 features. Real usage will surface what you actually need next far better than planning it all upfront.

---

## 9. Confirmed Decisions

1. **Stack:** Next.js + Supabase + Prisma + Vercel, all free tier. ✅ Confirmed.
2. **Classes:** No sections — one group per class level, and the range is **Class 8 to Class 12** (five year groups). Schema updated throughout this document accordingly. ✅ Confirmed.
3. **Fee billing cycle:** Assumed **monthly** as the default (most common for tuition centres, and the `billing_cycle` field on `fee_structures` supports `term`/`annual` too if some students are billed differently). Flag this if it's wrong.
4. **Report card branding:** Assumed **plain styling for Phase 1**, with your logo/letterhead added once ready. Flag this if you'd rather wait to build report cards until branding is set.

Next step: scaffolding the actual project — Phase 1, step one: repo setup + database schema implementation — step by step, as you asked, not all at once.
