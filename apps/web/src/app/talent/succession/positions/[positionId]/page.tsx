import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import SuccessionPositionDetailView from "@/components/succession/succession-position-detail-view";
import { getDevRequestContext } from "@/server/auth/request-context";
import {
  getSuccessionFormOptions,
  getSuccessionPositionDetail,
} from "@/server/succession/succession-service";

export const dynamic = "force-dynamic";

export default async function ManagerSuccessionPositionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ positionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getDevRequestContext();
  if (context.role !== UserRole.MANAGER && context.role !== UserRole.HR_ADMIN) {
    redirect("/");
  }

  const { positionId } = await params;
  const query = await searchParams;
  const candidateId = Array.isArray(query.candidateId) ? query.candidateId[0] : query.candidateId;

  const [detail, options] = await Promise.all([
    getSuccessionPositionDetail(positionId, context),
    getSuccessionFormOptions(context),
  ]);

  return (
    <SuccessionPositionDetailView
      auth={{ userId: context.userId, orgId: context.orgId }}
      detail={detail}
      formOptions={options}
      detailPath={`/talent/succession/positions/${positionId}`}
      overviewHref="/talent/succession"
      selectedCandidateId={candidateId}
    />
  );
}
