"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";

interface GoalCycleSelectorProps {
  cycles: Array<{
    id: string;
    name: string;
  }>;
  selectedCycleId: string;
  label?: string;
  paramName?: string;
}

export function GoalCycleSelector({
  cycles,
  selectedCycleId,
  label = "Goal cycle",
  paramName = "cycleId",
}: GoalCycleSelectorProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(nextCycleId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextCycleId) {
      params.set(paramName, nextCycleId);
    } else {
      params.delete(paramName);
    }

    const serialized = params.toString();
    router.replace(serialized.length > 0 ? `${pathname}?${serialized}` : pathname);
  }

  return (
    <label className="flex min-w-[220px] flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <Select
        value={selectedCycleId}
        onChange={(event) => handleChange(event.target.value)}
        data-testid="goal-cycle-selector"
      >
        {cycles.map((cycle) => (
          <option key={cycle.id} value={cycle.id}>
            {cycle.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
