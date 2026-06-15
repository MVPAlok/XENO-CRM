# Xeno AI Campaign Console Backend

Production-ready Node.js backend for the Xeno React + Vite frontend.

## Stack

- Express.js
- Prisma ORM
- PostgreSQL
- JWT access and refresh tokens
- Zod validation
- Multer CSV uploads
- Bcrypt password hashing
- Helmet, CORS, rate limiting
- SSE for simulator logs, campaign updates, and notifications

## Quick Start

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Default API base:

```text
http://localhost:5000/api/v1
```

Seed login:

```text
demo@xeno.ai
XenoDemo123!
```

## Docker

From the project root:

```bash
docker compose up --build
```

This starts PostgreSQL, runs migrations, seeds demo data, and starts the API on port `5000`.

## Key Endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `PATCH /api/v1/workspaces/:workspaceId`
- `DELETE /api/v1/workspaces/:workspaceId`
- `POST /api/v1/workspaces/:workspaceId/imports`
- `GET /api/v1/workspaces/:workspaceId/customers`
- `GET /api/v1/workspaces/:workspaceId/segments`
- `POST /api/v1/workspaces/:workspaceId/campaigns`
- `GET /api/v1/workspaces/:workspaceId/campaigns/simulator/logs`
- `GET /api/v1/workspaces/:workspaceId/campaigns/simulator/metrics`
- `POST /api/v1/workspaces/:workspaceId/campaigns/simulator/control`
- `GET /api/v1/workspaces/:workspaceId/analytics/overview`
- `GET /api/v1/workspaces/:workspaceId/events`

## CSV Import

Upload `customers.csv` and/or `orders.csv` with multipart form data:

```bash
curl -X POST http://localhost:5000/api/v1/workspaces/$WORKSPACE_ID/imports \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "customers=@customers.csv" \
  -F "orders=@orders.csv"
```

Customer columns:

```text
firstName,lastName,email,phone,city
```

Order columns:

```text
customerId,amount,purchaseDate,category
```

The importer upserts customers and orders, recalculates spend, order count, AOV, CLV, recency, frequency, and status, then refreshes auto segments.

## AI Copilot

The backend uses a deterministic fallback recommendation engine by default. Set either `OPENAI_API_KEY` or `GEMINI_API_KEY` in `.env` to enable provider-backed responses.
