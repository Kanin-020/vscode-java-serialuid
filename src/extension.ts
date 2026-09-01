/**
 * @module extension
 * @description Entry point for the Java SerialVersion UID Generator VS Code extension.
 *
 * This module handles activation and deactivation of the extension. It registers:
 * - The `generateSerialVersionUID` command that generates and inserts the field.
 * - A code action provider that suggests the generation via the editor lightbulb.
 *
 * All heavy logic (hashing, parsing, position detection) is delegated to the
 * {@link module:serialuid} sub-modules.
 *
 * @example
 * ```ts
 * // The extension activates automatically for Java files (activationEvents: onLanguage:java).
 * // Users can trigger generation via:
 * //   1. The editor lightbulb → "Generate SerialVersionUID"
 * //   2. The command palette → "Generate SerialVersionUID"
 * ```
 */

import { commands, languages, window, workspace, WorkspaceEdit, ExtensionContext } from 'vscode';

import {
    SerialVersionUIDCodeActionProvider,
    calculateSerialVersionUID,
    findInsertPosition,
    findJavaTypeDeclaration,
} from './serialuid';

/**
 * Generates an indentation string using spaces based on the editor's tab size.
 *
 * @param editorTabSize - The number of spaces per indentation level.
 * @returns A string of spaces with the specified length.
 */
function getIndentation(editorTabSize: number): string {
    return ' '.repeat(editorTabSize);
}

/**
 * Activates the Java SerialVersionUID Generator extension.
 *
 * Registers the `generateSerialVersionUID` command and the code action provider
 * that suggests generating `serialVersionUID` for Java types.
 *
 * @param context - The extension context provided by VS Code. Used to manage
 *                  subscriptions and extension lifecycle.
 *
 * @example
 * ```ts
 * // Called automatically by VS Code when a Java file is opened.
 * // The command can also be triggered from the command palette.
 * ```
 */
export function activate(context: ExtensionContext): void {
    const generateSerialVersionUIDCommand = commands.registerCommand(
        'vscode-java-serialuid.generateSerialVersionUID',
        async () => {
            const editor = window.activeTextEditor;
            if (!editor) {
                window.showErrorMessage('No editor is active');
                return;
            }

            const document = editor.document;
            const typeDeclaration = findJavaTypeDeclaration(document);

            if (!typeDeclaration) {
                window.showErrorMessage('No class, enum, interface, or record definition found.');
                return;
            }

            try {
                const serialVersionUID = calculateSerialVersionUID(document.getText());

                const edit = new WorkspaceEdit();
                const insertPosition = findInsertPosition(
                    document,
                    typeDeclaration.index,
                    typeDeclaration.type,
                );

                const tabSize =
                    typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 4;
                const indent = getIndentation(tabSize);
                const serialUIDText = `\n${indent}private static final long serialVersionUID = ${serialVersionUID}L;\n`;

                edit.insert(document.uri, insertPosition, serialUIDText);
                await workspace.applyEdit(edit);
                window.showInformationMessage(
                    `SerialVersionUID added to ${typeDeclaration.name}: ${serialVersionUID}`,
                );
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                window.showErrorMessage(`Error generating serialVersionUID: ${message}`);
            }
        },
    );

    const codeActionProvider = languages.registerCodeActionsProvider(
        { language: 'java' },
        new SerialVersionUIDCodeActionProvider(),
        {
            providedCodeActionKinds: [SerialVersionUIDCodeActionProvider.providedCodeActionKind],
        },
    );

    context.subscriptions.push(generateSerialVersionUIDCommand, codeActionProvider);
}

/**
 * Deactivates the extension.
 *
 * Called by VS Code when the extension is unloaded. This implementation is
 * intentionally empty — all subscriptions are automatically disposed via
 * {@link ExtensionContext.subscriptions}.
 */
export function deactivate(): void {}
