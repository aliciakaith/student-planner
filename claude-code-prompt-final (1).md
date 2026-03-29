# Claude Code Prompt: Final Year University Planner
# — Complete Build Specification

---

## Project Overview

Build **UniTrack** — a full-stack web application for final year university students
that combines Canvas LMS integration, AI-powered study summaries, and a graduate
job tracker with AI-powered job search. Students create an account, connect their
Canvas, and get a single place to manage assignments, deadlines, and their entire
job application pipeline.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| Auth | Supabase Auth (email/password + Google OAuth) |
| AI | Anthropic Claude API `claude-sonnet-4-20250514` |
| Canvas | Canvas LMS REST API (personal token, proxied) |
| State | Zustand |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Package Manager | npm |

---

## Initial Setup Commands

```bash
# 1. Create project
npx create-next-app@latest uni-track --typescript --tailwind --app --src-dir=false

cd uni-track

# 2. Install all dependencies
npm install @anthropic-ai/sdk @supabase/supabase-js @supabase/ssr \
  @prisma/client prisma @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  zustand date-fns lucide-react zod react-hook-form @hookform/resolvers \
  next-themes sonner

# 3. shadcn/ui
npx shadcn@latest init
npx shadcn@latest add card badge button tabs dialog sheet toast \
  progress skeleton avatar dropdown-menu input label select \
  separator command popover calendar

# 4. Prisma init
npx prisma init
```

---

## Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (Supabase connection string — use the pooler URL for Prisma)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Canvas token encryption (generate with: openssl rand -base64 32)
CANVAS_TOKEN_ENCRYPTION_KEY=your_32_byte_base64_key
```

---

## Database Schema (Prisma)

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  fullName        String?
  avatarUrl       String?
  university      String?
  degree          String?         // e.g. "Bachelor of Computer Science"
  fieldOfStudy    String?         // e.g. "Computer Science"
  graduationYear  Int?
  workRights      WorkRights      @default(CITIZEN)
  canvasUrl       String?         // e.g. "https://canvas.sydney.edu.au"
  canvasTokenEnc  String?         // AES-256 encrypted Canvas API token
  preferences     Json?           // { workDays, partTimeDay, notifyEmail, etc. }
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  jobApplications JobApplication[]
  aiSummaries     AISummary[]
  notifications   Notification[]
  jobSearches     JobSearch[]
  canvasCache     CanvasCache[]

  @@map("users")
}

enum WorkRights {
  CITIZEN
  PERMANENT_RESIDENT
  STUDENT_VISA
  WORKING_VISA
  OTHER
}

model JobApplication {
  id              String            @id @default(uuid())
  userId          String
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Role details
  company         String
  roleTitle       String
  location        String?
  salary          String?
  jobUrl          String?
  source          JobSource         @default(MANUAL)
  industry        String?
  roleType        RoleType          @default(GRADUATE_PROGRAM)
  description     String?           // short summary from AI search or manual entry

  // Application tracking
  status          ApplicationStatus @default(BOOKMARKED)
  applicationDeadline DateTime?
  appliedAt       DateTime?
  notes           String?           // freeform notes
  aiTips          String?           // cached AI application tips

  // Metadata
  savedFromSearch String?           // job search ID it came from
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@map("job_applications")
}

enum JobSource {
  MANUAL
  AI_SEARCH
  BROWSER_EXTENSION
  SEEK
  LINKEDIN
  PROSPLE
  GRAD_AUSTRALIA
  GRAD_CONNECTION
  OTHER
}

enum RoleType {
  GRADUATE_PROGRAM
  INTERNSHIP
  PART_TIME
  CASUAL
  CONTRACT
  FULL_TIME
}

enum ApplicationStatus {
  BOOKMARKED
  APPLYING
  APPLIED
  INTERVIEW
  OFFER
  REJECTED
}

model AISummary {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        SummaryType
  content     Json        // { weekSummary, priorityTasks[], studyTips[], dailyPlan{}, jobActionItems[] }
  generatedAt DateTime    @default(now())

  @@map("ai_summaries")
}

enum SummaryType {
  WEEKLY
  MONTHLY
}

model CanvasCache {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  dataType    String   // "assignments" | "courses" | "events" | "todos"
  courseId    String?
  data        Json
  fetchedAt   DateTime @default(now())
  expiresAt   DateTime

  @@unique([userId, dataType, courseId])
  @@map("canvas_cache")
}

model JobSearch {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  query       Json     // { degree, roleType, industry, location, workRights, keywords }
  results     Json     // array of raw job results from AI search
  resultCount Int      @default(0)
  searchedAt  DateTime @default(now())

  @@map("job_searches")
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  read      Boolean          @default(false)
  link      String?
  createdAt DateTime         @default(now())

  @@map("notifications")
}

enum NotificationType {
  ASSIGNMENT_DUE
  JOB_DEADLINE
  NEW_JOB_FOUND
  AI_SUMMARY_READY
  APPLICATION_REMINDER
}
```

