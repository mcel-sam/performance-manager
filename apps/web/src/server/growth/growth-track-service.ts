import { CompetencyDimensionKey } from "@prisma/client";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

interface GrowthTrackDb {
  employee: {
    findFirst: (args: {
      where: {
        orgId: string;
        userId?: string;
        id?: string;
      };
      select: {
        id: true;
        firstName: true;
        lastName: true;
        title: true;
        department: true;
        manager: {
          select: {
            firstName: true;
            lastName: true;
            title: true;
          };
        };
      };
    }) => Promise<{
      id: string;
      firstName: string;
      lastName: string;
      title: string | null;
      department: string | null;
      manager: {
        firstName: string;
        lastName: string;
        title: string | null;
      } | null;
    } | null>;
  };
  reviewTemplate: {
    findFirst: (args: {
      where: {
        orgId: string;
        isDefault: true;
      };
      select: {
        id: true;
        name: true;
        questions: {
          select: {
            dimensionKey: true;
            isRequired: true;
          };
        };
      };
    }) => Promise<{
      id: string;
      name: string;
      questions: Array<{
        dimensionKey: CompetencyDimensionKey | null;
        isRequired: boolean;
      }>;
    } | null>;
  };
}

type TrackLevelKey = "junior" | "associate" | "senior" | "lead";

interface TrackDefinition {
  id: string;
  label: string;
  summary: string;
  departmentKeywords: string[];
  titleKeywords: string[];
  coreCompetencies: CompetencyDimensionKey[];
  deliveryExample: string;
  capabilityExample: string;
  valuesExample: string;
}

interface GrowthLevelDefinition {
  key: TrackLevelKey;
  label: string;
  summary: string;
}

export interface GrowthTrackBaseline {
  trackId: string;
  trackLabel: string;
  levelKey: TrackLevelKey;
  levelLabel: string;
}

export interface GrowthTrackData {
  employee: {
    displayName: string;
    title: string | null;
    department: string | null;
    managerName: string | null;
    managerTitle: string | null;
  };
  track: {
    id: string;
    label: string;
    summary: string;
  };
  currentLevel: GrowthLevelDefinition;
  levelFramework: Array<GrowthLevelDefinition & { isCurrent: boolean }>;
  competencies: Array<{
    dimensionKey: CompetencyDimensionKey;
    label: string;
    summary: string;
    source: "template" | "track";
  }>;
  goalPlaybook: Array<{
    title: string;
    description: string;
    example: string;
  }>;
  trackExamples: Array<{
    label: string;
    summary: string;
    competencyLabels: string[];
  }>;
  templateName: string | null;
}

