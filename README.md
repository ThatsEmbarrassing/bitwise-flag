<h1 align="center">bitwise-flag</h1>

<p align="center">
  Type-safe, immutable bitwise flags for TypeScript — with named flags,
  human-readable aliases, and tree-shakeable operators.
</p>

<p align="center">
  <a href="https://thatsembarrassing.github.io/bitwise-flag/">Documentation</a>
  ·
  <a href="./CHANGELOG.md">Changelog</a>
  ·
  <a href="./MIGRATIONS.md">Migration guides</a>
</p>

> **Upgrading from 1.x?** v2.0.0 is a major rewrite. Most 1.x code keeps
> compiling thanks to deprecated re-exports, but a few call-sites now throw at
> runtime. Read the [Changelog](./CHANGELOG.md) for the full list and the
> [Migration guide](./MIGRATIONS.md) for step-by-step instructions.

---

## What is this?

A bitwise flag (a _bitmask_) packs many independent boolean states into a single
integer: each flag owns one bit, and you combine them with `OR`, test them with
`AND`, and clear them with `AND NOT`. It's how filesystem permissions, feature
toggles, and countless wire protocols represent "a set of options" in one value.

`bitwise-flag` gives you that representation without the magic numbers. You
declare your flags by name once, and the library hands you a small, **immutable**
value object that is **type-safe**, prints a **human-readable alias** for
debugging, and is manipulated through standalone, **tree-shakeable operators**.

```ts
import { NumberFlagRegistry } from "bitwise-flag";
import { add, hasAll } from "bitwise-flag/operators";

const Permissions = NumberFlagRegistry.from("READ", "WRITE", "EXECUTE");

const user = Permissions.of("READ");            // Flag([READ]: 1)
const elevated = add(user, "WRITE");            // Flag([READ+WRITE]: 3)

elevated.has("WRITE");                          // true
hasAll(elevated, "READ", "WRITE");              // true
elevated.bits;                                  // 3  — store this in a DB column
String(elevated);                               // "Flag([READ+WRITE]: 3)"
```

## Why use it (and when not to)

### Reach for `bitwise-flag` when…

- **You store a set of booleans as one integer** — a database column, a network
  packet, a cache key, a URL param. One `number`/`bigint` round-trips cleanly and
  is cheap to index and compare.
- **The flags have meaning and you keep mixing them up.** Raw `value & 4` tells
  you nothing; `flag.has("EXECUTE")` does. Misspelled or unregistered names are
  caught by the type system, and at runtime with a `ParseError`/`UnknownFlagError`
  instead of silently being a no-op.
- **You do set algebra on combinations** — union, intersection, difference,
  subset/superset checks — and want it spelled out, not hand-rolled with `&`,
  `|`, `~` and a comment.
- **Many flags.** `NumberFlagRegistry` handles up to 31 flags using fast 32-bit
  math; `BigIntFlagRegistry` is unbounded.
- **You want safe immutability.** Every operation returns a new flag; nothing
  mutates in place, so flags are safe to share and compare by value.

### Prefer the built-ins when…

- **You only have a handful of unrelated booleans you read individually.** A
  plain object — `{ darkMode: true, beta: false }` — is clearer and needs no
  dependency. Bitmasks pay off when you _combine_ and _store_ the set as a whole.
- **You never serialize to a compact integer.** If a `Set<string>` of flag names
  is all you pass around, a native `Set` is simpler. Use `bitwise-flag` when the
  single-integer encoding (storage, transport, bitwise comparison) is the point.
- **A fixed enum of mutually-exclusive states.** That's a TypeScript `enum` or a
  string union, not a bitmask — bitmasks model "any combination of," not "exactly
  one of."
- **You're comfortable with raw bitwise ops on a couple of constants** and don't
  need names, validation, or pretty-printing. `bitwise-flag` is the upgrade you
  want once the magic numbers start to hurt.

## Installation

```bash
npm install bitwise-flag   # npm
yarn add bitwise-flag      # yarn
pnpm add bitwise-flag      # pnpm
bun add bitwise-flag       # bun
```

The package ships both ESM and CJS builds and bundles its own type
definitions. TypeScript `^5.9.3` is a peer dependency.

## Getting started

### 1. Create a registry

A **registry** declares your flags once and assigns each a unique bit. Pick the
backing numeric type based on how many flags you need:

```ts
import { NumberFlagRegistry, BigIntFlagRegistry } from "bitwise-flag";

// number-backed — fast, up to 31 flags
const Permissions = NumberFlagRegistry.from("READ", "WRITE", "EXECUTE");
// READ = 1, WRITE = 2, EXECUTE = 4

// bigint-backed — unbounded number of flags
const Capabilities = BigIntFlagRegistry.from("A", "B", "C" /* ...many more */);
```

`from(...)` auto-assigns successive powers of two. When the bit values must match
something external (a protocol, a DB enum, a legacy constant), use `define(...)`
for explicit control:

