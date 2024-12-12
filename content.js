/**
 * Extracts the structure of form elements from the current page
 * @returns {FormElement[]} Array of form elements with their properties
 */
function extractFormStructure() {
  const formElements = document.querySelectorAll("input, select, textarea");
  const formStructure = [];

  formElements.forEach((element) => {
    // Cast element to HTMLInputElement or similar
    const inputElement = /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (element);
    formStructure.push({
      type: inputElement.type || inputElement.tagName.toLowerCase(),
      id: inputElement.id,
      name: inputElement.name,
      placeholder: inputElement.placeholder || '',
      label: findLabel(inputElement),
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

/**
 * Generates an XPath expression to locate an element
 * @param {HTMLElement} element - The element to generate XPath for
 * @returns {string} XPath expression
 */
/**
 * Generates an XPath expression to locate an element
 * @param {Element} element - The element to generate XPath for
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
  chrome.storage.local.get(["debugMode"], function (result) {
    if (result.debugMode) {
      console.log("Content script received message:", request);
    }
  });

  if (request.action === "triggerAutofill") {
    chrome.storage.local.get(["debugMode"], function (result) {
      if (result.debugMode) {
        console.log("Triggering autofill process");
      }
    });

    // Using Promise.resolve().then() to handle async operations
    Promise.resolve().then(async () => {
      try {
        const formStructure = extractFormStructure();
        const debug = (await chrome.storage.local.get(["debugMode"])).debugMode;
        if (debug) {
          console.log("Extracted form structure:", formStructure);
        }

        // Get PII data keys (not values)
        const piiData = await chrome.storage.local.get(["piiData"]);
        const piiKeys = Object.keys(piiData.piiData || {});
        if (debug) {
          console.log("PII keys extracted:", piiKeys);
        }

        // Send to background script for LLM processing
        if (debug) {
          console.log("Sending message to background script");
        }
        chrome.runtime.sendMessage(
          {
            action: "processFormStructure",
            formStructure: formStructure,
            piiKeys: piiKeys,
          },
          function (response) {
            if (debug) {
              console.log("Received response from background:", response);
            }
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
  mappings.forEach((mapping) => {
    chrome.storage.local.get(["debugMode"], function (result) {
      if (result.debugMode) {
        console.log("Filling form element: ", mapping);
      }
    });

    const element = document.evaluate(
      mapping.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    chrome.storage.local.get(["debugMode"], function (result) {
      if (result.debugMode) {
        console.log("Found element:", element);
      }
    });

    if (element && piiData[mapping.piiKey]) {
      chrome.storage.local.get(["debugMode"], function (result) {
        if (result.debugMode) {
          console.log("Found PII data for element:", piiData[mapping.piiKey]);
        }
      });
      // Cast element to input type
      const inputElement = /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} */ (element);
      inputElement.value = piiData[mapping.piiKey];
      // Trigger change event
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      chrome.storage.local.get(["debugMode"], function (result) {
        if (result.debugMode) {
          console.log("No PII data found for element:", mapping.piiKey);
        }
      });
    }
  });
}
