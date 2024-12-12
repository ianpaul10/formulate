export async function isDebugEnabled() {
  const result = await chrome.storage.local.get(["debugMode"]);
  return result.debugMode || false;
}

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
