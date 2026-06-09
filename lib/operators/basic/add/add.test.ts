import { describe, expect, test } from "bun:test";

import { UnknownFlagError } from "@/flags/errors";
import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { add } from "./add";

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

describe("add", () => {
  describe("basic behavior", () => {
    test("adds a single flag to an empty box", () => {
      // input: empty box, flag "read"
      // expected: box contains only "read"
      const box = registry.empty();
      const result = add(box, "read");

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(false);
    });

    test("adds multiple flags at once", () => {
      // input: empty box, flags "read" and "write"
      // expected: box contains exactly "read" and "write"
      const box = registry.empty();
      const result = add(box, "read", "write");

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(false);
      expect(result.has("admin")).toBe(false);
    });

    test("preserves existing flags when adding new ones", () => {
      // input: box with "read", add "write"
      // expected: box contains both "read" and "write"
      const box = registry.of("read");
      const result = add(box, "write");

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(true);
    });

    test("adding all flags produces a full box", () => {
      // input: empty box, all four flags
      // expected: isFull() returns true
      const box = registry.empty();
      const result = add(box, "read", "write", "execute", "admin");

      expect(result.isFull()).toBe(true);
    });
  });

  describe("idempotency and duplicates", () => {
    test("adding an already-present flag is idempotent", () => {
      // input: box with "read", add "read" again
      // expected: bits unchanged, size still 1
      const box = registry.of("read");
      const result = add(box, "read");

      expect(result.bits).toBe(box.bits);
      expect(result.size).toBe(1);
    });

    test("adding the same flag twice in one call is idempotent", () => {
      // input: empty box, "write" listed twice
      // expected: only one bit set
      const box = registry.empty();
      const result = add(box, "write", "write");

      expect(result.has("write")).toBe(true);
      expect(result.size).toBe(1);
    });
  });

  describe("immutability", () => {
    test("does not mutate the original box", () => {
      // input: box with "read", add "write"
      // expected: original box still has only "read"
      const box = registry.of("read");
      const originalBits = box.bits;
      add(box, "write");

      expect(box.bits).toBe(originalBits);
      expect(box.has("write")).toBe(false);
    });

    test("returns a new FlagBox instance", () => {
      // input: any box
      // expected: result !== input
      const box = registry.empty();
      const result = add(box, "read");

      expect(result).not.toBe(box);
    });
  });

  describe("edge cases", () => {
    test("adding no flags returns a box with the same bits", () => {
      // input: box with "read", no flags passed
      // expected: bits unchanged
      const box = registry.of("read");
      const result = add(box);

      expect(result.bits).toBe(box.bits);
    });

    test("adding no flags to empty box returns an empty box", () => {
      // input: empty box, no flags
      // expected: isEmpty() is true
      const box = registry.empty();
      const result = add(box);

      expect(result.isEmpty()).toBe(true);
    });

    test("result shares the same registry", () => {
      // input: any box
      // expected: result.registry === original registry reference
      const box = registry.empty();
      const result = add(box, "read");

      expect(result.registry).toBe(registry);
    });

    test("adding to a full box keeps it full", () => {
      // input: full box, add any flag
      // expected: still full
      const box = registry.full();
      const result = add(box, "read");

      expect(result.isFull()).toBe(true);
    });
  });

  describe("BigInt registry", () => {
    test("works correctly with BigInt bits", () => {
      // input: BigInt empty box, flags "read" and "execute"
      // expected: has those flags, not others
      const box = bigRegistry.empty();
      const result = add(box, "read", "execute");

      expect(result.has("read")).toBe(true);
      expect(result.has("execute")).toBe(true);
      expect(result.has("write")).toBe(false);
    });

    test("BigInt result bits are bigint type", () => {
      // input: BigInt box
      // expected: result.bits is typeof bigint
      const box = bigRegistry.empty();
      const result = add(box, "write");

      expect(typeof result.bits).toBe("bigint");
    });
  });

  describe("error cases", () => {
    test("throws UnknownFlagError when flag is not registered", () => {
      // input: valid box, unknown flag name
      // expected: UnknownFlagError thrown
      const box = registry.empty();

      expect(() => add(box, "unknown" as Perms)).toThrow(UnknownFlagError);
    });

    test("throws UnknownFlagError with the offending flag name", () => {
      // input: valid box, flag "ghost" not in registry
      // expected: error.flag === "ghost"
      const box = registry.empty();

      try {
        add(box, "ghost" as Perms);
        expect(true).toBe(false); // should not reach here
      } catch (e) {
        expect(e).toBeInstanceOf(UnknownFlagError);
        expect((e as UnknownFlagError).flag).toBe("ghost");
      }
    });

    test("throws before any flags are applied when an unknown flag is mixed in", () => {
      // input: empty box, first flag valid ("read"), second unknown ("ghost")
      // expected: UnknownFlagError; result is never returned
      const box = registry.empty();

      expect(() => add(box, "read", "ghost" as Perms)).toThrow(
        UnknownFlagError,
      );
    });
  });
});
