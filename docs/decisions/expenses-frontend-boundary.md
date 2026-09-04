# Expenses frontend boundary

- Status: Accepted
- Date: 2026-08-20

Expenses is a frontend bounded context organized as `domain`, `application`, `infrastructure` and `presentation`. Domain is plain TypeScript. Application owns input/output ports and use cases. HTTP is an outbound adapter, Angular pages are inbound adapters, and the authenticated route is the composition root.

Money is represented with integer minor units (`bigint`) plus an explicit ISO currency. Decimal API strings are parsed and serialized without floating-point arithmetic. Equal splits are calculated by sorted member identifier so their preview matches the backend's deterministic remainder rule. Persisted allocations are always displayed as returned and are never recalculated.

Expense owns scalar household and member references instead of importing Household domain objects. Presentation may enrich those references with labels and current-user capabilities through Household's public API; Expense domain and application remain independent. Dashboard consumes only the public recent-expenses query.

Categories, balances, settlements, drafts, recurrence and receipt ingestion remain separate future capabilities. Their absence must not be represented with demo financial data.
