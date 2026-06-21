import { describe, expect, test } from "bun:test";

import { UnknownFlagError } from "@/flags/errors";
import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { hasAny } from "./hasAny";

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

describe("hasAny", () => {
  describe("basic behavior", () => {
    test("returns true when box has the single requested flag", () => {
      // input: box with "read", check "read"
      // expected: true
      expect(hasAny(registry.of("read"), "read")).toBe(true);
    });

    test("returns false when box does not have the requested flag", () => {
      // input: box with "read", check "write"
      // expected: false
      expect(hasAny(registry.of("read"), "write")).toBe(false);
    });

    test("returns true when box has at least one of the requested flags", () => {
      // input: box with "read", check "read" and "write"
      // expected: true — "read" is present even though "write" is not
      expect(hasAny(registry.of("read"), "read", "write")).toBe(true);
    });

    test("returns true when box has all of the requested flags", () => {
      // input: box with "read" and "write", check "read" and "write"
      // expected: true — both are present
      expect(hasAny(registry.of("read", "write"), "read", "write")).toBe(true);
    });

    test("returns false when box has none of the requested flags", () => {
      // input: box with "admin", check "read" and "write"
      // expected: false — no overlap
      expect(hasAny(registry.of("admin"), "read", "write")).toBe(false);
    });

    test("full box returns true for any single flag", () => {
      // input: full box, check each flag individually
      // expected: true for all
      const box = registry.full();
      expect(hasAny(box, "read")).toBe(true);
      expect(hasAny(box, "write")).toBe(true);
      expect(hasAny(box, "execute")).toBe(true);
      expect(hasAny(box, "admin")).toBe(true);
    });

    test("full box returns true for all flags at once", () => {
      // input: full box, check all four flags
      // expected: true
      expect(hasAny(registry.full(), "read", "write", "execute", "admin")).toBe(
        true,
      );
    });
  });

  describe("empty box", () => {
    test("empty box returns false for any single flag", () => {
      // input: empty box, check "read"
      // expected: false — no flags are set
      expect(hasAny(registry.empty(), "read")).toBe(false);
    });

    test("empty box returns false for multiple flags", () => {
      // input: empty box, check "read" and "write"
      // expected: false
      expect(hasAny(registry.empty(), "read", "write")).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("returns false when called with no flags (vacuous falsity)", () => {
      // input: any box, no flags passed
      // expected: false
      expect(hasAny(registry.empty())).toBe(false);
      expect(hasAny(registry.of("read"))).toBe(false);
    });

    test("returns boolean type", () => {
      // input: box with "read", check "read"
      // expected: result is strictly boolean true, not a truthy value
      const result = hasAny(registry.of("read"), "read");
      expect(typeof result).toBe("boolean");
    });

    test("does not mutate the box", () => {
      // input: box with "read", check "write"
      // expected: original bits unchanged after the call
      const box = registry.of("read");
      const originalBits = box.bits;
      hasAny(box, "write");

      expect(box.bits).toBe(originalBits);
    });
  });

  describe("BigInt registry", () => {
    test("returns true when BigInt box has at least one requested flag", () => {
      // input: BigInt box with "read", check "read" and "write"
      // expected: true — "read" is present
      expect(hasAny(bigRegistry.of("read"), "read", "write")).toBe(true);
    });

    test("returns false when BigInt box has none of the requested flags", () => {
      // input: BigInt box with "read", check "write" and "execute"
      // expected: false — no overlap
      expect(hasAny(bigRegistry.of("read"), "write", "execute")).toBe(false);
    });

    test("returns false for any flag on an empty BigInt box", () => {
      // input: BigInt empty box, check "admin"
      // expected: false
      expect(hasAny(bigRegistry.empty(), "admin")).toBe(false);
    });

    test("full BigInt box returns true for any flag", () => {
      // input: BigInt full box, check "execute"
      // expected: true
      expect(hasAny(bigRegistry.full(), "execute")).toBe(true);
    });
  });

  describe("error cases", () => {
    test("throws UnknownFlagError when the only requested flag is not registered", () => {
      // input: valid box, unknown flag name "superuser"
      // expected: UnknownFlagError thrown
      const box = registry.of("read");

      expect(() => hasAny(box, "superuser" as Perms)).toThrow(UnknownFlagError);
    });

    test("throws UnknownFlagError with the offending flag name", () => {
      // input: valid box, unknown flag "ghost"
      // expected: error.flag === "ghost"
      const box = registry.empty();

      try {
        hasAny(box, "ghost" as Perms);
        expect(true).toBe(false); // should not reach here
      } catch (e) {
        expect(e).toBeInstanceOf(UnknownFlagError);
        expect((e as UnknownFlagError).flag).toBe("ghost");
      }
    });

    test("throws when unknown flag is first and box does not short-circuit", () => {
      // input: box without "read", flags "ghost" (unknown) then "read"
      // expected: UnknownFlagError thrown
      const box = registry.empty();

      expect(() => hasAny(box, "ghost" as Perms, "read")).toThrow(
        UnknownFlagError,
      );
    });

    test("throws when a matching known flag precedes an unknown one", () => {
      // input: box with "read", flags "read" (present) then "ghost" (unknown)
      // expected: UnknownFlagError thrown
      const box = registry.of("read");

      expect(() => hasAny(box, "read", "ghost" as Perms)).toThrow(
        UnknownFlagError,
      );
    });

    test("throws when unknown flag follows a known but absent flag", () => {
      // input: box with "admin", flags "read" (absent) then "ghost" (unknown)
      // expected: UnknownFlagError thrown
      const box = registry.of("admin");

      expect(() => hasAny(box, "read", "ghost" as Perms)).toThrow(
        UnknownFlagError,
      );
    });
  });
});
