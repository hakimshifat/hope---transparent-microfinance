const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { notifyUser } = require("../utils/notify");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/assign",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const { borrowerId, loanId, installmentId, assignedOfficerId, priority = "normal", notes } = req.body;
    if (!borrowerId || !loanId || !assignedOfficerId) {
      return res.status(400).json({ message: "borrowerId, loanId and assignedOfficerId are required" });
    }

    const officer = await prisma.user.findUnique({ where: { id: assignedOfficerId } });
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    if (!officer || officer.role !== "field_officer") {
      return res.status(400).json({ message: "Assigned user must be a field officer" });
    }

    if (!loan || String(loan.borrowerId) !== String(borrowerId)) {
      return res.status(400).json({ message: "Loan does not belong to borrower" });
    }

    if (installmentId) {
      const installment = await prisma.installment.findUnique({ where: { id: installmentId } });
      if (!installment || String(installment.loanId) !== String(loanId)) {
        return res.status(400).json({ message: "Installment does not belong to loan" });
      }
    }

    const overdueCase = await prisma.overdueCase.create({
      data: {
        borrowerId,
        loanId,
        installmentId: installmentId || null,
        assignedOfficerId,
        priority,
        notes
      },
      include: {
        borrower: { select: { fullName: true, phone: true, email: true } },
        loan: true,
        installment: true,
        assignedOfficer: { select: { fullName: true, phone: true } }
      }
    });

    await writeAudit(
      req.user,
      "overdue_case_assigned",
      "OverdueCase",
      overdueCase.id,
      `Assigned overdue case to ${officer.fullName}`
    );

    await notifyUser(assignedOfficerId, {
      title: "New overdue case assigned",
      message: `A ${priority} priority case was assigned to you.`,
      type: priority === "urgent" ? "danger" : "warning",
      link: "/field/cases"
    });

    await notifyUser(borrowerId, {
      title: "Overdue follow-up opened",
      message: "A field officer has been assigned to follow up on your overdue installment.",
      type: "warning",
      link: "/borrower"
    });

    res.status(201).json(overdueCase);
  })
);

router.get(
  "/assigned-to-me",
  protect,
  authorize("field_officer"),
  asyncHandler(async (req, res) => {
    const cases = await prisma.overdueCase.findMany({
      where: { assignedOfficerId: req.user.id },
      include: {
        borrower: { select: { fullName: true, phone: true, email: true } },
        loan: true,
        installment: true,
        assignedOfficer: { select: { fullName: true, phone: true } }
      },
      orderBy: { assignedAt: 'desc' }
    });
    res.json(cases);
  })
);

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const cases = await prisma.overdueCase.findMany({
      include: {
        borrower: { select: { fullName: true, phone: true, email: true } },
        loan: true,
        installment: true,
        assignedOfficer: { select: { fullName: true, phone: true } }
      },
      orderBy: { assignedAt: 'desc' }
    });
    res.json(cases);
  })
);

router.patch(
  "/:id/status",
  protect,
  asyncHandler(async (req, res) => {
    const { caseStatus, notes } = req.body;
    if (!["assigned", "visited", "follow_up_required", "resolved"].includes(caseStatus)) {
      return res.status(400).json({ message: "Invalid case status" });
    }

    let overdueCase = await prisma.overdueCase.findUnique({ where: { id: req.params.id } });
    if (!overdueCase) return res.status(404).json({ message: "Case not found" });

    const canUpdate =
      ["admin", "supervisor"].includes(req.user.role) ||
      (req.user.role === "field_officer" && String(overdueCase.assignedOfficerId) === String(req.user.id));

    if (!canUpdate) {
      return res.status(403).json({ message: "You do not have permission to update this case" });
    }

    overdueCase = await prisma.overdueCase.update({
      where: { id: req.params.id },
      data: {
        caseStatus,
        notes: notes !== undefined ? notes : overdueCase.notes,
        resolvedAt: caseStatus === "resolved" ? new Date() : null
      },
      include: {
        borrower: { select: { fullName: true, phone: true, email: true } },
        loan: true,
        installment: true,
        assignedOfficer: { select: { fullName: true, phone: true } }
      }
    });

    if (caseStatus === "resolved") {
      await notifyUser(overdueCase.borrowerId, {
        title: "Overdue case resolved",
        message: "Your overdue follow-up case has been marked as resolved.",
        type: "success",
        link: "/ledger"
      });
    }

    res.json(overdueCase);
  })
);

module.exports = router;
