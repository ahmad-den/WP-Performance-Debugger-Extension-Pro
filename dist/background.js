/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 165:
/*!******************************************!*\
  !*** ./src/background/window-manager.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   attachPopup: () => (/* binding */ attachPopup),
/* harmony export */   createDetachedWindow: () => (/* binding */ createDetachedWindow),
/* harmony export */   focusDetachedWindow: () => (/* binding */ focusDetachedWindow),
/* harmony export */   getCurrentWindowState: () => (/* binding */ getCurrentWindowState),
/* harmony export */   handleDetachedWindowClosed: () => (/* binding */ handleDetachedWindowClosed),
/* harmony export */   isDetachedWindow: () => (/* binding */ isDetachedWindow),
/* harmony export */   resetWindowBounds: () => (/* binding */ resetWindowBounds),
/* harmony export */   saveWindowBounds: () => (/* binding */ saveWindowBounds)
/* harmony export */ });
/* harmony import */ var _utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/window-state.js */ 194);
/**
 * Module for managing detachable popup windows - Enhanced bounds validation
 */



// Declare the chrome variable
const chrome = globalThis.chrome || self.chrome;

// Track the current detached window
let detachedWindow = null;

/**
 * Validates and corrects window bounds to ensure they're within screen limits
 * @param {Object} bounds - Window bounds to validate
 * @returns {Promise<Object>} Validated bounds
 */
async function validateWindowBounds(bounds) {
  try {
    // Get all available displays
    const displays = await new Promise(resolve => {
      if (chrome.system && chrome.system.display) {
        chrome.system.display.getInfo(displays => {
          if (chrome.runtime.lastError) {
            resolve([]);
          } else {
            resolve(displays || []);
          }
        });
      } else {
        resolve([]);
      }
    });

    // If we can't get display info, use safe defaults
    if (!displays || displays.length === 0) {
      console.log("No display info available, using safe defaults");
      return {
        left: 100,
        top: 100,
        width: Math.min(bounds.width || _utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_WINDOW_CONFIG.width, 1200),
        height: Math.min(bounds.height || _utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_WINDOW_CONFIG.height, 800)
      };
    }

    // Find the primary display or the largest one
    const primaryDisplay = displays.find(d => d.isPrimary) || displays[0];
    const screenBounds = primaryDisplay.bounds;
    console.log("Screen bounds:", screenBounds);
    console.log("Requested bounds:", bounds);

    // Calculate safe bounds
    const safeWidth = Math.min(bounds.width || _utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_WINDOW_CONFIG.width, screenBounds.width - 100);
    const safeHeight = Math.min(bounds.height || _utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_WINDOW_CONFIG.height, screenBounds.height - 100);

    // Ensure window is at least 50% within screen bounds
    const minLeft = screenBounds.left - Math.floor(safeWidth * 0.5);
    const maxLeft = screenBounds.left + screenBounds.width - Math.floor(safeWidth * 0.5);
    const minTop = screenBounds.top - Math.floor(safeHeight * 0.5);
    const maxTop = screenBounds.top + screenBounds.height - Math.floor(safeHeight * 0.5);
    let safeLeft = bounds.left || 100;
    let safeTop = bounds.top || 100;

    // Clamp to safe ranges
    safeLeft = Math.max(minLeft, Math.min(maxLeft, safeLeft));
    safeTop = Math.max(minTop, Math.min(maxTop, safeTop));

    // Additional safety check - ensure window is mostly visible
    if (safeLeft + safeWidth < screenBounds.left + 100) {
      safeLeft = screenBounds.left + 100;
    }
    if (safeTop + safeHeight < screenBounds.top + 100) {
      safeTop = screenBounds.top + 100;
    }
    const validatedBounds = {
      left: safeLeft,
      top: safeTop,
      width: safeWidth,
      height: safeHeight
    };
    console.log("Validated bounds:", validatedBounds);
    return validatedBounds;
  } catch (error) {
    console.error("Error validating window bounds:", error);
    // Return safe fallback bounds
    return {
      left: 100,
      top: 100,
      width: Math.min(bounds.width || _utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_WINDOW_CONFIG.width, 1000),
      height: Math.min(bounds.height || _utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_WINDOW_CONFIG.height, 700)
    };
  }
}

/**
 * Creates a detached popup window with validated bounds
 * @param {number} originalTabId - The ID of the original tab
 * @returns {Promise<chrome.windows.Window>} Created window
 */
