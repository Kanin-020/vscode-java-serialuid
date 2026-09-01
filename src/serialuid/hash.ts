/**
 * @module hash
 * @description Computes Java-compatible `serialVersionUID` values using SHA-1 hashing.
 *
 * The algorithm mirrors Java's built-in `serialver` tool: it hashes the full
 * source content, takes the first 64 bits of the digest, and clamps the result
 * to the Java `long` range `[-2^63, 2^63 - 1]`.
 *
 * @example
 * ```ts
 * import { calculateSerialVersionUID } from './hash';
 *
 * const uid = calculateSerialVersionUID('public class Foo { }');
 * console.log(uid); // e.g. "7526445416895349489"
 * ```
 */

import { createHash } from 'crypto';

/** Maximum value of a Java `long` (2^63 - 1). */
const LONG_MAX = BigInt('9223372036854775807');

/** Minimum value of a Java `long` (-2^63). */
const LONG_MIN = BigInt('-9223372036854775808');

/** Number of hex characters to take from the SHA-1 digest (first 64 bits). */
const HEX_SLICE_LENGTH = 16;

/**
 * Calculates a Java-compatible `serialVersionUID` from the given class content.
 *
 * Uses SHA-1 hashing (matching Java's `serialver` tool) and truncates the
 * resulting digest to 64 bits, clamping to the Java `long` range.
 *
 * @param classContent - The full text content of a Java source file.
 * @returns The `serialVersionUID` as a decimal string.
 *
 * @example
 * ```ts
 * const uid = calculateSerialVersionUID('public class Foo { }');
 * // uid === calculateSerialVersionUID('public class Foo { }') — deterministic
 * ```
 */
export function calculateSerialVersionUID(classContent: string): string {
    const hash = createHash('sha1');
    hash.update(classContent);
    const digest = hash.digest('hex');

    const serialVersionUID = BigInt(`0x${digest.slice(0, HEX_SLICE_LENGTH)}`);

    const clampedValue = clampToLongRange(serialVersionUID);
    return clampedValue.toString();
}

/**
 * Clamps a `BigInt` value to the Java `long` range `[-2^63, 2^63 - 1]`.
 *
 * @param value - The arbitrary `BigInt` to clamp.
 * @returns The clamped value within the valid Java `long` range.
 */
function clampToLongRange(value: bigint): bigint {
    if (value > LONG_MAX) {
        return LONG_MAX;
    }
    if (value < LONG_MIN) {
        return LONG_MIN;
    }
    return value;
}
