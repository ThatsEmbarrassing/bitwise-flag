import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";
import { UnknownFlagError } from "@/flags/errors";

import type { Bit } from "@/core";
import type { FlagRegistry } from "@/flags/types";

import { resolveMask } from "./resolveMask";

// Defines the full shared test suite for any FlagRegistry<T> implementation.
// Called twice below — once for number, once for bigint — so the body is
// never manually duplicated between the two type flavours.
function defineSharedTests<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol,
>(
  label: string,
  registry: FlagRegistry<TFlags, TBit, TBrand>,
  nameOne: TFlags,   // resolves to bit value `one`
  nameTwo: TFlags,   // resolves to bit value `two`
  nameFour: TFlags,  // resolves to bit value `four`
  zero: TBit,
  one: TBit,
  two: TBit,
  four: TBit,
  three: TBit,  // one | two
  six: TBit,    // two | four
  seven: TBit,  // one | two | four
): void {
  describe(`[${label}]`, () => {
    // ─── 1. Basic OR accumulation ───────────────────────────────────────────

    describe("basic OR accumulation", () => {
      test("empty names array returns combinator.zero", () => {
        // input: []
        // expected: zero
        expect(resolveMask(registry, [])).toBe(zero);
      });

      test("single name returns that flag's bit value unchanged", () => {
        // input: [nameOne]
        // expected: one
        expect(resolveMask(registry, [nameOne])).toBe(one);
      });

      test("two distinct names fold to their combined mask", () => {
        // input: [nameOne, nameTwo]
        // expected: one | two = three
        expect(resolveMask(registry, [nameOne, nameTwo])).toBe(three);
      });

      test("three disjoint names 1|2|4 fold to 7", () => {
        // input: [nameOne, nameTwo, nameFour]
        // expected: 7 (every bit distinct → OR is additive here)
        expect(resolveMask(registry, [nameOne, nameTwo, nameFour])).toBe(seven);
      });

      test("two names sharing no bits: nameTwo|nameFour folds to six", () => {
        // input: [nameTwo, nameFour]
        // expected: two | four = six (0b110)
        expect(resolveMask(registry, [nameTwo, nameFour])).toBe(six);
      });
    });

    // ─── 2. Idempotency / duplicates ────────────────────────────────────────

    describe("idempotency (duplicate flag names)", () => {
      test("[a, a] returns a — OR is idempotent", () => {
        // input: [nameOne, nameOne]
        // expected: one (critical property: OR-fold, not XOR-fold)
        expect(resolveMask(registry, [nameOne, nameOne])).toBe(one);
      });

      test("[a, a, a, a] returns a regardless of repetition count", () => {
        // input: [nameTwo, nameTwo, nameTwo, nameTwo]
        // expected: two
        expect(resolveMask(registry, [nameTwo, nameTwo, nameTwo, nameTwo])).toBe(two);
      });

      test("mix of distinct and duplicate names — duplicates do not inflate the mask", () => {
        // input: [nameOne, nameTwo, nameOne]  — nameOne appears twice
        // expected: one | two = three (not one | two | one = three by coincidence,
        // but the test guards against XOR-style folding that would cancel nameOne)
        expect(resolveMask(registry, [nameOne, nameTwo, nameOne])).toBe(three);
      });
    });

    // ─── 3. Order invariance (commutativity and associativity of OR) ─────

    describe("order invariance (commutativity and associativity)", () => {
      test("[a, b, c] and [c, a, b] yield the same result", () => {
        // input: [nameOne, nameTwo, nameFour] and its rotation [nameFour, nameOne, nameTwo]
        // expected: both equal seven
        expect(resolveMask(registry, [nameOne, nameTwo, nameFour])).toBe(
          resolveMask(registry, [nameFour, nameOne, nameTwo]),
        );
      });

      test("[a, b, c] and [b, c, a] yield the same result", () => {
        // input: [nameOne, nameTwo, nameFour] and [nameTwo, nameFour, nameOne]
        // expected: both equal seven
        expect(resolveMask(registry, [nameOne, nameTwo, nameFour])).toBe(
          resolveMask(registry, [nameTwo, nameFour, nameOne]),
        );
      });

      test("[a, b, c] and [c, b, a] (reversal) yield the same result", () => {
        // input: [nameOne, nameTwo, nameFour] and [nameFour, nameTwo, nameOne]
        // expected: both equal seven
        expect(resolveMask(registry, [nameOne, nameTwo, nameFour])).toBe(
          resolveMask(registry, [nameFour, nameTwo, nameOne]),
        );
      });
    });

    // ─── 4. Error behavior — unknown flag names ──────────────────────────────

    describe("unknown flag names", () => {
      test("single unknown name throws UnknownFlagError", () => {
        // input: ["UNKNOWN"]
        // expected: throws UnknownFlagError with the offending flag name
        expect(() => resolveMask(registry, ["UNKNOWN" as TFlags])).toThrow(
          UnknownFlagError,
        );
      });

      test("unknown name among known names still throws UnknownFlagError", () => {
        // input: [nameOne, "GHOST", nameTwo]
        // expected: throws as soon as the unknown name is resolved
        expect(() =>
          resolveMask(registry, [nameOne, "GHOST" as TFlags, nameTwo]),
        ).toThrow(UnknownFlagError);
      });

      test("thrown UnknownFlagError carries the offending flag name", () => {
        // input: ["MISSING"]
        // expected: error.flag === "MISSING"
        let caught: unknown;
        try {
          resolveMask(registry, ["MISSING" as TFlags]);
        } catch (e) {
          caught = e;
        }
        expect(caught).toBeInstanceOf(UnknownFlagError);
        expect((caught as UnknownFlagError).flag).toBe("MISSING");
      });
    });

    // ─── 5. Purity and immutability ─────────────────────────────────────────

    describe("purity and immutability", () => {
      test("does not mutate the input names array", () => {
        // input: snapshot of [nameOne, nameTwo, nameFour] before call
        // expected: array elements unchanged after resolveMask returns
        const names = [nameOne, nameTwo, nameFour] as TFlags[];
        const snapshot = [...names];
        resolveMask(registry, names);
        expect(names).toEqual(snapshot);
      });

      test("repeated calls with the same names array return the same result", () => {
        // input: [nameOne, nameTwo, nameFour] called twice
        // expected: no hidden mutation or memoization side-effects
        const names = [nameOne, nameTwo, nameFour] as readonly TFlags[];
        expect(resolveMask(registry, names)).toBe(resolveMask(registry, names));
      });
    });
  });
}

