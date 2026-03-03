import { RouteLoadingState } from "@/components/ui/route-loading-state";

export default function ReviewsLoading() {
  return <RouteLoadingState data-testid="reviews-loading" skeletonHeights={["h-24", "h-[420px]"]} />;
}
