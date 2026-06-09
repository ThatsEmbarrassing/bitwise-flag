export * from "./core";
export * from "./flags";

/* -------------------------------------------------------------------------- */
/*  Backward compatibility layer (v1.x → v2.0.0)                              */
/*                                                                            */
/*  Every export below is kept SOLELY for backward compatibility with         */
/*  version 1.1.0. They are all marked @deprecated and will be removed in a   */
/*  future major release. Use the current names in new code.                  */
/* -------------------------------------------------------------------------- */

import { BigIntFlagRegistry } from "./flags";

import type { Flag, FlagRegistry } from "./flags";

/**
 * In version 1.1.0 there was a single bigint-based registry called
 * `FlagsRegistry`. Its direct equivalent in 2.0.0 is {@link BigIntFlagRegistry}.
 *
 * @deprecated Use {@link BigIntFlagRegistry} (or {@link NumberFlagRegistry}).
 */
export const FlagsRegistry: typeof BigIntFlagRegistry = BigIntFlagRegistry;

/**
 * Type alias for the 1.1.0 registry (which was bigint-only).
 *
 * @deprecated Use {@link FlagRegistry}.
 */
export type FlagsRegistry<TFlags extends string> = FlagRegistry<TFlags, bigint>;

/**
 * The flag interface from 1.1.0 (which was bigint-only).
 *
 * @deprecated Use {@link Flag}.
 */
export type IFlag<TFlags extends string> = Flag<TFlags, bigint>;

/**
 * The flags registry interface from 1.1.0 (which was bigint-only).
 *
 * @deprecated Use {@link FlagRegistry}.
 */
export type IFlagsRegistry<TFlags extends string> = FlagRegistry<
  TFlags,
  bigint
>;

/**
 * In 1.1.0 a flag key had its own dedicated `FlagKey` type.
 *
 * @deprecated Use `string`.
 */
export type FlagKey = string;
