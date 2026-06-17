---
"bitwise-flag": patch
---

Fix both `NumberFlagRegistry.parse()` and `BigIntFlagRegistry.parse()` to throw ParseError for empty-string input instrad of silently returning the empty flag.
