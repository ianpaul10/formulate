const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export const browserPolyfill = {
  storage: {
    local: browserAPI.storage.local,
  },
  runtime: {
    sendMessage: browserAPI.runtime.sendMessage,
    onMessage: browserAPI.runtime.onMessage,
    getURL: browserAPI.runtime.getURL,
    lastError: browserAPI.runtime.lastError,
  },
  tabs: {
    query: browserAPI.tabs.query,
    sendMessage: browserAPI.tabs.sendMessage,
  },
  scripting: {
    executeScript: browserAPI.scripting?.executeScript || 
      // Firefox uses tabs.executeScript
      function(params) {
        return browserAPI.tabs.executeScript(params.target.tabId, {
          file: params.files[0]
        });
      }
  }
};