After creating the schema, run:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Project Structure

```
/app
  /                         → Landing page (sign up / sign in CTA)
  /(auth)
    /login                  → Login page
    /signup                 → Sign up page
    /onboarding             → New user setup (degree, uni, work rights)
  /(app)                    → Protected routes (require auth)
    /dashboard              → Main dashboard
    /assignments            → Full Canvas assignment list
    /jobs                   → Graduate job tracker + AI search
    /calendar               → Unified calendar view
    /settings               → Account, Canvas token, preferences
  /api
    /auth                   → Supabase auth helpers
    /canvas/[...path]       → Canvas API proxy (avoids CORS)
    /ai/summary             → Generate weekly/monthly AI summary (streaming)
    /ai/job-tips            → Get AI tips for a specific job application
    /ai/job-search          → AI-powered job search using web search tool
    /jobs/extension         → Browser extension webhook endpoint
    /notifications          → Mark notifications read

/components
  /ui                       → shadcn/ui base components
  /layout
    Header.tsx
    Sidebar.tsx
    MobileNav.tsx
  /dashboard
    PriorityPanel.tsx       → AI priority tasks for today
    UrgentDeadlines.tsx     → Red/amber assignments + job deadlines
    WeeklySummaryCard.tsx
    StatsRow.tsx
  /assignments
    AssignmentCard.tsx
    AssignmentFilters.tsx
    CountdownBadge.tsx
    CourseFilter.tsx
  /jobs
    JobKanban.tsx           → Drag-and-drop Kanban board
    JobCard.tsx             → Individual application card
    JobSearchPanel.tsx      → AI search UI with filters
    JobSearchResults.tsx    → Results list with one-click save
    ManualJobForm.tsx       → Fallback manual entry form
    ApplicationTipsModal.tsx → AI tips for a specific role
  /ai
    SummaryPanel.tsx        → Streaming AI summary display
    StreamingText.tsx       → Handles SSE/streaming text rendering
  /notifications
    NotificationBell.tsx
    NotificationList.tsx

/lib
  /supabase
    client.ts               → Browser Supabase client
    server.ts               → Server Supabase client (for API routes)
    middleware.ts            → Auth middleware helper
  /prisma.ts                → Prisma client singleton
  /canvas.ts                → Canvas API client (fetch wrapper)
  /canvas-crypto.ts         → AES-256 encrypt/decrypt Canvas token
  /anthropic.ts             → Anthropic client + streaming helpers
  /job-search.ts            → AI job search prompt builder
  /utils.ts                 → Date helpers, cn(), formatters

/hooks
  /useUser.ts               → Current user + profile
  /useCanvas.ts             → Canvas data with SWR/polling
  /useJobs.ts               → Job applications CRUD
  /useNotifications.ts      → Notifications with unread count
  /useAISummary.ts          → Summary fetch + regenerate

/types
  /canvas.ts                → Canvas API response types
  /jobs.ts                  → Job search result types
  /ai.ts                    → AI response types

/middleware.ts               → Supabase auth session middleware

/browser-extension/          → Chrome/Safari extension (separate folder)
  manifest.json
  content.js
  popup.html
  popup.js
  background.js
  icon-16.png
  icon-48.png
  icon-128.png
```

---

## Feature Specifications

---

### 1. Authentication (Supabase Auth)

**Pages:** `/login`, `/signup`, `/onboarding`

