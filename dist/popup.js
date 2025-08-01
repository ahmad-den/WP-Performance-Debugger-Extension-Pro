/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 18:
/*!****************************************************!*\
  !*** ./src/popup/displays/psi-insights-display.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clearPSIInsightsDisplay: () => (/* binding */ clearPSIInsightsDisplay),
/* harmony export */   getPSIInsightsState: () => (/* binding */ getPSIInsightsState),
/* harmony export */   setPSIInsightsLoading: () => (/* binding */ setPSIInsightsLoading),
/* harmony export */   updatePSIInsightsDisplay: () => (/* binding */ updatePSIInsightsDisplay)
/* harmony export */ });
/* harmony import */ var _insights_renderer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./insights-renderer.js */ 864);
/**
 * Module for handling PSI Insights display in the popup
 */

// Chrome API is available globally in extension context
const chrome = globalThis.chrome || window.chrome;


/**
 * PSI Insights state management
 */
const psiInsightsState = {
  insights: {},
  lastUpdate: null,
  isLoading: false,
  hasError: false,
  errorMessage: ""
};

/**
 * Updates PSI insights display with data from PSI API
 * @param {Object} psiData - Complete PSI API response data
 */
function updatePSIInsightsDisplay(psiData) {
  console.log("=== updatePSIInsightsDisplay called ===");
  console.log("PSI Data received:", psiData);
  try {
    // Extract insights from PSI data structure
    const insights = extractPSIInsights(psiData);
    if (!insights || Object.keys(insights).length === 0) {
      console.log("No PSI insights found in data");
      showEmptyInsightsState();
      return;
    }
    console.log("Extracted PSI insights:", insights);

    // Update state
    psiInsightsState.insights = insights;
    psiInsightsState.lastUpdate = Date.now();
    psiInsightsState.isLoading = false;
    psiInsightsState.hasError = false;

    // Update UI
    displayPSIInsights(insights);
  } catch (error) {
    console.error("Error updating PSI insights display:", error);
    psiInsightsState.hasError = true;
    psiInsightsState.errorMessage = error.message;
    psiInsightsState.isLoading = false;
    showInsightsError(error.message);
  }
}
function extractPSIInsights(psiData) {
  console.log("=== extractPSIInsights called ===");
  try {
    // Navigate through the PSI data structure
    if (!psiData || !psiData.data) {
      console.log("No PSI data or data property found");
      return null;
    }
    const lighthouseResult = psiData.data.lighthouseResult;
    if (!lighthouseResult) {
      console.log("No lighthouseResult found in PSI data");
      return null;
    }
    const audits = lighthouseResult.audits;
    if (!audits) {
      console.log("No audits found in lighthouse result");
      return null;
    }
    const allInsights = {};

    // Extract failed insights
    if (audits.failed && audits.failed.insights) {
      console.log("Found failed insights:", audits.failed.insights);
      Object.keys(audits.failed.insights).forEach(key => {
        allInsights[key] = {
          ...audits.failed.insights[key],
          category: "failed",
          score: 0 // Failed insights have score of 0
        };
      });
    }

    // Extract warning insights
    if (audits.warnings && audits.warnings.insights) {
      console.log("Found warning insights:", audits.warnings.insights);
      Object.keys(audits.warnings.insights).forEach(key => {
        allInsights[key] = {
          ...audits.warnings.insights[key],
          category: "warning",
          score: 0.7 // Warning insights have score between 0.5-0.89
        };
      });
    }
    console.log("Successfully extracted all insights:", allInsights);
    return Object.keys(allInsights).length > 0 ? allInsights : null;
  } catch (error) {
    console.error("Error extracting PSI insights:", error);
    return null;
  }
}
function displayPSIInsights(insights) {
  console.log("=== displayPSIInsights called ===");
  console.log("Displaying insights:", insights);
  const container = document.getElementById("psiInsightsContainer");
  if (!container) {
    console.log("PSI insights container not found in DOM");
    return;
  }

  // Convert insights object to array format expected by renderer
  const insightsArray = Object.keys(insights).map(insightKey => {
    const insightData = insights[insightKey];
    return {
      id: insightKey,
      title: insightData.title || insightKey,
      description: insightData.description,
      details: insightData.details,
      ...insightData
    };
  });

  // Use the insights renderer to display the insights
  _insights_renderer_js__WEBPACK_IMPORTED_MODULE_0__.insightsRenderer.renderInsights(container, insightsArray);

  // Show the container
  container.style.display = "block";
}

/**
 * Formats insight key into readable title
 * @param {string} insightKey - Raw insight key
 * @returns {string} Formatted title
 */

/**
 * Shows empty state when no insights are available
 */
function showEmptyInsightsState() {
  console.log("=== showEmptyInsightsState called ===");
  const container = document.getElementById("psiInsightsContainer");
  if (!container) return;
  container.innerHTML = `
    <div class="psi-insights-empty">
      <p>No performance insights available</p>
      <small>Run PSI analysis to get detailed insights</small>
    </div>
  `;
  container.style.display = "block";
}

/**
 * Shows error state for insights
 * @param {string} errorMessage - Error message to display
 */
function showInsightsError(errorMessage) {
  console.log("=== showInsightsError called ===");
  console.log("Error message:", errorMessage);
  const container = document.getElementById("psiInsightsContainer");
  if (!container) return;
  container.innerHTML = `
    <div class="psi-insights-error">
      <p>Error loading insights: ${errorMessage}</p>
    </div>
  `;
  container.style.display = "block";
}

/**
 * Clears PSI insights display
 */
function clearPSIInsightsDisplay() {
  console.log("=== clearPSIInsightsDisplay called ===");
  const container = document.getElementById("psiInsightsContainer");
  if (container) {
    container.innerHTML = "";
    container.style.display = "none";
  }

  // Reset state
  psiInsightsState.insights = {};
  psiInsightsState.lastUpdate = null;
  psiInsightsState.hasError = false;
  psiInsightsState.errorMessage = "";
}

/**
 * Sets loading state for PSI insights
 * @param {boolean} isLoading - Loading state
 */
function setPSIInsightsLoading(isLoading) {
  console.log("=== setPSIInsightsLoading called ===", isLoading);
  psiInsightsState.isLoading = isLoading;
  const container = document.getElementById("psiInsightsContainer");
  if (!container) return;
  if (isLoading) {
    container.innerHTML = `
      <div class="psi-insights-loading">
        <p>Loading performance insights...</p>
      </div>
    `;
    container.style.display = "block";
  }
}

/**
 * Gets current PSI insights state
 * @returns {Object} Current insights state
 */
function getPSIInsightsState() {
  return {
    ...psiInsightsState
  };
}

/***/ }),

/***/ 153:
/*!*************************************!*\
  !*** ./src/popup/toggle-manager.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setupToggleManagement: () => (/* binding */ setupToggleManagement),
/* harmony export */   updateToggleStates: () => (/* binding */ updateToggleStates)
/* harmony export */ });
/**
 * Module for managing debug toggles and parameters with proper loading detection
 */

// Global state management
let isProcessingToggle = false;
const toggleQueue = [];
let currentOperation = null;

/**
 * Sets up toggle functionality
 */
function setupToggleManagement() {
  // Load initial toggle states using the target tab ID
  loadInitialToggleStates();

  // Add event listeners to toggles with queuing
  const toggleInputs = document.querySelectorAll(".toggle-input");
  toggleInputs.forEach(input => {
    input.addEventListener("change", event => {
      // Prevent rapid clicking
      if (isProcessingToggle) {
        event.preventDefault();
        input.checked = !input.checked; // Revert the change
        return;
      }

      // Queue the toggle change
      queueToggleChange(input.id, input.checked);
    });
  });
}

/**
 * Loads initial toggle states for the current target tab
 */
async function loadInitialToggleStates() {
  try {
    // Get the target tab ID (works in both attached and detached modes)
    const targetTabId = await window.getTargetTabId();
    if (!targetTabId) {
      console.log("No target tab available for loading toggle states");
      // Set all toggles to unchecked if no tab available
      document.getElementById("perfmattersoff").checked = false;
      document.getElementById("perfmatterscssoff").checked = false;
      document.getElementById("perfmattersjsoff").checked = false;
      document.getElementById("nocache").checked = false;
      updateToggleStates(true);
      return;
    }
    console.log("Loading toggle states for tab:", targetTabId);

    // Get parameters for the specific tab
    chrome.runtime.sendMessage({
      action: "getParameters",
      tabId: targetTabId
    }, parameters => {
      if (chrome.runtime.lastError) {
        console.error("Error getting parameters:", chrome.runtime.lastError);
        parameters = [];
      }

      // Ensure parameters is an array
      if (!Array.isArray(parameters)) {
        parameters = [];
      }
      console.log("Loaded parameters for tab", targetTabId, ":", parameters);

      // Update toggle states based on parameters
      document.getElementById("perfmattersoff").checked = parameters.includes("perfmattersoff");
      document.getElementById("perfmatterscssoff").checked = parameters.includes("perfmatterscssoff");
      document.getElementById("perfmattersjsoff").checked = parameters.includes("perfmattersjsoff");
      document.getElementById("nocache").checked = parameters.includes("nocache");
      updateToggleStates(true); // Pass true to skip parameter updates during initial load
    });
  } catch (error) {
    console.error("Error loading initial toggle states:", error);
    // Fallback to unchecked state
    document.getElementById("perfmattersoff").checked = false;
    document.getElementById("perfmatterscssoff").checked = false;
    document.getElementById("perfmattersjsoff").checked = false;
    document.getElementById("nocache").checked = false;
    updateToggleStates(true);
  }
}

/**
 * Queues a toggle change to be processed sequentially
 * @param {string} toggleId - The ID of the toggle
 * @param {boolean} isChecked - Whether the toggle is checked
 */
function queueToggleChange(toggleId, isChecked) {
  const operation = {
    toggleId,
    isChecked,
    timestamp: Date.now()
  };
  toggleQueue.push(operation);
  console.log(`Queued toggle change: ${toggleId} = ${isChecked}`);

  // Process the queue if not already processing
  if (!isProcessingToggle) {
    processToggleQueue();
  }
}

/**
 * Processes the toggle queue sequentially
 */
async function processToggleQueue() {
  if (isProcessingToggle || toggleQueue.length === 0) {
    return;
  }
  isProcessingToggle = true;
  while (toggleQueue.length > 0) {
    const operation = toggleQueue.shift();
    currentOperation = operation;
    console.log(`Processing toggle: ${operation.toggleId} = ${operation.isChecked}`);

    // Update UI to show loading state
    updateToggleStates(true); // Skip parameter updates, just update UI

    // Process the parameter change and wait for site to load
    await processParameterChangeAndWaitForLoad(operation.toggleId, operation.isChecked);
  }
  currentOperation = null;
  isProcessingToggle = false;

  // Final UI update
  updateToggleStates(true);
  console.log("Toggle queue processing completed");
}

/**
 * Processes a single parameter change and waits for site to fully load
 * @param {string} toggleId - The ID of the toggle
 * @param {boolean} isChecked - Whether the toggle is checked
 * @returns {Promise} Promise that resolves when the change is complete and site is loaded
 */
async function processParameterChangeAndWaitForLoad(toggleId, isChecked) {
  return new Promise(async resolve => {
    // Map toggle IDs to parameter names
    const parameterMap = {
      perfmattersoff: "perfmattersoff",
      perfmatterscssoff: "perfmatterscssoff",
      perfmattersjsoff: "perfmattersjsoff",
      nocache: "nocache"
    };
    const parameter = parameterMap[toggleId];
    if (!parameter) {
      console.error("Unknown toggle ID:", toggleId);
      resolve();
      return;
    }
    try {
      // Get the target tab ID (works in both attached and detached modes)
      const targetTabId = await window.getTargetTabId();
      if (!targetTabId) {
        console.error("No target tab available for parameter update");
        resolve();
        return;
      }
      console.log("Processing parameter change for tab:", targetTabId, "parameter:", parameter, "value:", isChecked);

      // Send parameter update with specific tab ID
      chrome.runtime.sendMessage({
        action: "updateParameters",
        parameter: parameter,
        add: isChecked,
        tabId: targetTabId // Include the specific tab ID
      }, response => {
        if (chrome.runtime.lastError) {
          console.error("Parameter update error:", chrome.runtime.lastError);
          resolve();
          return;
        }
        if (response && response.error) {
          console.error("Parameter update failed:", response.error);
          resolve();
          return;
        }
        if (response && response.urlChanged) {
          console.log(`URL updated for ${parameter} on tab ${targetTabId}, waiting for page to load...`);

          // Wait for the tab to finish loading + additional time
          waitForTabToLoadWithDelay(targetTabId).then(() => {
            console.log(`Page loaded successfully after ${parameter} change on tab ${targetTabId}`);
            resolve();
          }).catch(error => {
            console.error("Error waiting for page load:", error);
            // Resolve anyway after timeout
            setTimeout(resolve, 5000);
          });
        } else {
          console.log(`No URL change needed for ${parameter} on tab ${targetTabId}`);
          // Still add delay even if no URL change needed to ensure consistency
          setTimeout(resolve, 2000);
        }
      });
    } catch (error) {
      console.error("Error in processParameterChangeAndWaitForLoad:", error);
      resolve();
    }
  });
}

/**
 * Waits for a tab to finish loading completely with additional delay
 * @param {number} tabId - The ID of the tab to monitor
 * @returns {Promise} Promise that resolves when the tab is fully loaded
 */
function waitForTabToLoadWithDelay(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = 20000; // 20 second timeout
    const startTime = Date.now();
    function checkTabStatus() {
      chrome.tabs.get(tabId, tab => {
        if (chrome.runtime.lastError) {
          reject(new Error("Tab not found"));
          return;
        }

        // Check if tab is complete
        if (tab.status === "complete") {
          // Additional wait to ensure all resources are loaded + fake delay for control
          setTimeout(() => {
            console.log(`Tab ${tabId} finished loading with additional delay`);
            resolve();
          }, 3000); // 3 second additional delay as requested
          return;
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          console.warn(`Timeout waiting for tab ${tabId} to load`);
          resolve(); // Resolve anyway to not block the queue
          return;
        }

        // Tab still loading, check again
        setTimeout(checkTabStatus, 500);
      });
    }

    // Start checking
    checkTabStatus();
  });
}

/**
 * Updates toggle states and dependencies
 * @param {boolean} skipParameterUpdate - Whether to skip updating parameters
 */
function updateToggleStates(skipParameterUpdate = false) {
  const perfmattersoff = document.getElementById("perfmattersoff");
  const perfmatterscssoff = document.getElementById("perfmatterscssoff");
  const perfmattersjsoff = document.getElementById("perfmattersjsoff");
  const nocache = document.getElementById("nocache");
  const isPerfmattersOff = perfmattersoff.checked;

  // Get all toggle containers
  const allContainers = [perfmattersoff.closest(".toggle-container"), perfmatterscssoff.closest(".toggle-container"), perfmattersjsoff.closest(".toggle-container"), nocache.closest(".toggle-container")];

  // Apply loading state to all toggles if processing
  if (isProcessingToggle) {
    allContainers.forEach((container, index) => {
      const toggleIds = ["perfmattersoff", "perfmatterscssoff", "perfmattersjsoff", "nocache"];
      const toggleId = toggleIds[index];
      if (container) {
        const input = container.querySelector(".toggle-input");
        if (input) input.disabled = true;

        // Only show "processing" on the currently active toggle
        if (currentOperation && currentOperation.toggleId === toggleId) {
          container.classList.add("processing-current");
          container.classList.remove("disabled-toggle");
        } else {
          // All other toggles appear disabled
          container.classList.add("disabled-toggle");
          container.classList.remove("processing-current");
        }
      }
    });
    return;
  }

  // Clear all loading states
  allContainers.forEach(container => {
    if (container) {
      container.classList.remove("processing-current", "disabled-toggle");
      const input = container.querySelector(".toggle-input");
      if (input) input.disabled = false;
    }
  })

  // Handle dependent toggles
  ;
  [perfmatterscssoff, perfmattersjsoff].forEach(toggle => {
    toggle.disabled = isPerfmattersOff;
    const container = toggle.closest(".toggle-container");
    if (isPerfmattersOff) {
      toggle.checked = false;
      container.classList.add("disabled-toggle");
    } else {
      container.classList.remove("disabled-toggle");
    }
  });

  // Handle nocache toggle
  nocache.disabled = isPerfmattersOff || perfmatterscssoff.checked || perfmattersjsoff.checked;
  const nocacheContainer = nocache.closest(".toggle-container");
  if (nocache.disabled) {
    if (nocache.checked) nocache.checked = false;
    nocacheContainer.classList.add("disabled-toggle");
  } else {
    nocacheContainer.classList.remove("disabled-toggle");
  }

  // Handle main perfmatters toggle
  perfmattersoff.disabled = false;
  const perfmattersContainer = perfmattersoff.closest(".toggle-container");
  perfmattersContainer.classList.remove("disabled-toggle");
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

/***/ 272:
/*!********************************!*\
  !*** ./src/utils/messaging.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   safeSendMessage: () => (/* binding */ safeSendMessage),
/* harmony export */   sendMessageToTab: () => (/* binding */ sendMessageToTab),
/* harmony export */   setupMessageListener: () => (/* binding */ setupMessageListener)
/* harmony export */ });
/**
 * Safely sends a message to the extension runtime
 * @param {Object} message - The message to send
 * @param {Function} callback - Optional callback function
 */
function safeSendMessage(message, callback) {
  try {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        return;
      }
      if (callback) callback(response);
    });
  } catch (error) {
    // Extension context invalidated or other error
    console.debug("Message sending failed:", error);
  }
}

/**
 * Sends a message to a specific tab
 * @param {number} tabId - The ID of the tab to send the message to
 * @param {Object} message - The message to send
 * @param {Function} callback - Optional callback function
 */
function sendMessageToTab(tabId, message, callback) {
  try {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        return;
      }
      if (callback) callback(response);
    });
  } catch (error) {
    console.debug("Tab message sending failed:", error);
  }
}

/**
 * Sets up a listener for messages from content scripts or popup
 * @param {Object} handlers - Object mapping action names to handler functions
 */
function setupMessageListener(handlers) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const action = message.action;
    if (handlers[action]) {
      handlers[action](message, sender, sendResponse);
    }
    return true; // Keep the message channel open for async responses
  });
}

/***/ }),

/***/ 333:
/*!********************************************!*\
  !*** ./src/popup/displays/font-display.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   updateFontDisplay: () => (/* binding */ updateFontDisplay)
/* harmony export */ });
/**
 * Module for handling font display in the popup
 */

/**
 * Updates the font display with analysis results
 * @param {Array} fonts - Array of font data
 */
function updateFontDisplay(fonts) {
  const fontInfo = document.getElementById("fontInfo");
  const fontCountEl = document.getElementById("fontCount");
  const fontList = document.getElementById("fontList");

  // Add margin if no button is present
  if (fontInfo) fontInfo.style.marginTop = "0px";
  const totalFonts = fonts.length;
  fontCountEl.textContent = `Found ${totalFonts} font${totalFonts !== 1 ? "s" : ""} loaded`;
  fontList.innerHTML = "";
  if (totalFonts === 0) {
    fontInfo.style.display = "block";
    const p = document.createElement("p");
    p.textContent = "No fonts detected loading on this page.";
    p.className = "empty-state-message";
    fontList.appendChild(p);
    return;
  }
  fonts.forEach((font, index) => {
    const li = createFontListItem(font, index);
    fontList.appendChild(li);
  });
  fontInfo.style.display = "block";
}

/**
 * Creates a list item for a font
 * @param {Object} font - Font data object
 * @param {number} index - Font index
 * @returns {HTMLElement} The created list item
 */
function createFontListItem(font, index) {
  const li = document.createElement("li");
  li.className = "card-style font-list-item";
  const numberBadge = document.createElement("div");
  numberBadge.className = "font-list-item-badge";
  numberBadge.textContent = index + 1;
  const contentContainer = createFontContentContainer(font);
  li.appendChild(numberBadge);
  li.appendChild(contentContainer);
  return li;
}

/**
 * Creates the content container for a font
 * @param {Object} font - Font data object
 * @returns {HTMLElement} The content container
 */
function createFontContentContainer(font) {
  const contentContainer = document.createElement("div");
  contentContainer.className = "font-list-item-content";
  const urlContainer = createFontUrlContainer(font);
  contentContainer.appendChild(urlContainer);
  const statusContainer = createFontStatusContainer(font);
  contentContainer.appendChild(statusContainer);
  return contentContainer;
}

/**
 * Creates the URL container with copy button
 * @param {Object} font - Font data object
 * @returns {HTMLElement} The URL container
 */
function createFontUrlContainer(font) {
  const urlContainer = document.createElement("div");
  urlContainer.className = "url-container";
  const urlSpan = document.createElement("span");
  urlSpan.className = "font-url";
  urlSpan.textContent = font.url;
  urlSpan.title = font.url;
  const copyButton = createCopyButton(font.url);
  urlContainer.appendChild(urlSpan);
  urlContainer.appendChild(copyButton);
  return urlContainer;
}

/**
 * Creates a copy button for a URL
 * @param {string} url - The URL to copy
 * @returns {HTMLElement} The copy button
 */
function createCopyButton(url) {
  const copyButton = document.createElement("button");
  copyButton.className = "copy-button icon-button-sm";
  copyButton.title = "Copy URL";
  const originalCopyIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const copiedIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  copyButton.innerHTML = originalCopyIcon;
  copyButton.onclick = e => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      copyButton.innerHTML = copiedIcon;
      copyButton.classList.add("copied-feedback");
      setTimeout(() => {
        copyButton.innerHTML = originalCopyIcon;
        copyButton.classList.remove("copied-feedback");
      }, 1200);
    });
  };
  return copyButton;
}

/**
 * Creates the status container with status indicators
 * @param {Object} font - Font data object
 * @returns {HTMLElement} The status container
 */
function createFontStatusContainer(font) {
  const statusContainer = document.createElement("div");
  statusContainer.className = "status-container";

  // Early Hints indicator (highest priority)
  if (font.earlyHints) {
    const earlyHintsSticker = document.createElement("span");
    earlyHintsSticker.textContent = "EARLY HINTS";
    earlyHintsSticker.className = "status-sticker early-hints";
    statusContainer.appendChild(earlyHintsSticker);
  }

  // Font type sticker
  if (font.type) {
    const typeSticker = document.createElement("span");
    typeSticker.textContent = font.type;
    typeSticker.className = `status-sticker font-type font-type-${font.type.toLowerCase()}`;
    statusContainer.appendChild(typeSticker);
  }

  // Preload status sticker
  const preloadedSticker = document.createElement("span");
  preloadedSticker.textContent = font.preloaded ? "PRELOADED" : "NOT PRELOADED";
  preloadedSticker.className = font.preloaded ? "status-sticker preloaded" : "status-sticker not-preloaded";
  statusContainer.appendChild(preloadedSticker);
  return statusContainer;
}

/***/ }),