```ts
const Permissions = NumberFlagRegistry.define({
  READ: 1,
  WRITE: 2,
  EXECUTE: 4,
});
```

Registries validate their flags up front — duplicate names
(`DuplicateFlagsError`), duplicate or non-power-of-two bit values
(`DuplicateError` / `NotPowerOfTwoError`), non-positive values
(`NotPositiveError`), and out-of-range `number` bits (`OverflowError`) are all
rejected at construction time.

### 2. Build flags

```ts
const empty = Permissions.empty();              // no flags set
const all   = Permissions.full();               // every registered flag set
const rw    = Permissions.of("READ", "WRITE");  // combine by name (bitwise OR)

empty.isEmpty();  // true
all.isFull();     // true
rw.bits;          // 3
```

### 3. Inspect a flag

Flags are immutable value objects. Beyond `bits`, they expose:

```ts
const flag = Permissions.of("READ", "EXECUTE");

flag.has("READ");      // true
flag.has("WRITE");     // false
flag.size;             // 2          — number of flags set
flag.alias;            // "READ+EXECUTE"
flag.toArray();        // ["READ", "EXECUTE"]
flag.toObject();       // { READ: true, WRITE: false, EXECUTE: true }
flag.toString();       // "Flag([READ+EXECUTE]: 5)"
flag.toString(2);      // "Flag([READ+EXECUTE]: 101)"
flag.registry;         // back-reference to the owning registry
```

### 4. Parse stored values

Turn a raw bitmask (read back from a DB, a query string, etc.) into a flag:

```ts
Permissions.parse(5);        // Flag([READ+EXECUTE]: 5)
Permissions.parse("0b101");  // binary prefix  → READ + EXECUTE
Permissions.parse("0o7");    // octal prefix   → READ + WRITE + EXECUTE
Permissions.parse("0x3");    // hex prefix     → READ + WRITE
```

Parsing is strict: malformed input (`"12abc"`, `"3.9"`) throws `ParseError`, and
a value carrying bits no registered flag owns throws `UnknownBitsError`.
`BigIntFlagRegistry.parse()` accepts only `bigint | string` (use `3n` or `"3"`,
not `3`).