**Signup flow:**
1. Email + password signup via Supabase Auth
2. Google OAuth option ("Continue with Google")
3. On first login, redirect to `/onboarding`

**Onboarding (collect profile data, save to `users` table):**
- Full name
- University (dropdown: USyd, UNSW, UQ, Monash, Melbourne, ANU, UWA, other)
- Degree / field of study (free text)
- Graduation year (2025 / 2026)
- Work rights (Citizen / PR / Student Visa / Working Visa)
- Canvas instance URL (e.g. `https://canvas.sydney.edu.au`)
- Canvas personal API token (encrypted before saving to DB — see Canvas Token Security)
- Preferences: do they work part-time? which days? (used in AI summaries)

**Session handling:**
- Use Supabase SSR helpers for server components
- `middleware.ts` — protect all `/(app)` routes, redirect to `/login` if no session
- Store session in cookies (Supabase SSR handles this)

**Canvas Token Security:**
- Never store the raw Canvas token in the DB
- Encrypt with AES-256-GCM using `CANVAS_TOKEN_ENCRYPTION_KEY` before saving to `canvasTokenEnc`
- Decrypt server-side only in API routes — never expose decrypted token to the client
- Implement in `lib/canvas-crypto.ts`

---

### 2. Canvas LMS Integration

**Canvas API Proxy** (`/api/canvas/[...path]`):
- Forwards requests to the student's Canvas instance URL
- Decrypts their Canvas token server-side and adds it to the Authorization header
- Returns the Canvas API response to the client
- This avoids CORS issues — the browser never calls Canvas directly

**Data fetched:**
```
GET /api/v1/courses                          → active enrolled courses
GET /api/v1/courses/:id/assignments          → assignments with due dates + submission status
GET /api/v1/users/self/upcoming_events       → calendar events
GET /api/v1/users/self/todo_items            → unsubmitted items
```

**Caching strategy (CanvasCache table):**
- Cache Canvas responses in `canvas_cache` table with a 15-minute expiry
- On fetch: check cache first; if expired or missing, fetch from Canvas and update cache
- Manual "Refresh" button bypasses cache and forces a fresh fetch
- Cache is per-user and per-dataType

**Assignment display:**
- Sort by due date ascending (soonest first)
- Urgency colour coding:
  - 🔴 Red: due in < 48 hours
  - 🟠 Amber: due in < 7 days
  - 🟢 Green: due in > 7 days
  - ⚫ Grey: already submitted / past due
