/**
 * Main popup script for the BigScoots Performance Debugger extension - Enhanced PSI support
 */

console.log("=== POPUP STARTING ===")
console.log("DOM readyState:", document.readyState)
console.log("Chrome API available:", typeof window.chrome !== "undefined")
console.log("Window location:", window.location.href)

// Import display modules
import { updateImageDisplay } from "./displays/image-display.js"
import { updateFontDisplay } from "./displays/font-display.js"
import { updateHeaderDisplay } from "./displays/header-display.js"
import {
  updateInsightsDisplay,
  updateCLSDisplay,
  updateLCPDisplay,
  updateINPDisplay,
  updateTTFBDisplay,
  updatePSICLSDisplay,
  updatePSILCPDisplay,
  updatePSIINPDisplay,
  updatePSITTFBDisplay,
  updatePSIStatus,
  updatePSILabCLSDisplay,
  updatePSILabLCPDisplay,
  resetDataAvailability,
  handleCompletePSIResults,
} from "./displays/insights-display.js"

// Import management modules
import { setupTabSwitching } from "./tab-manager.js"
import { setupToggleManagement } from "./toggle-manager.js"
import {
  detachPopup,
  attachPopup,
  isDetachedWindow,
  applyDetachedModeStyles,
  updateWindowControlButton,
} from "./window-state-manager.js"

// Import the tab helpers
import { getTargetTabId, getOriginalTabIdFromUrl, verifyTabExists } from "../utils/tab-helpers.js"

console.log("All modules imported successfully")

// Declare chrome variable

/**
 * Tab configuration
 */
const TABS = [
  { id: "imageAnalyzerTab", contentId: "imageAnalyzerContent" },
  { id: "fontAnalyzerTab", contentId: "fontAnalyzerContent" },
  { id: "headerAnalyzerTab", contentId: "headerAnalyzerContent" },
  { id: "insightsTab", contentId: "insightsContent" },
  { id: "perfmattersDebugTab", contentId: "perfmattersDebugContent" },
]

console.log("Testing tab elements...")
TABS.forEach((tab) => {
  const tabEl = document.getElementById(tab.id)
  const contentEl = document.getElementById(tab.contentId)
  console.log(`Tab ${tab.id}:`, !!tabEl, "Content:", !!contentEl)
})

// Store for cached data to persist across refreshes
let cachedAnalysisData = null
let isDetachedMode = false
let boundTabId = null // The tab this detached window is bound to
let boundTabUrl = null // The URL of the bound tab
let pollingInterval = null

/**
 * Sends a message to content script with retry logic and better error handling
 * @param {number} tabId - Tab ID to send message to
 * @param {Object} message - Message to send
 * @param {Function} callback - Callback function
 * @param {number} retries - Number of retries remaining
 */
function sendMessageWithRetry(tabId, message, callback, retries = 3) {
  console.log(`Sending message to tab ${tabId}:`, message.action, `(${retries} retries left)`)

  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      const errorMsg = chrome.runtime.lastError.message
      console.error(`Message to tab ${tabId} failed:`, errorMsg)

      // Check if it's a "receiving end does not exist" error
      if (errorMsg.includes("Receiving end does not exist") && retries > 0) {
        console.log(`Content script not ready, retrying in 1s... (${retries} retries left)`)
        setTimeout(() => {
          sendMessageWithRetry(tabId, message, callback, retries - 1)
        }, 1000)
        return
      }

      console.log(`Message failed after retries: ${errorMsg}`)
      if (callback) callback(null)
      return
    }

    console.log(`Message to tab ${tabId} successful, response:`, response)
    if (callback) callback(response)
  })
}

/**
 * Verifies content script is injected and ready
 * @param {number} tabId - Tab ID to check
 * @returns {Promise<boolean>} True if content script is ready
 */
async function verifyContentScriptReady(tabId) {
  console.log(`Verifying content script readiness for tab ${tabId}`)

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log(`Content script not ready for tab ${tabId}:`, chrome.runtime.lastError.message)
        resolve(false)
      } else {
        console.log(`Content script is ready for tab ${tabId}`)
        resolve(true)
      }
    })
  })
}

