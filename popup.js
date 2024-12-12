import { debugLog } from './utils.js';

document.addEventListener("DOMContentLoaded", function () {
  // Load saved PII data, API key, and debug state
  chrome.storage.local.get(["piiData", "apiKey", "debugMode"], function (result) {
    if (result.piiData) {
      document.getElementById("piiData").value = JSON.stringify(
        result.piiData,
        null,
        2
      );
    }
    if (result.apiKey) {
      document.getElementById("apiKey").value = result.apiKey;
    }
    if (result.debugMode) {
      document.getElementById("debugMode").checked = result.debugMode;
    }
  });

  // Save PII data and API key
  document.getElementById("savePII").addEventListener("click", function () {
    try {
      const piiData = JSON.parse(document.getElementById("piiData").value);
      const apiKey = document.getElementById("apiKey").value;

      if (!apiKey) {
        alert("Please enter your OpenAI API key");
        return;
      }

      console.log("GOT API KEY!!!");

      const debugMode = document.getElementById("debugMode").checked;
      chrome.storage.local.set(
        {
          piiData: piiData,
          apiKey: apiKey,
          debugMode: debugMode,
        },
        function () {
          alert("Personal information and API key saved successfully!");
        }
      );
    } catch (e) {
      alert("Invalid JSON format. Please check your input.");
    }
  });

  // Trigger autofill
  document.getElementById("autofill").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // First ensure the content script is injected
      chrome.scripting
        .executeScript({
          target: { tabId: tabs[0].id },
          files: ["utils.js", "content.js"],
          world: "MAIN"
        })
        .then(() => {
          // Then send the message
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "triggerAutofill" },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError);
                alert(
                  "Error: Could not connect to the page. Please refresh and try again."
                );
              }
            }
          );
        })
        .catch((err) => {
          console.error("Script injection failed:", err);
          alert(
            "Error: Could not inject content script. Please check console for details."
          );
        });
    });
  });
});
