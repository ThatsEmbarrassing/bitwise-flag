import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { FlagBox } from "./FlagBox";

type Perms = "read" | "write" | "execute" | "admin";

const registry = NumberFlagRegistry.from<Perms>(
  "read",
  "write",
  "execute",
  "admin",
);

const bigRegistry = BigIntFlagRegistry.from<Perms>(
  "read",
  "write",
  "execute",
  "admin",
);

// bits: read=1, write=2, execute=4, admin=8 (Number)
// bits: read=1n, write=2n, execute=4n, admin=8n (BigInt)

describe("FlagBox", () => {
  describe("constructor", () => {
    test("stores bits and registry as readonly properties", () => {
      // input: bits=1 (read), Number registry
      // expected: box.bits === 1, box.registry === registry
      const box = new FlagBox(1, registry);

      expect(box.bits).toBe(1);
      expect(box.registry).toBe(registry);
    });

    test("stores zero bits without treating it as invalid", () => {
      // input: bits=0
      // expected: box.bits === 0
      const box = new FlagBox(0, registry);

      expect(box.bits).toBe(0);
    });

    test("stores fullBits without errors", () => {
      // input: bits = all flags OR-ed together (15)
      // expected: box.bits === 15
      const box = new FlagBox(15, registry);

      expect(box.bits).toBe(15);
    });
  });

  describe("isEmpty()", () => {
    test("returns true when bits equal zero", () => {
      // input: bits=0
      // expected: true
      const box = registry.empty();

      expect(box.isEmpty()).toBe(true);
    });

    test("returns false when at least one flag is set", () => {
      // input: bits=1 (read)
      // expected: false
      const box = registry.of("read");

      expect(box.isEmpty()).toBe(false);
    });

    test("returns false for a full box", () => {
      // input: all flags set
      // expected: false
      const box = registry.full();

      expect(box.isEmpty()).toBe(false);
    });

    test("BigInt: returns true when bits equal 0n", () => {
      // input: BigInt empty box
      // expected: true
      expect(bigRegistry.empty().isEmpty()).toBe(true);
    });

    test("BigInt: returns false when a flag is set", () => {
      // input: BigInt box with "read"
      // expected: false
      expect(bigRegistry.of("read").isEmpty()).toBe(false);
    });
  });

  describe("isFull()", () => {
    test("returns true when all flags are set", () => {
      // input: full box (bits=15)
      // expected: true
      const box = registry.full();

      expect(box.isFull()).toBe(true);
    });

    test("returns false for an empty box", () => {
      // input: bits=0
      // expected: false
      const box = registry.empty();

      expect(box.isFull()).toBe(false);
    });

    test("returns false when only some flags are set", () => {
      // input: bits with read+write (3 of 4 flags missing)
      // expected: false
      const box = registry.of("read", "write");

      expect(box.isFull()).toBe(false);
    });

    test("returns false when all but one flag are set", () => {
      // input: read+write+execute (missing admin)
      // expected: false
      const box = registry.of("read", "write", "execute");

      expect(box.isFull()).toBe(false);
    });

    test("BigInt: returns true for a full BigInt box", () => {
      // input: BigInt full box
      // expected: true
      expect(bigRegistry.full().isFull()).toBe(true);
    });
  });

  describe("has()", () => {
    test("returns true when the queried flag is the only bit set", () => {
      // input: bits=1 (read only), query "read"
      // expected: true
      const box = registry.of("read");

      expect(box.has("read")).toBe(true);
    });

    test("returns false for a flag that is not set", () => {
      // input: bits=1 (read only), query "write"
      // expected: false
      const box = registry.of("read");

      expect(box.has("write")).toBe(false);
    });

    test("returns true for each flag in a multi-flag box", () => {
      // input: bits=read|write|execute, query each of the three
      // expected: true for all three, false for "admin"
      const box = registry.of("read", "write", "execute");

      expect(box.has("read")).toBe(true);
      expect(box.has("write")).toBe(true);
      expect(box.has("execute")).toBe(true);
      expect(box.has("admin")).toBe(false);
    });

    test("returns false for every flag in an empty box", () => {
      // input: bits=0
      // expected: false for all flags
      const box = registry.empty();

      expect(box.has("read")).toBe(false);
      expect(box.has("write")).toBe(false);
      expect(box.has("execute")).toBe(false);
      expect(box.has("admin")).toBe(false);
    });

    test("returns true for every flag in a full box", () => {
      // input: bits=15 (all flags)
      // expected: true for all flags
      const box = registry.full();

      expect(box.has("read")).toBe(true);
      expect(box.has("write")).toBe(true);
      expect(box.has("execute")).toBe(true);
      expect(box.has("admin")).toBe(true);
    });

    test("BigInt: returns true for a set flag", () => {
      // input: BigInt box with "admin"
      // expected: has("admin") === true, has("read") === false
      const box = bigRegistry.of("admin");

      expect(box.has("admin")).toBe(true);
      expect(box.has("read")).toBe(false);
    });
  });

  describe("toArray()", () => {
    test("returns empty array for an empty box", () => {
      // input: bits=0
      // expected: []
      const box = registry.empty();

      expect(box.toArray()).toEqual([]);
    });

    test("returns array with all flags for a full box", () => {
      // input: bits=15
      // expected: array contains all four flag names (order may vary)
      const box = registry.full();
      const result = box.toArray();

      expect(result).toHaveLength(4);
      expect(result).toContain("read");
      expect(result).toContain("write");
      expect(result).toContain("execute");
      expect(result).toContain("admin");
    });

    test("returns only the flags that are set", () => {
      // input: bits=read|execute
      // expected: ["read", "execute"] (no "write", no "admin")
      const box = registry.of("read", "execute");
      const result = box.toArray();

      expect(result).toHaveLength(2);
      expect(result).toContain("read");
      expect(result).toContain("execute");
      expect(result).not.toContain("write");
      expect(result).not.toContain("admin");
    });

    test("returns a single-element array for a single-flag box", () => {
      // input: bits=write only
      // expected: ["write"]
      const box = registry.of("write");

      expect(box.toArray()).toEqual(["write"]);
    });

    test("BigInt: returns correct flags", () => {
      // input: BigInt box with "read" and "admin"
      // expected: array contains exactly those two
      const box = bigRegistry.of("read", "admin");
      const result = box.toArray();

      expect(result).toHaveLength(2);
      expect(result).toContain("read");
      expect(result).toContain("admin");
    });
  });

  describe("toObject()", () => {
    test("returns all keys mapped to false for an empty box", () => {
      // input: bits=0
      // expected: { read: false, write: false, execute: false, admin: false }
      const box = registry.empty();

      expect(box.toObject()).toEqual({
        read: false,
        write: false,
        execute: false,
        admin: false,
      });
    });

    test("returns all keys mapped to true for a full box", () => {
      // input: bits=15
      // expected: { read: true, write: true, execute: true, admin: true }
      const box = registry.full();

      expect(box.toObject()).toEqual({
        read: true,
        write: true,
        execute: true,
        admin: true,
      });
    });

    test("returns true only for set flags", () => {
      // input: bits=read|admin
      // expected: read=true, write=false, execute=false, admin=true
      const box = registry.of("read", "admin");

      expect(box.toObject()).toEqual({
        read: true,
        write: false,
        execute: false,
        admin: true,
      });
    });

    test("result contains every registered flag as a key", () => {
      // input: any box
      // expected: result has exactly 4 keys matching the registry
      const box = registry.of("write");
      const keys = Object.keys(box.toObject());

      expect(keys).toHaveLength(4);
      expect(keys).toContain("read");
      expect(keys).toContain("write");
      expect(keys).toContain("execute");
      expect(keys).toContain("admin");
    });

    test("BigInt: returns correct boolean map", () => {
      // input: BigInt box with "write" and "execute"
      // expected: write=true, execute=true, others false
      const box = bigRegistry.of("write", "execute");

      expect(box.toObject()).toEqual({
        read: false,
        write: true,
        execute: true,
        admin: false,
      });
    });
  });

  describe("size", () => {
    test("returns 0 for an empty box", () => {
      // input: bits=0
      // expected: 0
      expect(registry.empty().size).toBe(0);
    });

    test("returns 1 for a single-flag box", () => {
      // input: bits=read (1 bit set)
      // expected: 1
      expect(registry.of("read").size).toBe(1);
    });

    test("returns 2 for a two-flag box", () => {
      // input: bits=read|write (2 bits set)
      // expected: 2
      expect(registry.of("read", "write").size).toBe(2);
    });

    test("returns total flag count for a full box", () => {
      // input: bits=15 (4 bits set)
      // expected: 4
      expect(registry.full().size).toBe(4);
    });

    test("BigInt: returns correct popcount", () => {
      // input: BigInt box with "read", "write", "execute"
      // expected: 3
      expect(bigRegistry.of("read", "write", "execute").size).toBe(3);
    });
  });

  describe("registry with a single flag", () => {
    type Solo = "only";
    const solo = NumberFlagRegistry.from<Solo>("only");

    test("empty box is empty and not full", () => {
      // input: registry with one flag, empty box
      // expected: isEmpty=true, isFull=false
      const box = solo.empty();

      expect(box.isEmpty()).toBe(true);
      expect(box.isFull()).toBe(false);
    });

    test("full box with one flag has size 1 and isFull", () => {
      // input: registry with one flag, full box
      // expected: isFull=true, size=1
      const box = solo.full();

      expect(box.isFull()).toBe(true);
      expect(box.size).toBe(1);
    });

    test("single-flag toArray returns exactly that flag", () => {
      // input: full box with only one registered flag
      // expected: ["only"]
      expect(solo.full().toArray()).toEqual(["only"]);
    });
  });
});
