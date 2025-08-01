/**
 * Module for handling extension messages - Enhanced for all PSI metrics including Lab data
 */

import { storeTabResults, getTabResults } from "./tab-manager.js"
import { getTabParameters, addTabParameter, removeTabParameter, applyParametersToTab } from "./parameter-manager.js"
import {
  createDetachedWindow,
  attachPopup,
  getCurrentWindowState,
  focusDetachedWindow,
  handleDetachedWindowClosed,
} from "./window-manager.js"
import { getWindowState, WINDOW_STATES } from "../utils/window-state.js"

// Storage for throttling timestamps (replaces window usage in service worker)
const throttleStorage = new Map()

// Declare chrome variable
const chrome = globalThis.chrome || self.chrome

/**
 * Sets up message handlers for the extension
 * @param {Object} chrome - The Chrome API object
 */
export function setupMessageHandlers(chrome) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateBadge") {
      handleUpdateBadge(request, sender, chrome)
    } else if (request.action === "analysisResults") {
      handleAnalysisResults(request, sender)
    } else if (request.action === "updateINP") {
      handleINPUpdate(request, sender)
    } else if (request.action === "storePSIResults") {
      handleStorePSIResults(request, sender)
    } else if (request.action === "getPSIResults") {
      handleGetPSIResults(request, sendResponse)
      return true
    } else if (request.action === "updatePSICLS") {
      handlePSIMetricUpdate(request, sender, "cls")
    } else if (request.action === "updatePSILCP") {
      handlePSIMetricUpdate(request, sender, "lcp")
    } else if (request.action === "updatePSIINP") {
      handlePSIMetricUpdate(request, sender, "inp")
    } else if (request.action === "updatePSITTFB") {
      handlePSIMetricUpdate(request, sender, "ttfb")
    } else if (request.action === "updatePSILabCLS") {
      handlePSILabMetricUpdate(request, sender, "cls")
    } else if (request.action === "updatePSILabLCP") {
      handlePSILabMetricUpdate(request, sender, "lcp")
    } else if (request.action === "updatePSIStatus") {
      handlePSIStatusUpdate(request, sender)
    } else if (request.action === "getAnalysisResults") {
      handleGetAnalysisResults(request, sendResponse)
      return true
    } else if (request.action === "updateParameters") {
      handleUpdateParameters(request, sendResponse, chrome)
      return true
    } else if (request.action === "getParameters") {
      handleGetParameters(sendResponse, chrome, request)
      return true
    } else if (request.action === "detachPopup") {
      handleDetachPopup(sendResponse, chrome)
      return true
    } else if (request.action === "attachPopup") {
      handleAttachPopup(sendResponse)
      return true
    } else if (request.action === "getWindowState") {
      handleGetWindowState(sendResponse)
      return true
    } else if (request.action === "tabUrlChanged") {
      handleTabUrlChanged(request, sendResponse)
      return true
    } else if (request.action === "getTabUrl") {
      handleGetTabUrl(request, sendResponse)
      return true
    } else if (request.action === "completePSIResults") {
      handleCompletePSIResults(request, sender)
    }
    return true
  })

  // Add listener for tab URL changes
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      // Check if domain changed
      import("./tab-manager.js").then(({ getTabResults, getPSIResults, storeTabResults, storePSIResults }) => {
        const existingResults = getTabResults(tabId)
        const existingPSI = getPSIResults(tabId)

        if (existingResults && existingResults.url) {
          try {
            const oldDomain = new URL(existingResults.url).hostname
            const newDomain = new URL(changeInfo.url).hostname

            if (oldDomain !== newDomain) {
              console.log("🔄 [Domain Change] Clearing data for tab:", tabId, "from", oldDomain, "to", newDomain)
              // Clear stored data for this tab
              storeTabResults(tabId, null)
              storePSIResults(tabId, null)
            }
          } catch (error) {
            console.log("Error parsing URLs for domain comparison:", error)
          }
        }

        if (existingPSI && existingPSI.url) {
          try {
            const oldDomain = new URL(existingPSI.url).hostname
            const newDomain = new URL(changeInfo.url).hostname

            if (oldDomain !== newDomain) {
              console.log(
                "🔄 [PSI Domain Change] Clearing PSI data for tab:",
                tabId,
                "from",
                oldDomain,
                "to",
                newDomain,
              )
              storePSIResults(tabId, null)
            }
          } catch (error) {
            console.log("Error parsing URLs for PSI domain comparison:", error)
          }
        }
      })

      // Broadcast URL change to all extension contexts
      chrome.runtime
        .sendMessage({
          action: "tabUrlChanged",
          tabId: tabId,
          url: changeInfo.url,
        })
        .catch(() => {
          // Ignore errors if no receivers
        })
    }
  })
}

