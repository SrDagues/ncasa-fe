# Architecture

## 1. Architectural style

ncasa-fe is a modular Angular application organized by business capability. It combines:

- **DDD:** a shared language and explicit models for household expenses, splits, balances, members,
  invitations, receipt ingestion and calendar behavior;
- **Hexagonal Architecture:** ports describe what application workflows need, while adapters handle
  HTTP, browser storage, files and temporary demo data;
- **Clean Architecture:** dependencies point toward domain and application policy;
- **Vertical slices:** work is delivered feature by feature without a speculative global framework.

DDD is selective. A button, card or simple view formatter does not need an entity or use case. Money,
expense splitting, settlement, invitations, session restoration and receipt-to-expense workflows do.

## 2. Bounded contexts

Use these initial ownership boundaries. Refine them only when product language proves a different
boundary is needed.

| Context | Owns | Does not own |
| --- | --- | --- |
| `identity-access` | Login, registration, logout, session restoration and authorization state | Household membership rules |
| `household` | Household identity, members, roles, invitations and membership lifecycle | Expense splitting |
| `expenses` | Expenses, categories, payer, participants, split rules, balances and settlements | OCR extraction |
| `ticket-ingestion` | File selection, upload, OCR status, extracted fields and creation of an expense draft | Final expense persistence |
| `calendar` | Events, tasks, dates, recurrence when introduced and calendar views | Expense settlement |
| `dashboard` | Read-only composition/projection of data exposed by other contexts | New business rules duplicated from those contexts |

Use the same term consistently in code, tests, routes and UI. If the backend and product use different
terms, document and isolate the translation in a mapper rather than leaking both vocabularies.

## 3. Dependency rule

Allowed dependencies:

```text
presentation -> application -> domain
infrastructure -> application -> domain
composition root -> presentation + infrastructure + application
```

Forbidden dependencies:

```text
domain -> Angular/application/infrastructure/presentation
application -> Angular HttpClient/infrastructure/presentation
presentation -> concrete HTTP or storage adapter/API DTO/demo constants
feature A internals -> feature B internals
```

The composition root is formed by application configuration and feature route providers. It is the
only place that should know both an inward-facing port and its concrete adapter.

## 4. Feature structure

Use this structure for a feature with meaningful domain behavior. Omit folders that have no current
responsibility; do not create empty placeholders.

```text
features/expenses/
  domain/
    expense.ts
    expense-id.ts
    money.ts
    split-method.ts
    split-calculator.ts

  application/
    ports/
      expense-repository.port.ts
    use-cases/
      create-expense.ts
      list-expenses.ts
      calculate-settlements.ts

  infrastructure/
    http/
      expense-api.dto.ts
      expense-api.mapper.ts
      http-expense.repository.ts
    demo/
      demo-expense.repository.ts
    expense.providers.ts

  presentation/
    pages/
      expense-list/
      expense-form/
    components/
    expense.store.ts
    expense.routes.ts

  index.ts
```

Use the feature `index.ts` as a deliberately small public API. Do not create broad barrel files that
hide dependency direction or introduce cycles.

## 5. Domain layer

Domain code is framework-independent TypeScript. It contains business meaning and invariants:

- entities when identity and lifecycle matter;
- value objects for concepts such as money, identifiers and allocation values;
- pure domain services for rules spanning multiple values or entities;
- domain errors or result types for expected rule violations.

Rules:

- Constructors/factories reject invalid state instead of allowing partially valid entities.
- Keep calculations deterministic and free of I/O, clocks and random global state. Inject time or ID
  generation through application ports when needed.
- Use integer cents for EUR or a `Money` value object. Define rounding and remainder allocation with
  tests. Never rely on binary floating-point for settlements.
- Use domain-safe dates (`YYYY-MM-DD` or an explicit local-date type) for day-based concepts and
  instants with offsets for timestamps. Spanish display strings belong only to presentation.
- Domain state must not contain CSS classes, icons, translated labels or router URLs.
- Prefer behavior-rich types when they protect an invariant, but avoid getter/setter wrappers with no
  behavior.

Examples of domain behavior:

- split an expense equally while distributing remainder cents deterministically;
- validate that percentages total 100%;
- calculate settlements from a balanced set of member balances;
- decide whether a household role may invite or remove a member.

The backend remains the final authority. Frontend domain rules exist to provide immediate feedback,
consistent behavior and testable workflows, not to replace server validation.

## 6. Application layer

Application code expresses user-oriented use cases such as `CreateExpense`, `InviteMember` or
`ConvertTicketToExpenseDraft`.

A use case:

- accepts an explicit command/query type;
- obtains data through a port;
- invokes domain behavior;
- persists or publishes through a port;
- returns a typed result suitable for presentation;
- contains no Angular component, template, router or HTTP knowledge.

