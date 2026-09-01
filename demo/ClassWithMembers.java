/**
 * Class with several fields and methods.
 * The extension should insert serialVersionUID right after the opening brace,
 * before the first field declaration.
 */
public class ClassWithMembers {

    private static final String GREETING = "Hello";

    private int counter;

    private String message;

    public ClassWithMembers(String message) {
        this.message = message;
    }

    public void increment() {
        counter++;
    }

    public int getCounter() {
        return counter;
    }

    public String getMessage() {
        return message;
    }

    @Override
    public String toString() {
        return GREETING + " " + message + " (#" + counter + ")";
    }
}