- Each card shows: assignment name, course name (colour-coded dot), due date, points worth, submission status
- Countdown timer ("Due in 14h 23m") on red/amber items
- "Mark as done" toggle (stored in user preferences JSON — doesn't change Canvas)
- Filter bar: by course, by status (submitted / pending), by date range

---

### 3. AI-Powered Weekly & Monthly Summaries

**Endpoint:** `POST /api/ai/summary` — streaming SSE response

**Request body:**
```ts
{
  type: "weekly" | "monthly",
  assignments: CanvasAssignment[],
  events: CanvasEvent[],
  jobDeadlines: { company: string, role: string, deadline: string }[],
  userPreferences: { workDays?: string[], partTimeDay?: string }
}
```

**System prompt for weekly summary:**
```
You are an academic coach for a final year Australian university student.
You have access to their Canvas assignments, upcoming events, and job application deadlines.
Return a JSON object with exactly this shape:
{
  "weekSummary": "2-3 sentence plain English overview of the week",
  "priorityTasks": [{ "task": string, "reason": string, "urgency": "high"|"medium"|"low" }],
  "dailyPlan": { "Mon": string, "Tue": string, "Wed": string, "Thu": string, "Fri": string, "Sat": string, "Sun": string },
  "studyTips": [string],
  "jobActionItems": [string],
  "encouragement": string
}
Be specific — name the actual assignments and companies. Be concise and practical.
```

**Streaming UI:**
- Use Anthropic SDK streaming in the API route
- Stream the response as SSE to the client
- `StreamingText.tsx` component renders text as it arrives, character by character
- Show a pulsing cursor while streaming
- "Regenerate" button — saves new summary to `ai_summaries` table

**Storage:**
- Save generated summaries to `ai_summaries` table
- Load the most recent summary on page load (no re-generation needed)
- Weekly summary auto-generates if the stored one is > 7 days old
- Monthly summary auto-generates if stored one is > 30 days old

**Monthly summary** — same endpoint with `type: "monthly"`:
- Broader view: "Week 3 of October has 4 assignments due — plan ahead"
- Job application pipeline overview
- Completion percentage: "You've submitted 3 of your 7 target applications"
- Semester milestone check-ins

---

### 4. Graduate Job Tracker

This is a three-layer system. All three layers save jobs to the same
`job_applications` table in Supabase. The Kanban board shows all of them.

---

#### Layer 1 — AI-Powered Job Search (primary feature)

**Endpoint:** `POST /api/ai/job-search` — streaming

This endpoint uses the Anthropic Claude API **with the web_search tool enabled**
to search the live web for graduate roles matching the student's profile.

**API route implementation:**
```ts
// /api/ai/job-search/route.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const { filters } = await req.json();
  // filters: { degree, fieldOfStudy, roleType, industry, location, workRights, keywords }

  const searchPrompt = buildJobSearchPrompt(filters);

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system: `You are a graduate job search assistant for Australian university students.
Search the web for current graduate job openings matching the student's criteria.
Focus on: seek.com.au, gradaustralia.com.au, prosple.com, gradconnection.com.au, linkedin.com/jobs, and company career pages.
After searching, return results as a JSON array with this exact shape:
[{
  "company": string,
  "roleTitle": string,
  "location": string,
  "roleType": "GRADUATE_PROGRAM"|"INTERNSHIP"|"PART_TIME"|"CASUAL"|"CONTRACT"|"FULL_TIME",
  "industry": string,
  "deadline": string | null,   // ISO date string if found, null if not listed
  "jobUrl": string,
  "source": string,            // "Seek" | "LinkedIn" | "GradAustralia" | "Prosple" | etc.
  "salary": string | null,
  "description": string        // 1-2 sentence summary of the role
}]
Return ONLY the JSON array. No preamble, no explanation. If no results found, return [].
Aim for 10-20 relevant results.`,
    messages: [{ role: "user", content: searchPrompt }],
  });

  // Return as streaming SSE
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

function buildJobSearchPrompt(filters: JobSearchFilters): string {
  return `Search for graduate job openings in Australia matching these criteria:
- Degree/Field: ${filters.fieldOfStudy || filters.degree}
- Role type: ${filters.roleType}
- Industry: ${filters.industry || "any"}
- Location: ${filters.location}
- Work rights required: ${filters.workRights}
- Keywords: ${filters.keywords || "none"}

Search seek.com.au, gradaustralia.com.au, prosple.com, gradconnection.com.au, and relevant company career pages.
Prioritise roles closing within the next 60 days. Include roles open to ${filters.workRights} holders.`;
}
```

**Search filters UI** (`JobSearchPanel.tsx`):
```
┌─────────────────────────────────────────────────────────┐
│  Find Graduate Roles                           [Search]  │
├─────────────────────────────────────────────────────────┤
│  Field of study    [Computer Science         ▾]         │
│  Role type         [Graduate Program  ▾]                │
│  Industry          [Technology        ▾]                │
│  Location          [Sydney            ▾]                │
│  Keywords          [e.g. software engineer...  ]        │
│  Work rights       [Australian Citizen ▾]               │
│                                                         │
│  💡 Filters pre-filled from your profile                │
└─────────────────────────────────────────────────────────┘
```

- Filters are pre-filled from the user's profile (degree, work rights, location)
- Student can override any filter per-search
- "Search" triggers the AI web search
- Results stream in as cards below the filter panel

**Search results display** (`JobSearchResults.tsx`):
- Each result card shows: company, role title, location, deadline countdown, source badge (Seek / LinkedIn etc.), salary if available
- "+ Save to Tracker" button → creates a `job_application` record with `source: AI_SEARCH`
- "View listing" → opens job URL in new tab
- Saved jobs show a checkmark (can't double-save)
- Save the search to `job_searches` table for history

**Scheduled search:**
- User can enable "Weekly auto-search" in settings
- Uses a Supabase Edge Function (cron) that runs Monday 7am AEST
- Re-runs their saved filter set, finds new results, creates `NEW_JOB_FOUND` notifications
- New results since last search are highlighted with a "New" badge

---

#### Layer 2 — Browser Extension ("Save to Tracker")

Build a Chrome/Safari extension in `/browser-extension/`.

**Supported sites (content script activates on):**
- `seek.com.au`
- `linkedin.com/jobs`
- `gradaustralia.com.au`
- `prosple.com`
- `gradconnection.com.au`
- `*.careers.*` and `*/careers/*` (general company career pages)

**`manifest.json`:**
```json
{
  "manifest_version": 3,
  "name": "UniTrack — Save to Job Tracker",
  "version": "1.0.0",
  "description": "Save graduate job listings to your UniTrack dashboard in one click.",
  "permissions": ["activeTab", "storage"],
  "host_permissions": [
    "https://seek.com.au/*",
    "https://www.seek.com.au/*",
    "https://linkedin.com/*",
    "https://www.linkedin.com/*",
    "https://gradaustralia.com.au/*",
    "https://prosple.com/*",
    "https://gradconnection.com.au/*"
  ],
  "content_scripts": [{
    "matches": [
      "https://www.seek.com.au/job/*",
      "https://www.linkedin.com/jobs/view/*",
      "https://gradaustralia.com.au/graduate-jobs/*",
      "https://prosple.com/graduate-employers/*",
      "https://gradconnection.com.au/graduate-jobs/*"
    ],
    "js": ["content.js"]
  }],
  "action": { "default_popup": "popup.html" },
  "icons": { "16": "icon-16.png", "48": "icon-48.png", "128": "icon-128.png" }
}
```

**`content.js`** — injected on job listing pages:
```js
// Extract job details from the current page
function extractJobDetails() {
  const url = window.location.href;
  let details = { jobUrl: url, source: detectSource(url) };

  if (url.includes("seek.com.au")) {
    details.roleTitle = document.querySelector('[data-automation="job-detail-title"]')?.textContent?.trim();
    details.company = document.querySelector('[data-automation="advertiser-name"]')?.textContent?.trim();
    details.location = document.querySelector('[data-automation="job-detail-location"]')?.textContent?.trim();
    details.deadline = null; // Seek rarely shows closing dates
  } else if (url.includes("linkedin.com/jobs")) {
    details.roleTitle = document.querySelector(".job-details-jobs-unified-top-card__job-title")?.textContent?.trim();
    details.company = document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim();
    details.location = document.querySelector(".job-details-jobs-unified-top-card__primary-description-container")?.textContent?.trim();
  } else if (url.includes("gradaustralia.com.au")) {
    details.roleTitle = document.querySelector("h1")?.textContent?.trim();
    details.company = document.querySelector(".employer-name")?.textContent?.trim();
    details.deadline = document.querySelector(".closing-date")?.textContent?.replace("Closing:", "").trim();
  }
  // Add more site-specific selectors for Prosple, GradConnection

  return details;
}

function detectSource(url) {
  if (url.includes("seek.com.au")) return "SEEK";
  if (url.includes("linkedin.com")) return "LINKEDIN";
  if (url.includes("gradaustralia")) return "GRAD_AUSTRALIA";
  if (url.includes("prosple")) return "PROSPLE";
  if (url.includes("gradconnection")) return "GRAD_CONNECTION";
  return "OTHER";
}

// Inject a floating "Save to UniTrack" button
function injectSaveButton() {
  if (document.getElementById("unitrack-save-btn")) return;

  const btn = document.createElement("button");
  btn.id = "unitrack-save-btn";
  btn.innerHTML = "📌 Save to UniTrack";
  btn.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
    background: #4F46E5; color: white; border: none; border-radius: 8px;
    padding: 10px 16px; font-size: 14px; font-weight: 500;
    cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background 0.2s;
  `;
  btn.addEventListener("mouseenter", () => btn.style.background = "#4338CA");
  btn.addEventListener("mouseleave", () => btn.style.background = "#4F46E5");

  btn.addEventListener("click", async () => {
    const details = extractJobDetails();
    const { apiUrl, authToken } = await chrome.storage.local.get(["apiUrl", "authToken"]);

    if (!authToken) {
      btn.innerHTML = "⚠️ Log in to UniTrack first";
      return;
    }

    btn.innerHTML = "Saving...";
    btn.disabled = true;

    try {
      const res = await fetch(`${apiUrl || "https://your-app.vercel.app"}/api/jobs/extension`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify(details),
      });

      if (res.ok) {
        btn.innerHTML = "✅ Saved to UniTrack!";
        btn.style.background = "#059669";
        setTimeout(() => {
          btn.innerHTML = "📌 Save to UniTrack";
          btn.style.background = "#4F46E5";
          btn.disabled = false;
        }, 3000);
      } else {
        throw new Error("Failed");
      }
    } catch {
      btn.innerHTML = "❌ Save failed — try again";
      btn.disabled = false;
    }
  });

  document.body.appendChild(btn);
}

