import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { overlaps } from "./overlaps";

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

describe("overlaps", () => {
  describe("basic behavior", () => {
    test("two boxes with one common flag overlap", () => {
      // input: box{"read","write"}, box{"write","execute"}
      // expected: true — "write" is shared
      expect(overlaps(registry.of("read", "write"), registry.of("write", "execute"))).toBe(true);
    });

    test("two disjoint boxes do not overlap", () => {
      // input: box{"read"}, box{"write"}
      // expected: false — no shared flags
      expect(overlaps(registry.of("read"), registry.of("write"))).toBe(false);
    });

    test("single-flag boxes with the same flag overlap", () => {
      // input: box{"admin"}, box{"admin"}
      // expected: true
      expect(overlaps(registry.of("admin"), registry.of("admin"))).toBe(true);
    });

    test("single-flag boxes with different flags do not overlap", () => {
      // input: box{"read"}, box{"execute"}
      // expected: false
      expect(overlaps(registry.of("read"), registry.of("execute"))).toBe(false);
    });

    test("multi-flag boxes with all flags shared overlap", () => {
      // input: box{"read","write","execute"}, box{"read","write","execute"}
      // expected: true
      expect(
        overlaps(
          registry.of("read", "write", "execute"),
          registry.of("read", "write", "execute"),
        ),
      ).toBe(true);
    });

    test("multi-flag boxes with no flags shared do not overlap", () => {
      // input: box{"read","write"}, box{"execute","admin"}
      // expected: false
      expect(
        overlaps(registry.of("read", "write"), registry.of("execute", "admin")),
      ).toBe(false);
    });
  });

  describe("edge cases: empty box", () => {
    test("empty box does not overlap with any non-empty box", () => {
      // input: empty, box{"read"}
      // expected: false — empty has no bits
      expect(overlaps(registry.empty(), registry.of("read"))).toBe(false);
    });

    test("non-empty box does not overlap with empty box", () => {
      // input: box{"read"}, empty
      // expected: false
      expect(overlaps(registry.of("read"), registry.empty())).toBe(false);
    });

    test("two empty boxes do not overlap", () => {
      // input: empty, empty
      // expected: false
      expect(overlaps(registry.empty(), registry.empty())).toBe(false);
    });

    test("full box does not overlap with empty box", () => {
      // input: full, empty
      // expected: false — AND of anything with 0 is 0
      expect(overlaps(registry.full(), registry.empty())).toBe(false);
    });
  });

  describe("edge cases: full box", () => {
    test("full box overlaps with any non-empty box", () => {
      // input: full, box{"read"}
      // expected: true
      expect(overlaps(registry.full(), registry.of("read"))).toBe(true);
    });

    test("non-empty box overlaps with full box", () => {
      // input: box{"admin"}, full
      // expected: true
      expect(overlaps(registry.of("admin"), registry.full())).toBe(true);
    });

    test("two full boxes overlap", () => {
      // input: full, full
      // expected: true
      expect(overlaps(registry.full(), registry.full())).toBe(true);
    });
  });

  describe("reflexivity", () => {
    test("a non-empty box overlaps with itself", () => {
      // input: box{"read","write"}, same box
      // expected: true
      const box = registry.of("read", "write");
      expect(overlaps(box, box)).toBe(true);
    });

    test("an empty box does not overlap with itself", () => {
      // input: empty, empty (same reference)
      // expected: false — no bits set
      const box = registry.empty();
      expect(overlaps(box, box)).toBe(false);
    });
  });

  describe("commutativity", () => {
    test("overlaps(a, b) equals overlaps(b, a) when they overlap", () => {
      // input: box{"read","write"} and box{"write","execute"} in both orders
      // expected: both return true
      const a = registry.of("read", "write");
      const b = registry.of("write", "execute");
      expect(overlaps(a, b)).toBe(overlaps(b, a));
    });

    test("overlaps(a, b) equals overlaps(b, a) when they do not overlap", () => {
      // input: box{"read"} and box{"write"} in both orders
      // expected: both return false
      const a = registry.of("read");
      const b = registry.of("write");
      expect(overlaps(a, b)).toBe(overlaps(b, a));
    });
  });

  describe("return type", () => {
    test("returns a boolean, not a number or bigint", () => {
      // input: any two boxes
      // expected: typeof result === "boolean"
      expect(typeof overlaps(registry.of("read"), registry.of("read"))).toBe("boolean");
      expect(typeof overlaps(registry.of("read"), registry.of("write"))).toBe("boolean");
    });
  });

  describe("BigInt registry", () => {
    test("BigInt boxes with a common flag overlap", () => {
      // input: BigInt box{"read","write"}, BigInt box{"write","execute"}
      // expected: true
      expect(
        overlaps(bigRegistry.of("read", "write"), bigRegistry.of("write", "execute")),
      ).toBe(true);
    });

    test("BigInt disjoint boxes do not overlap", () => {
      // input: BigInt box{"read"}, BigInt box{"write"}
      // expected: false
      expect(overlaps(bigRegistry.of("read"), bigRegistry.of("write"))).toBe(false);
    });

    test("BigInt empty box does not overlap with non-empty box", () => {
      // input: BigInt empty, BigInt box{"execute"}
      // expected: false
      expect(overlaps(bigRegistry.empty(), bigRegistry.of("execute"))).toBe(false);
    });

    test("BigInt full box overlaps with any non-empty box", () => {
      // input: BigInt full, BigInt box{"admin"}
      // expected: true
      expect(overlaps(bigRegistry.full(), bigRegistry.of("admin"))).toBe(true);
    });

    test("BigInt result is a boolean", () => {
      // input: two BigInt boxes
      // expected: typeof result === "boolean"
      expect(typeof overlaps(bigRegistry.of("read"), bigRegistry.of("read"))).toBe("boolean");
    });
  });
});
