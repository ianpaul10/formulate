/**
 * Gets a value from a nested object using a key path string with double underscores
 * @param {string} keyPath - The key path (e.g. "contact__phone__home")
 * @param {Object} obj - The object to extract the value from
 * @returns {any} The value at the key path, or undefined if not found
 * @example
 * // Returns "555-1234"
 * getNestedValue("contact__phone__home", {
 *   contact: { phone: { home: "555-1234" } }
 * })
 */
export function getNestedValue(keyPath, obj) {
  const keys = keyPath.split("__");
  // @ts-ignore
  return keys.reduce((value, key) => value?.[key], obj);
}

/**
 * Extracts all keys from a nested JSON object, concatenating nested keys with double underscores
 * @param {Object} obj - The object to extract keys from
 * @param {string} [prefix=''] - Internal use for recursion, leave empty when calling
 * @returns {string[]} Array of flattened key paths
 * @example
 * // Returns ['name', 'address__street', 'address__city', 'contact__email', 'contact__phone__home']
 * extractNestedKeys({
 *   name: 'John',
 *   address: { street: '123 Main St', city: 'Boston' },
 *   contact: { email: 'john@email.com', phone: { home: '555-1234' } }
 *   })
 */
export function extractNestedKeys(obj, prefix = "") {
  return Object.entries(obj).reduce((keys, [key, value]) => {
    const newKey = prefix ? `${prefix}__${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      // Recurse for nested objects
      return [...keys, ...extractNestedKeys(value, newKey)];
    }

    // Add the key (with prefix if it exists)
    return [...keys, newKey];
  }, []);
}

export async function isDebugEnabled() {
  const result = await chrome.storage.local.get(["debugMode"]);
  return result.debugMode || false;
}

/**
 * Logs a message to the console with a timestamp and type
 * @param {string} type - The type of message (INFO, WARN, ERROR)
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 * */
export async function debugLog(type, message, data = null) {
  if (await isDebugEnabled()) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type}:`, message, data);
  }
}

export const CONSTANTS = {
  STORAGE_KEYS: {
    DEBUG_MODE: "debugMode",
    API_KEY: "apiKey",
    PII_DATA: "piiData",
  },
};