injectSaveButton();
```

**`popup.html`** — extension popup (shown when clicking the extension icon):
- Shows "Connected as [user email]" if logged in
- "Open UniTrack" link
- Login form if not connected (enter their UniTrack API URL + generates an extension token)
- Token is saved to `chrome.storage.local`

**`/api/jobs/extension` endpoint:**
```ts
// Receives job data from the browser extension
// Validates the bearer token against the user's session
// Creates a job_application record with source: BROWSER_EXTENSION
// Returns { success: true, jobId }
```

**Extension token generation:**
- In UniTrack settings → "Browser Extension" section
- Generate a long-lived extension token (stored in user preferences JSON)
- User copies the token into the popup — no OAuth needed for simplicity
- Token is validated server-side on every extension save request

---

#### Layer 3 — Manual Job Entry (always available fallback)

**`ManualJobForm.tsx`** — accessible from a "+ Add Role" button in the Jobs tab:

Fields:
- Company name (required)
- Role title (required)
- Job URL (optional but recommended)
- Application deadline (date picker)
- Location
- Role type (Graduate Program / Internship / Part Time / Casual / Contract)
- Industry
- Salary (optional)
- Notes (textarea)
- Initial status (defaults to Bookmarked)

On submit: creates `job_application` record with `source: MANUAL`.

---

### 5. Job Tracker Kanban Board

**Columns:** Bookmarked → Applying → Applied → Interview → Offer | Rejected

**Implementation:**
- Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop between columns
- Each column shows job count badge
- Cards are sorted by deadline (soonest first) within each column

**Job card** (`JobCard.tsx`):
```
┌─────────────────────────────────────────────────┐
│  [favicon] Atlassian                  [Seek]    │
│  Graduate Software Engineer                      │
│  📍 Sydney  •  Graduate Program                  │
│  ⏰ Closes in 12 days   [View listing ↗]        │
│  ─────────────────────────────────────────────  │
│  [🤖 AI Tips]  [📝 Notes]  [🗑 Remove]          │
└─────────────────────────────────────────────────┘
```

- Company favicon: `https://www.google.com/s2/favicons?domain=${company_url}&sz=32`
- Source badge (Seek / LinkedIn / AI Search / Manual / Extension)
- Deadline countdown — red if < 7 days
- "AI Tips" button → opens `ApplicationTipsModal` with streaming Claude advice

