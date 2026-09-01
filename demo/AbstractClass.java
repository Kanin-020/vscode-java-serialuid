/**
 * Abstract class. The extension should detect "abstract class" and
 * insert serialVersionUID after the opening brace.
 */
public abstract class AbstractClass {

    protected String name;

    public AbstractClass(String name) {
        this.name = name;
    }

    public abstract void execute();

    public String getName() {
        return name;
    }
}