/***/ 378:
/*!**********************************!*\
  !*** ./src/popup/tab-manager.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setupTabSwitching: () => (/* binding */ setupTabSwitching)
/* harmony export */ });
/**
 * Module for managing popup tabs
 */

console.log("=== TAB MANAGER LOADING ===");

/**
 * Sets up tab switching functionality
 * @param {Array} tabs - Array of tab configuration objects
 */
function setupTabSwitching(tabs) {
  console.log("setupTabSwitching called with tabs:", tabs);
  function switchTab(activeTabId) {
    console.log("switchTab called with:", activeTabId);
    tabs.forEach(tabInfo => {
      const tabEl = document.getElementById(tabInfo.id);
      const contentEl = document.getElementById(tabInfo.contentId);
      console.log(`Processing tab ${tabInfo.id}:`, !!tabEl, !!contentEl);
      if (tabEl && contentEl) {
        if (tabInfo.id === activeTabId) {
          tabEl.classList.add("active");
          contentEl.classList.add("active");
          console.log(`Activated tab: ${tabInfo.id}`);
        } else {
          tabEl.classList.remove("active");
          contentEl.classList.remove("active");
        }
      } else {
        console.warn(`Missing elements for tab ${tabInfo.id}:`, {
          tabEl: !!tabEl,
          contentEl: !!contentEl
        });
      }
    });
    localStorage.setItem("activeExtensionTab", activeTabId);
    console.log("Active tab saved to localStorage:", activeTabId);
  }

  // Add click listeners to tabs
  tabs.forEach(tabInfo => {
    const tabEl = document.getElementById(tabInfo.id);
    console.log(`Setting up click listener for tab ${tabInfo.id}:`, !!tabEl);
    if (tabEl) {
      // Remove any existing listeners
      const newTabEl = tabEl.cloneNode(true);
      tabEl.parentNode.replaceChild(newTabEl, tabEl);

      // Add new listener
      newTabEl.addEventListener("click", e => {
        console.log(`Tab ${tabInfo.id} clicked`);
        e.preventDefault();
        e.stopPropagation();
        switchTab(tabInfo.id);
      });
      console.log(`Click listener added to tab ${tabInfo.id}`);
    } else {
      console.error(`Tab element not found: ${tabInfo.id}`);
    }
  });

  // Restore last active tab or default to first tab
  const lastActiveTab = localStorage.getItem("activeExtensionTab");
  console.log("Last active tab from localStorage:", lastActiveTab);
  if (lastActiveTab && tabs.find(t => t.id === lastActiveTab)) {
    console.log("Restoring last active tab:", lastActiveTab);
    switchTab(lastActiveTab);
  } else if (tabs.length > 0) {
    console.log("No last active tab, defaulting to first tab:", tabs[0].id);
    switchTab(tabs[0].id);
  }
  console.log("Tab switching setup complete");
}
console.log("=== TAB MANAGER LOADED ===");

/***/ }),

/***/ 534:
/*!*******************************************!*\
  !*** ./src/popup/window-state-manager.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   applyDetachedModeStyles: () => (/* binding */ applyDetachedModeStyles),
/* harmony export */   attachPopup: () => (/* binding */ attachPopup),
/* harmony export */   detachPopup: () => (/* binding */ detachPopup),
/* harmony export */   getWindowStateFromBackground: () => (/* binding */ getWindowStateFromBackground),
/* harmony export */   isDetachedWindow: () => (/* binding */ isDetachedWindow),
/* harmony export */   updateWindowControlButton: () => (/* binding */ updateWindowControlButton)
/* harmony export */ });
/* harmony import */ var _utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/messaging.js */ 272);
/* harmony import */ var _utils_window_state_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/window-state.js */ 194);
/**
 * Module for managing popup window state in the UI
 */




/**
 * Detaches the current popup into a separate window
 * @returns {Promise<boolean>} Success status
 */
async function detachPopup() {
  return new Promise(resolve => {
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
      action: "detachPopup"
    }, response => {
      if (response && response.success) {
        // Close current popup window
        window.close();
        resolve(true);
      } else {
        console.error("Failed to detach popup:", response === null || response === void 0 ? void 0 : response.error);
        resolve(false);
      }
    });
  });
}

/**
 * Attaches the popup back to the extension icon
 * @returns {Promise<boolean>} Success status
 */
async function attachPopup() {
  return new Promise(resolve => {
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
      action: "attachPopup"
    }, async response => {
      if (response && response.success) {
        // Clear the stored original tab ID
        await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_1__.clearOriginalTabId)();

        // Close current detached window
        window.close();
        resolve(true);
      } else {
        console.error("Failed to detach popup:", response === null || response === void 0 ? void 0 : response.error);
        resolve(false);
      }
    });
  });
}

/**
 * Gets the current window state from background
 * @returns {Promise<string>} Current window state
 */
async function getWindowStateFromBackground() {
  return new Promise(resolve => {
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
      action: "getWindowState"
    }, response => {
      resolve((response === null || response === void 0 ? void 0 : response.state) || "attached");
    });
  });
}

/**
 * Checks if the current popup is running in a detached window
 * Uses multiple detection methods for accuracy
 * @returns {Promise<boolean>} True if detached
 */
async function isDetachedWindow() {
  try {
    // Method 1: Check against stored detached window ID
    const isDetachedById = await (0,_utils_window_state_js__WEBPACK_IMPORTED_MODULE_1__.isCurrentWindowDetached)();

    // Method 2: Check window characteristics
    const hasLargerDimensions = window.outerWidth > 650 || window.outerHeight > 650;
    const isExtensionUrl = window.location.protocol === "chrome-extension:";

    // Method 3: Check background state
    const backgroundState = await getWindowStateFromBackground();
    const isDetachedByState = backgroundState === "detached";

    // Method 4: Check window type (detached windows have different properties)
    const isPopupWindow = window.opener === null && window.parent === window;

    // Combine all methods for accurate detection
    const isDetached = (isDetachedById || isDetachedByState) && hasLargerDimensions && isExtensionUrl && isPopupWindow;
    console.log("Detached window detection:", {
      isDetachedById,
      hasLargerDimensions,
      isExtensionUrl,
      isDetachedByState,
      isPopupWindow,
      finalResult: isDetached
    });
    return isDetached;
  } catch (error) {
    console.debug("Error detecting detached window:", error);
    return false;
  }
}

/**
 * Applies detached mode styling to the UI
 * @param {boolean} isDetached - Whether we're in detached mode
 */
function applyDetachedModeStyles(isDetached) {
  if (isDetached) {
    var _document$querySelect;
    document.body.classList.add("detached-mode");
    (_document$querySelect = document.querySelector(".container")) === null || _document$querySelect === void 0 || _document$querySelect.classList.add("detached-mode");
  } else {
    var _document$querySelect2;
    document.body.classList.remove("detached-mode");
    (_document$querySelect2 = document.querySelector(".container")) === null || _document$querySelect2 === void 0 || _document$querySelect2.classList.remove("detached-mode");
  }
}

/**
 * Updates the window control button icon and tooltip based on current state
 * @param {boolean} isDetached - Whether we're in detached mode
 * @param {HTMLElement} button - The button element to update
 */
function updateWindowControlButton(isDetached, button) {
  if (!button) return;
  const icon = button.querySelector(".window-toggle-icon");
  if (!icon) return;
  if (isDetached) {
    // Show "Attach" icon when in detached mode - dock/attach back to extension
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    </svg>`;
    button.title = "Attach popup back to extension icon";
  } else {
    // Show "Open in new window" icon when in attached mode - like the one in your screenshot
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 3h6v6"/>
      <path d="M10 14 21 3"/>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    </svg>`;
    button.title = "Open popup in separate window";
  }
}

/***/ }),

/***/ 558:
/*!******************************************!*\
  !*** ./src/utils/toast-notifications.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TOAST_TYPES: () => (/* binding */ TOAST_TYPES),
/* harmony export */   clearAllToasts: () => (/* binding */ clearAllToasts),
/* harmony export */   configureToasts: () => (/* binding */ configureToasts),
/* harmony export */   showActionToast: () => (/* binding */ showActionToast),
/* harmony export */   showErrorToast: () => (/* binding */ showErrorToast),
/* harmony export */   showInfoToast: () => (/* binding */ showInfoToast),
/* harmony export */   showSuccessToast: () => (/* binding */ showSuccessToast),
/* harmony export */   showWarningToast: () => (/* binding */ showWarningToast)
/* harmony export */ });
/**
 * Professional toast notification system
 */

// Toast container and configuration
let toastContainer = null;
let toastCounter = 0;
const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info"
};
const TOAST_CONFIG = {
  duration: {
    success: 2500,
    error: 4000,
    warning: 3000,
    info: 2500
  },
  maxToasts: 3,
  position: "top-center" // Changed to top-center for better positioning
};

/**
 * Initialize the toast container
 */
function initializeToastContainer() {
  if (toastContainer) return;
  toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  toastContainer.className = `toast-container toast-${TOAST_CONFIG.position}`;

  // Add container styles
  toastContainer.style.cssText = `
    position: fixed;
    z-index: 10000;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 320px;
    padding: 8px;
  `;

  // Position the container
  switch (TOAST_CONFIG.position) {
    case "top-center":
      toastContainer.style.top = "8px";
      toastContainer.style.left = "50%";
      toastContainer.style.transform = "translateX(-50%)";
      break;
    case "top-right":
      toastContainer.style.top = "8px";
      toastContainer.style.right = "8px";
      break;
    case "top-left":
      toastContainer.style.top = "8px";
      toastContainer.style.left = "8px";
      break;
    case "bottom-right":
      toastContainer.style.bottom = "8px";
      toastContainer.style.right = "8px";
      toastContainer.style.flexDirection = "column-reverse";
      break;
    case "bottom-left":
      toastContainer.style.bottom = "8px";
      toastContainer.style.left = "8px";
      toastContainer.style.flexDirection = "column-reverse";
      break;
  }
  document.body.appendChild(toastContainer);
}

/**
 * Create a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {Object} options - Additional options
 * @returns {HTMLElement} The toast element
 */
function createToast(message, type = TOAST_TYPES.INFO, options = {}) {
  initializeToastContainer();
  const toastId = `toast-${++toastCounter}`;
  const duration = options.duration || TOAST_CONFIG.duration[type];
  const dismissible = options.dismissible !== false;
  const compact = options.compact !== false; // Default to compact

  // Create toast element
  const toast = document.createElement("div");
  toast.id = toastId;
  toast.className = `toast toast-${type} ${compact ? "toast-compact" : ""}`;
  toast.style.pointerEvents = "auto";

  // Get icon for toast type
  const icon = getToastIcon(type);

  // Create compact toast content
  if (compact) {
    toast.innerHTML = `
      <div class="toast-content-compact">
        <div class="toast-icon-compact">${icon}</div>
        <div class="toast-message-compact">${message}</div>
        ${dismissible ? '<button class="toast-dismiss-compact" aria-label="Dismiss">×</button>' : ""}
      </div>
      <div class="toast-progress-compact"></div>
    `;
  } else {
    // Keep original layout for non-compact toasts
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        ${dismissible ? '<button class="toast-dismiss" aria-label="Dismiss">&times;</button>' : ""}
      </div>
      <div class="toast-progress"></div>
    `;
  }

  // Add event listeners
  if (dismissible) {
    const dismissBtn = toast.querySelector(compact ? ".toast-dismiss-compact" : ".toast-dismiss");
    dismissBtn.addEventListener("click", () => dismissToast(toast));
  }

  // Add to container
  toastContainer.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.classList.add("toast-show");
  });

  // Auto dismiss
  if (duration > 0) {
    const progressBar = toast.querySelector(compact ? ".toast-progress-compact" : ".toast-progress");

    // Animate progress bar
    progressBar.style.animation = `toast-progress ${duration}ms linear`;
    setTimeout(() => {
      dismissToast(toast);
    }, duration);
  }

  // Limit number of toasts
  limitToasts();
  return toast;
}

/**
 * Dismiss a toast notification
 * @param {HTMLElement} toast - The toast element to dismiss
 */
function dismissToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.add("toast-hide");
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300); // Match animation duration
}

/**
 * Limit the number of visible toasts
 */
function limitToasts() {
  const toasts = toastContainer.querySelectorAll(".toast");
  if (toasts.length > TOAST_CONFIG.maxToasts) {
    const oldestToast = toasts[0];
    dismissToast(oldestToast);
  }
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} SVG icon
 */
function getToastIcon(type) {
  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22,4 12,14.01 9,11.01"></polyline>
    </svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`
  };
  return icons[type] || icons.info;
}

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {Object} options - Additional options
 */
function showSuccessToast(message, options = {}) {
  return createToast(message, TOAST_TYPES.SUCCESS, options);
}

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 */
function showErrorToast(message, options = {}) {
  return createToast(message, TOAST_TYPES.ERROR, options);
}

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 */
function showWarningToast(message, options = {}) {
  return createToast(message, TOAST_TYPES.WARNING, options);
}

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 */
function showInfoToast(message, options = {}) {
  return createToast(message, TOAST_TYPES.INFO, options);
}

/**
 * Show toast with action button
 * @param {string} message - Toast message
 * @param {string} type - Toast type
 * @param {Object} action - Action configuration
 * @param {Object} options - Additional options
 */
function showActionToast(message, type, action, options = {}) {
  return createToast(message, type, {
    ...options,
    action
  });
}

/**
 * Clear all toasts
 */
function clearAllToasts() {
  if (!toastContainer) return;
  const toasts = toastContainer.querySelectorAll(".toast");
  toasts.forEach(toast => dismissToast(toast));
}

/**
 * Configure toast system
 * @param {Object} config - Configuration options
 */
function configureToasts(config) {
  Object.assign(TOAST_CONFIG, config);
}

// Export types for convenience


/***/ }),

/***/ 607:
/*!**********************************!*\
  !*** ./src/utils/tab-helpers.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCurrentActiveTabId: () => (/* binding */ getCurrentActiveTabId),
/* harmony export */   getOriginalTabIdFromUrl: () => (/* binding */ getOriginalTabIdFromUrl),
/* harmony export */   getTargetTabId: () => (/* binding */ getTargetTabId),
/* harmony export */   refreshOriginalTabId: () => (/* binding */ refreshOriginalTabId),
/* harmony export */   sendMessageToContentScript: () => (/* binding */ sendMessageToContentScript),
/* harmony export */   showElementFeedback: () => (/* binding */ showElementFeedback),
/* harmony export */   storeOriginalTabId: () => (/* binding */ storeOriginalTabId),
/* harmony export */   verifyTabExists: () => (/* binding */ verifyTabExists)
/* harmony export */ });
/* harmony import */ var _window_state_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./window-state.js */ 194);
/**
 * Utility functions for tab management and verification
 */



// Declare chrome variable

/**
 * Gets the original tab ID from URL parameters or storage
 * @returns {Promise<number|null>} Original tab ID or null
 */
async function getOriginalTabIdFromUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tabIdFromUrl = urlParams.get("originalTabId");
    if (tabIdFromUrl) {
      const tabId = Number.parseInt(tabIdFromUrl, 10);
      console.log("Retrieved original tab ID from URL:", tabId);
      return tabId;
    }

    // Fallback to storage
    const tabIdFromStorage = await (0,_window_state_js__WEBPACK_IMPORTED_MODULE_0__.getOriginalTabId)();
    if (tabIdFromStorage) {
      console.log("Retrieved original tab ID from storage:", tabIdFromStorage);
      return tabIdFromStorage;
    }
    console.log("No original tab ID found in URL or storage");
    return null;
  } catch (error) {
    console.debug("Error getting original tab ID:", error);
    return null;
  }
}

/**
 * Stores the original tab ID for future use
 * @param {number} tabId - The tab ID to store
 */
async function storeOriginalTabId(tabId) {
  try {
    await (0,_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setOriginalTabId)(tabId);
    console.log("Stored original tab ID:", tabId);
  } catch (error) {
    console.debug("Error storing original tab ID:", error);
  }
}

/**
 * Verifies that a tab exists and is accessible
 * @param {number} tabId - The tab ID to verify
 * @returns {Promise<boolean>} True if tab exists and is accessible
 */
async function verifyTabExists(tabId) {
  if (!tabId) return false;
  try {
    return new Promise(resolve => {
      chrome.tabs.get(Number.parseInt(tabId, 10), tab => {
        if (chrome.runtime.lastError) {
          console.debug(`Tab verification failed for ID ${tabId}:`, chrome.runtime.lastError.message);
          resolve(false);
        } else {
          console.log(`Tab ${tabId} verified:`, tab.url);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.debug("Exception during tab verification:", error);
    return false;
  }
}

/**
 * Detects if we're in detached mode by checking URL parameters
 * @returns {boolean} True if in detached mode
 */
function isDetachedMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const hasOriginalTabId = urlParams.has("originalTabId");
  console.log("Detached mode detection:", hasOriginalTabId, "URL:", window.location.href);
  return hasOriginalTabId;
}

/**
 * Gets the target tab ID for messaging, automatically detecting attached vs detached mode
 * @returns {Promise<number|null>} Tab ID or null if not available
 */
async function getTargetTabId() {
  try {
    const detachedMode = isDetachedMode();
    console.log("getTargetTabId called, detached mode:", detachedMode);
    if (detachedMode) {
      // In detached mode, use the original bound tab ID
      const originalTabId = await getOriginalTabIdFromUrl();
      console.log("Detached mode - original tab ID:", originalTabId);
      if (originalTabId) {
        // Verify the tab still exists
        const tabExists = await verifyTabExists(originalTabId);
        if (tabExists) {
          console.log("Using bound original tab ID for detached mode:", originalTabId);
          return originalTabId;
        } else {
          console.log("Bound original tab no longer exists:", originalTabId);
          return null;
        }
      }
      console.log("No bound tab ID available in detached mode");
      return null;
    }

    // In attached mode, get the current active tab
    console.log("Attached mode - getting current active tab");
    return new Promise(resolve => {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, activeTabs => {
        if (chrome.runtime.lastError || !activeTabs || activeTabs.length === 0) {
          console.log("No active tabs found in attached mode");
          resolve(null);
          return;
        }
        const tabId = activeTabs[0].id;
        console.log("Using current active tab ID for attached mode:", tabId);
        resolve(tabId);
      });
    });
  } catch (error) {
    console.debug("Error getting target tab ID:", error);
    return null;
  }
}

/**
 * Sends a message to a content script with error handling
 * @param {number} tabId - The tab ID to send the message to
 * @param {Object} message - The message to send
 * @returns {Promise<Object|null>} Response from content script or null if failed
 */
async function sendMessageToContentScript(tabId, message) {
  if (!tabId) {
    console.error("Cannot send message: No tab ID provided");
    return null;
  }
  try {
    return new Promise(resolve => {
      chrome.tabs.sendMessage(Number.parseInt(tabId, 10), message, response => {
        if (chrome.runtime.lastError) {
          console.error(`Error sending message to tab ${tabId}:`, chrome.runtime.lastError.message);
          resolve(null);
        } else {
          console.log(`Message sent successfully to tab ${tabId}:`, message.action);
          resolve(response);
        }
      });
    });
  } catch (error) {
    console.error("Exception when sending message to content script:", error);
    return null;
  }
}

/**
 * Shows minimal visual feedback on an element
 * @param {HTMLElement} element - The element to show feedback on
 * @param {string} type - The feedback type ('success', 'error')
 * @param {number} duration - Duration in milliseconds
 */
function showElementFeedback(element, type = "success", duration = 1000) {
  if (!element) return;
  const originalTransform = element.style.transform;
  const originalTransition = element.style.transition;

  // Add subtle visual feedback
  element.style.transition = "transform 0.1s ease";
  element.style.transform = "scale(0.95)";
  setTimeout(() => {
    element.style.transform = "scale(1)";
    setTimeout(() => {
      element.style.transform = originalTransform;
      element.style.transition = originalTransition;
    }, 100);
  }, 50);
}

// Legacy function names for compatibility (now just do minimal feedback)

/**
 * Refreshes the original tab ID in storage to maintain connection
 * @param {number} tabId - The tab ID to store
 * @returns {Promise<boolean>} Success status
 */
async function refreshOriginalTabId(tabId) {
  try {
    if (!tabId) return false;

    // Verify the tab still exists before storing
    const tabExists = await verifyTabExists(tabId);
    if (!tabExists) return false;

    // Store the tab ID
    await (0,_window_state_js__WEBPACK_IMPORTED_MODULE_0__.setOriginalTabId)(tabId);
    console.log("Refreshed original tab ID:", tabId);
    return true;
  } catch (error) {
    console.debug("Error refreshing original tab ID:", error);
    return false;
  }
}

/**
 * Gets the current active tab ID
 * @returns {Promise<number|null>} Current active tab ID or null
 */
async function getCurrentActiveTabId() {
  try {
    return new Promise(resolve => {
      chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
      }, tabs => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
          console.debug("No active tab found");
          resolve(null);
          return;
        }
        const tabId = tabs[0].id;
        console.log("Current active tab ID:", tabId, "URL:", tabs[0].url);
        resolve(tabId);
      });
    });
  } catch (error) {
    console.debug("Error getting current active tab ID:", error);
    return null;
  }
}

/***/ }),

/***/ 789:
/*!************************************************!*\
  !*** ./src/popup/displays/insights-display.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handleCompletePSIResults: () => (/* binding */ handleCompletePSIResults),
/* harmony export */   resetDataAvailability: () => (/* binding */ resetDataAvailability),
/* harmony export */   setupPSIAnalyzeButton: () => (/* binding */ setupPSIAnalyzeButton),
/* harmony export */   updateCLSDisplay: () => (/* binding */ updateCLSDisplay),
/* harmony export */   updateINPDisplay: () => (/* binding */ updateINPDisplay),
/* harmony export */   updateInsightsDisplay: () => (/* binding */ updateInsightsDisplay),
/* harmony export */   updateInsightsState: () => (/* binding */ updateInsightsState),
/* harmony export */   updateLCPDisplay: () => (/* binding */ updateLCPDisplay),
/* harmony export */   updatePSICLSDisplay: () => (/* binding */ updatePSICLSDisplay),
/* harmony export */   updatePSIINPDisplay: () => (/* binding */ updatePSIINPDisplay),
/* harmony export */   updatePSILCPDisplay: () => (/* binding */ updatePSILCPDisplay),
/* harmony export */   updatePSILabCLSDisplay: () => (/* binding */ updatePSILabCLSDisplay),
/* harmony export */   updatePSILabLCPDisplay: () => (/* binding */ updatePSILabLCPDisplay),
/* harmony export */   updatePSIStatus: () => (/* binding */ updatePSIStatus),
/* harmony export */   updatePSITTFBDisplay: () => (/* binding */ updatePSITTFBDisplay),
/* harmony export */   updateTTFBDisplay: () => (/* binding */ updateTTFBDisplay)
/* harmony export */ });
/* harmony import */ var _utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/tab-helpers.js */ 607);
/* harmony import */ var _utils_toast_notifications_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/toast-notifications.js */ 558);
/* harmony import */ var _psi_insights_display_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./psi-insights-display.js */ 18);
// src/popup/displays/insights-display.js

