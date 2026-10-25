# Tennis Academy Management

A portfolio project for managing tennis court bookings, training groups, individual lessons, trainers, and payments.

## Stack

- TypeScript + npm workspaces
- NestJS REST API with Swagger/OpenAPI
- PostgreSQL + Prisma
- Docker Compose for local PostgreSQL
- ESLint + Prettier
- GitHub Actions CI

## Requirements

- Node.js 20.18+ (Node 22 LTS recommended)
- npm 10.8+
- Docker Desktop or Docker Engine

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env`.

3. Start PostgreSQL:

   ```bash
   npm run db:up
   ```

4. Generate Prisma Client

```bash
npm run prisma:generate -w @tennis/api

5. Create and apply the initial development migration:

   ```bash
   npm run db:migrate
   ```

6. Add deterministic demo data:

   ```bash
   npm run db:seed
   ```

7. Start the API:

   ```bash
   npm run dev:api
   ```

8. Open Swagger at [http://localhost:3001/docs](http://localhost:3001/docs) and health at [http://localhost:3001/health](http://localhost:3001/health).

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev:api` | Start API in watch mode |
| `npm run build` | Build the API |
| `npm run lint` | Lint TypeScript |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run unit tests |
| `npm run db:up` | Start PostgreSQL |
| `npm run db:down` | Stop local services |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:seed` | Seed repeatable demo data |
| `npm run db:studio` | Open Prisma Studio |

## Repository shape

```text
apps/
  api/                 NestJS API
packages/              Shared packages will be added when needed
prisma/                Database schema and seed
infra/                 Deployment-related files
docs/                  Architecture decisions and API notes
```

The customer, admin, and trainer frontends are intentionally not scaffolded yet. Add each as a separate workspace when the first API-backed workflows are ready.

## Security notes

- `.env` is ignored by Git. Never commit real secrets.
- The credentials in `docker-compose.yml` are for local development only.
- Authentication, authorization, payment handling, and production deployment are not implemented in this foundation.

## Project status

Foundation scaffold. Database schema currently contains only the first core entities and is expected to evolve through migrations.
