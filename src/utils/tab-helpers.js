/**
 * Utility functions for tab management and verification
 */

import { getOriginalTabId, setOriginalTabId } from "./window-state.js"

// Declare chrome variable

/**
 * Gets the original tab ID from URL parameters or storage
 * @returns {Promise<number|null>} Original tab ID or null
 */
export async function getOriginalTabIdFromUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const tabIdFromUrl = urlParams.get("originalTabId")

    if (tabIdFromUrl) {
      const tabId = Number.parseInt(tabIdFromUrl, 10)
      console.log("Retrieved original tab ID from URL:", tabId)
      return tabId
    }

    // Fallback to storage
    const tabIdFromStorage = await getOriginalTabId()

    if (tabIdFromStorage) {
      console.log("Retrieved original tab ID from storage:", tabIdFromStorage)
      return tabIdFromStorage
    }

    console.log("No original tab ID found in URL or storage")
    return null
  } catch (error) {
    console.debug("Error getting original tab ID:", error)
    return null
  }
}

/**
 * Stores the original tab ID for future use
 * @param {number} tabId - The tab ID to store
 */
export async function storeOriginalTabId(tabId) {
  try {
    await setOriginalTabId(tabId)
    console.log("Stored original tab ID:", tabId)
  } catch (error) {
    console.debug("Error storing original tab ID:", error)
  }
}

/**
 * Verifies that a tab exists and is accessible
 * @param {number} tabId - The tab ID to verify
 * @returns {Promise<boolean>} True if tab exists and is accessible
 */
export async function verifyTabExists(tabId) {
  if (!tabId) return false

  try {
    return new Promise((resolve) => {
      chrome.tabs.get(Number.parseInt(tabId, 10), (tab) => {
        if (chrome.runtime.lastError) {
          console.debug(`Tab verification failed for ID ${tabId}:`, chrome.runtime.lastError.message)
          resolve(false)
        } else {
          console.log(`Tab ${tabId} verified:`, tab.url)
          resolve(true)
        }
      })
    })
  } catch (error) {
    console.debug("Exception during tab verification:", error)
    return false
  }
}

/**
 * Detects if we're in detached mode by checking URL parameters
 * @returns {boolean} True if in detached mode
 */
function isDetachedMode() {
  const urlParams = new URLSearchParams(window.location.search)
  const hasOriginalTabId = urlParams.has("originalTabId")
  console.log("Detached mode detection:", hasOriginalTabId, "URL:", window.location.href)
  return hasOriginalTabId
}

/**
 * Gets the target tab ID for messaging, automatically detecting attached vs detached mode
 * @returns {Promise<number|null>} Tab ID or null if not available
 */
export async function getTargetTabId() {
  try {
    const detachedMode = isDetachedMode()
    console.log("getTargetTabId called, detached mode:", detachedMode)

    if (detachedMode) {
      // In detached mode, use the original bound tab ID
      const originalTabId = await getOriginalTabIdFromUrl()
      console.log("Detached mode - original tab ID:", originalTabId)

      if (originalTabId) {
        // Verify the tab still exists
        const tabExists = await verifyTabExists(originalTabId)
        if (tabExists) {
          console.log("Using bound original tab ID for detached mode:", originalTabId)
          return originalTabId
        } else {
          console.log("Bound original tab no longer exists:", originalTabId)
          return null
        }
      }

      console.log("No bound tab ID available in detached mode")
      return null
    }

    // In attached mode, get the current active tab
    console.log("Attached mode - getting current active tab")
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        if (chrome.runtime.lastError || !activeTabs || activeTabs.length === 0) {
          console.log("No active tabs found in attached mode")
          resolve(null)
          return
        }

        const tabId = activeTabs[0].id
        console.log("Using current active tab ID for attached mode:", tabId)
        resolve(tabId)
      })
    })
  } catch (error) {
    console.debug("Error getting target tab ID:", error)
    return null
  }
}

/**
 * Sends a message to a content script with error handling
 * @param {number} tabId - The tab ID to send the message to
 * @param {Object} message - The message to send
 * @returns {Promise<Object|null>} Response from content script or null if failed
 */
export async function sendMessageToContentScript(tabId, message) {
  if (!tabId) {
    console.error("Cannot send message: No tab ID provided")
    return null
  }

  try {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(Number.parseInt(tabId, 10), message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(`Error sending message to tab ${tabId}:`, chrome.runtime.lastError.message)
          resolve(null)
        } else {
          console.log(`Message sent successfully to tab ${tabId}:`, message.action)
          resolve(response)
        }
      })
    })
  } catch (error) {
    console.error("Exception when sending message to content script:", error)
    return null
  }
}

/**
 * Shows minimal visual feedback on an element
 * @param {HTMLElement} element - The element to show feedback on
 * @param {string} type - The feedback type ('success', 'error')
 * @param {number} duration - Duration in milliseconds
 */
export function showElementFeedback(element, type = "success", duration = 1000) {
  if (!element) return

  const originalTransform = element.style.transform
  const originalTransition = element.style.transition

  // Add subtle visual feedback
  element.style.transition = "transform 0.1s ease"
  element.style.transform = "scale(0.95)"

  setTimeout(() => {
    element.style.transform = "scale(1)"

    setTimeout(() => {
      element.style.transform = originalTransform
      element.style.transition = originalTransition
    }, 100)
  }, 50)
}

// Legacy function names for compatibility (now just do minimal feedback)

/**
 * Refreshes the original tab ID in storage to maintain connection
 * @param {number} tabId - The tab ID to store
 * @returns {Promise<boolean>} Success status
 */
export async function refreshOriginalTabId(tabId) {
  try {
    if (!tabId) return false

    // Verify the tab still exists before storing
    const tabExists = await verifyTabExists(tabId)
    if (!tabExists) return false

    // Store the tab ID
    await setOriginalTabId(tabId)
    console.log("Refreshed original tab ID:", tabId)
    return true
  } catch (error) {
    console.debug("Error refreshing original tab ID:", error)
    return false
  }
}

/**
 * Gets the current active tab ID
 * @returns {Promise<number|null>} Current active tab ID or null
 */
export async function getCurrentActiveTabId() {
  try {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
          console.debug("No active tab found")
          resolve(null)
          return
        }
        const tabId = tabs[0].id
        console.log("Current active tab ID:", tabId, "URL:", tabs[0].url)
        resolve(tabId)
      })
    })
  } catch (error) {
    console.debug("Error getting current active tab ID:", error)
    return null
  }
}