describe("resolveMask", () => {
  // ─── Shared tests run for both registry types ─────────────────────────────
  // READ=1, WRITE=2, EXECUTE=4

  defineSharedTests(
    "number",
    NumberFlagRegistry.from("READ", "WRITE", "EXECUTE"),
    /* nameOne   (READ)    */ "READ",
    /* nameTwo   (WRITE)   */ "WRITE",
    /* nameFour  (EXECUTE) */ "EXECUTE",
    /* zero  */ 0,
    /* one   */ 1,
    /* two   */ 2,
    /* four  */ 4,
    /* three (READ | WRITE)          */ 3,
    /* six   (WRITE | EXECUTE)       */ 6,
    /* seven (READ | WRITE | EXECUTE)*/ 7,
  );

  defineSharedTests(
    "bigint",
    BigIntFlagRegistry.from("READ", "WRITE", "EXECUTE"),
    /* nameOne   (READ)    */ "READ",
    /* nameTwo   (WRITE)   */ "WRITE",
    /* nameFour  (EXECUTE) */ "EXECUTE",
    /* zero  */ 0n,
    /* one   */ 1n,
    /* two   */ 2n,
    /* four  */ 4n,
    /* three (READ | WRITE)          */ 3n,
    /* six   (WRITE | EXECUTE)       */ 6n,
    /* seven (READ | WRITE | EXECUTE)*/ 7n,
  );

  // ─── 6. NumberRegistry — boundary values ────────────────────────────────

  describe("[number] boundary values", () => {
    test("MAX_SAFE_FLAG (2^30) participates in OR correctly", () => {
      // input: ["HIGH", "LOW"]  — HIGH=2^30, LOW=1
      // expected: 0x40000000 | 1 — the high bit is preserved without sign coercion
      const registry = NumberFlagRegistry.define({
        HIGH: 0x40000000,
        LOW: 1,
      });
      expect(resolveMask(registry, ["HIGH", "LOW"])).toBe(0x40000000 | 1);
    });

    test("all 30 safe flag bits fold to 0x3FFFFFFF", () => {
      // input: all 30 flags from F0 (2^0) through F29 (2^29)
      // expected: (2^30) − 1 = 0x3FFFFFFF
      const flagDefs = Object.fromEntries(
        Array.from({ length: 30 }, (_, i) => [`F${i}`, 1 << i]),
      ) as Record<string, number>;
      const registry = NumberFlagRegistry.define(flagDefs);
      const allNames = Object.keys(flagDefs);
      expect(resolveMask(registry, allNames)).toBe((1 << 30) - 1);
    });
  });

  // ─── 7. BigIntRegistry — boundary values ────────────────────────────────

  describe("[bigint] boundary values", () => {
    test("bit beyond 32-bit boundary (1n << 100n) participates without truncation", () => {
      // input: ["HUGE", "TINY"]  — HUGE=1n<<100n, TINY=1n
      // expected: (1n << 100n) | 1n — no 32-bit wrapping
      const registry = BigIntFlagRegistry.define({
        HUGE: 1n << 100n,
        TINY: 1n,
      });
      expect(resolveMask(registry, ["HUGE", "TINY"])).toBe((1n << 100n) | 1n);
    });

    test("mix of small and very large flags in one call is exact", () => {
      // input: ["TINY", "HUGE", "MID"]  — TINY=1n, HUGE=1n<<200n, MID=4n
      // expected: 1n | (1n << 200n) | 4n — exact bigint arithmetic, no overflow
      const registry = BigIntFlagRegistry.define({
        TINY: 1n,
        MID: 4n,
        HUGE: 1n << 200n,
      });
      expect(resolveMask(registry, ["TINY", "HUGE", "MID"])).toBe(
        1n | (1n << 200n) | 4n,
      );
    });

    test("1n << 200n is preserved exactly with no precision loss", () => {
      // input: ["HUGE"]  — impossible to represent exactly in number
      // expected: 1n << 200n
      const registry = BigIntFlagRegistry.define({ HUGE: 1n << 200n });
      expect(resolveMask(registry, ["HUGE"])).toBe(1n << 200n);
    });
  });
});
