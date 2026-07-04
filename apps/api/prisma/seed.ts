import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", name: "Administrador", passwordHash, role: "ADMIN" }
  });

  const products = [
    ["Coxinha", "SALGADOS", 6, 40, 10, "SAL-001", true],
    ["Pastel de Carne", "SALGADOS", 7, 35, 8, "SAL-002", true],
    ["Risole de Queijo", "SALGADOS", 6, 25, 8, "SAL-003", false],
    ["Refrigerante Lata", "BEBIDAS", 5, 30, 10, "BEB-001", true],
    ["Brigadeiro", "DOCES", 3, 50, 15, "DOC-001", false]
  ] as const;

  for (const [name, category, price, stockQuantity, minimumStock, internalCode, favorite] of products) {
    await prisma.product.upsert({
      where: { internalCode },
      update: {},
      create: { name, category, price, stockQuantity, minimumStock, internalCode, favorite }
    });
  }

  await prisma.setting.upsert({
    where: { key: "company" },
    update: {},
    create: { key: "company", value: { name: "Zamai Salgados", document: "", phone: "", logo: "" } }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
