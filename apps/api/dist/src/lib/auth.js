"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwtSecret = process.env.JWT_SECRET ?? "development-secret";
function signToken(user) {
    return jsonwebtoken_1.default.sign(user, jwtSecret, { expiresIn: "7d" });
}
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) {
        return res.status(401).json({ message: "Token ausente." });
    }
    try {
        req.user = jsonwebtoken_1.default.verify(token, jwtSecret);
        return next();
    }
    catch {
        return res.status(401).json({ message: "Token invalido ou expirado." });
    }
}
