import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { intersection } from "./intersection";

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

describe("intersection", () => {
  describe("basic behavior", () => {
    test("two disjoint boxes produce an empty result", () => {
      // input: box{"read"}, box{"write"}
      // expected: no common flags -> isEmpty()
      const result = intersection(registry.of("read"), registry.of("write"));

      expect(result.isEmpty()).toBe(true);
    });

    test("two boxes with one common flag keep only that flag", () => {
      // input: box{"read","write"}, box{"write","execute"}
      // expected: result has only "write"
      const result = intersection(
        registry.of("read", "write"),
        registry.of("write", "execute"),
      );

      expect(result.has("read")).toBe(false);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(false);
      expect(result.has("admin")).toBe(false);
      expect(result.size).toBe(1);
    });

    test("two identical boxes return the same flags", () => {
      // input: box{"read","execute"}, box{"read","execute"}
      // expected: result has exactly "read" and "execute"
      const result = intersection(
        registry.of("read", "execute"),
        registry.of("read", "execute"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("execute")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.size).toBe(2);
    });

    test("three boxes keep only the common flag", () => {
      // input: box{"read","write"}, box{"read","execute"}, box{"read","admin"}
      // expected: only "read" is in all three
      const result = intersection(
        registry.of("read", "write"),
        registry.of("read", "execute"),
        registry.of("read", "admin"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(false);
      expect(result.has("admin")).toBe(false);
      expect(result.size).toBe(1);
    });

    test("three mutually disjoint boxes produce an empty result", () => {
      // input: box{"read"}, box{"write"}, box{"execute"} — no shared flags
      // expected: isEmpty()
      const result = intersection(
        registry.of("read"),
        registry.of("write"),
        registry.of("execute"),
      );

      expect(result.isEmpty()).toBe(true);
    });
  });

  describe("identity element (full box)", () => {
    test("intersection with full box on the right preserves left bits", () => {
      // input: box{"read","write"}, full box
      // expected: result bits equal left bits
      const left = registry.of("read", "write");
      const result = intersection(left, registry.full());

      expect(result.bits).toBe(left.bits);
    });

    test("intersection with full box on the left preserves right bits", () => {
      // input: full box, box{"execute"}
      // expected: result has only "execute"
      const right = registry.of("execute");
      const result = intersection(registry.full(), right);

      expect(result.has("execute")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("intersection of two full boxes is full", () => {
      // input: full box, full box
      // expected: isFull()
      const result = intersection(registry.full(), registry.full());

      expect(result.isFull()).toBe(true);
    });
  });

  describe("annihilator (empty box)", () => {
    test("intersection with empty box on the right is empty", () => {
      // input: box{"read","write"}, empty box
      // expected: isEmpty()
      const result = intersection(registry.of("read", "write"), registry.empty());

      expect(result.isEmpty()).toBe(true);
    });

    test("intersection with empty box on the left is empty", () => {
      // input: empty box, box{"execute"}
      // expected: isEmpty()
      const result = intersection(registry.empty(), registry.of("execute"));

      expect(result.isEmpty()).toBe(true);
    });

    test("intersection of two empty boxes is empty", () => {
      // input: empty box, empty box
      // expected: isEmpty()
      const result = intersection(registry.empty(), registry.empty());

      expect(result.isEmpty()).toBe(true);
    });

    test("full intersected with empty is empty", () => {
      // input: full box, empty box
      // expected: isEmpty()
      const result = intersection(registry.full(), registry.empty());

      expect(result.isEmpty()).toBe(true);
    });
  });

  describe("idempotency", () => {
    test("intersection of a box with itself returns the same bits", () => {
      // input: box{"read","write"} intersected with itself
      // expected: bits unchanged
      const box = registry.of("read", "write");
      const result = intersection(box, box);

      expect(result.bits).toBe(box.bits);
    });

    test("intersection of identical non-empty boxes keeps all their flags", () => {
      // input: box{"admin"}, box{"admin"}
      // expected: size is 1, "admin" is present
      const result = intersection(registry.of("admin"), registry.of("admin"));

      expect(result.has("admin")).toBe(true);
      expect(result.size).toBe(1);
    });
  });

  describe("single argument (no other)", () => {
    test("intersection of only left returns a box with the same bits", () => {
      // input: box{"read","execute"}, no other args
      // expected: result bits equal left bits
      const box = registry.of("read", "execute");
      const result = intersection(box);

      expect(result.bits).toBe(box.bits);
    });

    test("intersection of only an empty box returns an empty box", () => {
      // input: empty box, no other args
      // expected: isEmpty()
      const result = intersection(registry.empty());

      expect(result.isEmpty()).toBe(true);
    });

    test("intersection of only a full box returns a full box", () => {
      // input: full box, no other args
      // expected: isFull()
      const result = intersection(registry.full());

      expect(result.isFull()).toBe(true);
    });
  });

  describe("immutability", () => {
    test("does not mutate the left box", () => {
      // input: box{"read"} intersected with box{"write"}
      // expected: left.bits unchanged after the call
      const left = registry.of("read");
      const originalBits = left.bits;
      intersection(left, registry.of("write"));

      expect(left.bits).toBe(originalBits);
    });

    test("does not mutate the right box", () => {
      // input: box{"read"} intersected with box{"write"}
      // expected: right.bits unchanged after the call
      const right = registry.of("write");
      const originalBits = right.bits;
      intersection(registry.of("read"), right);

      expect(right.bits).toBe(originalBits);
    });

    test("returns a new FlagBox instance", () => {
      // input: any two overlapping boxes
      // expected: result is not the same reference as either input
      const left = registry.of("read", "write");
      const right = registry.of("write", "execute");
      const result = intersection(left, right);

      expect(result).not.toBe(left);
      expect(result).not.toBe(right);
    });
  });

  describe("registry inheritance", () => {
    test("result uses the registry of the left box", () => {
      // input: left from registry, right from registry
      // expected: result.registry === registry (left's registry)
      const left = registry.of("read");
      const result = intersection(left, registry.of("write"));

      expect(result.registry).toBe(registry);
    });
  });

  describe("BigInt registry", () => {
    test("intersection of two BigInt boxes with one common flag", () => {
      // input: BigInt box{"read","write"}, BigInt box{"write","execute"}
      // expected: only "write" remains
      const result = intersection(
        bigRegistry.of("read", "write"),
        bigRegistry.of("write", "execute"),
      );

      expect(result.has("read")).toBe(false);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(false);
    });

    test("BigInt result bits are bigint type", () => {
      // input: two BigInt boxes with overlap
      // expected: result.bits is typeof bigint
      const result = intersection(
        bigRegistry.of("read", "write"),
        bigRegistry.of("write"),
      );

      expect(typeof result.bits).toBe("bigint");
    });

    test("BigInt intersection with empty box is empty", () => {
      // input: BigInt box{"execute"}, BigInt empty box
      // expected: isEmpty()
      const result = intersection(bigRegistry.of("execute"), bigRegistry.empty());

      expect(result.isEmpty()).toBe(true);
    });

    test("BigInt intersection of full boxes is full", () => {
      // input: BigInt full box, BigInt full box
      // expected: isFull()
      const result = intersection(bigRegistry.full(), bigRegistry.full());

      expect(result.isFull()).toBe(true);
    });
  });

  describe("commutativity", () => {
    test("intersection(a, b) produces same bits as intersection(b, a)", () => {
      // input: box{"read","write"} and box{"write","execute"} in both orders
      // expected: bits are equal in both directions
      const ab = intersection(
        registry.of("read", "write"),
        registry.of("write", "execute"),
      );
      const ba = intersection(
        registry.of("write", "execute"),
        registry.of("read", "write"),
      );

      expect(ab.bits).toBe(ba.bits);
    });

    test("intersection(a, b, c) bits equal intersection(c, b, a)", () => {
      // input: three overlapping boxes in reversed order
      // expected: bits are equal regardless of order
      const abc = intersection(
        registry.of("read", "write"),
        registry.of("write", "execute"),
        registry.of("write", "admin"),
      );
      const cba = intersection(
        registry.of("write", "admin"),
        registry.of("write", "execute"),
        registry.of("read", "write"),
      );

      expect(abc.bits).toBe(cba.bits);
    });
  });
});
