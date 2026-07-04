import { Router } from "express";
import { prisma } from "../lib/prisma";
import { toNumber } from "../lib/money";

export const reportsRouter = Router();

reportsRouter.get("/", async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().setHours(0, 0, 0, 0));
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: { customer: true, items: { include: { product: true } }, payments: true },
    orderBy: { createdAt: "desc" }
  });

  const revenue = sales.filter((sale) => sale.status === "APPROVED").reduce((sum, sale) => sum + toNumber(sale.total), 0);
  const credit = sales.filter((sale) => sale.paymentMethod === "CREDIT").reduce((sum, sale) => sum + toNumber(sale.total), 0);
  const products = new Map<string, { name: string; quantity: number; total: number }>();

  for (const sale of sales) {
    for (const item of sale.items) {
      const row = products.get(item.productId) ?? { name: item.product.name, quantity: 0, total: 0 };
      row.quantity += item.quantity;
      row.total += toNumber(item.subtotal);
      products.set(item.productId, row);
    }
  }

  res.json({
    period: { from, to },
    revenue,
    estimatedProfit: revenue * 0.35,
    totalSold: sales.reduce((sum, sale) => sum + toNumber(sale.total), 0),
    totalReceived: revenue,
    credit,
    salesCount: sales.length,
    topProducts: Array.from(products.values()).sort((a, b) => b.quantity - a.quantity),
    sales
  });
});