/**
 * Gets the correct tab ID for messaging, handling detached mode
 * @returns {Promise<number|null>} Tab ID or null if not available
 */
async function getTargetTabIdForMessaging() {
  // Use the improved getTargetTabId function that auto-detects mode
  const tabId = await getTargetTabId()
  console.log("Target tab ID for messaging:", tabId)
  return tabId
}

/**
 * Initializes detached mode binding
 */
async function initializeDetachedMode() {
  console.log("Initializing detached mode...")

  // Get original tab ID from URL
  const originalTabId = await getOriginalTabIdFromUrl()
  console.log("Original tab ID from URL:", originalTabId)

  if (!originalTabId) {
    console.error("No original tab ID found in detached mode")
    return false
  }

  // Verify the tab still exists
  const tabExists = await verifyTabExists(originalTabId)
  if (!tabExists) {
    console.error("Original tab no longer exists:", originalTabId)
    return false
  }

  // Set the bound tab ID
  boundTabId = originalTabId
  console.log("Detached mode: successfully bound to tab", boundTabId)

  // Get and store the tab URL
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getTabUrl", tabId: boundTabId }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message })
        } else {
          resolve(response)
        }
      })
    })

    if (response.success) {
      boundTabUrl = response.url
      console.log("Bound tab URL:", boundTabUrl)
      updateCurrentUrlDisplay(boundTabUrl)
    }
  } catch (error) {
    console.error("Error getting bound tab URL:", error)
  }

  return true
}

/**
 * Updates the current URL display in the header
 * @param {string} url - The URL to display
 */
function updateCurrentUrlDisplay(url) {
  console.log("Updating URL display:", url)
  const currentUrlElement = document.getElementById("currentUrl")
  const currentUrlValue = document.getElementById("currentUrlValue")

  if (currentUrlElement && currentUrlValue && url) {
    // Clean up the URL for display
    let displayUrl = url
    try {
      const urlObj = new URL(url)

      // Get hostname and pathname
      displayUrl = urlObj.hostname

      // Add pathname but remove trailing slash
      let pathname = urlObj.pathname
      if (pathname !== "/" && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1)
      }

      // Only add pathname if it's not just "/"
      if (pathname !== "/") {
        displayUrl += pathname
      }

      // Add search params if present
      if (urlObj.search) {
        displayUrl += urlObj.search
      }
    } catch (error) {
      // If URL parsing fails, use the original URL
      // Still try to remove trailing slash
      if (displayUrl.endsWith("/") && displayUrl.length > 1) {
        displayUrl = displayUrl.slice(0, -1)
      }
    }

    currentUrlValue.textContent = displayUrl
    currentUrlElement.classList.add("visible")

    // Store the bound tab URL in detached mode
    if (isDetachedMode) {
      boundTabUrl = url
    }
  } else if (currentUrlElement) {
    currentUrlElement.classList.remove("visible")
  }
}

/**
 * Updates the popup with analysis results
 */
