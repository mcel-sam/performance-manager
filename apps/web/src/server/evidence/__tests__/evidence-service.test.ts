import {
  EvidenceType,
  EvidenceVisibility,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  attachEvidenceToAnswer,
  detachEvidenceFromAnswer,
  listEvidenceForSubject,
} from "@/server/evidence/evidence-service";

function buildDbMock() {
  return {
    employee: {
      findFirst: vi.fn(),
    },
    evidenceItem: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    reviewAnswer: {
      findFirst: vi.fn(),
    },
    answerEvidenceLink: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
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

const answerAccessRecord = {
  id: "answer_1",
  submissionId: "submission_seed_employee_self_1",
  submission: {
    id: "submission_seed_employee_self_1",
    cycleId: "cycle_seed_draft_1",
    subjectEmployeeId: "emp_employee_1",
    status: ReviewSubmissionStatus.IN_PROGRESS,
    reviewerEmployee: {
      id: "emp_employee_1",
      userId: "user_employee_1",
    },
  },
};

describe("attachEvidenceToAnswer", () => {
  it("creates an evidence link and writes an audit event", async () => {
    const db = buildDbMock();

    db.reviewAnswer.findFirst.mockResolvedValue(answerAccessRecord);
    db.employee.findFirst
      .mockResolvedValueOnce({ id: "emp_employee_1", managerId: "emp_manager_1" })
      .mockResolvedValueOnce({ id: "emp_employee_1" });
    db.evidenceItem.findFirst.mockResolvedValue({
      id: "evidence_seed_2",
      subjectEmployeeId: "emp_employee_1",
      authorEmployeeId: "emp_employee_1",
      type: EvidenceType.UPDATE,
      visibility: EvidenceVisibility.PRIVATE,
      content: "Completed migration rollout for the reporting service.",
      occurredAt: new Date("2026-02-12T15:30:00.000Z"),
    });
    db.answerEvidenceLink.upsert.mockResolvedValue({
      id: "link_1",
      answerId: "answer_1",
      evidenceItemId: "evidence_seed_2",
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_attach_1" });

    const result = await attachEvidenceToAnswer(
      {
        answerId: "answer_1",
        evidenceItemId: "evidence_seed_2",
      },
      reviewerContext,
      db as never,
    );

    expect(result.answerId).toBe("answer_1");
    expect(db.answerEvidenceLink.upsert).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("denies attach when user cannot view the evidence item", async () => {
    const db = buildDbMock();

    db.reviewAnswer.findFirst.mockResolvedValue({
      ...answerAccessRecord,
      submission: {
        ...answerAccessRecord.submission,
        reviewerEmployee: {
          id: "emp_peer_1",
          userId: "user_peer_1",
        },
      },
    });
    db.employee.findFirst
      .mockResolvedValueOnce({ id: "emp_employee_1", managerId: "emp_manager_1" })
      .mockResolvedValueOnce({ id: "emp_peer_1" });
    db.evidenceItem.findFirst.mockResolvedValue({
      id: "evidence_hidden_1",
      subjectEmployeeId: "emp_employee_1",
      authorEmployeeId: "emp_manager_1",
      type: EvidenceType.FEEDBACK,
      visibility: EvidenceVisibility.MANAGER_ONLY,
      content: "Manager-only note",
      occurredAt: new Date("2026-02-10T12:00:00.000Z"),
    });

    await expect(
      attachEvidenceToAnswer(
        {
          answerId: "answer_1",
          evidenceItemId: "evidence_hidden_1",
        },
        {
          userId: "user_peer_1",
          orgId: "org_demo_1",
          role: UserRole.EMPLOYEE,
        },
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.answerEvidenceLink.upsert).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("denies attach when user cannot access the answer submission", async () => {
    const db = buildDbMock();

    db.reviewAnswer.findFirst.mockResolvedValue({
      ...answerAccessRecord,
      submission: {
        ...answerAccessRecord.submission,
        reviewerEmployee: {
          id: "emp_other_1",
          userId: "user_other_1",
        },
      },
    });

    await expect(
      attachEvidenceToAnswer(
        {
          answerId: "answer_1",
          evidenceItemId: "evidence_seed_2",
        },
        reviewerContext,
        db as never,
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });

    expect(db.evidenceItem.findFirst).not.toHaveBeenCalled();
    expect(db.answerEvidenceLink.upsert).not.toHaveBeenCalled();
  });
});

describe("detachEvidenceFromAnswer", () => {
  it("removes the evidence link and writes an audit event", async () => {
    const db = buildDbMock();

    db.reviewAnswer.findFirst.mockResolvedValue(answerAccessRecord);
    db.answerEvidenceLink.deleteMany.mockResolvedValue({ count: 1 });
    db.auditEvent.create.mockResolvedValue({ id: "audit_detach_1" });

    const result = await detachEvidenceFromAnswer(
      {
        answerId: "answer_1",
        evidenceItemId: "evidence_seed_2",
      },
      reviewerContext,
      db as never,
    );

    expect(result).toEqual({
      answerId: "answer_1",
      evidenceItemId: "evidence_seed_2",
    });
    expect(db.answerEvidenceLink.deleteMany).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });
});

describe("listEvidenceForSubject", () => {
  it("does not leak unauthorized counts", async () => {
    const db = buildDbMock();

    db.employee.findFirst
      .mockResolvedValueOnce({ id: "emp_employee_1", managerId: "emp_manager_1" })
      .mockResolvedValueOnce({ id: "emp_employee_1" });
    db.evidenceItem.groupBy.mockResolvedValue([
      {
        type: EvidenceType.UPDATE,
        _count: { _all: 1 },
      },
      {
        type: EvidenceType.GOAL,
        _count: { _all: 1 },
      },
    ]);
    db.evidenceItem.findMany.mockImplementation(async (args: { where: { type: EvidenceType } }) => {
      if (args.where.type === EvidenceType.UPDATE) {
        return [
          {
            id: "evidence_visible_1",
            subjectEmployeeId: "emp_employee_1",
            authorEmployeeId: "emp_employee_1",
            type: EvidenceType.UPDATE,
            visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
            content: "Visible update",
            occurredAt: new Date("2026-02-12T15:30:00.000Z"),
          },
        ];
      }

      if (args.where.type === EvidenceType.GOAL) {
        return [
          {
            id: "evidence_visible_2",
            subjectEmployeeId: "emp_employee_1",
            authorEmployeeId: "emp_employee_1",
            type: EvidenceType.GOAL,
            visibility: EvidenceVisibility.PRIVATE,
            content: "Author-private goal note",
            occurredAt: new Date("2026-02-01T15:30:00.000Z"),
          },
        ];
      }

      return [];
    });

    const result = await listEvidenceForSubject(
      {
        subjectEmployeeId: "emp_employee_1",
      },
      reviewerContext,
      db as never,
    );

    expect(result.counts.FEEDBACK).toBe(0);
    expect(result.counts.UPDATE).toBe(1);
    expect(result.counts.GOAL).toBe(1);
    expect(db.evidenceItem.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ authorEmployeeId: "emp_employee_1" }),
            expect.objectContaining({
              visibility: {
                in: expect.arrayContaining([
                  EvidenceVisibility.ORG_VISIBLE,
                  EvidenceVisibility.SHARED_WITH_SUBJECT,
                ]),
              },
            }),
          ]),
        }),
      }),
    );
  });
});
