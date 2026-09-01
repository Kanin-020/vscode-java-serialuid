/**
 * Enum type. Although enums implicitly implement Serializable,
 * the extension should still detect "enum" and allow inserting serialVersionUID.
 */
public enum EnumType {
    LOW,
    MEDIUM,
    HIGH;

    private String description;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
