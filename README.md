# Tennis Academy Management

A portfolio project for managing a single tennis academy. The current implementation includes a NestJS API and a customer-facing React application for browsing courts, checking availability, creating court bookings, and managing a customer's bookings.

Court booking is the currently implemented customer workflow. The admin frontend includes authentication, court/operating-hours management, and trainer management with invitation-based account activation. Individual lessons, recurring group training, online/offline payments, and the trainer frontend remain planned work unless explicitly listed as implemented below.

## Stack

- TypeScript + npm workspaces
- Backend: NestJS REST API with Swagger/OpenAPI
- Database: PostgreSQL + Prisma
- Customer frontend: React 19, Vite 6, React Router
- Validation: class-validator / class-transformer and API configuration validation
- Authentication: server-side sessions with an HTTP-only cookie
- Local database: Docker Compose
- Quality: ESLint, TypeScript, Jest, Vitest, React Testing Library
- CI: GitHub Actions

Use the dependency versions already declared in the workspace manifests; install with npm rather than independently installing workspace packages.

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

4. Generate Prisma Client from the repository root:

   ```bash
   npx prisma generate --schema ./prisma/schema.prisma
   ```

5. Apply the migrations already committed to the repository:

   ```bash
   npx prisma migrate deploy --schema ./prisma/schema.prisma
   ```

   Run this command from the repository root. The Prisma schema and root `.env` file are located there; do not run the migration command from `apps/api`.

6. Add deterministic demo data:

   ```bash
   npm run db:seed
   ```

7. Start the API in one terminal:

   ```bash
   npm run dev:api
   ```

8. Start the customer application in another terminal:

   ```bash
   npm run dev -w @tennis/customer-web
   ```

9. Start the admin application in another terminal:

   ```bash
   npm run dev -w @tennis/admin-web
   ```

10. Open:
   - Customer application: http://localhost:5173
   - Admin application: http://localhost:5174
   - Swagger API documentation: http://localhost:3001/docs
   - API health endpoint: http://localhost:3001/health

The Vite development servers proxy `/api` requests to `http://localhost:3001`. Keep the API running while using either frontend. Run only one API development process at a time.

### Provision a local administrator

Administrator accounts are provisioned explicitly; public registration always creates customers. In PowerShell, set the credentials for this one command (the password is entered without being displayed):

```powershell
$env:ADMIN_EMAIL = "admin@tennis-academy.local"
$env:ADMIN_NAME = "Academy Admin"
$securePassword = Read-Host "Admin password" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
npm run admin:provision -w @tennis/api
Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_NAME, Env:ADMIN_PASSWORD
```

Use a unique password of at least 12 characters. The command creates the administrator if the email is new, or explicitly promotes/updates the matching account. It revokes that account's existing sessions so the administrator must sign in again. It does not print or persist the password. The root `.env` file supplies `DATABASE_URL`; admin credentials are supplied only to the provisioning process.

## Implemented customer functionality

- Browse active courts.
- View court availability for a selected date.
- Register and log in as a customer.
- Maintain login state through a server-managed session cookie.
- Browse courts and availability without signing in.
- Require authentication for booking creation and booking history.
- Preserve a selected court time when redirecting an unauthenticated customer to login, then re-fetch availability before booking.
- View the authenticated customer's bookings.
- Cancel eligible upcoming bookings; the API enforces ownership and cancellation rules.

The API exposes admin-only court management endpoints. The admin frontend includes authenticated admin-only court and trainer management, including trainer invitation creation and acceptance.

## Trainer administration

The admin application exposes trainer management at `/trainers`. An administrator can create a trainer profile, update its details and hourly rate, deactivate/reactivate an activated trainer, and reissue an expired or lost invitation.

New trainer accounts are created inactive and without a password. The API creates a cryptographically random invitation token, stores only its SHA-256 hash, and returns the invitation URL to the authenticated administrator. The administrator must copy and send the link manually until an email provider is integrated. Invitations expire after seven days and are single-use. The trainer sets their own password on the public `/accept-invitation` page; successful acceptance activates the account. The trainer then signs in through the normal login page.

Set `TRAINER_INVITATION_BASE_URL` in the root `.env` to the externally reachable admin frontend URL plus `/accept-invitation`. The development default is `http://localhost:5174/accept-invitation`. Production configuration requires this variable.

The trainer-management migration renames `TrainerProfile.hourlyRate` to `hourlyRateMinor` and adds the `TrainerInvitation` table; it does not drop existing trainer profile data.

