import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import SuccessionOverview from "@/components/succession/succession-overview";
import { getDevRequestContext } from "@/server/auth/request-context";
import {
  listSuccessionOverview,
  parseSuccessionFilters,
} from "@/server/succession/succession-service";

export const dynamic = "force-dynamic";

export default async function AdminSuccessionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getDevRequestContext();
  if (context.role !== UserRole.HR_ADMIN) {
    redirect("/");
  }

  const filters = parseSuccessionFilters(await searchParams);
  const overview = await listSuccessionOverview(filters, context);

  return (
    <SuccessionOverview
      title="Succession Planning"
      description="Manage critical roles, candidate slates, and department coverage with HR-only planning controls."
      overview={overview}
      baseHref="/admin/talent/succession"
      detailBaseHref="/admin/talent/succession/positions"
      createHref="/admin/talent/succession/positions/new"
      exportHref="/api/admin/talent/succession/export"
      coverageExportHref="/api/admin/talent/succession/export?kind=coverage"
    />
  );
}