> **Note:** since 2.0.0 `parse()` no longer takes a `radix` argument — use the `0b`/`0o`/`0x`
> prefixes above, or call `parseInt` yourself. See the
> [migration guide](./MIGRATIONS.md#registryparsevalue-radix-throws-at-runtime-when-radix-is-supplied).

## Operators

In v2.0.0 the mutation and query helpers are **standalone functions** rather than
methods on the flag. This keeps the flag object a tiny immutable value and lets
bundlers tree-shake away operators you don't import. They live under the
`bitwise-flag/operators` subpath:

```ts
import { add, remove, union, isSubsetOf } from "bitwise-flag/operators";
```

Every operator takes the flag as its first argument and returns either a **new
flag** (mutations) or a **boolean** (queries) — the input is never modified.

### Basic operators

Operate on one flag plus a list of flag names.

| Operator                          | Returns   | Description                                            |
| --------------------------------- | --------- | ------------------------------------------------------ |
| `add(flag, ...names)`             | `Flag`    | Sets the named flags (bitwise OR). Idempotent.         |
| `remove(flag, ...names)`          | `Flag`    | Clears the named flags (AND NOT). Idempotent.          |
| `toggle(flag, ...names)`          | `Flag`    | Flips the named flags (XOR).                           |
| `complement(flag)`                | `Flag`    | All registered flags _not_ set in `flag`.              |
| `hasAll(flag, ...names)`          | `boolean` | `true` if every named flag is set.                     |
| `hasAny(flag, ...names)`          | `boolean` | `true` if at least one named flag is set.              |
| `hasNone(flag, ...names)`         | `boolean` | `true` if none of the named flags are set.             |
| `equals(a, b)`                    | `boolean` | `true` if same registry **and** identical bits.        |

```ts
import { add, remove, toggle, complement, hasAny } from "bitwise-flag/operators";

const base = Permissions.of("READ");

const writable = add(base, "WRITE", "EXECUTE"); // Flag([READ+WRITE+EXECUTE]: 7)
const readOnly = remove(writable, "WRITE", "EXECUTE"); // Flag([READ]: 1)
const flipped  = toggle(base, "WRITE");          // Flag([READ+WRITE]: 3)
const inverse  = complement(base);               // Flag([WRITE+EXECUTE]: 6)

hasAny(writable, "WRITE", "ADMIN" as never);     // true
base === readOnly;                               // false — originals untouched
```

> `complement` only considers flags registered in the registry — it does **not**
> raw-invert the underlying integer, so no "phantom" high bits ever appear.

### Set operators

Treat flags as sets and combine two or more of them. Each returns a new flag (or
a boolean for the predicates).

| Operator                            | Returns   | Description                                              |
| ----------------------------------- | --------- | ------------------------------------------------------- |
| `union(a, ...rest)`                 | `Flag`    | Flags set in **any** input (OR).                        |
| `intersection(a, ...rest)`          | `Flag`    | Flags set in **all** inputs (AND).                      |
| `difference(a, ...rest)`            | `Flag`    | Flags in `a` but in none of the rest (AND NOT).         |
| `symmetricDifference(a, b, ...rest)`| `Flag`    | Flags in exactly one input (true set sym. diff).        |
| `overlaps(a, b)`                    | `boolean` | `true` if they share at least one flag.                 |
| `isSubsetOf(a, b)`                  | `boolean` | `true` if every flag of `a` is in `b` (a ⊆ b).          |
| `isSupersetOf(a, b)`                | `boolean` | `true` if `a` contains every flag of `b` (a ⊇ b).       |

```ts
import {
  union,
  intersection,
  difference,
  isSubsetOf,
} from "bitwise-flag/operators";

const admin  = Permissions.of("READ", "WRITE", "EXECUTE");
const writer = Permissions.of("READ", "WRITE");

union(writer, Permissions.of("EXECUTE")); // Flag([READ+WRITE+EXECUTE]: 7)
intersection(admin, writer);              // Flag([READ+WRITE]: 3)
difference(admin, writer);                // Flag([EXECUTE]: 4)
isSubsetOf(writer, admin);                // true
```

### Cross-registry safety

Set operators assert that every flag comes from the **same registry instance**
(compared by reference). Combining flags from two different registries — even
structurally identical ones — throws `MixedRegistryError`, so you never silently
OR together bits that mean different things:

```ts
import { union, MixedRegistryError } from "bitwise-flag/operators";

const a = NumberFlagRegistry.from("READ", "WRITE");
const b = NumberFlagRegistry.from("READ", "WRITE");

union(a.of("READ"), b.of("WRITE")); // throws MixedRegistryError
```

`equals` is the gentle exception: it never throws and simply returns `false` for
flags from different registries.

### Granular imports

If you want to pull in just one group, the operators are also published under
dedicated subpaths:

```ts
import { add, remove } from "bitwise-flag/operators/basic";
import { union, difference } from "bitwise-flag/operators/set";
import { MixedRegistryError } from "bitwise-flag/operators/errors";
import { assertSameRegistry } from "bitwise-flag/operators/utils";
```

## Type safety & branding

The registry is fully generic, so `of`, `has`, `add`, etc. only accept flag names
you actually registered — typos are compile errors. Optionally, a registry can
carry a **brand** (a phantom `string`/`symbol` type) so that two structurally
identical registries stay nominally distinct at the type level:

```ts
const filePerms = NumberFlagRegistry.from<"READ" | "WRITE", "FilePerms">(
  "READ",
  "WRITE",
);
const netPerms = NumberFlagRegistry.from<"READ" | "WRITE", "NetPerms">(
  "READ",
  "WRITE",
);

declare function applyFilePerms(f: ReturnType<typeof filePerms.of>): void;

applyFilePerms(netPerms.of("READ")); // ❌ compile error — brands differ
```

See the [Registry branding](./CHANGELOG.md#registry-branding) section of the
changelog for the full story.

## Errors

Every failure mode is a dedicated, named class, so you can branch on `instanceof`
instead of matching message strings. The flag/registry errors are exported from
the main entry point; `MixedRegistryError` comes from `bitwise-flag/operators`.

```ts
import { ParseError, UnknownFlagError } from "bitwise-flag";

try {
  Permissions.parse(userInput);
} catch (e) {
  if (e instanceof ParseError) {
    /* malformed input */
  } else if (e instanceof UnknownFlagError) {
    /* name not registered */
  }
}
```

| Error                  | Thrown when…                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `UnknownFlagError`     | A flag name is not registered (`of`, `get`, `has`, operators).   |
| `UnknownBitsError`     | `parse()` receives bits no registered flag owns.                 |
| `ParseError`           | `parse()` receives a malformed or negative value.                |
| `DuplicateFlagsError`  | `from()` is given a repeated flag name.                          |
| `DuplicateError`       | `define()` assigns the same bit value to two flags.              |
| `NotPowerOfTwoError`   | `define()` assigns a bit value that isn't a power of two.        |
| `NotPositiveError`     | `define()` assigns a bit value `≤ 0`.                            |
| `OverflowError`        | A `number` bit exceeds the 31-flag limit (`2^30`).               |
| `MixedRegistryError`   | A set operator receives flags from different registries.         |

## Architecture

The library is organized into three layers, each importable on its own:

- **`core`** — the numeric abstraction: the `Combinator<T>` interface and its
  `NumberCombinator` / `BigIntCombinator` implementations, plus the `Bit` type.
  All bitwise math goes through a combinator, so flag logic isn't tied to `bigint`.
- **`flags`** — the user-facing model: the `FlagRegistry` / `Flag` interfaces,
  the concrete `NumberFlagRegistry` / `BigIntFlagRegistry`, and the error classes.
- **`operators`** — the standalone functions documented above, shipped from
  `bitwise-flag/operators`.

## License

[MIT](./LICENSE.md)