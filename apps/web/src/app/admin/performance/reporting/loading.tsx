import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminReportingLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6" data-testid="admin-reporting-loading">
      <PageHeader
        title="Reporting"
        description="Loading cycle progress, manager follow-up, and employee queue status..."
      />

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`reporting-filter-skeleton-${index}`} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={`reporting-kpi-skeleton-${index}`}>
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
    </div>
  );
}
