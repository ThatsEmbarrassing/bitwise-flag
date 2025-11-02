import { describe, expect, it } from "bun:test";

import { Flag } from "./Flag";
import { FlagsRegistry } from "./FlagRegistry";

describe("Flag", () => {
  const flagKeys = [
    "__FLAG_A__", // 1 bit
    "__FLAG_B__", // 2 bits
    "__FLAG_C__", // 4 bits
    "__FLAG_D__", // 8 bits
  ] as const;
  const registry = FlagsRegistry.from(...flagKeys);

  describe("constructor()", () => {
    it("should create flag with valid value", () => {
      // __FLAG_A__ | __FLAG_D__ = 1 | 8 = 9
      const flag = new Flag(registry, 9n);

      expect(flag.value).toBe(9n);
    });

    it("should throw error for negative value", () => {
      expect(() => {
        new Flag(registry, -1n);
      }).toThrow("Flag value cannot be negative: -1");
    });

    it("should throw error for value with unknown flags", () => {
      // only defined flags or theirs combinations

      expect(() => {
        new Flag(registry, 16n);
      }).toThrow("Flag value contains unknown flags");
    });
  });

  describe("isEmpty()", () => {
    it("should return true for empty flag", () => {
      const emptyFlag = registry.empty();

      expect(emptyFlag.isEmpty()).toBeTrue();
    });

    it("should return false for non-empty flag", () => {
      const nonEmptyFlag = registry.combine("__FLAG_A__", "__FLAG_C__");

      expect(nonEmptyFlag.isEmpty()).toBeFalse();
    });
  });

  describe("has()", () => {
    const flagAD = registry.combine("__FLAG_A__", "__FLAG_D__");

    it("should return true for set flags", () => {
      expect(flagAD.has("__FLAG_A__")).toBeTrue();
      expect(flagAD.has("__FLAG_D__")).toBeTrue();
    });

    it("should return false for unset flags", () => {
      expect(flagAD.has("__FLAG_B__")).toBeFalse();
      expect(flagAD.has("__FLAG_C__")).toBeFalse();
    });

    it("should return false for non-existent flag", () => {
      // @ts-expect-error this flag is not exist
      expect(flagAD.has("__NON_EXISTENT_FLAG__")).toBeFalse();
    });
  });

  describe("add()", () => {
    const flagB = registry.combine("__FLAG_B__");

    it("should add flag to existing combination", () => {
      const flagAB = flagB.add("__FLAG_A__");

      expect(flagAB.value).toBe(3n);
      expect(flagAB.has("__FLAG_A__")).toBeTrue();
      expect(flagAB.has("__FLAG_B__")).toBeTrue();
    });

    it("should return same instance if flag already exists", () => {
      const sameFlag = flagB.add("__FLAG_B__");

      expect(flagB).toBe(sameFlag);
    });

    it("should throw error when adding non-existent flag", () => {
      expect(() => {
        // @ts-expect-error this flag is not exist
        flagB.add("__NON_EXISTENT_FLAG__");
      }).toThrow("Flag with key __NON_EXISTENT_FLAG__ is not found.");
    });

    it("should be immutable - original flag unchanged", () => {
      const originalValue = flagB.value;
      flagB.add("__FLAG_C__");

      expect(flagB.value).toBe(originalValue);
      expect(flagB.has("__FLAG_C__")).toBeFalse();
    });
  });

  describe("remove()", () => {
    const flagBC = registry.combine("__FLAG_B__", "__FLAG_C__");

    it("should remove flag from combination", () => {
      const flagC = flagBC.remove("__FLAG_B__");

      expect(flagC.value).toBe(4n);
      expect(flagC.has("__FLAG_C__")).toBeTrue();
      expect(flagC.has("__FLAG_B__")).toBeFalse();
    });

    it("should return same instance if flag not present", () => {
      const sameFlag = flagBC.remove("__FLAG_D__");

      expect(flagBC).toBe(sameFlag);
    });

    it("should throw error when removing non-existent flag", () => {
      expect(() => {
        // @ts-expect-error this flag is not exist
        flagBC.remove("__NON_EXISTENT_FLAG__");
      }).toThrow("Flag with key __NON_EXISTENT_FLAG__ is not found.");
    });

    it("should be immutable - original flag unchanged", () => {
      const originalValue = flagBC.value;
      flagBC.remove("__FLAG_B__");

      expect(flagBC.value).toBe(originalValue);
      expect(flagBC.has("__FLAG_B__")).toBeTrue();
    });
  });

  describe("toString()", () => {
    it("should return correct string representation for empty flag", () => {
      const emptyFlag = registry.empty();

      expect(emptyFlag.toString()).toBe("Flag(EMPTY_FLAG: 0)");
    });

    it("should return correct string representation for single flag", () => {
      const flagA = registry.combine("__FLAG_A__");

      expect(flagA.toString()).toBe("Flag([__FLAG_A__]: 1)");
    });

    it("should return correct string representation for multiple flags", () => {
      const flagAB = registry.combine("__FLAG_A__", "__FLAG_B__");

      expect(flagAB.toString()).toBe("Flag([__FLAG_A__+__FLAG_B__]: 3)");
    });
  });

  describe("alias", () => {
    it("should return EMPTY_FLAG for empty flag", () => {
      const emptyFlag = registry.empty();

      expect(emptyFlag.alias).toBe("EMPTY_FLAG");
    });

    it("should return formatted string for single flag", () => {
      const flagA = registry.combine("__FLAG_A__");

      expect(flagA.alias).toBe("[__FLAG_A__]");
    });

    it("should return formatted string for multiple flags", () => {
      const flagBD = registry.combine("__FLAG_B__", "__FLAG_D__");

      expect(flagBD.alias).toBe("[__FLAG_B__+__FLAG_D__]");
    });

    it("should cache the alias value", () => {
      const flagACD = registry.combine(
        "__FLAG_A__",
        "__FLAG_C__",
        "__FLAG_D__"
      );

      // @ts-expect-error access to a private field, before caching
      expect(flagACD._alias).toBeNull();

      flagACD.alias;

      // @ts-expect-error access to a private field, after caching
      expect(flagACD._alias).toBe(flagACD.alias);
    });
  });
});
