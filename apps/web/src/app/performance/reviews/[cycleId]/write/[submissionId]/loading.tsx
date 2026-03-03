import { RouteLoadingState } from "@/components/ui/route-loading-state";

export default function WriteReviewLoading() {
  return (
    <RouteLoadingState
      maxWidthClassName="max-w-7xl"
      skeletonHeights={["h-[420px]", "h-[620px]"]}
      className="mx-auto grid w-full gap-6 lg:grid-cols-[260px_minmax(0,1fr)]"
      data-testid="write-review-loading"
    />
  );
}
