/**
 * @module parser
 * @description Parses Java source files to detect type declarations and existing
 * `serialVersionUID` fields.
 *
 * Supports all standard Java type keywords: `class`, `enum`, `interface`,
 * `@interface`, and `record`. The parser is comment-aware — commented-out
 * `serialVersionUID` declarations are ignored.
 *
 * @example
 * ```ts
 * import { findJavaTypeDeclaration, hasSerialVersionUID } from './parser';
 *
 * const decl = findJavaTypeDeclaration(document);
 * if (decl) {
 *     console.log(`Found ${decl.type} named ${decl.name}`);
 * }
 * ```
 */

import { TextDocument } from 'vscode';

/**
 * Regular expression pattern to match Java type declarations.
 *
 * Captures:
 * - **Group 1** — the type keyword (`class`, `enum`, `interface`, `@interface`, `record`).
 * - **Group 2** — the type name (identifier).
 *
 * The pattern optionally matches access modifiers and other keywords
 * (`public`, `private`, `protected`, `abstract`, `final`, `static`) that
 * may precede the type keyword.
 *
 * @example
 * ```ts
 * 'public class Foo { }'.match(JAVA_TYPE_PATTERN);
 * // → ['public class Foo', 'class', 'Foo']
 *
 * 'public @interface MyAnnotation { }'.match(JAVA_TYPE_PATTERN);
 * // → ['public @interface MyAnnotation', '@interface', 'MyAnnotation']
 * ```
 */
export const JAVA_TYPE_PATTERN =
    /(?:\b(?:public|private|protected|abstract|final|static)\s+)*(class|enum|interface|@interface|record)\s+(\w+)/;

/**
 * Represents a detected Java type declaration within a source file.
 */
export interface JavaTypeDeclaration {
    /**
     * The type keyword (e.g. `'class'`, `'enum'`, `'interface'`, `'record'`, `'@interface'`).
     */
    type: string;

    /**
     * The name of the declared type (e.g. `'Foo'`, `'Color'`, `'Point'`).
     */
    name: string;

    /**
     * The zero-based character index where the declaration starts in the document text.
     */
    index: number;
}

/**
 * Finds the first Java type declaration (class, enum, interface, @interface, record)
 * in the given document.
 *
 * Searches the full document text using {@link JAVA_TYPE_PATTERN} and returns
 * metadata about the first match.
 *
 * @param document - The VS Code text document to search.
 * @returns The type keyword, type name, and its starting index, or `null` if no
 *          type declaration is found.
 *
 * @example
 * ```ts
 * const doc = await workspace.openTextDocument({ content: 'public class Foo { }', language: 'java' });
 * const decl = findJavaTypeDeclaration(doc);
 * // decl === { type: 'class', name: 'Foo', index: 7 }
 * ```
 */
export function findJavaTypeDeclaration(document: TextDocument): JavaTypeDeclaration | null {
    const text = document.getText();
    const match = text.match(JAVA_TYPE_PATTERN);

    if (!match || match.index === undefined) {
        return null;
    }

    return { type: match[1], name: match[2], index: match.index };
}

/**
 * Checks whether the document already contains a `serialVersionUID` field declaration.
 *
 * Single-line (`//`) and multi-line (block) comments are stripped before
 * checking so that commented-out fields are not treated as existing declarations.
 *
 * The check looks for the exact pattern:
 * `private static final long serialVersionUID = <digits>L;`
 *
 * @param document - The VS Code text document to inspect.
 * @returns `true` if a live (non-commented) `serialVersionUID` field exists;
 *          `false` otherwise.
 *
 * @example
 * ```ts
 * const doc = await workspace.openTextDocument({
 *     content: 'public class Foo {\n    private static final long serialVersionUID = 1L;\n}',
 *     language: 'java',
 * });
 * hasSerialVersionUID(doc); // → true
 * ```
 */
export function hasSerialVersionUID(document: TextDocument): boolean {
    const classContent = document.getText();
    /** Strip single-line and block comments before checking. */
    const withoutComments = classContent.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    return /\bprivate\s+static\s+final\s+long\s+serialVersionUID\s*=\s*\d+L;/g.test(
        withoutComments,
    );
}
