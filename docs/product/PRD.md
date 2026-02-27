# PRD — Performance Management System (v0.1, evolving)

**Status:** Draft (living document)  
**Owner:** Product  
**Primary users:** Employees, Managers, HR Admins  
**Last updated:** 2026-02-26

## 1) Problem statement

We need a unified Performance Management system that supports:
- High-quality, evidence-based reviews
- Consistent calibration decisions (e.g., 9-box)
- Structured improvement plans with auditability
- Clear role-based access controls
- A UX that encourages frequent, lightweight performance habits (feedback, updates, 1:1s) to feed into review cycles

This PRD defines MVP requirements and sets direction for iterative development.

## 2) Vision

A single platform where performance conversations are continuous, evidence-backed, and operationally reliable:
- Employees write stronger self reviews because relevant context is visible beside the writing surface (evidence panel).
- Managers make fairer decisions with better visibility into goals, feedback, and prior-cycle history.
- HR can run cycles, track progress, calibrate decisions, and maintain compliance-ready records (audit logs, exports).

## 3) Goals and success metrics

### Product goals (MVP)
1. Run a review cycle end-to-end:
   - Create cycle → collect submissions → lock → calibrate → release packets (visibility rules)
2. Make reviews evidence-backed:
   - Evidence counts + drill-in + attach evidence to answers
3. Support calibration:
   - 9-box placement + notes + finalize snapshot
4. Support improvement plans:
   - Create plan, track check-ins, audit log, export placeholder
5. Ensure security & compliance:
   - Permissions enforced server-side, auditable changes

### Success metrics (initial targets)
- Review completion rate (by due date): ≥ 90% (pilot org)
- % of review answers with attached evidence: baseline measured, then improve
- Cycle setup time for HR: < 30 minutes for typical org
- Calibration finalize time: < 1 meeting session for a role group
- System reliability: 99.9% availability during cycle peaks (stretch)

## 4) Non-goals (MVP)
- Payroll/benefits administration
- Full HRIS replacement
- Advanced AI insights (attrition risk, auto-summaries) — optional later
- Complex compensation planning (can be integrated later)

## 5) Personas and primary jobs-to-be-done

### Employee
- See assigned review tasks
- Write self review with autosave and clear progress
- View released review packet (if policy allows)
- Use evidence to support claims (feedback, goals, 1:1s, updates)

### Manager
- Complete manager reviews for directs
- Monitor team completion status
- Participate in calibration for their role group
- Initiate and manage improvement plans (with HR oversight)

### HR Admin
- Create and configure cycles and templates
- Monitor progress; send reminders (later automation)
- Manage calibration sessions and finalize outcomes
- Maintain audit-ready records and exports

## 6) Experience principles (UX)

**Signature layout (complex workflows):**
- Left: phase navigation
- Center: primary workspace (writing surface or grid)
- Right: context drawer/panel (overview + evidence + history)

This pattern appears explicitly in the review writing experience and calibration, where evidence and packet summaries remain visible without disrupting the main task. 

**Clarity over density**
- High whitespace, strong hierarchy, readable form widths
- Progressive disclosure (expand evidence details on demand)

**Autosave is mandatory**
- Writing experiences must autosave drafts and show “Saving/Saved” states.

**Context without navigation**
- Use right-side drawers/panels for employee/packet details to preserve user context.

**Auditability for sensitive flows**
- Improvement plans and final decisions require audit logs and export capability (placeholder acceptable in MVP).

## User guidance (in scope for launch)
To reduce training/support burden, the product must include:
- A Help entry point in the app shell and a `/help` page with role-based guidance.
- Contextual helper text/tooltips on core screens (Reviews, Packets, Calibration, Improvement Plans) explaining key concepts and visibility.
- Strong empty-state coaching that tells users what to do next.

## 7) Core concepts and definitions

- **Review Cycle:** Time-bound period during which reviews are written and compiled.
- **Review Template:** Set of questions/ratings used in a cycle.
- **Review Packet:** Subject-centric bundle of all review submissions for one employee in one cycle.
- **Review Submission:** A single reviewer’s completed review for a subject employee.
- **Evidence Item:** A piece of contextual data (feedback, update, 1:1 note, goal status, values recognition) used to support review answers. 
- **Calibration Session:** Group decision workspace to align ratings (e.g., 9-box).
- **Improvement Plan:** Structured plan with goals + check-ins + outcomes + auditability. 
## 8) Permissions and visibility model (MVP)

