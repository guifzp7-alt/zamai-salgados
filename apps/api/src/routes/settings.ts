import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export const settingsRouter = Router();

settingsRouter.get("/", async (_req, res) => {
  const settings = await prisma.setting.findMany();
  res.json(Object.fromEntries(settings.map((setting) => [setting.key, setting.value])));
});

settingsRouter.put("/", async (req, res) => {
  const body = z.record(z.any()).parse(req.body);
  const updates = await Promise.all(Object.entries(body).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
  ));
  res.json(updates);
});