async function createDetachedWindow(originalTabId) {
  try {
    console.log("Creating detached window for tab:", originalTabId);

    // Get saved bounds or use defaults
    const savedBounds = await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.getWindowBounds)();
    console.log("Saved bounds:", savedBounds);

    // Use saved bounds or defaults
    const requestedBounds = savedBounds || {
      left: 100,
      top: 100,
      width: _utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_WINDOW_CONFIG.width,
      height: _utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_WINDOW_CONFIG.height
    };

    // Validate bounds to ensure they're within screen limits
    const validatedBounds = await validateWindowBounds(requestedBounds);

    // Include original tab ID in the URL
    const popupUrl = originalTabId ? `${chrome.runtime.getURL("popup.html")}?originalTabId=${originalTabId}` : chrome.runtime.getURL("popup.html");
    const windowConfig = {
      url: popupUrl,
      type: "popup",
      focused: true,
      ...validatedBounds
    };
    console.log("Creating window with config:", windowConfig);
    const window = await chrome.windows.create(windowConfig);
    detachedWindow = window;
    await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setDetachedWindowId)(window.id);
    await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setWindowState)(_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.WINDOW_STATES.DETACHED);

    // Store the original tab ID in storage as backup
    if (originalTabId) {
      await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setOriginalTabId)(originalTabId);
    }
    console.log("Successfully created detached window with ID:", window.id);
    return window;
  } catch (error) {
    console.error("Error creating detached window:", error);

    // Try with minimal safe bounds as fallback
    try {
      console.log("Attempting fallback window creation with minimal bounds");
      const fallbackConfig = {
        url: originalTabId ? `${chrome.runtime.getURL("popup.html")}?originalTabId=${originalTabId}` : chrome.runtime.getURL("popup.html"),
        type: "popup",
        focused: true,
        left: 100,
        top: 100,
        width: 600,
        height: 500
      };
      const window = await chrome.windows.create(fallbackConfig);
      detachedWindow = window;
      await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setDetachedWindowId)(window.id);
      await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setWindowState)(_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.WINDOW_STATES.DETACHED);
      if (originalTabId) {
        await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setOriginalTabId)(originalTabId);
      }
      console.log("Fallback window creation successful:", window.id);
      return window;
    } catch (fallbackError) {
      console.error("Fallback window creation also failed:", fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Focuses the detached window if it exists
 * @returns {Promise<boolean>} True if window was focused successfully
 */
async function focusDetachedWindow() {
  try {
    const windowId = await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.getDetachedWindowId)();
    console.log("Attempting to focus detached window ID:", windowId);
    if (windowId) {
      try {
        // Check if window still exists
        const window = await chrome.windows.get(windowId);
        if (window) {
          console.log("Window found, focusing...");

          // Bring window to front and focus it
          await chrome.windows.update(windowId, {
            focused: true,
            state: "normal" // Ensure it's not minimized
          });

          // Additional focus attempt for better visibility
          setTimeout(async () => {
            try {
              await chrome.windows.update(windowId, {
                focused: true
              });
            } catch (e) {
              console.debug("Secondary focus attempt failed:", e);
            }
          }, 100);
          console.log("Successfully focused detached window");
          return true;
        }
      } catch (error) {
        console.log("Window doesn't exist, cleaning up:", error);
        // Window doesn't exist, clean up
        await handleDetachedWindowClosed();
        return false;
      }
    }
    console.log("No detached window ID found");
    return false;
  } catch (error) {
    console.debug("Error focusing detached window:", error);
    return false;
  }
}

/**
 * Handles cleanup when detached window is closed
 */
async function handleDetachedWindowClosed() {
  console.log("Cleaning up detached window state");
  detachedWindow = null;
  await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setDetachedWindowId)(null);
  await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setWindowState)(_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.WINDOW_STATES.ATTACHED);
}

/**
 * Saves current window bounds before closing with validation
 * @param {number} windowId - Window ID to save bounds for
 */
async function saveWindowBounds(windowId) {
  try {
    const window = await chrome.windows.get(windowId);

    // Only save bounds if they seem reasonable
    if (window.left >= -1000 && window.top >= -1000 && window.width >= 300 && window.height >= 200 && window.width <= 2000 && window.height <= 1500) {
      const bounds = {
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height
      };
      await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setWindowBounds)(bounds);
      console.log("Saved window bounds:", bounds);
    } else {
      console.log("Window bounds seem invalid, not saving:", {
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height
      });
    }
  } catch (error) {
    console.debug("Error saving window bounds:", error);
  }
}

/**
 * Attaches the popup back to the extension icon
 */
async function attachPopup() {
  const windowId = await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.getDetachedWindowId)();
  console.log("Attaching popup, current detached window ID:", windowId);
  if (windowId) {
    try {
      // Save bounds before closing
      await saveWindowBounds(windowId);
      await chrome.windows.remove(windowId);
      console.log("Closed detached window");
    } catch (error) {
      console.debug("Error closing detached window:", error);
    }
  }
  await handleDetachedWindowClosed();
}

/**
 * Gets the current window state
 * @returns {Promise<string>} Current window state
 */
async function getCurrentWindowState() {
  return await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.getWindowState)();
}

/**
 * Checks if a window ID matches our detached window
 * @param {number} windowId - Window ID to check
 * @returns {Promise<boolean>} True if it's our detached window
 */
async function isDetachedWindow(windowId) {
  const detachedWindowId = await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.getDetachedWindowId)();
  return detachedWindowId === windowId;
}

/**
 * Resets stored window bounds (useful for debugging)
 */
async function resetWindowBounds() {
  try {
    await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setWindowBounds)(null);
    console.log("Window bounds reset");
  } catch (error) {
    console.error("Error resetting window bounds:", error);
  }
}

/***/ }),

/***/ 194:
/*!***********************************!*\
  !*** ./src/utils/window-state.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_WINDOW_CONFIG: () => (/* binding */ DEFAULT_WINDOW_CONFIG),
/* harmony export */   STORAGE_KEYS: () => (/* binding */ STORAGE_KEYS),
/* harmony export */   WINDOW_STATES: () => (/* binding */ WINDOW_STATES),
/* harmony export */   clearOriginalTabId: () => (/* binding */ clearOriginalTabId),
/* harmony export */   getCurrentWindowId: () => (/* binding */ getCurrentWindowId),
/* harmony export */   getDetachedWindowId: () => (/* binding */ getDetachedWindowId),
/* harmony export */   getOriginalTabId: () => (/* binding */ getOriginalTabId),
/* harmony export */   getWindowBounds: () => (/* binding */ getWindowBounds),
/* harmony export */   getWindowState: () => (/* binding */ getWindowState),
/* harmony export */   isCurrentWindowDetached: () => (/* binding */ isCurrentWindowDetached),
/* harmony export */   setDetachedWindowId: () => (/* binding */ setDetachedWindowId),
/* harmony export */   setOriginalTabId: () => (/* binding */ setOriginalTabId),
/* harmony export */   setWindowBounds: () => (/* binding */ setWindowBounds),
/* harmony export */   setWindowState: () => (/* binding */ setWindowState)
/* harmony export */ });
/**
 * Utility module for managing popup window state - Enhanced with bounds validation
 */

// Window state constants
const WINDOW_STATES = {
  ATTACHED: "attached",
  DETACHED: "detached"
};

// Storage keys
const STORAGE_KEYS = {
  WINDOW_STATE: "popup_window_state",
  DETACHED_WINDOW_ID: "detached_window_id",
  WINDOW_BOUNDS: "detached_window_bounds"
};