async function updatePopupWithResults() {
  console.log("=== updatePopupWithResults called ===")

  try {
    // Show loading state - but don't fail if this doesn't work
    resetDataAvailability()
  } catch (error) {
    console.log("Could not update loading state:", error)
  }

  // Reset data availability when updating popup (new page/refresh)
  resetDataAvailability()

  // Clear any existing data displays immediately
  showEmptyStates()

  try {
    if (isDetachedMode) {
      console.log("Running in detached mode")

      if (!boundTabId) {
        console.error("No bound tab ID in detached mode")
        showEmptyStates()
        updateCurrentUrlDisplay("Tab not available")
        return
      }

      // Get analysis results for the bound tab
      console.log("Requesting analysis results for bound tab:", boundTabId)
      chrome.runtime.sendMessage({ action: "getAnalysisResults", tabId: boundTabId }, (data) => {
        if (chrome.runtime.lastError) {
          console.log("Error getting analysis results:", chrome.runtime.lastError)
          return
        }

        console.log("Analysis results received for bound tab:", data)
        if (data && Object.keys(data).length > 0) {
          // Verify the data is for the current URL
          if (boundTabUrl && data.url && data.url !== boundTabUrl) {
            console.log("Analysis data is for different URL, ignoring:", data.url, "vs", boundTabUrl)
            showEmptyStates()
            return
          }

          console.log("Displaying analysis data for bound tab")
          cachedAnalysisData = data
          displayAnalysisData(data)

          // Also update performance metrics from cached data
          updatePerformanceMetricsFromData(data)
        } else {
          console.log("No analysis data available for bound tab, requesting fresh analysis")
          sendMessageWithRetry(boundTabId, { action: "requestAnalysis" }, (response) => {
            if (response) {
              console.log("Fresh analysis requested successfully")
            }
          })
        }
      })

      // Get stored PSI results for the bound tab
      chrome.runtime.sendMessage({ action: "getPSIResults", tabId: boundTabId }, (psiData) => {
        if (chrome.runtime.lastError) {
          console.log("Error getting PSI results:", chrome.runtime.lastError)
          return
        }

        if (psiData && (psiData.allFieldData || psiData.allLabData)) {
          // Verify PSI data is for current URL
          if (boundTabUrl && psiData.url && psiData.url !== boundTabUrl) {
            console.log("PSI data is for different URL, ignoring:", psiData.url, "vs", boundTabUrl)
            return
          }

          console.log("Restoring PSI data from storage:", psiData)

          // Restore field data
          if (psiData.allFieldData) {
            restorePSIFieldData(psiData.allFieldData)
          }

          // Restore lab data
          if (psiData.allLabData) {
            restorePSILabData(psiData.allLabData)
          }

          // NEW: Restore PSI insights data for detached mode
          if (psiData.completeData) {
            console.log("Restoring PSI insights from storage in detached mode")
            handleCompletePSIResults(psiData.completeData)
          }

          updatePSIStatus({ status: "success", message: "PSI data restored" })
        }
      })

      // Get current performance data with better error handling
      console.log("Requesting current performance data for bound tab:", boundTabId)
      sendMessageWithRetry(boundTabId, { action: "getCurrentPerformanceData" }, (response) => {
        if (response) {
          console.log("Fresh performance data received:", response)
          updatePerformanceMetrics(response)

          // Merge with cached data if available
          if (cachedAnalysisData) {
            const mergedData = {
              cls: response.cls || cachedAnalysisData.cls,
              lcp: response.lcp || cachedAnalysisData.lcp,
              inp: response.inp || cachedAnalysisData.inp,
              additionalMetrics: response.additionalMetrics || cachedAnalysisData.additionalMetrics,
            }
            updatePerformanceMetrics(mergedData)
          }
        } else {
          console.log("No fresh performance data, using cached data if available")
          if (cachedAnalysisData) {
            updatePerformanceMetricsFromData(cachedAnalysisData)
          }
        }
      })

      return
    }

    // Attached mode logic
    console.log("Running in attached mode")
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      if (chrome.runtime.lastError || !activeTabs || activeTabs.length === 0) {
        console.log("No active tabs found in attached mode")
        showEmptyStates()
        return
      }

      const currentTabId = activeTabs[0].id
      const currentTab = activeTabs[0]

      console.log("Current tab ID:", currentTabId, "URL:", currentTab.url)

      // Update URL display
      if (currentTab.url) {
        updateCurrentUrlDisplay(currentTab.url)
      }

      // Query stored analysis results from background script
      console.log("Requesting analysis results for tab:", currentTabId)
      chrome.runtime.sendMessage({ action: "getAnalysisResults", tabId: currentTabId }, (data) => {
        if (chrome.runtime.lastError) {
          console.log("Error getting analysis results:", chrome.runtime.lastError)
          return
        }

        console.log("Analysis results received for tab", currentTabId, ":", data)
        if (data && Object.keys(data).length > 0) {
          // Verify the data is for the current URL
          if (currentTab.url && data.url && data.url !== currentTab.url) {
            console.log("Analysis data is for different URL, ignoring:", data.url, "vs", currentTab.url)
            showEmptyStates()
            // Request fresh analysis for current URL
            chrome.tabs.sendMessage(currentTabId, { action: "requestAnalysis" }, (response) => {
              if (chrome.runtime.lastError) {
                console.log("Content script not ready yet:", chrome.runtime.lastError)
              }
            })
            return
          }

          console.log("Received analysis data for current tab - displaying now")
          cachedAnalysisData = data
          displayAnalysisData(data)

          // Also update performance metrics from cached data
          updatePerformanceMetricsFromData(data)
        } else {
          console.log("No analysis data available, requesting fresh analysis")
          chrome.tabs.sendMessage(currentTabId, { action: "requestAnalysis" }, (response) => {
            if (chrome.runtime.lastError) {
              console.log("Content script not ready yet:", chrome.runtime.lastError)
            } else {
              console.log("Fresh analysis requested")
            }
          })
        }
      })

      // Get stored PSI results for the current tab
      chrome.runtime.sendMessage({ action: "getPSIResults", tabId: currentTabId }, (psiData) => {
        if (chrome.runtime.lastError) {
          console.log("Error getting PSI results:", chrome.runtime.lastError)
          return
        }

        if (psiData && (psiData.allFieldData || psiData.allLabData)) {
          // Verify PSI data is for current URL
          if (currentTab.url && psiData.url && psiData.url !== currentTab.url) {
            console.log("PSI data is for different URL, ignoring:", psiData.url, "vs", currentTab.url)
            return
          }

          console.log("Restoring PSI data from storage:", psiData)

          // Restore field data
          if (psiData.allFieldData) {
            restorePSIFieldData(psiData.allFieldData)
          }

          // Restore lab data
          if (psiData.allLabData) {
            restorePSILabData(psiData.allLabData)
          }

          // NEW: Restore PSI insights data
          if (psiData.completeData) {
            console.log("Restoring PSI insights from storage")
            handleCompletePSIResults(psiData.completeData)
          }

          updatePSIStatus({ status: "success", message: "PSI data restored" })
        }
      })

      // Query content script for current performance data
      console.log("Requesting current performance data for tab:", currentTabId)
      chrome.tabs.sendMessage(currentTabId, { action: "getCurrentPerformanceData" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("Content script message error:", chrome.runtime.lastError)

          // If we have cached performance data, use it
          if (cachedAnalysisData) {
            console.log("Using cached performance data from analysis results")
            updatePerformanceMetricsFromData(cachedAnalysisData)
          }
          return
        }

        console.log("Performance data received:", response)
        if (response) {
          updatePerformanceMetrics(response)
        } else {
          console.log("No fresh performance data, using cached data if available")
          if (cachedAnalysisData) {
            updatePerformanceMetricsFromData(cachedAnalysisData)
          }
        }
      })
    })
  } catch (error) {
    console.error("Error updating popup with results:", error)

    // Update error state
    try {
      const { updateInsightsState } = await import("./displays/insights-display.js")
      updateInsightsState({
        isLoading: false,
        hasError: true,
        errorMessage: "Failed to load performance data. Please refresh the page and try again.",
      })
    } catch (importError) {
      console.error("Could not update error state:", importError)
    }

    showEmptyStates()
  }
}

