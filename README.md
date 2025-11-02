<h1 align="center">bitwise-flag</h1>

A lightweight TypeScript library for managing bitwise flags. This allows efficient storage, combination, and manipulation of multiple boolean flags in a single value, ideal for permissions, states, or configuration bitmasks. Each flag key is assigned a unique bit position, enabling operations like checking, adding, and removing flags without performance overhead.

The library is type-safe, supports immutable flag operations, and provides human-readable string aliases for debugging.

# Getting Started

## Installation

```bash
npm install bitwise-flag # npm
yarn add bitwise-flag # yarn
pnpm add bitwise-flag # pnpm
bun add bitwise-flag # bun
```

---
### How to use
```ts
import { FlagsRegistry } from "bitwise-flag";

// create a flag registry
const permissionRegistry = FlagsRegistry.from("READ", "WRITE", "EXECUTE");

// create an empty flag 
const noPermissions = permissionRegistry.empty();
console.log(noPermissions.isEmpty()); // true
console.log(noPermissions.toString()); // Flag(EMPTY_FLAG: 0)

// combine flags to create a new flag
const readWrite = permissionsRegistry.combine('READ', 'WRITE');
console.log(readWrite.toString()); // Flag([READ+WRITE]: 3)

// check for flags
const userPermissions = permissionsRegistry.combine('READ', 'EXECUTE');

console.log(userPermissions.has('READ'));    // true
console.log(userPermissions.has('WRITE'));   // false
console.log(userPermissions.has('EXECUTE')); // true
```

### Flag opeations
Flag's instances are immutable. Thats means all operations return new instances. For example:
```ts
const readWrite = permissionsRegistry.combine("READ", "WRITE");

// add execute flag
const fullPermissions = readWrite.add("EXECUTE");
console.log(readWrite.has("EXECUTE")); // false
console.log(fullPermissions.has("EXECUTE")) // true

// remove read flag
const read = readWrite.remove("WRITE");
console.log(readWrite.has("WRITE")); // true
console.log(read.has("WRITE")); // false
```


## API Reference

### Class: `FlagsRegistry<TFlags extends string>`

Manages a collection of flag keys and their corresponding bitmask values. Use this to define and retrieve flag bit positions.

#### Static Methods

| Method | Description | Parameters | Returns | Throws |
|--------|-------------|------------|---------|--------|
| `FlagsRegistry.from(...flagKeys: TFlags[])` | Creates a new registry instance from an array of flag keys. Automatically deduplicates keys and assigns sequential bit positions (starting from bit 0). | `flagKeys`: Array of string keys. | `FlagsRegistry<TFlags>` | None. |

**Example:**
```typescript
const registry = FlagsRegistry.from('READ', 'WRITE', 'READ'); // Deduplicates 'READ'
```

#### Instance Methods

| Method | Description | Parameters | Returns | Throws |
|--------|-------------|------------|---------|--------|
| `keys()` | Returns an iterator over all flag keys. | None. | `MapIterator<TFlags>` | None. |
| `values()` | Returns an iterator over all bit values. | None. | `MapIterator<bigint>` | None. |
| `entries()` | Returns an iterator over key-bit pairs. | None. | `MapIterator<[TFlags, bigint]>` | None. |
| `get(flagName: TFlags)` | Retrieves the bitmask value for a specific flag key. | `flagName`: The flag key. | `bigint \| undefined` | None. |
| `empty()` | Creates an empty flag instance (value `0n`). | None. | `Flag<TFlags>` | None. |
| `combine(...flagKeys: TFlags[])` | Combines the specified flag keys into a new `Flag` instance by bitwise OR-ing their values. | `flagKeys`: Array of flag keys to combine. | `Flag<TFlags>` | `Error` if any key is not registered. |

**Example:**
```typescript
const combined = registry.combine('READ', 'WRITE'); // Value: 3n (0b11)
```

### Class: `Flag<TFlags extends string>`

Represents a bitwise combination of flags from a registry. All operations are immutable, returning new instances.

#### Properties

| Property | Description | Type |
|----------|-------------|------|
| `value` | The raw `BigInt` representing the combined bitmask. Read-only. | `bigint` |

#### Methods

| Method | Description | Parameters | Returns | Throws |
|--------|-------------|------------|---------|--------|
| `isEmpty()` | Checks if no flags are set. | None. | `boolean` | None. |
| `has(flagName: TFlags)` | Tests if a specific flag is set in this combination. | `flagName`: The flag key. | `boolean` | None. |
| `add(flagName: TFlags)` | Adds a flag to the combination (idempotent if already set). Returns a new `Flag`. | `flagName`: The flag key. | `Flag<TFlags>` | `Error` if the key is not registered. |
| `remove(flagName: TFlags)` | Removes a flag from the combination (idempotent if not set). Returns a new `Flag`. | `flagName`: The flag key. | `Flag<TFlags>` | `Error` if the key is not registered. |
| `toString()` | Returns a string representation including the alias and raw value. | None. | `string` | None. |
| `alias` (getter) | Computed human-readable alias (e.g., `"[READ+WRITE]"` or `"EMPTY_FLAG"`) | None. | `string` | None. |

**Validation Note:** The constructor (internal) validates that the value only uses known bits from the registry and is non-negative. Unknown bits or negative values throw an `Error`.

**Example:**
```typescript
const flag = registry.combine('READ');
console.log(flag.has('READ')); // true
console.log(flag.add('WRITE').alias); // "[READ+WRITE]"
```
