import { describe, expect, test } from "bun:test";

import { UnknownFlagError } from "../errors";
import { Repository } from "./Repository";

describe("Repository", () => {
  describe("get", () => {
    test("returns the value for a registered flag", () => {
      // input: map { "read" => 1 }, key "read" -> expected: 1
      const repo = new Repository<"read", number>(new Map([["read", 1]]));
      expect(repo.get("read")).toBe(1);
    });

    test("returns bigint value for a bigint-typed repository", () => {
      // input: map { "write" => 2n }, key "write" -> expected: 2n
      const repo = new Repository<"write", bigint>(new Map([["write", 2n]]));
      expect(repo.get("write")).toBe(2n);
    });

    test("throws UnknownFlagError for an unregistered flag", () => {
      // input: empty map, key "missing" -> expected: throws UnknownFlagError
      const repo = new Repository<string, number>(new Map());
      expect(() => repo.get("missing")).toThrow(UnknownFlagError);
    });

    test("UnknownFlagError carries the requested flag name", () => {
      // input: empty map, key "admin" -> expected error has .flag === "admin"
      const repo = new Repository<string, number>(new Map());
      let caught: unknown;
      try {
        repo.get("admin");
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(UnknownFlagError);
      expect((caught as UnknownFlagError).flag).toBe("admin");
    });

    test("UnknownFlagError message includes the flag name", () => {
      // input: map { "a" => 1 }, key "b" -> error message mentions "b"
      const repo = new Repository<"a", number>(new Map([["a", 1]]));
      expect(() => repo.get("b")).toThrow(/\"b\"/);
    });

    test("throws for an empty-string key when it is not registered", () => {
      // input: map { "x" => 1 }, key "" -> expected: throws UnknownFlagError
      const repo = new Repository<"x", number>(new Map([["x", 1]]));
      expect(() => repo.get("")).toThrow(UnknownFlagError);
    });

    test("returns correct value when empty string is a registered key", () => {
      // input: map { "" => 4 }, key "" -> expected: 4
      const repo = new Repository<"", number>(new Map([["", 4]]));
      expect(repo.get("")).toBe(4);
    });
  });

  describe("has", () => {
    test("returns true for a registered flag with a positive bit value", () => {
      // input: map { "read" => 1 }, key "read" -> expected: true
      const repo = new Repository<"read", number>(new Map([["read", 1]]));
      expect(repo.has("read")).toBe(true);
    });

    test("returns false for an unregistered flag", () => {
      // input: empty map, key "write" -> expected: false
      const repo = new Repository<string, number>(new Map());
      expect(repo.has("write")).toBe(false);
    });

    test("returns false for a flag whose stored value is 0 (falsy coercion)", () => {
      // input: map { "zero" => 0 } — has() uses !!value, so 0 is treated as absent
      // NOTE: this documents the current behaviour; callers must not register 0-valued flags
      const repo = new Repository<"zero", number>(new Map([["zero", 0]]));
      expect(repo.has("zero")).toBe(false);
    });

    test("returns false for an empty-string key that is not registered", () => {
      // input: map { "x" => 2 }, key "" -> expected: false
      const repo = new Repository<"x", number>(new Map([["x", 2]]));
      expect(repo.has("")).toBe(false);
    });
  });

  describe("keys", () => {
    test("returns an empty array for an empty map", () => {
      // input: empty map -> expected: []
      const repo = new Repository<string, number>(new Map());
      expect(repo.keys()).toEqual([]);
    });

    test("returns all registered flag names", () => {
      // input: map { "r" => 1, "w" => 2, "x" => 4 } -> expected: ["r", "w", "x"]
      const repo = new Repository<"r" | "w" | "x", number>(new Map([["r", 1], ["w", 2], ["x", 4]]));
      expect(repo.keys()).toEqual(["r", "w", "x"]);
    });

    test("returns a plain array, not a Map iterator", () => {
      // input: map { "a" => 1 } -> expected: Array.isArray === true
      const repo = new Repository<"a", number>(new Map([["a", 1]]));
      expect(Array.isArray(repo.keys())).toBe(true);
    });

    test("preserves insertion order", () => {
      // input: keys inserted as "b", "a", "c" -> expected same order
      const repo = new Repository<"a" | "b" | "c", number>(new Map([["b", 2], ["a", 1], ["c", 4]]));
      expect(repo.keys()).toEqual(["b", "a", "c"]);
    });
  });

  describe("values", () => {
    test("returns an empty array for an empty map", () => {
      // input: empty map -> expected: []
      const repo = new Repository<string, number>(new Map());
      expect(repo.values()).toEqual([]);
    });

    test("returns all bit values in insertion order", () => {
      // input: map { "r" => 1, "w" => 2, "x" => 4 } -> expected: [1, 2, 4]
      const repo = new Repository<"r" | "w" | "x", number>(new Map([["r", 1], ["w", 2], ["x", 4]]));
      expect(repo.values()).toEqual([1, 2, 4]);
    });

    test("returns a plain array, not a Map iterator", () => {
      // input: map { "a" => 1 } -> expected: Array.isArray === true
      const repo = new Repository<"a", number>(new Map([["a", 1]]));
      expect(Array.isArray(repo.values())).toBe(true);
    });

    test("works with bigint values", () => {
      // input: map { "a" => 1n, "b" => 2n } -> expected: [1n, 2n]
      const repo = new Repository<"a" | "b", bigint>(new Map([["a", 1n], ["b", 2n]]));
      expect(repo.values()).toEqual([1n, 2n]);
    });
  });

  describe("entries", () => {
    test("returns an empty array for an empty map", () => {
      // input: empty map -> expected: []
      const repo = new Repository<string, number>(new Map());
      expect(repo.entries()).toEqual([]);
    });

    test("returns [key, value] tuples for each registered flag", () => {
      // input: map { "r" => 1, "w" => 2 } -> expected: [["r", 1], ["w", 2]]
      const repo = new Repository<"r" | "w", number>(new Map([["r", 1], ["w", 2]]));
      expect(repo.entries()).toEqual([["r", 1], ["w", 2]]);
    });

    test("returns a plain array of tuples, not a Map iterator", () => {
      // input: map { "a" => 1 } -> expected: Array.isArray === true
      const repo = new Repository<"a", number>(new Map([["a", 1]]));
      expect(Array.isArray(repo.entries())).toBe(true);
    });

    test("preserves insertion order for entries", () => {
      // input: keys inserted as "c", "a", "b" -> expected same order in entries
      const repo = new Repository<"a" | "b" | "c", number>(new Map([["c", 4], ["a", 1], ["b", 2]]));
      expect(repo.entries()).toEqual([["c", 4], ["a", 1], ["b", 2]]);
    });

    test("each entry is a two-element tuple", () => {
      // input: map { "x" => 8 } -> expected: entry length === 2
      const repo = new Repository<"x", number>(new Map([["x", 8]]));
      const [entry] = repo.entries();
      expect(entry!).toHaveLength(2);
      expect(entry![0]).toBe("x");
      expect(entry![1]).toBe(8);
    });
  });
});
