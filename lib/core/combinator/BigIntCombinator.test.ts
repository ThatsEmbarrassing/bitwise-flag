import { describe, expect, test } from "bun:test";

import { BigIntCombinator } from "./BigIntCombinator";

const c = new BigIntCombinator();

describe("BigIntCombinator", () => {
  describe("zero", () => {
    test("is 0n", () => {
      // expected: zero === 0n
      expect(c.zero).toBe(0n);
    });

    test("is typeof bigint", () => {
      // expected: bigint primitive, not number or string
      expect(typeof c.zero).toBe("bigint");
    });
  });

  describe("popcount", () => {
    test("returns 0 for 0n", () => {
      // input: 0n -> expected: 0 bits set
      expect(c.popcount(0n)).toBe(0);
    });

    test("returns 1 for a power of two", () => {
      // input: 8n (0b1000) -> expected: 1 bit set
      expect(c.popcount(8n)).toBe(1);
    });

    test("counts each set bit independently", () => {
      // input: 7n (0b111) -> expected: 3 bits set
      expect(c.popcount(7n)).toBe(3);
    });

    test("counts all 32 lower bits for 0xFFFFFFFFn", () => {
      // input: 32 consecutive set bits -> expected: 32
      expect(c.popcount(0xffffffffn)).toBe(32);
    });

    test("handles single low bit", () => {
      // input: 1n -> expected: 1
      expect(c.popcount(1n)).toBe(1);
    });

    test("handles alternating bits 0xAAAAAAAAn", () => {
      // input: 0b10101010... (16 set bits in 32-bit pattern) -> expected: 16
      expect(c.popcount(0xaaaaaaaan)).toBe(16);
    });

    test("counts a bit beyond 32-bit range", () => {
      // input: 1n << 40n (bit 40 set) -> expected: 1
      expect(c.popcount(1n << 40n)).toBe(1);
    });

    test("counts a bit beyond 64-bit range", () => {
      // input: 1n << 100n (bit 100 set) -> expected: 1
      expect(c.popcount(1n << 100n)).toBe(1);
    });

    test("counts many bits in a large value", () => {
      // input: (1n << 128n) - 1n = 128 bits all set -> expected: 128
      expect(c.popcount((1n << 128n) - 1n)).toBe(128);
    });

    test("throws RangeError for negative input", () => {
      // input: -1n -> popcount would loop forever; guard throws instead
      expect(() => c.popcount(-1n)).toThrow(RangeError);
    });

    test("RangeError message includes the bad value", () => {
      // expected: message contains the actual argument so the caller can diagnose it
      expect(() => c.popcount(-5n)).toThrow("popcount requires a non-negative bigint, got -5");
    });
  });

  describe("or", () => {
    test("0n | 0n === 0n", () => {
      expect(c.or(0n, 0n)).toBe(0n);
    });

    test("identity: x | 0n === x", () => {
      // input: 42n | 0n -> expected: 42n
      expect(c.or(42n, 0n)).toBe(42n);
    });

    test("idempotent: x | x === x", () => {
      // input: 13n | 13n -> expected: 13n
      expect(c.or(13n, 13n)).toBe(13n);
    });

    test("combines disjoint bits", () => {
      // input: 0b0101n | 0b1010n -> expected: 0b1111n = 15n
      expect(c.or(0b0101n, 0b1010n)).toBe(0b1111n);
    });

    test("overlapping bits produce union", () => {
      // input: 0b0110n | 0b0011n -> expected: 0b0111n = 7n
      expect(c.or(0b0110n, 0b0011n)).toBe(0b0111n);
    });

    test("works with values beyond 64-bit range", () => {
      // input: two non-overlapping high bits -> expected: both set
      expect(c.or(1n << 80n, 1n << 90n)).toBe((1n << 80n) | (1n << 90n));
    });
  });

  describe("and", () => {
    test("0n & 0n === 0n", () => {
      expect(c.and(0n, 0n)).toBe(0n);
    });

    test("annihilator: x & 0n === 0n", () => {
      // input: 255n & 0n -> expected: 0n
      expect(c.and(255n, 0n)).toBe(0n);
    });

    test("idempotent: x & x === x", () => {
      // input: 13n & 13n -> expected: 13n
      expect(c.and(13n, 13n)).toBe(13n);
    });

    test("keeps only shared bits", () => {
      // input: 0b1110n & 0b0111n -> expected: 0b0110n = 6n
      expect(c.and(0b1110n, 0b0111n)).toBe(0b0110n);
    });

    test("disjoint bits produce 0n", () => {
      // input: 0b1010n & 0b0101n -> expected: 0n
      expect(c.and(0b1010n, 0b0101n)).toBe(0n);
    });

    test("works with values beyond 64-bit range", () => {
      // input: large mask & value with one matching bit -> expected: that bit
      const bit = 1n << 100n;
      expect(c.and(bit | 1n, bit | 2n)).toBe(bit);
    });
  });

  describe("andNot", () => {
    test("0n & ~0n === 0n", () => {
      expect(c.andNot(0n, 0n)).toBe(0n);
    });

    test("identity: x & ~0n === x", () => {
      // input: 42n & ~0n -> ~0n is all bits set -> expected: 42n
      expect(c.andNot(42n, 0n)).toBe(42n);
    });

    test("self-clear: x & ~x === 0n", () => {
      // input: 13n & ~13n -> expected: 0n
      expect(c.andNot(13n, 13n)).toBe(0n);
    });

    test("clears only the bits set in b", () => {
      // input: 0b1110n & ~0b0110n -> expected: 0b1000n = 8n
      expect(c.andNot(0b1110n, 0b0110n)).toBe(0b1000n);
    });

    test("leaves a untouched when operands are disjoint", () => {
      // input: 0b1010n & ~0b0101n -> expected: 0b1010n = 10n
      expect(c.andNot(0b1010n, 0b0101n)).toBe(0b1010n);
    });

    test("equivalent to and(a, not(b))", () => {
      // input: 0b1101n -> expected: same result as the explicit composition
      expect(c.andNot(0b1101n, 0b1011n)).toBe(c.and(0b1101n, c.not(0b1011n)));
    });

    test("clears a high bit beyond 64-bit range", () => {
      // input: (bit100 | bit10) & ~bit100 -> expected: only bit10 remains
      const high = 1n << 100n;
      const low = 1n << 10n;
      expect(c.andNot(high | low, high)).toBe(low);
    });
  });

  describe("xor", () => {
    test("0n ^ 0n === 0n", () => {
      expect(c.xor(0n, 0n)).toBe(0n);
    });

    test("identity: x ^ 0n === x", () => {
      // input: 42n ^ 0n -> expected: 42n
      expect(c.xor(42n, 0n)).toBe(42n);
    });

    test("self-inverse: x ^ x === 0n", () => {
      // input: 255n ^ 255n -> expected: 0n
      expect(c.xor(255n, 255n)).toBe(0n);
    });

    test("flips only differing bits", () => {
      // input: 0b0110n ^ 0b0011n -> expected: 0b0101n = 5n
      expect(c.xor(0b0110n, 0b0011n)).toBe(0b0101n);
    });

    test("commutative: a ^ b === b ^ a", () => {
      // input: 0b1100n ^ 0b0011n, both directions
      expect(c.xor(0b1100n, 0b0011n)).toBe(c.xor(0b0011n, 0b1100n));
    });

    test("works with values beyond 64-bit range", () => {
      // input: same large value XORed with itself -> expected: 0n
      const big = (1n << 200n) | (1n << 150n) | 1n;
      expect(c.xor(big, big)).toBe(0n);
    });
  });

  describe("not", () => {
    test("~0n === -1n (all bits set in two's complement)", () => {
      // input: 0n -> expected: -1n
      expect(c.not(0n)).toBe(-1n);
    });

    test("~(-1n) === 0n", () => {
      // input: -1n -> expected: 0n
      expect(c.not(-1n)).toBe(0n);
    });

    test("~1n === -2n", () => {
      // input: 1n -> expected: -2n
      expect(c.not(1n)).toBe(-2n);
    });

    test("double negation: ~~x === x", () => {
      // input: 42n -> expected: 42n after two NOT operations
      expect(c.not(c.not(42n))).toBe(42n);
    });

    test("flips all bits of an arbitrary value", () => {
      // input: 0b00001111n (15n) -> expected: -16n
      expect(c.not(0b00001111n)).toBe(-16n);
    });

    test("result is typeof bigint", () => {
      // expected: NOT always returns bigint
      expect(typeof c.not(5n)).toBe("bigint");
    });
  });

  describe("shiftL", () => {
    test("shift by 0 is identity", () => {
      // input: 5n << 0 -> expected: 5n
      expect(c.shiftL(5n, 0)).toBe(5n);
    });

    test("shift 0n by any amount stays 0n", () => {
      // input: 0n << 10 -> expected: 0n
      expect(c.shiftL(0n, 10)).toBe(0n);
    });

    test("shift 1n left by n equals 2n**n", () => {
      // input: 1n << 4 -> expected: 16n
      expect(c.shiftL(1n, 4)).toBe(16n);
    });

    test("shift by 1 doubles the value", () => {
      // input: 3n << 1 -> expected: 6n
      expect(c.shiftL(3n, 1)).toBe(6n);
    });

    test("shift beyond 31 does not wrap or truncate", () => {
      // input: 1n << 31 -> expected: 2147483648n (no sign-bit overflow unlike number)
      expect(c.shiftL(1n, 31)).toBe(2147483648n);
    });

    test("shift beyond 32 bits stays exact", () => {
      // input: 1n << 32 -> expected: 4294967296n
      expect(c.shiftL(1n, 32)).toBe(4294967296n);
    });

    test("shift beyond 64 bits stays exact", () => {
      // input: 1n << 100 -> expected: 2n**100n
      expect(c.shiftL(1n, 100)).toBe(2n ** 100n);
    });

    test("shifted value has exactly one set bit", () => {
      // input: 1n << 63 -> popcount should be 1
      expect(c.popcount(c.shiftL(1n, 63))).toBe(1);
    });
  });
});