**`ApplicationTipsModal.tsx`:**
- Sends role title + company + industry to `/api/ai/job-tips`
- Streams back: tailored resume tips, cover letter angle, company research notes, likely interview questions
- Cached in `aiTips` column after first generation

**Application deadline alerts:**
- Job deadlines < 7 days surface in the main dashboard "Urgent" section alongside Canvas assignments
- Red badge if < 3 days, amber if < 7 days

---

### 6. Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  UniTrack          Dashboard  Assignments  Jobs  Calendar    │
│  [Avatar ▾]                                    [🔔 3] [⚙️]  │
├──────────────────────────────────────────────────────────────┤
│                    │                                         │
│  THIS WEEK         │  🔴 URGENT (3)                         │
│  Mon  Tue  Wed...  │  Assignment: Final Report — 18h left   │
│                    │  Job: Atlassian Graduate — 2 days left  │
│  ─────────────     │                                         │
│  AI Summary        │  ─────────────────────────────────────  │
│  ──────────        │  UPCOMING ASSIGNMENTS (Canvas)          │
│  "Heavy week —     │  [AssignmentCard] [AssignmentCard] ...  │
│  3 assignments     │                                         │
│  and 2 job         │  ─────────────────────────────────────  │
│  deadlines..."     │  JOBS PIPELINE                         │
│                    │  Bookmarked: 4  Applying: 2  Applied:3  │
│  [Regenerate]      │  [Search for new roles →]              │
│                    │                                         │
└────────────────────┴─────────────────────────────────────────┘
```

**Nav tabs:**
1. Dashboard — overview, AI summary, urgent items
2. Assignments — full Canvas list with filters
3. Jobs — Kanban board + AI search + manual entry
4. Calendar — month view, Canvas events + job deadlines combined
5. Settings — profile, Canvas token, extension token, preferences

---

### 7. Notifications

**In-app:**
- `NotificationBell.tsx` — bell icon in header with unread count badge
- Dropdown lists recent notifications sorted by date
- "Mark all read" button
- Clicking a notification navigates to the relevant page

**Toast notifications (via Sonner):**
- On page load: show toasts for assignments due < 48hrs and jobs closing < 3 days
- One toast per item max — don't spam
- Persist which toasts have been shown in user preferences

**Browser push notifications:**
- Ask permission on first dashboard load
- Use `Notification` Web API for assignment due reminders
- Trigger when: assignment is exactly 24h away, job deadline is exactly 24h away

**Notification types stored in DB:**
```
ASSIGNMENT_DUE      → "COMP3900 Project due in 12 hours"
JOB_DEADLINE        → "Atlassian application closes tomorrow"
NEW_JOB_FOUND       → "5 new Software Engineering roles found in Sydney"
AI_SUMMARY_READY    → "Your weekly summary for Oct 14 is ready"
APPLICATION_REMINDER → "You bookmarked a role at Google 7 days ago — have you applied?"
```

---

### 8. Settings Page

**Tabs within Settings:**

**Profile tab:**
- Edit name, university, degree, graduation year, work rights
- Avatar upload (Supabase Storage)

**Canvas tab:**
- Canvas instance URL + token input
- "Test connection" — validates token, shows connected courses
- "Disconnect Canvas" option
- Last synced timestamp

**Preferences tab:**
- Do you work part-time? Which day(s)?
- Preferred study hours per day
- Email notification opt-in

**Browser Extension tab:**
- Generate / regenerate extension token
- Copy-to-clipboard button
- Step-by-step instructions for installing the extension
- List of recent saves from the extension

**Notifications tab:**
- Toggle each notification type on/off
- Browser push notification permission button

---

### 9. Design & UX

**Aesthetic:** Clean, focused academic tool. Think Linear meets Notion.
- Dark mode by default, light mode toggle (use `next-themes`)
- Colour palette:
  - Primary: Indigo `#4F46E5`
  - Urgency red: `#EF4444`
  - Urgency amber: `#F59E0B`
  - Success green: `#10B981`
  - Surface: `#0F0F0F` (dark), `#FAFAFA` (light)
