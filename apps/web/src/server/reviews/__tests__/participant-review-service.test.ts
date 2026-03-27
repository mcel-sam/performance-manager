import {
  CycleStatus,
  EvidenceType,
  ReviewQuestionType,
  ReviewRelationship,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  getWriteReviewData,
  listAssignedReviewTasks,
  submitReviewSubmission,
} from "@/server/reviews/participant-review-service";

function buildDbMock() {
  return {
    employee: {
      findFirst: vi.fn(),
    },
    reviewSubmission: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    reviewTemplate: {
      findFirst: vi.fn(),
    },
    goalCycle: {
      findFirst: vi.fn(),
    },
    goal: {
      findMany: vi.fn(),
    },
    reviewAnswer: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    evidenceItem: {
      groupBy: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  };
}

const reviewerContext = {
  userId: "user_employee_1",
  orgId: "org_demo_1",
  role: UserRole.EMPLOYEE,
};

const hrAdminContext = {
  userId: "user_hr_admin_1",
  orgId: "org_demo_1",
  role: UserRole.HR_ADMIN,
};

const submissionRecord = {
  id: "submission_seed_employee_self_1",
  orgId: "org_demo_1",
  cycleId: "cycle_seed_draft_1",
  packetId: "packet_seed_employee_1",
  status: ReviewSubmissionStatus.IN_PROGRESS,
  submittedAt: null,
  relationship: ReviewRelationship.SELF,
  subjectEmployeeId: "emp_employee_1",
  reviewerEmployee: {
    id: "emp_employee_1",
    userId: "user_employee_1",
    firstName: "Elliot",
    lastName: "Employee",
  },
  subjectEmployee: {
    id: "emp_employee_1",
    managerId: "emp_manager_1",
    firstName: "Elliot",
    lastName: "Employee",
    department: "Projects",
    title: "Foreman",
  },
  cycle: {
    id: "cycle_seed_draft_1",
    name: "Seed Draft Cycle",
    status: CycleStatus.ACTIVE,
    endDate: new Date("2026-03-31T00:00:00.000Z"),
    template: {
      id: "template_default_1",
      name: "Default Performance Template",
      questions: [
        {
          id: "template_q_1",
          prompt: "Required question 1",
          questionType: ReviewQuestionType.TEXT,
          dimensionKey: null,
          isRequired: true,
          sortOrder: 1,
        },
        {
          id: "template_q_2",
          prompt: "Required question 2",
          questionType: ReviewQuestionType.TEXT,
          dimensionKey: null,
          isRequired: true,
          sortOrder: 2,
        },
      ],
    },
  },
};

describe("submitReviewSubmission", () => {
  it("fails when required questions are missing", async () => {
    const db = buildDbMock();

    db.reviewSubmission.findFirst.mockResolvedValue(submissionRecord);
    db.reviewAnswer.findMany.mockResolvedValue([
      {
        id: "answer_1",
        questionId: "template_q_1",
        responseText: "Completed work",
        scaleRating: null,
        notObserved: false,
      },
    ]);

    await expect(
      submitReviewSubmission(
        "cycle_seed_draft_1",
        "submission_seed_employee_self_1",
        reviewerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
      details: {
        missingQuestionIds: ["template_q_2"],
      },
    });

    expect(db.reviewSubmission.update).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("treats whitespace-only required responses as missing on submit", async () => {
    const db = buildDbMock();

    db.reviewSubmission.findFirst.mockResolvedValue(submissionRecord);
    db.reviewAnswer.findMany.mockResolvedValue([
      {
        id: "answer_1",
        questionId: "template_q_1",
        responseText: "   ",
        scaleRating: null,
        notObserved: false,
      },
      {
        id: "answer_2",
        questionId: "template_q_2",
        responseText: "Completed goal updates",
        scaleRating: null,
        notObserved: false,
      },
    ]);

    await expect(
      submitReviewSubmission(
        "cycle_seed_draft_1",
        "submission_seed_employee_self_1",
        reviewerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
      details: {
        missingQuestionIds: ["template_q_1"],
      },
    });

    expect(db.reviewSubmission.update).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("succeeds when all required questions are answered", async () => {
    const db = buildDbMock();

    db.reviewSubmission.findFirst.mockResolvedValue(submissionRecord);
    db.reviewAnswer.findMany.mockResolvedValue([
      {
        id: "answer_1",
        questionId: "template_q_1",
        responseText: "Completed work",
        scaleRating: null,
        notObserved: false,
      },
      {
        id: "answer_2",
        questionId: "template_q_2",
        responseText: "Growth plan",
        scaleRating: null,
        notObserved: false,
      },
    ]);
    db.reviewSubmission.update.mockResolvedValue({
      id: "submission_seed_employee_self_1",
      status: ReviewSubmissionStatus.SUBMITTED,
      submittedAt: new Date("2026-03-15T09:00:00.000Z"),
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_submit_1" });

    const result = await submitReviewSubmission(
      "cycle_seed_draft_1",
      "submission_seed_employee_self_1",
      reviewerContext,
      db as never,
    );

    expect(result.status).toBe(ReviewSubmissionStatus.SUBMITTED);
    expect(db.reviewSubmission.update).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("requires scale questions to have a rating or not-observed flag", async () => {
    const db = buildDbMock();
    db.reviewSubmission.findFirst.mockResolvedValue({
      ...submissionRecord,
      cycle: {
        ...submissionRecord.cycle,
        template: {
          ...submissionRecord.cycle.template,
          questions: [
            submissionRecord.cycle.template.questions[0],
            {
              ...submissionRecord.cycle.template.questions[1],
              questionType: ReviewQuestionType.SCALE_1_TO_5,
            },
          ],
        },
      },
    });
    db.reviewAnswer.findMany.mockResolvedValue([
      {
        id: "answer_1",
        questionId: "template_q_1",
        responseText: "Completed work",
        scaleRating: null,
        notObserved: false,
      },
      {
        id: "answer_2",
        questionId: "template_q_2",
        responseText: "Performance comment without numeric rating",
        scaleRating: null,
        notObserved: false,
      },
    ]);

    await expect(
      submitReviewSubmission(
        "cycle_seed_draft_1",
        "submission_seed_employee_self_1",
        reviewerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
      details: {
        missingQuestionIds: ["template_q_2"],
      },
    });
  });

  it("accepts required scale question when marked not observed with comment", async () => {
    const db = buildDbMock();
    db.reviewSubmission.findFirst.mockResolvedValue({
      ...submissionRecord,
      cycle: {
        ...submissionRecord.cycle,
        template: {
          ...submissionRecord.cycle.template,
          questions: [
            submissionRecord.cycle.template.questions[0],
            {
              ...submissionRecord.cycle.template.questions[1],
              questionType: ReviewQuestionType.SCALE_1_TO_5,
            },
          ],
        },
      },
    });
    db.reviewAnswer.findMany.mockResolvedValue([
      {
        id: "answer_1",
        questionId: "template_q_1",
        responseText: "Completed work",
        scaleRating: null,
        notObserved: false,
      },
      {
        id: "answer_2",
        questionId: "template_q_2",
        responseText: "Not enough interaction this cycle to observe.",
        scaleRating: null,
        notObserved: true,
      },
    ]);
    db.reviewSubmission.update.mockResolvedValue({
      id: "submission_seed_employee_self_1",
      status: ReviewSubmissionStatus.SUBMITTED,
      submittedAt: new Date("2026-03-15T09:00:00.000Z"),
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_submit_2" });

    const result = await submitReviewSubmission(
      "cycle_seed_draft_1",
      "submission_seed_employee_self_1",
      reviewerContext,
      db as never,
    );

    expect(result.status).toBe(ReviewSubmissionStatus.SUBMITTED);
  });
});

describe("listAssignedReviewTasks", () => {
  it("keeps HR admins scoped to reviews actually assigned to them", async () => {
    const db = buildDbMock();
    db.reviewSubmission.findMany.mockResolvedValue([]);

    await listAssignedReviewTasks(hrAdminContext, db as never);

    expect(db.reviewSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          orgId: "org_demo_1",
          reviewerEmployee: {
            userId: "user_hr_admin_1",
          },
        },
      }),
    );
  });

  it("limits the active queue to vanilla review types on non-draft cycles", async () => {
    const db = buildDbMock();
    db.reviewSubmission.findMany.mockResolvedValue([
      {
        id: "submission_self",
        cycleId: "cycle_active",
        relationship: ReviewRelationship.SELF,
        status: ReviewSubmissionStatus.NOT_STARTED,
        updatedAt: new Date("2026-03-15T10:00:00.000Z"),
        submittedAt: null,
        cycle: {
          id: "cycle_active",
          name: "Annual 2026",
          endDate: new Date("2026-12-31T00:00:00.000Z"),
          status: CycleStatus.ACTIVE,
        },
        subjectEmployee: {
          firstName: "Ted",
          lastName: "Tederoff",
          avatarUrl: null,
        },
      },
      {
        id: "submission_peer",
        cycleId: "cycle_active",
        relationship: ReviewRelationship.PEER,
        status: ReviewSubmissionStatus.NOT_STARTED,
        updatedAt: new Date("2026-03-15T11:00:00.000Z"),
        submittedAt: null,
        cycle: {
          id: "cycle_active",
          name: "Annual 2026",
          endDate: new Date("2026-12-31T00:00:00.000Z"),
          status: CycleStatus.ACTIVE,
        },
        subjectEmployee: {
          firstName: "Ted",
          lastName: "Tederoff",
          avatarUrl: null,
        },
      },
      {
        id: "submission_manager_draft",
        cycleId: "cycle_draft",
        relationship: ReviewRelationship.MANAGER,
        status: ReviewSubmissionStatus.NOT_STARTED,
        updatedAt: new Date("2026-03-15T12:00:00.000Z"),
        submittedAt: null,
        cycle: {
          id: "cycle_draft",
          name: "Draft 2026",
          endDate: new Date("2026-12-31T00:00:00.000Z"),
          status: CycleStatus.DRAFT,
        },
        subjectEmployee: {
          firstName: "Ted",
          lastName: "Tederoff",
          avatarUrl: null,
        },
      },
    ]);

    const tasks = await listAssignedReviewTasks(reviewerContext, db as never);

    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.relationship).toBe(ReviewRelationship.SELF);
  });
});

describe("getWriteReviewData permissions", () => {
  it("returns subject role context for the write-review workspace", async () => {
    const db = buildDbMock();
    db.reviewSubmission.findFirst.mockResolvedValue(submissionRecord);
    db.reviewAnswer.findMany.mockResolvedValue([]);
    db.employee.findFirst.mockImplementation(async (args: { where: { userId?: string; id?: string } }) => {
      if (args.where.userId === "user_employee_1") {
        return {
          id: "emp_employee_1",
          managerId: "emp_manager_1",
          directReports: [],
        };
      }

      if (args.where.id === "emp_employee_1") {
        return {
          id: "emp_employee_1",
          firstName: "Elliot",
          lastName: "Employee",
          title: "Foreman",
          department: "Projects",
          manager: {
            firstName: "Morgan",
            lastName: "Patel",
            title: "Manager",
          },
        };
      }

      return null;
    });
    db.reviewTemplate.findFirst.mockResolvedValue({
      id: "template_default_1",
      name: "Default Performance Template",
      questions: [],
    });
    db.goalCycle.findFirst.mockResolvedValue({
      id: "goal_cycle_active_1",
      name: "Q4 2026",
    });
    db.goal.findMany.mockResolvedValue([
      {
        id: "goal_1",
        orgId: "org_demo_1",
        cycleId: "goal_cycle_active_1",
        ownerEmployeeId: "emp_employee_1",
        title: "Improve project handoff reliability",
        description: null,
        status: "ON_TRACK",
        progressPercent: 72,
        visibility: "TEAM",
        parentGoalId: null,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        ownerEmployee: {
          id: "emp_employee_1",
          userId: "user_employee_1",
          managerId: "emp_manager_1",
          firstName: "Elliot",
          lastName: "Employee",
        },
        _count: {
          updates: 1,
        },
        updates: [
          {
            id: "goal_update_1",
            note: "Weekly handoff checklist is live across the crew.",
            createdAt: new Date("2026-03-10T00:00:00.000Z"),
          },
        ],
      },
    ]);

    const result = await getWriteReviewData(
      "cycle_seed_draft_1",
      "submission_seed_employee_self_1",
      reviewerContext,
      db as never,
    );

    expect(result.submission.subjectDepartment).toBe("Projects");
    expect(result.submission.subjectTitle).toBe("Foreman");
    expect(result.evidenceCounts).toEqual({
      [EvidenceType.FEEDBACK]: 0,
      [EvidenceType.UPDATE]: 0,
      [EvidenceType.ONE_ON_ONE]: 0,
      [EvidenceType.GOAL]: 0,
      [EvidenceType.GOAL_UPDATE]: 0,
      [EvidenceType.VALUE_RECOGNITION]: 0,
    });
    expect(result.goalContext?.goals[0]?.title).toBe("Improve project handoff reliability");
    expect(result.trackContext?.trackLabel).toBe("Projects");
    expect(result.questions[0]?.prompt).toBe(
      "What were your most meaningful accomplishments and business results this cycle?",
    );
  });

  it("denies access when reviewer does not match", async () => {
    const db = buildDbMock();
    db.reviewSubmission.findFirst.mockResolvedValue({
      ...submissionRecord,
      reviewerEmployee: {
        ...submissionRecord.reviewerEmployee,
        userId: "user_other_reviewer",
      },
    });

    await expect(
      getWriteReviewData(
        "cycle_seed_draft_1",
        "submission_seed_employee_self_1",
        reviewerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("denies HR admin access when they are not the assigned reviewer", async () => {
    const db = buildDbMock();
    db.reviewSubmission.findFirst.mockResolvedValue({
      ...submissionRecord,
      reviewerEmployee: {
        ...submissionRecord.reviewerEmployee,
        userId: "user_other_reviewer",
      },
    });

    await expect(
      getWriteReviewData(
        "cycle_seed_draft_1",
        "submission_seed_employee_self_1",
        hrAdminContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("denies manager review access until the self review is submitted", async () => {
    const db = buildDbMock();
    db.reviewSubmission.findFirst
      .mockResolvedValueOnce({
        ...submissionRecord,
        id: "submission_manager_1",
        relationship: ReviewRelationship.MANAGER,
        reviewerEmployee: {
          id: "emp_manager_1",
          userId: "user_manager_1",
          firstName: "Elliot",
          lastName: "Mah",
        },
        subjectEmployee: {
          ...submissionRecord.subjectEmployee,
          managerId: "emp_manager_1",
        },
      })
      .mockResolvedValueOnce({
        ...submissionRecord,
        id: "submission_self_1",
        relationship: ReviewRelationship.SELF,
        status: ReviewSubmissionStatus.IN_PROGRESS,
      });

    await expect(
      getWriteReviewData(
        "cycle_seed_draft_1",
        "submission_manager_1",
        {
          userId: "user_manager_1",
          orgId: "org_demo_1",
          role: UserRole.MANAGER,
        },
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("denies non-vanilla review submissions in the active workflow", async () => {
    const db = buildDbMock();
    db.reviewSubmission.findFirst.mockResolvedValue({
      ...submissionRecord,
      relationship: ReviewRelationship.PEER,
    });

    await expect(
      getWriteReviewData(
        "cycle_seed_draft_1",
        "submission_seed_employee_self_1",
        reviewerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});
