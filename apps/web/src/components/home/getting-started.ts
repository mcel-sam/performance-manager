import { UserRole } from "@prisma/client";

export interface GettingStartedLink {
  label: string;
  href: string;
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
        title: "Start with cycle and calibration setup",
        description:
          "Create a review cycle, generate packets, and prepare calibration sessions before launch.",
        links: [
          { label: "Manage review cycles", href: "/admin/performance/review-cycles" },
          { label: "Manage calibration sessions", href: "/admin/performance/calibration" },
          { label: "Open help center", href: "/help" },
        ],
      };
    case UserRole.MANAGER:
      return {
        title: "Focus on reviews and coaching workflows",
        description:
          "Complete manager reviews, align calibration placements, and track improvement plans.",
        links: [
          { label: "Open review tasks", href: "/performance/reviews" },
          { label: "Open calibration", href: "/performance/calibration/calibration_session_seed_1" },
          { label: "Open improvement plans", href: "/performance/improvement-plans" },
        ],
      };
    default:
      return {
        title: "Complete assigned reviews",
        description:
          "Start with your review tasks, support answers with evidence, and submit before the cycle closes.",
        links: [
          { label: "Open review tasks", href: "/performance/reviews" },
          {
            label: "Write self review",
            href: "/performance/reviews/review_cycle_seed_1/write/review_submission_seed_self",
          },
          { label: "Open help center", href: "/help" },
        ],
      };
  }
}