const trackDefinitions: TrackDefinition[] = [
  {
    id: "software",
    label: "Software",
    summary: "Build reliable systems, ship safely, and make technical tradeoffs visible to the team.",
    departmentKeywords: ["software", "engineering", "product"],
    titleKeywords: ["engineer", "developer"],
    coreCompetencies: [
      CompetencyDimensionKey.TECHNICAL_SKILLS,
      CompetencyDimensionKey.QUALITY_OF_WORK,
      CompetencyDimensionKey.COMMUNICATION,
      CompetencyDimensionKey.ACCOUNTABILITY,
    ],
    deliveryExample: "Reduce production regressions while improving release confidence across the quarter.",
    capabilityExample: "Strengthen system design and cross-team technical communication on complex work.",
    valuesExample: "Show accountability by raising risks early and following through on ownership.",
  },
  {
    id: "data",
    label: "Data",
    summary: "Turn ambiguous questions into trustworthy analysis, clear recommendations, and usable decisions.",
    departmentKeywords: ["data", "analytics", "business intelligence"],
    titleKeywords: ["analyst", "data"],
    coreCompetencies: [
      CompetencyDimensionKey.JUDGMENT_DECISION_MAKING,
      CompetencyDimensionKey.QUALITY_OF_WORK,
      CompetencyDimensionKey.COMMUNICATION,
      CompetencyDimensionKey.RESULTS_DRIVEN,
    ],
    deliveryExample: "Improve reporting quality and shorten the time from request to insight.",
    capabilityExample: "Level up analytical framing and stakeholder communication on recommendations.",
    valuesExample: "Model clarity and accountability by making assumptions and limitations explicit.",
  },
  {
    id: "operations",
    label: "Operations",
    summary: "Keep execution safe, reliable, and coordinated while maintaining a visible operating rhythm.",
    departmentKeywords: ["operations"],
    titleKeywords: ["operator", "dispatcher", "supervisor", "foreman"],
    coreCompetencies: [
      CompetencyDimensionKey.SAFETY_COMPLIANCE,
      CompetencyDimensionKey.RESULTS_DRIVEN,
      CompetencyDimensionKey.COMMUNICATION,
      CompetencyDimensionKey.ACCOUNTABILITY,
    ],
    deliveryExample: "Improve handoff reliability and keep weekly execution against plan visible.",
    capabilityExample: "Build stronger crew coordination and decision-making under changing field conditions.",
    valuesExample: "Reinforce safety and accountability through earlier blocker escalation.",
  },
  {
    id: "projects",
    label: "Projects",
    summary: "Coordinate delivery, quality, and stakeholder alignment from planning through closeout.",
    departmentKeywords: ["projects"],
    titleKeywords: ["coordinator", "foreman", "project"],
    coreCompetencies: [
      CompetencyDimensionKey.QUALITY_OF_WORK,
      CompetencyDimensionKey.COMMUNICATION,
      CompetencyDimensionKey.RESULTS_DRIVEN,
      CompetencyDimensionKey.RELATIONSHIP_BUILDING,
    ],
    deliveryExample: "Improve plan reliability and reduce rework through tighter closeout discipline.",
    capabilityExample: "Strengthen stakeholder communication and cross-functional planning quality.",
    valuesExample: "Make commitments and ownership visible so dependencies do not get lost.",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    summary: "Protect reliability, safety, and readiness through disciplined execution and preventative planning.",
    departmentKeywords: ["maintenance"],
    titleKeywords: ["operator", "technician", "maintenance"],
    coreCompetencies: [
      CompetencyDimensionKey.SAFETY_COMPLIANCE,
      CompetencyDimensionKey.TECHNICAL_SKILLS,
      CompetencyDimensionKey.QUALITY_OF_WORK,
      CompetencyDimensionKey.ACCOUNTABILITY,
    ],
    deliveryExample: "Reduce downtime and improve preventative maintenance completion reliability.",
    capabilityExample: "Deepen troubleshooting judgment and communication during equipment issues.",
    valuesExample: "Show ownership by documenting issues clearly and closing the loop on follow-through.",
  },
  {
    id: "safety",
    label: "Safety",
    summary: "Raise the operational bar by coaching safe behavior, spotting risk early, and improving compliance.",
    departmentKeywords: ["safety"],
    titleKeywords: ["safety"],
    coreCompetencies: [
      CompetencyDimensionKey.SAFETY_COMPLIANCE,
      CompetencyDimensionKey.COMMUNICATION,
      CompetencyDimensionKey.ACCOUNTABILITY,
      CompetencyDimensionKey.VALUES_CULTURE_ALIGNMENT,
    ],
    deliveryExample: "Increase proactive risk reduction and improve consistency in field safety follow-through.",
    capabilityExample: "Strengthen coaching conversations and practical adoption of safety standards.",
    valuesExample: "Model culture and accountability by turning observations into action quickly.",
  },
  {
    id: "business-operations",
    label: "Business Operations",
    summary: "Keep internal workflows clear, dependable, and easy for the rest of the organization to use.",
    departmentKeywords: ["admin", "finance"],
    titleKeywords: ["admin", "coordinator", "office"],
    coreCompetencies: [
      CompetencyDimensionKey.SERVICE_ORIENTED,
      CompetencyDimensionKey.COMMUNICATION,
      CompetencyDimensionKey.QUALITY_OF_WORK,
      CompetencyDimensionKey.ACCOUNTABILITY,
    ],
    deliveryExample: "Improve request turnaround and reduce avoidable handoff friction for internal partners.",
    capabilityExample: "Build stronger prioritization and communication on cross-functional work.",
    valuesExample: "Show service and accountability by making work visible and follow-up dependable.",
  },
];

