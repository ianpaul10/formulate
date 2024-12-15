document.addEventListener("DOMContentLoaded", function () {
  // Load saved PII data, API key, and debug state
  chrome.storage.local.get(
    ["piiData", "apiKey", "debugMode"],
    function (result) {
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
    }
  );

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
        const piiData = JSON.parse(document.getElementById("piiData").value);
        const apiKey = document.getElementById("apiKey").value;

        if (!apiKey) {
          alert("Please enter your OpenAI API key");
          return;
        }

        const debugMode = document.getElementById("debugMode").checked;
        setButtonLoading("savePII", true);
        try {
          await new Promise((resolve, reject) => {
            chrome.storage.local.set(
              {
                piiData: piiData,
                apiKey: apiKey,
                debugMode: debugMode,
              },
              () => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve();
                }
              }
            );
          });
          alert("Personal information and API key saved successfully!");
        } catch (error) {
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