// Default window dimensions - Conservative sizes for better compatibility
const DEFAULT_WINDOW_CONFIG = {
  width: 700,
  // Reduced from 800
  height: 600,
  // Reduced from 700
  type: "popup",
  focused: true
};

// Declare chrome variable
const chrome = globalThis.chrome || self.chrome;

/**
 * Gets the current window state from storage
 * @returns {Promise<string>} Current window state
 */
async function getWindowState() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.WINDOW_STATE);
    return result[STORAGE_KEYS.WINDOW_STATE] || WINDOW_STATES.ATTACHED;
  } catch (error) {
    console.debug("Error getting window state:", error);
    return WINDOW_STATES.ATTACHED;
  }
}

/**
 * Sets the window state in storage
 * @param {string} state - The window state to set
 */
async function setWindowState(state) {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.WINDOW_STATE]: state
    });
  } catch (error) {
    console.debug("Error setting window state:", error);
  }
}

/**
 * Gets the detached window ID from storage
 * @returns {Promise<number|null>} Window ID or null
 */
async function getDetachedWindowId() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DETACHED_WINDOW_ID);
    return result[STORAGE_KEYS.DETACHED_WINDOW_ID] || null;
  } catch (error) {
    console.debug("Error getting detached window ID:", error);
    return null;
  }
}

/**
 * Sets the detached window ID in storage
 * @param {number|null} windowId - The window ID to store
 */
async function setDetachedWindowId(windowId) {
  try {
    if (windowId === null) {
      await chrome.storage.local.remove(STORAGE_KEYS.DETACHED_WINDOW_ID);
    } else {
      await chrome.storage.local.set({
        [STORAGE_KEYS.DETACHED_WINDOW_ID]: windowId
      });
    }
  } catch (error) {
    console.debug("Error setting detached window ID:", error);
  }
}

/**
 * Gets saved window bounds from storage with validation
 * @returns {Promise<Object|null>} Window bounds or null
 */
async function getWindowBounds() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.WINDOW_BOUNDS);
    const bounds = result[STORAGE_KEYS.WINDOW_BOUNDS];

    // Validate bounds before returning
    if (bounds && typeof bounds === "object") {
      // Check if bounds seem reasonable
      if (bounds.width >= 300 && bounds.height >= 200 && bounds.width <= 2000 && bounds.height <= 1500 && typeof bounds.left === "number" && typeof bounds.top === "number") {
        return bounds;
      } else {
        console.log("Stored bounds seem invalid, ignoring:", bounds);
        // Clear invalid bounds
        await setWindowBounds(null);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.debug("Error getting window bounds:", error);
    return null;
  }
}

/**
 * Saves window bounds to storage with validation
 * @param {Object|null} bounds - Window bounds object
 */
async function setWindowBounds(bounds) {
  try {
    if (bounds === null) {
      await chrome.storage.local.remove(STORAGE_KEYS.WINDOW_BOUNDS);
      console.log("Window bounds cleared");
    } else {
      // Validate bounds before saving
      if (bounds && typeof bounds === "object" && bounds.width >= 300 && bounds.height >= 200 && bounds.width <= 2000 && bounds.height <= 1500 && typeof bounds.left === "number" && typeof bounds.top === "number") {
        await chrome.storage.local.set({
          [STORAGE_KEYS.WINDOW_BOUNDS]: bounds
        });
        console.log("Window bounds saved:", bounds);
      } else {
        console.log("Invalid bounds not saved:", bounds);
      }
    }
  } catch (error) {
    console.debug("Error setting window bounds:", error);
  }
}

/**
 * Gets the original tab ID from storage
 * @returns {Promise<number|null>} Original tab ID or null
 */
async function getOriginalTabId() {
  try {
    const result = await chrome.storage.local.get("originalTabId");
    return result.originalTabId || null;
  } catch (error) {
    console.debug("Error getting original tab ID:", error);
    return null;
  }
}

/**
 * Sets the original tab ID in storage
 * @param {number|null} tabId - The tab ID to store
 */
async function setOriginalTabId(tabId) {
  try {
    if (tabId === null) {
      await chrome.storage.local.remove("originalTabId");
    } else {
      await chrome.storage.local.set({
        originalTabId: tabId
      });
    }
  } catch (error) {
    console.debug("Error setting original tab ID:", error);
  }
}

/**
 * Clears the original tab ID from storage
 */
async function clearOriginalTabId() {
  try {
    await chrome.storage.local.remove("originalTabId");
  } catch (error) {
    console.debug("Error clearing original tab ID:", error);
  }
}

/**
 * Checks if current window is the detached popup window
 * @returns {Promise<boolean>} True if this is the detached window
 */
async function isCurrentWindowDetached() {
  try {
    const currentWindowId = await getCurrentWindowId();
    const detachedWindowId = await getDetachedWindowId();
    return currentWindowId === detachedWindowId;
  } catch (error) {
    console.debug("Error checking if current window is detached:", error);
    return false;
  }
}

/**
 * Gets the current window ID
 * @returns {Promise<number|null>} Current window ID or null
 */
async function getCurrentWindowId() {
  try {
    const currentWindow = await chrome.windows.getCurrent();
    return currentWindow.id;
  } catch (error) {
    console.debug("Error getting current window ID:", error);
    return null;
  }
}

/***/ }),

/***/ 577:
/*!*******************************************!*\
  !*** ./src/background/message-handler.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handleExtensionIconClick: () => (/* binding */ handleExtensionIconClick),
/* harmony export */   setupMessageHandlers: () => (/* binding */ setupMessageHandlers)
/* harmony export */ });
/* harmony import */ var _tab_manager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tab-manager.js */ 662);
/* harmony import */ var _parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parameter-manager.js */ 870);
/* harmony import */ var _window_manager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./window-manager.js */ 165);
/* harmony import */ var _utils_window_state_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/window-state.js */ 194);
/**
 * Module for handling extension messages - Enhanced for all PSI metrics including Lab data
 */






// Storage for throttling timestamps (replaces window usage in service worker)
const throttleStorage = new Map();

// Declare chrome variable
const chrome = globalThis.chrome || self.chrome;

