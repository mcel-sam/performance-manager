import ImprovementPlanDetailView from "@/components/improvement-plans/improvement-plan-detail-view";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getImprovementPlanDetail } from "@/server/improvement-plans/improvement-plan-service";

export const dynamic = "force-dynamic";

interface ImprovementPlanDetailPageProps {
  params: Promise<{
    planId: string;
  }>;
}

export default async function ImprovementPlanDetailPage({
  params,
}: ImprovementPlanDetailPageProps) {
  const { planId } = await params;
  const context = await getDevRequestContext();
  const plan = await getImprovementPlanDetail(planId, context);

  return (
    <ImprovementPlanDetailView
      planId={planId}
      auth={{
        userId: context.userId,
        orgId: context.orgId,
        role: context.role,
      }}
      initialPlan={plan}
    />
  );
}
