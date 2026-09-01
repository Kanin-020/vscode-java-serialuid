/**
 * @module position
 * @description Determines the correct insertion position for `serialVersionUID`
 * within a Java source file.
 *
 * Handles multiple brace styles (K&R and Allman), enum constant terminators,
 * and nested anonymous class bodies. The logic ensures the generated field is
 * placed in a syntactically valid location for each Java type.
 *
 * @example
 * ```ts
 * import { findInsertPosition } from './position';
 *
 * const pos = findInsertPosition(document, typeDecl.index, typeDecl.type);
 * edit.insert(document.uri, pos, serialUIDText);
 * ```
 */

import { Position, TextDocument } from 'vscode';

/**
 * Finds the line number of the opening brace `{` for the type declaration
 * starting at `typeDeclIndex`.
 *
 * Supports two common Java brace styles:
 * - **K&R style** — the brace is on the same line as the declaration.
 * - **Allman style** — the brace is on the line immediately following the declaration.
 *
 * If no brace is found (malformed source), the fallback is the declaration's own line.
 *
 * @param document       - The VS Code text document.
 * @param typeDeclIndex  - The zero-based character index of the type declaration.
 * @returns The zero-based line number containing the opening brace.
 */
function findBraceLine(document: TextDocument, typeDeclIndex: number): number {
    const startPos = document.positionAt(typeDeclIndex);
    const startLineText = document.lineAt(startPos.line).text;

    /** K&R style: brace is on the same line as the declaration. */
    if (startLineText.includes('{')) {
        return startPos.line;
    }

    /** Allman style: search subsequent lines for the opening brace. */
    for (let line = startPos.line + 1; line < document.lineCount; line++) {
        if (document.lineAt(line).text.includes('{')) {
            return line;
        }
    }

    /** Fallback: no brace found — return the declaration line. */
    return startPos.line;
}

/**
 * Finds the correct insert position for `serialVersionUID` inside an enum.
 *
 * In Java, enum constants must appear before any fields or methods. The
 * constant list is terminated by a semicolon (`;`), which is required when
 * members follow. This function walks the enum body, tracking brace depth
 * to handle anonymous class bodies within constants, and returns the
 * position immediately after the terminating `;`.
 *
 * @param document  - The VS Code text document.
 * @param braceLine - The zero-based line number of the enum's opening brace.
 * @returns The {@link Position} where `serialVersionUID` should be inserted.
 *
 * @example
 * ```java
 * public enum Color {
 *     RED,
 *     GREEN,
 *     BLUE;       // ← insert here (after this line)
 *
 *     private String description;
 * }
 * ```
 */
function findEnumInsertPosition(document: TextDocument, braceLine: number): Position {
    /** We start inside the enum body (after the opening `{`). */
    let depth = 1;

    for (let line = braceLine + 1; line < document.lineCount; line++) {
        const text = document.lineAt(line).text;

        /** Count braces in this line BEFORE checking for `;`. */
        for (const ch of text) {
            if (ch === '{') {
                depth++;
            } else if (ch === '}') {
                depth--;
            }
        }

        /** If we've exited the enum body, stop. */
        if (depth <= 0) {
            return new Position(line, 0);
        }

        /**
         * At the top level of the enum, look for the `;` that terminates
         * the enum constant list.
         */
        if (depth === 1 && text.includes(';')) {
            return new Position(line + 1, 0);
        }
    }

    /** No semicolon found at top level — insert right after the brace. */
    return new Position(braceLine + 1, 0);
}

/**
 * Finds the position where `serialVersionUID` should be inserted in a Java file.
 *
 * Insertion rules by type:
 * - **enum** — after the enum constant terminator (`;`), since constants must
 *   precede fields.
 * - **class, interface, record, @interface** — right after the opening brace.
 *
 * @param document      - The VS Code text document.
 * @param typeDeclIndex - The zero-based character index of the type declaration.
 * @param typeKeyword   - The type keyword (e.g. `'class'`, `'enum'`, `'interface'`, `'record'`).
 * @returns The {@link Position} where `serialVersionUID` should be inserted.
 *
 * @example
 * ```ts
 * const decl = findJavaTypeDeclaration(document)!;
 * const pos = findInsertPosition(document, decl.index, decl.type);
 * // pos.line is the line after the opening brace (or after enum `;`)
 * ```
 */
export function findInsertPosition(
    document: TextDocument,
    typeDeclIndex: number,
    typeKeyword: string,
): Position {
    const braceLine = findBraceLine(document, typeDeclIndex);

    if (typeKeyword === 'enum') {
        return findEnumInsertPosition(document, braceLine);
    }

    /** For class, interface, record, @interface: insert right after the opening brace. */
    return new Position(braceLine + 1, 0);
}
