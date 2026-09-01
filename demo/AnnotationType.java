/**
 * Annotation type (@interface). The extension should detect "@interface" and
 * insert serialVersionUID after the opening brace.
 */
public @interface AnnotationType {

    String author() default "unknown";

    int version() default 1;

    String description();
}
