import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getGrowthTrackData } from "@/server/growth/growth-track-service";

export const dynamic = "force-dynamic";

export default async function GrowthTrackPage() {
  const context = await getDevRequestContext();
  const data = await getGrowthTrackData(context);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-slate-900">
      <PageHeader
        eyebrow="Growth"
        title="Tracks and competencies"
        description="Use your track baseline, competency expectations, and company values to set better goals."
        action={
          <Link href="/performance/reviews">
            <Button variant="outline" size="sm">
              Open review queue
            </Button>
          </Link>
        }
        metadata={
          <>
            {data.employee.displayName} | {data.track.label} track | {data.currentLevel.label} level
          </>
        }
      />

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[var(--shadow-lg)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-white via-teal-50/65 to-amber-50/40 px-5 py-6 sm:px-6 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Current baseline
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                {data.track.label} track for {data.employee.title ?? "your current role"}
              </h2>
              <p className="text-sm leading-7 text-slate-600">{data.track.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[var(--shadow-xs)]">
                {data.employee.department ?? "Department not set"}
              </span>
              <span className="rounded-full border border-white bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[var(--shadow-xs)]">
                {data.currentLevel.label}
              </span>
              {data.templateName ? (
                <span className="rounded-full border border-white bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[var(--shadow-xs)]">
                  {data.templateName}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-slate-50/40 p-5 sm:p-6">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Track baseline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-700">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <SummaryTile
                        label="Track"
                        value={data.track.label}
                        note="Role family and growth context"
                      />
                      <SummaryTile
                        label="Current role"
                        value={data.employee.title ?? "Not set"}
                        note="Role title used for baseline"
                      />
                      <SummaryTile
                        label="Department"
                        value={data.employee.department ?? "Not set"}
                        note="Primary discipline or team"
                      />
                      <SummaryTile
                        label="Manager"
                        value={data.employee.managerName ?? "Not set"}
                        note={data.employee.managerTitle ?? "Manager role not set"}
                      />
                    </div>
                    <p className="rounded-[16px] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-900">
                      This demo baseline is currently inferred from department and title. A future
                      admin-managed track framework can replace this with fully configured ladders.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>How growth works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-700">
                    <WorkflowStep
                      title="1. Start with the track"
                      description="Define what good looks like for the role family, not just for the current project."
                    />
                    <WorkflowStep
                      title="2. Review competencies"
                      description="Use the competencies in scope to describe how performance should show up at each level."
                    />
                    <WorkflowStep
                      title="3. Set better goals"
                      description="Choose delivery, capability, and values goals that move the role toward the next level."
                    />
                    <WorkflowStep
                      title="4. Prove progress with evidence"
                      description="Tie feedback, goals, 1:1s, and review outcomes back to the competencies you want to strengthen."
                    />
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="growth-level-framework">
                <CardHeader className="pb-3">
                  <CardTitle>Level expectations</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {data.levelFramework.map((level) => (
                    <div
                      key={level.key}
                      className={`rounded-[20px] border p-4 ${
                        level.isCurrent
                          ? "border-teal-300 bg-teal-50/80 shadow-[var(--shadow-xs)]"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{level.label}</p>
                        {level.isCurrent ? (
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-700">
                            Current
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{level.summary}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card data-testid="growth-competencies">
                <CardHeader className="pb-3">
                  <CardTitle>Competencies required now</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {data.competencies.map((competency) => (
                    <div
                      key={competency.dimensionKey}
                      className="rounded-[20px] border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{competency.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {competency.summary}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {competency.source === "template" ? "In review template" : "Track standard"}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card data-testid="growth-goal-playbook">
                <CardHeader className="pb-3">
                  <CardTitle>Goal setting playbook</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-3">
                  {data.goalPlaybook.map((goal) => (
                    <div
                      key={goal.title}
                      className="rounded-[20px] border border-slate-200 bg-white p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{goal.description}</p>
                      <div className="mt-4 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Example
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{goal.example}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card data-testid="growth-track-examples">
                <CardHeader className="pb-3">
                  <CardTitle>Track examples</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-3">
                  {data.trackExamples.map((example) => (
                    <div
                      key={example.label}
                      className="rounded-[20px] border border-slate-200 bg-white p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">{example.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{example.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {example.competencyLabels.map((label) => (
                          <span
                            key={`${example.label}-${label}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-6">
              <Card data-testid="growth-role-snapshot">
                <CardHeader className="pb-3">
                  <CardTitle>Role snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <SnapshotRow label="Employee" value={data.employee.displayName} />
                  <SnapshotRow label="Track" value={data.track.label} />
                  <SnapshotRow label="Level" value={data.currentLevel.label} />
                  <SnapshotRow label="Role" value={data.employee.title ?? "Not set"} />
                  <SnapshotRow label="Department" value={data.employee.department ?? "Not set"} />
                  <SnapshotRow label="Manager" value={data.employee.managerName ?? "Not set"} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>What this should drive</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>
                    Reviews should measure how performance maps to the track baseline.
                  </p>
                  <p>
                    Goals should make the next level more achievable, not just capture more work.
                  </p>
                  <p>
                    Company values should show up in how the work gets done, not only in final outcomes.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
    </div>
  );
}

function WorkflowStep({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{value}</span>
    </div>
  );
}
