import { CycleStatus, ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  getWriteReviewData,
  submitReviewSubmission,
} from "@/server/reviews/participant-review-service";

function buildDbMock() {
  return {
    reviewSubmission: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    reviewTemplate: {
      findFirst: vi.fn(),
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

const submissionRecord = {
  id: "submission_seed_employee_self_1",
  orgId: "org_demo_1",
  cycleId: "cycle_seed_draft_1",
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
    firstName: "Elliot",
    lastName: "Employee",
  },
  cycle: {
    id: "cycle_seed_draft_1",
    name: "Seed Draft Cycle",
    status: CycleStatus.DRAFT,
    endDate: new Date("2026-03-31T00:00:00.000Z"),
    template: {
      id: "template_default_1",
      name: "Default Performance Template",
      questions: [
        {
          id: "template_q_1",
          prompt: "Required question 1",
          isRequired: true,
          sortOrder: 1,
        },
        {
          id: "template_q_2",
          prompt: "Required question 2",
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
      },
      {
        id: "answer_2",
        questionId: "template_q_2",
        responseText: "Growth plan",
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
});

describe("getWriteReviewData permissions", () => {
  it("denies access when reviewer does not match and user is not HR admin", async () => {
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
});
