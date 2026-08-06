# Zirna Rahbi EduTrack

Student performance management system for **Zirna Rahbi Study Centre**.

This README is written for someone setting this up for the first time — no assumed
experience with Next.js, Supabase, or Prisma. Follow the numbered steps in order.

Full architecture, database schema rationale, and roadmap: [`docs/architecture.md`](./docs/architecture.md)

---

## What's built and working right now

Everything below is real, working code — not a mockup:

- **Login & roles** — Admin, Teacher, Assistant, Parent, each seeing only what they should
- **Students** — add/edit, assign subjects to teachers, class/section filtering & search
- **Staff & parent accounts** — created from inside the app, no manual database work needed
- **Attendance** — daily or per-subject, with "mark all present" and "copy previous day" shortcuts
- **Marks** — weekly tests, monthly tests, exams, with per-class marks-entry grids
- **At-Risk Students dashboard** — flags low attendance, low averages, consecutive absences,
  and declining trends, with all thresholds editable on `/settings`
- **Parent portal** — each parent sees only their own child: profile, attendance, progress
  graphs, fees, and report cards
- **Printable report cards** — real PDFs with your logo, generated on demand
- **Fee tracking** — per-class fee structures, recording payments, live overdue status
- **Bulk actions** — bulk-assign a subject to a whole class, bulk-create a fee due for a
  whole class
- **CSV export** — students, attendance, marks, and fee payments, for backups/reporting

**Not yet built (Phase 4, intentionally deferred):** homework management, notifications,
parent-teacher messaging, leaderboards, chapter-wise analysis, AI insights. See
`docs/architecture.md` for that roadmap — the recommendation has always been to use the app
for real with your actual students before adding these.

---

## What you need before starting