/**
 * Module for handling insights display in the popup - Complete Enhanced Version with Combination Indicators
 */

// Import the simplified helpers




// Chrome API is available globally in extension context
const chrome = globalThis.chrome || window.chrome;

/**
 * Enhanced state management for insights display
 */
const insightsState = {
  isLoading: false,
  hasError: false,
  errorMessage: "",
  lastUpdate: null,
  dataTypes: {
    local: {
      available: false,
      lastUpdate: null
    },
    field: {
      available: false,
      lastUpdate: null
    },
    lab: {
      available: false,
      lastUpdate: null
    }
  },
  metrics: {
    cls: {
      local: null,
      field: null,
      lab: null
    },
    lcp: {
      local: null,
      field: null,
      lab: null
    },
    inp: {
      local: null,
      field: null,
      lab: null
    },
    ttfb: {
      local: null,
      field: null,
      lab: null
    } // Note: lab TTFB will always be null
  }
};

/**
 * Core Web Vitals thresholds based on official Google guidelines
 */
const THRESHOLDS = {
  cls: {
    good: 0.1,
    needsImprovement: 0.25
  },
  lcp: {
    good: 2500,
    needsImprovement: 4000
  },
  inp: {
    good: 200,
    needsImprovement: 500
  },
  ttfb: {
    good: 800,
    needsImprovement: 1800
  }
};

/**
 * Format metric value for display
 */
function formatMetricValue(metric, value) {
  if (metric === "cls") {
    return typeof value === "number" ? value.toFixed(3) : value;
  } else {
    return typeof value === "number" ? `${Math.round(value)}ms` : value;
  }
}

/**
 * Updates the insights state and triggers UI updates
 */
function updateInsightsState(updates) {
  const previousState = JSON.parse(JSON.stringify(insightsState));

  // Deep merge updates
  if (updates.dataTypes) {
    Object.assign(insightsState.dataTypes, updates.dataTypes);
  }
  if (updates.metrics) {
    Object.keys(updates.metrics).forEach(metric => {
      if (insightsState.metrics[metric]) {
        Object.assign(insightsState.metrics[metric], updates.metrics[metric]);
      }
    });
  }

  // Update other properties
  Object.keys(updates).forEach(key => {
    if (key !== "dataTypes" && key !== "metrics") {
      insightsState[key] = updates[key];
    }
  });
  insightsState.lastUpdate = Date.now();

  // Trigger UI updates if state changed
  if (JSON.stringify(previousState) !== JSON.stringify(insightsState)) {
    updateUIFromState();
  }
}

/**
 * Updates UI based on current state
 */
function updateUIFromState() {
  // Update loading states
  updateLoadingStates();

  // Update error states
  updateErrorStates();

  // Update legend visibility
  updateLegendFromState();

  // Update metric displays
  updateMetricDisplaysFromState();
}

/**
 * Updates loading states across the UI
 */
function updateLoadingStates() {
  const loadingElements = document.querySelectorAll(".metric-loading");
  loadingElements.forEach(el => {
    el.style.display = insightsState.isLoading ? "flex" : "none";
  });

  // Update PSI button loading state
  if (insightsState.isLoading) {
    setPSIButtonState("analyzing");
  }
}

/**
 * Updates error states across the UI
 */
function updateErrorStates() {
  const errorContainer = document.getElementById("insightsErrorContainer");
  if (errorContainer) {
    if (insightsState.hasError) {
      errorContainer.style.display = "block";
      errorContainer.textContent = insightsState.errorMessage || "An error occurred";
      errorContainer.className = "insights-error-message";
    } else {
      errorContainer.style.display = "none";
    }
  }
}

/**
 * Updates legend visibility based on state including combination indicators
 */
function updateLegendFromState() {
  const localLegend = document.querySelector('.legend-item[data-type="local"]');
  const fieldLegend = document.querySelector('.legend-item[data-type="field"]');
  const labLegend = document.querySelector('.legend-item[data-type="lab"]');

  // Check for combination matches across all metrics
  const combinationStates = getCombinationStates();

  // Show/hide individual legends based on availability and combinations
  if (localLegend) {
    const showLocal = insightsState.dataTypes.local.available && !hasAnyCombinations(combinationStates);
    localLegend.style.display = showLocal ? "flex" : "none";
  }
  if (fieldLegend) {
    const showField = insightsState.dataTypes.field.available && !hasAnyCombinations(combinationStates);
    fieldLegend.style.display = showField ? "flex" : "none";
  }
  if (labLegend) {
    const showLab = insightsState.dataTypes.lab.available && !hasAnyCombinations(combinationStates);
    labLegend.style.display = showLab ? "flex" : "none";
  }

  // Update combination legends
  updateCombinationLegends(combinationStates);
  const legendContainer = document.querySelector(".cwv-legend");
  if (legendContainer) {
    const hasAnyData = Object.values(insightsState.dataTypes).some(dt => dt.available);
    legendContainer.style.display = hasAnyData ? "flex" : "none";
  }
}

/**
 * Get combination states across all metrics
 */
function getCombinationStates() {
  const states = {
    localField: false,
    localLab: false,
    fieldLab: false,
    allSources: false
  };
  Object.keys(insightsState.metrics).forEach(metric => {
    const metricData = insightsState.metrics[metric];
    const localValue = metricData.local;
    const fieldValue = metricData.field;
    const labValue = metricData.lab;
    if (localValue !== null && fieldValue !== null && labValue !== null) {
      const tolerance = calculateTolerance(metric, localValue);
      const localFieldMatch = Math.abs(localValue - fieldValue) <= tolerance;
      const localLabMatch = Math.abs(localValue - labValue) <= tolerance;
      const fieldLabMatch = Math.abs(fieldValue - labValue) <= tolerance;
      if (localFieldMatch && localLabMatch && fieldLabMatch) {
        states.allSources = true;
      } else if (localFieldMatch) {
        states.localField = true;
      } else if (localLabMatch) {
        states.localLab = true;
      } else if (fieldLabMatch) {
        states.fieldLab = true;
      }
    } else {
      // Check two-way combinations
      if (localValue !== null && fieldValue !== null) {
        const tolerance = calculateTolerance(metric, localValue);
        if (Math.abs(localValue - fieldValue) <= tolerance) {
          states.localField = true;
        }
      }
      if (localValue !== null && labValue !== null) {
        const tolerance = calculateTolerance(metric, localValue);
        if (Math.abs(localValue - labValue) <= tolerance) {
          states.localLab = true;
        }
      }
      if (fieldValue !== null && labValue !== null) {
        const tolerance = calculateTolerance(metric, fieldValue);
        if (Math.abs(fieldValue - labValue) <= tolerance) {
          states.fieldLab = true;
        }
      }
    }
  });
  return states;
}

/**
 * Check if any combinations are active
 */
function hasAnyCombinations(states) {
  return states.localField || states.localLab || states.fieldLab || states.allSources;
}

/**
 * Update combination legend items
 */
function updateCombinationLegends(states) {
  const legendContainer = document.querySelector(".cwv-legend");
  if (!legendContainer) return;

  // Remove existing combination legends
  const existingCombinations = legendContainer.querySelectorAll('.legend-item[data-type*="-"], .legend-item[data-type="all-sources"]');
  existingCombinations.forEach(item => item.remove());

  // Add active combination legends
  if (states.allSources) {
    addCombinationLegendItem(legendContainer, "all-sources", "All Match");
  } else {
    if (states.localField) {
      addCombinationLegendItem(legendContainer, "local-field", "Local + Field");
    }
    if (states.localLab) {
      addCombinationLegendItem(legendContainer, "local-lab", "Local + Lab");
    }
    if (states.fieldLab) {
      addCombinationLegendItem(legendContainer, "field-lab", "Field + Lab");
    }
  }
}

/**
 * Add combination legend item
 */
function addCombinationLegendItem(container, type, label) {
  const legendItem = document.createElement("div");
  legendItem.className = "legend-item";
  legendItem.setAttribute("data-type", type);
  const dot = document.createElement("div");
  dot.className = "legend-dot";
  const labelElement = document.createElement("span");
  labelElement.className = "legend-label";
  labelElement.textContent = label;
  legendItem.appendChild(dot);
  legendItem.appendChild(labelElement);
  container.appendChild(legendItem);
}

/**
 * Updates metric displays based on current state
 */
function updateMetricDisplaysFromState() {
  Object.keys(insightsState.metrics).forEach(metric => {
    const metricData = insightsState.metrics[metric];

    // Update local values
    if (metricData.local !== null) {
      updateMetricValue(metric, "local", metricData.local);
    }

    // Update field values
    if (metricData.field !== null) {
      updateMetricValue(metric, "field", metricData.field);
    }

    // Update lab values (only for CLS and LCP, TTFB not available in lab)
    if (metricData.lab !== null && (metric === "cls" || metric === "lcp")) {
      updateMetricValue(metric, "lab", metricData.lab);
    }
  });
}

/**
 * Generic function to update metric values in UI
 */
function updateMetricValue(metric, type, value) {
  const valueContainer = document.getElementById(`${metric}${type.charAt(0).toUpperCase() + type.slice(1)}Value`);
  const textElement = document.getElementById(`${metric}${type.charAt(0).toUpperCase() + type.slice(1)}Text`);
  if (!valueContainer || !textElement) {
    console.log(`Missing elements for ${metric} ${type}:`, {
      container: !!valueContainer,
      text: !!textElement
    });
    return;
  }

  // Show the container
  valueContainer.style.display = "flex";

  // Format value based on metric type
  const displayValue = formatMetricValue(metric, value);
  textElement.textContent = displayValue;

  // Add threshold-based styling
  if (typeof value === "number") {
    updateMetricThresholds(metric, value, type === "field", type === "lab");
    addThresholdStyling(textElement, metric, value);
  }
  console.log(`Updated ${metric} ${type} value:`, displayValue);
}

/**
 * Adds threshold-based styling to metric elements
 */
function addThresholdStyling(element, metric, value) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return;

  // Remove existing threshold classes
  element.classList.remove("metric-good", "metric-needs-improvement", "metric-poor");

  // Add appropriate class
  if (value <= threshold.good) {
    element.classList.add("metric-good");
  } else if (value <= threshold.needsImprovement) {
    element.classList.add("metric-needs-improvement");
  } else {
    element.classList.add("metric-poor");
  }
}

/**
 * Verifies content script is ready with simple ping
 */
async function verifyContentScriptReady(targetTabId) {
  console.log(`Verifying content script readiness for tab ${targetTabId}`);
  return new Promise(resolve => {
    chrome.tabs.sendMessage(targetTabId, {
      action: "ping"
    }, response => {
      if (chrome.runtime.lastError) {
        console.log("Content script ping failed:", chrome.runtime.lastError.message);
        resolve(false);
      } else if (response && response.ready) {
        console.log("Content script ping successful");
        resolve(true);
      } else {
        console.log("Content script ping returned unexpected response:", response);
        resolve(false);
      }
    });
  });
}

/**
 * Sets up the PSI analyze button functionality with proper detached mode support
 */
function setupPSIAnalyzeButton() {
  console.log("Setting up PSI button");
  const psiBtn = document.getElementById("analyzePSIBtn");
  if (!psiBtn) {
    console.log("PSI button not found");
    return;
  }

  // Remove any existing listeners to prevent duplicates
  const newBtn = psiBtn.cloneNode(true);
  psiBtn.parentNode.replaceChild(newBtn, psiBtn);

  // Set initial state
  newBtn.setAttribute("data-tooltip", "Analyze with PageSpeed Insights");

  // Single event listener with proper error handling
  newBtn.addEventListener("click", handlePSIButtonClick);
}

/**
 * Handles PSI button click with proper detached mode support
 */
async function handlePSIButtonClick() {
  try {
    console.log("PSI button clicked - starting analysis");

    // Update state to loading
    updateInsightsState({
      isLoading: true,
      hasError: false,
      errorMessage: ""
    });

    // Get target tab ID using the improved helper that auto-detects mode
    console.log("Getting target tab ID...");
    const targetTabId = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.getTargetTabId)();
    console.log("Target tab ID for PSI analysis:", targetTabId);
    if (!targetTabId) {
      throw new Error("No target tab available. Please ensure you're on a valid webpage.");
    }

    // Verify content script is ready before sending PSI request
    console.log("Verifying content script readiness...");
    const isReady = await verifyContentScriptReady(targetTabId);
    if (!isReady) {
      throw new Error("Content script not ready. Please refresh the page and try again.");
    }
    console.log("Content script ready, sending PSI analysis request...");

    // Send PSI analysis request with proper timeout handling
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Request timeout - analysis taking too long"));
      }, 45000);
      chrome.tabs.sendMessage(targetTabId, {
        action: "analyzePSI"
      }, response => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          console.error("Chrome runtime error:", chrome.runtime.lastError.message);
          reject(new Error(`Connection failed: ${chrome.runtime.lastError.message}`));
        } else if (response && response.success) {
          console.log("PSI analysis request successful:", response);
          resolve(response);
        } else {
          const errorMessage = (response === null || response === void 0 ? void 0 : response.userMessage) || (response === null || response === void 0 ? void 0 : response.message) || "Analysis failed. Please try again.";
          console.error("PSI analysis failed:", errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });

    // Success state
    updateInsightsState({
      isLoading: false,
      hasError: false
    });
    console.log("✅ PSI analysis completed successfully");
  } catch (error) {
    console.error("PSI button error:", error);

    // Error state
    updateInsightsState({
      isLoading: false,
      hasError: true,
      errorMessage: error.message
    });
    (0,_utils_toast_notifications_js__WEBPACK_IMPORTED_MODULE_1__.showErrorToast)(error.message, {
      duration: 5000
    });
  }
}

/**
 * Enhanced PSI button state management
 */
function setPSIButtonState(state) {
  const psiBtn = document.getElementById("analyzePSIBtn");
  if (!psiBtn) return;
  console.log(`Setting PSI button state to: ${state}`);

  // Remove all state classes
  psiBtn.classList.remove("analyzing", "success", "error");
  const btnText = psiBtn.querySelector(".psi-btn-text");
  const btnIcon = psiBtn.querySelector(".psi-btn-icon");
  if (state === "analyzing") {
    psiBtn.classList.add("analyzing");
    psiBtn.disabled = true;
    if (btnText) btnText.textContent = "Analyzing...";
    psiBtn.setAttribute("data-tooltip", "Analyzing with PageSpeed Insights...");
  } else if (state === "success") {
    psiBtn.classList.add("success");
    psiBtn.disabled = false;
    if (btnText) btnText.textContent = "Success!";
    psiBtn.setAttribute("data-tooltip", "Analysis completed successfully");

    // Reset to default after 2 seconds
    setTimeout(() => {
      setPSIButtonState("default");
    }, 2000);
  } else if (state === "error") {
    psiBtn.classList.add("error");
    psiBtn.disabled = false;
    if (btnText) btnText.textContent = "Error";
    psiBtn.setAttribute("data-tooltip", "Analysis failed - click to retry");

    // Reset to default after 3 seconds
    setTimeout(() => {
      setPSIButtonState("default");
    }, 3000);
  } else {
    // Default state
    psiBtn.disabled = false;
    if (btnText) btnText.textContent = "Analyze PSI";
    psiBtn.setAttribute("data-tooltip", "Analyze with PageSpeed Insights");
  }
}

/**
 * Resets data availability (useful when navigating to new page)
 */
function resetDataAvailability() {
  updateInsightsState({
    dataTypes: {
      local: {
        available: false,
        lastUpdate: null
      },
      field: {
        available: false,
        lastUpdate: null
      },
      lab: {
        available: false,
        lastUpdate: null
      }
    },
    metrics: {
      cls: {
        local: null,
        field: null,
        lab: null
      },
      lcp: {
        local: null,
        field: null,
        lab: null
      },
      inp: {
        local: null,
        field: null,
        lab: null
      },
      ttfb: {
        local: null,
        field: null,
        lab: null
      } // Lab TTFB always null
    },
    hasError: false,
    errorMessage: "",
    isLoading: false
  });

  // Clear PSI insights as well
  (0,_psi_insights_display_js__WEBPACK_IMPORTED_MODULE_2__.clearPSIInsightsDisplay)();
}

/**
 * Updates the insights display with analysis results
 * @param {Object} data - Analysis data object
 */
function updateInsightsDisplay(data) {
  console.log("Updating insights display with data:", data);

  // Update CLS display
  if (data.cls !== undefined) {
    console.log("Updating CLS display");
    updateCLSDisplay(data.cls);
  }

  // Update LCP display
  if (data.lcp !== undefined) {
    console.log("Updating LCP display");
    updateLCPDisplay(data.lcp);
  }

  // Update INP display
  if (data.inp !== undefined) {
    console.log("Updating INP display");
    updateINPDisplay(data.inp);
  }

  // Update TTFB display
  if (data.additionalMetrics !== undefined) {
    console.log("Updating TTFB display");
    updateTTFBDisplay(data.additionalMetrics);
  }
}

// Update the CLS display function - Fixed to properly update state
function updateCLSDisplay(clsData) {
  console.log("updateCLSDisplay called with:", clsData);
  const value = clsData.value || 0;

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      local: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      cls: {
        local: value
      }
    }
  });
  const clsElementPreview = document.getElementById("clsElementPreview");

  // Show/hide element preview
  if (clsElementPreview) {
    if (value > 0) {
      clsElementPreview.style.display = "block";
      updateCLSElementPreview(clsData.element || {}, value);
    } else {
      clsElementPreview.style.display = "none";
    }
  }
  updateMetricThresholds("cls", value, false, false); // isField = false, isLab = false (local)
}

// Update the LCP display function - Fixed to properly update state
function updateLCPDisplay(lcpData) {
  console.log("updateLCPDisplay called with:", lcpData);
  const value = lcpData.value || 0;

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      local: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      lcp: {
        local: value
      }
    }
  });
  const lcpElementPreview = document.getElementById("lcpElementPreview");

  // Show element preview
  if (lcpElementPreview) {
    lcpElementPreview.style.display = "block";
    updateLCPElementPreview(lcpData.element || {});
  }
  updateMetricThresholds("lcp", value, false, false); // isField = false, isLab = false (local)
}

// Update the INP display function - Enhanced to show element details
function updateINPDisplay(inpData) {
  console.log("updateINPDisplay called with:", inpData);
  const value = inpData.value || 0;

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      local: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      inp: {
        local: value
      }
    }
  });
  const inpStatus = document.getElementById("inpStatus");
  const inpElementPreview = document.getElementById("inpElementPreview");
  if (inpStatus) {
    const status = inpData.status || "waiting";
    if (value !== null && value !== undefined && value > 0) {
      if (inpData.entries && inpData.entries.length > 0) {
        const latestEntry = inpData.entries[0];
        inpStatus.innerHTML = `
          <div class="inp-message">
            Latest interaction: ${latestEntry.name} on ${latestEntry.target} (${latestEntry.duration}ms)
          </div>
        `;

        // Show element preview if we have element data
        if (latestEntry.element && inpElementPreview) {
          inpElementPreview.style.display = "block";
          updateINPElementPreview(latestEntry.element, latestEntry);
        }
      } else {
        inpStatus.innerHTML = `<div class="inp-message">INP measured: ${value}ms</div>`;
        if (inpElementPreview) {
          inpElementPreview.style.display = "none";
        }
      }
    } else {
      if (status === "waiting") {
        inpStatus.innerHTML = `<div class="inp-message">Click anywhere on the page to measure interaction responsiveness</div>`;
      } else {
        inpStatus.innerHTML = `<div class="inp-message">No interactions detected yet</div>`;
      }
      if (inpElementPreview) {
        inpElementPreview.style.display = "none";
      }
    }
  }
  updateMetricThresholds("inp", value, false, false); // isField = false, isLab = false (local)
}

// Update the TTFB display function - Fixed to properly update state
function updateTTFBDisplay(metrics) {
  console.log("updateTTFBDisplay called with:", metrics);
  const value = metrics.ttfb || 0;

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      local: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      ttfb: {
        local: value
      }
    }
  });
  updateMetricThresholds("ttfb", value, false, false); // isField = false, isLab = false (local)
}

/**
 * Updates the CLS display with PSI field data
 */
function updatePSICLSDisplay(psiData) {
  console.log("updatePSICLSDisplay called with:", psiData);
  if (!psiData || psiData.value === null || psiData.value === undefined || isNaN(psiData.value)) {
    console.log("No valid PSI CLS data available");
    return;
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      field: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      cls: {
        field: psiData.value
      }
    }
  });
  console.log("PSI CLS field data processed:", psiData.value);
  updateMetricThresholds("cls", psiData.value, true, false); // isField = true, isLab = false
}

/**
 * Updates the LCP display with PSI field data
 */
function updatePSILCPDisplay(psiData) {
  console.log("updatePSILCPDisplay called with:", psiData);
  if (!psiData || psiData.value === null || psiData.value === undefined || isNaN(psiData.value)) {
    console.log("No valid PSI LCP data available");
    return;
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      field: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      lcp: {
        field: psiData.value
      }
    }
  });
  console.log("PSI LCP field data processed:", psiData.value);
  updateMetricThresholds("lcp", psiData.value, true, false); // isField = true, isLab = false
}

/**
 * Updates the INP display with PSI field data
 */
function updatePSIINPDisplay(psiData) {
  console.log("updatePSIINPDisplay called with:", psiData);
  if (!psiData || psiData.value === null || psiData.value === undefined || isNaN(psiData.value)) {
    console.log("No valid PSI INP data available");
    return;
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      field: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      inp: {
        field: psiData.value
      }
    }
  });
  console.log("PSI INP field data processed:", psiData.value);
  updateMetricThresholds("inp", psiData.value, true, false); // isField = true, isLab = false
}

/**
 * Updates the TTFB display with PSI field data
 */
function updatePSITTFBDisplay(psiData) {
  console.log("updatePSITTFBDisplay called with:", psiData);
  if (!psiData || psiData.value === null || psiData.value === undefined || isNaN(psiData.value)) {
    console.log("No valid PSI TTFB data available");
    return;
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      field: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      ttfb: {
        field: psiData.value
      }
    }
  });
  console.log("PSI TTFB field data processed:", psiData.value);
  updateMetricThresholds("ttfb", psiData.value, true, false); // isField = true, isLab = false
}

/**
 * Updates the CLS display with PSI lab data
 */
function updatePSILabCLSDisplay(labData) {
  console.log("updatePSILabCLSDisplay called with:", labData);
  if (!labData || labData.value === null || labData.value === undefined || isNaN(labData.value)) {
    console.log("No valid PSI Lab CLS data available");
    return;
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      lab: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      cls: {
        lab: labData.value
      }
    }
  });
  console.log("PSI Lab CLS data processed:", labData.value);
  updateMetricThresholds("cls", labData.value, false, true); // isField = false, isLab = true
}

/**
 * Updates the LCP display with PSI lab data
 */
