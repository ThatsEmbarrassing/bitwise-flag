# Migration

## Migration Guide: 1.1.0 → 2.0.0

### Summary

Version 2.0.0 is a major rewrite that replaces the single bigint-only `FlagsRegistry` / `Flag`
pair with a fully generic, numeric-type-agnostic architecture. Several APIs that existed on the
`Flag` instance in 1.x have been moved out into standalone operator functions exported from the
new `bitwise-flag/operators` sub-package. Deprecated backward-compatible re-exports are provided
for the old names, but a number of old call-sites will **throw at runtime** even though they
compile — read each section carefully.

---

### Changes

Overview:

- [`flag.add()` and `flag.remove()` throw at runtime](#flagadd-and-flagremove-throw-at-runtime)
- [`registry.parse(value, radix)` throws at runtime when `radix` is supplied](#registryparsevalue-radix-throws-at-runtime-when-radix-is-supplied)
- [`registry.from()` throws on duplicate flag names](#registryfrom-throws-on-duplicate-flag-names)
- [`BigIntFlagRegistry.parse()` no longer accepts `number`](#bigintflagregistryparse-no-longer-accepts-number)
- [`FlagsRegistry` renamed to `BigIntFlagRegistry`](#flagsregistry-renamed-to-bigintflagregistry)
- [`flag.value` renamed to `flag.bits`](#flagvalue-renamed-to-flagbits)
- [`keys()`, `values()`, `entries()` return arrays, not iterators](#keys-values-entries-return-arrays-not-iterators)
- [`IFlag`, `IFlagsRegistry`, and `FlagKey` renamed](#iflag-iflagsregistry-and-flagkey-renamed)
- [`registry.combine()` deprecated in favour of `registry.of()`](#registrycombine-deprecated-in-favour-of-registryof)
- [Errors are now typed classes](#errors-are-now-typed-classes)
- [`repository.get` now throws for unregistered flags](#repositoryget-now-throws-for-unregistered-flags)

#### `flag.add()` and `flag.remove()` throw at runtime

In 1.1.0 `add` and `remove` were the primary way to produce a modified flag. Both methods lived
directly on the `Flag` instance and returned a new `IFlag`.

In 2.0.0 these methods still exist on the flag object (return type `never`) so TypeScript will
reject the call at compile time. If the call reaches runtime — e.g. through a JS file or a type
cast — it throws:

```
Error: DEPRECATED: FlagBox.add() was removed in 2.0.0.
       Use the `add` operator from 'bitwise-flag/operators' instead
```

**Before (1.1.0)**

```ts
import { FlagsRegistry } from "bitwise-flag";

const registry = FlagsRegistry.from("READ", "WRITE", "EXECUTE");
const flag = registry.combine("READ");

const extended = flag.add("WRITE", "EXECUTE"); // returns a new Flag
const reduced = extended.remove("EXECUTE"); // returns a new Flag
```

**After (2.0.0)**

```ts
import { BigIntFlagRegistry } from "bitwise-flag";
import { add, remove } from "bitwise-flag/operators";

const registry = BigIntFlagRegistry.from("READ", "WRITE", "EXECUTE");
const flag = registry.of("READ");

const extended = add(flag, "WRITE", "EXECUTE"); // standalone operator
const reduced = remove(extended, "EXECUTE"); // standalone operator
```

**Migration steps**

1. Import operators from the new sub-path `bitwise-flag/operators`.
2. Replace every `flag.add(...)` and `flag.remove(...)` calls with `add(flag, ...)` and `remove(flag, ...)`

---

#### `registry.parse(value, radix)` throws at runtime when `radix` is supplied

In 1.1.0 the second argument to `parse` was the standard integer radix (2 for binary, 16 for
hexadecimal, etc.).

In 2.0.0 the overload that accepts a second argument still exists in the type signature, but its
implementation throws immediately:

```
Error: DEPRECATED: Do not pass radix parameter.
       Use prefixes (`0b`, `0o` or `0x`) or `parseInt` explicitly instead.
```

**Before (1.1.0)**

```ts
const binaryFlag = registry.parse("11", 2); // 3 in decimal → READ | WRITE
const hexFlag = registry.parse("ff", 16);
```

**After (2.0.0)**

```ts
const binaryFlag = registry.parse("0b11"); // standard binary prefix
const hexFlag = registry.parse("0xff"); // standard hex prefix
const octalFlag = registry.parse("0o17"); // standard octal prefix
```

**Migration steps**

1. Find every `parse(str, radix)` call.
2. Convert the string literal to use the corresponding JavaScript numeric prefix
   (`0b` for binary, `0o` for octal, `0x` for hexadecimal) or call `parseInt` function with the radix you need and drop the second argument from the `parse` call.

---

#### `registry.from()` throws on duplicate flag names

In 1.1.0, `FlagsRegistry.from()` silently deduplicated its arguments:

```ts
FlagsRegistry.from("READ", "WRITE", "READ"); // "READ" appears twice — no error
// Registry contains READ=1n, WRITE=2n
```

In 2.0.0, any duplicate in the argument list causes an immediate `DuplicateFlagsError`:

```
DuplicateFlagsError: Duplicated flags: READ
```

**Before (1.1.0)**

```ts
const registry = FlagsRegistry.from("READ", "WRITE", "READ"); // silent dedup
```

**After (2.0.0)**

```ts
// This throws DuplicateFlagsError in 2.0.0:
const registry = BigIntFlagRegistry.from("READ", "WRITE", "READ");

// Fix — pass each name exactly once:
const registry = BigIntFlagRegistry.from("READ", "WRITE");
```

**Migration steps**

1. Search all `from(...)` call sites for repeated names.
2. Remove duplicates.
3. If the duplicates were intentional (e.g. dynamically composed arrays), deduplicate the array
   before passing it: `BigIntFlagRegistry.from(...new Set(names))`.

---

#### `BigIntFlagRegistry.parse()` no longer accepts `number`

In 1.1.0 the `parse` overloads accepted `number`, `bigint`, and `string`. In 2.0.0 the bigint
registry's `parse` accepts only `bigint | string`. Passing a `number` is a TypeScript compile
error.

**Before (1.1.0)**

```ts
const flag = registry.parse(3); // number accepted, converted to 3n internally
const flag = registry.parse(3n); // bigint — still fine
```

**After (2.0.0)**

```ts
// compile error — number is not assignable to bigint | string:
const flag = registry.parse(3);

// fix — use a bigint literal:
const flag = registry.parse(3n);

// or a string:
const flag = registry.parse("3");
```

**Migration steps**

1. Find all `registry.parse(numericLiteral)` calls where the argument is a plain `number`.
2. Add the `n` suffix to make it a `bigint` literal, or convert it to a string.

---

#### `FlagsRegistry` renamed to `BigIntFlagRegistry`

The single registry class from 1.1.0 was splitted into `NumberFlagRegistry` and `BigIntFlagRegistry`. A value-level backward-compatibility re-export
is provided:

```ts
/** @deprecated Use BigIntFlagRegistry */
export const FlagsRegistry = BigIntFlagRegistry;
```

Runtime code therefore continues to work without changes, but TypeScript will emit a deprecation
warning on every reference to `FlagsRegistry`. The re-export will be removed in a future release.

**Before (1.1.0)**

```ts
import { FlagsRegistry } from "bitwise-flag";

const registry = FlagsRegistry.from("READ", "WRITE");
```

**After (2.0.0)**

```ts
import { BigIntFlagRegistry } from "bitwise-flag";

const registry = BigIntFlagRegistry.from("READ", "WRITE");
```

**Migration steps**

1. Replace `FlagsRegistry` with `NumberFlagRegistry` _(prefer)_ or `BigIntFlagRegistry` everywhere (import and usage).
2. If you need less than 32 flags, `NumberFlagRegistry` is your choice. Otherwise you should use `BigIntFlagRegistry`.

---

#### `flag.value` renamed to `flag.bits`

In 1.1.0 the raw bitmask was exposed as the `value` property.

In 2.0.0 the canonical property is `bits`. A deprecated getter `value` still exists and returns
`bits` unchanged, so existing runtime code is not broken, but TypeScript emits a deprecation
warning.

**Before (1.1.0)**

```ts
console.log(flag.value); // 3n
```

**After (2.0.0)**

```ts
console.log(flag.bits); // 3n
```

**Migration steps**

1. Replace `.value` with `.bits` on all flag instances.

---

#### `keys()`, `values()`, `entries()` return arrays, not iterators

In 1.1.0 these three methods returned `MapIterator` objects. In 2.0.0 they return plain arrays
(`TFlags[]`, `TBit[]`, `[TFlags, TBit][]`).

Code that iterated with `for...of` or the spread operator continues to work. Code that called
iterator protocol methods (`.next()`, `.return()`, etc.) directly will break at runtime and also
produces TypeScript errors because the return types changed.

**Before (1.1.0)**

```ts
const iter = registry.entries();
const first = iter.next().value; // MapIterator protocol

for (const [k, v] of registry.keys()) {
  /* ... */
}
```

**After (2.0.0)**

```ts
const arr = registry.entries();
const first = arr[0]; // plain array indexing

for (const k of registry.keys()) {
  /* ... */
}
```

**Migration steps**

1. Remove any direct calls to `.next()`, `.return()`, or `.throw()` on the results of these
   methods.
2. Standard iteration (`for...of`, spread `[...arr]`, `Array.from()`) requires no change.

---

#### `IFlag`, `IFlagsRegistry`, and `FlagKey` renamed

The public type exports were redesigned as generic interfaces and the old names were deprecated.

| 1.1.0                    | 2.0.0                        |
| ------------------------ | ---------------------------- |
| `IFlag<TFlags>`          | `Flag<TFlags, TBit, R>`      |
| `IFlagsRegistry<TFlags>` | `FlagRegistry<TFlags, TBit>` |
| `FlagKey`                | `string`                     |

Backward-compatibility type aliases are still exported from the root entry-point but are marked
`@deprecated` and will be removed in a future release.

**Before (1.1.0)**

```ts
import type { IFlag, IFlagsRegistry, FlagKey } from "bitwise-flag";

function process(flag: IFlag<"READ" | "WRITE">): void {
  /* ... */
}
function createRegistry(): IFlagsRegistry<"READ" | "WRITE"> {
  /* ... */
}
```

**After (2.0.0)**

```ts
import type { Flag, FlagRegistry } from "bitwise-flag";

function process(
  flag: Flag<"READ" | "WRITE", bigint, FlagRegistry<"READ" | "WRITE", bigint>>,
): void {
  /* ... */
}
function createRegistry(): FlagRegistry<"READ" | "WRITE", bigint> {
  /* ... */
}
```

**Migration steps**

1. Replace `IFlag<T>` with `Flag<T, bigint, FlagRegistry<T, bigint>>` (or the `number` variant).
2. Replace `IFlagsRegistry<T>` with `FlagRegistry<T, bigint>`.
3. Replace `FlagKey` with `string`.

---

#### `registry.combine()` deprecated in favour of `registry.of()`

`combine()` still delegates to `of()` and throws no error on its own, but it is marked
`@deprecated`. TypeScript will emit a warning. It will be removed in a future major version.

**Before (1.1.0)**

```ts
const flag = registry.combine("READ", "WRITE");
```

**After (2.0.0)**

```ts
const flag = registry.of("READ", "WRITE");
```

**Migration steps**

1. Replace all `.combine(...)` calls with `.of(...)`.

---

#### Errors are now typed classes

In 1.1.0 all error paths threw generic `Error` objects with ad-hoc message strings. In 2.0.0
every error condition has its own named class exported from the main entry-point.

| Condition                            | 1.1.0                              | 2.0.0                 |
| ------------------------------------ | ---------------------------------- | --------------------- |
| Unknown flag key in `has` / `get`    | — (returned `false` / `undefined`) | `UnknownFlagError`    |
| Duplicate bit value in `define()`    | —                                  | `DuplicateError`      |
| Duplicate name in `from()`           | — (silently deduped)               | `DuplicateFlagsError` |
| Unparseable string                   | `Error`                            | `ParseError`          |
| Unknown bits in `parse()`            | `Error`                            | `UnknownBitsError`    |
| Non-power-of-two value in `define()` | —                                  | `NotPowerOfTwoError`  |

<!-- The most impactful runtime behaviour change: in 1.1.0, `flag.has(unknownKey)` returned `false`
because `registry.get()` returned `undefined` and the guard `if (!value) return false` fired.
In 2.0.0, `repository.get()` throws `UnknownFlagError` immediately — there is no `false` path
for an unregistered key.

TypeScript's generic constraint (`TFlags extends string`) catches this at compile time, but
JavaScript callers or TypeScript code with type assertions may trigger it at runtime. -->

**Migration steps**

1. If you catch errors from `has()`, `get()`, `parse()`, or `combine()` / `of()` and test
   `error.message` against a specific string, update the check to use `instanceof`:

   ```ts
   import { UnknownFlagError, ParseError } from "bitwise-flag";

   try {
     registry.parse(someValue);
   } catch (e) {
     if (e instanceof ParseError) {
       /* ... */
     }
   }
   ```

2. Remove any code that relies on `has()` returning `false` for a key that is not in the
   registry — that path no longer exists.
