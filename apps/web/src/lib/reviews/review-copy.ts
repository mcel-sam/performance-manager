import { ReviewRelationship } from "@prisma/client";

export const vanillaReviewRelationships = [
  ReviewRelationship.SELF,
  ReviewRelationship.MANAGER,
] as const;

export function isVanillaReviewRelationship(
  relationship: ReviewRelationship,
): relationship is (typeof vanillaReviewRelationships)[number] {
  return vanillaReviewRelationships.includes(relationship as (typeof vanillaReviewRelationships)[number]);
}

export function getReviewRelationshipLabel(
  relationship: ReviewRelationship,
  variant: "short" | "full" = "short",
): string {
  switch (relationship) {
    case ReviewRelationship.SELF:
      return variant === "full" ? "Self review" : "Self";
    case ReviewRelationship.MANAGER:
      return variant === "full" ? "Manager review" : "Manager review";
    case ReviewRelationship.PEER:
      return variant === "full" ? "Peer review" : "Peer review";
    case ReviewRelationship.UPWARD:
      return variant === "full" ? "Feedback for manager" : "Manager feedback";
    default:
      return relationship;
  }
}

export function getReviewRelationshipAudienceLabel(
  relationship: ReviewRelationship,
): string {
  switch (relationship) {
    case ReviewRelationship.SELF:
      return "Self";
    case ReviewRelationship.MANAGER:
      return "Direct report";
    case ReviewRelationship.PEER:
      return "Peer";
    case ReviewRelationship.UPWARD:
      return "My manager";
    default:
      return relationship;
  }
}

export function getReviewRelationshipHelpText(
  relationship: ReviewRelationship,
): string {
  switch (relationship) {
    case ReviewRelationship.SELF:
      return "You are reviewing yourself.";
    case ReviewRelationship.MANAGER:
      return "You are reviewing a direct report.";
    case ReviewRelationship.PEER:
      return "You are reviewing a peer or teammate.";
    case ReviewRelationship.UPWARD:
      return "You are reviewing your manager.";
    default:
      return "";
  }
}

export function resolveVanillaReviewPrompt(
  prompt: string,
  relationship: ReviewRelationship,
  sortOrder: number,
): string {
  if (!isVanillaReviewRelationship(relationship)) {
    return prompt;
  }

  if (sortOrder === 1) {
    return relationship === ReviewRelationship.SELF
      ? "What were your most meaningful accomplishments and business results this cycle?"
      : "What were this employee's most meaningful accomplishments and business results this cycle?";
  }

  if (sortOrder === 2) {
    return relationship === ReviewRelationship.SELF
      ? "What strengths did you demonstrate, and what development priorities or career interests should shape your next cycle?"
      : "What strengths should this employee continue to build, and what development priorities or growth opportunities should shape the next cycle?";
  }

  return prompt;
}
