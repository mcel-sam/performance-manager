import { RouteLoadingState } from "@/components/ui/route-loading-state";

export default function TeamReviewsLoading() {
  return (
    <RouteLoadingState
      data-testid="team-reviews-loading"
      skeletonHeights={["h-24", "h-36", "h-[420px]"]}
    />
  );
}
