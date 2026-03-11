import Link from "next/link";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionContainer } from "@/components/ui/section-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { getDevRequestContext } from "@/server/auth/request-context";
import { listAdminTracks } from "@/server/grow/grow-service";

export const dynamic = "force-dynamic";

export default async function AdminGrowTracksPage() {
  const context = await getDevRequestContext();
  if (context.role !== UserRole.HR_ADMIN) {
    redirect("/");
  }

  const tracks = await listAdminTracks(context);
  const publishedCount = tracks.filter((track) => track.isPublished).length;
  const assignmentCount = tracks.reduce((sum, track) => sum + track.assignmentCount, 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Grow Admin"
        title="Tracks and ladders"
        description="Stand up publishable tracks, level ladders, and expectation baselines before tying them into goals and reviews."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/grow/assignments">
              <Button variant="outline">Manage assignments</Button>
            </Link>
            <Link href="/admin/grow/tracks/new">
              <Button>Create track</Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tracks in catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{tracks.length}</p>
            <p className="text-sm text-slate-500">Draft and published tracks together.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{publishedCount}</p>
            <p className="text-sm text-slate-500">Employee-visible track baselines.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignments mapped</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{assignmentCount}</p>
            <p className="text-sm text-slate-500">Employees already tied to a level.</p>
          </CardContent>
        </Card>
      </section>

      {tracks.length === 0 ? (
        <EmptyState
          title="No grow tracks yet"
          description="Create the first track and level ladder so employees can understand what good looks like at each level."
          action={
            <Link href="/admin/grow/tracks/new">
              <Button>Create first track</Button>
            </Link>
          }
        />
      ) : (
        <SectionContainer variant="warm" className="p-3">
          <Card>
            <CardContent className="p-0">
              <TableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Track</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Levels</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tracks.map((track) => (
                      <TableRow key={track.id}>
                        <TableCell>
                          <p className="font-semibold text-slate-900">{track.name}</p>
                          <p className="text-xs text-slate-500">{track.slug}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-800">{track.trackGroup.name}</p>
                          <p className="text-xs text-slate-500">Order {track.trackGroup.sortOrder}</p>
                        </TableCell>
                        <TableCell className="space-y-2">
                          <p className="text-sm text-slate-700">
                            {track.levelCount} {track.levelCount === 1 ? "level" : "levels"}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {track.levels.map((level) => (
                              <Badge key={level.id} variant="neutral">
                                L{level.levelOrder} · {level.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{track.assignmentCount}</TableCell>
                        <TableCell>
                          <Badge variant={track.isPublished ? "success" : "warning"}>
                            {track.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/grow/tracks/${track.id}`}>
                            <Button size="sm" variant="outline">
                              Edit track
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </CardContent>
          </Card>
        </SectionContainer>
      )}
    </div>
  );
}
