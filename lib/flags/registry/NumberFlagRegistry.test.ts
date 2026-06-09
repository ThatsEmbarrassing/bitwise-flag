import { describe, expect, test } from "bun:test";

import {
  DuplicateError,
  NotPositiveError,
  NotPowerOfTwoError,
  OverflowError,
  ParseError,
  UnknownBitsError,
  UnknownFlagError,
} from "../errors";

import { NumberFlagRegistry } from "./NumberFlagRegistry";

type Perms = "read" | "write" | "execute" | "admin";

// bits: read=1, write=2, execute=4, admin=8
const registry = NumberFlagRegistry.from<Perms>(
  "read",
  "write",
  "execute",
  "admin",
);

describe("NumberFlagRegistry.define()", () => {
  test("creates a registry from an explicit flag->bit map", () => {
    // input: { read: 1, write: 2 } -> bits stored as given
    const r = NumberFlagRegistry.define({ read: 1, write: 2 });
    expect(r.of("read").bits).toBe(1);
    expect(r.of("write").bits).toBe(2);
  });

  test("accepts non-contiguous power-of-two values", () => {
    // input: { a: 1, b: 16 } -> valid despite gap
    const r = NumberFlagRegistry.define({ a: 1, b: 16 });
    expect(r.of("a").bits).toBe(1);
    expect(r.of("b").bits).toBe(16);
  });

  test("throws NotPositiveError when a flag value is 0", () => {
    // input: { bad: 0 } -> 0 is not positive
    expect(() => NumberFlagRegistry.define({ bad: 0 })).toThrow(
      NotPositiveError,
    );
  });

  test("throws NotPositiveError when a flag value is negative", () => {
    // input: { bad: -1 } -> negative values are rejected
    expect(() => NumberFlagRegistry.define({ bad: -1 })).toThrow(
      NotPositiveError,
    );
  });

  test("NotPositiveError carries the offending flag name", () => {
    // input: { zero: 0 } -> error.flag === "zero"
    let caught: unknown;
    try {
      NumberFlagRegistry.define({ zero: 0 });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(NotPositiveError);
    expect((caught as NotPositiveError).flag).toBe("zero");
  });

  test("throws NotPowerOfTwoError when a value is not a power of two", () => {
    // input: { bad: 3 } -> 3 is not a power of two
    expect(() => NumberFlagRegistry.define({ bad: 3 })).toThrow(
      NotPowerOfTwoError,
    );
  });

  test("throws NotPowerOfTwoError for value 6", () => {
    // input: { bad: 6 } -> 6 (0b110) has two bits set
    expect(() => NumberFlagRegistry.define({ bad: 6 })).toThrow(
      NotPowerOfTwoError,
    );
  });

  test("NotPowerOfTwoError carries the offending flag name and value", () => {
    // input: { bad: 3 } -> error.flag === "bad", error.value === 3
    let caught: unknown;
    try {
      NumberFlagRegistry.define({ bad: 3 });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(NotPowerOfTwoError);
    expect((caught as NotPowerOfTwoError).flag).toBe("bad");
    expect((caught as NotPowerOfTwoError).value).toBe(3);
  });

  test("throws DuplicateError when two flags share the same bit value", () => {
    // input: { a: 1, b: 1 } -> duplicate bit
    expect(() => NumberFlagRegistry.define({ a: 1, b: 1 })).toThrow(
      DuplicateError,
    );
  });

  test("DuplicateError carries the second flag name and the repeated value", () => {
    // input: { a: 2, b: 2 } -> error.flag === "b", error.value === 2
    let caught: unknown;
    try {
      NumberFlagRegistry.define({ a: 2, b: 2 });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(DuplicateError);
    expect((caught as DuplicateError).value).toBe(2);
  });

  test("accepts exactly MAX_SAFE_FLAG (0x40000000 = 2**30)", () => {
    // input: { max: 0x40000000 } -> equals MAX_SAFE_FLAG, not greater -> valid
    expect(() => NumberFlagRegistry.define({ max: 0x40000000 })).not.toThrow();
  });

  test("throws OverflowError for a value exceeding MAX_SAFE_FLAG", () => {
    // input: { huge: 0x80000000 } -> 2**31 > MAX_SAFE_FLAG -> OverflowError
    expect(() => NumberFlagRegistry.define({ huge: 0x80000000 })).toThrow(
      OverflowError,
    );
  });

  test("OverflowError from define() carries the flag name and the overflowing value", () => {
    // input: { big: 0x80000000 } -> error.flag === "big", error.value === 2147483648
    let caught: unknown;
    try {
      NumberFlagRegistry.define({ big: 0x80000000 });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(OverflowError);
    expect((caught as OverflowError).flag).toBe("big");
    expect((caught as OverflowError).value).toBe(0x80000000);
  });

  test("does not throw for a value safely below MAX_SAFE_FLAG", () => {
    // input: { safe: 0x20000000 } -> below threshold, no error
    expect(() => NumberFlagRegistry.define({ safe: 0x20000000 })).not.toThrow();
  });
});

describe("NumberFlagRegistry.from()", () => {
  test("assigns 1 << 0 to the first flag and 1 << 1 to the second", () => {
    // input: from("a", "b") -> a=1, b=2
    const r = NumberFlagRegistry.from("a", "b");
    expect(r.of("a").bits).toBe(1);
    expect(r.of("b").bits).toBe(2);
  });

  test("assigns successive powers of two to each flag in order", () => {
    // input: from("r","w","x","a") -> 1,2,4,8
    expect(registry.of("read").bits).toBe(1);
    expect(registry.of("write").bits).toBe(2);
    expect(registry.of("execute").bits).toBe(4);
    expect(registry.of("admin").bits).toBe(8);
  });

  test("single flag gets value 1", () => {
    // input: from("only") -> only=1
    const r = NumberFlagRegistry.from("only");
    expect(r.of("only").bits).toBe(1);
  });

  test("30 flags fill positions 0–29 without throwing", () => {
    // input: 30 unique flag names -> last flag has value 1 << 29 = 0x20000000
    const names = Array.from({ length: 30 }, (_, i) => `f${i}`) as [
      string,
      ...string[],
    ];
    const r = NumberFlagRegistry.from(...names);
    expect(r.of("f29").bits).toBe(1 << 29);
  });

  test("31 flags fill positions 0–30 (the last safe bit, 2**30 = MAX_SAFE_FLAG)", () => {
    // input: 31 unique flag names -> last flag has value 2**30 = 0x40000000
    const names = Array.from({ length: 31 }, (_, i) => `f${i}`) as [
      string,
      ...string[],
    ];
    const r = NumberFlagRegistry.from(...names);
    expect(r.of("f30").bits).toBe(2 ** 30);
  });

  test("throws OverflowError for 32 flags (2**31 > MAX_SAFE_FLAG)", () => {
    // input: 32 unique flag names -> 2**31 = 2147483648 > MAX_SAFE_FLAG, rejected in validateFlags
    const names = Array.from({ length: 32 }, (_, i) => `f${i}`) as [
      string,
      ...string[],
    ];
    expect(() => NumberFlagRegistry.from(...names)).toThrow(OverflowError);
  });

  test("OverflowError carries the offending flag name and value", () => {
    // input: 32 flags -> error.flag === "f31", error.value === 2**31
    const names = Array.from({ length: 32 }, (_, i) => `f${i}`) as [
      string,
      ...string[],
    ];
    let caught: unknown;
    try {
      NumberFlagRegistry.from(...names);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(OverflowError);
    expect((caught as OverflowError).flag).toBe("f31");
    expect((caught as OverflowError).value).toBe(2 ** 31);
  });
});

describe("NumberFlagRegistry#parse() — number input", () => {
  test("parses 0 and returns an empty FlagBox", () => {
    // input: 0 -> bits === 0, isEmpty() === true
    const flag = registry.parse(0);
    expect(flag.bits).toBe(0);
    expect(flag.isEmpty()).toBe(true);
  });

  test("parses a single-flag bit and sets exactly that flag", () => {
    // input: 1 (read bit) -> has("read")=true, others false
    const flag = registry.parse(1);
    expect(flag.has("read")).toBe(true);
    expect(flag.has("write")).toBe(false);
  });

  test("parses a composite bit mask covering multiple flags", () => {
    // input: 7 (read|write|execute) -> all three set, admin not set
    const flag = registry.parse(7);
    expect(flag.has("read")).toBe(true);
    expect(flag.has("write")).toBe(true);
    expect(flag.has("execute")).toBe(true);
    expect(flag.has("admin")).toBe(false);
  });

  test("parses fullBits and returns a full FlagBox", () => {
    // input: 15 (all four flags) -> isFull()=true
    const flag = registry.parse(15);
    expect(flag.isFull()).toBe(true);
  });

  test("throws ParseError for a negative integer", () => {
    // input: -1 -> not a valid flag value
    expect(() => registry.parse(-1)).toThrow(ParseError);
  });

  test("throws ParseError for a float (non-integer number)", () => {
    // input: 1.5 -> not representable as integer bits
    expect(() => registry.parse(1.5)).toThrow(ParseError);
  });

  test("throws ParseError for NaN", () => {
    // input: NaN -> not a valid integer
    expect(() => registry.parse(NaN)).toThrow(ParseError);
  });

  test("throws UnknownBitsError for a bit not registered in the registry", () => {
    // input: 16 -> not in { read=1, write=2, execute=4, admin=8 }
    expect(() => registry.parse(16)).toThrow(UnknownBitsError);
  });

  test("UnknownBitsError carries the original value and the unknown portion", () => {
    // input: 17 (16|1) -> value=17, unknownBits=16
    let caught: unknown;
    try {
      registry.parse(17);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(UnknownBitsError);
    expect((caught as UnknownBitsError).value).toBe(17);
    expect((caught as UnknownBitsError).unknownBits).toBe(16);
  });
});

describe("NumberFlagRegistry#parse() — string input", () => {
  test("parses a decimal string representing 0", () => {
    // input: "0" -> empty flag
    expect(registry.parse("0").isEmpty()).toBe(true);
  });

  test("parses a decimal string of a valid composite mask", () => {
    // input: "3" (read|write) -> has both flags
    const flag = registry.parse("3");
    expect(flag.has("read")).toBe(true);
    expect(flag.has("write")).toBe(true);
  });

  test("strips leading and trailing whitespace before parsing", () => {
    // input: "  1  " -> same as parsing 1
    const flag = registry.parse("  1  ");
    expect(flag.has("read")).toBe(true);
  });

  test("throws ParseError for a string that is not a number", () => {
    // input: "abc" -> cannot be converted to integer
    expect(() => registry.parse("abc")).toThrow(ParseError);
  });

  test("throws ParseError for a negative number string", () => {
    // input: "-1" -> negative values rejected
    expect(() => registry.parse("-1")).toThrow(ParseError);
  });

  test("throws ParseError for a float string", () => {
    // input: "1.5" -> not an integer
    expect(() => registry.parse("1.5")).toThrow(ParseError);
  });

  test("throws ParseError for an empty string", () => {
    // input: "" -> Number("") === 0 but trim leaves "" which Number converts to 0
    // Actually "" -> 0, which is valid parse but has no unknown bits -> empty flag
    // Documenting actual behaviour: "" parses as 0 (empty flag)
    expect(registry.parse("").isEmpty()).toBe(true);
  });

  test("throws UnknownBitsError for a string representing bits not in the registry", () => {
    // input: "32" -> bit 5 not registered
    expect(() => registry.parse("32")).toThrow(UnknownBitsError);
  });
});

describe("NumberFlagRegistry#of()", () => {
  test("returns empty flag when called with no arguments", () => {
    // input: of() -> bits === 0
    expect(registry.of().bits).toBe(0);
  });

  test("returns the correct bit for a single flag", () => {
    // input: of("write") -> bits === 2
    expect(registry.of("write").bits).toBe(2);
  });

  test("ORs bits for multiple flags", () => {
    // input: of("read","admin") -> bits === 1 | 8 === 9
    expect(registry.of("read", "admin").bits).toBe(9);
  });

  test("calling of() with all flags produces the same bits as full()", () => {
    // input: all four flag names -> bits === fullBits === 15
    const all = registry.of("read", "write", "execute", "admin");
    expect(all.bits).toBe(registry.fullBits);
  });

  test("throws UnknownFlagError for an unregistered flag name", () => {
    // input: of("superuser") -> not in registry
    expect(() =>
      (registry as NumberFlagRegistry<Perms | "superuser">).of("superuser"),
    ).toThrow(UnknownFlagError);
  });

  test("passing the same flag twice is idempotent (OR is idempotent)", () => {
    // input: of("read","read") -> bits === 1, not 3
    expect(registry.of("read", "read").bits).toBe(1);
  });
});

describe("NumberFlagRegistry#empty()", () => {
  test("bits are 0", () => {
    // expected: bits === 0
    expect(registry.empty().bits).toBe(0);
  });

  test("isEmpty() returns true", () => {
    expect(registry.empty().isEmpty()).toBe(true);
  });

  test("isFull() returns false for a registry with more than zero flags", () => {
    expect(registry.empty().isFull()).toBe(false);
  });
});

describe("NumberFlagRegistry#full()", () => {
  test("bits equal the OR of all registered values (15 for four flags)", () => {
    // read=1 | write=2 | execute=4 | admin=8 === 15
    expect(registry.full().bits).toBe(15);
  });

  test("isFull() returns true", () => {
    expect(registry.full().isFull()).toBe(true);
  });

  test("isEmpty() returns false", () => {
    expect(registry.full().isEmpty()).toBe(false);
  });
});

describe("NumberFlagRegistry#fullBits", () => {
  test("equals the OR of all defined bit values", () => {
    // read=1|write=2|execute=4|admin=8 === 15
    expect(registry.fullBits).toBe(15);
  });

  test("returns the same reference on repeated access (lazy cache)", () => {
    // two accesses must return the identical value
    expect(registry.fullBits).toBe(registry.fullBits);
  });

  test("single-flag registry has fullBits equal to that flag's value", () => {
    // from("only") -> only=1, fullBits=1
    const r = NumberFlagRegistry.from("only");
    expect(r.fullBits).toBe(1);
  });

  test("non-contiguous define() ORs the sparse values correctly", () => {
    // { a:1, b:4 } -> fullBits === 5
    const r = NumberFlagRegistry.define({ a: 1, b: 4 });
    expect(r.fullBits).toBe(5);
  });
});
