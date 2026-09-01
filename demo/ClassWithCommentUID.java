/**
 * Class where serialVersionUID exists only inside a comment.
 * The extension should IGNORE the commented version and still show the
 * "Generate serialVersionUID" code action.
 *
 * Previously there was a serialVersionUID, but we commented it out:
 * // private static final long serialVersionUID = 1L;
 */
public class ClassWithCommentUID {

    private String value;

    public ClassWithCommentUID(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
