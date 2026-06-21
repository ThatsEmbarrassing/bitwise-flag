import { describe, expect, test } from "bun:test";

import { UnknownFlagError } from "@/flags/errors";
import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { hasNone } from "./hasNone";

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

describe("hasNone", () => {
  describe("basic behavior", () => {
    test("returns false when box has the single requested flag", () => {
      // input: box with "read", check "read"
      // expected: false — box does have "read"
      expect(hasNone(registry.of("read"), "read")).toBe(false);
    });

    test("returns true when box does not have the requested flag", () => {
      // input: box with "read", check "write"
      // expected: true — "write" is absent
      expect(hasNone(registry.of("read"), "write")).toBe(true);
    });

    test("returns false when box has at least one of the requested flags", () => {
      // input: box with "read", check "read" and "write"
      // expected: false — "read" is present
      expect(hasNone(registry.of("read"), "read", "write")).toBe(false);
    });

    test("returns false when box has all of the requested flags", () => {
      // input: box with "read" and "write", check "read" and "write"
      // expected: false — both are present
      expect(hasNone(registry.of("read", "write"), "read", "write")).toBe(
        false,
      );
    });

    test("returns true when box has none of the requested flags", () => {
      // input: box with "admin", check "read" and "write"
      // expected: true — no overlap
      expect(hasNone(registry.of("admin"), "read", "write")).toBe(true);
    });

    test("full box returns false for any single flag", () => {
      // input: full box, check each flag individually
      // expected: false for all — full box has every flag
      const box = registry.full();
      expect(hasNone(box, "read")).toBe(false);
      expect(hasNone(box, "write")).toBe(false);
      expect(hasNone(box, "execute")).toBe(false);
      expect(hasNone(box, "admin")).toBe(false);
    });

    test("full box returns false for all flags at once", () => {
      // input: full box, check all four flags
      // expected: false
      expect(
        hasNone(registry.full(), "read", "write", "execute", "admin"),
      ).toBe(false);
    });
  });

  describe("empty box", () => {
    test("empty box returns true for any single flag", () => {
      // input: empty box, check "read"
      // expected: true — no flags are set, so none of the requested ones are present
      expect(hasNone(registry.empty(), "read")).toBe(true);
    });

    test("empty box returns true for multiple flags", () => {
      // input: empty box, check "read" and "write"
      // expected: true
      expect(hasNone(registry.empty(), "read", "write")).toBe(true);
    });

    test("empty box returns true for all flags at once", () => {
      // input: empty box, check all four flags
      // expected: true — nothing is set
      expect(
        hasNone(registry.empty(), "read", "write", "execute", "admin"),
      ).toBe(true);
    });
  });

  describe("edge cases", () => {
    test("returns true when called with no flags (vacuous truth)", () => {
      // input: any box, no flags passed
      // expected: true
      expect(hasNone(registry.empty())).toBe(true);
      expect(hasNone(registry.of("read"))).toBe(true);
      expect(hasNone(registry.full())).toBe(true);
    });

    test("returns boolean type", () => {
      // input: box with "read", check "write"
      // expected: result is strictly boolean true, not a truthy value
      const result = hasNone(registry.of("read"), "write");
      expect(typeof result).toBe("boolean");
    });

    test("does not mutate the box", () => {
      // input: box with "read", check "write"
      // expected: original bits unchanged after the call
      const box = registry.of("read");
      const originalBits = box.bits;
      hasNone(box, "write");

      expect(box.bits).toBe(originalBits);
    });
  });

  describe("BigInt registry", () => {
    test("returns true when BigInt box has none of the requested flags", () => {
      // input: BigInt box with "read", check "write" and "execute"
      // expected: true — no overlap
      expect(hasNone(bigRegistry.of("read"), "write", "execute")).toBe(true);
    });

    test("returns false when BigInt box has at least one requested flag", () => {
      // input: BigInt box with "read" and "execute", check "execute" and "admin"
      // expected: false — "execute" is present
      expect(
        hasNone(bigRegistry.of("read", "execute"), "execute", "admin"),
      ).toBe(false);
    });

    test("returns true for any flag on an empty BigInt box", () => {
      // input: BigInt empty box, check "admin"
      // expected: true
      expect(hasNone(bigRegistry.empty(), "admin")).toBe(true);
    });

    test("full BigInt box returns false for any flag", () => {
      // input: BigInt full box, check "execute"
      // expected: false
      expect(hasNone(bigRegistry.full(), "execute")).toBe(false);
    });
  });

  describe("error cases", () => {
    test("throws UnknownFlagError when the only requested flag is not registered", () => {
      // input: valid box, unknown flag "superuser"
      // expected: UnknownFlagError thrown
      const box = registry.of("read");

      expect(() => hasNone(box, "superuser" as Perms)).toThrow(
        UnknownFlagError,
      );
    });

    test("throws UnknownFlagError with the offending flag name", () => {
      // input: valid box, unknown flag "ghost"
      // expected: error.flag === "ghost"
      const box = registry.empty();

      try {
        hasNone(box, "ghost" as Perms);
        expect(true).toBe(false); // should not reach here
      } catch (e) {
        expect(e).toBeInstanceOf(UnknownFlagError);
        expect((e as UnknownFlagError).flag).toBe("ghost");
      }
    });

    test("throws when unknown flag follows a known but absent flag", () => {
      // input: box with "admin", flags "read" (absent) then "ghost" (unknown)
      // expected: UnknownFlagError thrown
      const box = registry.of("admin");

      expect(() => hasNone(box, "read", "ghost" as Perms)).toThrow(
        UnknownFlagError,
      );
    });

    test("throws when a present known flag precedes an unknown one", () => {
      // input: box with "read", flags "read" (present) then "ghost" (unknown)
      // expected: UnknownFlagError thrown
      const box = registry.of("read");

      expect(() => hasNone(box, "read", "ghost" as Perms)).toThrow(
        UnknownFlagError,
      );
    });

    test("throws when unknown flag is first and box does not short-circuit", () => {
      // input: empty box, flags "ghost" (unknown) then "read"
      // expected: UnknownFlagError thrown
      const box = registry.empty();

      expect(() => hasNone(box, "ghost" as Perms, "read")).toThrow(
        UnknownFlagError,
      );
    });
  });
});
