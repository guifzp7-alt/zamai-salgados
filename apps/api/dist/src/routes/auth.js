"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../lib/auth");
exports.authRouter = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1)
});
exports.authRouter.post("/login", async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({ where: { username: body.username } });
    if (!user || !user.active) {
        return res.status(401).json({ message: "Usuario ou senha incorretos." });
    }
    const ok = await bcryptjs_1.default.compare(body.password, user.passwordHash);
    if (!ok) {
        return res.status(401).json({ message: "Usuario ou senha incorretos." });
    }
    const token = (0, auth_1.signToken)({ id: user.id, username: user.username, role: user.role });
    return res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});
exports.authRouter.get("/me", auth_1.requireAuth, async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, username: true, name: true, role: true }
    });
    return res.json(user);
});
exports.authRouter.post("/recover", async (_req, res) => {
    return res.json({ message: "Solicitacao registrada. Configure um provedor de e-mail para envio automatico." });
});
