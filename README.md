<h1 align="center">bitwise-flag</h1>

[Documentation](https://thatsembarrassing.github.io/bitwise-flag/)

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
const readWrite = permissionsRegistry.combine("READ", "WRITE");
console.log(readWrite.toString()); // Flag([READ+WRITE]: 3)

// parse numeric values to create flags
const fromNumber = permissionRegistry.parse(5); // READ + EXECUTE
const fromHex = permissionRegistry.parse("3", 16); // READ + WRITE
const fromBinary = permissionRegistry.parse("101", 2); // READ + EXECUTE

// check for flags
const userPermissions = permissionRegistry.combine("READ", "EXECUTE");

console.log(userPermissions.has("READ")); // true
console.log(userPermissions.has("WRITE")); // false
console.log(userPermissions.has("EXECUTE")); // true
```

### Flag opeations

Flag's instances are immutable. Thats means all operations return new instances. For example:

```ts
const readWrite = permissionRegistry.combine("READ", "WRITE");

// add execute flag
const fullPermissions = readWrite.add("EXECUTE");
console.log(readWrite.has("EXECUTE")); // false
console.log(fullPermissions.has("EXECUTE")); // true

// remove read flag
const read = readWrite.remove("WRITE");
console.log(readWrite.has("WRITE")); // true
console.log(read.has("WRITE")); // false
```
