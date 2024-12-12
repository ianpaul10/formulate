import { encrypt, decrypt } from './crypto.js';

// Encryption password - in a real app, you'd want to get this from the user
const ENCRYPTION_PASSWORD = 'your-secure-password-here';

document.addEventListener("DOMContentLoaded", async function () {
  // Load saved PII data, API key, and debug state
  const result = await chrome.storage.local.get(["encryptedPiiData", "encryptedApiKey", "debugMode"]);
  
  try {
    if (result.encryptedPiiData) {
      const decryptedPiiData = await decrypt(result.encryptedPiiData, ENCRYPTION_PASSWORD);
      document.getElementById("piiData").value = decryptedPiiData;
    }
    if (result.encryptedApiKey) {
      const decryptedApiKey = await decrypt(result.encryptedApiKey, ENCRYPTION_PASSWORD);
      document.getElementById("apiKey").value = decryptedApiKey;
    }
    if (result.debugMode) {
      document.getElementById("debugMode").checked = result.debugMode;
    }
  } catch (error) {
    console.error("Error decrypting data:", error);
    alert("Error loading encrypted data. Please check console for details.");
  }

  // Helper function to set loading state
  function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const spinner = button.querySelector(".spinner");
    button.disabled = isLoading;
    spinner.style.display = isLoading ? "inline-block" : "none";
  }

  // Save PII data and API key
  document
    .getElementById("savePII")
    .addEventListener("click", async function () {
      try {
        const piiData = document.getElementById("piiData").value;
        const apiKey = document.getElementById("apiKey").value;

        if (!apiKey) {
          alert("Please enter your OpenAI API key");
          return;
        }

        // Validate JSON format of PII data
        JSON.parse(piiData); // Will throw if invalid JSON

        const debugMode = document.getElementById("debugMode").checked;
        setButtonLoading("savePII", true);
        
        try {
          // Encrypt sensitive data
          const encryptedPiiData = await encrypt(piiData, ENCRYPTION_PASSWORD);
          const encryptedApiKey = await encrypt(apiKey, ENCRYPTION_PASSWORD);

          await chrome.storage.local.set({
            encryptedPiiData,
            encryptedApiKey,
            debugMode,
          });
          
          alert("Personal information and API key saved successfully!");
        } catch (error) {
          console.error("Error encrypting/saving data:", error);
          alert("Error saving data: " + error.message);
        } finally {
          setButtonLoading("savePII", false);
        }
      } catch (e) {
        alert("Invalid JSON format. Please check your input.");
      }
    });

  // Trigger autofill
  document
    .getElementById("autofill")
    .addEventListener("click", async function () {
      setButtonLoading("autofill", true);
      try {
        const tabs = await new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, resolve);
        });
        // First ensure the content script is injected
        chrome.scripting
          .executeScript({
            target: { tabId: tabs[0].id },
            files: ["src/content.js"],
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
                  setButtonLoading("autofill", false);
                } else if (response && response.error) {
                  console.error("Error:", response.error);
                  alert("Error: " + response.error);
                  setButtonLoading("autofill", false);
                } else if (response && response.success) {
                  setButtonLoading("autofill", false);
                }
              }
            );
          })
          .catch((err) => {
            console.error("Script injection failed:", err);
            alert(
              "Error: Could not inject content script. Please check console for details."
            );
            setButtonLoading("autofill", false);
          });
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please check the console for details.");
        setButtonLoading("autofill", false);
      }
    });
});
