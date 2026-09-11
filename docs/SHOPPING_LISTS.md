# Shopping lists frontend

The lazy feature lives at `/app/shopping-lists`, with trash at `/app/shopping-lists/trash`. Its public API only
exports `provideShoppingLists()`. Domain and application code are framework-independent; HTTP and browser storage
are adapters assembled at the app route composition root.

The default view follows the selected ncasa mockup. Product, numeric quantity and optional note are always visible.
Unit, custom unit and responsible member are under “More options”. A successful quick add clears the form and
returns focus to product. Pending and purchased products remain in separate cards.

Pointer and touch ordering use Angular CDK Drag & Drop. “Move up” and “Move down” buttons expose the same operation
to keyboard and assistive-technology users. Purchased products move immediately to the lower section and use both a
checked control and struck-through text.

The feature stores the last selected list per household through a browser-storage port. If it disappears, the most
recently updated active list is selected. Detail polling runs every 15 seconds only on the visible route, refreshes
immediately after browser visibility returns, uses ETag/If-None-Match, and keeps the current screen untouched on
`304`. A `409` reloads authoritative state and presents a recoverable message.

The MVP intentionally excludes prices, expenses, budgets, notifications, offline storage and WebSocket/SSE.
