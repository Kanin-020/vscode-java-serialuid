/**
 * Interface type. The extension should detect "interface" and
 * allow generating serialVersionUID after the opening brace.
 */
public interface InterfaceType {

    String getGreeting();

    void execute(int times);

    default void printGreeting() {
        System.out.println(getGreeting());
    }
}
