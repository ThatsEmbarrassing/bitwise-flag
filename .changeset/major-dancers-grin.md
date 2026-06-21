---
"bitwise-flag": patch
---

`Repository` now caches `keys()`, `values()` and `entries()` accessors in the constructor instead of re-creating them from the `Map` on every call.
`FlagBox.toArray()` and `FlagBox.toObject()` now iterate directly instead of chaining callbacks
