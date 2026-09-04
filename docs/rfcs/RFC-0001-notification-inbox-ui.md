# RFC-0001: Persistent notification inbox UI

- Status: Implemented
- Date: 2026-09-04
- Related: ADR-0005; backend RFC-0006

## Summary

Expose the backend's account-owned expense-plan notifications through an accessible header preview and a complete
inbox. The feature covers every currently accessible household and keeps durable read state on the backend.

## User experience

The authenticated header displays an exact unread count, visually capped at `99+`. Its disclosure loads the five
most recent unread notifications and supports marking one or all as read. The full `/app/notifications` page starts
with all history, offers an unread-only filter and paginates in pages of twenty.

Every item has separate controls: its main link marks it read and opens the source plan, while an adjacent icon marks
it read without navigation. Before navigation the presentation coordinator selects the referenced household through
Household's public API. A read failure does not block navigation; a household-selection failure does.

The count is fetched on authenticated-shell entry, window focus, preview opening and successful mutations. There is
no timer-based polling. Loading, empty, filtered-empty and recoverable error states are explicit.

## Architecture and API

`features/notifications` owns a plain TypeScript domain model, application use cases and a `NotificationInboxGateway`.
The HTTP adapter maps unknown responses from:

```http
GET  /api/notifications?unreadOnly=false&page=0&size=20
GET  /api/notifications/unread-count
POST /api/notifications/{notificationId}/read
POST /api/notifications/read-all
```

The store is scoped to `/app`, allowing the header and routed page to share projections without surviving logout.
Notification keeps scalar household and plan references. Only presentation coordinates Router and Household.

## Accessibility, privacy and failure behaviour

The disclosure button reports expanded state and the exact unread count. Escape closes it and restores focus. Items
use sibling links and buttons, visible focus, native keyboard behavior and textual unread status. User-authored subject
and reason content relies on Angular escaping. No payload, subject, reason or account data is logged.

Malformed payloads and transport failures become typed application errors. Failed reads retain unread state; failed
bulk reads retain the prior projection; stale list responses cannot overwrite a newer filter or page.

## Non-goals

Email, push, preferences, deletion, polling, SSE, WebSocket delivery and an E2E framework are outside this version.
The existing shared `NotificationService` remains an ephemeral toast mechanism and is not part of the persistent inbox.

## Verification

Domain/application behavior uses plain Vitest; HTTP uses Angular HTTP testing; store, accessibility and navigation use
TestBed and Router doubles. Catalog parity, the full unit suite, architectural guard and production build are required.
