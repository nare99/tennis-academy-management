# Customer Application Stabilization Plan

This is the working checklist for stabilizing the existing customer application before adding new product features. Check an item only after the implementation and its verification are complete. Keep this file updated as work progresses.

## Scope and working rules

- Work from the current repository implementation and dependency versions.
- Preserve existing working behavior and database data.
- Make small, reviewable changes; do not start admin, trainer, group-training, or payment features until this stabilization plan is complete.
- A checkbox means the change is implemented and verified, not merely drafted or committed.
- After each implementation step, run the relevant checks and record the actual result.

## Current implementation notes

The stabilization work is on branch `stabilize/customer-auth-bookings`. The branch includes the cancellation fix back-merged from `main`.

- Shared auth context/provider, header integration, login/register state update, protected booking-history route, and booking-intent restoration are implemented.
- Inactive-account session validation deletes the matching session; the existing auth service test covers this behavior.
- `MyBookingsPage.tsx` imports the API operation as `cancelBookingRequest` and calls it from `handleCancelBooking`, then reloads the booking list. The code-level recursion/shadowing bug is fixed. The cancellation regression test passes, and the user manually verified cancellation eligibility for future active bookings.
- User-confirmed local checks after the back-merge: API lint, typecheck, 6 test suites/30 tests, API build, customer-web test (1 test), typecheck, and customer-web production build all completed successfully. GitHub Actions API and customer-web jobs also passed on commit `97c8e44`.
- User previously confirmed the six manual authentication and booking-flow scenarios listed in Phases 1–2.

## Phase 0 — Baseline review

- [x] Inspect the customer frontend structure, current authentication flow, booking flow, API session implementation, test setup, workspace scripts, and CI configuration on the repository default branch.
- [x] Compare the default-branch files with the user's local working tree before applying code changes; preserve unpushed local work. The cancellation fix was committed to `main` and back-merged into this branch.
- [x] Run API lint locally after correcting the Prisma glob and removing an unused import; user confirmed the command exits successfully.
- [x] Run API TypeScript typecheck locally; user confirmed `tsc --noEmit -p tsconfig.build.json` exits successfully.
- [x] Run API unit tests locally after the back-merge; user confirmed 6 suites and 30 tests passed.
- [x] Run API production build locally after the back-merge; user confirmed it completed successfully.

## Phase 1 — Correct customer authentication state

- [x] Add a shared React authentication provider/context initialized from `GET /api/auth/me`.
- [x] Expose a clear auth state: loading, authenticated user, and unauthenticated.
- [x] Update login and registration to update the shared auth state immediately after the API succeeds (registration currently creates a session automatically).
- [x] Update the header to consume shared auth state instead of maintaining its own one-time user fetch.
- [ ] Update logout to clear shared auth state only after the logout API succeeds; handle errors visibly.
- [x] Ensure the auth provider is mounted once above the application routes.
- [x] Manually verify registration updates the header without reload, session persistence after refresh, and logout updates the header immediately.

## Phase 2 — Enforce and explain protected customer routes

- [x] Add a reusable frontend protected-route component based on the shared auth state.
- [x] Protect `/my-bookings`; preserve the requested destination when redirecting to login.
- [x] Keep court browsing and availability public.
- [x] On booking confirmation, if unauthenticated, redirect to login while preserving the selected court, date, start time, and duration.
- [x] After successful login/registration, return the customer to the pending booking flow and re-fetch availability; API remains the final authority on conflicts and price.
- [ ] Handle expired/invalid sessions by clearing frontend auth state and redirecting safely.
- [x] Manually verify logged-out booking confirmation redirects to login, restores the selected slot after sign-in, and allows the customer to complete the booking.

## Phase 3 — Fix and regression-test cancellation

- [x] Compare the user's cancellation change with the default branch; the fix was committed to `main` and back-merged into this branch.
- [x] Ensure the UI handler calls the API function using distinct names (`handleCancelBooking` and `cancelBookingRequest`); verified in the branch source.
- [x] Add a regression test verifying cancellation invokes the API exactly once and refreshes the booking list; the customer-web test passed locally and in CI.
- [x] Manually verify cancellation works for an eligible future active booking and cancelled/past bookings cannot be cancelled through the UI; backend rules remain authoritative (user-confirmed).

## Phase 4 — Session lifecycle hardening

- [x] Revoke a session when validation discovers its account is inactive, rather than merely returning unauthenticated while leaving the session stored.
- [ ] Add tests for successful login/session creation, valid session validation, unknown/invalid token, logout invalidation, expired-session deletion, and inactive-account session revocation.
- [ ] Review session cookie settings and document the intended local/production behavior.
- [ ] Define and implement an appropriate CSRF/origin protection strategy for cookie-authenticated state-changing endpoints before production deployment.
- [ ] Defer scheduled expired-session cleanup and multi-device session management unless implementation review shows they are needed for the current release.

## Phase 5 — Quality gates and project documentation

- [x] Add customer-web test, typecheck, and build steps to CI using existing workspace scripts; both API and customer-web CI jobs passed on commit `97c8e44`.
- [ ] Add further frontend tests for auth state, route protection, and booking redirect/return. Cancellation currently has one passing regression test.
- [x] API lint passes locally (confirmed by user).
- [x] API typecheck passes locally (confirmed by user).
- [x] API unit tests pass locally: 6 suites, 30 tests (user-confirmed after back-merge).
- [x] API production build passes locally (user-confirmed after back-merge).
- [x] Customer-web typecheck passes locally (user-confirmed).
- [x] Customer-web production build passes locally (user-confirmed).
- [ ] Update README to reflect the implemented customer frontend, authentication, and court-booking functionality; remove stale statements that say these are not implemented.
- [x] Record actual verification results and remaining limitations here.

## Exit criteria

The stabilization work is complete only when:
1. Registration/login updates the header immediately without a page reload.
2. Authenticated state survives a page refresh while the server session is valid.
3. Anonymous users can browse but cannot book; the UI guides them through login and returns them to the booking flow.
4. Protected pages are guarded in the frontend and the API continues enforcing authorization.
5. Booking cancellation works and has regression coverage.
6. Session lifecycle edge cases have tests.
7. API and customer frontend checks pass locally, and CI runs checks for both workspaces.
8. README and this checklist accurately describe the verified implementation.
