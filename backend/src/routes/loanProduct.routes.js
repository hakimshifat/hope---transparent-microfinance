const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter = ["admin", "supervisor"].includes(req.user.role) ? {} : { status: "active" };
    const products = await prisma.loanProduct.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  })
);

router.post(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const product = await prisma.loanProduct.create({
      data: req.body,
    });
    await writeAudit(req.user, "loan_product_created", "LoanProduct", product.id, `Created product ${product.productName}`);
    res.status(201).json(product);
  })
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    try {
      const product = await prisma.loanProduct.update({
        where: { id: req.params.id },
        data: req.body,
      });
      await writeAudit(req.user, "loan_product_updated", "LoanProduct", product.id, `Updated product ${product.productName}`);
      res.json(product);
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ message: "Loan product not found" });
      throw error;
    }
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

    try {
      const product = await prisma.loanProduct.update({
        where: { id: req.params.id },
        data: { status },
      });
      await writeAudit(req.user, "loan_product_status_updated", "LoanProduct", product.id, `Set product ${product.productName} to ${status}`);
      res.json(product);
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ message: "Loan product not found" });
      throw error;
    }
  })
);

module.exports = router;
