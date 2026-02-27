import Link from "next/link";

import { getDevRequestContext } from "@/server/auth/request-context";
import { listAssignedReviewTasks } from "@/server/reviews/participant-review-service";

export const dynamic = "force-dynamic";

const relationshipLabel = {
  SELF: "Self",
  MANAGER: "Manager",
  PEER: "Peer",
  UPWARD: "Upward",
} as const;

const statusLabel = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  RETURNED: "Returned",
} as const;

export default async function PerformanceReviewsPage() {
  const context = await getDevRequestContext();
  const tasks = await listAssignedReviewTasks(context);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Performance Reviews</h1>
          <p className="text-sm text-slate-600">
            Track review cycles and complete your assigned submissions.
          </p>
          <p className="text-xs text-slate-500">Viewing as {context.role} ({context.userId})</p>
        </header>

        {tasks.length === 0 ? (
          <section
            aria-label="Empty review task state"
            className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-900">No assigned review tasks</h2>
            <p className="mt-2 text-sm text-slate-600">
              Assigned submissions will appear here when a cycle is generated.
            </p>
          </section>
        ) : (
          <section aria-label="Assigned review tasks" className="grid gap-4">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-slate-900">{task.cycleName}</h2>
                    <p className="text-sm text-slate-600">
                      Subject: {task.subjectName} • Relationship: {relationshipLabel[task.relationship]}
                    </p>
                    <p className="text-xs text-slate-500">
                      Due by {new Date(task.cycleEndDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {statusLabel[task.status]}
                  </span>
                </div>
                <div className="mt-4">
                  <Link
                    className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    href={`/performance/reviews/${task.cycleId}/write/${task.id}`}
                  >
                    Open Review
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
