"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const money_1 = require("../lib/money");
exports.productsRouter = (0, express_1.Router)();
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    category: zod_1.z.nativeEnum(client_1.ProductCategory),
    price: zod_1.z.coerce.number().nonnegative(),
    stockQuantity: zod_1.z.coerce.number().int().min(0),
    minimumStock: zod_1.z.coerce.number().int().min(0),
    photoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    internalCode: zod_1.z.string().min(1),
    active: zod_1.z.boolean().default(true),
    favorite: zod_1.z.boolean().default(false)
});
exports.productsRouter.get("/", async (req, res) => {
    const q = String(req.query.q ?? "");
    const products = await prisma_1.prisma.product.findMany({
        where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { internalCode: { contains: q, mode: "insensitive" } }] } : {},
        orderBy: [{ favorite: "desc" }, { name: "asc" }]
    });
    res.json(products);
});
exports.productsRouter.post("/", async (req, res) => {
    const body = productSchema.parse(req.body);
    const product = await prisma_1.prisma.product.create({
        data: { ...body, price: (0, money_1.toDecimal)(body.price), photoUrl: body.photoUrl || null }
    });
    res.status(201).json(product);
});
exports.productsRouter.put("/:id", async (req, res) => {
    const body = productSchema.partial().parse(req.body);
    const product = await prisma_1.prisma.product.update({
        where: { id: req.params.id },
        data: { ...body, price: body.price == null ? undefined : (0, money_1.toDecimal)(body.price), photoUrl: body.photoUrl || undefined }
    });
    res.json(product);
});
exports.productsRouter.delete("/:id", async (req, res) => {
    await prisma_1.prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
});
exports.productsRouter.post("/:id/stock", async (req, res) => {
    const body = zod_1.z.object({
        type: zod_1.z.enum(["IN", "OUT", "ADJUSTMENT"]),
        quantity: zod_1.z.coerce.number().int().positive(),
        reason: zod_1.z.string().optional()
    }).parse(req.body);
    const quantityDelta = body.type === "IN" ? body.quantity : -body.quantity;
    const product = await prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
            where: { id: req.params.id },
            data: {
                stockQuantity: { increment: quantityDelta }
            }
        });
        await tx.stockMovement.create({
            data: {
                productId: updated.id,
                type: body.type,
                quantity: body.quantity,
                reason: body.reason
            }
        });
        if (updated.stockQuantity <= 0) {
            return tx.product.update({ where: { id: updated.id }, data: { active: false } });
        }
        return updated;
    });
    res.json(product);
});
exports.productsRouter.get("/:id/movements", async (req, res) => {
    const movements = await prisma_1.prisma.stockMovement.findMany({
        where: { productId: req.params.id },
        orderBy: { createdAt: "desc" }
    });
    res.json(movements);
});
