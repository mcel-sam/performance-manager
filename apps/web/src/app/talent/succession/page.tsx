import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import SuccessionOverview from "@/components/succession/succession-overview";
import { getDevRequestContext } from "@/server/auth/request-context";
import {
  listSuccessionOverview,
  parseSuccessionFilters,
} from "@/server/succession/succession-service";

export const dynamic = "force-dynamic";

export default async function ManagerSuccessionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getDevRequestContext();
  if (context.role !== UserRole.MANAGER && context.role !== UserRole.HR_ADMIN) {
    redirect("/");
  }

  const filters = parseSuccessionFilters(await searchParams);
  const overview = await listSuccessionOverview(filters, context);

  return (
    <SuccessionOverview
      title="My Succession Area"
      description="Review in-scope positions, propose successors from your team, and add planning notes without leaving your manager workflow."
      overview={overview}
      baseHref="/talent/succession"
      detailBaseHref="/talent/succession/positions"
    />
  );
}
