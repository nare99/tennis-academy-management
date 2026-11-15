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

4. Generate Prisma Client:

   ```bash
   npm run prisma:generate -w @tennis/api
   ```

5. Create and apply a development migration:

   ```bash
   npm run db:migrate
   ```

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

9. Start the admin application in another terminal:\n\n   ```bash\n   npm run dev -w @tennis/admin-web\n   ```\n\n10. Open:
   - Customer application: http://localhost:5173
   - Swagger API documentation: http://localhost:3001/docs
   - API health endpoint: http://localhost:3001/health

The Vite development servers proxy `/api` requests to `http://localhost:3001`. Keep the API running while using either frontend.

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

After pulling the trainer-management branch, apply the committed database migration and regenerate Prisma Client:

```bash
npm run db:deploy
npm run prisma:generate -w @tennis/api
```

The migration renames `TrainerProfile.hourlyRate` to `hourlyRateMinor` and adds the `TrainerInvitation` table; it does not drop existing trainer profile data.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev:api` | Start API in watch mode |
| `npm run dev -w @tennis/customer-web` | Start customer frontend |\n| `npm run dev -w @tennis/admin-web` | Start admin frontend |
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
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:deploy` | Apply committed migrations |
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

The admin frontend now includes court, operating-hours, and trainer management. The trainer frontend, individual lessons, recurring group training, and payment workflows remain planned.

## Security and operational notes

- Passwords are hashed by the API; session tokens are stored as hashes server-side.
- The customer session is carried in an HTTP-only cookie. The API currently configures `secure` for production and `sameSite: 'lax'`.
- Booking history, creation, and cancellation are authenticated API operations; cancellation is scoped to the authenticated customer.
- Court booking overlap protection is enforced by a PostgreSQL database constraint for active bookings, not only by a frontend availability check.
- Before production deployment, review and implement the required CSRF/origin protection strategy, production cookie/domain settings, rate limiting, secret management, logging, and operational monitoring.
- `.env` is ignored by Git. Never commit real secrets.
- Credentials in `docker-compose.yml` are for local development only.

## Verification

The customer authentication and court-booking stabilization branch has been verified with:

- API lint, TypeScript typecheck, 6 Jest suites / 30 tests, and production build (user-confirmed local results).
- Customer frontend Vitest regression test (1 test), TypeScript typecheck, and production build (user-confirmed local results).
- GitHub Actions API and customer-web jobs passing on the stabilization branch.

The trainer-management branch adds new code and migrations that still require local typecheck, build, and test verification before the feature should be considered complete.

## Project status

The project has a working API foundation, a customer court-booking workflow, and initial admin management for courts, operating hours, and trainers. Trainer account activation uses hashed, expiring, single-use invitations. The trainer-facing interface, lessons, group training, payments, and remaining production-hardening tasks are future work. See [the customer application stabilization plan](docs/CUSTOMER-APP-STABILIZATION-PLAN.md) for detailed verification and outstanding items.
