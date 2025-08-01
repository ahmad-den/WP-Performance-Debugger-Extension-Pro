/**
 * Module for managing detachable popup windows - Enhanced bounds validation
 */

import {
  getWindowState,
  setWindowState,
  getDetachedWindowId,
  setDetachedWindowId,
  getWindowBounds,
  setWindowBounds,
  setOriginalTabId,
  WINDOW_STATES,
  DEFAULT_WINDOW_CONFIG,
} from "../utils/window-state.js"

// Declare the chrome variable
const chrome = globalThis.chrome || self.chrome

// Track the current detached window
let detachedWindow = null

/**
 * Validates and corrects window bounds to ensure they're within screen limits
 * @param {Object} bounds - Window bounds to validate
 * @returns {Promise<Object>} Validated bounds
 */
async function validateWindowBounds(bounds) {
  try {
    // Get all available displays
    const displays = await new Promise((resolve) => {
      if (chrome.system && chrome.system.display) {
        chrome.system.display.getInfo((displays) => {
          if (chrome.runtime.lastError) {
            resolve([])
          } else {
            resolve(displays || [])
          }
        })
      } else {
        resolve([])
      }
    })

    // If we can't get display info, use safe defaults
    if (!displays || displays.length === 0) {
      console.log("No display info available, using safe defaults")
      return {
        left: 100,
        top: 100,
        width: Math.min(bounds.width || DEFAULT_WINDOW_CONFIG.width, 1200),
        height: Math.min(bounds.height || DEFAULT_WINDOW_CONFIG.height, 800),
      }
    }

    // Find the primary display or the largest one
    const primaryDisplay = displays.find((d) => d.isPrimary) || displays[0]
    const screenBounds = primaryDisplay.bounds

    console.log("Screen bounds:", screenBounds)
    console.log("Requested bounds:", bounds)

    // Calculate safe bounds
    const safeWidth = Math.min(bounds.width || DEFAULT_WINDOW_CONFIG.width, screenBounds.width - 100)
    const safeHeight = Math.min(bounds.height || DEFAULT_WINDOW_CONFIG.height, screenBounds.height - 100)

    // Ensure window is at least 50% within screen bounds
    const minLeft = screenBounds.left - Math.floor(safeWidth * 0.5)
    const maxLeft = screenBounds.left + screenBounds.width - Math.floor(safeWidth * 0.5)
    const minTop = screenBounds.top - Math.floor(safeHeight * 0.5)
    const maxTop = screenBounds.top + screenBounds.height - Math.floor(safeHeight * 0.5)

    let safeLeft = bounds.left || 100
    let safeTop = bounds.top || 100

    // Clamp to safe ranges
    safeLeft = Math.max(minLeft, Math.min(maxLeft, safeLeft))
    safeTop = Math.max(minTop, Math.min(maxTop, safeTop))

    // Additional safety check - ensure window is mostly visible
    if (safeLeft + safeWidth < screenBounds.left + 100) {
      safeLeft = screenBounds.left + 100
    }
    if (safeTop + safeHeight < screenBounds.top + 100) {
      safeTop = screenBounds.top + 100
    }

    const validatedBounds = {
      left: safeLeft,
      top: safeTop,
      width: safeWidth,
      height: safeHeight,
    }

    console.log("Validated bounds:", validatedBounds)
    return validatedBounds
  } catch (error) {
    console.error("Error validating window bounds:", error)
    // Return safe fallback bounds
    return {
      left: 100,
      top: 100,
      width: Math.min(bounds.width || DEFAULT_WINDOW_CONFIG.width, 1000),
      height: Math.min(bounds.height || DEFAULT_WINDOW_CONFIG.height, 700),
    }
  }
}

/**
 * Creates a detached popup window with validated bounds
 * @param {number} originalTabId - The ID of the original tab
 * @returns {Promise<chrome.windows.Window>} Created window
 */
