"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";

interface CompetencyOption {
  id: string;
  slug: string;
  name: string;
  dimensionKey: string | null;
  theme: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface TrackGroupOption {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

interface GrowTrackFormProps {
  auth: {
    userId: string;
    orgId: string;
  };
  mode: "create" | "edit";
  trackId?: string;
  trackGroups: TrackGroupOption[];
  competencies: CompetencyOption[];
  initialValues?: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    isPublished: boolean;
    sortOrder: number;
    trackGroup: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
    };
    levels: Array<{
      id: string;
      slug: string;
      name: string;
      description: string | null;
      levelOrder: number;
      expectations: Array<{
        competency: {
          id: string;
        };
        expectation: string;
      }>;
    }>;
  };
}

interface ExpectationDraft {
  competencyId: string;
  expectation: string;
}

interface LevelDraft {
  slug: string;
  name: string;
  description: string;
  levelOrder: number;
  expectations: ExpectationDraft[];
}

function blankLevel(levelOrder: number): LevelDraft {
  return {
    slug: "",
    name: "",
    description: "",
    levelOrder,
    expectations: [{ competencyId: "", expectation: "" }],
  };
}

export default function GrowTrackForm({
  auth,
  mode,
  trackId,
  trackGroups,
  competencies,
  initialValues,
}: GrowTrackFormProps) {
  const router = useRouter();
  const [groupMode, setGroupMode] = useState<"existing" | "new">(
    initialValues?.trackGroup?.id || trackGroups.length > 0 ? "existing" : "new",
  );
  const [trackGroupId, setTrackGroupId] = useState(initialValues?.trackGroup.id ?? trackGroups[0]?.id ?? "");
  const [newTrackGroupSlug, setNewTrackGroupSlug] = useState("");
  const [newTrackGroupName, setNewTrackGroupName] = useState("");
  const [newTrackGroupDescription, setNewTrackGroupDescription] = useState("");
  const [newTrackGroupSortOrder, setNewTrackGroupSortOrder] = useState("0");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [isPublished, setIsPublished] = useState(initialValues?.isPublished ?? false);
  const [sortOrder, setSortOrder] = useState(String(initialValues?.sortOrder ?? 0));
  const [levels, setLevels] = useState<LevelDraft[]>(
    initialValues?.levels?.length
      ? initialValues.levels.map((level) => ({
          slug: level.slug,
          name: level.name,
          description: level.description ?? "",
          levelOrder: level.levelOrder,
          expectations: level.expectations.length
            ? level.expectations.map((expectation) => ({
                competencyId: expectation.competency.id,
                expectation: expectation.expectation,
              }))
            : [{ competencyId: "", expectation: "" }],
        }))
      : [blankLevel(1)],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateLevel(levelIndex: number, nextLevel: LevelDraft) {
    setLevels((current) =>
      current.map((level, index) => (index === levelIndex ? nextLevel : level)),
    );
  }

  function addLevel() {
    setLevels((current) => [...current, blankLevel(current.length + 1)]);
  }

  function removeLevel(levelIndex: number) {
    setLevels((current) =>
      current
        .filter((_, index) => index !== levelIndex)
        .map((level, index) => ({
          ...level,
          levelOrder: index + 1,
        })),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...(groupMode === "existing"
          ? { trackGroupId }
          : {
              trackGroup: {
                slug: newTrackGroupSlug,
                name: newTrackGroupName,
                description: normalizeNullableString(newTrackGroupDescription),
                sortOrder: Number(newTrackGroupSortOrder),
              },
            }),
        slug,
        name,
        description: normalizeNullableString(description),
        isPublished,
        sortOrder: Number(sortOrder),
        levels: levels.map((level, index) => ({
          slug: level.slug,
          name: level.name,
          description: normalizeNullableString(level.description),
          levelOrder: index + 1,
          expectations: level.expectations
            .filter(
              (expectation) =>
                expectation.competencyId.trim().length > 0 &&
                expectation.expectation.trim().length > 0,
            )
            .map((expectation) => ({
              competencyId: expectation.competencyId,
              expectation: expectation.expectation,
            })),
        })),
      };

      const response = await fetch(
        mode === "create" ? "/api/grow/tracks" : `/api/grow/tracks/${trackId ?? ""}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "content-type": "application/json",
            "x-user-id": auth.userId,
            "x-org-id": auth.orgId,
          },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as {
        message?: string;
        track?: {
          id: string;
        };
      };

      if (!response.ok || !result.track) {
        throw new Error(result.message ?? "Unable to save track");
      }

      router.push(`/admin/grow/tracks/${result.track.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save track");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create grow track" : "Edit grow track"}</CardTitle>
        <CardDescription>
          Define the group, level ladder, and competency expectations that anchor future goal and review context.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8" data-testid="grow-track-form">
          <section className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Track name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Slug</span>
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} required />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Describe how this track differs from adjacent paths."
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Sort order</span>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </label>

            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
              />
              <span className="text-sm text-slate-800">Published and employee-visible</span>
            </label>
          </section>

          <section className="space-y-4 rounded-[var(--radius-lg)] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold text-slate-900">Track group</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={groupMode === "existing" ? "primary" : "outline"}
                  onClick={() => setGroupMode("existing")}
                >
                  Existing
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={groupMode === "new" ? "primary" : "outline"}
                  onClick={() => setGroupMode("new")}
                >
                  New group
                </Button>
              </div>
            </div>

            {groupMode === "existing" ? (
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Choose group</span>
                <Select
                  value={trackGroupId}
                  onChange={(event) => setTrackGroupId(event.target.value)}
                  required
                >
                  <option value="">Select group</option>
                  {trackGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
              </label>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Group name</span>
                  <Input
                    value={newTrackGroupName}
                    onChange={(event) => setNewTrackGroupName(event.target.value)}
                    required
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Group slug</span>
                  <Input
                    value={newTrackGroupSlug}
                    onChange={(event) => setNewTrackGroupSlug(event.target.value)}
                    required
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Group description</span>
                  <Textarea
                    value={newTrackGroupDescription}
                    onChange={(event) => setNewTrackGroupDescription(event.target.value)}
                    rows={2}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Group sort order</span>
                  <Input
                    type="number"
                    min={0}
                    value={newTrackGroupSortOrder}
                    onChange={(event) => setNewTrackGroupSortOrder(event.target.value)}
                  />
                </label>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Levels + expectations</h3>
                <p className="text-sm text-slate-500">
                  Capture what changes across the ladder and which competencies define the level.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addLevel} data-testid="grow-track-level-add">
                Add level
              </Button>
            </div>

            {levels.map((level, levelIndex) => (
              <Card key={`level-${levelIndex}`} className="border border-slate-200">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        Level {levelIndex + 1}
                      </CardTitle>
                      <Badge variant="info">Order {level.levelOrder}</Badge>
                    </div>
                    {levels.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeLevel(levelIndex)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-sm font-medium text-slate-700">Level name</span>
                      <Input
                        value={level.name}
                        onChange={(event) =>
                          updateLevel(levelIndex, {
                            ...level,
                            name: event.target.value,
                          })
                        }
                        required
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-medium text-slate-700">Level slug</span>
                      <Input
                        value={level.slug}
                        onChange={(event) =>
                          updateLevel(levelIndex, {
                            ...level,
                            slug: event.target.value,
                          })
                        }
                        required
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">Description</span>
                      <Textarea
                        value={level.description}
                        onChange={(event) =>
                          updateLevel(levelIndex, {
                            ...level,
                            description: event.target.value,
                          })
                        }
                        rows={2}
                      />
                    </label>
                  </div>

                  <div className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Competency expectations</h4>
                        <p className="text-xs text-slate-500">
                          Tie each expectation to a competency already in the library.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateLevel(levelIndex, {
                            ...level,
                            expectations: [...level.expectations, { competencyId: "", expectation: "" }],
                          })
                        }
                      >
                        Add expectation
                      </Button>
                    </div>

                    {level.expectations.map((expectation, expectationIndex) => (
                      <div
                        key={`expectation-${levelIndex}-${expectationIndex}`}
                        className="grid gap-3 rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 md:grid-cols-[240px_minmax(0,1fr)_auto]"
                      >
                        <label className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Competency
                          </span>
                          <Select
                            value={expectation.competencyId}
                            onChange={(event) =>
                              updateLevel(levelIndex, {
                                ...level,
                                expectations: level.expectations.map((item, index) =>
                                  index === expectationIndex
                                    ? {
                                        ...item,
                                        competencyId: event.target.value,
                                      }
                                    : item,
                                ),
                              })
                            }
                          >
                            <option value="">Select competency</option>
                            {competencies.map((competency) => (
                              <option key={competency.id} value={competency.id}>
                                {competency.name}
                                {competency.theme ? ` · ${competency.theme.name}` : ""}
                              </option>
                            ))}
                          </Select>
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Expectation
                          </span>
                          <Textarea
                            value={expectation.expectation}
                            onChange={(event) =>
                              updateLevel(levelIndex, {
                                ...level,
                                expectations: level.expectations.map((item, index) =>
                                  index === expectationIndex
                                    ? {
                                        ...item,
                                        expectation: event.target.value,
                                      }
                                    : item,
                                ),
                              })
                            }
                            rows={3}
                            placeholder="Describe how this competency should show up at this level."
                          />
                        </label>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateLevel(levelIndex, {
                                ...level,
                                expectations:
                                  level.expectations.length === 1
                                    ? [{ competencyId: "", expectation: "" }]
                                    : level.expectations.filter((_, index) => index !== expectationIndex),
                              })
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting} data-testid="grow-track-submit">
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create track"
                  : "Save track"}
            </Button>
            {message ? (
              <Toast variant={message.toLowerCase().includes("unable") ? "error" : "success"}>
                {message}
              </Toast>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function normalizeNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
