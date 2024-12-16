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
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const activeTab = tabs[0];

        if (!activeTab?.id) {
          throw new Error("No active tab found");
        }

        // Setup completion listener before triggering autofill
        const handleAutofillComplete = (message) => {
          if (message.action === "autofillComplete") {
            setButtonLoading("autofill", false);
            chrome.runtime.onMessage.removeListener(handleAutofillComplete);

            if (!message.success) {
              console.error("Autofill failed:", message.error);
              alert("Autofill failed: " + (message.error || "Unknown error"));
            }
          }
        };

        chrome.runtime.onMessage.addListener(handleAutofillComplete);

        // Inject and execute content script
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["src/web_content_handler.js"],
        });

        // Trigger autofill
        await chrome.tabs.sendMessage(activeTab.id, {
          action: "triggerAutofill",
        });

        // Set a timeout to remove the listener and reset button state if no response
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(handleAutofillComplete);
          setButtonLoading("autofill", false);
        }, 10000); // 10 second timeout
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please check the console for details.");
        setButtonLoading("autofill", false);
      }
    });
});
