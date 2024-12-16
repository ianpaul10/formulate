import {
  debugLog,
  CONSTANTS,
  extractNestedKeys,
  getNestedValue,
} from "./utils.js";

import { getXPath } from "./form_input_listener.js";

/**
 * Extracts the structure of form elements from the current page
 * @returns {FormElement[]} Array of form elements with their properties
 */
function extractFormStructure() {
  const formElements = document.querySelectorAll("input, select, textarea");
  const formStructure = [];

  for (const element of formElements) {
    const inputElement =
      /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (
        element
      );
    formStructure.push({
      type: inputElement.type || inputElement.tagName.toLowerCase(),
      id: inputElement.id,
      name: inputElement.name,
      // @ts-ignore
      placeholder: inputElement.placeholder || "",
      label: findLabel(inputElement),
      xpath: getXPath(element),
    });
  }

  return formStructure;
}

/**
 * Finds the associated label text for a form element
 * @param {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} element - The form element to find label for
 * @returns {string} The label text or empty string if not found
 */
function findLabel(element) {
  let label = "";
  if (element.id) {
    const labelElement = document.querySelector(`label[for="${element.id}"]`);
    if (labelElement) label = labelElement.textContent?.trim() || "";
  }
  return label;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  debugLog("INFO", "Content script received message", request);

  if (request.action === "triggerAutofill") {
    debugLog("INFO", "Triggering autofill process");

    (async () => {
      try {
        const formStructure = extractFormStructure();
        debugLog("INFO", "Extracted form structure", formStructure);

        const piiData = await chrome.storage.local.get(["piiData"]);
        const piiKeys = extractNestedKeys(piiData.piiData || {});
        debugLog("INFO", "PII keys extracted");

        const response = await chrome.runtime.sendMessage({
          action: "processFormStructure",
          formStructure: formStructure,
          piiKeys: piiKeys,
        });

        debugLog("INFO", "Received response from background", response);

        if (response && response.mappings) {
          await fillForm(response.mappings, piiData.piiData);
          await chrome.runtime.sendMessage({
            action: "autofillComplete",
            success: true,
          });
        } else {
          debugLog("WARN", "No mappings in response:", response);
          await chrome.runtime.sendMessage({
            action: "autofillComplete",
            success: false,
            error: "No mappings received",
          });
        }
      } catch (error) {
        debugLog("ERROR", "Critical error in autofill process:", error);
        try {
          await chrome.runtime.sendMessage({
            action: "autofillComplete",
            success: false,
            error: error.message || "Failed to complete autofill",
          });
        } catch (sendError) {
          debugLog("ERROR", "Failed to send error message:", sendError);
        }
      }
    })();

    return false; // We're not using sendResponse
  }
});

/**
 * Fills form elements with PII data based on mappings
 * @param {Mapping[]} mappings - Array of xpath to PII key mappings
 * @param {Object.<string, string>} piiData - PII data object with key-value pairs
 */
async function fillForm(mappings, piiData) {
  for (const mapping of mappings) {
    debugLog("INFO", "Filling form element: ", mapping);
    const element = document.evaluate(
      mapping.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    const userVal = getNestedValue(mapping.piiKey, piiData);

    debugLog("INFO", "Found element:", { element });

    if (element && userVal && userVal !== "") {
      const inputElement =
        /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (
          element
        );
      inputElement.value = userVal;
      // Trigger change event
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      debugLog("INFO", "No PII data found for element:", mapping.piiKey);
    }
  }
}