1. **Node.js** version 20 or later. Check with `node -v` in a terminal. If you don't have
   it, install from [nodejs.org](https://nodejs.org) (choose the LTS version).
2. **A free [Supabase](https://supabase.com) account** — this is your database and login
   system. No credit card needed for the free tier, which comfortably covers 50 students.
3. **A code editor** — [VS Code](https://code.visualstudio.com) is free and works well.
4. **A terminal** — Terminal.app on Mac, or Command Prompt/PowerShell/Git Bash on Windows.

---

## Step-by-step setup

### 1. Unzip the project

Unzip `zirna-rahbi-edutrack.zip` anywhere on your computer (e.g. your Desktop). Open a
terminal and move into the folder:

```bash
cd path/to/zirna-rahbi-edutrack
```

(On Mac, you can type `cd ` — with a trailing space — then drag the folder from Finder into
the terminal window, then press Enter.)

### 2. Install dependencies

```bash
npm install
```

This downloads every package the project needs (Next.js, React, Prisma, etc.) into a
`node_modules` folder. It also automatically prepares Prisma's database toolkit — that's
normal, no separate step needed. This can take a minute or two.

### 3. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Pick any name (e.g. "zirna-rahbi-edutrack") and a strong database password — **save this
   password somewhere**, you'll need it in a moment.
3. Choose a region close to you (e.g. Mumbai/Singapore for Northeast India) and click
   **Create new project**. Wait a minute or two for it to finish setting up.

### 4. Get your Supabase credentials

Once your project is ready:

1. Click **Project Settings** (gear icon) → **API**.
   - Copy the **Project URL**.
   - Copy the **anon / public** key.
   - Copy the **service_role** key (click "reveal" first — keep this one especially private).
2. Click **Project Settings** → **Database** → **Connection string**.
   - Copy the **Transaction pooler** URL (port `6543`).
   - Copy the **Direct connection** URL (port `5432`).
   - Both contain a `[YOUR-PASSWORD]` placeholder — replace it with the database password
     you set in Step 3.

### 5. Configure environment variables

In the project folder, make a copy of the example env file:

```bash
cp .env.example .env.local
```

Open `.env.local` in your code editor and paste in the 5 values from Step 4:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL="postgresql://postgres:[your-password]@[host]:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[your-password]@[host]:5432/postgres"
```

**Never commit `.env.local` to any public place** — it contains secrets. It's already
excluded via `.gitignore`, so this is automatic if you use Git/GitHub.

### 6. Create the database tables

```bash
npx prisma migrate dev --name init
```

This reads `prisma/schema.prisma` and creates every table in your Supabase database
(students, attendance, marks, fees, everything). You'll see a list of created tables when
it finishes.

### 7. Seed the subjects

```bash
npm run db:seed
```

Creates Mathematics, Physics, and Chemistry for Classes 8–12 (matching what the centre
teaches today). Edit `prisma/seed.ts` and re-run this command if the subject list changes.

### 8. Turn on Row-Level Security

1. In Supabase, click **SQL Editor** in the left sidebar → **New query**.
2. Open `supabase/sql/001_rls_policies.sql` from this project in your code editor, copy
   the whole file, paste it into the Supabase SQL Editor, and click **Run**.

(There's a comment at the top of that file explaining exactly what this does and doesn't
protect — worth a read, but not required to proceed.)

### 9. Create your first admin account

Nobody can log in yet, so the very first account has to be created by hand, once:

1. In Supabase: **Authentication** → **Users** → **Add user**. Enter your email and choose
   a password. Click **Create user**.
2. Still in Supabase, go to **SQL Editor** → **New query**, and run this (replace the email
   with the one you just used):
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role": "ADMIN"}'::jsonb
   where email = 'you@example.com';
   ```
3. In the same SQL Editor, find your new user's ID:
   ```sql
   select id from auth.users where email = 'you@example.com';
   ```
   Copy the id it returns (a long string of letters/numbers), then run:
   ```sql
   insert into public.users (id, email, full_name, role)
   values ('paste-the-id-here', 'you@example.com', 'Your Name', 'ADMIN');
   ```

From now on, every other account (teachers, the assistant, parents) is created from inside
the app itself, on the `/staff` page or from each student's page — this manual step is only
ever needed once.

### 10. Run the app

```bash
npm run dev
```

Open your browser to **http://localhost:3000**, and log in with the email/password from
Step 9. You should land on the admin dashboard.

---

## Is it ready to use?

**Yes, for real day-to-day use with your actual students**, once you complete the setup
above. Every feature listed in "What's built and working right now" is fully functional,
not a demo. A sensible order to start populating it:

1. Log in as admin, go to `/staff` and create accounts for your Chemistry teacher and
   assistant.
2. Go to `/students` and add your ~16 students (or use the bulk subject-assignment tool
   after adding them).
3. From each student's page, link a parent account (or do it in bulk once you're
   comfortable with the flow).
4. Start marking attendance and entering marks day to day — the At-Risk dashboard and
   progress graphs need real data before they show anything meaningful.
5. Set up your fee structures per class on `/fees`.

## Deploying so it's accessible outside your own computer

Right now, `npm run dev` only runs on your own machine. To make it available as a real
website your teachers and parents can log into:

1. Push this project to a **GitHub** repository (free, private repos included).
2. Create a free account on **[Vercel](https://vercel.com)**, click **New Project**, and
   import that GitHub repo.
3. In Vercel's project settings, add the same 5 environment variables from your
   `.env.local` file.
4. Click **Deploy**. Vercel gives you a live URL (e.g. `zirna-rahbi-edutrack.vercel.app`)
   within a couple of minutes.

Your Supabase database is already live on the internet from Step 3 — no separate database
deployment needed.

---

## Project structure

```
prisma/schema.prisma        Database schema (source of truth for every table)
prisma/seed.ts               Seeds the 3 subjects
supabase/sql/                Row-Level Security policies (run once, see Step 8)
src/app/(auth)/               Login page
src/app/(admin)/              Admin pages: dashboard, students, staff, fees, settings, export
src/app/(teacher)/            Teacher/assistant pages: attendance, marks entry, my students
src/app/(parent)/              Parent pages: their child's profile, progress, fees, report cards
src/app/api/                    All backend endpoints
src/components/                  Shared UI: forms, charts, the site header
src/lib/                          Business logic: auth, at-risk detection, fee status, CSV, etc.
src/proxy.ts                       Route protection by role (Next.js 16 renamed this from middleware.ts)
docs/architecture.md                 Full design document: schema, security model, roadmap
```

If anything is unclear, `docs/architecture.md` explains the reasoning behind every major
decision in this project, not just what the code does.
