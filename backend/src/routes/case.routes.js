const express = require("express");
const Installment = require("../models/Installment");
const Loan = require("../models/Loan");
const OverdueCase = require("../models/OverdueCase");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { notifyUser } = require("../utils/notify");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

function casePopulate(query) {
  return query
    .populate("borrowerId", "fullName phone email")
    .populate("loanId")
    .populate("installmentId")
    .populate("assignedOfficerId", "fullName phone");
}

router.post(
  "/assign",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const { borrowerId, loanId, installmentId, assignedOfficerId, priority = "normal", notes } = req.body;
    if (!borrowerId || !loanId || !assignedOfficerId) {
      return res.status(400).json({ message: "borrowerId, loanId and assignedOfficerId are required" });
    }

    const [officer, loan] = await Promise.all([
      User.findById(assignedOfficerId),
      Loan.findById(loanId)
    ]);

    if (!officer || officer.role !== "field_officer") {
      return res.status(400).json({ message: "Assigned user must be a field officer" });
    }

    if (!loan || String(loan.borrowerId) !== String(borrowerId)) {
      return res.status(400).json({ message: "Loan does not belong to borrower" });
    }

    if (installmentId) {
      const installment = await Installment.findById(installmentId);
      if (!installment || String(installment.loanId) !== String(loanId)) {
        return res.status(400).json({ message: "Installment does not belong to loan" });
      }
    }

    const overdueCase = await OverdueCase.create({
      borrowerId,
      loanId,
      installmentId,
      assignedOfficerId,
      priority,
      notes
    });

    await writeAudit(
      req.user,
      "overdue_case_assigned",
      "OverdueCase",
      overdueCase._id,
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

    res.status(201).json(await casePopulate(OverdueCase.findById(overdueCase._id)));
  })
);

router.get(
  "/assigned-to-me",
  protect,
  authorize("field_officer"),
  asyncHandler(async (req, res) => {
    const cases = await casePopulate(
      OverdueCase.find({ assignedOfficerId: req.user._id }).sort({ assignedAt: -1 })
    );
    res.json(cases);
  })
);

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const cases = await casePopulate(OverdueCase.find().sort({ assignedAt: -1 }));
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

    const overdueCase = await OverdueCase.findById(req.params.id);
    if (!overdueCase) return res.status(404).json({ message: "Case not found" });

    const canUpdate =
      ["admin", "supervisor"].includes(req.user.role) ||
      (req.user.role === "field_officer" && String(overdueCase.assignedOfficerId) === String(req.user._id));

    if (!canUpdate) {
      return res.status(403).json({ message: "You do not have permission to update this case" });
    }

    overdueCase.caseStatus = caseStatus;
    if (notes !== undefined) overdueCase.notes = notes;
    overdueCase.resolvedAt = caseStatus === "resolved" ? new Date() : undefined;
    await overdueCase.save();

    if (caseStatus === "resolved") {
      await notifyUser(overdueCase.borrowerId, {
        title: "Overdue case resolved",
        message: "Your overdue follow-up case has been marked as resolved.",
        type: "success",
        link: "/ledger"
      });
    }

    res.json(await casePopulate(OverdueCase.findById(overdueCase._id)));
  })
);

module.exports = router;
