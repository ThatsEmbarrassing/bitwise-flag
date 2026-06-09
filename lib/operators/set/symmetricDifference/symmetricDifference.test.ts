import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { symmetricDifference } from "./symmetricDifference";

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

describe("symmetricDifference", () => {
  describe("basic behavior", () => {
    test("two disjoint boxes produce a box with all their flags", () => {
      // input: box{"read"}, box{"write"}
      // expected: result has both "read" and "write", not others
      const result = symmetricDifference(
        registry.of("read"),
        registry.of("write"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(false);
      expect(result.has("admin")).toBe(false);
      expect(result.size).toBe(2);
    });

    test("shared flag is removed, unique flags survive", () => {
      // input: box{"read","write"}, box{"write","execute"}
      // expected: "write" (in both) is gone; "read" and "execute" remain
      const result = symmetricDifference(
        registry.of("read", "write"),
        registry.of("write", "execute"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(true);
      expect(result.has("admin")).toBe(false);
      expect(result.size).toBe(2);
    });

    test("all shared flags are removed when both boxes are fully overlapping", () => {
      // input: box{"read","write"}, box{"read","write"}
      // expected: isEmpty()
      const result = symmetricDifference(
        registry.of("read", "write"),
        registry.of("read", "write"),
      );

      expect(result.isEmpty()).toBe(true);
    });

    test("single-flag boxes with the same flag produce an empty result", () => {
      // input: box{"read"}, box{"read"}
      // expected: isEmpty()
      const result = symmetricDifference(
        registry.of("read"),
        registry.of("read"),
      );

      expect(result.isEmpty()).toBe(true);
    });

    test("all flags from both boxes survive when there is no overlap", () => {
      // input: box{"read","write"}, box{"execute","admin"}
      // expected: isFull()
      const result = symmetricDifference(
        registry.of("read", "write"),
        registry.of("execute", "admin"),
      );

      expect(result.isFull()).toBe(true);
    });
  });

  describe("identity element (empty box)", () => {
    test("sym diff with empty box on the right preserves left bits", () => {
      // input: box{"read","write"}, empty box
      // expected: result bits equal left bits
      const left = registry.of("read", "write");
      const result = symmetricDifference(left, registry.empty());

      expect(result.bits).toBe(left.bits);
    });

    test("sym diff with empty box on the left preserves right bits", () => {
      // input: empty box, box{"execute"}
      // expected: result has only "execute"
      const right = registry.of("execute");
      const result = symmetricDifference(registry.empty(), right);

      expect(result.has("execute")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("sym diff of two empty boxes is empty", () => {
      // input: empty box, empty box
      // expected: isEmpty()
      const result = symmetricDifference(registry.empty(), registry.empty());

      expect(result.isEmpty()).toBe(true);
    });

    test("full box sym diff empty box is full", () => {
      // input: full box, empty box
      // expected: isFull()
      const result = symmetricDifference(registry.full(), registry.empty());

      expect(result.isFull()).toBe(true);
    });
  });

  describe("self sym diff (annihilator pattern)", () => {
    test("box sym diff with itself is empty", () => {
      // input: box{"read","write"} sym diff itself
      // expected: isEmpty()
      const box = registry.of("read", "write");
      const result = symmetricDifference(box, box);

      expect(result.isEmpty()).toBe(true);
    });

    test("full box sym diff with itself is empty", () => {
      // input: full box sym diff full box (same reference)
      // expected: isEmpty()
      const full = registry.full();
      const result = symmetricDifference(full, full);

      expect(result.isEmpty()).toBe(true);
    });
  });

  describe("multi-argument (3+ boxes): keeps flags in exactly one box", () => {
    test("three mutually disjoint boxes keep all flags", () => {
      // input: box{"read"}, box{"write"}, box{"execute"}
      // expected: all three flags survive (each appears in exactly one box)
      const result = symmetricDifference(
        registry.of("read"),
        registry.of("write"),
        registry.of("execute"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(true);
      expect(result.has("admin")).toBe(false);
    });

    test("flag shared by two of three boxes is removed", () => {
      // input: box{"read","write"}, box{"write","execute"}, box{"execute","admin"}
      // expected: "write" (in boxes 1,2) and "execute" (in boxes 2,3) removed; "read" and "admin" survive
      const result = symmetricDifference(
        registry.of("read", "write"),
        registry.of("write", "execute"),
        registry.of("execute", "admin"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(false);
      expect(result.has("admin")).toBe(true);
      expect(result.size).toBe(2);
    });

    test("flag present in two of three boxes is removed, unique flag survives", () => {
      // input: box{"read"}, box{"read"}, box{"write"}
      // expected: "read" (in 2 boxes) removed; "write" (unique) survives
      const result = symmetricDifference(
        registry.of("read"),
        registry.of("read"),
        registry.of("write"),
      );

      expect(result.has("read")).toBe(false);
      expect(result.has("write")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("flag in all three boxes is removed", () => {
      // input: box{"read"}, box{"read"}, box{"read"}
      // expected: isEmpty() — "read" appears in 2+ boxes, so it is excluded
      const result = symmetricDifference(
        registry.of("read"),
        registry.of("read"),
        registry.of("read"),
      );

      expect(result.isEmpty()).toBe(true);
    });

    test("three full boxes produce an empty result", () => {
      // input: full, full, full
      // expected: isEmpty() — every flag appears in at least two boxes
      const result = symmetricDifference(
        registry.full(),
        registry.full(),
        registry.full(),
      );

      expect(result.isEmpty()).toBe(true);
    });
  });

  describe("commutativity", () => {
    test("symmetricDifference(a, b) produces same bits as symmetricDifference(b, a)", () => {
      // input: box{"read","write"} and box{"write","execute"} in both orders
      // expected: bits are equal in both directions
      const ab = symmetricDifference(
        registry.of("read", "write"),
        registry.of("write", "execute"),
      );
      const ba = symmetricDifference(
        registry.of("write", "execute"),
        registry.of("read", "write"),
      );

      expect(ab.bits).toBe(ba.bits);
    });

    test("symmetricDifference(a, b, c) bits equal symmetricDifference(c, b, a)", () => {
      // input: three overlapping boxes in reversed order
      // expected: bits are equal regardless of order
      const abc = symmetricDifference(
        registry.of("read", "write"),
        registry.of("write", "execute"),
        registry.of("execute", "admin"),
      );
      const cba = symmetricDifference(
        registry.of("execute", "admin"),
        registry.of("write", "execute"),
        registry.of("read", "write"),
      );

      expect(abc.bits).toBe(cba.bits);
    });
  });

  describe("immutability", () => {
    test("does not mutate the left box", () => {
      // input: box{"read","write"} sym diff box{"write"}
      // expected: left.bits unchanged after the call
      const left = registry.of("read", "write");
      const originalBits = left.bits;
      symmetricDifference(left, registry.of("write"));

      expect(left.bits).toBe(originalBits);
    });

    test("does not mutate the right box", () => {
      // input: box{"read","write"} sym diff box{"write"}
      // expected: right.bits unchanged after the call
      const right = registry.of("write");
      const originalBits = right.bits;
      symmetricDifference(registry.of("read", "write"), right);

      expect(right.bits).toBe(originalBits);
    });

    test("returns a new FlagBox instance", () => {
      // input: any two overlapping boxes
      // expected: result is not the same reference as either input
      const left = registry.of("read", "write");
      const right = registry.of("write", "execute");
      const result = symmetricDifference(left, right);

      expect(result).not.toBe(left);
      expect(result).not.toBe(right);
    });
  });

  describe("registry inheritance", () => {
    test("result uses the registry of the left box", () => {
      // input: left from registry, right from registry
      // expected: result.registry === registry (left's registry)
      const left = registry.of("read");
      const result = symmetricDifference(left, registry.of("write"));

      expect(result.registry).toBe(registry);
    });
  });

  describe("BigInt registry", () => {
    test("removes shared flag from BigInt boxes", () => {
      // input: BigInt box{"read","write"}, BigInt box{"write","execute"}
      // expected: "write" removed; "read" and "execute" remain
      const result = symmetricDifference(
        bigRegistry.of("read", "write"),
        bigRegistry.of("write", "execute"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(true);
    });

    test("BigInt result bits are bigint type", () => {
      // input: two BigInt boxes
      // expected: result.bits is typeof bigint
      const result = symmetricDifference(
        bigRegistry.of("read"),
        bigRegistry.of("write"),
      );

      expect(typeof result.bits).toBe("bigint");
    });

    test("BigInt sym diff with empty box preserves left bits", () => {
      // input: BigInt box{"execute"}, BigInt empty box
      // expected: result has only "execute"
      const result = symmetricDifference(
        bigRegistry.of("execute"),
        bigRegistry.empty(),
      );

      expect(result.has("execute")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("BigInt box sym diff with itself is empty", () => {
      // input: BigInt box{"read","admin"} sym diff itself
      // expected: isEmpty()
      const box = bigRegistry.of("read", "admin");
      const result = symmetricDifference(box, box);

      expect(result.isEmpty()).toBe(true);
    });

    test("BigInt three-way sym diff keeps only unique flags", () => {
      // input: BigInt box{"read"}, BigInt box{"write"}, BigInt box{"read","execute"}
      // expected: "read" (in boxes 1 and 3) removed; "write" and "execute" survive
      const result = symmetricDifference(
        bigRegistry.of("read"),
        bigRegistry.of("write"),
        bigRegistry.of("read", "execute"),
      );

      expect(result.has("read")).toBe(false);
      expect(result.has("write")).toBe(true);
      expect(result.has("execute")).toBe(true);
    });
  });
});
