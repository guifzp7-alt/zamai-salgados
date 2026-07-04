import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { toDecimal, toNumber } from "../lib/money";

export const customersRouter = Router();

const customerSchema = z.object({
  name: z.string().min(2),
  sector: z.string().min(1),
  phone: z.string().optional(),
  notes: z.string().optional()
});

async function customerTotals(customerId: string) {
  const sales = await prisma.sale.findMany({
    where: { customerId, paymentMethod: "CREDIT" },
    include: { creditPayments: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" }
  });
  const paidRows = await prisma.creditPayment.findMany({ where: { customerId } });
  const totalOpen = sales.reduce((sum, sale) => sum + toNumber(sale.total), 0);
  const totalPaid = paidRows.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  return { totalOpen, totalPaid, balance: Math.max(totalOpen - totalPaid, 0), sales, payments: paidRows };
}

customersRouter.get("/", async (req, res) => {
  const q = String(req.query.q ?? "");
  const customers = await prisma.customer.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sector: { contains: q, mode: "insensitive" } }] } : {},
    include: { sales: true, creditPayments: true },
    orderBy: { name: "asc" }
  });

  res.json(customers.map((customer) => {
    const creditTotal = customer.sales.filter((sale) => sale.paymentMethod === "CREDIT").reduce((sum, sale) => sum + toNumber(sale.total), 0);
    const paid = customer.creditPayments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    return {
      ...customer,
      totalOpen: Math.max(creditTotal - paid, 0),
      totalPaid: paid,
      purchases: customer.sales.length,
      lastPurchase: customer.sales[0]?.createdAt ?? null
    };
  }));
});

customersRouter.post("/", async (req, res) => {
  const body = customerSchema.parse(req.body);
  const customer = await prisma.customer.create({ data: body });
  res.status(201).json(customer);
});

customersRouter.get("/:id", async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) return res.status(404).json({ message: "Cliente nao encontrado." });
  const totals = await customerTotals(customer.id);
  res.json({ ...customer, ...totals });
});

customersRouter.put("/:id", async (req, res) => {
  const body = customerSchema.partial().parse(req.body);
  const customer = await prisma.customer.update({ where: { id: req.params.id }, data: body });
  res.json(customer);
});

customersRouter.delete("/:id", async (req, res) => {
  await prisma.customer.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

customersRouter.post("/:id/payments", async (req, res) => {
  const body = z.object({
    amount: z.coerce.number().positive(),
    method: z.enum(["PIX", "CASH", "CARD"]),
    note: z.string().optional()
  }).parse(req.body);

  const payment = await prisma.creditPayment.create({
    data: {
      customerId: req.params.id,
      amount: toDecimal(body.amount),
      method: body.method,
      note: body.note
    }
  });

  res.status(201).json(payment);
});
