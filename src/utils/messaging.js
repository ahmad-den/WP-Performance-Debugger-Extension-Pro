/**
 * Safely sends a message to the extension runtime
 * @param {Object} message - The message to send
 * @param {Function} callback - Optional callback function
 */
export function safeSendMessage(message, callback) {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        return
      }
      if (callback) callback(response)
    })
  } catch (error) {
    // Extension context invalidated or other error
    console.debug("Message sending failed:", error)
  }
}

/**
 * Sends a message to a specific tab
 * @param {number} tabId - The ID of the tab to send the message to
 * @param {Object} message - The message to send
 * @param {Function} callback - Optional callback function
 */
export function sendMessageToTab(tabId, message, callback) {
  try {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        return
      }
      if (callback) callback(response)
    })
  } catch (error) {
    console.debug("Tab message sending failed:", error)
  }
}

/**
 * Sets up a listener for messages from content scripts or popup
 * @param {Object} handlers - Object mapping action names to handler functions
 */
export function setupMessageListener(handlers) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const action = message.action
    if (handlers[action]) {
      handlers[action](message, sender, sendResponse)
    }
    return true // Keep the message channel open for async responses
  })
}
