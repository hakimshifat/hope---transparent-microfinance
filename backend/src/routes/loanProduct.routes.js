const express = require("express");
const LoanProduct = require("../models/LoanProduct");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter = ["admin", "supervisor"].includes(req.user.role) ? {} : { status: "active" };
    const products = await LoanProduct.find(filter).sort({ createdAt: -1 });
    res.json(products);
  })
);

router.post(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const product = await LoanProduct.create(req.body);
    await writeAudit(req.user, "loan_product_created", "LoanProduct", product._id, `Created product ${product.productName}`);
    res.status(201).json(product);
  })
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const product = await LoanProduct.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) return res.status(404).json({ message: "Loan product not found" });
    await writeAudit(req.user, "loan_product_updated", "LoanProduct", product._id, `Updated product ${product.productName}`);
    res.json(product);
  })
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid product status" });
    }

    const product = await LoanProduct.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!product) return res.status(404).json({ message: "Loan product not found" });
    await writeAudit(req.user, "loan_product_status_updated", "LoanProduct", product._id, `Set product ${product.productName} to ${status}`);
    res.json(product);
  })
);

module.exports = router;