/**
 * Sets up message handlers for the extension
 * @param {Object} chrome - The Chrome API object
 */
function setupMessageHandlers(chrome) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateBadge") {
      handleUpdateBadge(request, sender, chrome);
    } else if (request.action === "analysisResults") {
      handleAnalysisResults(request, sender);
    } else if (request.action === "updateINP") {
      handleINPUpdate(request, sender);
    } else if (request.action === "storePSIResults") {
      handleStorePSIResults(request, sender);
    } else if (request.action === "getPSIResults") {
      handleGetPSIResults(request, sendResponse);
      return true;
    } else if (request.action === "updatePSICLS") {
      handlePSIMetricUpdate(request, sender, "cls");
    } else if (request.action === "updatePSILCP") {
      handlePSIMetricUpdate(request, sender, "lcp");
    } else if (request.action === "updatePSIINP") {
      handlePSIMetricUpdate(request, sender, "inp");
    } else if (request.action === "updatePSITTFB") {
      handlePSIMetricUpdate(request, sender, "ttfb");
    } else if (request.action === "updatePSILabCLS") {
      handlePSILabMetricUpdate(request, sender, "cls");
    } else if (request.action === "updatePSILabLCP") {
      handlePSILabMetricUpdate(request, sender, "lcp");
    } else if (request.action === "updatePSIStatus") {
      handlePSIStatusUpdate(request, sender);
    } else if (request.action === "getAnalysisResults") {
      handleGetAnalysisResults(request, sendResponse);
      return true;
    } else if (request.action === "updateParameters") {
      handleUpdateParameters(request, sendResponse, chrome);
      return true;
    } else if (request.action === "getParameters") {
      handleGetParameters(sendResponse, chrome, request);
      return true;
    } else if (request.action === "detachPopup") {
      handleDetachPopup(sendResponse, chrome);
      return true;
    } else if (request.action === "attachPopup") {
      handleAttachPopup(sendResponse);
      return true;
    } else if (request.action === "getWindowState") {
      handleGetWindowState(sendResponse);
      return true;
    } else if (request.action === "tabUrlChanged") {
      handleTabUrlChanged(request, sendResponse);
      return true;
    } else if (request.action === "getTabUrl") {
      handleGetTabUrl(request, sendResponse);
      return true;
    } else if (request.action === "completePSIResults") {
      handleCompletePSIResults(request, sender);
    }
    return true;
  });

  // Add listener for tab URL changes
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      // Check if domain changed
      Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./tab-manager.js */ 662)).then(({
        getTabResults,
        getPSIResults,
        storeTabResults,
        storePSIResults
      }) => {
        const existingResults = getTabResults(tabId);
        const existingPSI = getPSIResults(tabId);
        if (existingResults && existingResults.url) {
          try {
            const oldDomain = new URL(existingResults.url).hostname;
            const newDomain = new URL(changeInfo.url).hostname;
            if (oldDomain !== newDomain) {
              console.log("🔄 [Domain Change] Clearing data for tab:", tabId, "from", oldDomain, "to", newDomain);
              // Clear stored data for this tab
              storeTabResults(tabId, null);
              storePSIResults(tabId, null);
            }
          } catch (error) {
            console.log("Error parsing URLs for domain comparison:", error);
          }
        }
        if (existingPSI && existingPSI.url) {
          try {
            const oldDomain = new URL(existingPSI.url).hostname;
            const newDomain = new URL(changeInfo.url).hostname;
            if (oldDomain !== newDomain) {
              console.log("🔄 [PSI Domain Change] Clearing PSI data for tab:", tabId, "from", oldDomain, "to", newDomain);
              storePSIResults(tabId, null);
            }
          } catch (error) {
            console.log("Error parsing URLs for PSI domain comparison:", error);
          }
        }
      });

      // Broadcast URL change to all extension contexts
      chrome.runtime.sendMessage({
        action: "tabUrlChanged",
        tabId: tabId,
        url: changeInfo.url
      }).catch(() => {
        // Ignore errors if no receivers
      });
    }
  });
}

/**
 * Handles PSI results storage
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 */
function handleStorePSIResults(request, sender) {
  const tabId = sender.tab.id;
  const tabUrl = sender.tab.url;
  console.log("📊 [PSI] Storing complete PSI results for tab:", tabId, "URL:", tabUrl);

  // Add URL to PSI data for verification
  const psiDataWithUrl = {
    ...request.psiData,
    url: tabUrl,
    timestamp: Date.now(),
    // Store the complete data for insights restoration
    completeData: request.psiData
  };
  Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./tab-manager.js */ 662)).then(({
    storePSIResults
  }) => {
    storePSIResults(tabId, psiDataWithUrl);
  });

  // Forward to detached windows
  forwardToDetachedWindows({
    ...request,
    psiData: psiDataWithUrl
  });
}

/**
 * Handles PSI metric updates (CLS, LCP, INP, TTFB) - Field Data
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 * @param {string} metric - The metric type (cls, lcp, inp, ttfb)
 */
