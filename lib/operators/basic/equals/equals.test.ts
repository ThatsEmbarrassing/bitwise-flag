import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { add } from "@/operators/basic";

import { equals } from "./equals";

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

describe("equals", () => {
  describe("basic behavior", () => {
    test("two boxes with the same single flag are equal", () => {
      // input: of("read") vs of("read")
      // expected: true
      expect(equals(registry.of("read"), registry.of("read"))).toBe(true);
    });

    test("two boxes with different flags are not equal", () => {
      // input: of("read") vs of("write")
      // expected: false
      expect(equals(registry.of("read"), registry.of("write"))).toBe(false);
    });

    test("two boxes with the same multiple flags are equal", () => {
      // input: of("read", "write") vs of("read", "write")
      // expected: true
      expect(
        equals(registry.of("read", "write"), registry.of("read", "write")),
      ).toBe(true);
    });

    test("two boxes with overlapping but different flag sets are not equal", () => {
      // input: of("read", "write") vs of("read", "execute")
      // expected: false
      expect(
        equals(registry.of("read", "write"), registry.of("read", "execute")),
      ).toBe(false);
    });

    test("two empty boxes are equal", () => {
      // input: empty() vs empty()
      // expected: true
      expect(equals(registry.empty(), registry.empty())).toBe(true);
    });

    test("two full boxes are equal", () => {
      // input: full() vs full()
      // expected: true
      expect(equals(registry.full(), registry.full())).toBe(true);
    });

    test("empty box and non-empty box are not equal", () => {
      // input: empty() vs of("read")
      // expected: false
      expect(equals(registry.empty(), registry.of("read"))).toBe(false);
    });

    test("full box and partial box are not equal", () => {
      // input: full() vs of("read", "write")
      // expected: false
      expect(equals(registry.full(), registry.of("read", "write"))).toBe(false);
    });
  });

  describe("reflexivity and symmetry", () => {
    test("a box is equal to itself", () => {
      // input: same box reference on both sides
      // expected: true
      const box = registry.of("read", "execute");
      expect(equals(box, box)).toBe(true);
    });

    test("equals is symmetric: equals(a, b) === equals(b, a) when true", () => {
      // input: of("admin") vs of("admin"), both orders
      // expected: true in both directions
      const a = registry.of("admin");
      const b = registry.of("admin");
      expect(equals(a, b)).toBe(true);
      expect(equals(b, a)).toBe(true);
    });

    test("equals is symmetric: equals(a, b) === equals(b, a) when false", () => {
      // input: of("read") vs of("write"), both orders
      // expected: false in both directions
      const a = registry.of("read");
      const b = registry.of("write");
      expect(equals(a, b)).toBe(false);
      expect(equals(b, a)).toBe(false);
    });
  });

  describe("structural equality (same bits, different origins)", () => {
    test("boxes built via different operations with same result are equal", () => {
      // input: of("read", "write") vs add(of("read"), "write")
      // expected: true — equality is based on bits, not history
      const a = registry.of("read", "write");
      const b = add(registry.of("read"), "write");
      expect(equals(a, b)).toBe(true);
    });

    test("boxes from two separate registry instances with same bits are not equal", () => {
      // input: of("execute") from registry1 vs of("execute") from registry2
      // expected: true — only bits are compared
      const registry2 = NumberFlagRegistry.from<Perms>(
        "read",
        "write",
        "execute",
        "admin",
      );
      expect(equals(registry.of("execute"), registry2.of("execute"))).not.toBe(
        true,
      );
    });
  });

  describe("BigInt registry", () => {
    test("two equal BigInt boxes are equal", () => {
      // input: BigInt of("read", "admin") vs of("read", "admin")
      // expected: true
      expect(
        equals(
          bigRegistry.of("read", "admin"),
          bigRegistry.of("read", "admin"),
        ),
      ).toBe(true);
    });

    test("two different BigInt boxes are not equal", () => {
      // input: BigInt of("read") vs of("write")
      // expected: false
      expect(equals(bigRegistry.of("read"), bigRegistry.of("write"))).toBe(
        false,
      );
    });

    test("two empty BigInt boxes are equal", () => {
      // input: BigInt empty() vs empty()
      // expected: true
      expect(equals(bigRegistry.empty(), bigRegistry.empty())).toBe(true);
    });

    test("two full BigInt boxes are equal", () => {
      // input: BigInt full() vs full()
      // expected: true
      expect(equals(bigRegistry.full(), bigRegistry.full())).toBe(true);
    });

    test("BigInt empty and non-empty are not equal", () => {
      // input: BigInt empty() vs of("execute")
      // expected: false
      expect(equals(bigRegistry.empty(), bigRegistry.of("execute"))).toBe(
        false,
      );
    });
  });
});
