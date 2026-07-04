"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearchRouter = exports.searchRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
exports.searchRouter = (0, express_1.Router)();
exports.globalSearchRouter = (0, express_1.Router)();
exports.globalSearchRouter.get("/", async (req, res) => {
    const q = String(req.query.q ?? "");
    if (!q)
        return res.json({ products: [], customers: [], sales: [] });
    const [products, customers, sales] = await Promise.all([
        prisma_1.prisma.product.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 8 }),
        prisma_1.prisma.customer.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 8 }),
        prisma_1.prisma.sale.findMany({ where: { id: { contains: q } }, take: 8, include: { customer: true } })
    ]);
    res.json({ products, customers, sales });
});
