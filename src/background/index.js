/**
 * Background service worker for the BigScoots Performance Debugger extension
 */

import { cleanupTab } from "./tab-manager.js"
import {
  cleanupTabParameters,
  getParametersFromUrl,
  updateUrlWithParameters,
  getTabParameters,
} from "./parameter-manager.js"
import { setupMessageHandlers, handleExtensionIconClick } from "./message-handler.js"
import { handleDetachedWindowClosed, saveWindowBounds, isDetachedWindow } from "./window-manager.js"

// Declare chrome variable

// Set up message handlers
setupMessageHandlers(chrome)

// Handle extension icon clicks with proper async handling
chrome.action.onClicked.addListener(async (tab) => {
  console.log("Extension icon clicked for tab:", tab.id)
  const handled = await handleExtensionIconClick()
  console.log("Icon click handled:", handled)

  // If handled is true, we focused a detached window and should prevent default popup
  // If handled is false, Chrome will show the default popup
})

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  cleanupTab(tabId)
  cleanupTabParameters(tabId)
})

// Handle navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    try {
      // Only handle main frame navigation
      const currentParams = getTabParameters(details.tabId)
      if (currentParams && currentParams.size > 0) {
        const urlParams = getParametersFromUrl(details.url)
        const mergedParams = new Set([...urlParams, ...currentParams])

        // Update URL only if new parameters were added
        if (mergedParams.size > urlParams.size) {
          const newUrl = updateUrlWithParameters(details.url, mergedParams)
          if (newUrl !== details.url) {
            chrome.tabs.update(details.tabId, { url: newUrl })
          }
        }
      }
    } catch (error) {
      // Silent error handling
    }
  }
})

// Handle window removal (for detached popup cleanup)
chrome.windows.onRemoved.addListener(async (windowId) => {
  // Check if this is our detached window
  const isOurWindow = await isDetachedWindow(windowId)
  if (isOurWindow) {
    console.log("Detached window closed, cleaning up")
    await handleDetachedWindowClosed()
  }
})

// Handle window bounds changes (save position when user moves/resizes)
chrome.windows.onBoundsChanged.addListener(async (window) => {
  const isOurWindow = await isDetachedWindow(window.id)
  if (isOurWindow) {
    await saveWindowBounds(window.id)
  }
})

console.log("BigScoots Performance Debugger background service worker initialized")
