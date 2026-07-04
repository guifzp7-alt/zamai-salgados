"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mercadoPagoWebhookRouter = exports.salesRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const mercado_pago_1 = require("../lib/mercado-pago");
const prisma_1 = require("../lib/prisma");
const money_1 = require("../lib/money");
exports.salesRouter = (0, express_1.Router)();
exports.mercadoPagoWebhookRouter = (0, express_1.Router)();
const saleSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    discount: zod_1.z.coerce.number().min(0).default(0),
    paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod),
    receivedAmount: zod_1.z.coerce.number().optional(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        quantity: zod_1.z.coerce.number().int().positive()
    })).min(1)
});
exports.salesRouter.get("/", async (req, res) => {
    const take = Number(req.query.take ?? 50);
    const sales = await prisma_1.prisma.sale.findMany({
        take,
        include: { customer: true, items: { include: { product: true } }, payments: true },
        orderBy: { createdAt: "desc" }
    });
    res.json(sales);
});
exports.salesRouter.post("/", async (req, res) => {
    const body = saleSchema.parse(req.body);
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const productIds = body.items.map((item) => item.productId);
        const products = await tx.product.findMany({ where: { id: { in: productIds }, active: true } });
        const productsById = new Map(products.map((product) => [product.id, product]));
        const preparedItems = body.items.map((item) => {
            const product = productsById.get(item.productId);
            if (!product)
                throw new Error("Produto indisponivel.");
            if (product.stockQuantity < item.quantity)
                throw new Error(`Estoque insuficiente para ${product.name}.`);
            const unitPrice = (0, money_1.toNumber)(product.price);
            return {
                product,
                quantity: item.quantity,
                unitPrice,
                subtotal: unitPrice * item.quantity
            };
        });
        const subtotal = preparedItems.reduce((sum, item) => sum + item.subtotal, 0);
        const total = Math.max(subtotal - body.discount, 0);
        const isCredit = body.paymentMethod === "CREDIT";
        const isPix = body.paymentMethod === "PIX";
        const status = isPix ? "PENDING" : "APPROVED";
        const pix = isPix ? await (0, mercado_pago_1.createPixPayment)(total, "Venda Zamai Salgados") : null;
        const sale = await tx.sale.create({
            data: {
                customerId: body.customerId,
                subtotal: (0, money_1.toDecimal)(subtotal),
                discount: (0, money_1.toDecimal)(body.discount),
                total: (0, money_1.toDecimal)(total),
                paymentMethod: body.paymentMethod,
                status,
                creditStatus: isCredit ? "OPEN" : null,
                receivedAmount: body.receivedAmount == null ? null : (0, money_1.toDecimal)(body.receivedAmount),
                changeAmount: body.paymentMethod === "CASH" && body.receivedAmount ? (0, money_1.toDecimal)(Math.max(body.receivedAmount - total, 0)) : null,
                mercadoPagoId: pix?.transactionId,
                pixQrCode: pix?.qrCode,
                pixCopyPaste: pix?.copyPaste,
                items: {
                    create: preparedItems.map((item) => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                        unitPrice: (0, money_1.toDecimal)(item.unitPrice),
                        subtotal: (0, money_1.toDecimal)(item.subtotal)
                    }))
                },
                payments: isCredit ? undefined : {
                    create: {
                        method: body.paymentMethod,
                        amount: (0, money_1.toDecimal)(total),
                        status
                    }
                }
            },
            include: { items: { include: { product: true } }, customer: true, payments: true }
        });
        if (!isPix) {
            for (const item of preparedItems) {
                const updated = await tx.product.update({
                    where: { id: item.product.id },
                    data: { stockQuantity: { decrement: item.quantity } }
                });
                await tx.stockMovement.create({
                    data: { productId: item.product.id, type: "SALE", quantity: item.quantity, reason: `Venda ${sale.id}` }
                });
                if (updated.stockQuantity <= 0) {
                    await tx.product.update({ where: { id: item.product.id }, data: { active: false } });
                }
            }
        }
        return sale;
    });
    res.status(201).json(result);
});
exports.salesRouter.post("/:id/approve-pix", async (req, res) => {
    const sale = await prisma_1.prisma.$transaction(async (tx) => {
        const current = await tx.sale.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!current)
            throw new Error("Venda nao encontrada.");
        if (current.status === "APPROVED")
            return current;
        for (const item of current.items) {
            await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { decrement: item.quantity } } });
            await tx.stockMovement.create({ data: { productId: item.productId, type: "SALE", quantity: item.quantity, reason: `Pix aprovado ${current.id}` } });
        }
        await tx.payment.create({
            data: { saleId: current.id, method: "PIX", amount: current.total, status: "APPROVED", transactionId: req.body.transactionId }
        });
        return tx.sale.update({
            where: { id: current.id },
            data: { status: "APPROVED", mercadoPagoId: req.body.transactionId },
            include: { items: { include: { product: true } }, payments: true }
        });
    });
    res.json(sale);
});
exports.mercadoPagoWebhookRouter.post("/", async (req, res) => {
    const paymentId = req.body?.data?.id ?? req.body?.id;
    return res.json({ received: true, paymentId, message: "Webhook recebido. Valide assinatura e consulte o pagamento na API oficial antes de aprovar em producao." });
});
