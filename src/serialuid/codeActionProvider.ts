/**
 * @module codeActionProvider
 * @description Provides a VS Code code action that suggests generating
 * `serialVersionUID` for Java types that do not yet have one.
 *
 * The code action appears as a lightbulb suggestion in the editor when the
 * cursor is inside a Java file containing a class, enum, interface, record,
 * or annotation type without an existing `serialVersionUID` field.
 *
 * @example
 * ```ts
 * import { SerialVersionUIDCodeActionProvider } from './codeActionProvider';
 *
 * languages.registerCodeActionsProvider(
 *     { language: 'java' },
 *     new SerialVersionUIDCodeActionProvider(),
 *     { providedCodeActionKinds: [SerialVersionUIDCodeActionProvider.providedCodeActionKind] },
 * );
 * ```
 */

import {
    CancellationToken,
    CodeAction,
    CodeActionContext,
    CodeActionKind,
    CodeActionProvider as ICodeActionProvider,
    ProviderResult,
    Range,
    Selection,
    TextDocument,
} from 'vscode';

import { findJavaTypeDeclaration, hasSerialVersionUID } from './parser';

/**
 * VS Code code action provider that suggests generating `serialVersionUID`.
 *
 * The action is offered when all of the following conditions are met:
 * 1. The active document is a Java file (`languageId === 'java'`).
 * 2. The document contains a type declaration (class, enum, interface, etc.).
 * 3. The document does **not** already contain a `serialVersionUID` field.
 *
 * The action is marked as preferred so VS Code shows it prominently in the
 * lightbulb menu.
 */
export class SerialVersionUIDCodeActionProvider implements ICodeActionProvider {
    /**
     * The code action kind associated with this provider.
     * Used to filter and identify the action in the editor UI.
     *
     * @example
     * ```ts
     * // Register with this specific kind
     * languages.registerCodeActionsProvider(selector, provider, {
     *     providedCodeActionKinds: [SerialVersionUIDCodeActionProvider.providedCodeActionKind],
     * });
     * ```
     */
    public static readonly providedCodeActionKind =
        CodeActionKind.Source.append('serialVersionUID');

    /**
     * Provides code actions for the given document and range.
     *
     * Returns a single "Generate serialVersionUID" action if the document
     * meets the eligibility criteria, or an empty array otherwise.
     *
     * @param document - The text document in which the code action is requested.
     * @param _range   - The range or selection for which code actions should be computed.
     * @param _context - Additional context about the code action request.
     * @param _token   - Cancellation token for the request.
     * @returns An array containing the code action, or an empty array if not applicable.
     */
    public provideCodeActions(
        document: TextDocument,
        _range: Range | Selection,
        _context: CodeActionContext,
        _token: CancellationToken,
    ): ProviderResult<CodeAction[]> {
        /** Only activate for Java files. */
        if (document.languageId !== 'java') {
            return [];
        }

        /** Don't offer if serialVersionUID already exists. */
        if (hasSerialVersionUID(document)) {
            return [];
        }

        /** Don't offer if no type declaration is found. */
        if (!findJavaTypeDeclaration(document)) {
            return [];
        }

        const action = new CodeAction(
            'Generate serialVersionUID',
            CodeActionKind.Source.append('serialVersionUID'),
        );

        action.command = {
            command: 'vscode-java-serialuid.generateSerialVersionUID',
            title: 'Generate serialVersionUID',
        };

        /** Mark as preferred to show prominently in the lightbulb menu. */
        action.isPreferred = true;
        return [action];
    }
}
