# ADR-0006: Email verification user experience

## Status

Accepted.

## Context

New accounts are persisted by the backend without an authenticated session and cannot log in until
their email address has been confirmed. The confirmation email opens the frontend with an opaque,
single-use token in the URL fragment. Confirmation and resend endpoints are public and Resend remains
entirely behind the backend boundary.

The frontend must explain the extra step, avoid leaking the token, preserve account-enumeration
protections on resend and give the user a recoverable path for expired links and transient failures.

## Decision

- Registration redirects with `replaceUrl` to `/check-email` and transfers the submitted email only
  through router navigation state. Registration never creates local authenticated state.
- `/check-email` explains the three next steps, recommends checking spam/promotions and allows a
  neutral resend request. Its success message never confirms whether an account exists.
- `/verify-email` reads `#token=...`, removes the fragment from browser history before making the API
  request and never writes the token to storage or logs.
- Successful confirmation, including the concurrent already-confirmed outcome, redirects to login
  with a transient success message after revoking the browser's previous refresh session and clearing
  its in-memory identity. Otherwise the guest guard would redirect to the previous account's dashboard.
  Cleanup failure stays on the verification page and retries logout, not the consumed token.
  Confirmation does not start a session automatically.
- Invalid and expired links offer resend and login actions. Network, unexpected and technical
  rate-limit failures additionally offer retry without reloading the token-bearing URL.
- Login redirects a correctly authenticated but unverified account to `/check-email`. The backend
  remains responsible for distinguishing this condition only after checking the password.
- Verification routes stay reachable without the guest guard so opening an email link works even
  when another account is already authenticated in the browser. Login and registration retain the
  guard.
- Components depend on application use cases. Only the HTTP adapter knows the backend endpoints and
  translates their status codes into typed application errors.

## Consequences

The flow remains anonymous until confirmation and explicit login. The token is briefly held only in
component memory, while removing it from the address bar reduces browser-history, server-log and
referrer exposure. Router state is intentionally non-durable: a direct visit to `/check-email` still
works by asking for the email address.

The current client-side rate-limit message uses `Retry-After` returned by the backend. Cross-instance
enforcement, resend quotas, token security and delivery reliability remain backend responsibilities.