function updatePSILabLCPDisplay(labData) {
  console.log("updatePSILabLCPDisplay called with:", labData);
  if (!labData || labData.value === null || labData.value === undefined || isNaN(labData.value)) {
    console.log("No valid PSI Lab LCP data available");
    return;
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      lab: {
        available: true,
        lastUpdate: Date.now()
      }
    },
    metrics: {
      lcp: {
        lab: labData.value
      }
    }
  });
  console.log("PSI Lab LCP data processed:", labData.value);
  updateMetricThresholds("lcp", labData.value, false, true); // isField = false, isLab = true
}

// Note: TTFB lab data function removed as TTFB is not available in Lighthouse lab environment

/**
 * Updates PSI status display
 * @param {Object} statusData - PSI status data
 */
function updatePSIStatus(statusData) {
  console.log("updatePSIStatus called with:", statusData);
  if (statusData.status === "loading") {
    console.log("PSI: Loading...");
    setPSIButtonState("analyzing");
    (0,_psi_insights_display_js__WEBPACK_IMPORTED_MODULE_2__.setPSIInsightsLoading)(true);
  } else if (statusData.status === "success") {
    console.log("PSI: Success -", statusData.message, statusData.cached ? "(cached)" : "(fresh)");
    setPSIButtonState("success");
    (0,_psi_insights_display_js__WEBPACK_IMPORTED_MODULE_2__.setPSIInsightsLoading)(false);
  } else if (statusData.status === "error") {
    console.error("PSI: Error -", statusData.message);
    setPSIButtonState("error");
    (0,_psi_insights_display_js__WEBPACK_IMPORTED_MODULE_2__.setPSIInsightsLoading)(false);

    // Show error toast for API errors
    const errorMessage = statusData.userMessage || statusData.message || "Analysis failed";
    (0,_utils_toast_notifications_js__WEBPACK_IMPORTED_MODULE_1__.showErrorToast)(errorMessage, {
      duration: 5000
    });
  }
}

/**
 * Handles complete PSI results including insights
 * @param {Object} psiData - Complete PSI data
 */
function handleCompletePSIResults(psiData) {
  console.log("handleCompletePSIResults called with:", psiData);
  try {
    // Update insights display with complete PSI data
    (0,_psi_insights_display_js__WEBPACK_IMPORTED_MODULE_2__.updatePSIInsightsDisplay)(psiData);
  } catch (error) {
    console.error("Error handling complete PSI results:", error);
  }
}

/**
 * Updates the CLS element preview with enhanced information
 * @param {Object} element - CLS element data
 * @param {number} clsValue - Current CLS value
 */
function updateCLSElementPreview(element, clsValue) {
  console.log("updateCLSElementPreview called with:", element, clsValue);
  const elementTag = document.getElementById("clsElementTag");
  const elementImage = document.getElementById("clsElementImage");
  const clsShiftValue = document.getElementById("clsShiftValue");
  const elementDimensions = document.getElementById("clsElementDimensions");
  const elementPosition = document.getElementById("clsElementPosition");
  const elementClassesContainer = document.getElementById("clsElementClassesContainer");
  const elementClasses = document.getElementById("clsElementClasses");
  const elementSelectorContainer = document.getElementById("clsElementSelector");
  const elementSelector = document.getElementById("clsElementSelector");

  // Handle case where element data might be empty or incomplete
  if (!element || Object.keys(element).length === 0 || !element.tagName) {
    console.log("No CLS element data available, element:", element);
    if (elementTag) elementTag.textContent = "Layout Shift Detected";
    if (clsShiftValue) clsShiftValue.textContent = clsValue ? clsValue.toFixed(3) : "0.000";

    // Show what we can from the CLS data itself
    if (elementDimensions) {
      elementDimensions.textContent = "Element details not available";
    }
    if (elementPosition) {
      elementPosition.textContent = "Position not available";
    }
    if (elementImage) {
      elementImage.innerHTML = '<div class="preview-placeholder">No element preview available</div>';
    }

    // Hide optional sections
    if (elementClassesContainer) elementClassesContainer.style.display = "none";
    if (elementSelectorContainer) elementSelectorContainer.style.display = "none";
    return;
  }
  console.log("Updating CLS element preview with:", element);

  // Update element tag with more detailed information
  if (elementTag) {
    let tagDisplay = element.tagName ? element.tagName.toUpperCase() : "ELEMENT";
    if (element.classList && element.classList.length > 0) {
      tagDisplay += "." + element.classList[0];
    } else if (element.id) {
      tagDisplay += `#${element.id}`;
    }
    elementTag.textContent = tagDisplay;
    elementTag.style.color = "#ff9500"; // Orange color for CLS
  }

  // Update shift value
  if (clsShiftValue) {
    clsShiftValue.textContent = element.shiftValue ? element.shiftValue.toFixed(3) : clsValue ? clsValue.toFixed(3) : "0.000";
  }

  // Update dimensions
  if (elementDimensions && element.dimensions) {
    let dimensionText = `${element.dimensions.width || 0}×${element.dimensions.height || 0}px`;
    if (element.dimensions.naturalWidth && element.dimensions.naturalHeight) {
      dimensionText += ` (natural: ${element.dimensions.naturalWidth}×${element.dimensions.naturalHeight}px)`;
    }
    elementDimensions.textContent = dimensionText;
  } else if (elementDimensions) {
    elementDimensions.textContent = "Unknown dimensions";
  }

  // Update position
  if (elementPosition && element.position) {
    elementPosition.textContent = `${element.position.left || 0}, ${element.position.top || 0}px`;
  } else if (elementPosition) {
    elementPosition.textContent = "Unknown position";
  }

  // Update classes
  if (elementClassesContainer && elementClasses && element.classList && element.classList.length > 0) {
    elementClassesContainer.style.display = "block";
    elementClasses.textContent = element.classList.join(" ");
    elementClasses.title = element.classList.join(" ");
  } else if (elementClassesContainer) {
    elementClassesContainer.style.display = "none";
  }

  // Update CSS selector
  if (elementSelectorContainer && elementSelector && element.selector) {
    elementSelectorContainer.style.display = "block";
    elementSelector.textContent = element.selector;
    elementSelector.title = element.selector;
  } else if (elementSelectorContainer) {
    elementSelectorContainer.style.display = "none";
  }

  // Update preview image with click functionality
  if (elementImage) {
    const imageUrl = element.preview || element.primarySource || element.src || element.currentSrc || element.backgroundImageUrl;
    if (imageUrl) {
      console.log("Setting CLS preview image:", imageUrl);
      elementImage.innerHTML = `
        <img src="${imageUrl}" 
             alt="CLS Element Preview" 
             class="element-preview-img clickable-preview" 
             title="Click to highlight this element on the page"
             crossorigin="anonymous">
      `;

      // Add click handler to highlight element
      const previewImg = elementImage.querySelector(".clickable-preview");
      if (previewImg) {
        previewImg.addEventListener("click", () => {
          highlightCLSElementOnPage();
        });

        // Add error handling for image loading
        previewImg.addEventListener("error", () => {
          console.log("CLS preview image failed to load");
          elementImage.innerHTML = '<div class="preview-placeholder">Preview not available</div>';
        });
      }
    } else {
      console.log("No image URL available for CLS preview");
      elementImage.innerHTML = '<div class="preview-placeholder">No preview available</div>';
    }
  }

  // Make the entire preview clickable
  const clsElementPreview = document.getElementById("clsElementPreview");
  if (clsElementPreview) {
    clsElementPreview.style.cursor = "pointer";
    clsElementPreview.title = "Click to highlight this element on the page";

    // Remove existing click handlers
    clsElementPreview.replaceWith(clsElementPreview.cloneNode(true));
    const newPreview = document.getElementById("clsElementPreview");
    newPreview.addEventListener("click", () => {
      highlightCLSElementOnPage();
    });
  }
}

/**
 * Updates the LCP element preview with enhanced information
 * @param {Object} element - LCP element data
 */
function updateLCPElementPreview(element) {
  console.log("updateLCPElementPreview called with:", element);
  const elementTag = document.getElementById("lcpElementTag");
  const elementImage = document.getElementById("lcpElementImage");
  const elementDimensions = document.getElementById("lcpElementDimensions");
  const elementPosition = document.getElementById("lcpElementPosition");
  const elementSrcContainer = document.getElementById("lcpElementSrcContainer");
  const elementSrc = document.getElementById("lcpElementSrc");
  const elementTextContainer = document.getElementById("lcpElementText");
  const elementText = document.getElementById("lcpElementText");
  const elementClassesContainer = document.getElementById("lcpElementClassesContainer");
  const elementClasses = document.getElementById("lcpElementClasses");

  // Handle case where element data might be empty or incomplete
  if (!element || Object.keys(element).length === 0) {
    console.log("No element data available, showing placeholder");
    if (elementTag) elementTag.textContent = "LCP Element";
    if (elementDimensions) elementDimensions.textContent = "Analyzing...";
    if (elementPosition) elementPosition.textContent = "Analyzing...";
    if (elementImage) {
      elementImage.innerHTML = '<div class="preview-placeholder">Analyzing LCP element...</div>';
    }

    // Hide optional sections
    if (elementSrcContainer) elementSrcContainer.style.display = "none";
    if (elementTextContainer) elementTextContainer.style.display = "none";
    if (elementClassesContainer) elementClassesContainer.style.display = "none";
    return;
  }
  console.log("Updating LCP element preview with:", element);

  // Update element tag with more detailed information
  if (elementTag) {
    let tagDisplay = element.tagName ? element.tagName.toUpperCase() : "ELEMENT";
    if (element.classList && element.classList.length > 0) {
      tagDisplay += "." + element.classList[0];
    } else if (element.id) {
      tagDisplay += `#${element.id}`;
    }
    elementTag.textContent = tagDisplay;
    elementTag.style.color = "#007aff"; // Make it blue like in the screenshot
  }

  // Update dimensions with natural dimensions if available
  if (elementDimensions && element.dimensions) {
    let dimensionText = `${element.dimensions.width || 0}×${element.dimensions.height || 0}px`;
    if (element.dimensions.naturalWidth && element.dimensions.naturalHeight) {
      dimensionText += ` (natural: ${element.dimensions.naturalWidth}×${element.dimensions.naturalHeight}px)`;
    }
    elementDimensions.textContent = dimensionText;
  } else if (elementDimensions) {
    elementDimensions.textContent = "Unknown dimensions";
  }

  // Update position
  if (elementPosition && element.position) {
    elementPosition.textContent = `${element.position.left || 0}, ${element.position.top || 0}px`;
  } else if (elementPosition) {
    elementPosition.textContent = "Unknown position";
  }

  // Update classes
  if (elementClassesContainer && elementClasses && element.classList && element.classList.length > 0) {
    elementClassesContainer.style.display = "block";
    elementClasses.textContent = element.classList.join(" ");
    elementClasses.title = element.classList.join(" ");
  } else if (elementClassesContainer) {
    elementClassesContainer.style.display = "none";
  }

  // Update source with primary source
  if (element.primarySource || element.src || element.currentSrc || element.backgroundImageUrl) {
    const sourceUrl = element.primarySource || element.src || element.currentSrc || element.backgroundImageUrl;
    if (elementSrcContainer && elementSrc) {
      elementSrcContainer.style.display = "block";
      const displaySrc = sourceUrl.length > 60 ? sourceUrl.substring(0, 60) + "..." : sourceUrl;
      elementSrc.textContent = displaySrc;
      elementSrc.title = sourceUrl;
    }
  } else if (elementSrcContainer) {
    elementSrcContainer.style.display = "none";
  }

  // Update text content
  if (element.textContent && element.textContent.trim()) {
    if (elementTextContainer && elementText) {
      elementTextContainer.style.display = "block";
      const displayText = element.textContent.length > 60 ? element.textContent.substring(0, 60) + "..." : element.textContent;
      elementText.textContent = displayText;
      elementText.title = element.textContent;
    }
  } else if (elementTextContainer) {
    elementTextContainer.style.display = "none";
  }

  // Update preview image with click functionality
  if (elementImage) {
    const imageUrl = element.preview || element.primarySource || element.src || element.currentSrc || element.backgroundImageUrl;
    if (imageUrl) {
      console.log("Setting LCP preview image:", imageUrl);
      elementImage.innerHTML = `
        <img src="${imageUrl}" 
             alt="LCP Element Preview" 
             class="element-preview-img clickable-preview" 
             title="Click to highlight this element on the page"
             crossorigin="anonymous">
      `;

      // Add click handler to highlight element
      const previewImg = elementImage.querySelector(".clickable-preview");
      if (previewImg) {
        previewImg.addEventListener("click", () => {
          highlightLCPElementOnPage();
        });

        // Add error handling for image loading
        previewImg.addEventListener("error", () => {
          console.log("LCP preview image failed to load");
          elementImage.innerHTML = '<div class="preview-placeholder">Preview not available</div>';
        });
      }
    } else {
      console.log("No image URL available for LCP preview");
      elementImage.innerHTML = '<div class="preview-placeholder">No preview available</div>';
    }
  }

  // Make the entire preview clickable
  const lcpElementPreview = document.getElementById("lcpElementPreview");
  if (lcpElementPreview) {
    lcpElementPreview.style.cursor = "pointer";
    lcpElementPreview.title = "Click to highlight this element on the page";

    // Remove existing click handlers
    lcpElementPreview.replaceWith(lcpElementPreview.cloneNode(true));
    const newPreview = document.getElementById("lcpElementPreview");
    newPreview.addEventListener("click", () => {
      highlightLCPElementOnPage();
    });
  }
}

/**
 * Updates the INP element preview with enhanced information
 * @param {Object} element - INP element data
 * @param {Object} interaction - Interaction entry data
 */
function updateINPElementPreview(element, interaction) {
  console.log("updateINPElementPreview called with:", element, interaction);
  const elementTag = document.getElementById("inpElementTag");
  const elementImage = document.getElementById("inpElementImage");
  const elementDimensions = document.getElementById("inpElementDimensions");
  const elementPosition = document.getElementById("inpElementPosition");
  const elementClassesContainer = document.getElementById("inpElementClassesContainer");
  const elementClasses = document.getElementById("inpElementClasses");
  const interactionTypeContainer = document.getElementById("inpInteractionTypeContainer");
  const interactionType = document.getElementById("inpInteractionType");
  const interactionDuration = document.getElementById("inpInteractionDuration");

  // Handle case where element data might be empty or incomplete
  if (!element || Object.keys(element).length === 0) {
    console.log("No INP element data available, showing interaction info");
    if (elementTag) elementTag.textContent = `${interaction.target || "Element"} (${interaction.name})`;
    if (interactionDuration) interactionDuration.textContent = `${interaction.duration}ms`;
    if (elementDimensions) elementDimensions.textContent = "Element details not available";
    if (elementPosition) elementPosition.textContent = "Position not available";
    if (elementImage) {
      elementImage.innerHTML = '<div class="preview-placeholder">No element preview available</div>';
    }

    // Hide optional sections
    if (elementClassesContainer) elementClassesContainer.style.display = "none";
    if (interactionTypeContainer) interactionTypeContainer.style.display = "none";
    return;
  }
  console.log("Updating INP element preview with:", element);

  // Update element tag with more detailed information
  if (elementTag) {
    let tagDisplay = element.tagName ? element.tagName.toUpperCase() : "ELEMENT";
    if (element.classList && element.classList.length > 0) {
      tagDisplay += "." + element.classList[0];
    } else if (element.id) {
      tagDisplay += `#${element.id}`;
    }
    elementTag.textContent = tagDisplay;
    elementTag.style.color = "#ff6b35"; // Orange-red color for INP
  }

  // Update interaction duration
  if (interactionDuration) {
    interactionDuration.textContent = `${interaction.duration}ms`;
  }

  // Update dimensions
  if (elementDimensions && element.dimensions) {
    const dimensionText = `${element.dimensions.width || 0}×${element.dimensions.height || 0}px`;
    elementDimensions.textContent = dimensionText;
  } else if (elementDimensions) {
    elementDimensions.textContent = "Unknown dimensions";
  }

  // Update position
  if (elementPosition && element.position) {
    elementPosition.textContent = `${element.position.left || 0}, ${element.position.top || 0}px`;
  } else if (elementPosition) {
    elementPosition.textContent = "Unknown position";
  }

  // Update classes
  if (elementClassesContainer && elementClasses && element.classList && element.classList.length > 0) {
    elementClassesContainer.style.display = "block";
    elementClasses.textContent = element.classList.join(" ");
    elementClasses.title = element.classList.join(" ");
  } else if (elementClassesContainer) {
    elementClassesContainer.style.display = "none";
  }

  // Update interaction type
  if (interactionTypeContainer && interactionType) {
    interactionTypeContainer.style.display = "block";
    interactionType.textContent = interaction.name || "unknown";
  } else if (interactionTypeContainer) {
    interactionTypeContainer.style.display = "none";
  }

  // Update preview image with click functionality
  if (elementImage) {
    const imageUrl = element.preview || element.src || element.currentSrc;
    if (imageUrl) {
      console.log("Setting INP preview image:", imageUrl);
      elementImage.innerHTML = `
        <img src="${imageUrl}" 
             alt="INP Element Preview" 
             class="element-preview-img clickable-preview" 
             title="Click to highlight this element on the page"
             crossorigin="anonymous">
      `;

      // Add click handler to highlight element
      const previewImg = elementImage.querySelector(".clickable-preview");
      if (previewImg) {
        previewImg.addEventListener("click", () => {
          highlightINPElementOnPage();
        });

        // Add error handling for image loading
        previewImg.addEventListener("error", () => {
          console.log("INP preview image failed to load");
          elementImage.innerHTML = '<div class="preview-placeholder">Preview not available</div>';
        });
      }
    } else {
      console.log("No image URL available for INP preview");
      elementImage.innerHTML = '<div class="preview-placeholder">No preview available</div>';
    }
  }

  // Make the entire preview clickable
  const inpElementPreview = document.getElementById("inpElementPreview");
  if (inpElementPreview) {
    inpElementPreview.style.cursor = "pointer";
    inpElementPreview.title = "Click to highlight this element on the page";

    // Remove existing click handlers
    inpElementPreview.replaceWith(inpElementPreview.cloneNode(true));
    const newPreview = document.getElementById("inpElementPreview");
    newPreview.addEventListener("click", () => {
      highlightINPElementOnPage();
    });
  }
}

/**
 * Highlights the INP element on the page
 */
