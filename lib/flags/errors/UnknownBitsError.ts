export class UnknownBitsError extends Error {
  readonly value: number | bigint;
  readonly unknownBits: number | bigint;

  constructor(value: number | bigint, unknownBits: number | bigint) {
    super(
      `Value ${value} contains bits not registered in the registry: ${unknownBits}`,
    );
    this.name = "UnknownBitsError";
    this.value = value;
    this.unknownBits = unknownBits;
  }
}
