# ADR-0004 — Read models financieros y liquidaciones

Los balances mensual y actual se consumen como read models y no se reconstruyen sumando páginas de gastos. `Settlement` conserva identidad y ciclo de vida en el dominio de Expenses, mientras que el backend sigue siendo autoridad sobre deuda, sugerencias y permisos.

Los adaptadores HTTP validan respuestas desconocidas y serializan `Money` como decimal. El alta conserva una clave idempotente para reintentos del mismo payload y la rota cuando el usuario edita tras un intento. Dashboard sólo consume la proyección pública reducida expuesta por Expenses.
