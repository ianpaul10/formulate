import { debugLog } from "./utils.js";

/**
 * Monitors and saves form input values to chrome storage
 * Stores values in a nested structure where the top level key is the URL
 * and nested keys are xpaths of the form elements
 * @param {Event} event - Input or change event from form element
 * @returns {Promise<void>}
 */
async function handleFormInput(event) {
  const element =
    /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (
      event.target
    );
  if (!element || !["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName))
    return;

  const url = window.location.href;
  const xpath = getXPath(element);
  const value = element.value;

  const storage = await chrome.storage.local.get(["piiData"]);
  const piiData = storage.piiData || {};

  // Create nested structure if it doesn't exist
  if (!piiData[url]) {
    piiData[url] = {};
  }

  // Store the value with xpath as key. Will overwrite any prev values. That might be a feature or a bug, idk yet
  piiData[url][xpath] = value;

  await chrome.storage.local.set({ piiData });
  debugLog("INFO", "Saved form input", { url, xpath, value });
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
 * to capture all form input changes on the page
 * @returns {void}
 */
function setupFormMonitoring() {
  document.addEventListener("input", handleFormInput, true);
  document.addEventListener("change", handleFormInput, true);
  debugLog("INFO", "Form monitoring initialized");
}

// Initialize form monitoring when script loads
setupFormMonitoring();

export { setupFormMonitoring, handleFormInput, getXPath };