export async function createDetachedWindow(originalTabId) {
  try {
    console.log("Creating detached window for tab:", originalTabId)

    // Get saved bounds or use defaults
    const savedBounds = await getWindowBounds()
    console.log("Saved bounds:", savedBounds)

    // Use saved bounds or defaults
    const requestedBounds = savedBounds || {
      left: 100,
      top: 100,
      width: DEFAULT_WINDOW_CONFIG.width,
      height: DEFAULT_WINDOW_CONFIG.height,
    }

    // Validate bounds to ensure they're within screen limits
    const validatedBounds = await validateWindowBounds(requestedBounds)

    // Include original tab ID in the URL
    const popupUrl = originalTabId
      ? `${chrome.runtime.getURL("popup.html")}?originalTabId=${originalTabId}`
      : chrome.runtime.getURL("popup.html")

    const windowConfig = {
      url: popupUrl,
      type: "popup",
      focused: true,
      ...validatedBounds,
    }

    console.log("Creating window with config:", windowConfig)

    const window = await chrome.windows.create(windowConfig)
    detachedWindow = window

    await setDetachedWindowId(window.id)
    await setWindowState(WINDOW_STATES.DETACHED)

    // Store the original tab ID in storage as backup
    if (originalTabId) {
      await setOriginalTabId(originalTabId)
    }

    console.log("Successfully created detached window with ID:", window.id)
    return window
  } catch (error) {
    console.error("Error creating detached window:", error)

    // Try with minimal safe bounds as fallback
    try {
      console.log("Attempting fallback window creation with minimal bounds")

      const fallbackConfig = {
        url: originalTabId
          ? `${chrome.runtime.getURL("popup.html")}?originalTabId=${originalTabId}`
          : chrome.runtime.getURL("popup.html"),
        type: "popup",
        focused: true,
        left: 100,
        top: 100,
        width: 600,
        height: 500,
      }

      const window = await chrome.windows.create(fallbackConfig)
      detachedWindow = window

      await setDetachedWindowId(window.id)
      await setWindowState(WINDOW_STATES.DETACHED)

      if (originalTabId) {
        await setOriginalTabId(originalTabId)
      }

      console.log("Fallback window creation successful:", window.id)
      return window
    } catch (fallbackError) {
      console.error("Fallback window creation also failed:", fallbackError)
      throw fallbackError
    }
  }
}

/**
 * Focuses the detached window if it exists
 * @returns {Promise<boolean>} True if window was focused successfully
 */
export async function focusDetachedWindow() {
  try {
    const windowId = await getDetachedWindowId()
    console.log("Attempting to focus detached window ID:", windowId)

    if (windowId) {
      try {
        // Check if window still exists
        const window = await chrome.windows.get(windowId)
        if (window) {
          console.log("Window found, focusing...")

          // Bring window to front and focus it
          await chrome.windows.update(windowId, {
            focused: true,
            state: "normal", // Ensure it's not minimized
          })

          // Additional focus attempt for better visibility
          setTimeout(async () => {
            try {
              await chrome.windows.update(windowId, { focused: true })
            } catch (e) {
              console.debug("Secondary focus attempt failed:", e)
            }
          }, 100)

          console.log("Successfully focused detached window")
          return true
        }
      } catch (error) {
        console.log("Window doesn't exist, cleaning up:", error)
        // Window doesn't exist, clean up
        await handleDetachedWindowClosed()
        return false
      }
    }

    console.log("No detached window ID found")
    return false
  } catch (error) {
    console.debug("Error focusing detached window:", error)
    return false
  }
}

/**
 * Handles cleanup when detached window is closed
 */
export async function handleDetachedWindowClosed() {
  console.log("Cleaning up detached window state")
  detachedWindow = null
  await setDetachedWindowId(null)
  await setWindowState(WINDOW_STATES.ATTACHED)
}

/**
 * Saves current window bounds before closing with validation
 * @param {number} windowId - Window ID to save bounds for
 */
export async function saveWindowBounds(windowId) {
  try {
    const window = await chrome.windows.get(windowId)

    // Only save bounds if they seem reasonable
    if (
      window.left >= -1000 &&
      window.top >= -1000 &&
      window.width >= 300 &&
      window.height >= 200 &&
      window.width <= 2000 &&
      window.height <= 1500
    ) {
      const bounds = {
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height,
      }

      await setWindowBounds(bounds)
      console.log("Saved window bounds:", bounds)
    } else {
      console.log("Window bounds seem invalid, not saving:", {
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height,
      })
    }
  } catch (error) {
    console.debug("Error saving window bounds:", error)
  }
}

/**
 * Attaches the popup back to the extension icon
 */
export async function attachPopup() {
  const windowId = await getDetachedWindowId()
  console.log("Attaching popup, current detached window ID:", windowId)

  if (windowId) {
    try {
      // Save bounds before closing
      await saveWindowBounds(windowId)
      await chrome.windows.remove(windowId)
      console.log("Closed detached window")
    } catch (error) {
      console.debug("Error closing detached window:", error)
    }
  }

  await handleDetachedWindowClosed()
}

/**
 * Gets the current window state
 * @returns {Promise<string>} Current window state
 */
export async function getCurrentWindowState() {
  return await getWindowState()
}

/**
 * Checks if a window ID matches our detached window
 * @param {number} windowId - Window ID to check
 * @returns {Promise<boolean>} True if it's our detached window
 */
export async function isDetachedWindow(windowId) {
  const detachedWindowId = await getDetachedWindowId()
  return detachedWindowId === windowId
}

/**
 * Resets stored window bounds (useful for debugging)
 */
export async function resetWindowBounds() {
  try {
    await setWindowBounds(null)
    console.log("Window bounds reset")
  } catch (error) {
    console.error("Error resetting window bounds:", error)
  }
}