async function highlightINPElementOnPage() {
  console.log("highlightINPElementOnPage called");
  const inpElementPreview = document.getElementById("inpElementPreview");
  try {
    // Use the improved getTargetTabId function that auto-detects mode
    const targetTabId = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.getTargetTabId)();
    console.log("Target tab ID for INP highlighting:", targetTabId);
    if (!targetTabId) {
      console.log("No target tab available for INP highlighting");
      if (inpElementPreview) {
        (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(inpElementPreview, "error");
      }
      return false;
    }

    // Show immediate feedback
    if (inpElementPreview) {
      (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(inpElementPreview, "success");
    }
    const response = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.sendMessageToContentScript)(targetTabId, {
      action: "highlightINPElement"
    });
    console.log("INP highlight response:", response);
    return !!response;
  } catch (error) {
    console.error("Error highlighting INP element:", error);
    if (inpElementPreview) {
      (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(inpElementPreview, "error");
    }
    return false;
  }
}

/**
 * Highlights the CLS element on the page
 */
async function highlightCLSElementOnPage() {
  console.log("highlightCLSElementOnPage called");
  const clsElementPreview = document.getElementById("clsElementPreview");
  try {
    // Use the improved getTargetTabId function that auto-detects mode
    const targetTabId = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.getTargetTabId)();
    console.log("Target tab ID for CLS highlighting:", targetTabId);
    if (!targetTabId) {
      console.log("No target tab available for CLS highlighting");
      if (clsElementPreview) {
        (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(clsElementPreview, "error");
      }
      return false;
    }

    // Show immediate feedback
    if (clsElementPreview) {
      (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(clsElementPreview, "success");
    }
    const response = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.sendMessageToContentScript)(targetTabId, {
      action: "highlightCLSElement"
    });
    console.log("CLS highlight response:", response);
    return !!response;
  } catch (error) {
    console.error("Error highlighting CLS element:", error);
    if (clsElementPreview) {
      (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(clsElementPreview, "error");
    }
    return false;
  }
}

/**
 * Highlights the LCP element on the page
 */
async function highlightLCPElementOnPage() {
  console.log("highlightLCPElementOnPage called");
  const lcpElementPreview = document.getElementById("lcpElementPreview");
  try {
    // Use the improved getTargetTabId function that auto-detects mode
    const targetTabId = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.getTargetTabId)();
    console.log("Target tab ID for LCP highlighting:", targetTabId);
    if (!targetTabId) {
      console.log("No target tab available for LCP highlighting");
      if (lcpElementPreview) {
        (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(lcpElementPreview, "error");
      }
      return false;
    }

    // Show immediate feedback
    if (lcpElementPreview) {
      (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(lcpElementPreview, "success");
    }
    const response = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.sendMessageToContentScript)(targetTabId, {
      action: "highlightLCPElement"
    });
    console.log("LCP highlight response:", response);
    return !!response;
  } catch (error) {
    console.error("Error highlighting LCP element:", error);
    if (lcpElementPreview) {
      (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(lcpElementPreview, "error");
    }
    return false;
  }
}

/**
 * Updates threshold indicators with correct Core Web Vitals ranges
 * Now supports combination indicators when values are close (within tolerance)
 */
function updateMetricThresholds(metric, value, isField = false, isLab = false) {
  const threshold = THRESHOLDS[metric];
  if (!threshold || value === null || value === undefined) return;
  const bar = document.querySelector(`.${metric}-bar`);
  if (!bar) return;

  // Calculate position based on threshold ranges
  let percentage = 0;
  const maxValue = threshold.needsImprovement * 2; // Extended range for visualization

  if (metric === "cls") {
    // CLS uses different scale (0-1 range)
    percentage = Math.min(value / 0.5 * 100, 100);
  } else {
    // Time-based metrics (ms)
    percentage = Math.min(value / maxValue * 100, 100);
  }

  // Determine indicator type and data label
  let dataType = "local";
  let dataLabel = "Local";
  if (isLab) {
    dataType = "lab";
    dataLabel = "Lab";
  } else if (isField) {
    dataType = "field";
    dataLabel = "Field";
  }

  // Get current metric values for combination checking
  const localValue = insightsState.metrics[metric].local;
  const fieldValue = insightsState.metrics[metric].field;
  const labValue = insightsState.metrics[metric].lab;

  // Define tolerance for "close enough" values (0% to 0.1% tolerance)
  const tolerance = calculateTolerance(metric, value);

  // Check for matching values within tolerance
  const localFieldMatch = localValue !== null && fieldValue !== null && Math.abs(localValue - fieldValue) <= tolerance;
  const localLabMatch = localValue !== null && labValue !== null && Math.abs(localValue - labValue) <= tolerance;
  const fieldLabMatch = fieldValue !== null && labValue !== null && Math.abs(fieldValue - labValue) <= tolerance;
  const allMatch = localValue !== null && fieldValue !== null && labValue !== null && localFieldMatch && localLabMatch && fieldLabMatch;

  // Remove all existing indicators for this metric to avoid duplicates
  const existingIndicators = bar.querySelectorAll(".threshold-indicator");
  existingIndicators.forEach(indicator => indicator.remove());

  // Create indicators based on combinations and individual values
  const indicatorsToCreate = new Set();
  if (allMatch) {
    // All three sources match - show single combination indicator
    const indicator = document.createElement("div");
    indicator.className = `threshold-indicator all-sources-indicator`;
    indicator.style.left = `${percentage}%`;
    indicator.setAttribute("data-type", "all-sources-indicator");
    indicator.setAttribute("data-metric", metric);
    indicator.setAttribute("data-value", value);
    indicator.setAttribute("data-position", percentage.toFixed(2));
    indicator.title = `All Sources Match: ${formatMetricValue(metric, value)}`;
    bar.appendChild(indicator);
    console.log(`Added all-sources combination indicator for ${metric} at ${percentage}%`);
  } else {
    // Handle partial matches and individual indicators
    if (localFieldMatch && localValue !== null && fieldValue !== null) {
      // Local and Field match - create combination indicator
      const localPercentage = calculateIndicatorPosition(metric, localValue);
      const indicator = document.createElement("div");
      indicator.className = `threshold-indicator local-field-indicator`;
      indicator.style.left = `${localPercentage}%`;
      indicator.setAttribute("data-type", "local-field-indicator");
      indicator.setAttribute("data-metric", metric);
      indicator.setAttribute("data-value", localValue);
      indicator.setAttribute("data-position", localPercentage.toFixed(2));
      indicator.title = `Local + Field Match: ${formatMetricValue(metric, localValue)}`;
      bar.appendChild(indicator);

      // Add lab indicator separately if it exists and doesn't match
      if (labValue !== null && !localLabMatch) {
        createIndividualIndicator(bar, metric, labValue, "lab", "Lab");
      }
    } else if (localLabMatch && localValue !== null && labValue !== null) {
      // Local and Lab match - create combination indicator
      const localPercentage = calculateIndicatorPosition(metric, localValue);
      const indicator = document.createElement("div");
      indicator.className = `threshold-indicator local-lab-indicator`;
      indicator.style.left = `${localPercentage}%`;
      indicator.setAttribute("data-type", "local-lab-indicator");
      indicator.setAttribute("data-metric", metric);
      indicator.setAttribute("data-value", localValue);
      indicator.setAttribute("data-position", localPercentage.toFixed(2));
      indicator.title = `Local + Lab Match: ${formatMetricValue(metric, localValue)}`;
      bar.appendChild(indicator);

      // Add field indicator separately if it exists and doesn't match
      if (fieldValue !== null && !localFieldMatch) {
        createIndividualIndicator(bar, metric, fieldValue, "field", "Field");
      }
    } else if (fieldLabMatch && fieldValue !== null && labValue !== null) {
      // Field and Lab match - create combination indicator
      const fieldPercentage = calculateIndicatorPosition(metric, fieldValue);
      const indicator = document.createElement("div");
      indicator.className = `threshold-indicator field-lab-indicator`;
      indicator.style.left = `${fieldPercentage}%`;
      indicator.setAttribute("data-type", "field-lab-indicator");
      indicator.setAttribute("data-metric", metric);
      indicator.setAttribute("data-value", fieldValue);
      indicator.setAttribute("data-position", fieldPercentage.toFixed(2));
      indicator.title = `Field + Lab Match: ${formatMetricValue(metric, fieldValue)}`;
      bar.appendChild(indicator);

      // Add local indicator separately if it exists and doesn't match
      if (localValue !== null && !localFieldMatch) {
        createIndividualIndicator(bar, metric, localValue, "local", "Local");
      }
    } else {
      // No matches - create individual indicators for all available sources
      if (localValue !== null) {
        createIndividualIndicator(bar, metric, localValue, "local", "Local");
      }
      if (fieldValue !== null) {
        createIndividualIndicator(bar, metric, fieldValue, "field", "Field");
      }
      if (labValue !== null && (metric === "cls" || metric === "lcp")) {
        createIndividualIndicator(bar, metric, labValue, "lab", "Lab");
      }
    }
  }

  // Smart positioning logic for multiple indicators
  const allIndicators = bar.querySelectorAll(".threshold-indicator");
  if (allIndicators.length > 1) {
    bar.classList.add("multiple-indicators");
    positionIndicatorsIntelligently(bar, allIndicators);
  } else {
    bar.classList.remove("multiple-indicators");
  }
}

/**
 * Calculate tolerance based on metric type and value
 * 0% to 0.1% tolerance as requested
 */
function calculateTolerance(metric, value) {
  if (metric === "cls") {
    // For CLS, 0.1% of typical range (0-0.5)
    return Math.max(0.0005, value * 0.001); // Minimum 0.0005, or 0.1% of value
  } else {
    // For time-based metrics, 0.1% of value with minimum 1ms
    return Math.max(1, value * 0.001); // Minimum 1ms, or 0.1% of value
  }
}

/**
 * Calculate indicator position on the threshold bar
 */
function calculateIndicatorPosition(metric, value) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return 0;
  const maxValue = threshold.needsImprovement * 2;
  if (metric === "cls") {
    return Math.min(value / 0.5 * 100, 100);
  } else {
    return Math.min(value / maxValue * 100, 100);
  }
}

/**
 * Create individual indicator for a specific data source
 */
function createIndividualIndicator(bar, metric, value, dataType, dataLabel) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return;

  // Calculate position
  let percentage = 0;
  const maxValue = threshold.needsImprovement * 2;
  if (metric === "cls") {
    percentage = Math.min(value / 0.5 * 100, 100);
  } else {
    percentage = Math.min(value / maxValue * 100, 100);
  }
  const indicator = document.createElement("div");
  indicator.className = `threshold-indicator ${dataType}-indicator`;
  indicator.style.left = `${percentage}%`;
  indicator.setAttribute("data-type", dataType);
  indicator.setAttribute("data-metric", metric);
  indicator.setAttribute("data-value", value);
  indicator.setAttribute("data-position", percentage.toFixed(2));
  indicator.title = `${dataLabel}: ${formatMetricValue(metric, value)}`;
  bar.appendChild(indicator);
}

/**
 * Intelligently positions indicators to handle overlaps and same-position stacking
 */
function positionIndicatorsIntelligently(bar, indicators) {
  // Group indicators by position (within 1% tolerance for same position)
  const positionGroups = new Map();
  indicators.forEach(indicator => {
    const position = Number.parseFloat(indicator.getAttribute("data-position"));
    let foundGroup = false;

    // Check if this position is close to any existing group
    for (const [groupPos, group] of positionGroups) {
      if (Math.abs(position - groupPos) <= 1) {
        group.push(indicator);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      positionGroups.set(position, [indicator]);
    }
  });

  // Position indicators within each group
  positionGroups.forEach((group, position) => {
    if (group.length === 1) {
      // Single indicator - normal positioning
      const indicator = group[0];
      indicator.style.left = `${position}%`;
      indicator.style.top = "-5px"; // Updated position
      indicator.style.zIndex = "10";
    } else {
      // Multiple indicators at same position - stack them
      group.forEach((indicator, index) => {
        const dataType = indicator.getAttribute("data-type");

        // Vertical stacking with slight horizontal offset for visibility
        const verticalOffset = index * 8; // 8px vertical spacing
        const horizontalOffset = index * 2; // 2px horizontal offset for better visibility

        indicator.style.left = `calc(${position}% + ${horizontalOffset}px)`;
        indicator.style.top = `${-5 - verticalOffset}px`; // Updated position
        indicator.style.zIndex = `${15 + index}`; // Higher z-index for stacked items

        // Add stacked class for special styling
        indicator.classList.add("stacked-indicator");
      });
    }
  });
}

// Initialize PSI button when the module loads
document.addEventListener("DOMContentLoaded", () => {
  setupPSIAnalyzeButton();
});

// Also export the setup function so it can be called from other modules


// Export the state management function


// Ensure PSI button is set up when module loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupPSIAnalyzeButton);
} else {
  setupPSIAnalyzeButton();
}

/***/ }),

/***/ 864:
/*!*************************************************!*\
  !*** ./src/popup/displays/insights-renderer.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   InsightsRenderer: () => (/* binding */ InsightsRenderer),
/* harmony export */   insightsRenderer: () => (/* binding */ insightsRenderer)
/* harmony export */ });
/**
 * Simplified PSI Insights Renderer
 * Renders PageSpeed Insights data with minimal DOM structure
 */

class InsightsRenderer {
  constructor() {
    this.expandedInsights = new Set();
    this.activeTooltip = null;
  }

  /**
   * Render the complete PSI insights interface
   */
  renderInsights(container, insights) {
    if (!container) {
      console.error("InsightsRenderer: Container element not found");
      return;
    }

    // Clear existing content
    container.innerHTML = "";
    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      this.renderEmptyState(container);
      return;
    }

    // Render header directly to container
    const header = this.renderHeader(insights.length);
    container.appendChild(header);

    // Render insights directly to container
    insights.forEach((insight, index) => {
      const item = this.renderInsightItem(insight, index);
      container.appendChild(item);
    });

