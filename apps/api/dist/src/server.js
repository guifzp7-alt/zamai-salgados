"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const zod_1 = require("zod");
const auth_1 = require("./lib/auth");
const auth_2 = require("./routes/auth");
const customers_1 = require("./routes/customers");
const dashboard_1 = require("./routes/dashboard");
const products_1 = require("./routes/products");
const reports_1 = require("./routes/reports");
const sales_1 = require("./routes/sales");
const settings_1 = require("./routes/settings");
const search_1 = require("./routes/search");
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 4000);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express_1.default.json({ limit: "2mb" }));
app.use((0, morgan_1.default)("dev"));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", auth_2.authRouter);
app.use("/sales/mercado-pago/webhook", sales_1.mercadoPagoWebhookRouter);
app.use(auth_1.requireAuth);
app.use("/dashboard", dashboard_1.dashboardRouter);
app.use("/products", products_1.productsRouter);
app.use("/customers", customers_1.customersRouter);
app.use("/sales", sales_1.salesRouter);
app.use("/reports", reports_1.reportsRouter);
app.use("/settings", settings_1.settingsRouter);
app.use("/search", search_1.globalSearchRouter);
app.use((error, _req, res, _next) => {
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({ message: "Dados invalidos.", issues: error.issues });
    }
    const message = error instanceof Error ? error.message : "Erro interno.";
    return res.status(500).json({ message });
});
app.listen(port, () => {
    console.log(`API Zamai Salgados rodando em http://localhost:${port}`);
});
