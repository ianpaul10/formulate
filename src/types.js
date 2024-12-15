/**
 * @typedef {Object} SelectOption
 * @property {string} value - Option value
 * @property {string} text - Option display text
 * @property {boolean} selected - Whether the option is selected
 */

/**
 * @typedef {Object} RadioGroupOption
 * @property {string} value - Radio button value
 * @property {string} label - Associated label
 * @property {boolean} checked - Whether the radio is checked
 */

/**
 * @typedef {Object} FormElement
 * @property {string} type - The type of form element (text, email, password, etc)
 * @property {string} id - Element ID
 * @property {string} name - Element name attribute
 * @property {string} placeholder - Placeholder text
 * @property {string} label - Associated label text
 * @property {string} xpath - XPath to locate the element
 * @property {boolean} required - Whether the field is required
 * @property {boolean} disabled - Whether the field is disabled
 * @property {SelectOption[]} [options] - Available options for select elements
 * @property {string} [min] - Minimum value for date/number inputs
 * @property {string} [max] - Maximum value for date/number inputs
 * @property {string} [step] - Step value for number inputs
 * @property {boolean} [checked] - Checked state for checkboxes/radios
 * @property {RadioGroupOption[]} [radioGroup] - Related radio buttons in the same group
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
