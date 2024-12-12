// Function to extract form structure
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

// Helper function to find associated label
function findLabel(element) {
  let label = "";
  if (element.id) {
    const labelElement = document.querySelector(`label[for="${element.id}"]`);
    if (labelElement) label = labelElement.textContent.trim();
  }
  return label;
}

// Helper function to get XPath
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
  console.log("Content script received message:", request);

  if (request.action === "triggerAutofill") {
    console.log("Triggering autofill process");

    // Using Promise.resolve().then() to handle async operations
    Promise.resolve().then(async () => {
      try {
        const formStructure = extractFormStructure();
        console.log("Extracted form structure:", formStructure);

        // Get PII data keys (not values)
        const piiData = await chrome.storage.local.get(["piiData"]);
        const piiKeys = Object.keys(piiData.piiData || {});
        console.log("PII keys extracted:", piiKeys);

        // Send to background script for LLM processing
        console.log("Sending message to background script");
        chrome.runtime.sendMessage(
          {
            action: "processFormStructure",
            formStructure: formStructure,
            piiKeys: piiKeys,
          },
          function (response) {
            console.log("Received response from background:", response);
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

// Function to fill the form based on mappings
function fillForm(mappings, piiData) {
  mappings.forEach((mapping) => {
    const element = document.evaluate(
      mapping.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    if (element && piiData[mapping.piiKey]) {
      element.value = piiData[mapping.piiKey];
      // Trigger change event
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}