### Roles
- EMPLOYEE
- MANAGER
- HR_ADMIN
- CALIBRATOR (optional)

### Relationship-based access
- Employees can access:
  - their own submissions, packets (subject to cycle visibility policy)
  - evidence items they are allowed to see
- Managers can access:
  - submissions they authored
  - packets for their directs (subject to policy)
  - calibration sessions they participate in
- HR Admin can access:
  - all cycles, packets, submissions, calibration sessions, improvement plans (unless restricted)

### Cycle visibility policy
Define per cycle:
- **Manager-only**: employee cannot view packet content
- **Employee-after-release**: employee can view packet after release
- (Optional later) custom per-section visibility

### Evidence visibility
Evidence items carry visibility flags, and must be enforced server-side:
- Private (author only)
- Manager-only
- Shared with subject
- Org-visible

## 9) MVP scope by module

---

# A) Review Cycles (Admin + participants)

## A1. Admin — Create and configure cycle
**User story:** As HR Admin, I can create a review cycle, choose participants, select templates, set due dates, and configure visibility.

**Requirements**
- Create cycle with:
  - name, start/end dates
  - participant scope (org-wide, department, role group) (MVP can be org-wide)
  - required review types: self, manager, peer (count), upward (count)
  - visibility policy
- Generate packets/submissions:
  - one packet per subject employee
  - one submission per reviewer/subject pair

**Acceptance criteria**
- Cycle exists in Draft state
- Admin can move cycle to Active (opens submissions)
- Admin can Lock cycle (closes submissions)
- Admin can Release cycle (makes packets visible per policy)

## A2. Participant — Review task list
**User story:** As Employee/Manager, I see which reviews I need to write, their statuses, and deadlines.

**Requirements**
- “My review tasks” list showing:
  - cycle name
  - subject employee
  - relationship type (self/manager/peer/upward)
  - status: not started / in progress / submitted
  - due date (optional early)
- Click to open write screen

**Acceptance criteria**
- Tasks list loads quickly and respects permissions
- Users can resume in-progress drafts

---

# B) Review Writing (3-panel write experience)

This is the core user experience described in the reference UI: left phase nav, center questions, right overview/evidence counts and drill-ins.

## B1. Write screen layout
**Requirements**
- Left nav shows phases relevant to user:
  - Write reviews (task list)
  - Self review (if exists)
  - Upward review (if exists)
  - Review packet (if allowed)
- Center shows template questions:
  - rich text answers
  - required indicators
  - progress summary (x of y required answered)
- Right panel shows:
  - overview summary (initially empty or generated later)
  - current role/track/title info
  - evidence counts (Feedback, Updates, 1:1s, Values, Goals) and “View details” drill-in. 

## B2. Autosave + submit
**Requirements**
- Autosave on edit with debounce and visible status:
  - “Saving…” → “Saved”
- Submit validates required questions and blocks if incomplete
- Scroll/focus to first invalid question
- After submit, lock editing unless returned

**Acceptance criteria**
- Refreshing the page does not lose work
- Submitted review cannot be edited (unless returned)

## B3. Evidence drill-in and attach-to-answer
**Requirements**
- Evidence list filtered by type and time range (optional)
- Ability to attach evidence item(s) to a specific answer
- Show attached evidence chips under an answer
- Detach supported

**Acceptance criteria**
- Evidence attach writes an audit event
- Evidence shown respects visibility permissions

---

# C) Review Packet (subject-centric bundle)

## C1. Packet view
**User story:** As Manager/HR (and Employee if allowed), I can view a packet that summarizes all review submissions for a subject in a cycle.

**Requirements**
- Packet contains:
  - submissions list (who wrote what, status)
  - answers (read-only after lock)
  - overall summary area (editable by HR later, optional)
  - ratings summary (if used)
  - evidence summary (counts)
  - previous cycle comparison tab (if data exists)

**Acceptance criteria**
- Packet view is permission-gated
- Packet view loads without exposing hidden submissions

---

# D) Calibration (9-box)

The reference flow shows a 9-box grid with avatars, filters for axes, and a right panel with packet summary and “This cycle / Previous cycles.” 

## D1. Calibration session creation (Admin)
**Requirements**
- Create session tied to a cycle + role group (e.g., “Account Executives”)
- Configure axes:
  - X: performance rating buckets
  - Y: potential buckets
- Add participants (HR, managers, calibrators)

