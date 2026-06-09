import { describe, expect, test } from "bun:test";

import { UnknownFlagError } from "@/flags/errors";
import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { hasAll } from "./hasAll";

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

describe("hasAll", () => {
  describe("basic behavior", () => {
    test("returns true when box has the single requested flag", () => {
      // input: box with "read", check "read"
      // expected: true
      expect(hasAll(registry.of("read"), "read")).toBe(true);
    });

    test("returns false when box does not have the requested flag", () => {
      // input: box with "read", check "write"
      // expected: false
      expect(hasAll(registry.of("read"), "write")).toBe(false);
    });

    test("returns true when box has all of the requested flags", () => {
      // input: box with "read" and "write", check "read" and "write"
      // expected: true
      expect(hasAll(registry.of("read", "write"), "read", "write")).toBe(true);
    });

    test("returns false when box has only some of the requested flags", () => {
      // input: box with "read" and "write", check "read", "write", "execute"
      // expected: false — "execute" is missing
      expect(
        hasAll(registry.of("read", "write"), "read", "write", "execute"),
      ).toBe(false);
    });

    test("returns false when box has none of the requested flags", () => {
      // input: box with "admin", check "read" and "write"
      // expected: false
      expect(hasAll(registry.of("admin"), "read", "write")).toBe(false);
    });

    test("full box returns true for any flag", () => {
      // input: full box, check each flag individually
      // expected: true for all
      const box = registry.full();
      expect(hasAll(box, "read")).toBe(true);
      expect(hasAll(box, "write")).toBe(true);
      expect(hasAll(box, "execute")).toBe(true);
      expect(hasAll(box, "admin")).toBe(true);
    });

    test("full box returns true for all flags at once", () => {
      // input: full box, check all four flags
      // expected: true
      expect(
        hasAll(registry.full(), "read", "write", "execute", "admin"),
      ).toBe(true);
    });
  });

  describe("empty box", () => {
    test("empty box returns false for any single flag", () => {
      // input: empty box, check "read"
      // expected: false — no flags are set
      expect(hasAll(registry.empty(), "read")).toBe(false);
    });

    test("empty box returns false for multiple flags", () => {
      // input: empty box, check "read" and "write"
      // expected: false
      expect(hasAll(registry.empty(), "read", "write")).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("returns true when called with no flags (vacuous truth)", () => {
      // input: any box, no flags passed
      // expected: true — every() on an empty array is always true
      expect(hasAll(registry.empty())).toBe(true);
      expect(hasAll(registry.of("read"))).toBe(true);
    });

    test("returns boolean type", () => {
      // input: box with "read", check "read"
      // expected: result is strictly boolean true, not a truthy value
      const result = hasAll(registry.of("read"), "read");
      expect(typeof result).toBe("boolean");
    });

    test("does not mutate the box", () => {
      // input: box with "read", check "write"
      // expected: original bits unchanged after the call
      const box = registry.of("read");
      const originalBits = box.bits;
      hasAll(box, "write");

      expect(box.bits).toBe(originalBits);
    });
  });

  describe("BigInt registry", () => {
    test("returns true when BigInt box has all requested flags", () => {
      // input: BigInt box with "read" and "execute", check "read" and "execute"
      // expected: true
      expect(
        hasAll(bigRegistry.of("read", "execute"), "read", "execute"),
      ).toBe(true);
    });

    test("returns false when BigInt box is missing a requested flag", () => {
      // input: BigInt box with "read", check "read" and "write"
      // expected: false — "write" absent
      expect(hasAll(bigRegistry.of("read"), "read", "write")).toBe(false);
    });

    test("returns false for any flag on an empty BigInt box", () => {
      // input: BigInt empty box, check "admin"
      // expected: false
      expect(hasAll(bigRegistry.empty(), "admin")).toBe(false);
    });

    test("full BigInt box returns true for all flags at once", () => {
      // input: BigInt full box, check all four flags
      // expected: true
      expect(
        hasAll(bigRegistry.full(), "read", "write", "execute", "admin"),
      ).toBe(true);
    });
  });

  describe("error cases", () => {
    test("throws UnknownFlagError when a requested flag is not registered", () => {
      // input: valid box, unknown flag name "superuser"
      // expected: UnknownFlagError thrown
      const box = registry.of("read");

      expect(() => hasAll(box, "superuser" as Perms)).toThrow(UnknownFlagError);
    });

    test("throws UnknownFlagError with the offending flag name", () => {
      // input: valid box, unknown flag "ghost"
      // expected: error.flag === "ghost"
      const box = registry.empty();

      try {
        hasAll(box, "ghost" as Perms);
        expect(true).toBe(false); // should not reach here
      } catch (e) {
        expect(e).toBeInstanceOf(UnknownFlagError);
        expect((e as UnknownFlagError).flag).toBe("ghost");
      }
    });

    test("throws when an unknown flag is mixed with known ones", () => {
      // input: box with "read", flags "read" (valid) and "ghost" (unknown)
      // expected: UnknownFlagError thrown — stops as soon as it hits the unknown flag
      const box = registry.of("read");

      expect(() => hasAll(box, "read", "ghost" as Perms)).toThrow(
        UnknownFlagError,
      );
    });
  });
});
