const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { notifyUser } = require("../utils/notify");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("field_officer"),
  asyncHandler(async (req, res) => {
    const { caseId, visitDate, visitOutcome, borrowerResponse, nextFollowUpDate, notes, caseStatus } = req.body;
    if (!caseId || !visitDate || !visitOutcome || !borrowerResponse) {
      return res.status(400).json({ message: "caseId, visitDate, visitOutcome and borrowerResponse are required" });
    }

    let overdueCase = await prisma.overdueCase.findUnique({ where: { id: caseId } });
    if (!overdueCase || String(overdueCase.assignedOfficerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "This case is not assigned to you" });
    }

    const visitLog = await prisma.visitLog.create({
      data: {
        caseId,
        officerId: req.user.id,
        visitDate,
        visitOutcome,
        borrowerResponse,
        nextFollowUpDate: nextFollowUpDate || null,
        notes
      }
    });

    let newCaseStatus = overdueCase.caseStatus;
    let resolvedAt = overdueCase.resolvedAt;

    if (caseStatus && ["visited", "follow_up_required", "resolved"].includes(caseStatus)) {
      newCaseStatus = caseStatus;
      resolvedAt = caseStatus === "resolved" ? new Date() : null;
    } else if (overdueCase.caseStatus === "assigned") {
      newCaseStatus = "visited";
    }

    overdueCase = await prisma.overdueCase.update({
      where: { id: caseId },
      data: {
        caseStatus: newCaseStatus,
        resolvedAt
      }
    });

    await writeAudit(
      req.user,
      "visit_log_submitted",
      "VisitLog",
      visitLog.id,
      `Submitted visit log for overdue case ${caseId}`
    );

    if (newCaseStatus === "resolved") {
      await notifyUser(overdueCase.borrowerId, {
        title: "Visit follow-up resolved",
        message: "Your field visit follow-up was marked as resolved.",
        type: "success",
        link: "/ledger"
      });
    } else if (nextFollowUpDate) {
      await notifyUser(overdueCase.borrowerId, {
        title: "Follow-up scheduled",
        message: `A field follow-up was scheduled for ${new Date(nextFollowUpDate).toLocaleDateString("en-BD")}.`,
        type: "warning",
        link: "/borrower"
      });
    }

    res.status(201).json(visitLog);
  })
);

router.get(
  "/case/:caseId",
  protect,
  asyncHandler(async (req, res) => {
    const overdueCase = await prisma.overdueCase.findUnique({ where: { id: req.params.caseId } });
    if (!overdueCase) return res.status(404).json({ message: "Case not found" });

    const canView =
      ["admin", "supervisor"].includes(req.user.role) ||
      (req.user.role === "field_officer" && String(overdueCase.assignedOfficerId) === String(req.user.id));

    if (!canView) {
      return res.status(403).json({ message: "You do not have permission to view these visit logs" });
    }

    const logs = await prisma.visitLog.findMany({
      where: { caseId: req.params.caseId },
      include: { officer: { select: { fullName: true, phone: true } } },
      orderBy: { visitDate: 'desc' }
    });
    res.json(logs);
  })
);

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const logs = await prisma.visitLog.findMany({
      include: {
        officer: { select: { fullName: true, phone: true } },
        case: {
          include: {
            borrower: { select: { fullName: true, phone: true } },
            assignedOfficer: { select: { fullName: true } }
          }
        }
      },
      orderBy: { visitDate: 'desc' },
      take: 200
    });
    res.json(logs);
  })
);

module.exports = router;