/**
 * Updates performance metrics from cached analysis data
 * @param {Object} data - Cached analysis data
 */
function updatePerformanceMetricsFromData(data) {
  console.log("=== updatePerformanceMetricsFromData called ===")
  console.log("Using cached data for performance metrics:", data)

  if (data.cls) {
    console.log("Updating CLS from cached data:", data.cls)
    updateCLSDisplay(data.cls)
  }

  if (data.lcp) {
    console.log("Updating LCP from cached data:", data.lcp)
    updateLCPDisplay(data.lcp)
  }

  if (data.inp) {
    console.log("Updating INP from cached data:", data.inp)
    updateINPDisplay(data.inp)
  }

  if (data.additionalMetrics) {
    console.log("Updating TTFB from cached data:", data.additionalMetrics)
    updateTTFBDisplay(data.additionalMetrics)
  }
}

/**
 * Restores PSI field data for all metrics
 * @param {Object} allFieldData - All PSI field data
 */
function restorePSIFieldData(allFieldData) {
  console.log("Restoring PSI field data:", allFieldData)

  if (allFieldData.cls) {
    updatePSICLSDisplay(allFieldData.cls)
  }

  if (allFieldData.lcp) {
    updatePSILCPDisplay(allFieldData.lcp)
  }

  if (allFieldData.inp) {
    updatePSIINPDisplay(allFieldData.inp)
  }

  if (allFieldData.ttfb) {
    updatePSITTFBDisplay(allFieldData.ttfb)
  }
}

