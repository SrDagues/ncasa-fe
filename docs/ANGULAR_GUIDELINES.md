# Angular and frontend guidelines

## 1. Baseline

The project targets Angular 22, TypeScript 6, standalone components, signals and Vitest. Follow the
repository's installed version and official APIs; do not copy legacy Angular patterns from older
projects.

New and substantially modified code must be compatible with strict TypeScript and strict Angular
template checking, even while legacy prototype code is being migrated.

## 2. Components and state

Use components for rendering and user interaction. Business rules belong to domain/application code.

- Use `input()`, `output()` and `model()` for component APIs.
- Use required inputs when absence is invalid.
- Keep derived values in `computed()` instead of mutable duplicated state.
- Use `linkedSignal()` only when writable state genuinely needs to reset/synchronize from multiple
  reactive inputs.
- Use `effect()` for synchronization with an external imperative system, not for deriving state or
  propagating values between signals.
- Keep local UI state local. Introduce a feature store/facade only when state spans components/routes
  or coordinates an asynchronous workflow.
- Do not add NgRx or another state library without demonstrated complexity and explicit approval.

Prefer a page/container that coordinates a use case and small presentational components that express
inputs and outputs. Do not split a clear 20-line component into abstractions without a concrete reuse
or responsibility boundary.

## 3. Dependency injection

- Use `inject()` in Angular-managed code.
- Keep plain domain and use-case classes constructible without Angular.
- Provide infrastructure adapters at application or feature-route composition roots.
- Avoid global `providedIn: 'root'` for feature state that should disappear with a route scope.
- Use an Angular `InjectionToken` only at the runtime composition boundary; do not contaminate domain
  models with Angular DI concerns.

Components must not inject `HttpClient`, storage adapters or concrete repositories.

## 4. Templates

- Use `@if`, `@for` and `@switch` in new or substantially changed templates.
- Supply a stable tracking key to `@for`; do not use object identity for server-refetched collections.
- Use property/class/style bindings rather than `ngClass` and `ngStyle`.
- Move non-trivial transformations into typed computed view models, not template method calls.
- Avoid calling methods repeatedly from templates when the value can be derived once.
- Keep pipes for presentation formatting only.
- Do not expose UI strings as domain values.

Use relative template/style paths and colocate a component, its template, styles and spec.

## 5. Forms

Prefer Signal Forms for new Angular 22 workflows. Use Reactive Forms when a required capability or
integration is not suitable for Signal Forms. Do not add new template-driven workflow forms.

Form responsibilities:

- the form model represents editable input, not a domain entity in partially valid state;
- UI validation gives immediate accessible feedback;
- application/domain validation remains authoritative for business rules;
- submit maps validated form data into an explicit command;
- loading, success, field error and general error states are modeled explicitly;
- disable or guard repeated submissions;
- preserve useful input when a recoverable request fails.

Shared controls should integrate with the selected forms API. Do not create a decorative select that
changes visually without emitting/updating its value. For two-way component APIs, use `model()`.

Inputs require appropriate `name`, `type`, `inputmode`, `autocomplete`, min/max/step and accessible
description/error connections where applicable.

## 6. Routing

- Lazy-load feature route arrays or page components.
- Keep feature routes inside the feature and keep root routes high-level.
- Use guards for session-oriented user experience, while relying on backend authorization for security.
- Read typed route params/data; never infer behavior with `router.url.includes(...)`.
- Use route data or distinct pages for explicit workflow modes.
- Navigate only after the relevant application outcome succeeds.
- Ensure wildcard and unauthorized redirects do not create loops.

## 7. HTTP and API integration

Only infrastructure adapters use `HttpClient`.

- Keep API base configuration environment-specific and inject it at composition time.
- Define endpoint DTOs based on the actual backend contract.
- Validate/narrow unknown external data where trust is not guaranteed.
- Map DTOs to domain models or presentation read models explicitly.
- Centralize token attachment and broadly applicable transport behavior in interceptors.
- Do not put feature-specific error copy or business decisions in interceptors.
- Support cancellation or request replacement for search/typeahead workflows.
- Model loading, empty and error states; do not treat an empty array as every possible outcome.

## 8. Async and signals