function handlePSIMetricUpdate(request, sender, metric) {
  var _sender$tab;
  const tabId = (_sender$tab = sender.tab) === null || _sender$tab === void 0 ? void 0 : _sender$tab.id;
  console.log(`🌍 [PSI Field Data] Processing ${metric.toUpperCase()} for tab:`, tabId);

  // Store field data in PSI results
  if (tabId && request.fieldData) {
    Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./tab-manager.js */ 662)).then(({
      getPSIResults,
      storePSIResults
    }) => {
      const existingPSI = getPSIResults(tabId) || {
        allFieldData: {},
        allLabData: {}
      };

      // Store field data
      if (!existingPSI.allFieldData) existingPSI.allFieldData = {};
      existingPSI.allFieldData[metric] = request.fieldData;
      storePSIResults(tabId, existingPSI);
      console.log(`🌍 [PSI Field Data] Stored ${metric.toUpperCase()} field data for tab:`, tabId);
    });
  }

  // Forward to detached windows immediately
  forwardToDetachedWindows(request);

  // Log the field data for debugging
  if (request.fieldData) {
    console.log(`🌍 [PSI Field Data] ${metric.toUpperCase()} metrics:`, {
      percentile: `${request.fieldData.percentile}th percentile`,
      category: request.fieldData.category,
      value: request.fieldData.value,
      dataSource: "Real User Monitoring (CrUX)"
    });
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
  var _sender$tab2;
  const tabId = (_sender$tab2 = sender.tab) === null || _sender$tab2 === void 0 ? void 0 : _sender$tab2.id;
  console.log(`🧪 [PSI Lab Data] Processing ${metric.toUpperCase()} for tab:`, tabId);

  // Store lab data in PSI results
  if (tabId && request.labData) {
    Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./tab-manager.js */ 662)).then(({
      getPSIResults,
      storePSIResults
    }) => {
      const existingPSI = getPSIResults(tabId) || {
        allFieldData: {},
        allLabData: {}
      };

      // Store lab data with correct key format
      if (!existingPSI.allLabData) existingPSI.allLabData = {};
      existingPSI.allLabData[`lab${metric.toUpperCase()}`] = request.labData;
      storePSIResults(tabId, existingPSI);
      console.log(`🧪 [PSI Lab Data] Stored ${metric.toUpperCase()} lab data for tab:`, tabId);
    });
  }

  // Forward to detached windows immediately
  forwardToDetachedWindows(request);

  // Log the lab data for debugging
  if (request.labData) {
    console.log(`🧪 [PSI Lab Data] ${metric.toUpperCase()} metrics:`, {
      numericValue: request.labData.numericValue,
      displayValue: request.labData.displayValue,
      score: request.labData.score,
      dataSource: "Lighthouse Lab Environment"
    });
  }
}

/**
 * Handles PSI status updates
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 */
function handlePSIStatusUpdate(request, sender) {
  var _sender$tab3;
  const tabId = (_sender$tab3 = sender.tab) === null || _sender$tab3 === void 0 ? void 0 : _sender$tab3.id;
  const statusIcon = request.status === "loading" ? "⏳" : request.status === "success" ? "✅" : request.status === "error" ? "❌" : "ℹ️";
  console.log(`${statusIcon} [PSI Status] ${request.status.toUpperCase()} for tab:`, tabId);

  // Forward to detached windows
  forwardToDetachedWindows(request);
}

/**
 * Handles complete PSI results for insights processing
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 */
function handleCompletePSIResults(request, sender) {
  var _sender$tab4;
  const tabId = (_sender$tab4 = sender.tab) === null || _sender$tab4 === void 0 ? void 0 : _sender$tab4.id;
  console.log("📊 [PSI Complete] Processing complete PSI results for insights, tab:", tabId);

  // Store the complete PSI data for insights restoration
  if (tabId && request.psiData) {
    Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./tab-manager.js */ 662)).then(({
      getPSIResults,
      storePSIResults
    }) => {
      const existingPSI = getPSIResults(tabId) || {
        allFieldData: {},
        allLabData: {}
      };

      // Store complete data for insights
      existingPSI.completeData = request.psiData;
      existingPSI.timestamp = Date.now();
      storePSIResults(tabId, existingPSI);
      console.log("📊 [PSI Complete] Stored complete PSI data for insights restoration");
    });
  }

  // Forward complete PSI data to detached windows for insights processing
  forwardToDetachedWindows(request);
}

/**
 * Handles requests for PSI results
 * @param {Object} request - The request object
 * @param {Function} sendResponse - The response callback
 */
function handleGetPSIResults(request, sendResponse) {
  Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./tab-manager.js */ 662)).then(({
    getPSIResults
  }) => {
    const results = getPSIResults(request.tabId);
    console.log("📊 [PSI] Retrieving PSI results for tab:", request.tabId, results ? "✅ found" : "❌ not found");
    sendResponse(results);
  });
}

// Add this new handler function to get a tab's URL
function handleGetTabUrl(request, sendResponse) {
  if (!request.tabId) {
    sendResponse({
      success: false,
      error: "No tab ID provided"
    });
    return;
  }
  chrome.tabs.get(request.tabId, tab => {
    if (chrome.runtime.lastError) {
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message
      });
      return;
    }
    if (tab) {
      sendResponse({
        success: true,
        url: tab.url,
        tab: tab
      });
    } else {
      sendResponse({
        success: false,
        error: "Tab not found"
      });
    }
  });
}

/**
 * Handles tab URL changes
 * @param {Object} request - The request object
 * @param {Function} sendResponse - The response callback
 */
function handleTabUrlChanged(request, sendResponse) {
  console.log("🔄 [Tab] URL changed:", request.tabId, request.url);
  // Forward to any open detached windows
  forwardToDetachedWindows({
    action: "tabUrlChanged",
    tabId: request.tabId,
    url: request.url
  });
  if (sendResponse) {
    sendResponse({
      success: true
    });
  }
}

/**
 * Handles extension icon clicks based on current window state
 */
async function handleExtensionIconClick() {
  const currentState = await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_3__.getWindowState)();
  console.log("🖱️ [Extension] Icon clicked, current state:", currentState);
  if (currentState === _utils_window_state_js__WEBPACK_IMPORTED_MODULE_3__.WINDOW_STATES.DETACHED) {
    console.log("🪟 [Window] In detached mode, attempting to focus window");
    const focused = await (0,_window_manager_js__WEBPACK_IMPORTED_MODULE_2__.focusDetachedWindow)();
    if (!focused) {
      console.log("❌ [Window] Failed to focus detached window, resetting to attached state");
      // Window was closed, reset to attached state
      await (0,_window_manager_js__WEBPACK_IMPORTED_MODULE_2__.handleDetachedWindowClosed)();
      return false; // Allow default popup behavior
    }
    console.log("✅ [Window] Successfully focused detached window");
    return true; // Prevent default popup behavior
  }
  console.log("📎 [Window] In attached mode, allowing default popup behavior");
  // For attached state, Chrome handles the default popup behavior
  return false;
}

/**
 * Handles badge update requests
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 * @param {Object} chrome - The Chrome API object
 */
