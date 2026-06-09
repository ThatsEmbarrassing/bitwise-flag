import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { difference } from "./difference";

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

describe("difference", () => {
  describe("basic behavior", () => {
    test("removes a single shared flag from the left box", () => {
      // input: box{"read","write"}, box{"write"}
      // expected: result has "read" only
      const result = difference(
        registry.of("read", "write"),
        registry.of("write"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(false);
      expect(result.size).toBe(1);
    });

    test("two disjoint boxes leave the left box unchanged", () => {
      // input: box{"read"}, box{"write"}
      // expected: result still has "read" and nothing else
      const result = difference(registry.of("read"), registry.of("write"));

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.size).toBe(1);
    });

    test("removes all flags when right contains all of left", () => {
      // input: box{"read","write"}, box{"read","write","execute"}
      // expected: isEmpty()
      const result = difference(
        registry.of("read", "write"),
        registry.of("read", "write", "execute"),
      );

      expect(result.isEmpty()).toBe(true);
    });

    test("removes multiple shared flags from the left box", () => {
      // input: box{"read","write","execute"}, box{"write","execute"}
      // expected: result has only "read"
      const result = difference(
        registry.of("read", "write", "execute"),
        registry.of("write", "execute"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(false);
      expect(result.size).toBe(1);
    });

    test("removes flags from multiple other boxes", () => {
      // input: box{"read","write","execute","admin"}, box{"write"}, box{"execute"}
      // expected: result has "read" and "admin" only
      const result = difference(
        registry.of("read", "write", "execute", "admin"),
        registry.of("write"),
        registry.of("execute"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(false);
      expect(result.has("admin")).toBe(true);
      expect(result.size).toBe(2);
    });

    test("subtracting a full box from a non-empty left yields empty", () => {
      // input: box{"read","write"}, full box
      // expected: isEmpty()
      const result = difference(registry.of("read", "write"), registry.full());

      expect(result.isEmpty()).toBe(true);
    });

    test("subtracting a full box from full yields empty", () => {
      // input: full box, full box
      // expected: isEmpty()
      const result = difference(registry.full(), registry.full());

      expect(result.isEmpty()).toBe(true);
    });
  });

  describe("identity element (empty subtrahend)", () => {
    test("subtracting an empty box preserves the left bits", () => {
      // input: box{"read","write"}, empty box
      // expected: result bits equal left bits
      const left = registry.of("read", "write");
      const result = difference(left, registry.empty());

      expect(result.bits).toBe(left.bits);
    });

    test("subtracting two empty boxes preserves the left bits", () => {
      // input: box{"execute"}, empty box, empty box
      // expected: result has only "execute"
      const result = difference(
        registry.of("execute"),
        registry.empty(),
        registry.empty(),
      );

      expect(result.has("execute")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("difference of empty left and non-empty right is empty", () => {
      // input: empty box, box{"read"}
      // expected: isEmpty()
      const result = difference(registry.empty(), registry.of("read"));

      expect(result.isEmpty()).toBe(true);
    });

    test("difference of two empty boxes is empty", () => {
      // input: empty box, empty box
      // expected: isEmpty()
      const result = difference(registry.empty(), registry.empty());

      expect(result.isEmpty()).toBe(true);
    });
  });

  describe("self-subtraction", () => {
    test("subtracting a box from itself yields empty", () => {
      // input: box{"read","write"} minus itself
      // expected: isEmpty()
      const box = registry.of("read", "write");
      const result = difference(box, box);

      expect(result.isEmpty()).toBe(true);
    });

    test("full box minus itself is empty", () => {
      // input: full box, full box (same reference)
      // expected: isEmpty()
      const full = registry.full();
      const result = difference(full, full);

      expect(result.isEmpty()).toBe(true);
    });
  });

  describe("single argument (no other)", () => {
    test("difference with no subtrahend returns the same bits", () => {
      // input: box{"read","execute"}, no other args
      // expected: result bits equal left bits
      const box = registry.of("read", "execute");
      const result = difference(box);

      expect(result.bits).toBe(box.bits);
    });

    test("difference of only an empty box returns an empty box", () => {
      // input: empty box, no other args
      // expected: isEmpty()
      const result = difference(registry.empty());

      expect(result.isEmpty()).toBe(true);
    });

    test("difference of only a full box returns a full box", () => {
      // input: full box, no other args
      // expected: isFull()
      const result = difference(registry.full());

      expect(result.isFull()).toBe(true);
    });
  });

  describe("non-commutativity", () => {
    test("difference(a, b) is not equal to difference(b, a) when they overlap", () => {
      // input: box{"read","write"} and box{"write","execute"} in both orders
      // expected: bits differ because subtraction is directional
      const ab = difference(
        registry.of("read", "write"),
        registry.of("write", "execute"),
      );
      const ba = difference(
        registry.of("write", "execute"),
        registry.of("read", "write"),
      );

      expect(ab.bits).not.toBe(ba.bits);
    });

    test("difference(a, b) keeps left-only flags, not right-only flags", () => {
      // input: box{"read","write"} minus box{"write","execute"}
      // expected: "read" survives; "execute" is absent (it was never in left)
      const result = difference(
        registry.of("read", "write"),
        registry.of("write", "execute"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(false);
    });
  });

  describe("immutability", () => {
    test("does not mutate the left box", () => {
      // input: box{"read","write"} minus box{"write"}
      // expected: left.bits unchanged after the call
      const left = registry.of("read", "write");
      const originalBits = left.bits;
      difference(left, registry.of("write"));

      expect(left.bits).toBe(originalBits);
    });

    test("does not mutate the right box", () => {
      // input: box{"read","write"} minus box{"write"}
      // expected: right.bits unchanged after the call
      const right = registry.of("write");
      const originalBits = right.bits;
      difference(registry.of("read", "write"), right);

      expect(right.bits).toBe(originalBits);
    });

    test("returns a new FlagBox instance", () => {
      // input: any two overlapping boxes
      // expected: result is not the same reference as either input
      const left = registry.of("read", "write");
      const right = registry.of("write");
      const result = difference(left, right);

      expect(result).not.toBe(left);
      expect(result).not.toBe(right);
    });
  });

  describe("registry inheritance", () => {
    test("result uses the registry of the left box", () => {
      // input: left from registry, right from registry
      // expected: result.registry === registry (left's registry)
      const left = registry.of("read", "write");
      const result = difference(left, registry.of("write"));

      expect(result.registry).toBe(registry);
    });
  });

  describe("BigInt registry", () => {
    test("removes shared flag from BigInt boxes", () => {
      // input: BigInt box{"read","write"}, BigInt box{"write"}
      // expected: result has "read" only
      const result = difference(
        bigRegistry.of("read", "write"),
        bigRegistry.of("write"),
      );

      expect(result.has("read")).toBe(true);
      expect(result.has("write")).toBe(false);
    });

    test("BigInt result bits are bigint type", () => {
      // input: two BigInt boxes with overlap
      // expected: result.bits is typeof bigint
      const result = difference(
        bigRegistry.of("read", "write"),
        bigRegistry.of("write"),
      );

      expect(typeof result.bits).toBe("bigint");
    });

    test("BigInt difference with empty box preserves left bits", () => {
      // input: BigInt box{"execute"}, BigInt empty box
      // expected: result has "execute" only
      const result = difference(bigRegistry.of("execute"), bigRegistry.empty());

      expect(result.has("execute")).toBe(true);
      expect(result.size).toBe(1);
    });

    test("BigInt box minus itself is empty", () => {
      // input: BigInt box{"read","admin"} minus itself
      // expected: isEmpty()
      const box = bigRegistry.of("read", "admin");
      const result = difference(box, box);

      expect(result.isEmpty()).toBe(true);
    });

    test("BigInt difference subtracting from multiple others", () => {
      // input: BigInt full box minus box{"read"} minus box{"write"}
      // expected: result has "execute" and "admin" only
      const result = difference(
        bigRegistry.full(),
        bigRegistry.of("read"),
        bigRegistry.of("write"),
      );

      expect(result.has("read")).toBe(false);
      expect(result.has("write")).toBe(false);
      expect(result.has("execute")).toBe(true);
      expect(result.has("admin")).toBe(true);
    });
  });
});
