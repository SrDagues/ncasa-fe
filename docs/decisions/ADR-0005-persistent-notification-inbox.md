# ADR-0005: Persistent notification inbox boundary

- Status: Accepted
- Date: 2026-09-04

## Context

The backend provides an account-scoped persistent inbox for expense-plan events. The frontend already had a
`NotificationService`, but that service owns short-lived local feedback and cannot represent history or durable read
state. The application shell also needs a small preview while longer histories need filtering and pagination.

## Decision

Create a `notifications` bounded context with domain, application, infrastructure and presentation layers. It owns a
safe notification snapshot and read transition, application use cases and an HTTP gateway. A route-scoped signal store
shares count, five-item unread preview and twenty-item inbox projections inside `/app`.

Use both a header disclosure and a lazy full page. Refresh on shell entry, focus, disclosure opening and mutations;
do not poll. Keep browser focus events behind a refresh-trigger adapter. Keep Household selection and Router navigation
in a presentation coordinator that imports only Household's public API. Do not reuse Expenses' `Money`, because that
would couple bounded contexts; Notifications owns a minimal amount value used only for validation and display.

The existing shared toast service retains its current name and purpose. Persistent models use `InboxNotification` to
make the distinction explicit.

## Alternatives considered

- A page without a preview was simpler but made the established shell entry point less useful.
- A preview without a page could not represent pagination and history accessibly on small screens.
- Polling improved freshness at the cost of continuous traffic; real-time transport is not available yet.
- Importing Expense plan or money models would violate feature independence and give Notifications rules it does not own.

## Consequences

The UI remains eventually refreshed rather than real-time. Three projections require careful synchronization and stale
request protection, but they share one route-scoped source of truth. Adding another delivery transport later does not
change the domain or presentation contract.