    // Initialize tooltip system after rendering
    this.initializeTooltips();
  }

  /**
   * Initialize smart tooltip system with proper cleanup
   */
  initializeTooltips() {
    // Clean up any existing tooltips and listeners
    this.cleanupTooltips();

    // Add event listeners to all tooltip triggers
    document.querySelectorAll(".tooltip-trigger").forEach(trigger => {
      trigger.addEventListener("mouseenter", e => this.showTooltip(e));
      trigger.addEventListener("mouseleave", e => this.hideTooltip(e));
      trigger.addEventListener("mousemove", e => this.updateTooltipPosition(e));
    });
  }

  /**
   * Clean up all tooltips and prevent clustering
   */
  cleanupTooltips() {
    // Remove all existing tooltips
    document.querySelectorAll(".smart-tooltip").forEach(tooltip => tooltip.remove());
    this.activeTooltip = null;
  }

  /**
   * Show smart positioned tooltip with clustering prevention
   */
  showTooltip(event) {
    // Prevent multiple tooltips
    this.cleanupTooltips();
    const trigger = event.target;
    const tooltipText = trigger.getAttribute("data-tooltip");
    if (!tooltipText) return;

    // Create tooltip element
    const tooltip = document.createElement("div");
    tooltip.className = "smart-tooltip";
    tooltip.textContent = tooltipText;
    document.body.appendChild(tooltip);

    // Store reference
    this.activeTooltip = tooltip;
    trigger._tooltip = tooltip;

    // Position tooltip
    this.positionTooltip(trigger, tooltip);
  }

  /**
   * Position tooltip intelligently
   */
  positionTooltip(trigger, tooltip) {
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16;

    // Calculate initial position (below trigger)
    let left = triggerRect.left;
    let top = triggerRect.bottom + 8;

    // Adjust horizontal position if tooltip would overflow
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (left < padding) {
      left = padding;
    }

    // Adjust vertical position if tooltip would overflow
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = triggerRect.top - tooltipRect.height - 8;
    }
    if (top < padding) {
      top = triggerRect.bottom + 8; // Fallback to below
    }

    // Apply position with smooth animation
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.opacity = "1";
    tooltip.style.transform = "translateY(0)";
  }

  /**
   * Update tooltip position on mouse move (for better tracking)
   */
  updateTooltipPosition(event) {
    if (!this.activeTooltip) return;
    const trigger = event.target;
    this.positionTooltip(trigger, this.activeTooltip);
  }

  /**
   * Hide tooltip with proper cleanup
   */
  hideTooltip(event) {
    const trigger = event.target;
    if (trigger._tooltip) {
      trigger._tooltip.remove();
      trigger._tooltip = null;
    }
    if (this.activeTooltip) {
      this.activeTooltip.remove();
      this.activeTooltip = null;
    }
  }

  /**
   * Render the insights header with count
   */
  renderHeader(count) {
    const header = document.createElement("div");
    header.className = "psi-insights-header";
    const title = document.createElement("h3");
    title.className = "section-title";
    title.textContent = "Performance Insights";
    const countBadge = document.createElement("span");
    countBadge.className = "insights-count";
    countBadge.textContent = `${count} insights`;
    header.appendChild(title);
    header.appendChild(countBadge);
    return header;
  }

  /**
   * Render individual insight item - simplified without icons
   */
  renderInsightItem(insight, index) {
    const item = document.createElement("div");

    // Determine status based on score instead of hardcoding
    const statusClass = this.determineInsightStatus(insight);
    item.className = `psi-insight-item ${statusClass}`;

    // Create header
    const header = this.renderInsightHeader(insight, index);
    item.appendChild(header);

    // Create content (initially hidden)
    const content = this.renderInsightContent(insight);
    item.appendChild(content);
    return item;
  }

  /**
   * Determine insight status based on category and score
   */
  determineInsightStatus(insight) {
    // First check if insight has a category from the API
    if (insight.category) {
      switch (insight.category) {
        case "failed":
          return "failed-insight";
        case "warning":
          return "warning-insight";
        default:
          return "unknown-insight";
      }
    }

    // Fallback to score-based determination if no category
    if (insight.score === undefined || insight.score === null) {
      return "unknown-insight";
    }
    const score = Number.parseFloat(insight.score);

    // PSI scoring: 0-0.49 = failed, 0.5-0.89 = warning
    if (score < 0.5) {
      return "failed-insight";
    } else if (score < 0.9) {
      return "warning-insight";
    } else {
      return "unknown-insight";
    }
  }

  /**
   * Render insight header (clickable) - simplified without icons
   */
  renderInsightHeader(insight, index) {
    const header = document.createElement("div");
    header.className = "insight-header";
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", "false");

    // Title only (no icon)
    const title = document.createElement("div");
    title.className = "insight-title";
    title.textContent = this.formatInsightTitle(insight.title || insight.id);

    // Expand icon
    const expandIcon = document.createElement("div");
    expandIcon.className = "insight-expand-icon";
    expandIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
        `;
    header.appendChild(title);
    header.appendChild(expandIcon);

    // Add click handler
    header.addEventListener("click", () => this.toggleInsight(header.parentElement, index));
    header.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggleInsight(header.parentElement, index);
      }
    });
    return header;
  }

  /**
   * Render insight content with support for different detail types
   */
  renderInsightContent(insight) {
    console.log("Rendering insight content for:", insight.title || insight.id, insight);
    const content = document.createElement("div");
    content.className = "insight-content";

    // Add description if available
    if (insight.description) {
      const description = this.renderDescription(insight.description);
      content.appendChild(description);
    }

    // Special handling for network dependency tree
    if (insight.id === "network-dependency-tree-insight" || insight.id === "critical-request-chains") {
      console.log("Detected network dependency tree insight");
      const networkTree = this.renderNetworkDependencyFromAPI(insight);
      content.appendChild(networkTree);
      return content;
    }

    // Handle different types of details
    if (insight.details) {
      console.log("Processing insight details:", insight.details);
      if (insight.details.type === "network-tree") {
        console.log("Rendering network tree for:", insight.title);
        const networkTree = this.renderNetworkTree(insight.details);
        content.appendChild(networkTree);
      } else if (insight.details.items) {
        console.log("Rendering details items for:", insight.title);
        const detailsContainer = this.renderDetails(insight.details, insight);
        if (detailsContainer.children.length > 0) {
          content.appendChild(detailsContainer);
        }
      } else {
        console.log("Unknown details structure for:", insight.title, insight.details);
        // Show raw details structure for debugging
        const debugContainer = document.createElement("div");
        debugContainer.className = "debug-details";
        debugContainer.innerHTML = `<pre style="font-size: 10px; max-height: 150px; overflow: auto;">${JSON.stringify(insight.details, null, 2)}</pre>`;
        content.appendChild(debugContainer);
      }
    } else {
      console.log("No details found for:", insight.title);
      // Show a minimal "no data" message if no details
      const noData = document.createElement("div");
      noData.className = "no-data-message";
      noData.textContent = "No detailed data available";
      content.appendChild(noData);
    }
    return content;
  }

  /**
   * Render network dependency tree from API response structure
   */
  renderNetworkDependencyFromAPI(insight) {
    console.log("Rendering network dependency tree from API:", insight);
    const container = document.createElement("div");
    container.className = "network-dependency-container";

    // Extract chains data from the API structure
    let chainsData = null;
    let longestChain = null;
    if (insight.details && insight.details.items && insight.details.items.length > 0) {
      const firstItem = insight.details.items[0];
      if (firstItem.value && firstItem.value.chains) {
        chainsData = firstItem.value.chains;
        longestChain = firstItem.value.longestChain;
        console.log("Found chains data:", chainsData);
      }
    }
    if (chainsData && Object.keys(chainsData).length > 0) {
      // Show summary info
      const summary = document.createElement("div");
      summary.className = "network-summary";
      const chainCount = Object.keys(chainsData).length;
      summary.innerHTML = `
        <div class="summary-item">
          <span class="summary-label">Critical chains:</span>
          <span class="summary-value">${chainCount}</span>
        </div>
        ${longestChain && longestChain.duration ? `
        <div class="summary-item">
          <span class="summary-label">Longest chain:</span>
          <span class="summary-value">${Math.round(longestChain.duration)}ms</span>
        </div>
        ` : ""}
      `;
      container.appendChild(summary);

      // Render each chain
      const chainsContainer = document.createElement("div");
      chainsContainer.className = "critical-chains";
      Object.entries(chainsData).forEach(([chainId, chain], index) => {
        const chainHeader = document.createElement("div");
        chainHeader.className = "chain-header";
        chainHeader.textContent = `Chain ${index + 1}`;
        chainsContainer.appendChild(chainHeader);
        const chainTree = this.renderAPIChain(chain, 0);
        chainsContainer.appendChild(chainTree);
      });
      container.appendChild(chainsContainer);
    } else {
      // No chains data found
      const noChains = document.createElement("div");
      noChains.className = "no-chains-message";
      noChains.textContent = "No critical request chains detected";
      container.appendChild(noChains);
    }
    return container;
  }

  /**
   * Render a chain from the API response structure
   */
  renderAPIChain(chain, depth) {
    const chainElement = document.createElement("div");
    chainElement.className = `critical-chain-item depth-${depth}`;

    // Create the main item
    const itemElement = document.createElement("div");
    itemElement.className = "chain-item";

    // Add indentation
    const indent = document.createElement("div");
    indent.className = "chain-indent";
    indent.style.width = `${depth * 16}px`;
    if (depth > 0) {
      indent.innerHTML = "└─ ";
    }

    // Extract URL info
    const url = chain.url || "Unknown URL";
    const filename = this.extractFilename(url);
    const domain = this.extractDomain(url);

    // Create URL display
    const urlDisplay = document.createElement("div");
    urlDisplay.className = "chain-url";
    const urlText = document.createElement("span");
    urlText.className = "url-text tooltip-trigger";
    urlText.setAttribute("data-tooltip", url);
    urlText.textContent = filename;
    if (domain && !domain.includes(window.location.hostname)) {
      const domainSpan = document.createElement("span");
      domainSpan.className = "url-domain";
      domainSpan.textContent = ` (${domain})`;
      urlText.appendChild(domainSpan);
    }
    urlDisplay.appendChild(urlText);

    // Add timing info
    const timing = document.createElement("div");
    timing.className = "chain-timing";
    const transferSize = chain.transferSize || 0;
    const duration = chain.navStartToEndTime || 0;
    timing.innerHTML = `
      <span class="timing-size">${this.formatBytes(transferSize)}</span>
      <span class="timing-duration">${Math.round(duration)}ms</span>
    `;

    // Combine elements
    itemElement.appendChild(indent);
    itemElement.appendChild(urlDisplay);
    itemElement.appendChild(timing);
    chainElement.appendChild(itemElement);

    // Render children recursively
    if (chain.children && Object.keys(chain.children).length > 0) {
      Object.values(chain.children).forEach(childChain => {
        const childElement = this.renderAPIChain(childChain, depth + 1);
        chainElement.appendChild(childElement);
      });
    }
    return chainElement;
  }

  /**
   * Render network dependency tree specifically for critical request chains
   */
  renderNetworkDependencyTree(insight) {
    console.log("Rendering network dependency tree for critical request chains:", insight);
    const container = document.createElement("div");
    container.className = "network-dependency-container";

    // Check if we have chains data
    let chainsData = null;
    if (insight.details && insight.details.chains) {
      chainsData = insight.details.chains;
    } else if (insight.details && insight.details.items) {
      // Look for chains in items
      for (const item of insight.details.items) {
        if (item.chains) {
          chainsData = item.chains;
          break;
        }
      }
    }
    if (chainsData && Object.keys(chainsData).length > 0) {
      // Show summary info
      const summary = document.createElement("div");
      summary.className = "network-summary";
      const chainCount = Object.keys(chainsData).length;
      const longestChain = this.findLongestChain(chainsData);
      summary.innerHTML = `
        <div class="summary-item">
          <span class="summary-label">Critical chains:</span>
          <span class="summary-value">${chainCount}</span>
        </div>
        ${longestChain ? `
        <div class="summary-item">
          <span class="summary-label">Longest chain:</span>
          <span class="summary-value">${Math.round(longestChain.duration)}ms</span>
        </div>
        ` : ""}
      `;
      container.appendChild(summary);

      // Render each chain
      const chainsContainer = document.createElement("div");
      chainsContainer.className = "critical-chains";
      Object.entries(chainsData).forEach(([chainId, chain], index) => {
        const chainHeader = document.createElement("div");
        chainHeader.className = "chain-header";
        chainHeader.textContent = `Chain ${index + 1}`;
        chainsContainer.appendChild(chainHeader);
        const chainTree = this.renderCriticalChain(chain, 0);
        chainsContainer.appendChild(chainTree);
      });
      container.appendChild(chainsContainer);
    } else {
      // No chains data found
      const noChains = document.createElement("div");
      noChains.className = "no-chains-message";
      noChains.textContent = "No critical request chains detected";
      container.appendChild(noChains);
    }
    return container;
  }

  /**
   * Find the longest chain for summary display
   */
  findLongestChain(chainsData) {
    let longest = null;
    let maxDuration = 0;
    Object.values(chainsData).forEach(chain => {
      const duration = this.calculateChainDuration(chain);
      if (duration > maxDuration) {
        maxDuration = duration;
        longest = {
          ...chain,
          duration
        };
      }
    });
    return longest;
  }

  /**
   * Calculate total duration of a chain
   */
  calculateChainDuration(chain) {
    let totalDuration = chain.transferSize || 0;
    if (chain.children) {
      Object.values(chain.children).forEach(child => {
        totalDuration += this.calculateChainDuration(child);
      });
    }
    return totalDuration;
  }

  /**
   * Render a critical request chain
   */
  renderCriticalChain(chain, depth) {
    var _chain$request;
    const chainElement = document.createElement("div");
    chainElement.className = `critical-chain-item depth-${depth}`;

    // Create the main item
    const itemElement = document.createElement("div");
    itemElement.className = "chain-item";

    // Add indentation
    const indent = document.createElement("div");
    indent.className = "chain-indent";
    indent.style.width = `${depth * 16}px`;
    if (depth > 0) {
      indent.innerHTML = "└─ ";
    }

    // Extract URL info
    const url = ((_chain$request = chain.request) === null || _chain$request === void 0 ? void 0 : _chain$request.url) || chain.url || "Unknown URL";
    const filename = this.extractFilename(url);
    const domain = this.extractDomain(url);

    // Create URL display
    const urlDisplay = document.createElement("div");
    urlDisplay.className = "chain-url";
    const urlText = document.createElement("span");
    urlText.className = "url-text tooltip-trigger";
    urlText.setAttribute("data-tooltip", url);
    urlText.textContent = filename;
    if (domain && !domain.includes(window.location.hostname)) {
      const domainSpan = document.createElement("span");
      domainSpan.className = "url-domain";
      domainSpan.textContent = ` (${domain})`;
      urlText.appendChild(domainSpan);
    }
    urlDisplay.appendChild(urlText);

    // Add timing info
    const timing = document.createElement("div");
    timing.className = "chain-timing";
    const transferSize = chain.transferSize || 0;
    const duration = chain.responseReceivedTime - chain.startTime || 0;
    timing.innerHTML = `
      <span class="timing-size">${this.formatBytes(transferSize)}</span>
      <span class="timing-duration">${Math.round(duration)}ms</span>
    `;

    // Combine elements
    itemElement.appendChild(indent);
    itemElement.appendChild(urlDisplay);
    itemElement.appendChild(timing);
    chainElement.appendChild(itemElement);

    // Render children recursively
    if (chain.children && Object.keys(chain.children).length > 0) {
      Object.values(chain.children).forEach(childChain => {
        const childElement = this.renderCriticalChain(childChain, depth + 1);
        chainElement.appendChild(childElement);
      });
    }
    return chainElement;
  }

  /**
   * Render insight description with link formatting
   */
  renderDescription(description) {
    const descContainer = document.createElement("div");
    descContainer.className = "insight-description";

    // Convert markdown-style links to HTML links
    const htmlDescription = description.replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="insight-link">$1</a>');
    descContainer.innerHTML = htmlDescription;
    return descContainer;
  }

  /**
   * Render details based on type
   */
  renderDetails(details, insight) {
    const container = document.createElement("div");
    container.className = "insight-details-container";
    if (!details.items || !Array.isArray(details.items)) {
      console.log("No items array found in details:", details);
      return container;
    }

    // Process items only once - find the first table-like structure
    let tableRendered = false;
    for (const item of details.items) {
      if (item.type === "checklist") {
        const checklist = this.renderChecklist(item);
        container.appendChild(checklist);
      } else if (item.type === "node") {
        const nodeInfo = this.renderNodeInfo(item);
        container.appendChild(nodeInfo);
      } else if (item.items && Array.isArray(item.items) && !tableRendered) {
        // Only render the first table structure found
        const table = this.renderDetailsTable({
          items: item.items,
          headings: item.headings
        }, insight);
        container.appendChild(table);
        tableRendered = true;
      }
    }

    // Fallback: if no table was rendered, try extracting from details
    if (!tableRendered && container.children.length === 0) {
      const tableData = this.extractTableData(details);
      if (tableData && tableData.items && tableData.items.length > 0) {
        const table = this.renderDetailsTable(tableData, insight);
        container.appendChild(table);
      }
    }
    return container;
  }

  /**
   * Render checklist items with checkmarks and X marks
   */
  renderChecklist(checklistItem) {
    const checklist = document.createElement("div");
    checklist.className = "insight-checklist";
    if (!checklistItem.items || typeof checklistItem.items !== "object") {
      return checklist;
    }

    // Convert checklist items object to array for rendering
    Object.entries(checklistItem.items).forEach(([key, item]) => {
      const checklistRow = document.createElement("div");
      checklistRow.className = "checklist-item";

      // Create icon based on value
      const icon = document.createElement("div");
      icon.className = `checklist-icon ${item.value ? "checklist-pass" : "checklist-fail"}`;
      if (item.value) {
        icon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        `;
      } else {
        icon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
      }

      // Create label
      const label = document.createElement("div");
      label.className = "checklist-label";
      label.textContent = item.label || key;
      checklistRow.appendChild(icon);
      checklistRow.appendChild(label);
      checklist.appendChild(checklistRow);
    });
    return checklist;
  }

  /**
   * Render node information
   */
  renderNodeInfo(nodeItem) {
    const nodeContainer = document.createElement("div");
    nodeContainer.className = "insight-node-info";
    if (nodeItem.snippet) {
      const snippet = document.createElement("div");
      snippet.className = "node-snippet";
      snippet.textContent = nodeItem.snippet;
      nodeContainer.appendChild(snippet);
    }
    if (nodeItem.selector) {
      const selector = document.createElement("div");
      selector.className = "node-selector";
      selector.textContent = `Selector: ${nodeItem.selector}`;
      nodeContainer.appendChild(selector);
    }
    if (nodeItem.nodeLabel) {
      const label = document.createElement("div");
      label.className = "node-label";
      label.textContent = nodeItem.nodeLabel;
      nodeContainer.appendChild(label);
    }
    return nodeContainer;
  }

  /**
   * Render network dependency tree - Fixed to handle PSI network tree structure
   */
  renderNetworkTree(details) {
    console.log("Rendering network tree with details:", details);
    const treeContainer = document.createElement("div");
    treeContainer.className = "network-tree-container";

    // Add maximum critical path latency if available
    if (details.longestChain && details.longestChain.duration) {
      const latencyInfo = document.createElement("div");
      latencyInfo.className = "network-latency-info";
      latencyInfo.textContent = `Maximum critical path latency: ${details.longestChain.duration} ms`;
      treeContainer.appendChild(latencyInfo);
    }

    // Add initial navigation header
    const navHeader = document.createElement("div");
    navHeader.className = "network-nav-header";
    navHeader.textContent = "Initial Navigation";
    treeContainer.appendChild(navHeader);

    // Handle different possible structures for network tree data
    let chainsData = null;

    // Check for chains in details directly
    if (details.chains) {
      chainsData = details.chains;
      console.log("Found chains in details.chains:", chainsData);
    }
    // Check for chains in items array
    else if (details.items && Array.isArray(details.items)) {
      // Look for chains in the items array
      for (const item of details.items) {
        if (item.chains) {
          chainsData = item.chains;
          console.log("Found chains in details.items[].chains:", chainsData);
          break;
        }
        // Sometimes the entire item is the chain data
        if (item.url && (item.children || item.transferSize)) {
          // Convert single item to chains format
          chainsData = {
            0: item
          };
          console.log("Converted single item to chains format:", chainsData);
          break;
        }
      }

      // If no chains found but we have items, try to render as a simple list
      if (!chainsData && details.items.length > 0) {
        console.log("No chains found, rendering items as simple list");
        const simpleList = this.renderNetworkSimpleList(details.items);
        treeContainer.appendChild(simpleList);
        return treeContainer;
      }
    }

    // Render the dependency chains if we found them
    if (chainsData && typeof chainsData === "object") {
      const chainsContainer = document.createElement("div");
      chainsContainer.className = "network-chains";
      Object.entries(chainsData).forEach(([chainId, chain]) => {
        console.log(`Rendering chain ${chainId}:`, chain);
        const chainElement = this.renderNetworkChain(chain, 0);
        chainsContainer.appendChild(chainElement);
      });
      treeContainer.appendChild(chainsContainer);
    } else {
      console.log("No valid chains data found, showing debug info");
      // Show debug information
      const debugInfo = document.createElement("div");
      debugInfo.className = "network-debug";
      debugInfo.innerHTML = `
        <div>Network tree structure not recognized:</div>
        <pre style="font-size: 8px; max-height: 200px; overflow: auto;">${JSON.stringify(details, null, 2)}</pre>
      `;
      treeContainer.appendChild(debugInfo);
    }
    return treeContainer;
  }

  /**
   * Render network items as a simple list when chain structure is not available
   */
  renderNetworkSimpleList(items) {
    const listContainer = document.createElement("div");
    listContainer.className = "network-simple-list";
    items.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = "network-list-item";

      // Extract URL and basic info
      const url = item.url || item.href || "Unknown URL";
      const filename = this.extractFilename(url);
      const domain = this.extractDomain(url);

      // Create display
      const urlDisplay = document.createElement("div");
      urlDisplay.className = "network-url-display";
      urlDisplay.textContent = filename;
      if (domain && !domain.includes(window.location.hostname)) {
        const domainSpan = document.createElement("span");
        domainSpan.className = "network-domain";
        domainSpan.textContent = ` (${domain})`;
        urlDisplay.appendChild(domainSpan);
      }

      // Add timing/size info if available
      const metaInfo = document.createElement("div");
      metaInfo.className = "network-meta";
      const parts = [];
      if (item.transferSize) parts.push(this.formatBytes(item.transferSize));
      if (item.duration) parts.push(`${item.duration}ms`);
      if (item.startTime) parts.push(`@${item.startTime}ms`);
      if (parts.length > 0) {
        metaInfo.textContent = parts.join(", ");
      }
      itemElement.appendChild(urlDisplay);
      if (metaInfo.textContent) {
        itemElement.appendChild(metaInfo);
      }
      listContainer.appendChild(itemElement);
    });
    return listContainer;
  }

  /**
   * Render individual network chain with proper indentation
   */
  renderNetworkChain(chain, depth) {
    if (!chain || typeof chain !== "object") {
      console.log("Invalid chain data:", chain);
      return document.createElement("div");
    }
    const chainElement = document.createElement("div");
    chainElement.className = `network-chain-item depth-${depth}`;

    // Create the main item
    const itemElement = document.createElement("div");
    itemElement.className = "network-item";

    // Add tree connector
    const connector = document.createElement("div");
    connector.className = "tree-connector";
    connector.style.marginLeft = `${depth * 20}px`;

    // Add connector lines based on depth
    if (depth > 0) {
      connector.innerHTML = "└─ ";
    }

    // Extract filename and domain
    const url = chain.url || chain.href || "Unknown";
    const filename = this.extractFilename(url);
    const domain = this.extractDomain(url);

    // Create URL display
    const urlDisplay = document.createElement("span");
    urlDisplay.className = "network-url";

    // Color code by domain
    if (domain && domain.includes("mediavine.com")) {
      urlDisplay.classList.add("mediavine-domain");
    } else if (domain && domain.includes("googlesyndication.com")) {
      urlDisplay.classList.add("third-party");
    } else {
      urlDisplay.classList.add("main-domain");
    }

    // Truncate long filenames
    const displayName = filename.length > 50 ? `...${filename.slice(-47)}` : filename;
    urlDisplay.textContent = displayName;

    // Add domain in parentheses if different from main
    if (domain && !domain.includes(window.location.hostname)) {
      const domainSpan = document.createElement("span");
      domainSpan.className = "network-domain";
      domainSpan.textContent = ` (${domain})`;
      urlDisplay.appendChild(domainSpan);
    }

    // Add timing and size info
    const metaInfo = document.createElement("span");
    metaInfo.className = "network-meta";
    const timing = chain.navStartToEndTime || chain.duration || chain.endTime;
    const timingText = timing ? `${Math.round(timing)} ms` : "N/A";
    const size = chain.transferSize ? this.formatBytes(chain.transferSize) : "N/A";
    metaInfo.innerHTML = ` - <span class="network-timing">${timingText}</span>, <span class="network-size">${size}</span>`;

    // Combine elements
    itemElement.appendChild(connector);
    itemElement.appendChild(urlDisplay);
    itemElement.appendChild(metaInfo);
    chainElement.appendChild(itemElement);

    // Render children recursively
    if (chain.children && typeof chain.children === "object" && Object.keys(chain.children).length > 0) {
      Object.entries(chain.children).forEach(([childId, childChain]) => {
        const childElement = this.renderNetworkChain(childChain, depth + 1);
        chainElement.appendChild(childElement);
      });
    }
    return chainElement;
  }

  /**
   * Extract table data from PSI nested structure
   */
  extractTableData(details) {
    if (!details) return null;

    // Handle PSI nested structure: details.items[0].items contains the actual data
    if (details.items && Array.isArray(details.items) && details.items.length > 0) {
      // Look for the first item that has table-like structure
      for (const item of details.items) {
        if (item.items && Array.isArray(item.items) && item.items.length > 0) {
          // Check if this looks like table data (not checklist or node)
          if (item.type !== "checklist" && item.type !== "node") {
            return {
              headings: item.headings || details.headings || [],
              items: item.items
            };
          }
        }
      }

      // Fallback: use details.items directly if no nested structure found
      const nonSpecialItems = details.items.filter(item => item.type !== "checklist" && item.type !== "node" && !item.items);
      if (nonSpecialItems.length > 0) {
        return {
          headings: details.headings || [],
          items: nonSpecialItems
        };
      }
    }
    return null;
  }

  /**
   * Render details table for insight data
   */
  renderDetailsTable(details, insight) {
    const table = document.createElement("table");
    table.className = "insight-table";

    // Create header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    if (details.headings && details.headings.length > 0) {
      details.headings.forEach((heading, index) => {
        const th = document.createElement("th");
        // Safely extract string value from heading object
        let headingText = "Column";
        if (typeof heading === "string") {
          headingText = heading;
        } else if (heading && typeof heading === "object") {
          headingText = heading.label || heading.text || heading.key || "Column";
        }
        th.textContent = this.formatHeading(headingText);

        // Add alignment classes based on column type
        if (index === 0) {
          th.classList.add("url-column");
        } else if (this.isNumericColumn(headingText)) {
          th.classList.add("numeric-column");
        }
        headerRow.appendChild(th);
      });
    } else {
      // Default headers for forced reflow data
      const sourceHeader = document.createElement("th");
      sourceHeader.textContent = "Source";
      sourceHeader.classList.add("url-column");
      const timeHeader = document.createElement("th");
      timeHeader.textContent = "Reflow Time";
      timeHeader.classList.add("numeric-column");
      headerRow.appendChild(sourceHeader);
      headerRow.appendChild(timeHeader);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement("tbody");
    details.items.forEach(item => {
      const row = this.renderTableRow(item, details.headings, insight);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    return table;
  }

  /**
   * Check if a column should be treated as numeric
   */
  isNumericColumn(headingText) {
    const numericKeywords = ["transfer", "savings", "time", "size", "bytes", "ms", "kb", "mb", "duration", "score"];
    return numericKeywords.some(keyword => headingText.toLowerCase().includes(keyword));
  }

  /**
   * Render table row for insight item
   */
  renderTableRow(item, headings, insight) {
    const row = document.createElement("tr");
    if (headings && headings.length > 0) {
      headings.forEach((heading, index) => {
        const td = document.createElement("td");
        // Safely extract key from heading object
        let key = "unknown";
        if (typeof heading === "string") {
          key = heading;
        } else if (heading && typeof heading === "object") {
          key = heading.key || heading.text || heading.label || "unknown";
        }
        const value = item[key];

        // Apply column-specific styling
        if (index === 0) {
          td.className = "url-cell";
          td.innerHTML = this.formatUrlCell(value, item);
        } else if (this.isNumericColumn(key)) {
          td.className = "numeric-cell";
          td.innerHTML = this.formatNumericValue(value, key);
        } else if (key === "source") {
          td.className = "source-cell";
          td.innerHTML = this.formatSourceCell(value, item);
        } else if (key === "reflowTime" || key === "time" || key.includes("time") || key.includes("Time")) {
          td.className = "metric-value";
          td.innerHTML = this.formatTimeValue(value);
        } else {
          td.textContent = this.formatCellValue(value);
        }
        row.appendChild(td);
      });
    } else {
      // Default formatting for forced reflow data
      const sourceCell = document.createElement("td");
      sourceCell.className = "source-cell";
      sourceCell.innerHTML = this.formatSourceCell(item.source || item.url, item);
      const timeCell = document.createElement("td");
      timeCell.className = "metric-value";
      timeCell.innerHTML = this.formatTimeValue(item.reflowTime || item.time || item.duration);
      row.appendChild(sourceCell);
      row.appendChild(timeCell);
    }
    return row;
  }

  /**
   * Format URL cell with better wrapping and tooltip
   */
  formatUrlCell(url, item) {
    if (!url) {
      return '<div class="unattributed">Unattributed</div>';
    }
    const urlString = typeof url === "object" ? url.url || url.href || String(url) : String(url);
    const filename = this.extractFilename(urlString);
    const domain = this.extractDomain(urlString);
    return `
  <div class="url-container compact">
    <div class="url-filename tooltip-trigger" data-tooltip="${this.escapeHtml(urlString)}">
      ${this.escapeHtml(filename)}${domain ? ` (${this.escapeHtml(domain)})` : ""}
    </div>
  </div>
`;
  }

  /**
   * Format numeric values with proper alignment and units
   */
  formatNumericValue(value, key) {
    if (value === undefined || value === null) {
      return '<span class="numeric-na">—</span>';
    }
    const numValue = Number.parseFloat(value);
    if (isNaN(numValue)) {
      return '<span class="numeric-na">—</span>';
    }

    // Format based on the type of numeric value
    if (key.toLowerCase().includes("bytes") || key.toLowerCase().includes("size")) {
      return `<span class="numeric-bytes">${this.formatBytes(numValue)}</span>`;
    } else if (key.toLowerCase().includes("time") || key.toLowerCase().includes("ms")) {
      return `<span class="numeric-time">${numValue.toFixed(1)}ms</span>`;
    } else if (key.toLowerCase().includes("savings")) {
      return `<span class="numeric-savings">${this.formatBytes(numValue)}</span>`;
    } else {
      return `<span class="numeric-value">${numValue.toLocaleString()}</span>`;
    }
  }

  /**
   * Format bytes into human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    if (!url) return "";
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return "";
    }
  }

  /**
   * Format source cell with URL and location
   */
  formatSourceCell(source, item) {
    if (!source) {
      return '<div class="unattributed">Unattributed</div>';
    }

    // Handle PSI source object structure
    if (typeof source === "object" && source.url) {
      const filename = this.extractFilename(source.url);
      const domain = this.extractDomain(source.url);
      let html = `
  <div class="url-container compact">
    <div class="url-filename tooltip-trigger" data-tooltip="${this.escapeHtml(source.url || source)}">
      ${this.escapeHtml(filename)}${domain ? ` (${this.escapeHtml(domain)})` : ""}
    </div>
  </div>
`;
      if (source.line !== undefined || source.column !== undefined) {
        const line = source.line || 0;
        const column = source.column || 0;
        html += `<div class="source-location">Line ${line}, Column ${column}</div>`;
      }
      return html;
    }

    // Handle string source
    if (typeof source === "string") {
      const filename = this.extractFilename(source);
      const domain = this.extractDomain(source);
      let html = `
  <div class="url-container compact">
    <div class="url-filename tooltip-trigger" data-tooltip="${this.escapeHtml(source.url || source)}">
      ${this.escapeHtml(filename)}${domain ? ` (${this.escapeHtml(domain)})` : ""}
    </div>
  </div>
`;
      if (item.line !== undefined || item.column !== undefined) {
        const line = item.line || 0;
        const column = item.column || 0;
        html += `<div class="source-location">Line ${line}, Column ${column}</div>`;
      }
      return html;
    }
    return '<div class="unattributed">Unattributed</div>';
  }

  /**
   * Extract filename from URL for cleaner display
   */
  extractFilename(url) {
    if (!url) return "Unknown";
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split("/").pop() || pathname;
      return filename || "Unknown";
    } catch (e) {
      // Handle relative URLs or malformed URLs
      const parts = url.split("/");
      return parts[parts.length - 1] || url;
    }
  }

  /**
   * Format time value with appropriate styling
   */
  formatTimeValue(time) {
    if (time === undefined || time === null) {
      return '<span class="reflow-time low">N/A</span>';
    }
    const numTime = Number.parseFloat(time);
    if (isNaN(numTime)) {
      return '<span class="reflow-time low">N/A</span>';
    }
    let className = "low";
    if (numTime > 50) {
      className = "high";
    } else if (numTime > 16) {
      className = "medium";
    }
    return `<span class="reflow-time ${className}">${numTime.toFixed(2)}ms</span>`;
  }

  /**
   * Format cell value
   */
  formatCellValue(value) {
    if (value === undefined || value === null) {
      return "N/A";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Format insight title
   */
  formatInsightTitle(title) {
    if (!title) return "Performance Insight";

    // Convert kebab-case to title case
    return title.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format table heading
   */
  formatHeading(heading) {
    // Ensure we have a string
    if (!heading) {
      return "Column";
    }
    if (typeof heading !== "string") {
      return String(heading);
    }
    return heading.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()).trim();
  }

  /**
   * Toggle insight expansion
   */
  toggleInsight(item, index) {
    const header = item.querySelector(".insight-header");
    const content = item.querySelector(".insight-content");
    const expandIcon = header.querySelector(".insight-expand-icon");
    const isExpanded = item.classList.contains("expanded");
    if (isExpanded) {
      item.classList.remove("expanded");
      header.classList.remove("expanded");
      header.setAttribute("aria-expanded", "false");
      this.expandedInsights.delete(index);
    } else {
      item.classList.add("expanded");
      header.classList.add("expanded");
      header.setAttribute("aria-expanded", "true");
      this.expandedInsights.add(index);

      // Reinitialize tooltips for newly expanded content
      setTimeout(() => this.initializeTooltips(), 100);
    }
  }

  /**
   * Render empty state
   */
  renderEmptyState(container) {
    const emptyState = document.createElement("div");
    emptyState.className = "psi-insights-empty";
    emptyState.innerHTML = `
            <p>No performance insights available</p>
            <small>Run a PageSpeed Insights analysis to see detailed performance recommendations</small>
        `;
    container.appendChild(emptyState);
  }

  /**
   * Render error state
   */
  renderError(container, error) {
    const errorState = document.createElement("div");
    errorState.className = "psi-insights-error";
    errorState.innerHTML = `
            <p>Failed to load insights</p>
            <small>${this.escapeHtml(error.message || "Unknown error occurred")}</small>
        `;
    container.appendChild(errorState);
  }

  /**
   * Render loading state
   */
  renderLoading(container) {
    const loadingState = document.createElement("div");
    loadingState.className = "psi-insights-loading";
    loadingState.textContent = "Loading insights...";
    container.appendChild(loadingState);
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (typeof text !== "string") return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  processMarkdown(text) {
    if (!text) return "";

    // Convert markdown links [text](url) to HTML links
    return text.replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" class="insight-link" target="_blank">$1</a>');
  }
  getFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split("/").pop();
      return filename || urlObj.hostname;
    } catch {
      return url;
    }
  }
  destroy() {
    if (this.tooltipElement) {
      this.tooltipElement.remove();
    }
  }
}

// Export singleton instance
const insightsRenderer = new InsightsRenderer();

/***/ }),

