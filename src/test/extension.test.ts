import assert from 'assert';
import { workspace, TextDocument } from 'vscode';
import {
    calculateSerialVersionUID,
    findJavaTypeDeclaration,
    hasSerialVersionUID,
    findInsertPosition,
    JAVA_TYPE_PATTERN,
} from '../serialuid';

// ---------------------------------------------------------------------------
// Helper: create a lightweight in-memory TextDocument from source text
// ---------------------------------------------------------------------------
async function createDoc(content: string, language: string = 'java'): Promise<TextDocument> {
    return workspace.openTextDocument({ content, language });
}

// ===========================================================================
// calculateSerialVersionUID
// ===========================================================================
suite('calculateSerialVersionUID', () => {
    test('should produce consistent hash for the same input', () => {
        const content = 'public class Foo { }';
        assert.strictEqual(calculateSerialVersionUID(content), calculateSerialVersionUID(content));
    });

    test('should handle large and small class content', () => {
        const large = calculateSerialVersionUID(
            'public class Foo {\n' +
                '    private int x;\n' +
                '    public void method() { }\n' +
                '    private String name;\n' +
                '}',
        );
        const small = calculateSerialVersionUID('enum X { A; }');
        // Both should be valid positive longs
        assert.ok(/^\d+$/.test(large), `large result "${large}" should be digits`);
        assert.ok(/^\d+$/.test(small), `small result "${small}" should be digits`);
        const largeNum = BigInt(large);
        const smallNum = BigInt(small);
        const LONG_MAX = BigInt('9223372036854775807');
        assert.ok(largeNum >= 0 && largeNum <= LONG_MAX);
        assert.ok(smallNum >= 0 && smallNum <= LONG_MAX);
    });

    test('should return a string containing only digits (positive long)', () => {
        const result = calculateSerialVersionUID('public class Foo { }');
        assert.ok(/^\d+$/.test(result), `Expected only digits, got "${result}"`);
    });

    test('should be within valid Java long range [0, 2^63-1]', () => {
        const result = calculateSerialVersionUID('public class Foo { }');
        const num = BigInt(result);
        const LONG_MAX = BigInt('9223372036854775807');
        assert.ok(num >= 0 && num <= LONG_MAX, `Expected ${num} to be in [0, ${LONG_MAX}]`);
    });

    test('should handle empty content', () => {
        const result = calculateSerialVersionUID('');
        assert.ok(/^\d+$/.test(result));
    });
});

// ===========================================================================
// JAVA_TYPE_PATTERN  (pure regex test)
// ===========================================================================
suite('JAVA_TYPE_PATTERN', () => {
    test('matches public class', () => {
        const m = 'public class Foo { }'.match(JAVA_TYPE_PATTERN);
        assert.ok(m);
        assert.strictEqual(m![1], 'class');
        assert.strictEqual(m![2], 'Foo');
    });

    test('matches class without modifier', () => {
        const m = 'class Foo { }'.match(JAVA_TYPE_PATTERN);
        assert.ok(m);
        assert.strictEqual(m![1], 'class');
        assert.strictEqual(m![2], 'Foo');
    });

    test('matches abstract class', () => {
        const m = 'public abstract class Foo { }'.match(JAVA_TYPE_PATTERN);
        assert.ok(m);
        assert.strictEqual(m![1], 'class');
        assert.strictEqual(m![2], 'Foo');
    });

    test('matches enum', () => {
        const m = 'public enum Color { RED; }'.match(JAVA_TYPE_PATTERN);
        assert.ok(m);
        assert.strictEqual(m![1], 'enum');
        assert.strictEqual(m![2], 'Color');
    });

    test('matches interface', () => {
        const m = 'public interface MyInterface { }'.match(JAVA_TYPE_PATTERN);
        assert.ok(m);
        assert.strictEqual(m![1], 'interface');
        assert.strictEqual(m![2], 'MyInterface');
    });

    test('matches record', () => {
        const m = 'public record Point(int x, int y) { }'.match(JAVA_TYPE_PATTERN);
        assert.ok(m);
        assert.strictEqual(m![1], 'record');
        assert.strictEqual(m![2], 'Point');
    });

    test('matches @interface (annotation type)', () => {
        const m = 'public @interface MyAnnotation { }'.match(JAVA_TYPE_PATTERN);
        assert.ok(m);
        assert.strictEqual(m![1], '@interface');
        assert.strictEqual(m![2], 'MyAnnotation');
    });

    test('does NOT match non-type keywords like "interface_"', () => {
        const m = 'int interface_count = 5;'.match(JAVA_TYPE_PATTERN);
        assert.strictEqual(m, null);
    });

    test('does NOT match variable named "class"', () => {
        const m = 'String class = "hello";'.match(JAVA_TYPE_PATTERN);
        assert.strictEqual(m, null);
    });
});

