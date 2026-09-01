/**
 * @module serialuid
 * @description Public API barrel for the Java SerialVersionUID generation logic.
 *
 * Re-exports all utilities needed by the extension entry point and external
 * consumers. Import from this module instead of individual sub-modules to
 * keep import paths clean and stable.
 *
 * @example
 * ```ts
 * import {
 *     calculateSerialVersionUID,
 *     findJavaTypeDeclaration,
 *     hasSerialVersionUID,
 *     findInsertPosition,
 *     SerialVersionUIDCodeActionProvider,
 * } from './serialuid';
 * ```
 */

export { calculateSerialVersionUID } from './hash';
export { JAVA_TYPE_PATTERN, findJavaTypeDeclaration, hasSerialVersionUID } from './parser';
export type { JavaTypeDeclaration } from './parser';
export { findInsertPosition } from './position';
export { SerialVersionUIDCodeActionProvider } from './codeActionProvider';
