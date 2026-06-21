import { describe, expect, test } from "bun:test";

import { BigIntCombinator, NumberCombinator } from "@/core";
import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import type { Bit, Combinator } from "@/core";

import { computeMask } from "./computeMask";

const NUMBER_COMBINATOR = new NumberCombinator();
const BIGINT_COMBINATOR = new BigIntCombinator();

// Defines the full shared test suite for any Combinator<T> implementation.
// Called twice below — once for number, once for bigint — so the body is
// never manually duplicated between the two type flavours.
function defineSharedTests<T extends Bit>(
  label: string,
  c: Combinator<T>,
  zero: T,
  one: T,
  two: T,
  four: T,
  three: T,
  six: T,
  seven: T,
): void {
  describe(`[${label}]`, () => {
    // ─── 1. Basic OR accumulation ───────────────────────────────────────────

    describe("basic OR accumulation", () => {
      test("empty array returns combinator.zero", () => {
        // input: []
        // expected: zero
        expect(computeMask(c, [])).toBe(zero);
      });

      test("single element returns that element unchanged", () => {
        // input: [one]
        // expected: one
        expect(computeMask(c, [one])).toBe(one);
      });

      test("single zero element returns zero", () => {
        // input: [zero]
        // expected: zero
        expect(computeMask(c, [zero])).toBe(zero);
      });

      test("three disjoint bits 1|2|4 fold to 7", () => {
        // input: [1, 2, 4]
        // expected: 7 (every bit distinct → OR is additive here)
        expect(computeMask(c, [one, two, four])).toBe(seven);
      });

      test("overlapping bits 0b011|0b110 fold to 0b111, not 9", () => {
        // input: [0b011, 0b110]  — the shared bit 0b010 must not be double-counted
        // expected: 0b111 (7), not arithmetic sum 9
        expect(computeMask(c, [three, six])).toBe(seven);
      });
    });

    // ─── 2. Idempotency / duplicates ────────────────────────────────────────

    describe("idempotency (duplicate inputs)", () => {
      test("[a, a] returns a — OR is idempotent", () => {
        // input: [0b011, 0b011]
        // expected: 0b011 (critical property: OR-fold, not XOR-fold)
        expect(computeMask(c, [three, three])).toBe(three);
      });

      test("[a, a, a, a] returns a regardless of repetition count", () => {
        // input: [six, six, six, six]
        // expected: six
        expect(computeMask(c, [six, six, six, six])).toBe(six);
      });
    });

    // ─── 3. Interaction with zero ────────────────────────────────────────────

    describe("interaction with zero", () => {
      test("zero at the start does not affect result", () => {
        // input: [zero, one, two] vs [one, two]
        // expected: same result as without the leading zero
        expect(computeMask(c, [zero, one, two])).toBe(computeMask(c, [one, two]));
      });

      test("zero in the middle does not affect result", () => {
        // input: [one, zero, two] vs [one, two]
        // expected: identical to the two-element case
        expect(computeMask(c, [one, zero, two])).toBe(computeMask(c, [one, two]));
      });

      test("zero at the end does not affect result", () => {
        // input: [one, two, zero] vs [one, two]
        // expected: identical to the two-element case
        expect(computeMask(c, [one, two, zero])).toBe(computeMask(c, [one, two]));
      });

      test("array of multiple zeros returns zero", () => {
        // input: [zero, zero, zero]
        // expected: zero
        expect(computeMask(c, [zero, zero, zero])).toBe(zero);
      });
    });

    // ─── 4. Order does not matter (commutativity / associativity of OR) ─────

    describe("order invariance (commutativity and associativity)", () => {
      test("[a, b, c] and [c, a, b] yield the same result", () => {
        // input: [one, two, four] and its rotation [four, one, two]
        // expected: both equal seven
        expect(computeMask(c, [one, two, four])).toBe(computeMask(c, [four, one, two]));
      });

      test("[a, b, c] and [b, c, a] yield the same result", () => {
        // input: [three, six, four] and its rotation [six, four, three]
        // expected: both equal the same OR-fold
        expect(computeMask(c, [three, six, four])).toBe(
          computeMask(c, [six, four, three]),
        );
      });

      test("[a, b, c] and [c, b, a] (reversal) yield the same result", () => {
        // input: [one, two, four] and [four, two, one]
        // expected: both equal seven
        expect(computeMask(c, [one, two, four])).toBe(computeMask(c, [four, two, one]));
      });
    });

    // ─── 7. Purity and immutability ─────────────────────────────────────────

    describe("purity and immutability", () => {
      test("does not mutate the input array", () => {
        // input: snapshot of [one, two, four] before call
        // expected: array elements unchanged after computeMask returns
        const bits = [one, two, four] as T[];
        const snapshot = [...bits];
        computeMask(c, bits);
        expect(bits).toEqual(snapshot);
      });

      test("repeated calls with the same array return the same result", () => {
        // input: [one, two, four] called twice
        // expected: no hidden mutation or memoization side-effects
        const bits = [one, two, four] as readonly T[];
        expect(computeMask(c, bits)).toBe(computeMask(c, bits));
      });
    });
  });
}

