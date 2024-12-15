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
/**
 * Extracts additional metadata from form elements based on their type
 * @param {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} element
 * @returns {Object} Additional metadata specific to the element type
 */
function extractElementMetadata(element) {
  const metadata = {};

  if (element instanceof HTMLSelectElement) {
    metadata.options = Array.from(element.options).map(option => ({
      value: option.value,
      text: option.text,
      selected: option.selected
    }));
  } else if (element instanceof HTMLInputElement) {
    switch (element.type) {
      case 'date':
        metadata.min = element.min || '';
        metadata.max = element.max || '';
        metadata.value = element.value || '';
        break;
      case 'radio':
      case 'checkbox':
        metadata.checked = element.checked;
        metadata.value = element.value;
        // Get all related radio buttons for the same name
        if (element.type === 'radio' && element.name) {
          const radioGroup = document.querySelectorAll(`input[type="radio"][name="${element.name}"]`);
          metadata.radioGroup = Array.from(radioGroup).map(radio => ({
            value: radio.value,
            label: findLabel(radio),
            checked: radio.checked
          }));
        }
        break;
      case 'number':
        metadata.min = element.min || '';
        metadata.max = element.max || '';
        metadata.step = element.step || '';
        break;
    }
  }

  return metadata;
}

function extractFormStructure() {
  const formElements = document.querySelectorAll("input, select, textarea");
  const formStructure = [];

  for (const element of formElements) {
    // Cast element to HTMLInputElement or similar
    const inputElement =
      /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (
        element
      );
    
    const metadata = extractElementMetadata(inputElement);
    
    formStructure.push({
      type: inputElement.type || inputElement.tagName.toLowerCase(),
      id: inputElement.id,
      name: inputElement.name,
      // @ts-ignore
      placeholder: inputElement.placeholder || "",
      label: findLabel(inputElement),
      xpath: getXPath(element),
      required: inputElement.required,
      disabled: inputElement.disabled,
      ...metadata
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
    if (labelElement) label = labelElement.textContent.trim();
  }
  return label;
}

// Listen for autofill trigger
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  debugLog("INFO", "Content script received message", request);

  if (request.action === "triggerAutofill") {
    debugLog("INFO", "Triggering autofill process");

    // Using Promise.resolve().then() to handle async operations
    Promise.resolve().then(async () => {
      try {
        const formStructure = extractFormStructure();
        debugLog("INFO", "Extracted form structure", formStructure);

        // Get PII data keys (NOT values)
        const piiData = await chrome.storage.local.get(["piiData"]);
        const piiKeys = extractNestedKeys(piiData.piiData || {});
        debugLog("INFO", "PII keys extracted");

        // Send to background script for LLM processing
        debugLog("INFO", "Sending message to background script");
        const response = await chrome.runtime.sendMessage({
          action: "processFormStructure",
          formStructure: formStructure,
          piiKeys: piiKeys,
        });

        debugLog("INFO", "Received response from background", response);

        if (response && response.mappings) {
          await fillForm(response.mappings, piiData.piiData);
          // Send completion message back to popup
          sendResponse({ success: true });
        } else {
          console.error("No mappings in response:", response);
          sendResponse({ error: "No mappings received" });
        }
      } catch (error) {
        console.error("Error in autofill process:", error);
      }
    });
  }
  return true; // Important: indicates we will send a response asynchronously
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

    if (element && userVal) {
      // Cast element to input type
      const inputElement =
        /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (
          element
        );

      if (inputElement instanceof HTMLSelectElement) {
        // Handle select elements
        const option = Array.from(inputElement.options).find(
          opt => opt.value === userVal || opt.text === userVal
        );
        if (option) {
          option.selected = true;
        }
      } else if (inputElement instanceof HTMLInputElement) {
        switch (inputElement.type) {
          case 'radio':
            // Find and select the correct radio button
            const radioGroup = document.querySelectorAll(
              `input[type="radio"][name="${inputElement.name}"]`
            );
            for (const radio of radioGroup) {
              radio.checked = radio.value === userVal;
            }
            break;
          case 'checkbox':
            inputElement.checked = userVal === 'true' || userVal === true;
            break;
          case 'date':
            // Ensure date is in YYYY-MM-DD format
            const dateVal = new Date(userVal);
            if (!isNaN(dateVal.getTime())) {
              inputElement.value = dateVal.toISOString().split('T')[0];
            }
            break;
          default:
            inputElement.value = userVal;
        }
      } else {
        inputElement.value = userVal;
      }

      // Trigger change event
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      debugLog("INFO", "No PII data found for element:", mapping.piiKey);
    }
  }
}
