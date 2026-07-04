# Zamai Salgados

Sistema web para gestao de vendas, estoque, caixa, clientes e fiados de uma barraca de salgados.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, PWA
- Backend: Node.js, Express, TypeScript
- Banco: PostgreSQL com Prisma
- Autenticacao: JWT
- Pagamentos: estrutura para Mercado Pago Pix, QR Code e webhooks

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Configure `apps/api/.env` com base em `apps/api/.env.example`.

3. Gere o Prisma e rode as migracoes:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

4. Inicie frontend e backend:

```bash
npm run dev
```

Frontend: `http://localhost:3000`

API: `http://localhost:4000`

Usuario inicial do seed: `admin`

Senha inicial do seed: `admin123`

## Erro P1001 no Prisma

Se aparecer `P1001: Can't reach database server at localhost:5432`, o PostgreSQL nao esta rodando nessa porta.

Opcoes:

1. Instale o PostgreSQL localmente e crie o banco `zamai_salgados`.
2. Se tiver Docker instalado, rode:

```bash
docker compose up -d
```

3. Depois execute:

```bash
npm run prisma:migrate
npm run seed
```

O arquivo `apps/api/.env` ja aponta para:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zamai_salgados?schema=public"
```
