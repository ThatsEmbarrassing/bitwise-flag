import { describe, expect, test } from "bun:test";

import { NumberCombinator } from "./NumberCombinator";

const c = new NumberCombinator();

describe("NumberCombinator", () => {
  describe("zero", () => {
    test("is 0", () => {
      // expected: zero === 0
      expect(c.zero).toBe(0);
    });

    test("is typeof number", () => {
      // expected: numeric primitive, not bigint or string
      expect(typeof c.zero).toBe("number");
    });
  });

  describe("popcount", () => {
    test("returns 0 for 0", () => {
      // input: 0 -> expected: 0 bits set
      expect(c.popcount(0)).toBe(0);
    });

    test("returns 1 for a power of two", () => {
      // input: 8 (0b1000) -> expected: 1 bit set
      expect(c.popcount(8)).toBe(1);
    });

    test("counts each set bit independently", () => {
      // input: 7 (0b111) -> expected: 3 bits set
      expect(c.popcount(7)).toBe(3);
    });

    test("counts all 32 bits for 0xFFFFFFFF", () => {
      // input: all lower 32 bits set -> expected: 32
      expect(c.popcount(0xffffffff)).toBe(32);
    });

    test("treats -1 as 32 set bits (unsigned reinterpretation via >>> 0)", () => {
      // input: -1 in JS is 0xFFFFFFFF unsigned -> expected: 32
      expect(c.popcount(-1)).toBe(32);
    });

    test("handles single low bit", () => {
      // input: 1 (0b1) -> expected: 1
      expect(c.popcount(1)).toBe(1);
    });

    test("handles alternating bits 0xAAAAAAAA", () => {
      // input: 0b10101010... (16 set bits) -> expected: 16
      expect(c.popcount(0xaaaaaaaa)).toBe(16);
    });
  });

  describe("or", () => {
    test("0 | 0 === 0", () => {
      expect(c.or(0, 0)).toBe(0);
    });

    test("identity: x | 0 === x", () => {
      // input: 42 | 0 -> expected: 42
      expect(c.or(42, 0)).toBe(42);
    });

    test("idempotent: x | x === x", () => {
      // input: 13 | 13 -> expected: 13
      expect(c.or(13, 13)).toBe(13);
    });

    test("combines disjoint bits", () => {
      // input: 0b0101 | 0b1010 -> expected: 0b1111 = 15
      expect(c.or(0b0101, 0b1010)).toBe(0b1111);
    });

    test("overlapping bits produce union", () => {
      // input: 0b0110 | 0b0011 -> expected: 0b0111 = 7
      expect(c.or(0b0110, 0b0011)).toBe(0b0111);
    });
  });

  describe("and", () => {
    test("0 & 0 === 0", () => {
      expect(c.and(0, 0)).toBe(0);
    });

    test("annihilator: x & 0 === 0", () => {
      // input: 255 & 0 -> expected: 0
      expect(c.and(255, 0)).toBe(0);
    });

    test("idempotent: x & x === x", () => {
      // input: 13 & 13 -> expected: 13
      expect(c.and(13, 13)).toBe(13);
    });

    test("keeps only shared bits", () => {
      // input: 0b1110 & 0b0111 -> expected: 0b0110 = 6
      expect(c.and(0b1110, 0b0111)).toBe(0b0110);
    });

    test("disjoint bits produce 0", () => {
      // input: 0b1010 & 0b0101 -> expected: 0
      expect(c.and(0b1010, 0b0101)).toBe(0);
    });
  });

  describe("andNot", () => {
    test("0 & ~0 === 0", () => {
      expect(c.andNot(0, 0)).toBe(0);
    });

    test("identity: x & ~0 === x", () => {
      // input: 42 & ~0 -> ~0 is all bits set -> expected: 42
      expect(c.andNot(42, 0)).toBe(42);
    });

    test("self-clear: x & ~x === 0", () => {
      // input: 13 & ~13 -> expected: 0
      expect(c.andNot(13, 13)).toBe(0);
    });

    test("clears only the bits set in b", () => {
      // input: 0b1110 & ~0b0110 -> expected: 0b1000 = 8
      expect(c.andNot(0b1110, 0b0110)).toBe(0b1000);
    });

    test("leaves a untouched when operands are disjoint", () => {
      // input: 0b1010 & ~0b0101 -> expected: 0b1010 = 10
      expect(c.andNot(0b1010, 0b0101)).toBe(0b1010);
    });

    test("equivalent to and(a, not(b))", () => {
      // input: 0b1101 -> expected: same result as the explicit composition
      expect(c.andNot(0b1101, 0b1011)).toBe(c.and(0b1101, c.not(0b1011)));
    });
  });

  describe("xor", () => {
    test("0 ^ 0 === 0", () => {
      expect(c.xor(0, 0)).toBe(0);
    });

    test("identity: x ^ 0 === x", () => {
      // input: 42 ^ 0 -> expected: 42
      expect(c.xor(42, 0)).toBe(42);
    });

    test("self-inverse: x ^ x === 0", () => {
      // input: 255 ^ 255 -> expected: 0
      expect(c.xor(255, 255)).toBe(0);
    });

    test("flips only differing bits", () => {
      // input: 0b0110 ^ 0b0011 -> expected: 0b0101 = 5
      expect(c.xor(0b0110, 0b0011)).toBe(0b0101);
    });

    test("commutative: a ^ b === b ^ a", () => {
      // input: 0b1100 ^ 0b0011, both directions
      expect(c.xor(0b1100, 0b0011)).toBe(c.xor(0b0011, 0b1100));
    });
  });

  describe("not", () => {
    test("~0 === -1 (all bits set in two's complement)", () => {
      // input: 0 -> expected: -1
      expect(c.not(0)).toBe(-1);
    });

    test("~(-1) === 0", () => {
      // input: -1 -> expected: 0
      expect(c.not(-1)).toBe(0);
    });

    test("~1 === -2", () => {
      // input: 1 -> expected: -2
      expect(c.not(1)).toBe(-2);
    });

    test("double negation: ~~x === x", () => {
      // input: 42 -> expected: 42 after two NOT operations
      expect(c.not(c.not(42))).toBe(42);
    });

    test("flips all bits of an arbitrary value", () => {
      // input: 0b00001111 (15) -> expected: ...11110000 = -16
      expect(c.not(0b00001111)).toBe(-16);
    });
  });

  describe("shiftL", () => {
    test("shift by 0 is identity", () => {
      // input: 5 << 0 -> expected: 5
      expect(c.shiftL(5, 0)).toBe(5);
    });

    test("shift 0 by any amount stays 0", () => {
      // input: 0 << 10 -> expected: 0
      expect(c.shiftL(0, 10)).toBe(0);
    });

    test("shift 1 left by n equals 2^n", () => {
      // input: 1 << 4 -> expected: 16
      expect(c.shiftL(1, 4)).toBe(16);
    });

    test("shift by 1 doubles the value", () => {
      // input: 3 << 1 -> expected: 6
      expect(c.shiftL(3, 1)).toBe(6);
    });

    test("shift to position 31 sets the sign bit", () => {
      // input: 1 << 31 -> expected: -2147483648 (JS 32-bit signed result)
      expect(c.shiftL(1, 31)).toBe(-2147483648);
    });

    test("shift by 31 positions a flag at the highest 32-bit slot", () => {
      // input: 1 << 31 -> popcount of unsigned form is still 1
      const shifted = c.shiftL(1, 31);
      expect(c.popcount(shifted)).toBe(1);
    });
  });
});
