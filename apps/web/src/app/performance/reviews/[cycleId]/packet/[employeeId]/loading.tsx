import { RouteLoadingState } from "@/components/ui/route-loading-state";

export default function ReviewPacketLoading() {
  return (
    <RouteLoadingState
      maxWidthClassName="max-w-7xl"
      skeletonHeights={["h-28", "h-40", "h-56", "h-56"]}
      className="gap-6"
      data-testid="review-packet-loading"
    />
  );
}