/**
 * Restores PSI lab data for all metrics
 * @param {Object} allLabData - All PSI lab data
 */
function restorePSILabData(allLabData) {
  console.log("Restoring PSI lab data:", allLabData)

  if (allLabData.labCLS) {
    updatePSILabCLSDisplay(allLabData.labCLS)
  }

  if (allLabData.labLCP) {
    updatePSILabLCPDisplay(allLabData.labLCP)
  }
}

/**
 * Displays analysis data in the UI
 * @param {Object} data - Analysis data to display
 */
function displayAnalysisData(data) {
  console.log("=== displayAnalysisData called ===")
  console.log("Data received:", data)

  if (data.images) {
    console.log("Updating images:", data.images.length)
    updateImageDisplay(data.images)
  } else {
    console.log("No images data, showing empty state")
    updateImageDisplay([])
  }

  if (data.fonts) {
    console.log("Updating fonts:", data.fonts.length)
    updateFontDisplay(data.fonts)
  } else {
    console.log("No fonts data, showing empty state")
    updateFontDisplay([])
  }

  if (data.headers) {
    console.log("Updating headers")
    updateHeaderDisplay(data.headers)
  } else {
    console.log("No headers data, showing empty state")
    updateHeaderDisplay({})
  }

  console.log("Updating insights display")
  updateInsightsDisplay(data)
}

/**
 * Updates performance metrics
 * @param {Object} response - Performance data response
 */
function updatePerformanceMetrics(response) {
  console.log("=== updatePerformanceMetrics called ===")
  console.log("Performance data:", response)

  if (response.cls) {
    console.log("Updating CLS display with fresh data")
    updateCLSDisplay(response.cls)
  }
  if (response.lcp) {
    console.log("Updating LCP display with fresh data")
    updateLCPDisplay(response.lcp)
  }
  if (response.inp) {
    console.log("Updating INP display with fresh data")
    updateINPDisplay(response.inp)
  }
  if (response.additionalMetrics) {
    console.log("Updating TTFB display with fresh data")
    updateTTFBDisplay(response.additionalMetrics)
  }
}

/**
 * Shows empty states for all displays
 */
function showEmptyStates() {
  console.log("=== Setting empty states ===")
  updateImageDisplay([])
  updateFontDisplay([])
  updateHeaderDisplay({})
  updateInsightsDisplay({})
}

/**
 * Sets up periodic polling for performance data
 */
function setupPeriodicPolling() {
  console.log("Setting up periodic polling")

  // Clear existing interval if any
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }

  pollingInterval = setInterval(async () => {
    if (!isDetachedMode) {
      return
    }

    if (boundTabId) {
      const tabExists = await verifyTabExists(boundTabId)
      if (!tabExists) {
        console.log("Bound tab no longer exists:", boundTabId)
        showEmptyStates()
        updateCurrentUrlDisplay("Tab closed or unavailable")

        // Clear the interval since tab is gone
        if (pollingInterval) {
          clearInterval(pollingInterval)
          pollingInterval = null
        }
        return
      }

      chrome.tabs.sendMessage(boundTabId, { action: "getCurrentPerformanceData" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("Error polling bound tab:", chrome.runtime.lastError)
          return
        }

        if (response) {
          updatePerformanceMetrics(response)
        }
      })
    }
  }, 3000) // Increased from 2000ms to 3000ms for better performance
}

// Add cleanup when window is closed
window.addEventListener("beforeunload", () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
})

/**
 * Sets up message listeners for updates from content script
 */
