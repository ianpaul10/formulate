/**
 * Utility function for debug logging
 * @param {string} type - Log type (INFO, DEBUG, ERROR, etc)
 * @param {string} message - Message to log
 * @param {any} [data] - Optional data to log
 * @returns {Promise<void>}
 */
async function debugLog(type, message, data = null) {
  const result = await chrome.storage.local.get(["debugMode"]);
  if (result.debugMode) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type}:`, message);
    if (data) {
      console.log("Data:", data);
    }
  }
}

export { debugLog };
