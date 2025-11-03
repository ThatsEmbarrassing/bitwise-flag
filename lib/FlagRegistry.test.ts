import { beforeEach, describe, expect, it } from "bun:test";

import { FlagsRegistry } from "./FlagRegistry";

describe("FlagRegistry", () => {
  let registry: FlagsRegistry<FlagKeysType>;

  const flagKeys = [
    "__FLAG_A__", // 1 bit
    "__FLAG_B__", // 2 bits
    "__FLAG_C__", // 4 bits
    "__FLAG_D__", // 8 bits
  ] as const;

  type FlagKeysArray = typeof flagKeys;
  type FlagKeysType = FlagKeysArray[number];

  beforeEach(() => {
    registry = FlagsRegistry.from(...flagKeys);
  });

  it("should handle many flags without bit overflow", () => {
    const manyFlags = Array.from({ length: 100 }, (_, i) => `__FLAG_${i}__`);
    const registry = FlagsRegistry.from(...manyFlags);

    // should be able to combine all flags
    const allFlags = registry.combine(...manyFlags);

    // each flag should be set
    manyFlags.forEach((flag) => {
      expect(allFlags.has(flag)).toBe(true);
    });
  });

  it("should work with empty registry", () => {
    const emptyRegistry = FlagsRegistry.from();

    expect(Array.from(emptyRegistry.keys())).toEqual([]);
    expect(emptyRegistry.empty().isEmpty()).toBe(true);

    // combining no flags should work
    const emptyFlag = emptyRegistry.combine();
    expect(emptyFlag.isEmpty()).toBe(true);
  });

  describe("static from()", () => {
    it("should create registry with unique flags", () => {
      const registry = FlagsRegistry.from("A", "B", "C", "A");
      const keys = Array.from(registry.keys());

      expect(keys).toEqual(["A", "B", "C"]);
    });

    it("should assign correct bit values to flags", () => {
      const registry = FlagsRegistry.from(
        "__FLAG_1__",
        "__FLAG_2__",
        "__FLAG_3__"
      );

      expect(registry.get("__FLAG_1__")).toBe(1n);
      expect(registry.get("__FLAG_2__")).toBe(2n);
      expect(registry.get("__FLAG_3__")).toBe(4n);
    });
  });

  describe("get()", () => {
    it("should return correct value for existing flag", () => {
      expect(registry.get("__FLAG_A__")).toBe(1n);
      expect(registry.get("__FLAG_B__")).toBe(2n);
      expect(registry.get("__FLAG_C__")).toBe(4n);
      expect(registry.get("__FLAG_D__")).toBe(8n);
    });

    it("should return undefined for non-existent flag", () => {
      // @ts-expect-error this flag is not exist
      expect(registry.get("__NON_EXISTENT_FLAG__")).toBeUndefined();
    });

    it("should combine flags correctly", () => {
      const emptyFlag = registry.combine();
      const flagA = registry.combine("__FLAG_A__");
      const flagBC = registry.combine("__FLAG_B__", "__FLAG_C__");
      const flagDAB = registry.combine(
        "__FLAG_D__",
        "__FLAG_A__",
        "__FLAG_B__"
      );
      const flagABCD = registry.combine(
        "__FLAG_A__",
        "__FLAG_B__",
        "__FLAG_C__",
        "__FLAG_D__"
      );

      expect(emptyFlag.value).toBe(0n);
      expect(flagA.value).toBe(1n);
      expect(flagBC.value).toBe(6n);
      expect(flagDAB.value).toBe(11n);
      expect(flagABCD.value).toBe(15n);
    });

    it("should throw error when combining non-existent flag", () => {
      expect(() => {
        registry.combine(
          "__FLAG_A__",
          "__FLAG_B__",
          // @ts-expect-error this flag is not exist
          "__NON_EXISTENT_FLAG__",
          "__FLAG_D__"
        );
      }).toThrow("Flag with key __NON_EXISTENT_FLAG__ is not found.");
    });
  });

  describe("empty()", () => {
    it("should return empty flag", () => {
      const emptyFlag = registry.empty();

      expect(emptyFlag.value).toBe(0n);
      expect(emptyFlag.isEmpty()).toBe(true);
    });
  });

  describe("parse", () => {
    it("should parse number values", () => {
      const flagA = registry.parse(1); // decimal
      const flagCD = registry.parse(0b1100); // binary
      const flagBC = registry.parse(0x6); // hex
      const flagBCD = registry.parse(0o16); // octal

      expect(flagA.has("__FLAG_A__")).toBeTrue();

      expect(flagCD.has("__FLAG_C__")).toBeTrue();
      expect(flagCD.has("__FLAG_D__")).toBeTrue();

      expect(flagBC.has("__FLAG_B__")).toBeTrue();
      expect(flagBC.has("__FLAG_C__")).toBeTrue();

      expect(flagBCD.has("__FLAG_B__")).toBeTrue();
      expect(flagBCD.has("__FLAG_C__")).toBeTrue();
      expect(flagBCD.has("__FLAG_D__")).toBeTrue();
    });

    it("should parse bigint values", () => {
      const flagA = registry.parse(1n); // decimal
      const flagCD = registry.parse(0b1100n); // binary
      const flagBC = registry.parse(0x6n); // hex
      const flagBCD = registry.parse(0o16n); // octal

      expect(flagA.has("__FLAG_A__")).toBeTrue();

      expect(flagCD.has("__FLAG_C__")).toBeTrue();
      expect(flagCD.has("__FLAG_D__")).toBeTrue();

      expect(flagBC.has("__FLAG_B__")).toBeTrue();
      expect(flagBC.has("__FLAG_C__")).toBeTrue();

      expect(flagBCD.has("__FLAG_B__")).toBeTrue();
      expect(flagBCD.has("__FLAG_C__")).toBeTrue();
      expect(flagBCD.has("__FLAG_D__")).toBeTrue();
    });

    it("should parse string values", () => {
      const flagA = registry.parse("1", 10); // decimal
      const flagCD = registry.parse("1100", 2); // binary
      const flagBC = registry.parse("6", 16); // hex
      const flagBCD = registry.parse("16", 8); // octal
      const flagACD = registry.parse("111", 3); // any other radix from 2 to 32 (ex.: ternary)

      expect(flagA.has("__FLAG_A__")).toBeTrue();

      expect(flagCD.has("__FLAG_C__")).toBeTrue();
      expect(flagCD.has("__FLAG_D__")).toBeTrue();

      expect(flagBC.has("__FLAG_B__")).toBeTrue();
      expect(flagBC.has("__FLAG_C__")).toBeTrue();

      expect(flagBCD.has("__FLAG_B__")).toBeTrue();
      expect(flagBCD.has("__FLAG_C__")).toBeTrue();
      expect(flagBCD.has("__FLAG_D__")).toBeTrue();

      expect(flagACD.has("__FLAG_A__")).toBeTrue();
      expect(flagACD.has("__FLAG_C__")).toBeTrue();
      expect(flagACD.has("__FLAG_D__")).toBeTrue();
    });
  });

  describe("iterators", () => {
    describe("keys()", () => {
      it("should return all flag names", () => {
        const keys = Array.from(registry.keys()) as unknown as FlagKeysArray;

        expect(keys).toEqual(flagKeys);
      });
    });

    describe("values()", () => {
      it("should return all flag values", () => {
        const values = Array.from(registry.values());

        expect(values).toEqual([1n, 2n, 4n, 8n]);
      });
    });

    describe("entries()", () => {
      it("should return all key-value pairs", () => {
        const entries = Array.from(registry.entries());

        expect(entries).toEqual([
          ["__FLAG_A__", 1n],
          ["__FLAG_B__", 2n],
          ["__FLAG_C__", 4n],
          ["__FLAG_D__", 8n],
        ]);
      });
    });
  });
});
