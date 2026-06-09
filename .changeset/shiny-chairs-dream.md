---
"bitwise-flag": patch
---

Fix `Repository.has()` to report presence by key registration instead of coercing the stored bit value, so flags with a falsy (`0` / `0n`) value are no longer treated as absent.