Run Prisma commands from the repository root so Prisma can resolve `prisma/schema.prisma` and the root `.env` file. Use the following commands for the corresponding workflows:

- Apply migrations committed to the repository (fresh local database or deployment):

  ```bash
  npx prisma migrate deploy --schema ./prisma/schema.prisma
  ```

- After changing `prisma/schema.prisma` during development, create and apply a new migration (replace the example name):

  ```bash
  npx prisma migrate dev --schema ./prisma/schema.prisma --name add_descriptive_change
  ```

- Regenerate Prisma Client after schema changes or when required by the setup:

  ```bash
  npx prisma generate --schema ./prisma/schema.prisma
  ```

Do not use `migrate dev` as a production deployment command; production and other deployment environments should apply committed migrations with `migrate deploy`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev:api` | Start API in watch mode |
| `npm run dev -w @tennis/customer-web` | Start customer frontend |
| `npm run dev -w @tennis/admin-web` | Start admin frontend |
| `npm run build` | Build the API |
| `npm run build -w @tennis/customer-web` | Build customer frontend |
| `npm run lint` | Lint API TypeScript |
| `npm run typecheck` | Typecheck API |
| `npm test` | Run API unit tests |
| `npm run test -w @tennis/customer-web` | Run customer frontend tests once |
| `npm run test:watch -w @tennis/customer-web` | Run customer frontend tests in watch mode |
| `npm run typecheck -w @tennis/customer-web` | Typecheck customer frontend |
| `npm run db:up` | Start PostgreSQL |
| `npm run db:down` | Stop local services |
| `npx prisma migrate dev --schema ./prisma/schema.prisma` | Create/apply a development migration from the repository root |
| `npx prisma migrate deploy --schema ./prisma/schema.prisma` | Apply committed migrations from the repository root |
| `npm run db:seed` | Seed repeatable demo courts and academy settings |
| `npm run admin:provision -w @tennis/api` | Explicitly create/update an administrator |
| `npm run db:studio` | Open Prisma Studio |

## Repository shape

```text
apps/
  api/                 NestJS REST API
  customer-web/        React customer application
  admin-web/           React admin application
packages/              Shared packages (added when needed)
prisma/                Database schema, migrations, and seed
infra/                 Deployment-related files
docs/                  Architecture decisions and implementation plans
```

The admin frontend includes court, operating-hours, and trainer management. The trainer frontend, individual lessons, recurring group training, and payment workflows remain planned.

## Security and operational notes

- Passwords are hashed by the API; session tokens are stored as hashes server-side.
- The customer session is carried in an HTTP-only cookie. The API currently configures `secure` for production and `sameSite: 'lax'`.
- Booking history, creation, and cancellation are authenticated API operations; cancellation is scoped to the authenticated customer.
- Court booking overlap protection is enforced by a PostgreSQL database constraint for active bookings, not only by a frontend availability check.
- Before production deployment, review and implement the required CSRF/origin protection strategy, production cookie/domain settings, rate limiting, secret management, logging, and operational monitoring.
- `.env` is ignored by Git. Never commit real secrets.
- Credentials in `docker-compose.yml` are for local development only.

## Verification

The trainer-management branch has been locally verified by the developer:

- Trainer-invitation database migration applied successfully (all five migrations found; the trainer-invitations migration applied).
- Prisma Client generated successfully with Prisma 6.19.3.
- API TypeScript typecheck passed.
- API Jest tests: 8 suites / 46 tests passed.
- API production build passed.
- Admin frontend TypeScript typecheck and production build passed (Vite 6.4.5).
- Manual end-to-end trainer invitation workflow passed: an administrator created a trainer and copied the invitation link; the trainer opened it in a private browser window, set a password, and the account became active and visible in the admin interface.

The Jest run emits TS151002 from ts-jest about `isolatedModules` with the current hybrid TypeScript module kind. Tests pass; the warning remains to be investigated rather than suppressed. These are developer-reported local results, not a claim that GitHub Actions has passed on this branch.

## Project status

The project has a working API foundation, a customer court-booking workflow, and initial admin management for courts, operating hours, and trainers. Trainer account activation uses hashed, expiring, single-use invitations and has passed local automated and manual end-to-end verification. The trainer-facing interface, lessons, group training, payments, and remaining production-hardening tasks are future work. See [the customer application stabilization plan](docs/CUSTOMER-APP-STABILIZATION-PLAN.md) for detailed verification and outstanding items.
