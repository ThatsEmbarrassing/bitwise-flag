# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Changelog keeping starts with version **2.0.0**. Earlier releases (`1.1.0` and
> below) predate this file and are not documented here. For step-by-step upgrade
> instructions see [MIGRATIONS.md](./MIGRATIONS.md).

## [2.0.0] - 2026-06-09

Version 2.0.0 is a major rewrite. The single, bigint-only `FlagsRegistry` / `Flag`
pair is replaced by a generic, numeric-type-agnostic architecture, and the
mutation/query helpers that used to live on the flag instance are now standalone,
tree-shakeable operators. Backward-compatible re-exports are kept for the 1.1.0
names, but several old call-sites **throw at runtime** even though they still
compile — read the [Removed](#removed) section and the detailed breakdown below.

### Added

- New modular, numeric-type-agnostic architecture split into `core`, `flags` and
  `operators` modules — see [New modular architecture](#new-modular-architecture).
- `NumberFlagRegistry` (number-backed, up to 31 flags) and `BigIntFlagRegistry`
  (bigint-backed, unbounded) registries — see [Number and BigInt registries](#number-and-bigint-registries).
- `Combinator` abstraction with `NumberCombinator` and `BigIntCombinator`
  implementations, decoupling the flag logic from the underlying numeric type.
- `registry.define({ ... })` static factory for declaring explicit bit values
  (the legacy `from(...)` auto-assigns successive powers of two).
- `registry.full()`, `registry.fullBits` and `flag.isFull()` for working with the
  "all flags set" value.
- New `Flag` members: `flag.toArray()`, `flag.toObject()`, `flag.size`, and a
  `radix` argument on `flag.toString(radix?)`.
- Standalone operators published under the `bitwise-flag/operators` subpath —
  basic (`add`, `remove`, `toggle`, `complement`, `equals`, `hasAll`, `hasAny`,
  `hasNone`) and set (`union`, `intersection`, `difference`,
  `symmetricDifference`, `overlaps`, `isSubsetOf`, `isSupersetOf`) — see
  [Standalone operators package](#standalone-operators-package).
- Cross-registry safety: operators reject flags coming from different registries
  via the new `assertSameRegistry` utility and `MixedRegistryError` — see
  [Set operators and cross-registry safety](#set-operators-and-cross-registry-safety).
- A full set of typed error classes (`DuplicateError`, `DuplicateFlagsError`,
  `InvalidFlagError`, `NotPositiveError`, `NotPowerOfTwoError`, `OverflowError`,
  `ParseError`, `UnknownBitsError`, `UnknownFlagError`) — see
  [Typed error classes](#typed-error-classes).
- Optional registry _branding_ generic (`TBrand`) so structurally identical
  registries can be kept nominally distinct at the type level — see
  [Registry branding](#registry-branding).
- Additional package entry points (`./operators`, `./operators/basic`,
  `./operators/set`, `./operators/utils`, `./operators/errors`) with both ESM and
  CJS builds.

### Changes

- The single `FlagsRegistry` class was split into `NumberFlagRegistry` and
  `BigIntFlagRegistry` — see [Number and BigInt registries](#number-and-bigint-registries).
- `flag.value` is renamed to `flag.bits`, and `registry.combine(...)` to
  `registry.of(...)` — see [Renamed properties and methods](#renamed-properties-and-methods).
- `registry.keys()`, `values()` and `entries()` now return plain arrays
  (`TFlags[]`, `TBit[]`, `[TFlags, TBit][]`) instead of `MapIterator` objects.
- `registry.get(key)` now throws `UnknownFlagError` for unregistered keys instead
  of returning `undefined`; correspondingly `flag.has(unknownKey)` no longer has a
  silent `false` path — see [Stricter validation and parsing](#stricter-validation-and-parsing).
- `registry.from(...)` now throws `DuplicateFlagsError` on repeated names instead
  of silently de-duplicating them.
- All error paths now throw dedicated, named error classes instead of generic
  `Error` objects — see [Typed error classes](#typed-error-classes).
- The public type surface was redesigned: `IFlag<T>` → `Flag<T, TBit, TBrand>`,
  `IFlagsRegistry<T>` → `FlagRegistry<T, TBit, TBrand>`, `FlagKey` → `string`.
- `BigIntFlagRegistry.parse()` accepts only `bigint | string`; passing a `number`
  is now a compile error.

### Deprecated

These names still resolve for backward compatibility but emit a TypeScript
deprecation warning and will be removed in a future major release.

- `FlagsRegistry` — re-exported as an alias of `BigIntFlagRegistry`. Prefer
  `NumberFlagRegistry` or `BigIntFlagRegistry`.
- `flag.value` getter — use `flag.bits`.
- `registry.combine(...)` — use `registry.of(...)`.
- Type aliases `IFlag`, `IFlagsRegistry` and `FlagKey` — use `Flag`,
  `FlagRegistry` and `string`.
- The `parse(value, radix)` overload — the `radix` argument now throws; see
  [Removed](#removed).
- The `Flag.add()` / `Flag.remove()` instance methods — retained as deprecated,
  `never`-returning stubs that throw; see [Removed](#removed).

### Removed

- The working implementations of `Flag.add()` and `Flag.remove()` instance
  methods. They are typed `never` (rejected at compile time) and throw at runtime
  if reached via JavaScript or a type cast. Use the `add` / `remove` operators
  instead — see [Standalone operators package](#standalone-operators-package).
- The `radix` argument of `registry.parse()`. Passing it now throws; use the
  standard JavaScript numeric prefixes (`0b`, `0o`, `0x`) or call `parseInt`
  yourself — see [Stricter validation and parsing](#stricter-validation-and-parsing).
- `number` support in `BigIntFlagRegistry.parse()`. Use a `bigint` literal
  (`3n`) or a string (`"3"`).

### Fixed

- Strict parsing: malformed input such as `"12abc"` or `"3.9"` is now rejected
  with `ParseError` instead of being silently truncated by `parseInt`.
- `BigIntFlagRegistry.parse()` no longer loses precision for very large numeric
  strings. The previous `parseInt(value) → Number → BigInt` round-trip silently
  corrupted values above `Number.MAX_SAFE_INTEGER`; parsing now goes through
  `BigInt` directly.
- Registries now validate every bit value at construction (`define()`):
  non-positive, duplicated, non-power-of-two, and out-of-range bits are rejected
  up front, preventing silently broken registries.

---

## Detailed changes

This section expands on the most impactful changes with examples. It is not
exhaustive — the [summary](#200---2026-06-09) above lists every change, and
[MIGRATIONS.md](./MIGRATIONS.md) covers each one with full migration steps.

### New modular architecture

The library is now organised into three layers:

- **`core`** — the numeric-type abstraction: the `Combinator<T>` interface plus
  `NumberCombinator` / `BigIntCombinator` implementations and the `Bit` type
  (`number | bigint`). All bitwise math goes through a `Combinator`, so the flag
  logic no longer hard-codes `bigint`.
- **`flags`** — the user-facing model: `FlagRegistry` / `Flag` interfaces, the
  `FlagBox` implementation, the internal `Repository`, the concrete registries,
  and the error classes.
- **`operators`** — standalone functions that act on flags, shipped from the
  `bitwise-flag/operators` subpath.

### Number and BigInt registries

The old bigint-only `FlagsRegistry` is split into two concrete registries so you
can pick the right numeric backing for your flag count:

```ts
// 1.1.0 — always bigint
import { FlagsRegistry } from "bitwise-flag";
const registry = FlagsRegistry.from("READ", "WRITE", "EXECUTE");

// 2.0.0 — choose the backing type
import { NumberFlagRegistry, BigIntFlagRegistry } from "bitwise-flag";

// up to 31 flags, cheaper `number` math:
const perms = NumberFlagRegistry.from("READ", "WRITE", "EXECUTE");

// unbounded number of flags:
const many = BigIntFlagRegistry.from("A", "B", "C" /* ... */);
```

Both expose a `define()` factory for explicit bit values:

```ts
const perms = NumberFlagRegistry.define({
  READ: 1,
  WRITE: 2,
  EXECUTE: 4,
});
```

`FlagsRegistry` is still exported as a deprecated alias of `BigIntFlagRegistry`,
so existing runtime code keeps working.

### Standalone operators package

Mutation and query helpers moved off the flag instance and into standalone
operators. This makes them tree-shakeable and lets the flag object stay a small,
immutable value.

```ts
// 1.1.0 — methods on the flag (returned a new flag)
const extended = flag.add("WRITE", "EXECUTE");
const reduced = extended.remove("EXECUTE");

// 2.0.0 — operators from the subpath
import { add, remove } from "bitwise-flag/operators";

const extended = add(flag, "WRITE", "EXECUTE");
const reduced = remove(extended, "EXECUTE");
```

`flag.add()` / `flag.remove()` still exist but are typed `never` and throw if
called, to surface the migration:

```
Error: DEPRECATED: FlagBox.add() was removed in 2.0.0.
       Use the `add` operator from 'bitwise-flag/operators' instead
```

Available operators:

- **basic:** `add`, `remove`, `toggle`, `complement`, `equals`, `hasAll`,
  `hasAny`, `hasNone`
- **set:** `union`, `intersection`, `difference`, `symmetricDifference`,
  `overlaps`, `isSubsetOf`, `isSupersetOf`

### Set operators and cross-registry safety

Operators that combine multiple flags assert all operands share the **same
registry instance** (compared by reference). Mixing flags from two different
registries throws `MixedRegistryError`:

```ts
import { union } from "bitwise-flag/operators";

const a = NumberFlagRegistry.from("READ", "WRITE");
const b = NumberFlagRegistry.from("READ", "WRITE");

union(a.of("READ"), b.of("WRITE")); // throws MixedRegistryError
```

This guards against silently OR-ing bits that mean different things in different
registries.

### Registry branding

Both `NumberFlagRegistry` and `BigIntFlagRegistry` accept an optional second
generic argument `TBrand` (a `string` or `symbol` literal). It is a phantom type
— it carries no runtime value — but it makes two registries that have identical
flag names and bit widths **nominally distinct** at the type level.

Without branding, TypeScript only checks the structural shape, so flags from two
different registries with the same flag names are assignable to each other. A
brand adds a unique "tag" that prevents silent mix-ups:

```ts
import { NumberFlagRegistry } from "bitwise-flag";

// Without branding — structurally identical, so flags are interchangeable
const filePerms = NumberFlagRegistry.from("READ", "WRITE", "EXECUTE");
const netPerms  = NumberFlagRegistry.from("READ", "WRITE", "EXECUTE");

type FileFlag = ReturnType<typeof filePerms.of>;
type NetFlag  = ReturnType<typeof netPerms.of>;

declare function applyFilePerms(f: FileFlag): void;
applyFilePerms(netPerms.of("READ")); // compiles — no protection

// With branding — nominally distinct despite identical structure
const filePerms2 = NumberFlagRegistry.from<
  "READ" | "WRITE" | "EXECUTE",
  "FilePerms"
>("READ", "WRITE", "EXECUTE");

const netPerms2 = NumberFlagRegistry.from<
  "READ" | "WRITE" | "EXECUTE",
  "NetPerms"
>("READ", "WRITE", "EXECUTE");

type FileFlag2 = ReturnType<typeof filePerms2.of>;
type NetFlag2  = ReturnType<typeof netPerms2.of>;

declare function applyFilePerms2(f: FileFlag2): void;
applyFilePerms2(netPerms2.of("READ")); // compile error — brands do not match
```

`TBrand` defaults to the unique `symbol` type, which means every registry
without an explicit brand is already distinct from every other unbranded
registry at the type level (since `symbol` identity is per-declaration). An
explicit `string` brand is useful when you need to name the type in annotations
or share it across module boundaries:

```ts
// Reusable branded type aliases
type FileFlag = Flag<"READ" | "WRITE" | "EXECUTE", number, "FilePerms">;
type NetFlag  = Flag<"READ" | "WRITE" | "EXECUTE", number, "NetPerms">;
```

### Renamed properties and methods

```ts
// 1.1.0
console.log(flag.value); // 3n
const flag2 = registry.combine("READ", "WRITE");

// 2.0.0
console.log(flag.bits); // 3n
const flag2 = registry.of("READ", "WRITE");
```

`flag.value` and `registry.combine()` remain as deprecated forwarders, so runtime
behaviour is unchanged while TypeScript nudges you toward `flag.bits` and
`registry.of()`.

### Typed error classes

Every error condition now has a dedicated class exported from the main entry
point, so you can branch on `instanceof` instead of matching message strings:

```ts
import { ParseError, UnknownFlagError } from "bitwise-flag";

try {
  registry.parse(userInput);
} catch (e) {
  if (e instanceof ParseError) {
    /* handle malformed input */
  } else if (e instanceof UnknownFlagError) {
    /* handle unregistered flag */
  }
}
```

| Condition                            | 1.1.0                              | 2.0.0                 |
| ------------------------------------ | ---------------------------------- | --------------------- |
| Unknown flag key in `has` / `get`    | — (returned `false` / `undefined`) | `UnknownFlagError`    |
| Duplicate bit value in `define()`    | —                                  | `DuplicateError`      |
| Duplicate name in `from()`           | — (silently de-duped)              | `DuplicateFlagsError` |
| Unparseable string                   | `Error`                            | `ParseError`          |
| Unknown bits in `parse()`            | `Error`                            | `UnknownBitsError`    |
| Non-power-of-two value in `define()` | —                                  | `NotPowerOfTwoError`  |
| Value out of `number` range          | —                                  | `OverflowError`       |
| Non-positive bit value               | —                                  | `NotPositiveError`    |
| Flags from different registries      | —                                  | `MixedRegistryError`  |

### Stricter validation and parsing

`parse()` no longer takes a `radix`. Use JavaScript numeric prefixes instead, and
note that input is now validated strictly:

```ts
// 1.1.0
registry.parse("11", 2); // binary → READ | WRITE
registry.parse("ff", 16); // hex

// 2.0.0
registry.parse("0b11"); // binary prefix
registry.parse("0xff"); // hex prefix
registry.parse("0o17"); // octal prefix

registry.parse("12abc"); // throws ParseError (was silently truncated to 12)
```

Unregistered keys now fail loudly rather than returning a falsy value:

```ts
const registry = BigIntFlagRegistry.from("READ", "WRITE", "EXECUTE");

registry.get("ADMIN"); // throws UnknownFlagError (was `undefined` in 1.1.0)
registry.from("READ", "WRITE", "READ"); // throws DuplicateFlagsError (was silent dedup)
```

[2.0.0]: https://github.com/ThatsEmbarrassing/bitwise-flag/releases/tag/2.0.0
