import { describe, expect, test } from "bun:test";

import { BigIntFlagRegistry } from "@/flags/registry/BigIntFlagRegistry";
import { NumberFlagRegistry } from "@/flags/registry/NumberFlagRegistry";

import { MixedRegistryError } from "@/operators/errors";

import { assertSameRegistry } from "./assertSameRegistry";

type Perms = "read" | "write" | "execute" | "admin";

const registry = NumberFlagRegistry.from<Perms>(
  "read",
  "write",
  "execute",
  "admin",
);
const otherRegistry = NumberFlagRegistry.from<Perms>(
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

describe("assertSameRegistry", () => {
  describe("same registry", () => {
    test("does not throw for a single flag", () => {
      // input: one flag
      // expected: no error
      expect(() => assertSameRegistry(registry.of("read"))).not.toThrow();
    });

    test("does not throw when all flags share the registry", () => {
      // input: three flags from the same registry
      // expected: no error
      expect(() =>
        assertSameRegistry(
          registry.of("read"),
          registry.of("write"),
          registry.of("execute"),
        ),
      ).not.toThrow();
    });

    test("does not throw when the head equals a rest flag by reference", () => {
      // input: the same flag instance passed twice
      // expected: no error
      const flag = registry.of("read");

      expect(() => assertSameRegistry(flag, flag)).not.toThrow();
    });

    test("returns undefined on success", () => {
      // input: two flags from the same registry
      // expected: void return
      expect(
        assertSameRegistry(registry.of("read"), registry.of("write")),
      ).toBeUndefined();
    });
  });

  describe("mixed registries", () => {
    test("throws MixedRegistryError when a rest flag belongs to another registry", () => {
      // input: head from registry, rest from otherRegistry
      // expected: MixedRegistryError thrown
      expect(() =>
        assertSameRegistry(registry.of("read"), otherRegistry.of("write")),
      ).toThrow(MixedRegistryError);
    });

    test("throws even when only the last flag differs", () => {
      // input: two matching flags followed by a foreign one
      // expected: MixedRegistryError thrown
      expect(() =>
        assertSameRegistry(
          registry.of("read"),
          registry.of("write"),
          otherRegistry.of("execute"),
        ),
      ).toThrow(MixedRegistryError);
    });

    test("throws when number and bigint registries are mixed", () => {
      // input: head from number registry, rest from bigint registry
      // expected: MixedRegistryError thrown
      expect(() =>
        assertSameRegistry(
          registry.of("read"),
          bigRegistry.of("write") as never,
        ),
      ).toThrow(MixedRegistryError);
    });

    test("error carries the keys of both registries", () => {
      // input: head from registry, rest from otherRegistry
      // expected: leftKeys and rightKeys populated from each registry
      try {
        assertSameRegistry(registry.of("read"), otherRegistry.of("write"));
        expect(true).toBe(false); // should not reach here
      } catch (e) {
        expect(e).toBeInstanceOf(MixedRegistryError);
        expect((e as MixedRegistryError).leftKeys).toEqual(registry.keys());
        expect((e as MixedRegistryError).rightKeys).toEqual(
          otherRegistry.keys(),
        );
      }
    });
  });
});
