import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { requireAuth } from "./lib/auth";
import { authRouter } from "./routes/auth";
import { customersRouter } from "./routes/customers";
import { dashboardRouter } from "./routes/dashboard";
import { productsRouter } from "./routes/products";
import { reportsRouter } from "./routes/reports";
import { mercadoPagoWebhookRouter, salesRouter } from "./routes/sales";
import { settingsRouter } from "./routes/settings";
import { globalSearchRouter } from "./routes/search";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/sales/mercado-pago/webhook", mercadoPagoWebhookRouter);
app.use(requireAuth);
app.use("/dashboard", dashboardRouter);
app.use("/products", productsRouter);
app.use("/customers", customersRouter);
app.use("/sales", salesRouter);
app.use("/reports", reportsRouter);
app.use("/settings", settingsRouter);
app.use("/search", globalSearchRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Dados invalidos.", issues: error.issues });
  }

  const message = error instanceof Error ? error.message : "Erro interno.";
  return res.status(500).json({ message });
});

app.listen(port, () => {
  console.log(`API Zamai Salgados rodando em http://localhost:${port}`);
});
