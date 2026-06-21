import { describe, expect, test } from "bun:test";

import { UnknownFlagError } from "@/flags/errors";
import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { toggle } from "./toggle";

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

describe("toggle", () => {
  describe("basic behavior", () => {
    test("toggles an absent flag on", () => {
      // input: empty box, toggle "read"
      // expected: "read" is now set
      const box = registry.empty();
      const result = toggle(box, "read");

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(false);
    });

    test("toggles a present flag off", () => {
      // input: box with "read", toggle "read"
      // expected: "read" is no longer set
      const box = registry.of("read");
      const result = toggle(box, "read");

      expect(result.has("read")).toBe(false);
    });

    test("toggles multiple flags at once", () => {
      // input: box with "read", toggle "read" and "write"
      // expected: "read" removed, "write" added
      const box = registry.of("read");
      const result = toggle(box, "read", "write");

      expect(result.has("read")).toBe(false);
      expect(result.has("write")).toBe(true);
    });

    test("toggling all absent flags on an empty box produces a full box", () => {
      // input: empty box, toggle all four flags
      // expected: isFull() is true
      const box = registry.empty();
      const result = toggle(box, "read", "write", "execute", "admin");

      expect(result.isFull()).toBe(true);
    });

    test("toggling all flags on a full box produces an empty box", () => {
      // input: full box, toggle all four flags
      // expected: isEmpty() is true
      const box = registry.full();
      const result = toggle(box, "read", "write", "execute", "admin");

      expect(result.isEmpty()).toBe(true);
    });

    test("preserves flags that are not toggled", () => {
      // input: box with "read", "write", "execute", toggle only "write"
      // expected: "read" and "execute" untouched, "write" removed
      const box = registry.of("read", "write", "execute");
      const result = toggle(box, "write");

      expect(result.has("read")).toBe(true);
      expect(result.has("execute")).toBe(true);
      expect(result.has("write")).toBe(false);
    });
  });

  describe("double-toggle cancellation", () => {
    test("toggling the same flag twice in separate calls returns to original bits", () => {
      // input: box with "read", toggle "write" twice
      // expected: bits identical to original
      const box = registry.of("read");
      const result = toggle(toggle(box, "write"), "write");

      expect(result.bits).toBe(box.bits);
    });

    test("toggling the same flag twice in one call doesn't cancel out", () => {
      // input: box with "read", pass "write" twice in a single call
      // expected: "write" set
      const box = registry.of("read");
      const result = toggle(box, "write", "write");

      expect(result.has("write")).toBeTrue();
      expect(result.bits).not.toBe(box.bits);
    });

    test("toggling a present flag twice in one call toggles it once (set semantics)", () => {
      // input: box with "read", pass "read" twice
      // expected: "read" still set
      const box = registry.of("read");
      const result = toggle(box, "read", "read");

      expect(result.has("read")).toBeFalse();
      expect(result.isEmpty()).toBeTrue();
    });
  });

  describe("immutability", () => {
    test("does not mutate the original box", () => {
      // input: box with "read", toggle "read"
      // expected: original bits unchanged, "read" still present in original
      const box = registry.of("read");
      const originalBits = box.bits;
      toggle(box, "read");

      expect(box.bits).toBe(originalBits);
      expect(box.has("read")).toBe(true);
    });

    test("returns a new FlagBox instance", () => {
      // input: any box
      // expected: result !== input
      const box = registry.of("read");
      const result = toggle(box, "read");

      expect(result).not.toBe(box);
    });
  });

  describe("edge cases", () => {
    test("toggling no flags returns a box with the same bits", () => {
      // input: box with "read", no flags passed
      // expected: bits unchanged
      const box = registry.of("read");
      const result = toggle(box);

      expect(result.bits).toBe(box.bits);
    });

    test("toggling no flags on an empty box keeps it empty", () => {
      // input: empty box, no flags
      // expected: isEmpty() is true
      const box = registry.empty();
      const result = toggle(box);

      expect(result.isEmpty()).toBe(true);
    });

    test("toggling on an empty box only adds the specified flags", () => {
      // input: empty box, toggle "execute"
      // expected: size is 1, only "execute" set
      const box = registry.empty();
      const result = toggle(box, "execute");

      expect(result.size).toBe(1);
      expect(result.has("execute")).toBe(true);
    });

    test("result shares the same registry", () => {
      // input: any box
      // expected: result.registry === original registry reference
      const box = registry.of("read");
      const result = toggle(box, "read");

      expect(result.registry).toBe(registry);
    });
  });

  describe("BigInt registry", () => {
    test("toggles an absent flag on with BigInt bits", () => {
      // input: empty BigInt box, toggle "read"
      // expected: "read" set, others absent
      const box = bigRegistry.empty();
      const result = toggle(box, "read");

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
    });

    test("toggles a present flag off with BigInt bits", () => {
      // input: BigInt box with "read" and "execute", toggle "execute"
      // expected: "read" present, "execute" absent
      const box = bigRegistry.of("read", "execute");
      const result = toggle(box, "execute");

      expect(result.has("read")).toBe(true);
      expect(result.has("execute")).toBe(false);
    });

    test("BigInt result bits are bigint type", () => {
      // input: BigInt box
      // expected: result.bits is typeof bigint
      const box = bigRegistry.of("write");
      const result = toggle(box, "write");

      expect(typeof result.bits).toBe("bigint");
    });
  });

  describe("error cases", () => {
    test("throws UnknownFlagError when flag is not registered", () => {
      // input: valid box, unknown flag name
      // expected: UnknownFlagError thrown
      const box = registry.empty();

      expect(() => toggle(box, "unknown" as Perms)).toThrow(UnknownFlagError);
    });

    test("throws UnknownFlagError with the offending flag name", () => {
      // input: valid box, flag "ghost" not in registry
      // expected: error.flag === "ghost"
      const box = registry.empty();

      try {
        toggle(box, "ghost" as Perms);
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

      expect(() => toggle(box, "write", "ghost" as Perms)).toThrow(
        UnknownFlagError,
      );
    });
  });
});
