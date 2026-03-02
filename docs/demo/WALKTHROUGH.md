# Performance Manager Walkthrough

This guide is for first-time users who want to run the app locally and understand the main flows by role.

## Quick start (local)

1. Start Postgres from repo root:

```bash
docker compose up -d
```

2. Prepare the web app:

```bash
cd apps/web
cp .env.example .env.local
npm install
npx prisma migrate dev
```

3. Enable Demo Mode in `apps/web/.env.local`:

```bash
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
```

4. Start the app:

```bash
npm run dev
```

5. Open:
- `http://localhost:3000`

## Demo Mode setup (required for walkthrough)

1. Open `http://localhost:3000/login`.
2. Click **Reset demo database & load sample data**.
3. In the confirmation modal, type `RESET`, then click **Confirm reset**.
4. After success, click one role tile to sign in (for example **Sign in as HR Admin**).

Important:
- Do not hardcode credentials in docs or code. Use the role tiles in the login UI.

## Seeded persona stories (quick reference)

- **Elliot Barnes** (`emp_employee_1`): high performer with coaching plan for executive communication.
- **Priya Das** (`emp_employee_3`): active improvement plan, trending up with strong recent check-ins.
- **Maya Chen** (`emp_employee_2`): safety incident learning case with safety-focused evidence.
- **Noah Bennett** (`emp_employee_4`): new hire with limited observation and multiple Not Observed competencies.
- **Managers receive upward input**: manager packets include upward reference submissions.

## Navigation map (left menu)

- `/` → **Home**
- `/performance/reviews` → **Reviews**
- `/performance/calibration/calibration_session_seed_1` → **Calibration**
- `/admin/performance/calibration` → **Admin Calibration**
- `/performance/improvement-plans` → **Improvement Plans**
- `/admin/performance/review-cycles` → **Admin Cycles**
- `/help` → **Help**
- `/login` → **Demo Login + Reset** (Demo Mode)

## HR Admin walkthrough

### 1) Create and manage a review cycle

1. Go to `/admin/performance/review-cycles`.
2. Click **Create Cycle**.
3. On `/admin/performance/review-cycles/new`, complete the form and click **Create Cycle**.
4. Back on the cycle list, click:
   - **Generate** (creates packets/submissions)
   - **Move to ACTIVE**
   - **Move to LOCKED**
   - **Move to RELEASED**

### 2) Create a calibration session

1. Go to `/admin/performance/calibration`.
2. Click **Create Session**.
3. On `/admin/performance/calibration/new`:
   - Select **Cycle**
   - Select **Cohort Members**
   - Select **Participants**
   - (Optional) adjust **Performance Axis** and **Potential Axis**
4. Click **Create Session**.

### 3) Finalize calibration

1. Open the workspace from `/admin/performance/calibration` using **Open Workspace**.
2. In `/performance/calibration/:sessionId`, select participants from the 9-box.
3. Set **Performance**, **Potential**, and optional **Justification notes**.
4. Click **Save placement**.
5. Click **Finalize Session** to lock placements.

### 4) Release visibility

- Use cycle status transitions in `/admin/performance/review-cycles` to move cycles to **RELEASED** when ready.

## Manager walkthrough

### 1) Complete manager reviews

1. Go to `/performance/reviews`.
2. Click **Open Review** for a manager assignment.
3. In `/performance/reviews/:cycleId/write/:submissionId`:
   - Fill answers in **Write Review**
   - Watch autosave status (**Saving...**, then **Saved**)
   - (Scale questions) choose **Rating (1-5)** or **Not observed (exclude from scoring)**
   - Click **Submit Review**

### 2) Use evidence while writing

1. On the write screen, click **Attach evidence here** for a question.
2. In the right drawer (**Evidence Context**), pick an evidence tab and click **Attach to this answer**.
3. Remove an attached chip with **Remove** if needed.

### 3) Use packet view and reference input

1. Open packet route: `/performance/reviews/:cycleId/packet/:employeeId` (or click **Open packet view** from write screen).
2. In packet submissions, look for **Reference input** labels on peer/upward reviews.
3. Switch between **This cycle** and **Previous cycles** tabs.

### 4) Calibrate placements

1. Open `/performance/calibration/:sessionId`.
2. Select a person in the matrix.
3. In the right drawer, use **Move to box** controls and click **Save placement**.
4. Use **Open review packet** from drawer for context.

### 5) Improvement plans and check-ins

1. Open `/performance/improvement-plans`.
2. Click **Open Plan**.
3. On `/performance/improvement-plans/:planId`:
   - Add a note and click **Add Check-in**
   - Use **Change Status** and click **Update Status**

Note:
- There is currently no “Create plan” button in the UI. Plan creation is seeded in Demo Mode or available via `POST /api/performance/improvement-plans`.

## Employee walkthrough

### 1) Open and complete self review

1. Go to `/performance/reviews`.
2. Click **Open Review** on your self-review task.
3. Complete answers and click **Submit Review**.

### 2) Attach evidence to answers

1. On the write screen, select a question with **Attach evidence here**.
2. In **Evidence Context**, click **Attach to this answer** on relevant items.

### 3) View packet after release (if allowed)

- Packet access depends on cycle policy and status.
- After cycle release (and if policy allows), open `/performance/reviews/:cycleId/packet/:employeeId`.

## Calibrator walkthrough (optional)

1. Sign in as **Calibrator** at `/login`.
2. Open `/performance/calibration/:sessionId`.
3. Move placements with **Performance** and **Potential** selects.
4. Add optional **Justification notes**.
5. Click **Save placement**.
6. If permitted, click **Finalize Session**.

## 15-minute HR demo script

Use this script for a short live demo.

1. Minute 0-2: Setup
- Open `/login`, click **Reset demo database & load sample data**, type `RESET`, then confirm.
- Sign in as **HR Admin** from the role tiles.

2. Minute 2-6: Cycle administration
- Go to `/admin/performance/review-cycles`.
- Show **Create Cycle** (or existing cycle).
- On a cycle row, click **Generate**, then **Move to ACTIVE** and **Move to LOCKED**.

3. Minute 6-9: Manager experience
- Switch to **Manager** from `/login`.
- Open `/performance/reviews`, click **Open Review**.
- Show autosave state and submit with **Submit Review**.
- Show evidence attach flow in **Evidence Context**.

4. Minute 9-12: Packet + calibration
- Open packet route and show **Reference input** labels.
- Open calibration workspace and move one person with **Save placement**.

5. Minute 12-15: Finalization and release
- Switch back to **HR Admin**.
- Finalize calibration with **Finalize Session**.
- Return to `/admin/performance/review-cycles` and progress to **Move to RELEASED**.
- Mention employee packet visibility is policy-based after release.

## Troubleshooting

- “Admin access required” card:
  - Switch to HR Admin or Calibrator at `/login`.
- Empty lists/no records:
  - Re-run the reset flow on `/login` and confirm with `RESET`.
- Demo pages not available:
  - Verify `DEMO_MODE=true` and `NEXT_PUBLIC_DEMO_MODE=true` in `apps/web/.env.local`, then restart dev server.