Ports are owned by the inner layer that needs them. For example, `CreateExpense` owns the repository
capability it requires; the HTTP adapter implements that capability. Keep TypeScript port interfaces
framework-free. If Angular needs an `InjectionToken`, define it beside composition/provider code and
construct the plain use case through a provider factory.

Do not make one generic repository with unrelated CRUD operations. Define capabilities around actual
use cases and aggregates. Queries may use purpose-built read models rather than reconstructing rich
aggregates when no domain behavior is needed.

## 7. Infrastructure layer

Infrastructure contains replaceable external details:

- HTTP clients and endpoint-specific DTOs;
- DTO/domain/read-model mappers;
- local/session storage;
- file upload and receipt adapters;
- demo repositories used before backend integration;
- provider factories that wire ports to adapters.

Rules:

- Never expose raw API DTOs outside the adapter boundary.
- Map backend naming, nullable fields, dates and errors explicitly.
- Do not hide malformed server responses with unsafe casts.
- Translate transport failures into typed application failures that presentation can handle.
- Demo data must implement the same port and contract as HTTP data. Components must not know which
  adapter is active.
- Keep authentication token attachment and cross-cutting HTTP behavior in interceptors, without
  embedding domain decisions in them.

## 8. Presentation layer

Presentation includes pages, presentational components, route-local state and formatters.

Pages may:

- read route parameters;
- invoke use cases or a feature store/facade;
- map application results into view models;
- expose loading, empty, success and error states;
- coordinate navigation after a successful outcome.

Pages and components must not:

- import `HttpClient`, API DTOs, concrete repositories or demo constants;
- calculate settlements or validate domain invariants;
- infer workflow mode by searching the current URL string;
- persist state directly in browser storage;
- pass formatted UI strings back into domain/application code.

Use feature stores only for presentation state shared by multiple components or routes. Keep local
interaction state in the component. A store is not a replacement for domain models or use cases.

## 9. Cross-feature collaboration

Features are not allowed to import each other's internal domain/application/infrastructure paths.
Choose one of these explicit collaboration mechanisms:

1. a small feature public API;
2. an application port implemented at composition time;
3. a domain event or application event when temporal decoupling is genuinely needed;
4. a purpose-built read model for dashboard composition.

Avoid a global event bus for ordinary calls. Prefer direct, typed workflows until asynchronous
decoupling provides real value.

`dashboard` should consume query/read-model interfaces exposed by expenses, household and calendar.
It must not duplicate their calculations.

`ticket-ingestion` should produce an `ExpenseDraft` understood by the expenses application boundary.
It should not save an expense by importing the concrete expenses repository.

## 10. Shared and core

`shared/ui` is the ncasa design system: button, card, input, select, alert, avatar and similar
domain-neutral UI. Components remain accessible and must not know about expenses or households.

`shared/util` is permitted only for small, stable, domain-neutral pure helpers. If a helper uses a
business term, it likely belongs to that feature.

`core` is restricted to application-wide configuration and runtime concerns such as current session,
global error handling and HTTP configuration. Do not place feature entities, demo content or generic
"manager" services there.

## 11. Routing and composition

- Each substantial feature owns its lazy routes.
- Use route `data`, typed inputs or explicit commands for modes; do not inspect URL substrings.
- Authentication guards consult session/application state and never treat client-side guards as a
  security boundary.
- Configure the feature's adapter and use-case providers at the narrowest useful route scope.
- Keep `app.routes.ts` as a high-level map rather than a registry of every page.
- Development-only pages such as the style guide must not be accidentally exposed as production
  product functionality.

## 12. Error model

Separate expected failures from unexpected defects:

- expected: validation errors, unauthenticated, forbidden, not found, conflict, network unavailable;
- unexpected: programmer errors, violated internal invariants or malformed supposedly trusted data.

Use typed results/errors across application boundaries. Presentation decides the user-facing Spanish
message and recovery action. Infrastructure logs/normalizes transport details but must not choose UI
copy.

## 13. Incremental migration from the visual prototype

Do not rewrite all screens at once. Migrate one working vertical slice:

1. Start with `expenses`, the central ncasa context.
2. Characterize existing visible behavior with tests.
3. Extract typed domain concepts and pure calculations.
4. Add application use cases and repository ports.
5. Move `demo-content.ts` data behind demo adapters.
6. Change pages to consume use cases/store rather than constants.
7. Add HTTP adapters later without changing domain or presentation behavior.
8. Repeat for household, identity-access, ticket ingestion and calendar.

Prefer a complete small slice over partially creating every layer for every feature.

## 14. Architecture review checklist

Before completing a feature change, verify:

- Which bounded context owns the behavior?
- Is the rule in the innermost reasonable layer?
- Can domain/application code run in a plain Vitest test without Angular TestBed?
- Can demo and HTTP implementations be swapped at composition time?
- Are DTOs mapped at the boundary?
- Are money, dates and states represented safely?
- Does presentation know only application-facing types?
- Did the change introduce a cross-feature internal import or circular dependency?
- Is each abstraction protecting a current rule or external boundary?