/***/ 933:
/*!**********************************************!*\
  !*** ./src/popup/displays/header-display.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   updateHeaderDisplay: () => (/* binding */ updateHeaderDisplay)
/* harmony export */ });
/* harmony import */ var _utils_formatters_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/formatters.js */ 993);
/**
 * Module for handling header display in the popup
 */



/**
 * Updates the header display with analysis results
 * @param {Object} headersData - Headers data object
 */
function updateHeaderDisplay(headersData) {
  const headerInfoContainer = document.getElementById("headerInfo");

  // Add margin if no button is present
  if (headerInfoContainer) headerInfoContainer.style.marginTop = "0px";
  const existingEmptyMsg = headerInfoContainer.querySelector(".empty-state-message");
  if (existingEmptyMsg) existingEmptyMsg.remove();
  const allHeaderValueSpans = headerInfoContainer.querySelectorAll(".header-list li .header-value");

  // Reset all headers to default state
  resetHeaderValues(allHeaderValueSpans);
  if (headersData && Object.keys(headersData).length > 0) {
    const hasAnyData = updateHeaderValues(allHeaderValueSpans, headersData);
    if (!hasAnyData) {
      showEmptyHeaderMessage(headerInfoContainer, "All header information is N/A or analysis pending.");
    }
  } else {
    showEmptyHeaderMessage(headerInfoContainer, "No header information available or analysis pending.");
  }
  headerInfoContainer.style.display = "block";
}

/**
 * Resets all header values to default state
 * @param {NodeList} headerValueSpans - All header value span elements
 */
function resetHeaderValues(headerValueSpans) {
  headerValueSpans.forEach(spanElement => {
    spanElement.textContent = "N/A";
    const defaultBgColor = (0,_utils_formatters_js__WEBPACK_IMPORTED_MODULE_0__.getHeaderColor)("", "N/A");
    spanElement.style.backgroundColor = defaultBgColor;
    spanElement.style.color = (0,_utils_formatters_js__WEBPACK_IMPORTED_MODULE_0__.getContrastColor)(defaultBgColor);
    spanElement.style.display = "inline-block";
    if (spanElement.id === "adprovider") {
      spanElement.setAttribute("data-provider", "N/A");
    }
  });
}

/**
 * Updates header values with actual data
 * @param {NodeList} headerValueSpans - All header value span elements
 * @param {Object} headersData - Headers data object
 * @returns {boolean} True if any data was found
 */
function updateHeaderValues(headerValueSpans, headersData) {
  let hasAnyData = false;
  headerValueSpans.forEach(spanElement => {
    const elementId = spanElement.id;
    let headerKeyToLookup = elementId;
    const keyMapping = {
      perfmattersrucss: "perfmattersRUCSS",
      perfmattersdelayjs: "perfmattersDelayJS",
      adprovider: "adProvider"
    };
    if (keyMapping[elementId]) {
      headerKeyToLookup = keyMapping[elementId];
    }
    const value = headersData[headerKeyToLookup];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      spanElement.textContent = String(value);
      hasAnyData = true;
    } else {
      spanElement.textContent = "N/A";
    }
    const bgColor = (0,_utils_formatters_js__WEBPACK_IMPORTED_MODULE_0__.getHeaderColor)(headerKeyToLookup, value);
    spanElement.style.backgroundColor = bgColor;
    spanElement.style.color = (0,_utils_formatters_js__WEBPACK_IMPORTED_MODULE_0__.getContrastColor)(bgColor);
    if (elementId === "adprovider") {
      spanElement.setAttribute("data-provider", value && String(value).trim() !== "" ? String(value) : "N/A");
    }
  });
  return hasAnyData;
}

/**
 * Shows an empty state message
 * @param {HTMLElement} container - The container element
 * @param {string} message - The message to show
 */
function showEmptyHeaderMessage(container, message) {
  if (!container.querySelector(".empty-state-message")) {
    const p = document.createElement("p");
    p.textContent = message;
    p.className = "empty-state-message";
    container.appendChild(p);
  }
}

/***/ }),

/***/ 981:
/*!*********************************************!*\
  !*** ./src/popup/displays/image-display.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   updateImageDisplay: () => (/* binding */ updateImageDisplay)
/* harmony export */ });
/* harmony import */ var _utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/tab-helpers.js */ 607);
/**
 * Module for handling image display in the popup
 */

// Import the simplified helpers


/**
 * Updates the image display with analysis results
 * @param {Array} images - Array of image data
 */
function updateImageDisplay(images) {
  const imageInfo = document.getElementById("imageInfo");
  const imageCountEl = document.getElementById("imageCount");
  const imageList = document.getElementById("imageList");

  // Add margin if no button is present
  if (imageInfo) imageInfo.style.marginTop = "0px";
  const totalImages = images.length;
  imageCountEl.textContent = `Found ${totalImages} preloaded image${totalImages !== 1 ? "s" : ""}`;
  imageList.innerHTML = "";
  if (totalImages === 0) {
    imageInfo.style.display = "block";
    const p = document.createElement("p");
    p.textContent = "No preloaded images detected on this page.";
    p.className = "empty-state-message";
    imageList.appendChild(p);
    return;
  }
  images.forEach(image => {
    const li = createImageListItem(image);
    imageList.appendChild(li);
  });
  imageInfo.style.display = "block";
}

/**
 * Creates a list item for an image
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The created list item
 */
function createImageListItem(image) {
  const li = document.createElement("li");
  li.className = "image-list-item";
  li.style.cursor = "pointer";
  li.title = "Click to highlight this image on the page";

  // Add click handler to highlight image on page
  li.addEventListener("click", async () => {
    // Get the target tab ID (handles detached mode)
    const targetTabId = await window.getTargetTabId();
    if (!targetTabId) {
      console.log("No target tab available for image highlighting");
      (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(li, "error");
      return;
    }

    // Show immediate feedback
    (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.showElementFeedback)(li, "success");
    const response = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_0__.sendMessageToContentScript)(targetTabId, {
      action: "highlightImage",
      imageUrl: image.url
    });
    if (!response) {
      console.log("Failed to highlight image");
    }
  });
  const imgContainer = createImageContainer(image);
  const infoContainer = createImageInfoContainer(image);
  li.appendChild(imgContainer);
  li.appendChild(infoContainer);
  return li;
}

/**
 * Creates the image container with thumbnail
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The image container
 */
function createImageContainer(image) {
  const imgContainer = document.createElement("div");
  imgContainer.className = "img-container";
  const img = document.createElement("img");
  img.alt = image.url.substring(image.url.lastIndexOf("/") + 1);
  img.crossOrigin = "anonymous";
  const fallbackIcon = document.createElement("div");
  fallbackIcon.className = "fallback-icon";
  fallbackIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  img.onload = () => {
    img.style.display = "block";
    fallbackIcon.style.display = "none";
  };
  img.onerror = () => {
    img.style.display = "none";
    fallbackIcon.style.display = "flex";
  };
  img.src = image.url;
  imgContainer.appendChild(img);
  imgContainer.appendChild(fallbackIcon);
  return imgContainer;
}

/**
 * Creates the image info container with details and status indicators
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The info container
 */
function createImageInfoContainer(image) {
  const infoContainer = document.createElement("div");
  infoContainer.className = "info-container";
  const urlSpan = document.createElement("span");
  urlSpan.className = "url";
  urlSpan.textContent = image.url;
  infoContainer.appendChild(urlSpan);
  const detailsSpan = createImageDetailsSpan(image);
  infoContainer.appendChild(detailsSpan);
  const statusContainer = createImageStatusContainer(image);
  infoContainer.appendChild(statusContainer);
  return infoContainer;
}

/**
 * Creates the details span for an image
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The details span
 */
function createImageDetailsSpan(image) {
  var _image$dimensions;
  const detailsSpan = document.createElement("span");
  detailsSpan.className = "details";
  const details = [];

  // Add enhanced details
  if (image.aboveFold !== undefined) {
    details.push(image.aboveFold ? "Above fold" : "Below fold");
  }
  if (image.format) details.push(`Format: ${image.format}`);
  if (image.fileSizeFormatted) details.push(`Size: ${image.fileSizeFormatted}`);
  if ((_image$dimensions = image.dimensions) !== null && _image$dimensions !== void 0 && _image$dimensions.displayed) {
    details.push(`${image.dimensions.displayed.width}×${image.dimensions.displayed.height}px`);
  }
  if (image.type) details.push(`Type: ${image.type}`);
  if (image.loading && image.loading !== "auto") details.push(`Loading: ${image.loading}`);
  detailsSpan.textContent = details.length > 0 ? details.join(" | ") : "No additional details";
  return detailsSpan;
}

/**
 * Creates the status container with status indicators
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The status container
 */
function createImageStatusContainer(image) {
  const statusContainer = document.createElement("div");
  statusContainer.className = "status-container";

  // Early Hints indicator (highest priority)
  if (image.earlyHints) {
    const earlyHintsSticker = document.createElement("span");
    earlyHintsSticker.textContent = "EARLY HINTS";
    earlyHintsSticker.className = "status-sticker early-hints";
    statusContainer.appendChild(earlyHintsSticker);
  }

  // Critical Path indicator (most important)
  if (image.isCritical !== undefined) {
    const criticalSticker = document.createElement("span");
    criticalSticker.textContent = image.isCritical ? "CRITICAL PATH" : "NON-CRITICAL";
    criticalSticker.className = image.isCritical ? "status-sticker critical-path" : "status-sticker non-critical";
    statusContainer.appendChild(criticalSticker);
  }

  // Above/Below fold indicator
  if (image.aboveFold !== undefined) {
    const foldSticker = document.createElement("span");
    foldSticker.textContent = image.aboveFold ? "ABOVE FOLD" : "BELOW FOLD";
    foldSticker.className = image.aboveFold ? "status-sticker above-fold" : "status-sticker below-fold";
    statusContainer.appendChild(foldSticker);
  }
  return statusContainer;
}

/***/ }),

/***/ 993:
/*!*********************************!*\
  !*** ./src/utils/formatters.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   formatFileSize: () => (/* binding */ formatFileSize),
/* harmony export */   getContrastColor: () => (/* binding */ getContrastColor),
/* harmony export */   getHeaderColor: () => (/* binding */ getHeaderColor)
/* harmony export */ });
/**
 * Formats a file size in bytes to a human-readable string
 * @param {number} bytes - The size in bytes
 * @returns {string} Formatted size string (e.g., "1.5 KB")
 */
function formatFileSize(bytes) {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Gets the appropriate background color for a header value
 * @param {string} headerKey - The header key
 * @param {string} value - The header value
 * @returns {string} CSS color value
 */
function getHeaderColor(headerKey, value) {
  const lowerValue = typeof value === "string" ? value.toLowerCase().trim() : "n/a";
  const saneKey = typeof headerKey === "string" ? headerKey.toLowerCase().replace(/-/g, "") : "";
  switch (saneKey) {
    case "xbigscootscachestatus":
    case "cfcachestatus":
      return getCacheStatusColor(lowerValue);
    case "xbigscootscacheplan":
      return getCachePlanColor(lowerValue);
    case "xbigscootscachemode":
    case "xbigscootscachemodeo2o":
      return getEnabledDisabledColor(lowerValue === "enabled" || lowerValue === "true", lowerValue === "n/a");
    case "xezoiccdn":
      if (lowerValue === "hit") return "var(--success-bg-strong)";
      if (lowerValue === "n/a" || lowerValue === "") return "var(--neutral-bg)";
      return "var(--error-bg-strong)";
    case "xnpcfe":
      if (lowerValue && lowerValue !== "n/a" && lowerValue !== "disabled" && lowerValue !== "inactive") return "var(--success-bg-strong)";
      if (lowerValue === "n/a" || lowerValue === "") return "var(--neutral-bg)";
      return "var(--error-bg-strong)";
    case "perfmattersrucss":
    case "perfmattersdelayjs":
      return getEnabledDisabledColor(lowerValue === "enabled", lowerValue === "n/a");
    case "xhostedby":
      return lowerValue && lowerValue !== "n/a" && lowerValue.trim() !== "" ? "var(--info-bg-strong)" : "var(--neutral-bg)";
    case "contentencoding":
      return lowerValue && lowerValue !== "n/a" && lowerValue.trim() !== "" ? "var(--info-bg-strong)" : "var(--neutral-bg)";
    case "gtm":
    case "ua":
    case "ga4":
    case "ga":
      return lowerValue && lowerValue !== "n/a" && lowerValue.trim() !== "" ? "var(--warning-bg-strong)" : "var(--neutral-bg)";
    case "adprovider":
      if (lowerValue === "none detected" || lowerValue === "n/a" || lowerValue === "") return "var(--neutral-bg)";
      return "var(--success-bg-strong)";
    default:
      return "var(--neutral-bg)";
  }
}

/**
 * Gets the color for a cache status value
 * @param {string} status - The cache status
 * @returns {string} CSS color value
 */
function getCacheStatusColor(status) {
  switch (status) {
    case "hit":
      return "var(--success-bg-strong)";
    case "miss":
      return "var(--error-bg-strong)";
    case "bypass":
      return "var(--warning-bg-strong)";
    case "dynamic":
      return "var(--info-bg-strong)";
    default:
      return "var(--neutral-bg)";
  }
}

/**
 * Gets the color for a cache plan value
 * @param {string} plan - The cache plan
 * @returns {string} CSS color value
 */
function getCachePlanColor(plan) {
  switch (plan) {
    case "standard":
      return "var(--plan-standard-bg)";
    case "performance+":
      return "var(--plan-performance-plus-bg)";
    default:
      return "var(--neutral-bg)";
  }
}

/**
 * Gets the color for enabled/disabled status
 * @param {boolean} isEnabled - Whether the feature is enabled
 * @param {boolean} isNA - Whether the value is N/A
 * @returns {string} CSS color value
 */
function getEnabledDisabledColor(isEnabled, isNA = false) {
  if (isNA) return "var(--neutral-bg)";
  return isEnabled ? "var(--success-bg-strong)" : "var(--error-bg-strong)";
}

/**
 * Gets the appropriate text color for a background color
 * @param {string} bgColorHexOrVar - The background color
 * @returns {string} CSS color value for text
 */
function getContrastColor(bgColorHexOrVar) {
  let hexColor = bgColorHexOrVar;
  if (hexColor.startsWith("var(--")) {
    const varName = hexColor.match(/--([a-zA-Z0-9-]+)/)[0];
    hexColor = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  if (!hexColor || !hexColor.startsWith("#")) return "var(--text-primary)";
  hexColor = hexColor.slice(1);
  let r, g, b;
  if (hexColor.length === 3) {
    r = Number.parseInt(hexColor[0] + hexColor[0], 16);
    g = Number.parseInt(hexColor[1] + hexColor[1], 16);
    b = Number.parseInt(hexColor[2] + hexColor[2], 16);
  } else if (hexColor.length === 6) {
    r = Number.parseInt(hexColor.substr(0, 2), 16);
    g = Number.parseInt(hexColor.substr(2, 2), 16);
    b = Number.parseInt(hexColor.substr(4, 2), 16);
  } else {
    return "var(--text-primary)";
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "var(--text-primary)";
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  if (bgColorHexOrVar.includes("-strong") || bgColorHexOrVar === "var(--plan-performance-plus-bg)") {
    return "#ffffff";
  }
  if (bgColorHexOrVar === "var(--plan-standard-bg)") return "var(--text-primary)";
  return yiq >= 145 ? "var(--text-primary)" : "#ffffff";
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
/*!****************************!*\
  !*** ./src/popup/index.js ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _displays_image_display_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./displays/image-display.js */ 981);
/* harmony import */ var _displays_font_display_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./displays/font-display.js */ 333);
/* harmony import */ var _displays_header_display_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./displays/header-display.js */ 933);
/* harmony import */ var _displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./displays/insights-display.js */ 789);
/* harmony import */ var _tab_manager_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./tab-manager.js */ 378);
/* harmony import */ var _toggle_manager_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./toggle-manager.js */ 153);
/* harmony import */ var _window_state_manager_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./window-state-manager.js */ 534);
/* harmony import */ var _utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/tab-helpers.js */ 607);
/**
 * Main popup script for the BigScoots Performance Debugger extension - Enhanced PSI support
 */

console.log("=== POPUP STARTING ===");
console.log("DOM readyState:", document.readyState);
console.log("Chrome API available:", typeof window.chrome !== "undefined");
console.log("Window location:", window.location.href);

// Import display modules





// Import management modules




// Import the tab helpers

console.log("All modules imported successfully");

// Declare chrome variable

/**
 * Tab configuration
 */
const TABS = [{
  id: "imageAnalyzerTab",
  contentId: "imageAnalyzerContent"
}, {
  id: "fontAnalyzerTab",
  contentId: "fontAnalyzerContent"
}, {
  id: "headerAnalyzerTab",
  contentId: "headerAnalyzerContent"
}, {
  id: "insightsTab",
  contentId: "insightsContent"
}, {
  id: "perfmattersDebugTab",
  contentId: "perfmattersDebugContent"
}];
console.log("Testing tab elements...");
TABS.forEach(tab => {
  const tabEl = document.getElementById(tab.id);
  const contentEl = document.getElementById(tab.contentId);
  console.log(`Tab ${tab.id}:`, !!tabEl, "Content:", !!contentEl);
});

// Store for cached data to persist across refreshes
let cachedAnalysisData = null;
let isDetachedMode = false;
let boundTabId = null; // The tab this detached window is bound to
let boundTabUrl = null; // The URL of the bound tab
let pollingInterval = null;

/**
 * Sends a message to content script with retry logic and better error handling
 * @param {number} tabId - Tab ID to send message to
 * @param {Object} message - Message to send
 * @param {Function} callback - Callback function
 * @param {number} retries - Number of retries remaining
 */
function sendMessageWithRetry(tabId, message, callback, retries = 3) {
  console.log(`Sending message to tab ${tabId}:`, message.action, `(${retries} retries left)`);
  chrome.tabs.sendMessage(tabId, message, response => {
    if (chrome.runtime.lastError) {
      const errorMsg = chrome.runtime.lastError.message;
      console.error(`Message to tab ${tabId} failed:`, errorMsg);

      // Check if it's a "receiving end does not exist" error
      if (errorMsg.includes("Receiving end does not exist") && retries > 0) {
        console.log(`Content script not ready, retrying in 1s... (${retries} retries left)`);
        setTimeout(() => {
          sendMessageWithRetry(tabId, message, callback, retries - 1);
        }, 1000);
        return;
      }
      console.log(`Message failed after retries: ${errorMsg}`);
      if (callback) callback(null);
      return;
    }
    console.log(`Message to tab ${tabId} successful, response:`, response);
    if (callback) callback(response);
  });
}

/**
 * Verifies content script is injected and ready
 * @param {number} tabId - Tab ID to check
 * @returns {Promise<boolean>} True if content script is ready
 */
async function verifyContentScriptReady(tabId) {
  console.log(`Verifying content script readiness for tab ${tabId}`);
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, {
      action: "ping"
    }, response => {
      if (chrome.runtime.lastError) {
        console.log(`Content script not ready for tab ${tabId}:`, chrome.runtime.lastError.message);
        resolve(false);
      } else {
        console.log(`Content script is ready for tab ${tabId}`);
        resolve(true);
      }
    });
  });
}

/**
 * Gets the correct tab ID for messaging, handling detached mode
 * @returns {Promise<number|null>} Tab ID or null if not available
 */
async function getTargetTabIdForMessaging() {
  // Use the improved getTargetTabId function that auto-detects mode
  const tabId = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_7__.getTargetTabId)();
  console.log("Target tab ID for messaging:", tabId);
  return tabId;
}

/**
 * Initializes detached mode binding
 */
async function initializeDetachedMode() {
  console.log("Initializing detached mode...");

  // Get original tab ID from URL
  const originalTabId = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_7__.getOriginalTabIdFromUrl)();
  console.log("Original tab ID from URL:", originalTabId);
  if (!originalTabId) {
    console.error("No original tab ID found in detached mode");
    return false;
  }

  // Verify the tab still exists
  const tabExists = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_7__.verifyTabExists)(originalTabId);
  if (!tabExists) {
    console.error("Original tab no longer exists:", originalTabId);
    return false;
  }

  // Set the bound tab ID
  boundTabId = originalTabId;
  console.log("Detached mode: successfully bound to tab", boundTabId);

  // Get and store the tab URL
  try {
    const response = await new Promise(resolve => {
      chrome.runtime.sendMessage({
        action: "getTabUrl",
        tabId: boundTabId
      }, response => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          resolve(response);
        }
      });
    });
    if (response.success) {
      boundTabUrl = response.url;
      console.log("Bound tab URL:", boundTabUrl);
      updateCurrentUrlDisplay(boundTabUrl);
    }
  } catch (error) {
    console.error("Error getting bound tab URL:", error);
  }
  return true;
}

/**
 * Updates the current URL display in the header
 * @param {string} url - The URL to display
 */
function updateCurrentUrlDisplay(url) {
  console.log("Updating URL display:", url);
  const currentUrlElement = document.getElementById("currentUrl");
  const currentUrlValue = document.getElementById("currentUrlValue");
  if (currentUrlElement && currentUrlValue && url) {
    // Clean up the URL for display
    let displayUrl = url;
    try {
      const urlObj = new URL(url);

      // Get hostname and pathname
      displayUrl = urlObj.hostname;

      // Add pathname but remove trailing slash
      let pathname = urlObj.pathname;
      if (pathname !== "/" && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
      }

      // Only add pathname if it's not just "/"
      if (pathname !== "/") {
        displayUrl += pathname;
      }

      // Add search params if present
      if (urlObj.search) {
        displayUrl += urlObj.search;
      }
    } catch (error) {
      // If URL parsing fails, use the original URL
      // Still try to remove trailing slash
      if (displayUrl.endsWith("/") && displayUrl.length > 1) {
        displayUrl = displayUrl.slice(0, -1);
      }
    }
    currentUrlValue.textContent = displayUrl;
    currentUrlElement.classList.add("visible");

    // Store the bound tab URL in detached mode
    if (isDetachedMode) {
      boundTabUrl = url;
    }
  } else if (currentUrlElement) {
    currentUrlElement.classList.remove("visible");
  }
}

/**
 * Updates the popup with analysis results
 */
