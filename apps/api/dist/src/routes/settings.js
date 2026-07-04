"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
exports.settingsRouter = (0, express_1.Router)();
exports.settingsRouter.get("/", async (_req, res) => {
    const settings = await prisma_1.prisma.setting.findMany();
    res.json(Object.fromEntries(settings.map((setting) => [setting.key, setting.value])));
});
exports.settingsRouter.put("/", async (req, res) => {
    const body = zod_1.z.record(zod_1.z.any()).parse(req.body);
    const updates = await Promise.all(Object.entries(body).map(([key, value]) => prisma_1.prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })));
    res.json(updates);
});
