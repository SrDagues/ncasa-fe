# Testing and TDD

## 1. Purpose

Tests document product behavior, protect domain invariants and make external adapters replaceable.
They are not a metric-gaming exercise and must not duplicate implementation line by line.

Use Vitest through Angular's unit-test builder. Prefer plain Vitest for framework-independent code and
Angular TestBed only when Angular behavior or rendered DOM is part of the contract.

## 2. TDD loop

For every behavior change:

1. **Red:** write the smallest failing test that describes externally observable behavior.
2. **Green:** implement the simplest production code that passes.
3. **Refactor:** improve names, duplication and structure while all tests remain green.

Run the focused spec during the loop. Before completion, run the full suite and production build.

TDD may be skipped for documentation-only edits, mechanical configuration changes or exploratory
visual spikes with no durable behavior. Once a spike becomes product code, characterize and drive its
behavior with tests before extending it.

## 3. Test layers

| Layer | What to test | Preferred technique |
| --- | --- | --- |
| Domain | Invariants, calculations, rounding, state transitions | Plain Vitest, table-driven tests |
| Application | Use-case orchestration, port calls, typed failures | Plain Vitest with hand-written fakes |
| Infrastructure | DTO mapping, URLs, serialization, error translation | Contract tests and Angular HTTP testing utilities |
| Presentation state | Loading/data/empty/error transitions, commands | Plain Vitest when possible |
| Components/pages | Rendered semantics, inputs, user actions, navigation outcomes | Angular TestBed and DOM queries |
| Routing | Guards, redirects, lazy route behavior | Router testing utilities |
| End to end | A few critical user journeys | E2E runner when added to the project |

Most business behavior should be covered below the component layer, where tests are faster and more
precise.

## 4. Naming and structure

Name tests as behaviors:

```ts
describe('splitExpenseEqually', () => {
  it('should distribute remainder cents deterministically when amount is not divisible', () => {
    // Given
    // When
    // Then
  });
});
```

Use Given-When-Then comments when they improve a non-trivial test. Avoid comments that only repeat
obvious assignments.

Each spec should live beside the code under test. Do not create a disconnected global `tests` folder.

## 5. Domain tests

Domain tests must not configure TestBed or mock Angular. Cover examples and invariants, especially
edge cases.

Minimum expense/splitting cases:

- valid and invalid money values;
- zero/negative expense rejection according to product rules;
- equal division with and without remainder cents;
- percentage totals below, equal to and above 100%;
- exact allocations that do not total the expense;
- included/excluded members;
- multiple creditors and debtors;
- already settled balances;
- stable rounding and conservation of money.

Useful property/invariant assertions include:

```text
sum(allocations) == expense amount
sum(member balances) == 0
sum(settlement payments) == total debt settled
no allocation contains fractional cents
```

Test public factories and behavior, not private helpers.

## 6. Application tests

Use hand-written in-memory fakes for ports. Prefer a fake repository with observable stored state over
deep spy chains tied to method implementation.

An application test should verify outcomes such as:

- a valid command saves the expected aggregate;
- an invalid command returns a typed failure and does not save;
- a missing session prevents an authorized workflow;
- a repository conflict is translated into an application-level conflict;
- a receipt draft is handed to the expenses boundary with normalized values.

Check collaborations only when the collaboration is itself part of the use-case contract. Do not
assert exact internal call order without a business reason.

## 7. Adapter and contract tests

Every implementation of the same repository port should satisfy shared contract tests. Use a small
test factory so both demo and HTTP-backed implementations prove consistent observable semantics where
practical.

HTTP adapter tests should verify:

- method, URL, query parameters and request body;
- DTO-to-domain and domain-to-DTO mapping;
- date and money serialization;
- nullable/optional fields;
- malformed payload handling;
- expected HTTP error translation;
- no leakage of transport objects past the adapter.

Do not mock the adapter under test. Mock only the external boundary beneath it.

## 8. Component tests

Test components through rendered DOM and user-observable behavior:

- accessible labels and semantic elements exist;
- initial loading/empty/data/error state is correct;
- typing/selecting updates the form state;
- invalid submit shows useful errors and does not invoke the use case;
- valid submit invokes the public workflow once;
- success navigates or updates the page as specified;
- failure preserves recoverable user input;
- keyboard interaction works for custom controls.

Avoid brittle assertions on complete HTML snapshots or long Tailwind class strings. Assert a class
only when it represents an explicit visual/accessible state contract.

Prefer native DOM queries by role, label and text. If shared UI components become complex, introduce
test harnesses around their public interaction contract.

## 9. Form tests

For every application form, cover:

- required fields;
- format and domain validation;
- boundary values;
- submit disabled/pending behavior when applicable;
- duplicate-submit prevention;
- server validation/conflict responses;
- preservation or clearing of values after outcomes;
- association between errors, hints, labels and controls.

Custom form controls must prove that value, disabled, touched and validation behavior propagate
correctly through the chosen Angular forms API.

## 10. Test doubles

Use terminology consistently:

- **fake:** working simplified implementation, e.g. in-memory repository;
- **stub:** returns controlled data;
- **spy:** records interaction when that interaction matters;
- **mock:** expectation-driven double, used sparingly.

Never mock value objects or pure domain entities. Construct real ones.

Do not mock the unit's own internal methods. If a class is hard to test without doing so, revisit its
responsibilities and boundaries.

## 11. Determinism

- Inject clocks and ID generators when values affect behavior.
- Use fixed dates in tests; do not depend on the machine's current day or timezone.
- Do not make real network requests.
- Reset shared fakes/state between tests.
- Avoid arbitrary sleeps and timing-sensitive assertions.
- Keep fixtures small and name values for the scenario they demonstrate.

## 12. Regression fixes

For a defect:

1. reproduce it with a failing test at the lowest layer that expresses the broken behavior;
2. fix the underlying cause, not just the rendered symptom;
3. add higher-level coverage only when the integration path also failed;
4. keep the regression test permanently unless the behavior is intentionally removed.

## 13. Coverage policy

No numeric threshold is currently configured. Do not chase 100% blindly. Require strong behavioral
coverage for domain and application code and focused integration coverage at external boundaries.

A future threshold may enforce a floor, but review quality still depends on meaningful assertions,
edge cases and mutation resistance—not just executed lines.

## 14. Critical ncasa journeys

When E2E support is introduced, keep the suite small and prioritize:

1. register and create a household;
2. log in and restore a session;
3. create and split an expense;
4. scan a receipt, review its draft and save the expense;
5. invite a member;
6. create a calendar event;
7. settle household balances.

Security authorization must also be tested on the backend; a frontend route guard is user experience,
not enforcement.

## 15. Definition of done

A behavior change is done when:

- the new behavior was driven or characterized by an appropriate test;
- relevant edge cases and failures are covered;
- tests assert public outcomes rather than implementation details;
- the focused spec passes;
- `npm test -- --watch=false` passes;
- `npm run build` passes;
- no test was weakened to accommodate the implementation;
- documentation is updated if the behavior changes a public contract or architectural decision.
