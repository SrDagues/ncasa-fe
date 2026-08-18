# AGENTS.md

## Project mission

`ncasa-fe` is the Angular frontend for ncasa, a household-management product for shared
expenses, receipt ingestion, household members and a shared calendar.

Build the application as a modular monolith organized by business feature. Apply Domain-Driven
Design where there are real business rules, Hexagonal Architecture at external boundaries, Clean
Architecture's dependency rule, and test-driven development for new or changed behavior.

Do not add layers, abstractions or patterns merely to make the directory tree look architectural.
Simple presentational behavior should remain simple. Business decisions, external I/O and stateful
workflows must have explicit boundaries.

## Required reading

Read the relevant document before making changes:

- `docs/ARCHITECTURE.md`: required for features, domain rules, state, API integration, routing,
  repositories, use cases, DTOs, authentication or cross-feature changes.
- `docs/TESTING.md`: required whenever behavior is added, changed, fixed or refactored.
- `docs/ANGULAR_GUIDELINES.md`: required for Angular components, templates, forms, styles and
  accessibility work.

If a change affects more than one of these areas, read all applicable documents. These documents
are normative. Update them in the same change when an accepted architectural decision changes.

## Non-negotiable dependency rules

- `domain` contains plain TypeScript and imports neither Angular nor infrastructure.
- `application` coordinates use cases and depends only on domain types and inward-facing ports.
- `infrastructure` implements ports for HTTP, browser APIs, storage and demo data.
- `presentation` contains Angular pages, components and feature state; it invokes application use
  cases and never imports HTTP adapters, API DTOs or demo constants directly.
- Angular route/provider configuration is the composition root that wires ports to adapters.
- Dependencies point inward. Never make domain or application code depend on presentation or
  infrastructure.
- Keep features independent. A feature must not reach into another feature's internal folders.
  Collaborate through an explicit public API, application port or read model.
- `shared` contains stable, domain-neutral UI or utilities only. Do not turn it into a dumping ground.
- `core` is for truly application-wide concerns such as session, error handling and configuration;
  feature data does not belong there.

## Development workflow

1. Inspect the relevant feature, tests and documentation before editing.
2. State the behavior and identify the owning bounded context.
3. For behavior changes, write a failing test first unless the task is documentation-only,
   mechanical or a pure visual spike. Record the reason when TDD is not appropriate.
4. Implement the smallest change that makes the test pass.
5. Refactor while keeping tests green and respecting dependency boundaries.
6. Run the narrowest relevant tests, then the complete unit suite and production build.
7. Review the diff for accidental coupling, `any`, inaccessible markup and unrelated changes.

Never weaken or delete a meaningful test merely to make a change pass. Do not silently alter domain
language, API contracts or architectural boundaries.

## Commands and verification

- Install dependencies: `npm ci`
- Start development server: `npm start`
- Run tests once: `npm test -- --watch=false`
- Production build: `npm run build`

There is currently no lint or end-to-end script. Do not claim those checks ran unless the project
adds them. A behavior change is complete only when its relevant tests, the full test suite and the
production build pass, or when a concrete blocker is reported.

## TypeScript rules

- Use strict type checking. New code must be compatible with `strict` and strict template checking.
- Never introduce `any`. Use a precise type, generic, discriminated union or `unknown` with narrowing.
- Prefer immutable values and `readonly`; do not mutate imported constants or shared state.
- Model domain states with types, not arbitrary UI strings.
- Represent money in integer minor units or a tested `Money` value object; do not use floating-point
  arithmetic for business calculations.
- Keep API DTOs separate from domain models and map explicitly between them.
- Use ISO representations at boundaries and format dates/currency only in presentation.

## Angular rules

- Use Angular 22 standalone APIs; do not add NgModules.
- Do not set `standalone: true` or `ChangeDetectionStrategy.OnPush` explicitly when they are defaults.
- Use `inject()` rather than constructor injection in Angular-managed classes.
- Use signals for local and feature presentation state, `computed()` for derived state and immutable
  `set()`/`update()` operations.
- Use `input()`, `output()` and `model()` instead of decorator-based inputs and outputs in new code.
- Use native template control flow (`@if`, `@for`, `@switch`) and class/style bindings instead of
  `*ngIf`, `*ngFor`, `ngClass` or `ngStyle` in new or substantially modified templates.
- Prefer Signal Forms for new Angular 22 forms. Use Reactive Forms when Signal Forms are unsuitable;
  do not introduce template-driven forms for application workflows.
- Lazy-load feature routes. Keep route declarations close to their feature.
- Components must not inject `HttpClient` or execute business calculations.
- Keep templates declarative and components focused on presentation and user interaction.

## Accessibility and UI

- Meet WCAG 2.2 AA and pass relevant AXE checks.
- Use semantic HTML and native controls before ARIA.
- Never nest interactive controls, such as a button inside a link.
- Every interactive control needs an accessible name, visible focus, keyboard support and correct
  disabled/error state.
- Do not use color as the only indicator of meaning.
- Preserve the ncasa design language unless the task explicitly changes it: calm household UI,
  Geist/Inter-style typography and the established forest, cream, coral, sage and charcoal palette.

## Code review rules

Flag a change when it:

- places domain behavior in an Angular component, template, mapper or HTTP adapter;
- bypasses a use case or port by accessing demo data, storage or HTTP directly from presentation;
- leaks API DTOs into domain or presentation state;
- introduces `any`, floating-point money calculations or formatted dates as domain data;
- couples feature internals or moves feature-specific code into `shared`/`core`;
- changes behavior without an appropriate test;
- tests implementation details instead of observable behavior;
- creates invalid or inaccessible interactive markup;
- adds an abstraction with only hypothetical value and no current boundary or behavior to protect.

## Scope discipline

- Prefer small vertical slices over repository-wide rewrites.
- Preserve existing working UI while migrating boundaries incrementally.
- Avoid unrelated formatting and renaming.
- Do not add a state-management library, UI framework or production dependency without a concrete
  need and explicit approval.
- The backend is authoritative for security and persistence, but the frontend still validates user
  input and models its business behavior consistently.
