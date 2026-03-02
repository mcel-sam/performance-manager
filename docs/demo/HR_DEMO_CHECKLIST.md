# HR Demo Checklist

Use this checklist before and during a live HR walkthrough.

## Pre-demo setup

- [ ] `docker compose up -d` is running
- [ ] `cd apps/web && npm run dev` is running
- [ ] `apps/web/.env.local` has:
  - [ ] `DEMO_MODE=true`
  - [ ] `NEXT_PUBLIC_DEMO_MODE=true`
- [ ] Demo data is provisioned from `/demo/setup` using **Run full demo setup**
- [ ] You can sign in from `/demo/login` using credentials shown in the UI

## Core flow checks

### HR Admin
- [ ] `/admin/performance/review-cycles` loads
- [ ] Can run **Generate** on a draft cycle
- [ ] Can progress status with **Move to ACTIVE**, **Move to LOCKED**, **Move to RELEASED**
- [ ] `/admin/performance/calibration` loads
- [ ] Can create a session from `/admin/performance/calibration/new` with **Create Session**

### Manager
- [ ] `/performance/reviews` shows tasks and **Open Review** action
- [ ] Write screen autosave shows **Saving...** then **Saved**
- [ ] **Submit Review** works and submission becomes read-only
- [ ] Evidence can be attached via **Attach to this answer**
- [ ] Packet page shows **Reference input** for peer/upward

### Calibration
- [ ] `/performance/calibration/:sessionId` loads 9-box matrix
- [ ] Can move placement and click **Save placement**
- [ ] Can open packet from drawer with **Open review packet**
- [ ] **Finalize Session** locks controls and shows finalized state

### Improvement plans
- [ ] `/performance/improvement-plans` loads list
- [ ] Plan detail supports **Add Check-in**
- [ ] Plan detail supports **Update Status**
- [ ] **Export** action returns placeholder/info message

## Demo close-out

- [ ] Show `/help` route for role-based guidance
- [ ] Confirm release state and policy-based packet visibility behavior
- [ ] Note current limitation: no UI button yet for creating new improvement plans
