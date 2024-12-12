/**
 * @typedef {Object} FormElement
 * @property {string} type - The type of form element (text, email, password, etc)
 * @property {string} id - Element ID
 * @property {string} name - Element name attribute
 * @property {string} placeholder - Placeholder text
 * @property {string} label - Associated label text
 * @property {string} xpath - XPath to locate the element
 */

/**
 * @typedef {Object} Mapping
 * @property {string} xpath - XPath to locate the form element
 * @property {string} piiKey - Key from PII data to use for this element
 */

/**
 * @typedef {Object} LLMResponse
 * @property {Mapping[]} mappings - Array of xpath to PII key mappings
 */

/**
 * @typedef {Object} FormStructureRequest
 * @property {'processFormStructure'} action - Action type
 * @property {FormElement[]} formStructure - Array of form elements
 * @property {string[]} piiKeys - Array of available PII keys
 */
