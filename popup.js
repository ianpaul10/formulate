document.addEventListener('DOMContentLoaded', function() {
  // Load saved PII data
  chrome.storage.local.get(['piiData'], function(result) {
    if (result.piiData) {
      document.getElementById('piiData').value = JSON.stringify(result.piiData, null, 2);
    }
  });

  // Save PII data
  document.getElementById('savePII').addEventListener('click', function() {
    try {
      const piiData = JSON.parse(document.getElementById('piiData').value);
      chrome.storage.local.set({ piiData: piiData }, function() {
        alert('Personal information saved successfully!');
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
