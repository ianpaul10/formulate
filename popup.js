document.addEventListener('DOMContentLoaded', function() {
  // Load saved PII data and API key
  chrome.storage.local.get(['piiData', 'apiKey'], function(result) {
    if (result.piiData) {
      document.getElementById('piiData').value = JSON.stringify(result.piiData, null, 2);
    }
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
  });

  // Save PII data and API key
  document.getElementById('savePII').addEventListener('click', function() {
    try {
      const piiData = JSON.parse(document.getElementById('piiData').value);
      const apiKey = document.getElementById('apiKey').value;
      
      if (!apiKey) {
        alert('Please enter your OpenAI API key');
        return;
      }

      chrome.storage.local.set({ 
        piiData: piiData,
        apiKey: apiKey 
      }, function() {
        alert('Personal information and API key saved successfully!');
      });
    } catch (e) {
      alert('Invalid JSON format. Please check your input.');
    }
  });

  // Trigger autofill
  document.getElementById('autofill').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "triggerAutofill"});
    });
  });
});
