---
"bitwise-flag": patch
---

Refactor `add`, `toggle`, `remove`, `hasAll`, `hasAny`, `hasNone` and `equals` operators:

- `add`, `toggle` and `remove` now iterate directly instead of chaining callbacks
- `hasAll`. `hasAny`, `hasNone` and `equals` now have `TBrand` generic type
