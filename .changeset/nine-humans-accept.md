---
"bitwise-flag": patch
---

Both `BigIntFlagRegistry` and `NumberFlagRegistry` now share a single `Combinator` instance at the module level instead of allocation a new one per registry instance.
