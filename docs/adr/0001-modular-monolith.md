# ADR 0001: Start with a modular monolith

- Status: Accepted
- Decision: Use one NestJS API and one PostgreSQL database, with separately deployable frontends in the same npm-workspaces repository.
- Reason: This is simpler to build, test, deploy, and explain in a portfolio than microservices, while preserving clear module boundaries.
- Consequence: Split services only if real scaling or organizational needs justify the added operational complexity.
