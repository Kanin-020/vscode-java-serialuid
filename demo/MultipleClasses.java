/**
 * File with an outer class and an inner class.
 * The extension should detect the FIRST type declaration (the outer class).
 * Nested class support is not implemented yet.
 */
public class MultipleClasses {

    private String outerField;

    public MultipleClasses(String outerField) {
        this.outerField = outerField;
    }

    public String getOuterField() {
        return outerField;
    }

    /**
     * Inner class. The extension currently only detects the first
     * type declaration, so this inner class would not be targeted.
     */
    public static class InnerClass {

        private int innerValue;

        public InnerClass(int innerValue) {
            this.innerValue = innerValue;
        }

        public int getInnerValue() {
            return innerValue;
        }
    }
}