function setupMessageListeners() {
  console.log("Setting up message listeners")
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Popup received message:", message.action, "from sender:", sender)

    // In detached mode, only process messages from the bound tab
    if (isDetachedMode && boundTabId) {
      if (sender.tab && sender.tab.id !== boundTabId) {
        console.log("Ignoring message from non-bound tab:", sender.tab.id, "bound to:", boundTabId)
        return
      }

      // Special handling for tab URL changes
      if (message.action === "tabUrlChanged" && message.tabId === boundTabId) {
        console.log("Bound tab URL changed:", message.url)
        updateCurrentUrlDisplay(message.url)
      }
    }

    // Process performance updates
    if (message.action === "updateCLS") {
      console.log("Received CLS update")
      updateCLSDisplay(message)
    } else if (message.action === "updateLCP") {
      console.log("Received LCP update")
      updateLCPDisplay(message)
    } else if (message.action === "updateINP") {
      console.log("Received INP update")
      updateINPDisplay(message)
    } else if (message.action === "updateAdditionalMetrics") {
      console.log("Received additional metrics update")
      updateTTFBDisplay(message.metrics)
    } else if (message.action === "analysisResults") {
      // Only process analysis results from the bound tab in detached mode
      if (isDetachedMode && boundTabId) {
        if (sender.tab && sender.tab.id === boundTabId) {
          console.log("Received fresh analysis results from bound tab")
          cachedAnalysisData = message
          displayAnalysisData(message)
          // Also update performance metrics
          updatePerformanceMetricsFromData(message)
        }
      } else if (!isDetachedMode) {
        // In attached mode, process all analysis results
        console.log("Received fresh analysis results in attached mode")
        cachedAnalysisData = message
        displayAnalysisData(message)
        // Also update performance metrics
        updatePerformanceMetricsFromData(message)
      }
    }
    // Enhanced PSI message handling
    else if (message.action === "updatePSICLS") {
      console.log("Received PSI CLS update")
      updatePSICLSDisplay(message.fieldData)
    } else if (message.action === "updatePSILCP") {
      console.log("Received PSI LCP update")
      updatePSILCPDisplay(message.fieldData)
    } else if (message.action === "updatePSIINP") {
      console.log("Received PSI INP update")
      updatePSIINPDisplay(message.fieldData)
    } else if (message.action === "updatePSITTFB") {
      console.log("Received PSI TTFB update")
      updatePSITTFBDisplay(message.fieldData)
    } else if (message.action === "updatePSILabCLS") {
      console.log("Received PSI Lab CLS update")
      updatePSILabCLSDisplay(message.labData)
    } else if (message.action === "updatePSILabLCP") {
      console.log("Received PSI Lab LCP update")
      updatePSILabLCPDisplay(message.labData)
    } else if (message.action === "updatePSIStatus") {
      console.log("Received PSI status update")
      updatePSIStatus(message)
    } else if (message.action === "completePSIResults") {
      console.log("Received complete PSI results for insights")
      handleCompletePSIResults(message.psiData)
    }
  })
}

/**
 * Sets up the detach/attach button functionality
 */
async function setupWindowControls() {
  console.log("Setting up window controls")
  const windowControlsContainer = document.querySelector(".window-controls")
  if (!windowControlsContainer) {
    console.log("Window controls container not found")
    return
  }

  // Detect if we're in detached mode
  isDetachedMode = await isDetachedWindow()
  console.log("Window mode detected:", isDetachedMode ? "detached" : "attached")

  // Apply detached mode styles if needed
  applyDetachedModeStyles(isDetachedMode)

  const button = windowControlsContainer.querySelector(".window-toggle-btn")

  if (button) {
    // Update button icon and tooltip based on current state
    updateWindowControlButton(isDetachedMode, button)

    // Add click handler
    button.addEventListener("click", async () => {
      button.disabled = true

      try {
        if (isDetachedMode) {
          await attachPopup()
        } else {
          await detachPopup()
        }
      } catch (error) {
        console.error("Error toggling window state:", error)
      } finally {
        button.disabled = false
      }
    })
  }
}

/**
 * Sets up resize handling for detached mode
 */
function setupResizeHandling() {
  if (isDetachedMode) {
    window.addEventListener("resize", () => {
      // Reapply detached mode styles on resize
      applyDetachedModeStyles(true)
    })
  }
}

/**
 * Refreshes toggle states when popup loads or mode changes
 */
