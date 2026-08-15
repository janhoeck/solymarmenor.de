export type JsonLdProps = {
  data: object
}

/**
 * Renders a JSON-LD block.
 *
 * dangerouslySetInnerHTML rather than a child string, because React would
 * escape the quotes and leave Google unable to parse it. The `<` replacement
 * closes the one hole that matters: a "</script>" inside any string value
 * would otherwise end the block early. < is valid inside a JSON string,
 * so parsers read it as the character it is.
 */
export const JsonLd = (props: JsonLdProps) => (
  <script
    type='application/ld+json'
    dangerouslySetInnerHTML={{ __html: JSON.stringify(props.data).replace(/</g, '\\u003c') }}
  />
)
