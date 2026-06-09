import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { isSupersetOf } from "./isSupersetOf";

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

describe("isSupersetOf", () => {
  describe("basic behavior", () => {
    test("multi-flag left that contains single-flag right is a superset", () => {
      // input: box{"read","write"}, box{"read"}
      // expected: true
      expect(isSupersetOf(registry.of("read", "write"), registry.of("read"))).toBe(true);
    });

    test("left that contains all flags of right is a superset", () => {
      // input: box{"read","write","execute"}, box{"read","write"}
      // expected: true
      expect(
        isSupersetOf(
          registry.of("read", "write", "execute"),
          registry.of("read", "write"),
        ),
      ).toBe(true);
    });

    test("left missing a flag that right has is not a superset", () => {
      // input: box{"read","write"}, box{"read","execute"}
      // expected: false ("execute" is missing from left)
      expect(
        isSupersetOf(registry.of("read", "write"), registry.of("read", "execute")),
      ).toBe(false);
    });

    test("left that is a strict subset of right is not a superset", () => {
      // input: box{"read","write"}, box{"read","write","execute"}
      // expected: false (left has fewer flags than right)
      expect(
        isSupersetOf(
          registry.of("read", "write"),
          registry.of("read", "write", "execute"),
        ),
      ).toBe(false);
    });

    test("completely disjoint boxes: left is not a superset of right", () => {
      // input: box{"read"}, box{"write"}
      // expected: false (no shared flags)
      expect(isSupersetOf(registry.of("read"), registry.of("write"))).toBe(false);
    });
  });

  describe("reflexivity (equal boxes)", () => {
    test("box is a superset of itself (same reference)", () => {
      // input: box{"read","write"}, same box
      // expected: true
      const box = registry.of("read", "write");
      expect(isSupersetOf(box, box)).toBe(true);
    });

    test("box is a superset of an equal box (different reference)", () => {
      // input: box{"read","write"}, box{"read","write"} (new instance)
      // expected: true
      expect(
        isSupersetOf(registry.of("read", "write"), registry.of("read", "write")),
      ).toBe(true);
    });

    test("full box is a superset of full box", () => {
      // input: full box, full box
      // expected: true
      expect(isSupersetOf(registry.full(), registry.full())).toBe(true);
    });
  });

  describe("empty box", () => {
    test("empty left is not a superset of a non-empty right", () => {
      // input: empty box, box{"read"}
      // expected: false (empty set cannot contain any flag)
      expect(isSupersetOf(registry.empty(), registry.of("read"))).toBe(false);
    });

    test("empty left is not a superset of the full box", () => {
      // input: empty box, full box
      // expected: false
      expect(isSupersetOf(registry.empty(), registry.full())).toBe(false);
    });

    test("empty box is a superset of another empty box", () => {
      // input: empty box, empty box
      // expected: true (every set is a superset of the empty set)
      expect(isSupersetOf(registry.empty(), registry.empty())).toBe(true);
    });

    test("non-empty left is a superset of an empty right", () => {
      // input: box{"read"}, empty box
      // expected: true
      expect(isSupersetOf(registry.of("read"), registry.empty())).toBe(true);
    });

    test("full box is a superset of an empty box", () => {
      // input: full box, empty box
      // expected: true
      expect(isSupersetOf(registry.full(), registry.empty())).toBe(true);
    });
  });

  describe("full box", () => {
    test("full box is a superset of any box", () => {
      // input: full box, box{"read","execute"}
      // expected: true
      expect(isSupersetOf(registry.full(), registry.of("read", "execute"))).toBe(true);
    });

    test("non-full left is not a superset of the full box", () => {
      // input: box{"read","write","execute"}, full box
      // expected: false ("admin" is missing from left)
      expect(
        isSupersetOf(registry.of("read", "write", "execute"), registry.full()),
      ).toBe(false);
    });
  });

  describe("asymmetry", () => {
    test("a ⊇ b does not imply b ⊇ a when a ≠ b", () => {
      // input: box{"read","write"} ⊇ box{"read"} is true, reverse is false
      // expected: forward true, reverse false
      const a = registry.of("read", "write");
      const b = registry.of("read");

      expect(isSupersetOf(a, b)).toBe(true);
      expect(isSupersetOf(b, a)).toBe(false);
    });
  });

  describe("immutability", () => {
    test("does not mutate the left box", () => {
      // input: box{"read","write","execute"} checked against box{"read","write"}
      // expected: left.bits unchanged after the call
      const left = registry.of("read", "write", "execute");
      const originalBits = left.bits;
      isSupersetOf(left, registry.of("read", "write"));

      expect(left.bits).toBe(originalBits);
    });

    test("does not mutate the right box", () => {
      // input: box{"read","write","execute"} checked against box{"read","write"}
      // expected: right.bits unchanged after the call
      const right = registry.of("read", "write");
      const originalBits = right.bits;
      isSupersetOf(registry.of("read", "write", "execute"), right);

      expect(right.bits).toBe(originalBits);
    });
  });

  describe("BigInt registry", () => {
    test("BigInt multi-flag left that contains single-flag right is a superset", () => {
      // input: BigInt box{"read","write"}, BigInt box{"read"}
      // expected: true
      expect(
        isSupersetOf(bigRegistry.of("read", "write"), bigRegistry.of("read")),
      ).toBe(true);
    });

    test("BigInt left missing a flag that right has is not a superset", () => {
      // input: BigInt box{"read","write"}, BigInt box{"read","execute"}
      // expected: false
      expect(
        isSupersetOf(
          bigRegistry.of("read", "write"),
          bigRegistry.of("read", "execute"),
        ),
      ).toBe(false);
    });

    test("BigInt non-empty left is a superset of empty right", () => {
      // input: BigInt box{"read"}, BigInt empty box
      // expected: true
      expect(isSupersetOf(bigRegistry.of("read"), bigRegistry.empty())).toBe(true);
    });

    test("BigInt empty left is not a superset of non-empty right", () => {
      // input: BigInt empty box, BigInt box{"read"}
      // expected: false
      expect(isSupersetOf(bigRegistry.empty(), bigRegistry.of("read"))).toBe(false);
    });

    test("BigInt box is a superset of itself", () => {
      // input: BigInt box{"read","admin"}, same reference
      // expected: true
      const box = bigRegistry.of("read", "admin");
      expect(isSupersetOf(box, box)).toBe(true);
    });

    test("BigInt full box is a superset of any box", () => {
      // input: BigInt full box, BigInt box{"write","execute"}
      // expected: true
      expect(
        isSupersetOf(bigRegistry.full(), bigRegistry.of("write", "execute")),
      ).toBe(true);
    });
  });
});