async function refreshToggleStates() {
  try {
    // Get the target tab ID
    const targetTabId = await getTargetTabIdForMessaging()

    if (!targetTabId) {
      console.log("No target tab available for refreshing toggle states")
      return
    }

    console.log("Refreshing toggle states for tab:", targetTabId)

    // Get current parameters for this tab
    chrome.runtime.sendMessage({ action: "getParameters", tabId: targetTabId }, (parameters) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting parameters for refresh:", chrome.runtime.lastError)
        return
      }

      // Ensure parameters is an array
      if (!Array.isArray(parameters)) {
        parameters = []
      }

      console.log("Refreshed parameters for tab", targetTabId, ":", parameters)

      // Update toggle states
      const perfmattersoff = document.getElementById("perfmattersoff")
      const perfmatterscssoff = document.getElementById("perfmatterscssoff")
      const perfmattersjsoff = document.getElementById("perfmattersjsoff")
      const nocache = document.getElementById("nocache")

      if (perfmattersoff) perfmattersoff.checked = parameters.includes("perfmattersoff")
      if (perfmatterscssoff) perfmatterscssoff.checked = parameters.includes("perfmatterscssoff")
      if (perfmattersjsoff) perfmattersjsoff.checked = parameters.includes("perfmattersjsoff")
      if (nocache) nocache.checked = parameters.includes("nocache")

      // Update toggle dependencies
      if (window.updateToggleStates) {
        window.updateToggleStates(true)
      }
    })
  } catch (error) {
    console.error("Error refreshing toggle states:", error)
  }
}

/**
 * Initializes the popup when DOM is loaded
 */
async function initializePopup() {
  try {
    console.log("=== STARTING POPUP INITIALIZATION ===")

    // Add debug logging
    console.log("DOM elements check:")
    TABS.forEach((tab) => {
      const tabEl = document.getElementById(tab.id)
      const contentEl = document.getElementById(tab.contentId)
      console.log(`Tab ${tab.id}:`, !!tabEl, "Content:", !!contentEl)
      if (!tabEl) console.error(`Missing tab element: ${tab.id}`)
      if (!contentEl) console.error(`Missing content element: ${tab.contentId}`)
    })

    // Detect mode first
    isDetachedMode = await isDetachedWindow()
    console.log("Initializing popup in mode:", isDetachedMode ? "detached" : "attached")

    // Initialize detached mode if needed
    if (isDetachedMode) {
      const success = await initializeDetachedMode()
      if (!success) {
        console.error("Failed to initialize detached mode")
        showEmptyStates()
        return
      }
    }

    // Make helper function globally available with the correct signature
    window.getTargetTabId = async () => {
      return await getTargetTabId()
    }

    // Set up tab switching FIRST
    console.log("Setting up tab switching...")
    setupTabSwitching(TABS)

    // Set up toggle management
    console.log("Setting up toggle management...")
    setupToggleManagement()

    // Make updateToggleStates globally available for refresh
    const toggleManagerModule = await import("./toggle-manager.js")
    if (toggleManagerModule.updateToggleStates) {
      window.updateToggleStates = toggleManagerModule.updateToggleStates
    }

    // Set up window controls
    console.log("Setting up window controls...")
    await setupWindowControls()

    // Set up resize handling for detached mode
    setupResizeHandling()

    // Set up message listeners BEFORE updating popup
    console.log("Setting up message listeners...")
    setupMessageListeners()

    // Update popup with initial results
    console.log("Updating popup with initial results...")
    await updatePopupWithResults()

    // Refresh toggle states after everything is loaded
    console.log("Refreshing toggle states...")
    await refreshToggleStates()

    // Set up periodic polling
    console.log("Setting up periodic polling...")
    setupPeriodicPolling()

    // Set up PSI analyze button
    console.log("Setting up PSI analyze button...")
    // PSI button is now set up in insights-display.js

    console.log("=== POPUP INITIALIZATION COMPLETE ===")
  } catch (error) {
    console.error("=== POPUP INITIALIZATION FAILED ===")
    console.error("Error:", error)
    console.error("Error stack:", error.stack)

    // Try to show empty states as fallback
    try {
      showEmptyStates()
    } catch (fallbackError) {
      console.error("Even fallback failed:", fallbackError)
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM content loaded, initializing popup")
  initializePopup()
})

// Also try immediate initialization if DOM is already ready
if (document.readyState !== "loading") {
  console.log("DOM already ready, initializing immediately...")
  initializePopup()
}

console.log("=== POPUP SETUP COMPLETE ===")