function handleUpdateBadge(request, sender, chrome) {
  const hostedBy = request.hostedBy ? request.hostedBy.toLowerCase() : "";
  const cacheStatus = request.cacheStatus ? request.cacheStatus.toLowerCase() : "";
  const isHostedByBigScoots = hostedBy === "bigscoots";
  const isCacheHit = cacheStatus === "hit";
  let badgeColor;
  if (isHostedByBigScoots && isCacheHit) {
    // Both conditions met - blue badge
    badgeColor = "#1a73e8";
    console.log("🔵 [Badge] BigScoots + Cache Hit - Blue badge");
  } else if (isHostedByBigScoots) {
    // Only BigScoots hosting - green badge
    badgeColor = "#4CAF50";
    console.log("🟢 [Badge] BigScoots hosting - Green badge");
  } else {
    // Neither condition met - red badge
    badgeColor = "#F44336";
    console.log("🔴 [Badge] Other hosting - Red badge");
  }
  chrome.action.setBadgeText({
    text: "●",
    tabId: sender.tab.id
  });
  chrome.action.setBadgeBackgroundColor({
    color: [0, 0, 0, 0],
    tabId: sender.tab.id
  });
  chrome.action.setBadgeTextColor({
    color: badgeColor,
    tabId: sender.tab.id
  });
}

/**
 * Handles analysis results storage
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object
 */
function handleAnalysisResults(request, sender) {
  const tabId = sender.tab.id;
  const tabUrl = sender.tab.url;
  const now = Date.now();

  // Throttle logging to reduce noise (max once per 2 seconds per tab)
  const lastLogKey = `lastAnalysisLog_${tabId}`;
  const lastLogTime = throttleStorage.get(lastLogKey) || 0;
  if (now - lastLogTime > 2000) {
    console.log("💻 [Local Analysis] Storing local performance results for tab:", tabId, "URL:", tabUrl);
    throttleStorage.set(lastLogKey, now);
  }

  // Clean up old throttling entries (older than 1 hour)
  const oneHourAgo = now - 60 * 60 * 1000;
  for (const [key, timestamp] of throttleStorage.entries()) {
    if (timestamp < oneHourAgo) {
      throttleStorage.delete(key);
    }
  }

  // Add URL to the request data for verification
  const dataWithUrl = {
    ...request,
    url: tabUrl,
    timestamp: now
  };
  (0,_tab_manager_js__WEBPACK_IMPORTED_MODULE_0__.storeTabResults)(tabId, dataWithUrl);

  // Forward to any open detached windows
  forwardToDetachedWindows(request);
}

// Add this new function after handleAnalysisResults
function handleINPUpdate(request, sender) {
  const tabId = sender.tab.id;
  const now = Date.now();

  // Throttle logging for INP updates (max once per 3 seconds per tab)
  const lastLogKey = `lastINPLog_${tabId}`;
  const lastLogTime = throttleStorage.get(lastLogKey) || 0;
  if (now - lastLogTime > 3000) {
    console.log("⚡ [Local INP] Storing local INP measurement for tab:", tabId, "value:", request.value + "ms");
    throttleStorage.set(lastLogKey, now);
  }

  // Get existing results and update INP data
  const existingResults = (0,_tab_manager_js__WEBPACK_IMPORTED_MODULE_0__.getTabResults)(tabId) || {};
  existingResults.inp = {
    value: request.value,
    entries: request.entries,
    rating: request.rating,
    status: request.status
  };
  (0,_tab_manager_js__WEBPACK_IMPORTED_MODULE_0__.storeTabResults)(tabId, existingResults);

  // Forward to detached windows
  forwardToDetachedWindows(request);
}

/**
 * Forwards messages to detached windows
 * @param {Object} message - Message to forward
 */
async function forwardToDetachedWindows(message) {
  try {
    const currentState = await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_3__.getWindowState)();
    if (currentState === _utils_window_state_js__WEBPACK_IMPORTED_MODULE_3__.WINDOW_STATES.DETACHED) {
      // Send message to all extension contexts (including detached windows)
      chrome.runtime.sendMessage(message).catch(() => {
        // Ignore errors if no receivers
      });
    }
  } catch (error) {
    console.debug("⚠️ [Window] Error forwarding to detached windows:", error);
  }
}

/**
 * Handles requests for analysis results
 * @param {Object} request - The request object
 * @param {Function} sendResponse - The response callback
 */
function handleGetAnalysisResults(request, sendResponse) {
  const results = (0,_tab_manager_js__WEBPACK_IMPORTED_MODULE_0__.getTabResults)(request.tabId);
  console.log("💻 [Local Analysis] Retrieving local analysis results for tab:", request.tabId, results ? "✅ found" : "❌ not found");
  sendResponse(results);
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
    console.log("⚙️ [Parameters] Updating parameters for specific tab:", request.tabId);
    chrome.tabs.get(request.tabId, tab => {
      if (chrome.runtime.lastError || !tab) {
        console.error("❌ [Parameters] Tab not found:", request.tabId, chrome.runtime.lastError);
        sendResponse({
          urlChanged: false,
          error: "Tab not found"
        });
        return;
      }
      let changed = false;
      if (request.add) {
        changed = (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.addTabParameter)(tab.id, request.parameter);
      } else {
        changed = (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.removeTabParameter)(tab.id, request.parameter);
      }
      if (changed) {
        (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.applyParametersToTab)(tab.id, chrome);
      }
      sendResponse({
        urlChanged: changed
      });
    });
  } else {
    // Fallback to active tab behavior
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
        sendResponse({
          urlChanged: false,
          error: "No active tab found"
        });
        return;
      }
      const activeTab = tabs[0];
      let changed = false;
      if (request.add) {
        changed = (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.addTabParameter)(activeTab.id, request.parameter);
      } else {
        changed = (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.removeTabParameter)(activeTab.id, request.parameter);
      }
      if (changed) {
        (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.applyParametersToTab)(activeTab.id, chrome);
      }
      sendResponse({
        urlChanged: changed
      });
    });
  }
}

