/**
 * Class with an annotation before the declaration.
 * The extension should skip the @Deprecated annotation line and
 * find the opening brace on the class declaration line.
 */
@Deprecated
public class AnnotatedClass {

    private String legacyData;

    public AnnotatedClass(String legacyData) {
        this.legacyData = legacyData;
    }

    public String getLegacyData() {
        return legacyData;
    }
}