- Typography: `Geist` (headings) + `Geist Mono` (dates, countdowns, badges)
- Animations: Framer Motion for page transitions and card drag animations
- Skeleton loaders for all async data (Canvas fetch, AI generation)
- Empty states with clear CTAs:
  - No Canvas token → "Connect Canvas to see your assignments →"
  - No jobs → "Search for graduate roles or add one manually →"
  - No AI summary → "Generate your weekly plan →"
- Mobile responsive — sidebar collapses to bottom tab bar on mobile

---

## Implementation Order (build in this sequence)

### Phase 1 — Foundation
1. Project setup, Tailwind config, shadcn/ui init
2. Supabase project setup + Prisma schema + migrations
3. Auth pages: login, signup, onboarding
4. Middleware — protect `/(app)` routes
5. Basic layout shell: header, sidebar, nav tabs

### Phase 2 — Canvas Integration
6. Canvas token encryption/decryption (`lib/canvas-crypto.ts`)
7. Settings page — Canvas token input + test connection
8. Canvas API proxy route (`/api/canvas/[...path]`)
9. Canvas data fetching with caching (CanvasCache table)
10. Assignment list + urgency cards on dashboard

### Phase 3 — AI Summaries
11. `/api/ai/summary` streaming endpoint
12. Weekly summary generation + storage
13. `SummaryPanel.tsx` with streaming text display
14. Monthly summary
15. Dashboard integration — priority tasks panel

