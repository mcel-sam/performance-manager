import { CycleStatus, CycleVisibilityPolicy, ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { getReviewPacket } from "@/server/reviews/review-packet-service";

function buildDbMock() {
  return {
    reviewPacket: {
      findFirst: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
    evidenceItem: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
  };
}

const hrAdminContext = {
  userId: "user_hr_admin_1",
  orgId: "org_demo_1",
  role: UserRole.HR_ADMIN,
};

const managerContext = {
  userId: "user_manager_1",
  orgId: "org_demo_1",
  role: UserRole.MANAGER,
};

const subjectContext = {
  userId: "user_employee_1",
  orgId: "org_demo_1",
  role: UserRole.EMPLOYEE,
};

const otherEmployeeContext = {
  userId: "user_peer_1",
  orgId: "org_demo_1",
  role: UserRole.EMPLOYEE,
};

function buildPacketRecord(overrides?: {
  cycleStatus?: CycleStatus;
  visibilityPolicy?: CycleVisibilityPolicy;
  subjectUserId?: string;
  subjectManagerId?: string | null;
  includeReferenceSubmission?: boolean;
}) {
  const submissions: Array<{
    id: string;
    relationship: ReviewRelationship;
    status: ReviewSubmissionStatus;
    submittedAt: Date;
    reviewerEmployee: {
      id: string;
      firstName: string;
      lastName: string;
    };
    answers: Array<{
      id: string;
      questionId: string;
      responseText: string;
      scaleRating: number | null;
      notObserved: boolean;
      question: {
        id: string;
        prompt: string;
        questionType: "TEXT" | "SCALE_1_TO_5";
        isRequired: boolean;
        sortOrder: number;
      };
    }>;
  }> = [
    {
      id: "submission_1",
      relationship: ReviewRelationship.SELF,
      status: ReviewSubmissionStatus.SUBMITTED,
      submittedAt: new Date("2026-03-12T10:00:00.000Z"),
      reviewerEmployee: {
        id: "emp_employee_1",
        firstName: "Elliot",
        lastName: "Employee",
      },
      answers: [
        {
          id: "answer_1",
          questionId: "question_1",
          responseText: "Delivered impact.",
          scaleRating: null,
          notObserved: false,
          question: {
            id: "question_1",
            prompt: "What impact did this employee create this cycle?",
            questionType: "TEXT",
            isRequired: true,
            sortOrder: 1,
          },
        },
      ],
    },
  ];

  if (overrides?.includeReferenceSubmission) {
    submissions.push({
      id: "submission_2",
      relationship: ReviewRelationship.PEER,
      status: ReviewSubmissionStatus.SUBMITTED,
      submittedAt: new Date("2026-03-12T12:00:00.000Z"),
      reviewerEmployee: {
        id: "emp_peer_1",
        firstName: "Parker",
        lastName: "Peer",
      },
      answers: [
        {
          id: "answer_2",
          questionId: "question_2",
          responseText: "Strong collaboration on delivery handoffs.",
          scaleRating: 4,
          notObserved: false,
          question: {
            id: "question_2",
            prompt: "Communication",
            questionType: "SCALE_1_TO_5",
            isRequired: false,
            sortOrder: 2,
          },
        },
      ],
    });
  }

  return {
    id: "packet_seed_employee_1",
    cycleId: "cycle_seed_1",
    subjectEmployeeId: "emp_employee_1",
    cycle: {
      id: "cycle_seed_1",
      name: "Seed Cycle",
      status: overrides?.cycleStatus ?? CycleStatus.LOCKED,
      visibilityPolicy:
        overrides?.visibilityPolicy ?? CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
    },
    subjectEmployee: {
      id: "emp_employee_1",
      userId: overrides?.subjectUserId ?? "user_employee_1",
      managerId: overrides?.subjectManagerId ?? "emp_manager_1",
      firstName: "Elliot",
      lastName: "Employee",
    },
    submissions,
  };
}

describe("getReviewPacket", () => {
  it("returns packet submissions and answers for HR admin", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(buildPacketRecord());
    db.evidenceItem.groupBy.mockResolvedValue([
      {
        type: "FEEDBACK",
        _count: { _all: 2 },
      },
      {
        type: "GOAL",
        _count: { _all: 1 },
      },
    ]);

    const result = await getReviewPacket(
      "cycle_seed_1",
      "emp_employee_1",
      hrAdminContext,
      db as never,
    );

    expect(result.packet.subjectName).toBe("Elliot Employee");
    expect(result.packet.totalSubmissions).toBe(1);
    expect(result.packet.evidenceCounts.FEEDBACK).toBe(2);
    expect(result.packet.evidenceCounts.GOAL).toBe(1);
    expect(result.packet.evidenceCounts.UPDATE).toBe(0);
    expect(result.submissions[0]?.answers[0]?.prompt).toBe(
      "What impact did this employee create this cycle?",
    );
    expect(db.evidenceItem.groupBy).toHaveBeenCalledTimes(1);
    expect(db.evidenceItem.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          orgId: "org_demo_1",
          subjectEmployeeId: "emp_employee_1",
        }),
      }),
    );
    expect(db.employee.findFirst).not.toHaveBeenCalled();
  });

  it("allows manager-of-subject access", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(buildPacketRecord());
    db.employee.findFirst.mockResolvedValue({ id: "emp_manager_1" });

    const result = await getReviewPacket(
      "cycle_seed_1",
      "emp_employee_1",
      managerContext,
      db as never,
    );

    expect(result.packet.id).toBe("packet_seed_employee_1");
  });

  it("marks peer submissions as reference input", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(
      buildPacketRecord({
        includeReferenceSubmission: true,
      }),
    );
    db.employee.findFirst.mockResolvedValue({ id: "emp_manager_1" });

    const result = await getReviewPacket(
      "cycle_seed_1",
      "emp_employee_1",
      managerContext,
      db as never,
    );

    const peerSubmission = result.submissions.find(
      (submission) => submission.relationship === ReviewRelationship.PEER,
    );

    expect(peerSubmission).toBeDefined();
    expect(peerSubmission?.isReferenceInput).toBe(true);
  });

  it("allows subject employee only after release when policy allows", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(
      buildPacketRecord({
        cycleStatus: CycleStatus.RELEASED,
        visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      }),
    );
    db.employee.findFirst.mockResolvedValue({ id: "emp_employee_1" });

    const result = await getReviewPacket(
      "cycle_seed_1",
      "emp_employee_1",
      subjectContext,
      db as never,
    );

    expect(result.packet.cycleStatus).toBe(CycleStatus.RELEASED);
  });

  it("denies subject employee before release", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(
      buildPacketRecord({
        cycleStatus: CycleStatus.LOCKED,
        visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      }),
    );
    db.employee.findFirst.mockResolvedValue({ id: "emp_employee_1" });

    await expect(
      getReviewPacket("cycle_seed_1", "emp_employee_1", subjectContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("denies subject employee when cycle visibility is manager-only", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(
      buildPacketRecord({
        cycleStatus: CycleStatus.RELEASED,
        visibilityPolicy: CycleVisibilityPolicy.MANAGER_ONLY,
      }),
    );
    db.employee.findFirst.mockResolvedValue({ id: "emp_employee_1" });

    await expect(
      getReviewPacket("cycle_seed_1", "emp_employee_1", subjectContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("denies access for unrelated employees", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(
      buildPacketRecord({
        cycleStatus: CycleStatus.RELEASED,
        visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      }),
    );
    db.employee.findFirst.mockResolvedValue({ id: "emp_peer_1" });

    await expect(
      getReviewPacket("cycle_seed_1", "emp_employee_1", otherEmployeeContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("denies peer reviewer from opening full packet despite authored reference input", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(
      buildPacketRecord({
        cycleStatus: CycleStatus.RELEASED,
        visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
        includeReferenceSubmission: true,
      }),
    );
    db.employee.findFirst.mockResolvedValue({ id: "emp_peer_1" });

    await expect(
      getReviewPacket("cycle_seed_1", "emp_employee_1", otherEmployeeContext, db as never),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});