/**
 * Handles requests for parameters
 * @param {Function} sendResponse - The response callback
 * @param {Object} chrome - The Chrome API object
 */
function handleGetParameters(sendResponse, chrome) {
  // If a specific tab ID is provided in the request, use it
  const request = arguments[2]; // Get the original request object

  if (request && request.tabId) {
    console.log("⚙️ [Parameters] Getting parameters for specific tab:", request.tabId);
    const params = (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.getTabParameters)(request.tabId);
    sendResponse(Array.from(params));
    return;
  }

  // Fallback to active tab behavior
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, tabs => {
    if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
      sendResponse([]);
      return;
    }
    const activeTab = tabs[0];
    const params = (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.getTabParameters)(activeTab.id);
    sendResponse(Array.from(params));
  });
}

/**
 * Handles popup detachment requests
 * @param {Function} sendResponse - The response callback
 * @param {Object} chrome - The Chrome API object
 */
async function handleDetachPopup(sendResponse, chrome) {
  try {
    console.log("🪟 [Window] Creating detached popup window");

    // Get the current active tab ID to pass to the detached window
    const tabs = await new Promise(resolve => {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, tabs => {
        if (chrome.runtime.lastError) {
          resolve([]);
        } else {
          resolve(tabs || []);
        }
      });
    });
    const originalTabId = tabs.length > 0 ? tabs[0].id : null;
    console.log("🪟 [Window] Original tab ID for detached window:", originalTabId);
    const window = await (0,_window_manager_js__WEBPACK_IMPORTED_MODULE_2__.createDetachedWindow)(originalTabId);
    sendResponse({
      success: true,
      windowId: window.id,
      originalTabId
    });
  } catch (error) {
    console.error("❌ [Window] Failed to create detached window:", error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handles popup attachment requests
 * @param {Function} sendResponse - The response callback
 */
async function handleAttachPopup(sendResponse) {
  try {
    console.log("📎 [Window] Attaching popup to extension icon");
    await (0,_window_manager_js__WEBPACK_IMPORTED_MODULE_2__.attachPopup)();
    sendResponse({
      success: true
    });
  } catch (error) {
    console.error("❌ [Window] Failed to attach popup:", error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handles window state requests
 * @param {Function} sendResponse - The response callback
 */
async function handleGetWindowState(sendResponse) {
  try {
    const state = await (0,_window_manager_js__WEBPACK_IMPORTED_MODULE_2__.getCurrentWindowState)();
    sendResponse({
      state
    });
  } catch (error) {
    sendResponse({
      state: "attached",
      error: error.message
    });
  }
}

/***/ }),

/***/ 662:
/*!***************************************!*\
  !*** ./src/background/tab-manager.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   cleanupPSIResults: () => (/* binding */ cleanupPSIResults),
/* harmony export */   cleanupTab: () => (/* binding */ cleanupTab),
/* harmony export */   getPSIResults: () => (/* binding */ getPSIResults),
/* harmony export */   getTabResults: () => (/* binding */ getTabResults),
/* harmony export */   storePSIResults: () => (/* binding */ storePSIResults),
/* harmony export */   storeTabResults: () => (/* binding */ storeTabResults)
/* harmony export */ });
/**
 * Module for managing tab-specific data
 */

// Store analysis results per tab
const tabResults = new Map();
// Store PSI results per tab
const tabPSIResults = new Map();

/**
 * Stores analysis results for a specific tab
 * @param {number} tabId - The ID of the tab
 * @param {Object} results - The analysis results to store
 */
function storeTabResults(tabId, results) {
  tabResults.set(tabId, results);
}

/**
 * Gets analysis results for a specific tab
 * @param {number} tabId - The ID of the tab
 * @returns {Object|null} The analysis results or null if not found
 */
function getTabResults(tabId) {
  return tabResults.get(tabId) || null;
}

/**
 * Stores PSI results for a specific tab
 * @param {number} tabId - The ID of the tab
 * @param {Object} psiResults - The PSI results to store
 */
function storePSIResults(tabId, psiResults) {
  tabPSIResults.set(tabId, psiResults);
}

/**
 * Gets PSI results for a specific tab
 * @param {number} tabId - The ID of the tab
 * @returns {Object|null} The PSI results or null if not found
 */
function getPSIResults(tabId) {
  return tabPSIResults.get(tabId) || null;
}

/**
 * Removes stored PSI data for a tab
 * @param {number} tabId - The ID of the tab to clean up
 */
function cleanupPSIResults(tabId) {
  tabPSIResults.delete(tabId);
}

/**
 * Removes stored data for a tab
 * @param {number} tabId - The ID of the tab to clean up
 */
function cleanupTab(tabId) {
  tabResults.delete(tabId);
  cleanupPSIResults(tabId); // Also cleanup PSI results
}

/***/ }),

/***/ 870:
/*!*********************************************!*\
  !*** ./src/background/parameter-manager.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addTabParameter: () => (/* binding */ addTabParameter),
/* harmony export */   applyParametersToTab: () => (/* binding */ applyParametersToTab),
/* harmony export */   cleanupTabParameters: () => (/* binding */ cleanupTabParameters),
/* harmony export */   getParametersFromUrl: () => (/* binding */ getParametersFromUrl),
/* harmony export */   getTabParameters: () => (/* binding */ getTabParameters),
/* harmony export */   removeTabParameter: () => (/* binding */ removeTabParameter),
/* harmony export */   storeTabParameters: () => (/* binding */ storeTabParameters),
/* harmony export */   updateUrlWithParameters: () => (/* binding */ updateUrlWithParameters)
/* harmony export */ });
/**
 * Module for managing URL parameters
 */

// Store query parameters per tab
const tabParameters = new Map();

/**
 * Updates URL with parameters
 * @param {string} url - The original URL
 * @param {Set} parameters - Set of parameters to add
 * @returns {string} The updated URL
 */
function updateUrlWithParameters(url, parameters) {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
      if (!parameters.has(key)) {
        urlObj.searchParams.delete(key);
      }
    });
    parameters.forEach(param => {
      urlObj.searchParams.set(param, "");
    });
    return urlObj.toString();
  } catch (error) {
    return url; // Return original URL if there's an error
  }
}

