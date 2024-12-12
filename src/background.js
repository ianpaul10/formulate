const LLM_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

// Add logging utility
async function logDebug(type, message, data = null) {
  const result = await chrome.storage.local.get(['debugMode']);
  if (result.debugMode) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type}:`, message);
    if (data) {
      console.log("Data:", data);
    }
  }
}

const inputFormDataStructure = {
  type: "json_schema",
  json_schema: {
    name: "form_data_with_pii",
    schema: {
      type: "object",
      properties: {
        form_data: {
          type: "array",
          description:
            "A list of form data objects, each representing a form item.",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                description:
                  "The type of the form item, e.g., text, email, password.",
              },
              id: {
                type: "string",
                description: "The unique identifier of the form item.",
              },
              name: {
                type: "string",
                description: "The name attribute of the form item.",
              },
              placeholder: {
                type: "string",
                description: "Placeholder text for the form item.",
              },
              label: {
                type: "string",
                description: "Label for the form item, displayed to the user.",
              },
              xpath: {
                type: "string",
                description:
                  "The XPath expression to locate the form item in an HTML document.",
              },
            },
            required: ["type", "id", "name", "placeholder", "label", "xpath"],
            additionalProperties: false,
          },
        },
        pii_keys: {
          type: "array",
          description: "A list of keys representing PII items.",
          items: {
            type: "string",
            description:
              "A PII key such as date_of_birth, email, username, etc.",
          },
        },
        mappings: {
          type: "array",
          description:
            "A list of mappings between XPath of form items and PII items.",
          items: {
            type: "object",
            properties: {
              xpath: {
                type: "string",
                description: "The XPath of the form item.",
              },
              pii_key: {
                type: "string",
                description: "The corresponding PII key, if applicable.",
              },
            },
            required: ["xpath", "pii_key"],
            additionalProperties: false,
          },
        },
      },
      required: ["form_data", "pii_keys", "mappings"],
      additionalProperties: false,
    },
    strict: true,
  },
};

const outputFormDataStructure = {
  type: "json_schema",
  json_schema: {
    name: "form_data_with_pii",
    schema: {
      type: "object",
      properties: {
        mappings: {
          type: "array",
          description:
            "A list of mappings between XPath of form items and PII items.",
          items: {
            type: "object",
            properties: {
              xpath: {
                type: "string",
                description: "The XPath of the form item.",
              },
              piiKey: {
                type: "string",
                description:
                  "The corresponding PII key, if applicable. If you aren't able to correctly identify an appropriate PII key, you can leave this field as an empty string.",
              },
            },
            required: ["xpath", "piiKey"],
            additionalProperties: false,
          },
        },
      },
      required: ["mappings"],
      additionalProperties: false,
    },
    strict: true,
  },
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  logDebug("INFO", "Background script received message", request);

  if (request.action === "processFormStructure") {
    logDebug("INFO", "Processing form structure request", {
      tabId: sender.tab?.id,
      url: sender.tab?.url,
      formStructure: request.formStructure,
      piiKeys: request.piiKeys,
    });

    if (!request.formStructure || !request.piiKeys) {
      logDebug("ERROR", "Missing required data in request");
      sendResponse({ error: "Missing required data" });
      return true;
    }

    processWithLLM(request.formStructure, request.piiKeys)
      .then((mappings) => {
        logDebug("INFO", "Successfully processed form structure", mappings);
        sendResponse(mappings);
      })
      .catch((error) => {
        logDebug("ERROR", "Failed to process form structure", error);
        sendResponse({ error: error.message });
      });
    return true; // Will respond asynchronously
  } else {
    logDebug("WARNING", "Unknown action received", request.action);
  }
});

/**
 * Process form structure with LLM to get field mappings
 * @param {FormElement[]} formStructure - Array of form elements
 * @param {string[]} piiKeys - Array of available PII keys
 * @returns {Promise<LLMResponse>} Promise resolving to mapping response
 */
async function processWithLLM(formStructure, piiKeys) {
  logDebug("INFO", "Starting LLM processing");
  logDebug("DEBUG", "Form structure received", formStructure);
  logDebug("DEBUG", "PII keys received", piiKeys);

  const prompt = `
    Given an input form data object (specified in inputFormDataStructure) and available personal identification information (PII) keys (specified in piiKeys), determine the best mapping.
    Return a JSON array of mappings with xpath and piiKey for each field. If you are unsure if any of the piiKeys map to any of the xpath's, exclude it from the output.
    The given input data is in the next message.
    DO NOT HALUCINATE.
  `;

  try {
    // Get encrypted API key from storage
    const result = await chrome.storage.local.get(["encryptedApiKey"]);
    if (!result.encryptedApiKey) {
      logDebug("ERROR", "API key not found");
      throw new Error(
        "API key not found. Please set your OpenAI API key in the extension popup."
      );
    }
    
    // Decrypt API key
    const apiKey = await decrypt(result.encryptedApiKey, ENCRYPTION_PASSWORD);
    logDebug("INFO", "API key retrieved and decrypted successfully");

    const requestBody = {
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            inputFormDataStructure: inputFormDataStructure,
            formStructure: formStructure,
            piiKeys: piiKeys,
          }),
        },
      ],
      response_format: outputFormDataStructure,
    };

    logDebug("DEBUG", "Sending request to OpenAI API", {
      endpoint: LLM_API_ENDPOINT,
      body: requestBody,
    });

    const response = await fetch(LLM_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${result.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    logDebug("DEBUG", "Received response from OpenAI API", data);

    if (!response.ok) {
      logDebug("ERROR", "API request failed", {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
      throw new Error(
        `API request failed: ${data.error?.message || "Unknown error"}`
      );
    }

    // Parse and validate LLM response
    const mappings = JSON.parse(data.choices[0].message.content);
    logDebug("INFO", "Successfully parsed LLM response", mappings);
    return mappings;
  } catch (error) {
    logDebug("ERROR", "LLM processing error", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
