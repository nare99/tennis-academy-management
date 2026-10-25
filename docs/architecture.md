# Architecture (initial decision)

## Approach

Start with a modular monolith: one NestJS REST API and one PostgreSQL database. Customer, admin, and trainer user interfaces will be separate apps in this repository, added as their workflows are implemented.

## Initial boundaries

- `health`: process health endpoint
- `config`: validated runtime configuration
- Prisma schema: initial `User`, `TrainerProfile`, and `Court` models

## Next milestones

1. Authentication and role-based authorization
2. Court opening hours, closures, availability, and reservations
3. Training groups, dated sessions, enrollments, and attendance
4. Payments, verified webhooks, and refunds
5. Customer/admin/trainer frontends and end-to-end tests

## Decisions to revisit

- Cookie/session strategy and CSRF protections
- Reservation overlap enforcement in PostgreSQL
- Payment provider and webhook idempotency
- Deployment target and managed database