const competencySummary: Record<CompetencyDimensionKey, string> = {
  VALUES_CULTURE_ALIGNMENT: "Shows company values in day-to-day decisions, collaboration, and follow-through.",
  JUDGMENT_DECISION_MAKING: "Makes sound calls with the right context, tradeoffs, and escalation.",
  SAFETY_COMPLIANCE: "Protects people and work through disciplined safety and compliance behaviors.",
  TECHNICAL_SKILLS: "Applies the craft knowledge and tools required for the role.",
  QUALITY_OF_WORK: "Delivers accurate, complete, and high-standard output.",
  COMMUNICATION: "Keeps stakeholders aligned with clear, timely communication.",
  ACCOUNTABILITY: "Owns commitments, follows through, and makes progress visible.",
  RELATIONSHIP_BUILDING: "Builds trust and productive working relationships across the team.",
  RESULTS_DRIVEN: "Turns plans into outcomes and maintains momentum on commitments.",
  ATTITUDE: "Shows reliability, resilience, and a constructive approach to the work.",
  SERVICE_ORIENTED: "Supports others well and keeps internal or external customers in focus.",
  ADAPTABILITY: "Adjusts effectively as priorities, context, or constraints change.",
};

const exampleTrackKeys = ["software", "data", "operations"] as const;

export async function getGrowthTrackData(
  context: RequestContext,
  db: GrowthTrackDb = prisma as unknown as GrowthTrackDb,
): Promise<GrowthTrackData> {
  const viewer = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      department: true,
      manager: {
        select: {
          firstName: true,
          lastName: true,
          title: true,
        },
      },
    },
  });

  if (!viewer) {
    throw new AppError("NOT_FOUND", "Employee profile not found", 404);
  }

  return getGrowthTrackDataForEmployee(viewer.id, context, db);
}

export async function getGrowthTrackDataForEmployee(
  employeeId: string,
  context: RequestContext,
  db: GrowthTrackDb = prisma as unknown as GrowthTrackDb,
): Promise<GrowthTrackData> {
  const employee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      id: employeeId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      department: true,
      manager: {
        select: {
          firstName: true,
          lastName: true,
          title: true,
        },
      },
    },
  });

  if (!employee) {
    throw new AppError("NOT_FOUND", "Employee profile not found", 404);
  }

  const template = await db.reviewTemplate.findFirst({
    where: {
      orgId: context.orgId,
      isDefault: true,
    },
    select: {
      id: true,
      name: true,
      questions: {
        select: {
          dimensionKey: true,
          isRequired: true,
        },
      },
    },
  });

  const track = resolveTrack(employee.department, employee.title);
  const currentLevel = resolveTrackLevel(employee.title);
  const competencies = resolveCompetencies(track, template?.questions ?? []);

  return {
    employee: {
      displayName: `${employee.firstName} ${employee.lastName}`.trim(),
      title: employee.title,
      department: employee.department,
      managerName: employee.manager
        ? `${employee.manager.firstName} ${employee.manager.lastName}`.trim()
        : null,
      managerTitle: employee.manager?.title ?? null,
    },
    track: {
      id: track.id,
      label: track.label,
      summary: track.summary,
    },
    currentLevel,
    levelFramework: buildLevelFramework(track.label, currentLevel.key),
    competencies,
    goalPlaybook: [
      {
        title: "Delivery goal",
        description: "A measurable outcome goal tied to the track baseline and role expectations.",
        example: track.deliveryExample,
      },
      {
        title: "Capability goal",
        description: "A skill-building goal tied to one or two competencies that need to grow next.",
        example: track.capabilityExample,
      },
      {
        title: "Values goal",
        description: "A behavior goal that shows how the work should align with company values.",
        example: track.valuesExample,
      },
    ],
    trackExamples: exampleTrackKeys.map((key) => {
      const exampleTrack = trackDefinitions.find((entry) => entry.id === key)!;

      return {
        label: exampleTrack.label,
        summary: exampleTrack.summary,
        competencyLabels: exampleTrack.coreCompetencies.map(formatDimensionLabel),
      };
    }),
    templateName: template?.name ?? null,
  };
}

export function inferGrowthTrackBaseline(
  department: string | null,
  title: string | null,
): GrowthTrackBaseline {
  const track = resolveTrack(department, title);
  const level = resolveTrackLevel(title);

  return {
    trackId: track.id,
    trackLabel: track.label,
    levelKey: level.key,
    levelLabel: level.label,
  };
}

