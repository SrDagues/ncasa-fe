# Shopping lists frontend

The lazy feature lives at `/app/shopping-lists`, with trash at `/app/shopping-lists/trash`. Its public API only
exports `provideShoppingLists()`. Domain and application code are framework-independent; HTTP and browser storage
are adapters assembled at the app route composition root.

The default view follows the selected ncasa mockup. Product, numeric quantity and optional note are always visible.
Unit, custom unit and responsible member are under “More options”. A successful quick add clears the form and
returns focus to product. Pending and purchased products remain in separate cards.

Pointer and touch ordering use an always-visible Angular CDK Drag & Drop handle. “Move up” and “Move down” menu
actions expose the same operation to keyboard and assistive-technology users. Quantity/unit and assignee remain
visible on narrow screens. Purchased products move immediately to the lower section, use both a checked control and
struck-through text, and retain the same edit and delete actions as pending products.

“Reuse purchased” prepares a new manual shopping cycle on the same list. After an accessible confirmation, every
purchased product is appended to pending in purchase order. Quantity, unit, note and assignee remain; purchase audit
is cleared and no historical cycle or copied list is created. The backend response replaces both sections and ETag.

The feature stores the last selected list per household through a browser-storage port. If it disappears, the most
recently updated active list is selected. Detail polling runs every 15 seconds and active-list discovery every 60
seconds only on the visible route. Both refresh immediately after browser visibility returns, use ETag/If-None-Match,
keep the current screen untouched on `304`, and cancel in-flight requests when leaving the route. List and trash load
states are independent. A `409` reloads authoritative state and presents a recoverable message. Destructive actions
use the shared accessible confirmation dialog, which restores focus to the triggering control.

The MVP intentionally excludes prices, expenses, budgets, notifications, offline storage and WebSocket/SSE.
