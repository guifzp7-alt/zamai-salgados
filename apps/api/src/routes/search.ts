import { Router } from "express";
import { prisma } from "../lib/prisma";

export const searchRouter = Router();

export const globalSearchRouter = Router();

globalSearchRouter.get("/", async (req, res) => {
  const q = String(req.query.q ?? "");
  if (!q) return res.json({ products: [], customers: [], sales: [] });

  const [products, customers, sales] = await Promise.all([
    prisma.product.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 8 }),
    prisma.customer.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 8 }),
    prisma.sale.findMany({ where: { id: { contains: q } }, take: 8, include: { customer: true } })
  ]);

  res.json({ products, customers, sales });
});
