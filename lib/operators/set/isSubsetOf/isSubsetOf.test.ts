import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { isSubsetOf } from "./isSubsetOf";

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

describe("isSubsetOf", () => {
  describe("basic behavior", () => {
    test("single-flag left is a subset of multi-flag right that contains it", () => {
      // input: box{"read"}, box{"read","write"}
      // expected: true
      expect(isSubsetOf(registry.of("read"), registry.of("read", "write"))).toBe(true);
    });

    test("multi-flag left is a subset of right that contains all its flags", () => {
      // input: box{"read","write"}, box{"read","write","execute"}
      // expected: true
      expect(
        isSubsetOf(
          registry.of("read", "write"),
          registry.of("read", "write", "execute"),
        ),
      ).toBe(true);
    });

    test("left with a flag absent in right is not a subset", () => {
      // input: box{"read","execute"}, box{"read","write"}
      // expected: false ("execute" is missing from right)
      expect(
        isSubsetOf(registry.of("read", "execute"), registry.of("read", "write")),
      ).toBe(false);
    });

    test("left that is a superset of right is not a subset", () => {
      // input: box{"read","write","execute"}, box{"read","write"}
      // expected: false (left has more flags than right)
      expect(
        isSubsetOf(
          registry.of("read", "write", "execute"),
          registry.of("read", "write"),
        ),
      ).toBe(false);
    });

    test("completely disjoint boxes: left is not a subset of right", () => {
      // input: box{"read"}, box{"write"}
      // expected: false (no shared flags)
      expect(isSubsetOf(registry.of("read"), registry.of("write"))).toBe(false);
    });
  });

  describe("reflexivity (equal boxes)", () => {
    test("box is a subset of itself (same reference)", () => {
      // input: box{"read","write"}, same box
      // expected: true
      const box = registry.of("read", "write");
      expect(isSubsetOf(box, box)).toBe(true);
    });

    test("box is a subset of an equal box (different reference)", () => {
      // input: box{"read","write"}, box{"read","write"} (new instance)
      // expected: true
      expect(
        isSubsetOf(registry.of("read", "write"), registry.of("read", "write")),
      ).toBe(true);
    });

    test("full box is a subset of full box", () => {
      // input: full box, full box
      // expected: true
      expect(isSubsetOf(registry.full(), registry.full())).toBe(true);
    });
  });

  describe("empty box", () => {
    test("empty box is a subset of a non-empty box", () => {
      // input: empty box, box{"read"}
      // expected: true (empty set is subset of any set)
      expect(isSubsetOf(registry.empty(), registry.of("read"))).toBe(true);
    });

    test("empty box is a subset of the full box", () => {
      // input: empty box, full box
      // expected: true
      expect(isSubsetOf(registry.empty(), registry.full())).toBe(true);
    });

    test("empty box is a subset of another empty box", () => {
      // input: empty box, empty box
      // expected: true
      expect(isSubsetOf(registry.empty(), registry.empty())).toBe(true);
    });

    test("non-empty box is not a subset of an empty box", () => {
      // input: box{"read"}, empty box
      // expected: false
      expect(isSubsetOf(registry.of("read"), registry.empty())).toBe(false);
    });

    test("full box is not a subset of an empty box", () => {
      // input: full box, empty box
      // expected: false
      expect(isSubsetOf(registry.full(), registry.empty())).toBe(false);
    });
  });

  describe("full box", () => {
    test("any box is a subset of the full box", () => {
      // input: box{"read","execute"}, full box
      // expected: true
      expect(isSubsetOf(registry.of("read", "execute"), registry.full())).toBe(true);
    });

    test("full box is not a subset of a non-full box", () => {
      // input: full box, box{"read","write","execute"}
      // expected: false ("admin" is missing from right)
      expect(
        isSubsetOf(registry.full(), registry.of("read", "write", "execute")),
      ).toBe(false);
    });
  });

  describe("asymmetry", () => {
    test("a ⊆ b does not imply b ⊆ a when a ≠ b", () => {
      // input: box{"read"} ⊆ box{"read","write"} is true, reverse is false
      // expected: forward true, reverse false
      const a = registry.of("read");
      const b = registry.of("read", "write");

      expect(isSubsetOf(a, b)).toBe(true);
      expect(isSubsetOf(b, a)).toBe(false);
    });
  });

  describe("immutability", () => {
    test("does not mutate the left box", () => {
      // input: box{"read","write"} checked against box{"read","write","execute"}
      // expected: left.bits unchanged after the call
      const left = registry.of("read", "write");
      const originalBits = left.bits;
      isSubsetOf(left, registry.of("read", "write", "execute"));

      expect(left.bits).toBe(originalBits);
    });

    test("does not mutate the right box", () => {
      // input: box{"read","write"} checked against box{"read","write","execute"}
      // expected: right.bits unchanged after the call
      const right = registry.of("read", "write", "execute");
      const originalBits = right.bits;
      isSubsetOf(registry.of("read", "write"), right);

      expect(right.bits).toBe(originalBits);
    });
  });

  describe("BigInt registry", () => {
    test("single-flag BigInt left is a subset of right that contains it", () => {
      // input: BigInt box{"read"}, BigInt box{"read","write"}
      // expected: true
      expect(
        isSubsetOf(bigRegistry.of("read"), bigRegistry.of("read", "write")),
      ).toBe(true);
    });

    test("BigInt left with a flag absent in right is not a subset", () => {
      // input: BigInt box{"read","execute"}, BigInt box{"read","write"}
      // expected: false
      expect(
        isSubsetOf(
          bigRegistry.of("read", "execute"),
          bigRegistry.of("read", "write"),
        ),
      ).toBe(false);
    });

    test("BigInt empty box is a subset of any box", () => {
      // input: BigInt empty box, BigInt box{"read"}
      // expected: true
      expect(isSubsetOf(bigRegistry.empty(), bigRegistry.of("read"))).toBe(true);
    });

    test("BigInt non-empty box is not a subset of empty box", () => {
      // input: BigInt box{"read"}, BigInt empty box
      // expected: false
      expect(isSubsetOf(bigRegistry.of("read"), bigRegistry.empty())).toBe(false);
    });

    test("BigInt box is a subset of itself", () => {
      // input: BigInt box{"read","admin"}, same reference
      // expected: true
      const box = bigRegistry.of("read", "admin");
      expect(isSubsetOf(box, box)).toBe(true);
    });

    test("BigInt any box is a subset of the full box", () => {
      // input: BigInt box{"write","execute"}, BigInt full box
      // expected: true
      expect(
        isSubsetOf(bigRegistry.of("write", "execute"), bigRegistry.full()),
      ).toBe(true);
    });
  });
});