describe("computeMask", () => {
  // ─── Shared tests run for both combinators ───────────────────────────────

  defineSharedTests(
    "number",
    NUMBER_COMBINATOR,
    /* zero */ 0,
    /* one  */ 1,
    /* two  */ 2,
    /* four */ 4,
    /* three (0b011) */ 3,
    /* six   (0b110) */ 6,
    /* seven (0b111) */ 7,
  );

  defineSharedTests(
    "bigint",
    BIGINT_COMBINATOR,
    /* zero */ 0n,
    /* one  */ 1n,
    /* two  */ 2n,
    /* four */ 4n,
    /* three (0b011n) */ 3n,
    /* six   (0b110n) */ 6n,
    /* seven (0b111n) */ 7n,
  );

  // ─── 5. NumberCombinator — boundary values ───────────────────────────────

  describe("[number] boundary values", () => {
    const c = NUMBER_COMBINATOR;

    test("MAX_SAFE_FLAG (2^30 = 0x40000000) participates in OR correctly", () => {
      // input: [0x40000000, 1]
      // expected: 0x40000001 — the high bit is preserved without sign coercion
      expect(computeMask(c, [0x40000000, 1])).toBe(0x40000000 | 1);
    });

    test("all bits from 2^0 through 2^29 fold to 0x3FFFFFFF", () => {
      // input: [1, 2, 4, ..., 2^29]  — 30 disjoint flags
      // expected: (2^30) − 1 = 0x3FFFFFFF (full coverage of the safe flag range)
      const allBits = Array.from({ length: 30 }, (_, i) => 1 << i);
      expect(computeMask(c, allBits)).toBe((1 << 30) - 1);
    });
  });

  // ─── 6. BigIntCombinator — boundary values ──────────────────────────────

  describe("[bigint] boundary values", () => {
    const c = BIGINT_COMBINATOR;

    test("bit beyond 32-bit boundary (1n << 100n) participates without truncation", () => {
      // input: [1n << 100n, 1n]
      // expected: (1n << 100n) | 1n  — no 32-bit wrapping
      expect(computeMask(c, [1n << 100n, 1n])).toBe((1n << 100n) | 1n);
    });

    test("mix of small (1n) and very large (1n << 200n) values in one call", () => {
      // input: [1n, 1n << 200n, 4n]
      // expected: 1n | (1n << 200n) | 4n  — exact bigint arithmetic, no overflow
      expect(computeMask(c, [1n, 1n << 200n, 4n])).toBe(1n | (1n << 200n) | 4n);
    });

    test("1n << 200n is preserved exactly with no precision loss", () => {
      // input: [1n << 200n]
      // expected: 1n << 200n  — impossible to represent exactly in number
      expect(computeMask(c, [1n << 200n])).toBe(1n << 200n);
    });
  });
});