/**
 * Handles PSI results storage
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 */
function handleStorePSIResults(request, sender) {
  const tabId = sender.tab.id
  const tabUrl = sender.tab.url
  console.log("📊 [PSI] Storing complete PSI results for tab:", tabId, "URL:", tabUrl)

  // Add URL to PSI data for verification
  const psiDataWithUrl = {
    ...request.psiData,
    url: tabUrl,
    timestamp: Date.now(),
    // Store the complete data for insights restoration
    completeData: request.psiData,
  }

  import("./tab-manager.js").then(({ storePSIResults }) => {
    storePSIResults(tabId, psiDataWithUrl)
  })

  // Forward to detached windows
  forwardToDetachedWindows({ ...request, psiData: psiDataWithUrl })
}

/**
 * Handles PSI metric updates (CLS, LCP, INP, TTFB) - Field Data
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 * @param {string} metric - The metric type (cls, lcp, inp, ttfb)
 */
function handlePSIMetricUpdate(request, sender, metric) {
  const tabId = sender.tab?.id
  console.log(`🌍 [PSI Field Data] Processing ${metric.toUpperCase()} for tab:`, tabId)

  // Store field data in PSI results
  if (tabId && request.fieldData) {
    import("./tab-manager.js").then(({ getPSIResults, storePSIResults }) => {
      const existingPSI = getPSIResults(tabId) || { allFieldData: {}, allLabData: {} }

      // Store field data
      if (!existingPSI.allFieldData) existingPSI.allFieldData = {}
      existingPSI.allFieldData[metric] = request.fieldData

      storePSIResults(tabId, existingPSI)
      console.log(`🌍 [PSI Field Data] Stored ${metric.toUpperCase()} field data for tab:`, tabId)
    })
  }

  // Forward to detached windows immediately
  forwardToDetachedWindows(request)

  // Log the field data for debugging
  if (request.fieldData) {
    console.log(`🌍 [PSI Field Data] ${metric.toUpperCase()} metrics:`, {
      percentile: `${request.fieldData.percentile}th percentile`,
      category: request.fieldData.category,
      value: request.fieldData.value,
      dataSource: "Real User Monitoring (CrUX)",
    })
  }
}

/**
 * Handles PSI Lab metric updates (CLS, LCP only) - Lab Data
 * Note: TTFB is not available in lab data as it's a server-side metric
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 * @param {string} metric - The metric type (cls, lcp)
 */
function handlePSILabMetricUpdate(request, sender, metric) {
  const tabId = sender.tab?.id
  console.log(`🧪 [PSI Lab Data] Processing ${metric.toUpperCase()} for tab:`, tabId)

  // Store lab data in PSI results
  if (tabId && request.labData) {
    import("./tab-manager.js").then(({ getPSIResults, storePSIResults }) => {
      const existingPSI = getPSIResults(tabId) || { allFieldData: {}, allLabData: {} }

      // Store lab data with correct key format
      if (!existingPSI.allLabData) existingPSI.allLabData = {}
      existingPSI.allLabData[`lab${metric.toUpperCase()}`] = request.labData

      storePSIResults(tabId, existingPSI)
      console.log(`🧪 [PSI Lab Data] Stored ${metric.toUpperCase()} lab data for tab:`, tabId)
    })
  }

  // Forward to detached windows immediately
  forwardToDetachedWindows(request)

  // Log the lab data for debugging
  if (request.labData) {
    console.log(`🧪 [PSI Lab Data] ${metric.toUpperCase()} metrics:`, {
      numericValue: request.labData.numericValue,
      displayValue: request.labData.displayValue,
      score: request.labData.score,
      dataSource: "Lighthouse Lab Environment",
    })
  }
}

