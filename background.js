// Replace with your actual API endpoint and key
const LLM_API_ENDPOINT = 'YOUR_LLM_API_ENDPOINT';
const API_KEY = 'YOUR_API_KEY';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "processFormStructure") {
    processWithLLM(request.formStructure, request.piiKeys)
      .then(mappings => sendResponse({mappings: mappings}))
      .catch(error => sendResponse({error: error.message}));
    return true; // Will respond asynchronously
  }
});

async function processWithLLM(formStructure, piiKeys) {
  const prompt = `
    Given a form structure and available PII keys, determine the best mapping.
    Form structure: ${JSON.stringify(formStructure)}
    Available PII keys: ${JSON.stringify(piiKeys)}
    Return a JSON array of mappings with xpath and piiKey for each field.
  `;

  try {
    const response = await fetch(LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 500
      })
    });

    const data = await response.json();
    // Parse and validate LLM response
    // This is a simplified example - you'll need to adapt based on your LLM's response format
    return JSON.parse(data.choices[0].text);
  } catch (error) {
    console.error('LLM processing error:', error);
    throw error;
  }
}