Use signals for synchronous presentation state and RxJS for event streams where cancellation,
composition or time-based operators provide value. Convert at clear boundaries rather than mixing
both styles indiscriminately.

- Avoid nested subscriptions.
- Use operators such as `switchMap` for replaceable requests.
- Use Angular lifecycle-aware subscription helpers when a manual subscription is necessary.
- Do not store the same source of truth in both an Observable and a writable signal.
- Keep asynchronous error states typed and recoverable.

## 9. Shared UI design system

Place domain-neutral primitives under `shared/ui/<component>` rather than a broad growing
`shared/components` bucket when migrating existing code.

Shared UI components must:

- expose typed, minimal APIs;
- support content projection where it reduces duplicated markup;
- preserve native semantics;
- propagate disabled and validation state correctly;
- avoid containing household/expense-specific language or behavior;
- be tested through their public DOM interaction contract.

Do not implement a button as a button nested inside a link. Use a styled link for navigation and a
button for actions. If visual styles are shared, share styling primitives rather than invalid markup.

## 10. Accessibility

Target WCAG 2.2 AA and relevant AXE checks.

- Start with semantic HTML and native controls.
- Every form control has a programmatically associated label.
- Error/hint text is associated using `aria-describedby`; invalid state uses `aria-invalid` where
  appropriate.
- Icon-only actions have an accessible name.
- Decorative SVGs/icons are hidden from assistive technology.
- Dynamic status/error messages use an appropriate live region when users need announcement.
- Dialogs manage initial focus, focus trapping and focus restoration.
- All actions work by keyboard without custom key handling when native elements suffice.
- Focus indicators remain visible.
- Color contrast meets AA and color is never the sole status signal.
- Touch targets should be comfortably sized, especially in the mobile bottom navigation.

Do not add redundant ARIA or roles that conflict with native semantics.

## 11. Styling and design language

Preserve the established ncasa identity:

- forest `#123C36`;
- cream `#F7F1E7`;
- coral `#F26B5B`;
- sage `#9DB9A7`;
- charcoal `#202624`;
- Geist-style typography, with Inter as fallback where needed;
- calm, warm and clear household-product tone.

Use design tokens/Tailwind theme values instead of repeated arbitrary colors. Avoid dynamic Tailwind
class construction that build tooling cannot discover. Keep responsive behavior mobile-first.

Do not use inline CSS or introduce a second styling system without a concrete requirement.

## 12. Data display

- Keep money as minor units/domain `Money` until the view-model boundary, then format as EUR with the
  intended locale.
- Keep local dates and instants distinct; format them only for display.
- Do not sort or filter source arrays in place.
- Use typed status-to-label/tone/icon mappings in presentation.
- Ensure status meaning is expressed by text/icon as well as color.
- Treat dashboard values as query projections, not duplicated domain calculations inside components.

## 13. Performance

Measure before optimizing, but follow safe defaults:

- lazy-load feature routes;
- keep stable keys for lists;
- use `NgOptimizedImage` for static raster images;
- avoid repeated expensive template computation;
- paginate or virtualize genuinely large lists;
- do not ship demo/style-guide code in production unintentionally;
- keep dependencies minimal and inspect bundle impact before adding one.

Do not add manual memoization or complex caching without measured need and invalidation rules.

## 14. Security and privacy

- Never treat route guards as authorization.
- Do not store sensitive data in local storage without an explicit security decision.
- Do not log tokens, passwords, receipt contents or personal household data.
- Rely on Angular escaping; do not bypass sanitization for untrusted content.
- Validate file type/size client-side for user feedback and again server-side for enforcement.
- Avoid exposing raw backend error details to users.
- Use secure cookie/session strategy according to the backend contract; do not invent token storage in
  a component.

## 15. Angular review checklist

- Does the component only coordinate presentation behavior?
- Are inputs/outputs/models typed and minimal?
- Is derived state computed rather than duplicated?
- Is the form integrated and validated rather than merely styled?
- Are list keys stable?
- Are route modes explicit?
- Is the DOM semantic and keyboard accessible?
- Are labels, errors and focus behavior correct?
- Are API/DTO concerns confined to infrastructure?
- Are loading, empty, success and failure states represented?
- Did the change preserve ncasa's responsive design and visual language?