function resolveTrack(
  department: string | null,
  title: string | null,
): TrackDefinition {
  const normalizedDepartment = normalizeText(department);
  const normalizedTitle = normalizeText(title);

  const directMatch = trackDefinitions.find((track) =>
    track.departmentKeywords.some((keyword) => normalizedDepartment.includes(keyword)),
  );
  if (directMatch) {
    return directMatch;
  }

  const titleMatch = trackDefinitions.find((track) =>
    track.titleKeywords.some((keyword) => normalizedTitle.includes(keyword)),
  );
  if (titleMatch) {
    return titleMatch;
  }

  return {
    id: "general",
    label: "General",
    summary: "Use the current role baseline, competency expectations, and company values to shape growth goals.",
    departmentKeywords: [],
    titleKeywords: [],
    coreCompetencies: [
      CompetencyDimensionKey.COMMUNICATION,
      CompetencyDimensionKey.ACCOUNTABILITY,
      CompetencyDimensionKey.QUALITY_OF_WORK,
      CompetencyDimensionKey.RESULTS_DRIVEN,
    ],
    deliveryExample: "Improve reliability and visibility on the outcomes your role is expected to deliver.",
    capabilityExample: "Choose one or two competencies that most improve effectiveness in the role.",
    valuesExample: "Translate company values into one concrete behavior you will reinforce consistently.",
  };
}

function resolveTrackLevel(title: string | null): GrowthLevelDefinition {
  const normalizedTitle = normalizeText(title);

  if (/(manager|director|head|principal)/.test(normalizedTitle)) {
    return buildLevelDefinition("lead", "current role");
  }

  if (/(senior|lead|foreman|supervisor|specialist)/.test(normalizedTitle)) {
    return buildLevelDefinition("senior", "current role");
  }

  if (/(junior|trainee|intern|assistant)/.test(normalizedTitle)) {
    return buildLevelDefinition("junior", "current role");
  }

  return buildLevelDefinition("associate", "current role");
}

function buildLevelFramework(
  trackLabel: string,
  currentLevel: TrackLevelKey,
): Array<GrowthLevelDefinition & { isCurrent: boolean }> {
  return (["junior", "associate", "senior", "lead"] as const).map((levelKey) => ({
    ...buildLevelDefinition(levelKey, trackLabel),
    isCurrent: levelKey === currentLevel,
  }));
}

function buildLevelDefinition(
  levelKey: TrackLevelKey,
  trackLabel: string,
): GrowthLevelDefinition {
  switch (levelKey) {
    case "junior":
      return {
        key: "junior",
        label: "Junior",
        summary: `Learns the core workflows of ${trackLabel.toLowerCase()} work and delivers scoped tasks with close support.`,
      };
    case "associate":
      return {
        key: "associate",
        label: "Associate",
        summary: `Owns recurring ${trackLabel.toLowerCase()} work independently and meets the baseline consistently.`,
      };
    case "senior":
      return {
        key: "senior",
        label: "Senior",
        summary: `Handles more ambiguity, improves systems, and raises quality for others in ${trackLabel.toLowerCase()}.`,
      };
    case "lead":
    default:
      return {
        key: "lead",
        label: "Lead / Manager",
        summary: `Sets direction, coaches others, and connects ${trackLabel.toLowerCase()} priorities back to company outcomes.`,
      };
  }
}

function resolveCompetencies(
  track: TrackDefinition,
  questions: Array<{
    dimensionKey: CompetencyDimensionKey | null;
    isRequired: boolean;
  }>,
): Array<{
  dimensionKey: CompetencyDimensionKey;
  label: string;
  summary: string;
  source: "template" | "track";
}> {
  const requiredTemplateDimensions = Array.from(
    new Set(
      questions
        .filter((question) => question.isRequired && question.dimensionKey != null)
        .map((question) => question.dimensionKey as CompetencyDimensionKey),
    ),
  );

  const selectedDimensions =
    requiredTemplateDimensions.length > 0 ? requiredTemplateDimensions : track.coreCompetencies;

  return selectedDimensions.map((dimensionKey) => ({
    dimensionKey,
    label: formatDimensionLabel(dimensionKey),
    summary: competencySummary[dimensionKey],
    source: requiredTemplateDimensions.includes(dimensionKey) ? "template" : "track",
  }));
}

function formatDimensionLabel(value: CompetencyDimensionKey): string {
  return value
    .split("_")
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}

function normalizeText(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}
