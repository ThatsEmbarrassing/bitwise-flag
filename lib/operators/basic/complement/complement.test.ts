import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { complement } from "./complement";

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

describe("complement", () => {
  describe("basic behavior", () => {
    test("complement of empty box is a full box", () => {
      // input: empty box
      // expected: all four flags present
      const box = registry.empty();
      const result = complement(box);

      expect(result.isFull()).toBe(true);
    });

    test("complement of full box is an empty box", () => {
      // input: full box
      // expected: no flags present
      const box = registry.full();
      const result = complement(box);

      expect(result.isEmpty()).toBe(true);
    });

    test("complement flips a single flag to all others", () => {
      // input: box with only "read"
      // expected: "write", "execute", "admin" set; "read" not set
      const box = registry.of("read");
      const result = complement(box);

      expect(result.has("read")).toBe(false);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(true);
      expect(result.has("admin")).toBe(true);
    });

    test("complement flips multiple flags", () => {
      // input: box with "read" and "write"
      // expected: "execute" and "admin" set; "read" and "write" not set
      const box = registry.of("read", "write");
      const result = complement(box);

      expect(result.has("read")).toBe(false);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(true);
      expect(result.has("admin")).toBe(true);
    });

    test("result size equals registry size minus input size", () => {
      // input: box with 1 flag out of 4
      // expected: result.size === 3
      const box = registry.of("admin");
      const result = complement(box);

      expect(result.size).toBe(3);
    });
  });

  describe("double complement (identity)", () => {
    test("complement of complement of empty is empty", () => {
      // input: empty box
      // expected: complement(complement(x)).bits === x.bits
      const box = registry.empty();
      expect(complement(complement(box)).bits).toBe(box.bits);
    });

    test("complement of complement of full is full", () => {
      // input: full box
      // expected: bits restored to original
      const box = registry.full();
      expect(complement(complement(box)).bits).toBe(box.bits);
    });

    test("complement of complement is identity for arbitrary box", () => {
      // input: box with "read" and "execute"
      // expected: bits after two complements equal original bits
      const box = registry.of("read", "execute");
      expect(complement(complement(box)).bits).toBe(box.bits);
    });
  });

  describe("immutability", () => {
    test("does not mutate the original box", () => {
      // input: box with "write"
      // expected: original bits unchanged after complement
      const box = registry.of("write");
      const originalBits = box.bits;
      complement(box);

      expect(box.bits).toBe(originalBits);
    });

    test("returns a new FlagBox instance", () => {
      // input: any box
      // expected: result !== input
      const box = registry.of("read");
      const result = complement(box);

      expect(result).not.toBe(box);
    });

    test("result shares the same registry", () => {
      // input: any box
      // expected: result.registry === original registry reference
      const box = registry.of("read");
      const result = complement(box);

      expect(result.registry).toBe(registry);
    });
  });

  describe("BigInt registry", () => {
    test("complement of empty BigInt box is full", () => {
      // input: BigInt empty box
      // expected: isFull() true
      const box = bigRegistry.empty();
      const result = complement(box);

      expect(result.isFull()).toBe(true);
    });

    test("complement of full BigInt box is empty", () => {
      // input: BigInt full box
      // expected: isEmpty() true
      const box = bigRegistry.full();
      const result = complement(box);

      expect(result.isEmpty()).toBe(true);
    });

    test("BigInt complement flips flags correctly", () => {
      // input: BigInt box with "read" and "admin"
      // expected: "write" and "execute" set; "read" and "admin" not set
      const box = bigRegistry.of("read", "admin");
      const result = complement(box);

      expect(result.has("read")).toBe(false);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(true);
      expect(result.has("admin")).toBe(false);
    });

    test("BigInt result bits are bigint type", () => {
      // input: BigInt box
      // expected: result.bits is typeof bigint
      const box = bigRegistry.of("write");
      const result = complement(box);

      expect(typeof result.bits).toBe("bigint");
    });

    test("BigInt double complement is identity", () => {
      // input: BigInt box with "execute"
      // expected: bits restored after two complements
      const box = bigRegistry.of("execute");
      expect(complement(complement(box)).bits).toBe(box.bits);
    });
  });
});