async function updatePopupWithResults() {
  console.log("=== updatePopupWithResults called ===");
  try {
    // Show loading state - but don't fail if this doesn't work
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.resetDataAvailability)();
  } catch (error) {
    console.log("Could not update loading state:", error);
  }

  // Reset data availability when updating popup (new page/refresh)
  (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.resetDataAvailability)();

  // Clear any existing data displays immediately
  showEmptyStates();
  try {
    if (isDetachedMode) {
      console.log("Running in detached mode");
      if (!boundTabId) {
        console.error("No bound tab ID in detached mode");
        showEmptyStates();
        updateCurrentUrlDisplay("Tab not available");
        return;
      }

      // Get analysis results for the bound tab
      console.log("Requesting analysis results for bound tab:", boundTabId);
      chrome.runtime.sendMessage({
        action: "getAnalysisResults",
        tabId: boundTabId
      }, data => {
        if (chrome.runtime.lastError) {
          console.log("Error getting analysis results:", chrome.runtime.lastError);
          return;
        }
        console.log("Analysis results received for bound tab:", data);
        if (data && Object.keys(data).length > 0) {
          // Verify the data is for the current URL
          if (boundTabUrl && data.url && data.url !== boundTabUrl) {
            console.log("Analysis data is for different URL, ignoring:", data.url, "vs", boundTabUrl);
            showEmptyStates();
            return;
          }
          console.log("Displaying analysis data for bound tab");
          cachedAnalysisData = data;
          displayAnalysisData(data);

          // Also update performance metrics from cached data
          updatePerformanceMetricsFromData(data);
        } else {
          console.log("No analysis data available for bound tab, requesting fresh analysis");
          sendMessageWithRetry(boundTabId, {
            action: "requestAnalysis"
          }, response => {
            if (response) {
              console.log("Fresh analysis requested successfully");
            }
          });
        }
      });

      // Get stored PSI results for the bound tab
      chrome.runtime.sendMessage({
        action: "getPSIResults",
        tabId: boundTabId
      }, psiData => {
        if (chrome.runtime.lastError) {
          console.log("Error getting PSI results:", chrome.runtime.lastError);
          return;
        }
        if (psiData && (psiData.allFieldData || psiData.allLabData)) {
          // Verify PSI data is for current URL
          if (boundTabUrl && psiData.url && psiData.url !== boundTabUrl) {
            console.log("PSI data is for different URL, ignoring:", psiData.url, "vs", boundTabUrl);
            return;
          }
          console.log("Restoring PSI data from storage:", psiData);

          // Restore field data
          if (psiData.allFieldData) {
            restorePSIFieldData(psiData.allFieldData);
          }

          // Restore lab data
          if (psiData.allLabData) {
            restorePSILabData(psiData.allLabData);
          }

          // NEW: Restore PSI insights data for detached mode
          if (psiData.completeData) {
            console.log("Restoring PSI insights from storage in detached mode");
            (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.handleCompletePSIResults)(psiData.completeData);
          }
          (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSIStatus)({
            status: "success",
            message: "PSI data restored"
          });
        }
      });

      // Get current performance data with better error handling
      console.log("Requesting current performance data for bound tab:", boundTabId);
      sendMessageWithRetry(boundTabId, {
        action: "getCurrentPerformanceData"
      }, response => {
        if (response) {
          console.log("Fresh performance data received:", response);
          updatePerformanceMetrics(response);

          // Merge with cached data if available
          if (cachedAnalysisData) {
            const mergedData = {
              cls: response.cls || cachedAnalysisData.cls,
              lcp: response.lcp || cachedAnalysisData.lcp,
              inp: response.inp || cachedAnalysisData.inp,
              additionalMetrics: response.additionalMetrics || cachedAnalysisData.additionalMetrics
            };
            updatePerformanceMetrics(mergedData);
          }
        } else {
          console.log("No fresh performance data, using cached data if available");
          if (cachedAnalysisData) {
            updatePerformanceMetricsFromData(cachedAnalysisData);
          }
        }
      });
      return;
    }

    // Attached mode logic
    console.log("Running in attached mode");
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, activeTabs => {
      if (chrome.runtime.lastError || !activeTabs || activeTabs.length === 0) {
        console.log("No active tabs found in attached mode");
        showEmptyStates();
        return;
      }
      const currentTabId = activeTabs[0].id;
      const currentTab = activeTabs[0];
      console.log("Current tab ID:", currentTabId, "URL:", currentTab.url);

      // Update URL display
      if (currentTab.url) {
        updateCurrentUrlDisplay(currentTab.url);
      }

      // Query stored analysis results from background script
      console.log("Requesting analysis results for tab:", currentTabId);
      chrome.runtime.sendMessage({
        action: "getAnalysisResults",
        tabId: currentTabId
      }, data => {
        if (chrome.runtime.lastError) {
          console.log("Error getting analysis results:", chrome.runtime.lastError);
          return;
        }
        console.log("Analysis results received for tab", currentTabId, ":", data);
        if (data && Object.keys(data).length > 0) {
          // Verify the data is for the current URL
          if (currentTab.url && data.url && data.url !== currentTab.url) {
            console.log("Analysis data is for different URL, ignoring:", data.url, "vs", currentTab.url);
            showEmptyStates();
            // Request fresh analysis for current URL
            chrome.tabs.sendMessage(currentTabId, {
              action: "requestAnalysis"
            }, response => {
              if (chrome.runtime.lastError) {
                console.log("Content script not ready yet:", chrome.runtime.lastError);
              }
            });
            return;
          }
          console.log("Received analysis data for current tab - displaying now");
          cachedAnalysisData = data;
          displayAnalysisData(data);

          // Also update performance metrics from cached data
          updatePerformanceMetricsFromData(data);
        } else {
          console.log("No analysis data available, requesting fresh analysis");
          chrome.tabs.sendMessage(currentTabId, {
            action: "requestAnalysis"
          }, response => {
            if (chrome.runtime.lastError) {
              console.log("Content script not ready yet:", chrome.runtime.lastError);
            } else {
              console.log("Fresh analysis requested");
            }
          });
        }
      });

      // Get stored PSI results for the current tab
      chrome.runtime.sendMessage({
        action: "getPSIResults",
        tabId: currentTabId
      }, psiData => {
        if (chrome.runtime.lastError) {
          console.log("Error getting PSI results:", chrome.runtime.lastError);
          return;
        }
        if (psiData && (psiData.allFieldData || psiData.allLabData)) {
          // Verify PSI data is for current URL
          if (currentTab.url && psiData.url && psiData.url !== currentTab.url) {
            console.log("PSI data is for different URL, ignoring:", psiData.url, "vs", currentTab.url);
            return;
          }
          console.log("Restoring PSI data from storage:", psiData);

          // Restore field data
          if (psiData.allFieldData) {
            restorePSIFieldData(psiData.allFieldData);
          }

          // Restore lab data
          if (psiData.allLabData) {
            restorePSILabData(psiData.allLabData);
          }

          // NEW: Restore PSI insights data
          if (psiData.completeData) {
            console.log("Restoring PSI insights from storage");
            (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.handleCompletePSIResults)(psiData.completeData);
          }
          (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSIStatus)({
            status: "success",
            message: "PSI data restored"
          });
        }
      });

      // Query content script for current performance data
      console.log("Requesting current performance data for tab:", currentTabId);
      chrome.tabs.sendMessage(currentTabId, {
        action: "getCurrentPerformanceData"
      }, response => {
        if (chrome.runtime.lastError) {
          console.log("Content script message error:", chrome.runtime.lastError);

          // If we have cached performance data, use it
          if (cachedAnalysisData) {
            console.log("Using cached performance data from analysis results");
            updatePerformanceMetricsFromData(cachedAnalysisData);
          }
          return;
        }
        console.log("Performance data received:", response);
        if (response) {
          updatePerformanceMetrics(response);
        } else {
          console.log("No fresh performance data, using cached data if available");
          if (cachedAnalysisData) {
            updatePerformanceMetricsFromData(cachedAnalysisData);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error updating popup with results:", error);

    // Update error state
    try {
      const {
        updateInsightsState
      } = await Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./displays/insights-display.js */ 789));
      updateInsightsState({
        isLoading: false,
        hasError: true,
        errorMessage: "Failed to load performance data. Please refresh the page and try again."
      });
    } catch (importError) {
      console.error("Could not update error state:", importError);
    }
    showEmptyStates();
  }
}

/**
 * Updates performance metrics from cached analysis data
 * @param {Object} data - Cached analysis data
 */
function updatePerformanceMetricsFromData(data) {
  console.log("=== updatePerformanceMetricsFromData called ===");
  console.log("Using cached data for performance metrics:", data);
  if (data.cls) {
    console.log("Updating CLS from cached data:", data.cls);
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateCLSDisplay)(data.cls);
  }
  if (data.lcp) {
    console.log("Updating LCP from cached data:", data.lcp);
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateLCPDisplay)(data.lcp);
  }
  if (data.inp) {
    console.log("Updating INP from cached data:", data.inp);
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateINPDisplay)(data.inp);
  }
  if (data.additionalMetrics) {
    console.log("Updating TTFB from cached data:", data.additionalMetrics);
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateTTFBDisplay)(data.additionalMetrics);
  }
}

/**
 * Restores PSI field data for all metrics
 * @param {Object} allFieldData - All PSI field data
 */
function restorePSIFieldData(allFieldData) {
  console.log("Restoring PSI field data:", allFieldData);
  if (allFieldData.cls) {
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSICLSDisplay)(allFieldData.cls);
  }
  if (allFieldData.lcp) {
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSILCPDisplay)(allFieldData.lcp);
  }
  if (allFieldData.inp) {
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSIINPDisplay)(allFieldData.inp);
  }
  if (allFieldData.ttfb) {
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSITTFBDisplay)(allFieldData.ttfb);
  }
}

/**
 * Restores PSI lab data for all metrics
 * @param {Object} allLabData - All PSI lab data
 */
function restorePSILabData(allLabData) {
  console.log("Restoring PSI lab data:", allLabData);
  if (allLabData.labCLS) {
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSILabCLSDisplay)(allLabData.labCLS);
  }
  if (allLabData.labLCP) {
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSILabLCPDisplay)(allLabData.labLCP);
  }
}

/**
 * Displays analysis data in the UI
 * @param {Object} data - Analysis data to display
 */
function displayAnalysisData(data) {
  console.log("=== displayAnalysisData called ===");
  console.log("Data received:", data);
  if (data.images) {
    console.log("Updating images:", data.images.length);
    (0,_displays_image_display_js__WEBPACK_IMPORTED_MODULE_0__.updateImageDisplay)(data.images);
  } else {
    console.log("No images data, showing empty state");
    (0,_displays_image_display_js__WEBPACK_IMPORTED_MODULE_0__.updateImageDisplay)([]);
  }
  if (data.fonts) {
    console.log("Updating fonts:", data.fonts.length);
    (0,_displays_font_display_js__WEBPACK_IMPORTED_MODULE_1__.updateFontDisplay)(data.fonts);
  } else {
    console.log("No fonts data, showing empty state");
    (0,_displays_font_display_js__WEBPACK_IMPORTED_MODULE_1__.updateFontDisplay)([]);
  }
  if (data.headers) {
    console.log("Updating headers");
    (0,_displays_header_display_js__WEBPACK_IMPORTED_MODULE_2__.updateHeaderDisplay)(data.headers);
  } else {
    console.log("No headers data, showing empty state");
    (0,_displays_header_display_js__WEBPACK_IMPORTED_MODULE_2__.updateHeaderDisplay)({});
  }
  console.log("Updating insights display");
  (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateInsightsDisplay)(data);
}

/**
 * Updates performance metrics
 * @param {Object} response - Performance data response
 */
function updatePerformanceMetrics(response) {
  console.log("=== updatePerformanceMetrics called ===");
  console.log("Performance data:", response);
  if (response.cls) {
    console.log("Updating CLS display with fresh data");
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateCLSDisplay)(response.cls);
  }
  if (response.lcp) {
    console.log("Updating LCP display with fresh data");
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateLCPDisplay)(response.lcp);
  }
  if (response.inp) {
    console.log("Updating INP display with fresh data");
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateINPDisplay)(response.inp);
  }
  if (response.additionalMetrics) {
    console.log("Updating TTFB display with fresh data");
    (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateTTFBDisplay)(response.additionalMetrics);
  }
}

/**
 * Shows empty states for all displays
 */
function showEmptyStates() {
  console.log("=== Setting empty states ===");
  (0,_displays_image_display_js__WEBPACK_IMPORTED_MODULE_0__.updateImageDisplay)([]);
  (0,_displays_font_display_js__WEBPACK_IMPORTED_MODULE_1__.updateFontDisplay)([]);
  (0,_displays_header_display_js__WEBPACK_IMPORTED_MODULE_2__.updateHeaderDisplay)({});
  (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateInsightsDisplay)({});
}

/**
 * Sets up periodic polling for performance data
 */
function setupPeriodicPolling() {
  console.log("Setting up periodic polling");

  // Clear existing interval if any
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  pollingInterval = setInterval(async () => {
    if (!isDetachedMode) {
      return;
    }
    if (boundTabId) {
      const tabExists = await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_7__.verifyTabExists)(boundTabId);
      if (!tabExists) {
        console.log("Bound tab no longer exists:", boundTabId);
        showEmptyStates();
        updateCurrentUrlDisplay("Tab closed or unavailable");

        // Clear the interval since tab is gone
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        return;
      }
      chrome.tabs.sendMessage(boundTabId, {
        action: "getCurrentPerformanceData"
      }, response => {
        if (chrome.runtime.lastError) {
          console.log("Error polling bound tab:", chrome.runtime.lastError);
          return;
        }
        if (response) {
          updatePerformanceMetrics(response);
        }
      });
    }
  }, 3000); // Increased from 2000ms to 3000ms for better performance
}

// Add cleanup when window is closed
window.addEventListener("beforeunload", () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
});

/**
 * Sets up message listeners for updates from content script
 */
function setupMessageListeners() {
  console.log("Setting up message listeners");
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Popup received message:", message.action, "from sender:", sender);

    // In detached mode, only process messages from the bound tab
    if (isDetachedMode && boundTabId) {
      if (sender.tab && sender.tab.id !== boundTabId) {
        console.log("Ignoring message from non-bound tab:", sender.tab.id, "bound to:", boundTabId);
        return;
      }

      // Special handling for tab URL changes
      if (message.action === "tabUrlChanged" && message.tabId === boundTabId) {
        console.log("Bound tab URL changed:", message.url);
        updateCurrentUrlDisplay(message.url);
      }
    }

    // Process performance updates
    if (message.action === "updateCLS") {
      console.log("Received CLS update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateCLSDisplay)(message);
    } else if (message.action === "updateLCP") {
      console.log("Received LCP update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateLCPDisplay)(message);
    } else if (message.action === "updateINP") {
      console.log("Received INP update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateINPDisplay)(message);
    } else if (message.action === "updateAdditionalMetrics") {
      console.log("Received additional metrics update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updateTTFBDisplay)(message.metrics);
    } else if (message.action === "analysisResults") {
      // Only process analysis results from the bound tab in detached mode
      if (isDetachedMode && boundTabId) {
        if (sender.tab && sender.tab.id === boundTabId) {
          console.log("Received fresh analysis results from bound tab");
          cachedAnalysisData = message;
          displayAnalysisData(message);
          // Also update performance metrics
          updatePerformanceMetricsFromData(message);
        }
      } else if (!isDetachedMode) {
        // In attached mode, process all analysis results
        console.log("Received fresh analysis results in attached mode");
        cachedAnalysisData = message;
        displayAnalysisData(message);
        // Also update performance metrics
        updatePerformanceMetricsFromData(message);
      }
    }
    // Enhanced PSI message handling
    else if (message.action === "updatePSICLS") {
      console.log("Received PSI CLS update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSICLSDisplay)(message.fieldData);
    } else if (message.action === "updatePSILCP") {
      console.log("Received PSI LCP update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSILCPDisplay)(message.fieldData);
    } else if (message.action === "updatePSIINP") {
      console.log("Received PSI INP update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSIINPDisplay)(message.fieldData);
    } else if (message.action === "updatePSITTFB") {
      console.log("Received PSI TTFB update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSITTFBDisplay)(message.fieldData);
    } else if (message.action === "updatePSILabCLS") {
      console.log("Received PSI Lab CLS update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSILabCLSDisplay)(message.labData);
    } else if (message.action === "updatePSILabLCP") {
      console.log("Received PSI Lab LCP update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSILabLCPDisplay)(message.labData);
    } else if (message.action === "updatePSIStatus") {
      console.log("Received PSI status update");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.updatePSIStatus)(message);
    } else if (message.action === "completePSIResults") {
      console.log("Received complete PSI results for insights");
      (0,_displays_insights_display_js__WEBPACK_IMPORTED_MODULE_3__.handleCompletePSIResults)(message.psiData);
    }
  });
}

/**
 * Sets up the detach/attach button functionality
 */
async function setupWindowControls() {
  console.log("Setting up window controls");
  const windowControlsContainer = document.querySelector(".window-controls");
  if (!windowControlsContainer) {
    console.log("Window controls container not found");
    return;
  }

  // Detect if we're in detached mode
  isDetachedMode = await (0,_window_state_manager_js__WEBPACK_IMPORTED_MODULE_6__.isDetachedWindow)();
  console.log("Window mode detected:", isDetachedMode ? "detached" : "attached");

  // Apply detached mode styles if needed
  (0,_window_state_manager_js__WEBPACK_IMPORTED_MODULE_6__.applyDetachedModeStyles)(isDetachedMode);
  const button = windowControlsContainer.querySelector(".window-toggle-btn");
  if (button) {
    // Update button icon and tooltip based on current state
    (0,_window_state_manager_js__WEBPACK_IMPORTED_MODULE_6__.updateWindowControlButton)(isDetachedMode, button);

    // Add click handler
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        if (isDetachedMode) {
          await (0,_window_state_manager_js__WEBPACK_IMPORTED_MODULE_6__.attachPopup)();
        } else {
          await (0,_window_state_manager_js__WEBPACK_IMPORTED_MODULE_6__.detachPopup)();
        }
      } catch (error) {
        console.error("Error toggling window state:", error);
      } finally {
        button.disabled = false;
      }
    });
  }
}

/**
 * Sets up resize handling for detached mode
 */
function setupResizeHandling() {
  if (isDetachedMode) {
    window.addEventListener("resize", () => {
      // Reapply detached mode styles on resize
      (0,_window_state_manager_js__WEBPACK_IMPORTED_MODULE_6__.applyDetachedModeStyles)(true);
    });
  }
}

/**
 * Refreshes toggle states when popup loads or mode changes
 */
async function refreshToggleStates() {
  try {
    // Get the target tab ID
    const targetTabId = await getTargetTabIdForMessaging();
    if (!targetTabId) {
      console.log("No target tab available for refreshing toggle states");
      return;
    }
    console.log("Refreshing toggle states for tab:", targetTabId);

    // Get current parameters for this tab
    chrome.runtime.sendMessage({
      action: "getParameters",
      tabId: targetTabId
    }, parameters => {
      if (chrome.runtime.lastError) {
        console.error("Error getting parameters for refresh:", chrome.runtime.lastError);
        return;
      }

      // Ensure parameters is an array
      if (!Array.isArray(parameters)) {
        parameters = [];
      }
      console.log("Refreshed parameters for tab", targetTabId, ":", parameters);

      // Update toggle states
      const perfmattersoff = document.getElementById("perfmattersoff");
      const perfmatterscssoff = document.getElementById("perfmatterscssoff");
      const perfmattersjsoff = document.getElementById("perfmattersjsoff");
      const nocache = document.getElementById("nocache");
      if (perfmattersoff) perfmattersoff.checked = parameters.includes("perfmattersoff");
      if (perfmatterscssoff) perfmatterscssoff.checked = parameters.includes("perfmatterscssoff");
      if (perfmattersjsoff) perfmattersjsoff.checked = parameters.includes("perfmattersjsoff");
      if (nocache) nocache.checked = parameters.includes("nocache");

      // Update toggle dependencies
      if (window.updateToggleStates) {
        window.updateToggleStates(true);
      }
    });
  } catch (error) {
    console.error("Error refreshing toggle states:", error);
  }
}

/**
 * Initializes the popup when DOM is loaded
 */
async function initializePopup() {
  try {
    console.log("=== STARTING POPUP INITIALIZATION ===");

    // Add debug logging
    console.log("DOM elements check:");
    TABS.forEach(tab => {
      const tabEl = document.getElementById(tab.id);
      const contentEl = document.getElementById(tab.contentId);
      console.log(`Tab ${tab.id}:`, !!tabEl, "Content:", !!contentEl);
      if (!tabEl) console.error(`Missing tab element: ${tab.id}`);
      if (!contentEl) console.error(`Missing content element: ${tab.contentId}`);
    });

    // Detect mode first
    isDetachedMode = await (0,_window_state_manager_js__WEBPACK_IMPORTED_MODULE_6__.isDetachedWindow)();
    console.log("Initializing popup in mode:", isDetachedMode ? "detached" : "attached");

    // Initialize detached mode if needed
    if (isDetachedMode) {
      const success = await initializeDetachedMode();
      if (!success) {
        console.error("Failed to initialize detached mode");
        showEmptyStates();
        return;
      }
    }

    // Make helper function globally available with the correct signature
    window.getTargetTabId = async () => {
      return await (0,_utils_tab_helpers_js__WEBPACK_IMPORTED_MODULE_7__.getTargetTabId)();
    };

    // Set up tab switching FIRST
    console.log("Setting up tab switching...");
    (0,_tab_manager_js__WEBPACK_IMPORTED_MODULE_4__.setupTabSwitching)(TABS);

    // Set up toggle management
    console.log("Setting up toggle management...");
    (0,_toggle_manager_js__WEBPACK_IMPORTED_MODULE_5__.setupToggleManagement)();

    // Make updateToggleStates globally available for refresh
    const toggleManagerModule = await Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./toggle-manager.js */ 153));
    if (toggleManagerModule.updateToggleStates) {
      window.updateToggleStates = toggleManagerModule.updateToggleStates;
    }

    // Set up window controls
    console.log("Setting up window controls...");
    await setupWindowControls();

    // Set up resize handling for detached mode
    setupResizeHandling();

    // Set up message listeners BEFORE updating popup
    console.log("Setting up message listeners...");
    setupMessageListeners();

    // Update popup with initial results
    console.log("Updating popup with initial results...");
    await updatePopupWithResults();

    // Refresh toggle states after everything is loaded
    console.log("Refreshing toggle states...");
    await refreshToggleStates();

    // Set up periodic polling
    console.log("Setting up periodic polling...");
    setupPeriodicPolling();

    // Set up PSI analyze button
    console.log("Setting up PSI analyze button...");
    // PSI button is now set up in insights-display.js

    console.log("=== POPUP INITIALIZATION COMPLETE ===");
  } catch (error) {
    console.error("=== POPUP INITIALIZATION FAILED ===");
    console.error("Error:", error);
    console.error("Error stack:", error.stack);

    // Try to show empty states as fallback
    try {
      showEmptyStates();
    } catch (fallbackError) {
      console.error("Even fallback failed:", fallbackError);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM content loaded, initializing popup");
  initializePopup();
});

// Also try immediate initialization if DOM is already ready
if (document.readyState !== "loading") {
  console.log("DOM already ready, initializing immediately...");
  initializePopup();
}
console.log("=== POPUP SETUP COMPLETE ===");
})();

/******/ })()
;
//# sourceMappingURL=popup.js.map