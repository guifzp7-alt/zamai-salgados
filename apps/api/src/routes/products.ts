import { ProductCategory, StockMovementType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { toDecimal } from "../lib/money";

export const productsRouter = Router();

const productSchema = z.object({
  name: z.string().min(2),
  category: z.nativeEnum(ProductCategory),
  price: z.coerce.number().nonnegative(),
  stockQuantity: z.coerce.number().int().min(0),
  minimumStock: z.coerce.number().int().min(0),
  photoUrl: z.string().url().optional().or(z.literal("")),
  internalCode: z.string().min(1),
  active: z.boolean().default(true),
  favorite: z.boolean().default(false)
});

productsRouter.get("/", async (req, res) => {
  const q = String(req.query.q ?? "");
  const products = await prisma.product.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { internalCode: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: [{ favorite: "desc" }, { name: "asc" }]
  });
  res.json(products);
});

productsRouter.post("/", async (req, res) => {
  const body = productSchema.parse(req.body);
  const product = await prisma.product.create({
    data: { ...body, price: toDecimal(body.price), photoUrl: body.photoUrl || null }
  });
  res.status(201).json(product);
});

productsRouter.put("/:id", async (req, res) => {
  const body = productSchema.partial().parse(req.body);
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { ...body, price: body.price == null ? undefined : toDecimal(body.price), photoUrl: body.photoUrl || undefined }
  });
  res.json(product);
});

productsRouter.delete("/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

productsRouter.post("/:id/stock", async (req, res) => {
  const body = z.object({
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.coerce.number().int().positive(),
    reason: z.string().optional()
  }).parse(req.body);

  const quantityDelta = body.type === "IN" ? body.quantity : -body.quantity;
  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: req.params.id },
      data: {
        stockQuantity: { increment: quantityDelta }
      }
    });

    await tx.stockMovement.create({
      data: {
        productId: updated.id,
        type: body.type as StockMovementType,
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

productsRouter.get("/:id/movements", async (req, res) => {
  const movements = await prisma.stockMovement.findMany({
    where: { productId: req.params.id },
    orderBy: { createdAt: "desc" }
  });
  res.json(movements);
});
