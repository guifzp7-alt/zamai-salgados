import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, signToken } from "../lib/auth";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { username: body.username } });

  if (!user || !user.active) {
    return res.status(401).json({ message: "Usuario ou senha incorretos." });
  }

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Usuario ou senha incorretos." });
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role });
  return res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, username: true, name: true, role: true }
  });
  return res.json(user);
});

authRouter.post("/recover", async (_req, res) => {
  return res.json({ message: "Solicitacao registrada. Configure um provedor de e-mail para envio automatico." });
});
