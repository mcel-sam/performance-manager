import { UserRole } from "@prisma/client";

export type GettingStartedIcon =
  | "reviewCycles"
  | "queue"
  | "growth"
  | "selfReview"
  | "help"
  | "team"
  | "calibration"
  | "improvementPlans";

export interface GettingStartedLink {
  label: string;
  href: string;
  description: string;
  icon: GettingStartedIcon;
  metaLabel: string;
}

export interface GettingStartedContent {
  title: string;
  description: string;
  links: GettingStartedLink[];
}

export function getGettingStartedContent(role: UserRole): GettingStartedContent {
  switch (role) {
    case UserRole.HR_ADMIN:
      return {
        title: "Cycle and calibration setup",
        description:
          "Create a review cycle, generate assignments, and prepare calibration sessions before launch.",
        links: [
          {
            label: "Succession planning",
            href: "/admin/talent/succession",
            description: "Review critical-role coverage, successor slates, and manager proposals across the org.",
            icon: "reviewCycles",
            metaLabel: "Talent continuity",
          },
          {
            label: "Review cycles",
            href: "/admin/performance/review-cycles",
            description: "Create, launch, and monitor the cycles that power each review season.",
            icon: "reviewCycles",
            metaLabel: "Admin workspace",
          },
          {
            label: "Calibration sessions",
            href: "/admin/performance/calibration",
            description: "Prepare talent discussions and keep calibration sessions moving.",
            icon: "calibration",
            metaLabel: "Facilitator workflow",
          },
          {
            label: "Help center",
            href: "/help",
            description: "Reference rollout guidance without leaving the performance workspace.",
            icon: "help",
            metaLabel: "Reference",
          },
        ],
      };
    case UserRole.MANAGER:
      return {
        title: "My Team first",
        description:
          "Manage direct reports from My Team first, then complete review tasks, calibration, and coaching follow-through.",
        links: [
          {
            label: "My Team",
            href: "/performance/team-reviews",
            description: "Track direct reports, packets, and next review steps from one place.",
            icon: "team",
            metaLabel: "Team workspace",
          },
          {
            label: "Succession",
            href: "/talent/succession",
            description: "Review in-scope roles, propose successors, and add continuity notes for your area.",
            icon: "team",
            metaLabel: "Talent continuity",
          },
          {
            label: "Review queue",
            href: "/performance/reviews",
            description: "Open every assigned manager review in one queue.",
            icon: "queue",
            metaLabel: "Task queue",
          },
          {
            label: "Calibration",
            href: "/performance/calibration/calibration_session_seed_1",
            description: "Jump into the active 9-box session when discussion time starts.",
            icon: "calibration",
            metaLabel: "Session workspace",
          },
          {
            label: "Improvement plans",
            href: "/performance/improvement-plans",
            description: "Follow coaching commitments and upcoming plan check-ins.",
            icon: "improvementPlans",
            metaLabel: "Follow-through",
          },
        ],
      };
    default:
      return {
        title: "Complete assigned reviews",
        description:
          "Start with your review tasks, support answers with evidence, and submit before the cycle closes.",
        links: [
          {
            label: "Review queue",
            href: "/performance/reviews",
            description: "See every assigned review in one place instead of jumping between screens.",
            icon: "queue",
            metaLabel: "Task queue",
          },
          {
            label: "Self review",
            href: "/performance/reviews/cycle_seed_draft_1/write/submission_seed_employee_self_1",
            description: "Pick up your draft and keep your self review moving toward submission.",
            icon: "selfReview",
            metaLabel: "Personal draft",
          },
          {
            label: "Tracks & competencies",
            href: "/performance/tracks",
            description: "See your current track, level expectations, and what good looks like in-role.",
            icon: "growth",
            metaLabel: "Career baseline",
          },
          {
            label: "Help center",
            href: "/help",
            description: "Open review guidance, expectations, and process answers when needed.",
            icon: "help",
            metaLabel: "Reference",
          },
        ],
      };
  }
}
