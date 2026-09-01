/**
 * Record type (Java 14+). The extension should detect "record" and
 * insert serialVersionUID after the opening brace.
 */
public record RecordType(String name, int value) {

    public String toFormattedString() {
        return name + ": " + value;
    }
}
