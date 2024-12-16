import { debugLog } from "./utils.js";

/**
 * Safely executes chrome storage operations with error handling
 * @param {Function} storageOperation - The storage operation to perform
 * @returns {Promise<any>}
 */
async function safeStorageOperation(storageOperation) {
  try {
    return await storageOperation();
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      debugLog("INFO", "Extension context invalidated - page needs refresh");
      return null;
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Monitors and saves form input values to chrome storage
 * @param {Event} event - Input or change event from form element
 * @returns {Promise<void>}
 */
async function handleFormInput(event) {
  const element = /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (event.target);
  if (!element || !["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)) return;

  const url = window.location.href;
  const xpath = getXPath(element);
  const value = element.value;

  try {
    const storage = await safeStorageOperation(() => chrome.storage.local.get(["piiData"]));
    if (storage === null) return; // Extension context was invalidated

    const piiData = storage.piiData || {};
    if (!piiData[url]) {
      piiData[url] = {};
    }

    piiData[url][xpath] = value;

    await safeStorageOperation(() => chrome.storage.local.set({ piiData }));
    debugLog("INFO", "Saved form input", { url, xpath, value });
  } catch (error) {
    debugLog("ERROR", "Error saving form input:", error);
  }
}

/**
 * Generates an XPath expression to locate an element
 * @param {Element} element - The element to generate XPath for
 * @returns {string} XPath expression that uniquely identifies the element
 */
function getXPath(element) {
  // TODO: move this into the utils file maybe? Since it's getting refed int two diff files
  if (element.id) return `//*[@id="${element.id}"]`;
  const parts = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let nbOfPreviousSiblings = 0;
    let hasNextSiblings = false;
    let sibling = element.previousSibling;
    while (sibling) {
      if (
        sibling.nodeType !== Node.DOCUMENT_TYPE_NODE &&
        sibling.nodeName === element.nodeName
      ) {
        nbOfPreviousSiblings++;
      }
      sibling = sibling.previousSibling;
    }
    sibling = element.nextSibling;
    while (sibling) {
      if (sibling.nodeName === element.nodeName) {
        hasNextSiblings = true;
        break;
      }
      sibling = sibling.nextSibling;
    }
    const prefix = element.prefix ? element.prefix + ":" : "";
    const nth =
      nbOfPreviousSiblings || hasNextSiblings
        ? `[${nbOfPreviousSiblings + 1}]`
        : "";
    parts.push(prefix + element.localName + nth);
    // @ts-ignore
    element = element.parentNode;
  }
  return "/" + parts.reverse().join("/");
}

/**
 * Initializes form input monitoring by adding event listeners
 * @returns {void}
 */
function setupFormMonitoring() {
  try {
    document.addEventListener("input", handleFormInput, true);
    document.addEventListener("change", handleFormInput, true);
    debugLog("INFO", "Form monitoring initialized");
  } catch (error) {
    debugLog("ERROR", "Failed to setup form monitoring:", error);
  }
}

// Initialize form monitoring when script loads
setupFormMonitoring();

export { setupFormMonitoring, handleFormInput, getXPath };