/**
 * Gets parameters from a URL
 * @param {string} url - The URL to extract parameters from
 * @returns {Set} Set of parameter names
 */
function getParametersFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return new Set(urlObj.searchParams.keys());
  } catch (error) {
    return new Set();
  }
}

/**
 * Stores parameters for a specific tab
 * @param {number} tabId - The ID of the tab
 * @param {Set} parameters - The parameters to store
 */
function storeTabParameters(tabId, parameters) {
  tabParameters.set(tabId, parameters);
}

/**
 * Gets parameters for a specific tab
 * @param {number} tabId - The ID of the tab
 * @returns {Set} The stored parameters or an empty Set if not found
 */
function getTabParameters(tabId) {
  return tabParameters.get(tabId) || new Set();
}

/**
 * Adds a parameter to a tab
 * @param {number} tabId - The ID of the tab
 * @param {string} parameter - The parameter to add
 * @returns {boolean} True if the parameter was added, false if it was already present
 */
function addTabParameter(tabId, parameter) {
  let params = tabParameters.get(tabId);
  if (!params) {
    params = new Set();
    tabParameters.set(tabId, params);
  }
  if (params.has(parameter)) {
    return false;
  }
  params.add(parameter);
  return true;
}

/**
 * Removes a parameter from a tab
 * @param {number} tabId - The ID of the tab
 * @param {string} parameter - The parameter to remove
 * @returns {boolean} True if the parameter was removed, false if it wasn't present
 */
function removeTabParameter(tabId, parameter) {
  const params = tabParameters.get(tabId);
  if (!params || !params.has(parameter)) {
    return false;
  }
  params.delete(parameter);
  return true;
}

/**
 * Removes stored parameters for a tab
 * @param {number} tabId - The ID of the tab to clean up
 */
function cleanupTabParameters(tabId) {
  tabParameters.delete(tabId);
}

/**
 * Applies stored parameters to a tab's URL
 * @param {number} tabId - The ID of the tab
 * @param {Object} chrome - The Chrome API object
 */
function applyParametersToTab(tabId, chrome) {
  chrome.tabs.get(tabId, tab => {
    if (chrome.runtime.lastError) {
      return;
    }
    const params = getTabParameters(tabId);
    const currentUrlParams = getParametersFromUrl(tab.url);
    const newUrl = updateUrlWithParameters(tab.url, params);
    if (newUrl !== tab.url && !setsEqual(params, currentUrlParams)) {
      chrome.tabs.update(tabId, {
        url: newUrl
      });
    }
  });
}

/**
 * Compares two sets for equality
 * @param {Set} a - First set
 * @param {Set} b - Second set
 * @returns {boolean} True if sets are equal
 */
function setsEqual(a, b) {
  return a.size === b.size && [...a].every(value => b.has(value));
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************************!*\
  !*** ./src/background/index.js ***!
  \*********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _tab_manager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tab-manager.js */ 662);
/* harmony import */ var _parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parameter-manager.js */ 870);
/* harmony import */ var _message_handler_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./message-handler.js */ 577);
/* harmony import */ var _window_manager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./window-manager.js */ 165);
/**
 * Background service worker for the BigScoots Performance Debugger extension
 */






// Declare chrome variable

// Set up message handlers
(0,_message_handler_js__WEBPACK_IMPORTED_MODULE_2__.setupMessageHandlers)(chrome);

// Handle extension icon clicks with proper async handling
chrome.action.onClicked.addListener(async tab => {
  console.log("Extension icon clicked for tab:", tab.id);
  const handled = await (0,_message_handler_js__WEBPACK_IMPORTED_MODULE_2__.handleExtensionIconClick)();
  console.log("Icon click handled:", handled);

  // If handled is true, we focused a detached window and should prevent default popup
  // If handled is false, Chrome will show the default popup
});

// Handle tab removal
chrome.tabs.onRemoved.addListener(tabId => {
  (0,_tab_manager_js__WEBPACK_IMPORTED_MODULE_0__.cleanupTab)(tabId);
  (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.cleanupTabParameters)(tabId);
});

// Handle navigation events
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  if (details.frameId === 0) {
    try {
      // Only handle main frame navigation
      const currentParams = (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.getTabParameters)(details.tabId);
      if (currentParams && currentParams.size > 0) {
        const urlParams = (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.getParametersFromUrl)(details.url);
        const mergedParams = new Set([...urlParams, ...currentParams]);

        // Update URL only if new parameters were added
        if (mergedParams.size > urlParams.size) {
          const newUrl = (0,_parameter_manager_js__WEBPACK_IMPORTED_MODULE_1__.updateUrlWithParameters)(details.url, mergedParams);
          if (newUrl !== details.url) {
            chrome.tabs.update(details.tabId, {
              url: newUrl
            });
          }
        }
      }
    } catch (error) {
      // Silent error handling
    }
  }
});

// Handle window removal (for detached popup cleanup)
chrome.windows.onRemoved.addListener(async windowId => {
  // Check if this is our detached window
  const isOurWindow = await (0,_window_manager_js__WEBPACK_IMPORTED_MODULE_3__.isDetachedWindow)(windowId);
  if (isOurWindow) {
    console.log("Detached window closed, cleaning up");
    await (0,_window_manager_js__WEBPACK_IMPORTED_MODULE_3__.handleDetachedWindowClosed)();
  }
});

// Handle window bounds changes (save position when user moves/resizes)
chrome.windows.onBoundsChanged.addListener(async window => {
  const isOurWindow = await (0,_window_manager_js__WEBPACK_IMPORTED_MODULE_3__.isDetachedWindow)(window.id);
  if (isOurWindow) {
    await (0,_window_manager_js__WEBPACK_IMPORTED_MODULE_3__.saveWindowBounds)(window.id);
  }
});
console.log("BigScoots Performance Debugger background service worker initialized");
})();

/******/ })()
;
//# sourceMappingURL=background.js.map