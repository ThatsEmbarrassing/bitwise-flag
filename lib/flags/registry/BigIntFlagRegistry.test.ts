import { describe, expect, spyOn, test } from "bun:test";

import {
  DuplicateError,
  NotPositiveError,
  NotPowerOfTwoError,
  ParseError,
  UnknownBitsError,
  UnknownFlagError,
} from "../errors";

import { BigIntFlagRegistry } from "./BigIntFlagRegistry";

type Perms = "read" | "write" | "execute" | "admin";

// bits: read=1n, write=2n, execute=4n, admin=8n
const registry = BigIntFlagRegistry.from<Perms>(
  "read",
  "write",
  "execute",
  "admin",
);

describe("BigIntFlagRegistry.define()", () => {
  test("creates a registry from an explicit flag->bigint map", () => {
    // input: { read: 1n, write: 2n } -> bits stored as given
    const r = BigIntFlagRegistry.define({ read: 1n, write: 2n });
    expect(r.of("read").bits).toBe(1n);
    expect(r.of("write").bits).toBe(2n);
  });

  test("accepts non-contiguous power-of-two values", () => {
    // input: { a: 1n, b: 16n } -> valid despite gap
    const r = BigIntFlagRegistry.define({ a: 1n, b: 16n });
    expect(r.of("a").bits).toBe(1n);
    expect(r.of("b").bits).toBe(16n);
  });

  test("accepts bigint values beyond Number.MAX_SAFE_INTEGER", () => {
    // input: { huge: 1n << 53n } -> valid; no upper-bound restriction in BigIntFlagRegistry
    const huge = 1n << 53n;
    const r = BigIntFlagRegistry.define({ huge });
    expect(r.of("huge").bits).toBe(huge);
  });

  test("does not emit console.warn for any large value", () => {
    // BigIntFlagRegistry has no MAX_SAFE_FLAG threshold, unlike NumberFlagRegistry
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    BigIntFlagRegistry.define({ huge: 1n << 100n });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test("throws NotPositiveError when a flag value is 0n", () => {
    // input: { bad: 0n } -> 0n is not positive
    expect(() => BigIntFlagRegistry.define({ bad: 0n })).toThrow(
      NotPositiveError,
    );
  });

  test("throws NotPositiveError when a flag value is negative", () => {
    // input: { bad: -1n } -> negative bigint values are rejected
    expect(() => BigIntFlagRegistry.define({ bad: -1n })).toThrow(
      NotPositiveError,
    );
  });

  test("NotPositiveError carries the offending flag name and bigint value", () => {
    // input: { zero: 0n } -> error.flag === "zero", error.value === 0n
    let caught: unknown;
    try {
      BigIntFlagRegistry.define({ zero: 0n });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(NotPositiveError);
    expect((caught as NotPositiveError).flag).toBe("zero");
    expect((caught as NotPositiveError).value).toBe(0n);
  });

  test("throws NotPowerOfTwoError when a value is not a power of two", () => {
    // input: { bad: 3n } -> 3n is not a power of two
    expect(() => BigIntFlagRegistry.define({ bad: 3n })).toThrow(
      NotPowerOfTwoError,
    );
  });

  test("throws NotPowerOfTwoError for value 6n", () => {
    // input: { bad: 6n } -> 6n (0b110) has two bits set
    expect(() => BigIntFlagRegistry.define({ bad: 6n })).toThrow(
      NotPowerOfTwoError,
    );
  });

  test("NotPowerOfTwoError carries the offending flag name and bigint value", () => {
    // input: { bad: 3n } -> error.flag === "bad", error.value === 3n
    let caught: unknown;
    try {
      BigIntFlagRegistry.define({ bad: 3n });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(NotPowerOfTwoError);
    expect((caught as NotPowerOfTwoError).flag).toBe("bad");
    expect((caught as NotPowerOfTwoError).value).toBe(3n);
  });

  test("throws DuplicateError when two flags share the same bigint value", () => {
    // input: { a: 1n, b: 1n } -> duplicate bit
    expect(() => BigIntFlagRegistry.define({ a: 1n, b: 1n })).toThrow(
      DuplicateError,
    );
  });

  test("DuplicateError carries the second flag name and the repeated bigint value", () => {
    // input: { a: 2n, b: 2n } -> error.flag === "b", error.value === 2n
    let caught: unknown;
    try {
      BigIntFlagRegistry.define({ a: 2n, b: 2n });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(DuplicateError);
    expect((caught as DuplicateError).flag).toBe("b");
    expect((caught as DuplicateError).value).toBe(2n);
  });
});

describe("BigIntFlagRegistry.from()", () => {
  test("assigns 1n << 0n to the first flag and 1n << 1n to the second", () => {
    // input: from("a", "b") -> a=1n, b=2n
    const r = BigIntFlagRegistry.from("a", "b");
    expect(r.of("a").bits).toBe(1n);
    expect(r.of("b").bits).toBe(2n);
  });

  test("assigns successive powers of two (as bigint) to each flag in order", () => {
    // input: from("r","w","x","a") -> 1n,2n,4n,8n
    expect(registry.of("read").bits).toBe(1n);
    expect(registry.of("write").bits).toBe(2n);
    expect(registry.of("execute").bits).toBe(4n);
    expect(registry.of("admin").bits).toBe(8n);
  });

  test("single flag gets value 1n", () => {
    // input: from("only") -> only=1n
    const r = BigIntFlagRegistry.from("only");
    expect(r.of("only").bits).toBe(1n);
  });

  test("supports more than 30 flags without throwing", () => {
    // BigIntFlagRegistry is not limited to 30 bits like the number variant
    const names = Array.from({ length: 64 }, (_, i) => `f${i}`) as [
      string,
      ...string[],
    ];
    const r = BigIntFlagRegistry.from(...names);
    expect(r.of("f63").bits).toBe(1n << 63n);
  });

  test("flag at position 100 gets value 1n << 100n", () => {
    // bigint shift is not bounded by integer width
    const names = Array.from({ length: 101 }, (_, i) => `f${i}`) as [
      string,
      ...string[],
    ];
    const r = BigIntFlagRegistry.from(...names);
    expect(r.of("f100").bits).toBe(1n << 100n);
  });
});

describe("BigIntFlagRegistry#parse() — bigint input", () => {
  test("parses 0n and returns an empty FlagBox", () => {
    // input: 0n -> bits === 0n, isEmpty() === true
    const flag = registry.parse(0n);
    expect(flag.bits).toBe(0n);
    expect(flag.isEmpty()).toBe(true);
  });

  test("parses a single-flag bigint and sets exactly that flag", () => {
    // input: 1n (read bit) -> has("read")=true, others false
    const flag = registry.parse(1n);
    expect(flag.has("read")).toBe(true);
    expect(flag.has("write")).toBe(false);
  });

  test("parses a composite bigint covering multiple flags", () => {
    // input: 7n (read|write|execute) -> all three set, admin not set
    const flag = registry.parse(7n);
    expect(flag.has("read")).toBe(true);
    expect(flag.has("write")).toBe(true);
    expect(flag.has("execute")).toBe(true);
    expect(flag.has("admin")).toBe(false);
  });

  test("parses fullBits and returns a full FlagBox", () => {
    // input: 15n (all four flags) -> isFull()=true
    const flag = registry.parse(15n);
    expect(flag.isFull()).toBe(true);
  });

  test("throws ParseError for a negative bigint", () => {
    // input: -1n -> not a valid flag value
    expect(() => registry.parse(-1n)).toThrow(ParseError);
  });

  test("ParseError carries the original negative bigint as value", () => {
    // input: -5n -> error.value === -5n
    let caught: unknown;
    try {
      registry.parse(-5n);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ParseError);
    expect((caught as ParseError).value).toBe(-5n);
  });

  test("throws UnknownBitsError for a bigint not registered in the registry", () => {
    // input: 16n -> not in { read=1n, write=2n, execute=4n, admin=8n }
    expect(() => registry.parse(16n)).toThrow(UnknownBitsError);
  });

  test("UnknownBitsError carries the original bigint value and the unknown bigint portion", () => {
    // input: 17n (16n|1n) -> value=17n, unknownBits=16n
    let caught: unknown;
    try {
      registry.parse(17n);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(UnknownBitsError);
    expect((caught as UnknownBitsError).value).toBe(17n);
    expect((caught as UnknownBitsError).unknownBits).toBe(16n);
  });

  test("parses a very large valid bigint (beyond Number.MAX_SAFE_INTEGER)", () => {
    // a registry with a huge flag must accept its own bit value
    const r = BigIntFlagRegistry.define({ huge: 1n << 53n });
    const flag = r.parse(1n << 53n);
    expect(flag.has("huge")).toBe(true);
  });
});

describe("BigIntFlagRegistry#parse() — string input", () => {
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
    // input: "  1  " -> same as parsing 1n
    const flag = registry.parse("  1  ");
    expect(flag.has("read")).toBe(true);
  });

  test("throws ParseError for a string that is not a number", () => {
    // input: "abc" -> BigInt("abc") throws -> ParseError
    expect(() => registry.parse("abc")).toThrow(ParseError);
  });

  test("throws ParseError for a negative number string", () => {
    // input: "-1" -> BigInt("-1") = -1n < 0n -> ParseError
    expect(() => registry.parse("-1")).toThrow(ParseError);
  });

  test("throws ParseError for a float string", () => {
    // input: "1.5" -> BigInt("1.5") throws -> ParseError
    expect(() => registry.parse("1.5")).toThrow(ParseError);
  });

  test("parses a hexadecimal string (BigInt supports '0x' prefix)", () => {
    // input: "0x4" -> BigInt("0x4") = 4n (execute bit)
    const flag = registry.parse("0x4");
    expect(flag.has("execute")).toBe(true);
  });

  test("throws UnknownBitsError for a string representing bits not in the registry", () => {
    // input: "32" -> bit not registered
    expect(() => registry.parse("32")).toThrow(UnknownBitsError);
  });

  test("throws ParseError for an empty string", () => {
    // trim -> "" -> BigInt("") === 0n, so "   " round-trips to an empty flag
    expect(() => registry.parse("   ")).toThrow(ParseError);
  });
});

describe("BigIntFlagRegistry#of()", () => {
  test("returns empty flag when called with no arguments", () => {
    // input: of() -> bits === 0n
    expect(registry.of().bits).toBe(0n);
  });

  test("returns the correct bigint for a single flag", () => {
    // input: of("write") -> bits === 2n
    expect(registry.of("write").bits).toBe(2n);
  });

  test("ORs bigints for multiple flags", () => {
    // input: of("read","admin") -> bits === 1n | 8n === 9n
    expect(registry.of("read", "admin").bits).toBe(9n);
  });

  test("calling of() with all flags produces the same bits as full()", () => {
    // input: all four flag names -> bits === fullBits === 15n
    const all = registry.of("read", "write", "execute", "admin");
    expect(all.bits).toBe(registry.fullBits);
  });

  test("throws UnknownFlagError for an unregistered flag name", () => {
    // input: of("superuser") -> not in registry
    expect(() =>
      (registry as BigIntFlagRegistry<Perms | "superuser">).of("superuser"),
    ).toThrow(UnknownFlagError);
  });

  test("passing the same flag twice is idempotent (OR is idempotent)", () => {
    // input: of("read","read") -> bits === 1n, not 3n
    expect(registry.of("read", "read").bits).toBe(1n);
  });
});

describe("BigIntFlagRegistry#empty()", () => {
  test("bits are 0n", () => {
    // expected: bigint zero
    expect(registry.empty().bits).toBe(0n);
  });

  test("isEmpty() returns true", () => {
    expect(registry.empty().isEmpty()).toBe(true);
  });

  test("isFull() returns false for a registry with more than zero flags", () => {
    expect(registry.empty().isFull()).toBe(false);
  });
});

describe("BigIntFlagRegistry#full()", () => {
  test("bits equal the OR of all registered bigint values (15n for four flags)", () => {
    // read=1n | write=2n | execute=4n | admin=8n === 15n
    expect(registry.full().bits).toBe(15n);
  });

  test("isFull() returns true", () => {
    expect(registry.full().isFull()).toBe(true);
  });

  test("isEmpty() returns false", () => {
    expect(registry.full().isEmpty()).toBe(false);
  });
});

describe("BigIntFlagRegistry#fullBits", () => {
  test("equals the OR of all defined bigint values", () => {
    // read=1n|write=2n|execute=4n|admin=8n === 15n
    expect(registry.fullBits).toBe(15n);
  });

  test("is of type bigint", () => {
    expect(typeof registry.fullBits).toBe("bigint");
  });

  test("returns the same value on repeated access (lazy cache)", () => {
    expect(registry.fullBits).toBe(registry.fullBits);
  });

  test("single-flag registry has fullBits equal to that flag's bigint value", () => {
    // from("only") -> only=1n, fullBits=1n
    const r = BigIntFlagRegistry.from("only");
    expect(r.fullBits).toBe(1n);
  });

  test("non-contiguous define() ORs the sparse bigint values correctly", () => {
    // { a:1n, b:4n } -> fullBits === 5n
    const r = BigIntFlagRegistry.define({ a: 1n, b: 4n });
    expect(r.fullBits).toBe(5n);
  });

  test("large non-contiguous define() computes correct fullBits", () => {
    // { lo: 1n, hi: 1n<<100n } -> fullBits === 1n | (1n<<100n)
    const hi = 1n << 100n;
    const r = BigIntFlagRegistry.define({ lo: 1n, hi });
    expect(r.fullBits).toBe(1n | hi);
  });
});
