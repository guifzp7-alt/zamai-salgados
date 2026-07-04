import { Router } from "express";
import { prisma } from "../lib/prisma";
import { toNumber } from "../lib/money";

export const dashboardRouter = Router();

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

dashboardRouter.get("/", async (_req, res) => {
  const today = startOfToday();
  const [sales, products, customers] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: today } },
      include: { items: { include: { product: true } }, payments: true }
    }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({ include: { sales: true, creditPayments: true } })
  ]);

  const approved = sales.filter((sale) => sale.status === "APPROVED");
  const revenue = approved.reduce((sum, sale) => sum + toNumber(sale.total), 0);
  const creditTotal = sales.filter((sale) => sale.paymentMethod === "CREDIT").reduce((sum, sale) => sum + toNumber(sale.total), 0);
  const received = approved.filter((sale) => sale.paymentMethod !== "CREDIT").reduce((sum, sale) => sum + toNumber(sale.total), 0);
  const lowStock = products.filter((product) => product.stockQuantity <= product.minimumStock);
  const soldItems = approved.flatMap((sale) => sale.items).reduce<Record<string, number>>((acc, item) => {
    acc[item.product.name] = (acc[item.product.name] ?? 0) + item.quantity;
    return acc;
  }, {});

  const debtors = customers.filter((customer) => {
    const credit = customer.sales.filter((sale) => sale.paymentMethod === "CREDIT").reduce((sum, sale) => sum + toNumber(sale.total), 0);
    const paid = customer.creditPayments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    return credit - paid > 0;
  }).length;

  const byHour = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 7;
    const matching = approved.filter((sale) => sale.createdAt.getHours() === hour);
    return {
      label: `${hour}h`,
      vendas: matching.length,
      faturamento: matching.reduce((sum, sale) => sum + toNumber(sale.total), 0)
    };
  });

  res.json({
    revenue,
    salesCount: sales.length,
    received,
    creditTotal,
    debtors,
    soldToday: Object.entries(soldItems).map(([name, quantity]) => ({ name, quantity })),
    lowStock,
    averageTicket: approved.length ? revenue / approved.length : 0,
    chart: byHour
  });
});
