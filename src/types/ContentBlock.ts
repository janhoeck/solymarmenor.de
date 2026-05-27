/**
 * This type represents a text. This text can contain normal text or a text with bulletpoints.
 */
export type ContentBlock = Array<string | { text?: string; bulletpoints: string[] }>
