import { describe, expect, test } from "bun:test";

import { UnknownFlagError } from "@/flags/errors";
import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { remove } from "./remove";

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

describe("remove", () => {
  describe("basic behavior", () => {
    test("removes a single flag from a box", () => {
      // input: box with "read" and "write", remove "write"
      // expected: "read" present, "write" absent
      const box = registry.of("read", "write");
      const result = remove(box, "write");

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
    });

    test("removes multiple flags at once", () => {
      // input: full box, remove "read" and "execute"
      // expected: only "write" and "admin" remain
      const box = registry.full();
      const result = remove(box, "read", "execute");

      expect(result.has("read")).toBe(false);
      expect(result.has("execute")).toBe(false);
      expect(result.has("write")).toBe(true);
      expect(result.has("admin")).toBe(true);
    });

    test("removing all flags produces an empty box", () => {
      // input: box with all flags, remove all four
      // expected: isEmpty() returns true
      const box = registry.full();
      const result = remove(box, "read", "write", "execute", "admin");

      expect(result.isEmpty()).toBe(true);
    });

    test("removing from a full box leaves everything except the removed flag", () => {
      // input: full box, remove "admin"
      // expected: "read", "write", "execute" present; "admin" absent
      const box = registry.full();
      const result = remove(box, "admin");

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(true);
      expect(result.has("admin")).toBe(false);
    });
  });

  describe("idempotency and duplicates", () => {
    test("removing an absent flag is a no-op on the bits", () => {
      // input: box with only "read", remove "write" (not present)
      // expected: bits unchanged, "read" still set
      const box = registry.of("read");
      const result = remove(box, "write");

      expect(result.bits).toBe(box.bits);
      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
    });

    test("removing the same flag twice in one call is idempotent", () => {
      // input: box with "read" and "write", remove "write" twice
      // expected: same as removing it once — size is 1
      const box = registry.of("read", "write");
      const result = remove(box, "write", "write");

      expect(result.has("write")).toBe(false);
      expect(result.has("read")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("removing an already-absent flag twice is still a no-op", () => {
      // input: box with "read", remove "execute" twice
      // expected: bits unchanged
      const box = registry.of("read");
      const result = remove(box, "execute", "execute");

      expect(result.bits).toBe(box.bits);
    });
  });

  describe("immutability", () => {
    test("does not mutate the original box", () => {
      // input: box with "read" and "write", remove "write"
      // expected: original box still has both flags
      const box = registry.of("read", "write");
      const originalBits = box.bits;
      remove(box, "write");

      expect(box.bits).toBe(originalBits);
      expect(box.has("write")).toBe(true);
    });

    test("returns a new FlagBox instance", () => {
      // input: any box
      // expected: result !== input
      const box = registry.of("read");
      const result = remove(box, "read");

      expect(result).not.toBe(box);
    });
  });

  describe("edge cases", () => {
    test("removing no flags returns a box with the same bits", () => {
      // input: box with "read", no flags passed
      // expected: bits unchanged
      const box = registry.of("read");
      const result = remove(box);

      expect(result.bits).toBe(box.bits);
    });

    test("removing no flags from an empty box returns an empty box", () => {
      // input: empty box, no flags
      // expected: isEmpty() is true
      const box = registry.empty();
      const result = remove(box);

      expect(result.isEmpty()).toBe(true);
    });

    test("removing from an empty box keeps it empty", () => {
      // input: empty box, remove "read"
      // expected: isEmpty() remains true
      const box = registry.empty();
      const result = remove(box, "read");

      expect(result.isEmpty()).toBe(true);
    });

    test("result shares the same registry", () => {
      // input: any box
      // expected: result.registry === original registry reference
      const box = registry.of("read");
      const result = remove(box, "read");

      expect(result.registry).toBe(registry);
    });
  });

  describe("BigInt registry", () => {
    test("removes a flag correctly with BigInt bits", () => {
      // input: BigInt box with "read" and "execute", remove "execute"
      // expected: "read" present, "execute" absent
      const box = bigRegistry.of("read", "execute");
      const result = remove(box, "execute");

      expect(result.has("read")).toBe(true);
      expect(result.has("execute")).toBe(false);
    });

    test("BigInt result bits are bigint type", () => {
      // input: BigInt box with "write"
      // expected: result.bits is typeof bigint
      const box = bigRegistry.of("write");
      const result = remove(box, "write");

      expect(typeof result.bits).toBe("bigint");
    });

    test("removing from empty BigInt box keeps it empty", () => {
      // input: empty BigInt box, remove "read"
      // expected: isEmpty() is true
      const box = bigRegistry.empty();
      const result = remove(box, "read");

      expect(result.isEmpty()).toBe(true);
    });
  });

  describe("error cases", () => {
    test("throws UnknownFlagError when flag is not registered", () => {
      // input: valid box, unknown flag name
      // expected: UnknownFlagError thrown
      const box = registry.of("read");

      expect(() => remove(box, "unknown" as Perms)).toThrow(UnknownFlagError);
    });

    test("throws UnknownFlagError with the offending flag name", () => {
      // input: valid box, flag "ghost" not in registry
      // expected: error.flag === "ghost"
      const box = registry.of("read");

      try {
        remove(box, "ghost" as Perms);
        expect(true).toBe(false); // should not reach here
      } catch (e) {
        expect(e).toBeInstanceOf(UnknownFlagError);
        expect((e as UnknownFlagError).flag).toBe("ghost");
      }
    });

    test("throws when an unknown flag is mixed in with valid ones", () => {
      // input: box with "read", first flag valid ("write"), second unknown ("ghost")
      // expected: UnknownFlagError; result is never returned
      const box = registry.of("read");

      expect(() => remove(box, "write", "ghost" as Perms)).toThrow(
        UnknownFlagError,
      );
    });
  });
});
