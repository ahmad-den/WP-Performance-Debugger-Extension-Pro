/**
 * Module for managing popup window state in the UI
 */

import { safeSendMessage } from "../utils/messaging.js"
import { isCurrentWindowDetached, clearOriginalTabId } from "../utils/window-state.js"

/**
 * Detaches the current popup into a separate window
 * @returns {Promise<boolean>} Success status
 */
export async function detachPopup() {
  return new Promise((resolve) => {
    safeSendMessage({ action: "detachPopup" }, (response) => {
      if (response && response.success) {
        // Close current popup window
        window.close()
        resolve(true)
      } else {
        console.error("Failed to detach popup:", response?.error)
        resolve(false)
      }
    })
  })
}

/**
 * Attaches the popup back to the extension icon
 * @returns {Promise<boolean>} Success status
 */
export async function attachPopup() {
  return new Promise((resolve) => {
    safeSendMessage({ action: "attachPopup" }, async (response) => {
      if (response && response.success) {
        // Clear the stored original tab ID
        await clearOriginalTabId()

        // Close current detached window
        window.close()
        resolve(true)
      } else {
        console.error("Failed to detach popup:", response?.error)
        resolve(false)
      }
    })
  })
}

/**
 * Gets the current window state from background
 * @returns {Promise<string>} Current window state
 */
export async function getWindowStateFromBackground() {
  return new Promise((resolve) => {
    safeSendMessage({ action: "getWindowState" }, (response) => {
      resolve(response?.state || "attached")
    })
  })
}

/**
 * Checks if the current popup is running in a detached window
 * Uses multiple detection methods for accuracy
 * @returns {Promise<boolean>} True if detached
 */
export async function isDetachedWindow() {
  try {
    // Method 1: Check against stored detached window ID
    const isDetachedById = await isCurrentWindowDetached()

    // Method 2: Check window characteristics
    const hasLargerDimensions = window.outerWidth > 650 || window.outerHeight > 650
    const isExtensionUrl = window.location.protocol === "chrome-extension:"

    // Method 3: Check background state
    const backgroundState = await getWindowStateFromBackground()
    const isDetachedByState = backgroundState === "detached"

    // Method 4: Check window type (detached windows have different properties)
    const isPopupWindow = window.opener === null && window.parent === window

    // Combine all methods for accurate detection
    const isDetached = (isDetachedById || isDetachedByState) && hasLargerDimensions && isExtensionUrl && isPopupWindow

    console.log("Detached window detection:", {
      isDetachedById,
      hasLargerDimensions,
      isExtensionUrl,
      isDetachedByState,
      isPopupWindow,
      finalResult: isDetached,
    })

    return isDetached
  } catch (error) {
    console.debug("Error detecting detached window:", error)
    return false
  }
}

/**
 * Applies detached mode styling to the UI
 * @param {boolean} isDetached - Whether we're in detached mode
 */
export function applyDetachedModeStyles(isDetached) {
  if (isDetached) {
    document.body.classList.add("detached-mode")
    document.querySelector(".container")?.classList.add("detached-mode")
  } else {
    document.body.classList.remove("detached-mode")
    document.querySelector(".container")?.classList.remove("detached-mode")
  }
}

/**
 * Updates the window control button icon and tooltip based on current state
 * @param {boolean} isDetached - Whether we're in detached mode
 * @param {HTMLElement} button - The button element to update
 */
export function updateWindowControlButton(isDetached, button) {
  if (!button) return

  const icon = button.querySelector(".window-toggle-icon")
  if (!icon) return

  if (isDetached) {
    // Show "Attach" icon when in detached mode - dock/attach back to extension
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    </svg>`
    button.title = "Attach popup back to extension icon"
  } else {
    // Show "Open in new window" icon when in attached mode - like the one in your screenshot
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 3h6v6"/>
      <path d="M10 14 21 3"/>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    </svg>`
    button.title = "Open popup in separate window"
  }
}