/**
 * Handles PSI status updates
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 */
function handlePSIStatusUpdate(request, sender) {
  const tabId = sender.tab?.id
  const statusIcon =
    request.status === "loading" ? "⏳" : request.status === "success" ? "✅" : request.status === "error" ? "❌" : "ℹ️"

  console.log(`${statusIcon} [PSI Status] ${request.status.toUpperCase()} for tab:`, tabId)

  // Forward to detached windows
  forwardToDetachedWindows(request)
}

/**
 * Handles complete PSI results for insights processing
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 */
function handleCompletePSIResults(request, sender) {
  const tabId = sender.tab?.id
  console.log("📊 [PSI Complete] Processing complete PSI results for insights, tab:", tabId)

  // Store the complete PSI data for insights restoration
  if (tabId && request.psiData) {
    import("./tab-manager.js").then(({ getPSIResults, storePSIResults }) => {
      const existingPSI = getPSIResults(tabId) || { allFieldData: {}, allLabData: {} }

      // Store complete data for insights
      existingPSI.completeData = request.psiData
      existingPSI.timestamp = Date.now()

      storePSIResults(tabId, existingPSI)
      console.log("📊 [PSI Complete] Stored complete PSI data for insights restoration")
    })
  }

  // Forward complete PSI data to detached windows for insights processing
  forwardToDetachedWindows(request)
}

/**
 * Handles requests for PSI results
 * @param {Object} request - The request object
 * @param {Function} sendResponse - The response callback
 */
function handleGetPSIResults(request, sendResponse) {
  import("./tab-manager.js").then(({ getPSIResults }) => {
    const results = getPSIResults(request.tabId)
    console.log("📊 [PSI] Retrieving PSI results for tab:", request.tabId, results ? "✅ found" : "❌ not found")
    sendResponse(results)
  })
}

// Add this new handler function to get a tab's URL
function handleGetTabUrl(request, sendResponse) {
  if (!request.tabId) {
    sendResponse({ success: false, error: "No tab ID provided" })
    return
  }

  chrome.tabs.get(request.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      sendResponse({ success: false, error: chrome.runtime.lastError.message })
      return
    }

    if (tab) {
      sendResponse({ success: true, url: tab.url, tab: tab })
    } else {
      sendResponse({ success: false, error: "Tab not found" })
    }
  })
}

/**
 * Handles tab URL changes
 * @param {Object} request - The request object
 * @param {Function} sendResponse - The response callback
 */
function handleTabUrlChanged(request, sendResponse) {
  console.log("🔄 [Tab] URL changed:", request.tabId, request.url)
  // Forward to any open detached windows
  forwardToDetachedWindows({
    action: "tabUrlChanged",
    tabId: request.tabId,
    url: request.url,
  })

  if (sendResponse) {
    sendResponse({ success: true })
  }
}

/**
 * Handles extension icon clicks based on current window state
 */
export async function handleExtensionIconClick() {
  const currentState = await getWindowState()
  console.log("🖱️ [Extension] Icon clicked, current state:", currentState)

  if (currentState === WINDOW_STATES.DETACHED) {
    console.log("🪟 [Window] In detached mode, attempting to focus window")
    const focused = await focusDetachedWindow()
    if (!focused) {
      console.log("❌ [Window] Failed to focus detached window, resetting to attached state")
      // Window was closed, reset to attached state
      await handleDetachedWindowClosed()
      return false // Allow default popup behavior
    }
    console.log("✅ [Window] Successfully focused detached window")
    return true // Prevent default popup behavior
  }

  console.log("📎 [Window] In attached mode, allowing default popup behavior")
  // For attached state, Chrome handles the default popup behavior
  return false
}

