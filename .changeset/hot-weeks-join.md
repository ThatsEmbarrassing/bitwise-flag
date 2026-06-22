---
"bitwise-flag": minor
---

Add `resolveMask` utility, which resolves an array of flag names to their combined bit mask via the registry's combinator. `add`, `remove`, `toggle`, `hasAll`, `hasAny` and `hasNone` now use it internally instead of manual iteration.

BREAKING CHANGE: passing the same flag twice in one call now does NOT
cancel it: `toggle(flag, "a", "a", "b") !== toggle(flag, "b")`. Now it
just toggles it once: `toggle(flag, "a", "a", "b") === toggle(flag, "a",
"b")`.