// ===========================================================================
// findJavaTypeDeclaration
// ===========================================================================
suite('findJavaTypeDeclaration', () => {
    test('finds simple public class', async () => {
        const doc = await createDoc('public class Foo { }');
        const decl = findJavaTypeDeclaration(doc);
        assert.ok(decl);
        assert.strictEqual(decl!.type, 'class');
        assert.strictEqual(decl!.name, 'Foo');
        assert.ok(typeof decl!.index === 'number');
    });

    test('finds class without modifier', async () => {
        const doc = await createDoc('class Foo { }');
        const decl = findJavaTypeDeclaration(doc);
        assert.ok(decl);
        assert.strictEqual(decl!.type, 'class');
        assert.strictEqual(decl!.name, 'Foo');
    });

    test('finds abstract class', async () => {
        const doc = await createDoc('public abstract class Foo { }');
        const decl = findJavaTypeDeclaration(doc);
        assert.ok(decl);
        assert.strictEqual(decl!.type, 'class');
        assert.strictEqual(decl!.name, 'Foo');
    });

    test('finds enum', async () => {
        const doc = await createDoc('public enum Color { RED; }');
        const decl = findJavaTypeDeclaration(doc);
        assert.ok(decl);
        assert.strictEqual(decl!.type, 'enum');
        assert.strictEqual(decl!.name, 'Color');
    });

    test('finds interface', async () => {
        const doc = await createDoc('public interface MyInterface { }');
        const decl = findJavaTypeDeclaration(doc);
        assert.ok(decl);
        assert.strictEqual(decl!.type, 'interface');
        assert.strictEqual(decl!.name, 'MyInterface');
    });

    test('finds record', async () => {
        const doc = await createDoc('public record Point(int x, int y) { }');
        const decl = findJavaTypeDeclaration(doc);
        assert.ok(decl);
        assert.strictEqual(decl!.type, 'record');
        assert.strictEqual(decl!.name, 'Point');
    });

    test('finds @interface (annotation type)', async () => {
        const doc = await createDoc('public @interface MyAnnotation { }');
        const decl = findJavaTypeDeclaration(doc);
        assert.ok(decl);
        assert.strictEqual(decl!.type, '@interface');
        assert.strictEqual(decl!.name, 'MyAnnotation');
    });

    test('returns null for content without type declaration', async () => {
        const doc = await createDoc('int x = 5;');
        assert.strictEqual(findJavaTypeDeclaration(doc), null);
    });

    test('returns null for empty content', async () => {
        const doc = await createDoc('');
        assert.strictEqual(findJavaTypeDeclaration(doc), null);
    });

    test('finds first type declaration when multiple exist', async () => {
        const doc = await createDoc('public class Outer {\n' + '    class Inner { }\n' + '}');
        const decl = findJavaTypeDeclaration(doc);
        assert.ok(decl);
        assert.strictEqual(decl!.type, 'class');
        assert.strictEqual(decl!.name, 'Outer');
    });

    test('does not match non-class uses of "class" keyword', async () => {
        const doc = await createDoc('String klass = "hello";');
        assert.strictEqual(findJavaTypeDeclaration(doc), null);
    });
});

// ===========================================================================
// hasSerialVersionUID
// ===========================================================================
suite('hasSerialVersionUID', () => {
    test('returns true when serialVersionUID exists', async () => {
        const doc = await createDoc(
            'public class Foo {\n' + '    private static final long serialVersionUID = 1L;\n' + '}',
        );
        assert.strictEqual(hasSerialVersionUID(doc), true);
    });

    test('returns false when serialVersionUID is absent', async () => {
        const doc = await createDoc('public class Foo { }');
        assert.strictEqual(hasSerialVersionUID(doc), false);
    });

    test('ignores serialVersionUID inside single-line comment', async () => {
        const doc = await createDoc(
            'public class Foo {\n' +
                '    // private static final long serialVersionUID = 1L;\n' +
                '}',
        );
        assert.strictEqual(hasSerialVersionUID(doc), false);
    });

    test('ignores serialVersionUID inside block comment', async () => {
        const doc = await createDoc(
            'public class Foo {\n' +
                '    /* private static final long serialVersionUID = 1L; */\n' +
                '}',
        );
        assert.strictEqual(hasSerialVersionUID(doc), false);
    });

    test('returns false for serialVersionUID without L suffix', async () => {
        const doc = await createDoc(
            'public class Foo {\n' + '    private static final long serialVersionUID = 1;\n' + '}',
        );
        assert.strictEqual(hasSerialVersionUID(doc), false);
    });

    test('returns false for non-standard modifier order', async () => {
        const doc = await createDoc(
            'public class Foo {\n' + '    private final static long serialVersionUID = 1L;\n' + '}',
        );
        assert.strictEqual(hasSerialVersionUID(doc), false);
    });

    test('returns true for a large generated serialVersionUID', async () => {
        const doc = await createDoc(
            'public class Foo {\n' +
                '    private static final long serialVersionUID = 1234567890123456789L;\n' +
                '}',
        );
        assert.strictEqual(hasSerialVersionUID(doc), true);
    });

    test('detects serialVersionUID in an enum', async () => {
        const doc = await createDoc(
            'public enum Color {\n' +
                '    RED;\n' +
                '    private static final long serialVersionUID = 42L;\n' +
                '}',
        );
        assert.strictEqual(hasSerialVersionUID(doc), true);
    });
});