/**
 * Handles badge update requests
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 * @param {Object} chrome - The Chrome API object
 */
function handleUpdateBadge(request, sender, chrome) {
  const hostedBy = request.hostedBy ? request.hostedBy.toLowerCase() : ""
  const cacheStatus = request.cacheStatus ? request.cacheStatus.toLowerCase() : ""

  const isHostedByBigScoots = hostedBy === "bigscoots"
  const isCacheHit = cacheStatus === "hit"

  let badgeColor

  if (isHostedByBigScoots && isCacheHit) {
    // Both conditions met - blue badge
    badgeColor = "#1a73e8"
    console.log("🔵 [Badge] BigScoots + Cache Hit - Blue badge")
  } else if (isHostedByBigScoots) {
    // Only BigScoots hosting - green badge
    badgeColor = "#4CAF50"
    console.log("🟢 [Badge] BigScoots hosting - Green badge")
  } else {
    // Neither condition met - red badge
    badgeColor = "#F44336"
    console.log("🔴 [Badge] Other hosting - Red badge")
  }

  chrome.action.setBadgeText({ text: "●", tabId: sender.tab.id })
  chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0], tabId: sender.tab.id })
  chrome.action.setBadgeTextColor({ color: badgeColor, tabId: sender.tab.id })
}

/**
 * Handles analysis results storage
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 */
function handleAnalysisResults(request, sender) {
  const tabId = sender.tab.id
  const tabUrl = sender.tab.url
  const now = Date.now()

  // Throttle logging to reduce noise (max once per 2 seconds per tab)
  const lastLogKey = `lastAnalysisLog_${tabId}`
  const lastLogTime = throttleStorage.get(lastLogKey) || 0

  if (now - lastLogTime > 2000) {
    console.log("💻 [Local Analysis] Storing local performance results for tab:", tabId, "URL:", tabUrl)
    throttleStorage.set(lastLogKey, now)
  }

  // Clean up old throttling entries (older than 1 hour)
  const oneHourAgo = now - 60 * 60 * 1000
  for (const [key, timestamp] of throttleStorage.entries()) {
    if (timestamp < oneHourAgo) {
      throttleStorage.delete(key)
    }
  }

  // Add URL to the request data for verification
  const dataWithUrl = { ...request, url: tabUrl, timestamp: now }
  storeTabResults(tabId, dataWithUrl)

  // Forward to any open detached windows
  forwardToDetachedWindows(request)
}

// Add this new function after handleAnalysisResults
function handleINPUpdate(request, sender) {
  const tabId = sender.tab.id
  const now = Date.now()

  // Throttle logging for INP updates (max once per 3 seconds per tab)
  const lastLogKey = `lastINPLog_${tabId}`
  const lastLogTime = throttleStorage.get(lastLogKey) || 0

  if (now - lastLogTime > 3000) {
    console.log("⚡ [Local INP] Storing local INP measurement for tab:", tabId, "value:", request.value + "ms")
    throttleStorage.set(lastLogKey, now)
  }

  // Get existing results and update INP data
  const existingResults = getTabResults(tabId) || {}
  existingResults.inp = {
    value: request.value,
    entries: request.entries,
    rating: request.rating,
    status: request.status,
  }

  storeTabResults(tabId, existingResults)

  // Forward to detached windows
  forwardToDetachedWindows(request)
}

/**
 * Forwards messages to detached windows
 * @param {Object} message - Message to forward
 */
async function forwardToDetachedWindows(message) {
  try {
    const currentState = await getWindowState()
    if (currentState === WINDOW_STATES.DETACHED) {
      // Send message to all extension contexts (including detached windows)
      chrome.runtime.sendMessage(message).catch(() => {
        // Ignore errors if no receivers
      })
    }
  } catch (error) {
    console.debug("⚠️ [Window] Error forwarding to detached windows:", error)
  }
}

/**
 * Handles requests for analysis results
 * @param {Object} request - The request object
 * @param {Function} sendResponse - The response callback
 */
