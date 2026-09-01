/**
 * Class that already has a serialVersionUID.
 * The extension should detect this and NOT show the "Generate serialVersionUID" action.
 */
public class ClassWithExistingUID {

    private static final long serialVersionUID = 42L;

    private String data;

    public ClassWithExistingUID(String data) {
        this.data = data;
    }

    public String getData() {
        return data;
    }
}
