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
        title: "Run the cycle and keep your own work moving",
        description:
          "Oversee the performance process while still completing your own goals and review tasks in the same workspace.",
        links: [
          {
            label: "Review queue",
            href: "/performance/reviews",
            description: "Pick up assigned self-review work without leaving the admin experience.",
            icon: "queue",
            metaLabel: "Participant workflow",
          },
          {
            label: "Goals",
            href: "/goals",
            description: "Keep your own goals visible while you manage cycle operations for everyone else.",
            icon: "growth",
            metaLabel: "Personal planning",
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
            label: "Review queue",
            href: "/performance/reviews",
            description: "Open every assigned manager review in one queue.",
            icon: "queue",
            metaLabel: "Task queue",
          },
          {
            label: "Goals",
            href: "/goals",
            description: "Keep goal progress visible so manager feedback stays tied to current priorities.",
            icon: "growth",
            metaLabel: "Performance context",
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
    case UserRole.SUPER_ADMIN:
      return {
        title: "Lead restricted workflows without losing your own context",
        description:
          "Use Trellis for calibration and talent governance while still keeping your own goals and review work active.",
        links: [
          {
            label: "Calibration workspace",
            href: "/performance/calibration",
            description: "Open the active calibration workspace and keep talent discussions moving.",
            icon: "calibration",
            metaLabel: "Restricted workspace",
          },
          {
            label: "Review queue",
            href: "/performance/reviews",
            description: "Complete your assigned review work without dropping out of the governance flow.",
            icon: "queue",
            metaLabel: "Participant workflow",
          },
          {
            label: "Goals",
            href: "/goals",
            description: "Keep your own goals current while you oversee restricted talent decisions.",
            icon: "growth",
            metaLabel: "Personal planning",
          },
          {
            label: "Help center",
            href: "/help",
            description: "Reference operating guidance without leaving the calibration flow.",
            icon: "help",
            metaLabel: "Reference",
          },
        ],
      };
    case UserRole.EMPLOYEE:
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
            href: "/performance/reviews",
            description: "Pick up your active self review from the review queue and keep it moving toward submission.",
            icon: "selfReview",
            metaLabel: "Personal draft",
          },
          {
            label: "Goals",
            href: "/goals",
            description: "Review your current goals and keep your self review anchored to the work that matters most.",
            icon: "growth",
            metaLabel: "Performance context",
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
