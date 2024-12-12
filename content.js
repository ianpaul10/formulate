// Load utils module dynamically
const utilsURL = chrome.runtime.getURL('utils.js');
let debugLog;

// Import the module
import(utilsURL).then(module => {
  debugLog = module.debugLog;
}).catch(err => {
  console.error('Failed to load utils module:', err);
});

/**
 * Extracts the structure of form elements from the current page
 * @returns {FormElement[]} Array of form elements with their properties
 */
function extractFormStructure() {
  const formElements = document.querySelectorAll("input, select, textarea");
  const formStructure = [];

  formElements.forEach((element) => {
    formStructure.push({
      type: element.type || element.tagName.toLowerCase(),
      id: element.id,
      name: element.name,
      placeholder: element.placeholder,
      label: findLabel(element),
      xpath: getXPath(element),
    });
  });

  return formStructure;
}

/**
 * Finds the associated label text for a form element
 * @param {HTMLElement} element - The form element to find label for
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

/**
 * Generates an XPath expression to locate an element
 * @param {HTMLElement} element - The element to generate XPath for
 * @returns {string} XPath expression
 */
function getXPath(element) {
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
    element = element.parentNode;
  }
  return "/" + parts.reverse().join("/");
}

// Listen for autofill trigger
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  debugLog("INFO", "Content script received message:", request);

  if (request.action === "triggerAutofill") {
    debugLog("INFO", "Triggering autofill process");

    // Using Promise.resolve().then() to handle async operations
    Promise.resolve().then(async () => {
      try {
        const formStructure = extractFormStructure();
        await debugLog("INFO", "Extracted form structure:", formStructure);

        // Get PII data keys (not values)
        const piiData = await chrome.storage.local.get(["piiData"]);
        const piiKeys = Object.keys(piiData.piiData || {});
        await debugLog("INFO", "PII keys extracted:", piiKeys);

        // Send to background script for LLM processing
        await debugLog("INFO", "Sending message to background script");
        chrome.runtime.sendMessage(
          {
            action: "processFormStructure",
            formStructure: formStructure,
            piiKeys: piiKeys,
          },
          function (response) {
            debugLog("INFO", "Received response from background:", response);
            if (response && response.mappings) {
              chrome.storage.local.get(["piiData"], function (result) {
                console.log("Got PII data for filling form");
                fillForm(response.mappings, result.piiData);
              });
            } else {
              console.error("No mappings in response:", response);
            }
          }
        );
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
function fillForm(mappings, piiData) {
  mappings.forEach(async (mapping) => {
    if (debugLog) {
      await debugLog("INFO", "Filling form element: ", mapping);
    }

    const element = document.evaluate(
      mapping.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    if (debugLog) {
      await debugLog("INFO", "Found element:", element);
    }

    if (element && piiData[mapping.piiKey]) {
      if (debugLog) {
        await debugLog("INFO", "Found PII data for element:", piiData[mapping.piiKey]);
      }
      // @ts-ignore
      element.value = piiData[mapping.piiKey];
      // Trigger change event
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      if (debugLog) {
        await debugLog("INFO", "No PII data found for element:", mapping.piiKey);
      }
    }
  });
}
