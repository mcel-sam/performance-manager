import { CompetencyAlignmentLabel, UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  createCompetencyAlignmentComment,
  createTrack,
} from "@/server/grow/grow-service";

function buildGrowDbMock() {
  return {
    employee: {
      findFirst: vi.fn(),
    },
    competency: {
      count: vi.fn(),
    },
    trackGroup: {
      create: vi.fn(),
    },
    track: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    trackLevel: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    employeeTrackAssignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    competencyAlignmentComment: {
      create: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  };
}

const hrContext = {
  userId: "user_hr_admin_1",
  orgId: "org_demo_1",
  role: UserRole.HR_ADMIN,
};

const employeeContext = {
  userId: "user_employee_1",
  orgId: "org_demo_1",
  role: UserRole.EMPLOYEE,
};

describe("createTrack", () => {
  it("blocks non-admins from creating tracks", async () => {
    const db = buildGrowDbMock();

    await expect(
      createTrack(
        {
          trackGroup: {
            slug: "engineering",
            name: "Engineering",
          },
          slug: "software",
          name: "Software",
        },
        employeeContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("creates a track and writes an audit event for HR admins", async () => {
    const db = buildGrowDbMock();
    db.competency.count.mockResolvedValue(0);
    db.trackGroup.create.mockResolvedValue({ id: "track_group_1" });
    db.track.create.mockResolvedValue({ id: "track_1", name: "Software" });
    db.employee.findFirst.mockResolvedValue({ id: "emp_hr_admin_1", managerId: null });
    db.track.findFirst.mockResolvedValue({
      id: "track_1",
      slug: "software",
      name: "Software",
      description: "Delivery",
      isPublished: true,
      sortOrder: 0,
      trackGroup: {
        id: "track_group_1",
        slug: "engineering",
        name: "Engineering",
        description: null,
      },
      levels: [],
      assignments: [],
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_1" });

    const result = await createTrack(
      {
        trackGroup: {
          slug: "engineering",
          name: "Engineering",
        },
        slug: "software",
        name: "Software",
        isPublished: true,
      },
      hrContext,
      db as never,
    );

    expect(result.id).toBe("track_1");
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });
});

describe("createCompetencyAlignmentComment", () => {
  it("allows the assigned employee to comment on competency expectations", async () => {
    const db = buildGrowDbMock();
    db.employee.findFirst.mockResolvedValue({
      id: "emp_employee_1",
      managerId: "emp_manager_1",
    });
    db.employeeTrackAssignment.findFirst.mockResolvedValue({
      id: "assignment_1",
      employee: {
        id: "emp_employee_1",
        managerId: "emp_manager_1",
      },
    });
    db.competencyAlignmentComment.create.mockResolvedValue({
      id: "comment_1",
      employeeTrackAssignmentId: "assignment_1",
      competencyId: "competency_1",
      label: CompetencyAlignmentLabel.STRENGTH,
      note: "Strong stakeholder communication",
      createdAt: new Date("2026-03-05T00:00:00.000Z"),
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_1" });

    const result = await createCompetencyAlignmentComment(
      "competency_1",
      {
        employeeTrackAssignmentId: "assignment_1",
        label: CompetencyAlignmentLabel.STRENGTH,
        note: "Strong stakeholder communication",
      },
      employeeContext,
      db as never,
    );

    expect(result.id).toBe("comment_1");
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });
});