function handleGetAnalysisResults(request, sendResponse) {
  const results = getTabResults(request.tabId)
  console.log(
    "💻 [Local Analysis] Retrieving local analysis results for tab:",
    request.tabId,
    results ? "✅ found" : "❌ not found",
  )
  sendResponse(results)
}

/**
 * Handles parameter update requests
 * @param {Object} request - The request object
 * @param {Function} sendResponse - The response callback
 * @param {Object} chrome - The Chrome API object
 */
function handleUpdateParameters(request, sendResponse, chrome) {
  // If a specific tab ID is provided, use it; otherwise fall back to active tab
  if (request.tabId) {
    console.log("⚙️ [Parameters] Updating parameters for specific tab:", request.tabId)

    chrome.tabs.get(request.tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        console.error("❌ [Parameters] Tab not found:", request.tabId, chrome.runtime.lastError)
        sendResponse({ urlChanged: false, error: "Tab not found" })
        return
      }

      let changed = false

      if (request.add) {
        changed = addTabParameter(tab.id, request.parameter)
      } else {
        changed = removeTabParameter(tab.id, request.parameter)
      }

      if (changed) {
        applyParametersToTab(tab.id, chrome)
      }

      sendResponse({ urlChanged: changed })
    })
  } else {
    // Fallback to active tab behavior
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
        sendResponse({ urlChanged: false, error: "No active tab found" })
        return
      }

      const activeTab = tabs[0]
      let changed = false

      if (request.add) {
        changed = addTabParameter(activeTab.id, request.parameter)
      } else {
        changed = removeTabParameter(activeTab.id, request.parameter)
      }

      if (changed) {
        applyParametersToTab(activeTab.id, chrome)
      }

      sendResponse({ urlChanged: changed })
    })
  }
}

/**
 * Handles requests for parameters
 * @param {Function} sendResponse - The response callback
 * @param {Object} chrome - The Chrome API object
 */
function handleGetParameters(sendResponse, chrome) {
  // If a specific tab ID is provided in the request, use it
  const request = arguments[2] // Get the original request object

  if (request && request.tabId) {
    console.log("⚙️ [Parameters] Getting parameters for specific tab:", request.tabId)
    const params = getTabParameters(request.tabId)
    sendResponse(Array.from(params))
    return
  }

  // Fallback to active tab behavior
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
      sendResponse([])
      return
    }

    const activeTab = tabs[0]
    const params = getTabParameters(activeTab.id)
    sendResponse(Array.from(params))
  })
}

/**
 * Handles popup detachment requests
 * @param {Function} sendResponse - The response callback
 * @param {Object} chrome - The Chrome API object
 */
async function handleDetachPopup(sendResponse, chrome) {
  try {
    console.log("🪟 [Window] Creating detached popup window")

    // Get the current active tab ID to pass to the detached window
    const tabs = await new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          resolve([])
        } else {
          resolve(tabs || [])
        }
      })
    })

    const originalTabId = tabs.length > 0 ? tabs[0].id : null

    console.log("🪟 [Window] Original tab ID for detached window:", originalTabId)

    const window = await createDetachedWindow(originalTabId)
    sendResponse({ success: true, windowId: window.id, originalTabId })
  } catch (error) {
    console.error("❌ [Window] Failed to create detached window:", error)
    sendResponse({ success: false, error: error.message })
  }
}

/**
 * Handles popup attachment requests
 * @param {Function} sendResponse - The response callback
 */
async function handleAttachPopup(sendResponse) {
  try {
    console.log("📎 [Window] Attaching popup to extension icon")
    await attachPopup()
    sendResponse({ success: true })
  } catch (error) {
    console.error("❌ [Window] Failed to attach popup:", error)
    sendResponse({ success: false, error: error.message })
  }
}

/**
 * Handles window state requests
 * @param {Function} sendResponse - The response callback
 */
async function handleGetWindowState(sendResponse) {
  try {
    const state = await getCurrentWindowState()
    sendResponse({ state })
  } catch (error) {
    sendResponse({ state: "attached", error: error.message })
  }
}
