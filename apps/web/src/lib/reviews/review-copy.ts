import { ReviewRelationship } from "@prisma/client";

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
