import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { union } from "./union";

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

describe("union", () => {
  describe("basic behavior", () => {
    test("combines two disjoint boxes", () => {
      // input: box{"read"}, box{"write"}
      // expected: result has both "read" and "write", not others
      const result = union(registry.of("read"), registry.of("write"));

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(false);
      expect(result.has("admin")).toBe(false);
    });

    test("combines three boxes", () => {
      // input: box{"read"}, box{"write"}, box{"execute"}
      // expected: result has all three flags
      const result = union(
        registry.of("read"),
        registry.of("write"),
        registry.of("execute"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(true);
      expect(result.has("admin")).toBe(false);
    });

    test("combines boxes with overlapping flags", () => {
      // input: box{"read","write"}, box{"write","execute"}
      // expected: result has "read", "write", "execute"; not "admin"
      const result = union(
        registry.of("read", "write"),
        registry.of("write", "execute"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(true);
      expect(result.has("admin")).toBe(false);
      expect(result.size).toBe(3);
    });

    test("union of all individual flags produces a full box", () => {
      // input: four single-flag boxes
      // expected: isFull() is true
      const result = union(
        registry.of("read"),
        registry.of("write"),
        registry.of("execute"),
        registry.of("admin"),
      );

      expect(result.isFull()).toBe(true);
    });
  });

  describe("identity element (empty box)", () => {
    test("union with empty box on the right preserves left bits", () => {
      // input: box{"read","write"}, empty box
      // expected: result bits equal left bits
      const left = registry.of("read", "write");
      const result = union(left, registry.empty());

      expect(result.bits).toBe(left.bits);
    });

    test("union with empty box on the left preserves right bits", () => {
      // input: empty box, box{"execute"}
      // expected: result has "execute" only
      const right = registry.of("execute");
      const result = union(registry.empty(), right);

      expect(result.has("execute")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("union of two empty boxes is empty", () => {
      // input: empty, empty
      // expected: isEmpty() is true
      const result = union(registry.empty(), registry.empty());

      expect(result.isEmpty()).toBe(true);
    });
  });

  describe("idempotency and duplicates", () => {
    test("union of a box with itself returns the same bits", () => {
      // input: box{"read","write"} unioned with itself
      // expected: bits unchanged
      const box = registry.of("read", "write");
      const result = union(box, box);

      expect(result.bits).toBe(box.bits);
    });

    test("union of identical non-empty boxes produces no new flags", () => {
      // input: box{"admin"}, box{"admin"}
      // expected: size is still 1
      const result = union(registry.of("admin"), registry.of("admin"));

      expect(result.has("admin")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("union of full and empty is full", () => {
      // input: full box, empty box
      // expected: isFull() is true
      const result = union(registry.full(), registry.empty());

      expect(result.isFull()).toBe(true);
    });

    test("union of full and full is full", () => {
      // input: full box, full box
      // expected: isFull() is true
      const result = union(registry.full(), registry.full());

      expect(result.isFull()).toBe(true);
    });
  });

  describe("single argument (no other)", () => {
    test("union of only left returns a box with the same bits", () => {
      // input: box{"read","execute"}, no other args
      // expected: result bits equal left bits
      const box = registry.of("read", "execute");
      const result = union(box);

      expect(result.bits).toBe(box.bits);
    });

    test("union of only an empty box returns an empty box", () => {
      // input: empty box, no other args
      // expected: isEmpty() is true
      const result = union(registry.empty());

      expect(result.isEmpty()).toBe(true);
    });

    test("union of only a full box returns a full box", () => {
      // input: full box, no other args
      // expected: isFull() is true
      const result = union(registry.full());

      expect(result.isFull()).toBe(true);
    });
  });

  describe("immutability", () => {
    test("does not mutate the left box", () => {
      // input: box{"read"} unioned with box{"write"}
      // expected: left.bits unchanged after the call
      const left = registry.of("read");
      const originalBits = left.bits;
      union(left, registry.of("write"));

      expect(left.bits).toBe(originalBits);
    });

    test("does not mutate the right box", () => {
      // input: box{"read"} unioned with box{"write"}
      // expected: right.bits unchanged after the call
      const right = registry.of("write");
      const originalBits = right.bits;
      union(registry.of("read"), right);

      expect(right.bits).toBe(originalBits);
    });

    test("returns a new FlagBox instance", () => {
      // input: any two boxes
      // expected: result is not the same reference as either input
      const left = registry.of("read");
      const right = registry.of("write");
      const result = union(left, right);

      expect(result).not.toBe(left);
      expect(result).not.toBe(right);
    });
  });

  describe("registry inheritance", () => {
    test("result uses the registry of the left box", () => {
      // input: left from registry, right from registry
      // expected: result.registry === registry (left's registry)
      const left = registry.of("read");
      const result = union(left, registry.of("write"));

      expect(result.registry).toBe(registry);
    });
  });

  describe("BigInt registry", () => {
    test("combines two BigInt boxes", () => {
      // input: BigInt box{"read"}, BigInt box{"write"}
      // expected: result has both flags
      const result = union(bigRegistry.of("read"), bigRegistry.of("write"));

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(false);
    });

    test("BigInt result bits are bigint type", () => {
      // input: two BigInt boxes
      // expected: result.bits is typeof bigint
      const result = union(bigRegistry.of("read"), bigRegistry.of("write"));

      expect(typeof result.bits).toBe("bigint");
    });

    test("BigInt union with empty box preserves bits", () => {
      // input: BigInt box{"execute"}, BigInt empty box
      // expected: result has only "execute"
      const result = union(bigRegistry.of("execute"), bigRegistry.empty());

      expect(result.has("execute")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("BigInt union of all flags produces a full box", () => {
      // input: four single-flag BigInt boxes
      // expected: isFull() is true
      const result = union(
        bigRegistry.of("read"),
        bigRegistry.of("write"),
        bigRegistry.of("execute"),
        bigRegistry.of("admin"),
      );

      expect(result.isFull()).toBe(true);
    });
  });

  describe("commutativity", () => {
    test("union(a, b) produces same bits as union(b, a)", () => {
      // input: box{"read"} and box{"write"} in both orders
      // expected: bits are equal in both directions
      const ab = union(registry.of("read"), registry.of("write"));
      const ba = union(registry.of("write"), registry.of("read"));

      expect(ab.bits).toBe(ba.bits);
    });

    test("union(a, b, c) bits equal union(c, b, a)", () => {
      // input: three boxes in reversed order
      // expected: bits are equal regardless of order
      const abc = union(
        registry.of("read"),
        registry.of("write"),
        registry.of("execute"),
      );
      const cba = union(
        registry.of("execute"),
        registry.of("write"),
        registry.of("read"),
      );

      expect(abc.bits).toBe(cba.bits);
    });
  });
});
