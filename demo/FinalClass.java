/**
 * Final class. The extension should detect "final class" and
 * insert serialVersionUID after the opening brace.
 */
public final class FinalClass {

    private final int id;

    public FinalClass(int id) {
        this.id = id;
    }

    public int getId() {
        return id;
    }
}
