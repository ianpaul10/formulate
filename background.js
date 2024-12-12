const LLM_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

// Add logging utility
function logDebug(type, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${type}:`, message);
  if (data) {
    console.log('Data:', data);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "processFormStructure") {
    logDebug('INFO', 'Received processFormStructure request', {
      tabId: sender.tab?.id,
      url: sender.tab?.url
    });

    processWithLLM(request.formStructure, request.piiKeys)
      .then((mappings) => {
        logDebug('INFO', 'Successfully processed form structure', mappings);
        sendResponse({ mappings: mappings });
      })
      .catch((error) => {
        logDebug('ERROR', 'Failed to process form structure', error);
        sendResponse({ error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

async function processWithLLM(formStructure, piiKeys) {
  logDebug('INFO', 'Starting LLM processing');
  logDebug('DEBUG', 'Form structure received', formStructure);
  logDebug('DEBUG', 'PII keys received', piiKeys);

  const prompt = `
    Given a form structure and available PII keys, determine the best mapping.
    Form structure: ${JSON.stringify(formStructure)}
    Available PII keys: ${JSON.stringify(piiKeys)}
    Return a JSON array of mappings with xpath and piiKey for each field.
    DO NOT HALUCINATE.
  `;

  try {
    // Get API key from storage
    const result = await chrome.storage.local.get(['apiKey']);
    if (!result.apiKey) {
      logDebug('ERROR', 'API key not found');
      throw new Error('API key not found. Please set your OpenAI API key in the extension popup.');
    }
    logDebug('INFO', 'API key retrieved successfully');

    const requestBody = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    logDebug('DEBUG', 'Sending request to OpenAI API', {
      endpoint: LLM_API_ENDPOINT,
      body: requestBody
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
    logDebug('DEBUG', 'Received response from OpenAI API', data);

    if (!response.ok) {
      logDebug('ERROR', 'API request failed', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(`API request failed: ${data.error?.message || 'Unknown error'}`);
    }

    // Parse and validate LLM response
    const mappings = JSON.parse(data.choices[0].text);
    logDebug('INFO', 'Successfully parsed LLM response', mappings);
    return mappings;

  } catch (error) {
    logDebug('ERROR', 'LLM processing error', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}