### Phase 4 — Job Tracker Core
16. Kanban board UI with @dnd-kit
17. Manual job entry form + Supabase CRUD
18. Job card with deadline countdown + urgency in dashboard
19. `/api/ai/job-tips` + ApplicationTipsModal

### Phase 5 — AI Job Search
20. `/api/ai/job-search` with Claude web_search tool
21. JobSearchPanel filters UI (pre-filled from profile)
22. JobSearchResults streaming display
23. One-click save to tracker
24. Save search history to job_searches table

### Phase 6 — Browser Extension
25. Build extension manifest + content.js
26. Popup UI with token entry
27. `/api/jobs/extension` webhook endpoint
28. Extension token generation in settings

### Phase 7 — Notifications & Polish
29. Notification system (DB + bell UI + toasts)
30. Scheduled weekly auto-search (Supabase Edge Function cron)
31. Calendar view (Canvas events + job deadlines)
32. Mobile responsive layout
33. Empty states, error boundaries, loading skeletons
34. Performance: image optimization, route prefetching

---

## Supabase Setup Notes

1. Create a new Supabase project at supabase.com
2. Go to Settings → Database → Connection string → copy the Pooler URL for `DATABASE_URL`
3. Copy the Direct URL for `DIRECT_URL`
4. Enable Google OAuth: Authentication → Providers → Google (needs a Google Cloud OAuth client)
5. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Settings → API
6. Set `SUPABASE_SERVICE_ROLE_KEY` from Settings → API (never expose this client-side)
7. Row Level Security (RLS): enable on all tables; users can only read/write their own rows
   - Policy example for `job_applications`: `auth.uid() = user_id`
   - Note: since we use Prisma with the service role key on the server, RLS is a defence-in-depth measure

**RLS policies to enable on all tables:**
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Own data only" ON users FOR ALL USING (auth.uid()::text = id);
CREATE POLICY "Own data only" ON job_applications FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Own data only" ON ai_summaries FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Own data only" ON canvas_cache FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Own data only" ON job_searches FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Own data only" ON notifications FOR ALL USING (auth.uid()::text = user_id);
```

---

## Stretch Goals (after core is working)

- [ ] Supabase Edge Function cron job for weekly auto job search
- [ ] Google Calendar sync — export Canvas events + job deadlines to Google Calendar
- [ ] Grade tracker — log marks received, calculate weighted GPA
- [ ] Export weekly plan as PDF (use `@react-pdf/renderer`)
- [ ] Pomodoro timer embedded in assignment cards
- [ ] Safari extension support (same codebase, different manifest)
- [ ] LinkedIn Jobs API integration (official partner API — needs approval)
- [ ] Email digest — weekly summary sent via Supabase + Resend

---

## Key Technical Decisions to Note

1. **Canvas token encryption** — implement AES-256-GCM in `lib/canvas-crypto.ts` using Node's built-in `crypto` module. The key lives only in the environment variable. Never log decrypted tokens.

2. **Prisma + Supabase** — use Prisma for type-safe queries in API routes (server-side only). Use the Supabase client only for auth session management and client-side realtime if needed. Don't mix them for the same queries.

3. **AI job search cost** — each job search call uses Claude with web search, which costs tokens. Consider: rate-limit searches to 5 per day per user, show the user how many searches they have left, cache results for 24 hours so re-opening the search tab doesn't re-run the search.

4. **Extension token security** — the extension token in `user.preferences` should be a long random string (32+ bytes, base64). Hash it before storing (bcrypt or SHA-256) and compare hashes on the API endpoint. This way even if the DB is compromised, extension tokens can't be replayed.

5. **Supabase user ID sync** — when a user signs up via Supabase Auth, create their row in the `users` table via a Supabase Database Webhook or in the `/api/auth/callback` route. The `users.id` should match `auth.users.id` exactly so RLS policies work correctly.
