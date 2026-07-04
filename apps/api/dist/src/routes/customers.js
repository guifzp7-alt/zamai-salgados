"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const money_1 = require("../lib/money");
exports.customersRouter = (0, express_1.Router)();
const customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    sector: zod_1.z.string().min(1),
    phone: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional()
});
async function customerTotals(customerId) {
    const sales = await prisma_1.prisma.sale.findMany({
        where: { customerId, paymentMethod: "CREDIT" },
        include: { creditPayments: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" }
    });
    const paidRows = await prisma_1.prisma.creditPayment.findMany({ where: { customerId } });
    const totalOpen = sales.reduce((sum, sale) => sum + (0, money_1.toNumber)(sale.total), 0);
    const totalPaid = paidRows.reduce((sum, payment) => sum + (0, money_1.toNumber)(payment.amount), 0);
    return { totalOpen, totalPaid, balance: Math.max(totalOpen - totalPaid, 0), sales, payments: paidRows };
}
exports.customersRouter.get("/", async (req, res) => {
    const q = String(req.query.q ?? "");
    const customers = await prisma_1.prisma.customer.findMany({
        where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sector: { contains: q, mode: "insensitive" } }] } : {},
        include: { sales: true, creditPayments: true },
        orderBy: { name: "asc" }
    });
    res.json(customers.map((customer) => {
        const creditTotal = customer.sales.filter((sale) => sale.paymentMethod === "CREDIT").reduce((sum, sale) => sum + (0, money_1.toNumber)(sale.total), 0);
        const paid = customer.creditPayments.reduce((sum, payment) => sum + (0, money_1.toNumber)(payment.amount), 0);
        return {
            ...customer,
            totalOpen: Math.max(creditTotal - paid, 0),
            totalPaid: paid,
            purchases: customer.sales.length,
            lastPurchase: customer.sales[0]?.createdAt ?? null
        };
    }));
});
exports.customersRouter.post("/", async (req, res) => {
    const body = customerSchema.parse(req.body);
    const customer = await prisma_1.prisma.customer.create({ data: body });
    res.status(201).json(customer);
});
exports.customersRouter.get("/:id", async (req, res) => {
    const customer = await prisma_1.prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer)
        return res.status(404).json({ message: "Cliente nao encontrado." });
    const totals = await customerTotals(customer.id);
    res.json({ ...customer, ...totals });
});
exports.customersRouter.put("/:id", async (req, res) => {
    const body = customerSchema.partial().parse(req.body);
    const customer = await prisma_1.prisma.customer.update({ where: { id: req.params.id }, data: body });
    res.json(customer);
});
exports.customersRouter.delete("/:id", async (req, res) => {
    await prisma_1.prisma.customer.delete({ where: { id: req.params.id } });
    res.status(204).end();
});
exports.customersRouter.post("/:id/payments", async (req, res) => {
    const body = zod_1.z.object({
        amount: zod_1.z.coerce.number().positive(),
        method: zod_1.z.enum(["PIX", "CASH", "CARD"]),
        note: zod_1.z.string().optional()
    }).parse(req.body);
    const payment = await prisma_1.prisma.creditPayment.create({
        data: {
            customerId: req.params.id,
            amount: (0, money_1.toDecimal)(body.amount),
            method: body.method,
            note: body.note
        }
    });
    res.status(201).json(payment);
});
