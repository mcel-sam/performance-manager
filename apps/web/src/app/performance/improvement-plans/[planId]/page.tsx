import ImprovementPlanDetailView from "@/components/improvement-plans/improvement-plan-detail-view";
import { resolveReturnTo } from "@/lib/navigation/return-to";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getImprovementPlanDetail } from "@/server/improvement-plans/improvement-plan-service";

export const dynamic = "force-dynamic";

interface ImprovementPlanDetailPageProps {
  params: Promise<{
    planId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ImprovementPlanDetailPage({
  params,
  searchParams,
}: ImprovementPlanDetailPageProps) {
  const { planId } = await params;
  const rawSearchParams = await searchParams;
  const context = await getDevRequestContext();
  const plan = await getImprovementPlanDetail(planId, context);
  const returnHref = resolveReturnTo(
    getSingleValue(rawSearchParams.returnTo),
    "/performance/improvement-plans",
  );

  return (
    <ImprovementPlanDetailView
      planId={planId}
      returnHref={returnHref}
      auth={{
        userId: context.userId,
        orgId: context.orgId,
        role: context.role,
      }}
      initialPlan={plan}
    />
  );
}

function getSingleValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