// ===========================================================================
// findInsertPosition
// ===========================================================================
suite('findInsertPosition', () => {
    // -------- K&R style (brace on same line) --------
    test('K&R style: inserts after brace line for class', async () => {
        const doc = await createDoc('public class Foo {\n' + '}');
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 1, 'should be line after the brace line');
        assert.strictEqual(pos.character, 0, 'should be at column 0');
    });

    test('K&R style: inserts at correct spot when class has members', async () => {
        const doc = await createDoc('public class Foo {\n' + '    private int x;\n' + '}');
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 1, 'should insert before first member on line 1');
        assert.strictEqual(pos.character, 0);
    });

    test('K&R style: interface', async () => {
        const doc = await createDoc('public interface MyInterface {\n' + '    void foo();\n' + '}');
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 0);
    });

    test('K&R style: record', async () => {
        const doc = await createDoc('public record Point(int x, int y) {\n' + '}');
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 0);
    });

    test('K&R style: @interface', async () => {
        const doc = await createDoc(
            'public @interface MyAnnotation {\n' + '    String value();\n' + '}',
        );
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 0);
    });

    // -------- Allman style (brace on next line) --------
    test('Allman style: inserts after brace line', async () => {
        const doc = await createDoc('public class Foo\n' + '{\n' + '}');
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 2, 'should be line after the { line');
        assert.strictEqual(pos.character, 0);
    });

    test('Allman style: with members present', async () => {
        const doc = await createDoc('public class Foo\n' + '{\n' + '    private int x;\n' + '}');
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 2);
        assert.strictEqual(pos.character, 0);
    });

    // -------- Mixed / annotations --------
    test('handles class with annotations before declaration', async () => {
        const doc = await createDoc('@Deprecated\n' + 'public class Foo {\n' + '}');
        const decl = findJavaTypeDeclaration(doc)!;
        assert.strictEqual(decl.name, 'Foo');
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 2, 'should skip annotation lines and find brace on line 1');
        assert.strictEqual(pos.character, 0);
    });

    // -------- Enum: special handling (insert after ;) --------
    test('enum: inserts after enum constant terminator', async () => {
        const doc = await createDoc(
            'public enum Color {\n' + '    RED,\n' + '    GREEN,\n' + '    BLUE;\n' + '}',
        );
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(
            pos.line,
            4,
            'should insert after the ; terminator on line 3 (line 4 in document)',
        );
        assert.strictEqual(pos.character, 0);
    });

    test('enum: inserts after semicolon when enum has members', async () => {
        const doc = await createDoc(
            'public enum Color {\n' +
                '    RED,\n' +
                '    GREEN,\n' +
                '    BLUE;\n' +
                '\n' +
                '    private String description;\n' +
                '\n' +
                '    public String getDescription() { return description; }\n' +
                '}',
        );
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 4, 'should insert after the ; terminator on line 3');
        assert.strictEqual(pos.character, 0);
    });

    test('enum: single constant with semicolon', async () => {
        const doc = await createDoc('public enum Color {\n' + '    RED;\n' + '}');
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 2, 'should insert after the RED; line');
        assert.strictEqual(pos.character, 0);
    });

    test('enum: with members and no constants (semicolon only)', async () => {
        const doc = await createDoc(
            'public enum Color {\n' + '    ;\n' + '    private String description;\n' + '}',
        );
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 2, 'should insert after the ; line');
        assert.strictEqual(pos.character, 0);
    });

    test('enum: with anonymous class bodies in constants', async () => {
        const doc = await createDoc(
            'public enum Color {\n' +
                '    RED {\n' +
                '        @Override\n' +
                '        public String toString() { return "red"; }\n' +
                '    },\n' +
                '    GREEN {\n' +
                '        @Override\n' +
                '        public String toString() { return "green"; }\n' +
                '    };\n' +
                '}',
        );
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 9, 'should insert after the }; terminator line');
        assert.strictEqual(pos.character, 0);
    });

    // -------- Fallback when no brace found --------
    test('returns fallback position when no brace exists', async () => {
        const doc = await createDoc('public class Foo\n' + '    int x;\n' + '    int y;');
        const decl = findJavaTypeDeclaration(doc)!;
        const pos = findInsertPosition(doc, decl.index, decl.type);
        assert.strictEqual(pos.line, 1);
        assert.strictEqual(pos.character, 0);
    });
});
