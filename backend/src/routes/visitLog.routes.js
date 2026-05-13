const express = require("express");
const OverdueCase = require("../models/OverdueCase");
const VisitLog = require("../models/VisitLog");
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

    const overdueCase = await OverdueCase.findById(caseId);
    if (!overdueCase || String(overdueCase.assignedOfficerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "This case is not assigned to you" });
    }

    const visitLog = await VisitLog.create({
      caseId,
      officerId: req.user._id,
      visitDate,
      visitOutcome,
      borrowerResponse,
      nextFollowUpDate,
      notes
    });

    if (caseStatus && ["visited", "follow_up_required", "resolved"].includes(caseStatus)) {
      overdueCase.caseStatus = caseStatus;
      overdueCase.resolvedAt = caseStatus === "resolved" ? new Date() : undefined;
    } else if (overdueCase.caseStatus === "assigned") {
      overdueCase.caseStatus = "visited";
    }
    await overdueCase.save();

    await writeAudit(
      req.user,
      "visit_log_submitted",
      "VisitLog",
      visitLog._id,
      `Submitted visit log for overdue case ${caseId}`
    );

    if (caseStatus === "resolved") {
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
    const overdueCase = await OverdueCase.findById(req.params.caseId);
    if (!overdueCase) return res.status(404).json({ message: "Case not found" });

    const canView =
      ["admin", "supervisor"].includes(req.user.role) ||
      (req.user.role === "field_officer" && String(overdueCase.assignedOfficerId) === String(req.user._id));

    if (!canView) {
      return res.status(403).json({ message: "You do not have permission to view these visit logs" });
    }

    const logs = await VisitLog.find({ caseId: req.params.caseId })
      .populate("officerId", "fullName phone")
      .sort({ visitDate: -1 });
    res.json(logs);
  })
);

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const logs = await VisitLog.find()
      .populate("officerId", "fullName phone")
      .populate({
        path: "caseId",
        populate: [
          { path: "borrowerId", select: "fullName phone" },
          { path: "assignedOfficerId", select: "fullName" }
        ]
      })
      .sort({ visitDate: -1 })
      .limit(200);
    res.json(logs);
  })
);

module.exports = router;