## D2. Calibration workspace (Participants)
**Requirements**
- 9-box grid view:
  - avatars placed in boxes
  - drag/drop between boxes (permissioned)
- Right panel for selected employee:
  - packet summary (strengths, key themes)
  - tab: “This cycle” vs “Previous cycles”
  - link: “View current review packet”
  - notes/justifications

## D3. Finalize calibration (Admin/Facilitator)
**Requirements**
- Finalize creates immutable snapshot:
  - placements + notes + timestamp + participants
- Optionally writes final ratings back to packets (can be a simple “final bucket” in MVP)

**Acceptance criteria**
- After finalize, placements are read-only
- Snapshot can be exported/downloaded later (placeholder acceptable)

---

# E) Improvement Plans

The reference UI shows a plan detail page with status (successful), time period, download/audit log actions, and a progress timeline with participant updates. 

## E1. Create improvement plan (Manager/HR)
**Requirements**
- Create plan with:
  - subject employee
  - manager owner
  - HR owner (optional)
  - start/end dates
  - goals / expectations (rich text)
- Status states:
  - draft → active → completed (successful/unsuccessful) → extended/cancelled

## E2. Plan detail view (Timeline)
**Requirements**
- Central timeline feed of check-ins/updates:
  - author, timestamp, content, attachments
  - optional @mentions (later)
- Actions:
  - view audit log
  - download/export (placeholder acceptable in MVP)

## E3. Audit log (Required)
**Requirements**
- Immutable audit events for:
  - plan creation
  - status transitions
  - edits to goals/dates
  - check-in entries created/edited
- HR can view full audit log

**Acceptance criteria**
- Sensitive access enforced (plan is not visible broadly)

---

## 10) Cross-cutting requirements

### Audit logging
Must log all sensitive mutations:
- cycle lifecycle transitions
- submissions submit/return
- evidence attach/detach
- calibration movements and finalize
- improvement plan transitions and updates

### Notifications (MVP-lite)
MVP can be in-app only; email reminders can come later.
- Show tasks on dashboard
- Optional: basic “due soon” badge

### Accessibility
- Keyboard navigation for:
  - review form fields
  - calibration selection (drag/drop accessibility later; provide alternative move controls)
- ARIA labels for buttons and form controls

### Performance
- Pages should load quickly for typical org sizes.
- Avoid N+1 queries; ensure common list screens have indexes.

### Security
- Enforce permission checks server-side for every read/write.
- Do not leak data through counts (e.g., evidence counts for unauthorized items should not reveal existence).

## 11) Reporting & Analytics (post-MVP direction)

The reference system includes an “Explorer” style analytics builder with measures, breakdowns, exports, and permission controls.

**Future direction**
- Performance metrics:
  - ratings distribution
  - cycle completion rates
  - calibration movement
  - goal attainment correlation
- Breakdowns:
  - department, manager, tenure, location
- Privacy:
  - small-N suppression

(We will implement only the foundational event logging in MVP and add reporting iteratively.)

## 12) Milestones / Release plan

### Milestone 0 — Foundation (week 1 target)
- Repo scaffold (AGENTS checklist)
- Next.js app boots
- Local Postgres via docker-compose
- Prisma schema + initial migration
- `/api/health` returns DB ok
- `/performance/reviews` loads empty state

### Milestone 1 — Reviews MVP
- Cycle create/generate submissions
- Task list
- Write screen with autosave + submit
- Evidence counts + drill-in (seeded data acceptable)

### Milestone 2 — Packets + Calibration
- Packet view
- Calibration session create + 9-box
- Finalize snapshot

### Milestone 3 — Improvement Plans MVP
- Create plan + timeline
- Audit log + export placeholder

## 13) Open questions (track here as we learn)
- Visibility policy defaults: manager-only vs employee-after-release?
- Ratings: do we store numeric scales now or keep buckets first?
- Peer/upward review assignment rules: how many, who selects (manager vs HR vs employee)?
- Evidence sources: do we build Feedback/Updates/1:1s/Goals in this product or integrate existing systems?
- Privacy: what’s the minimum group size for aggregate views?
- Export format requirements (PDF vs CSV vs JSON)?

## 14) Appendix: Reference UI patterns captured
Key patterns informing this PRD:
- 3-panel review writing with evidence counts and overview panel.
- 9-box calibration with right panel and previous cycle comparison. 
- Improvement plan timeline with audit log and download action. 