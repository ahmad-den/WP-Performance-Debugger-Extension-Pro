/**
 * Module for managing debug toggles and parameters with proper loading detection
 */

// Global state management
let isProcessingToggle = false
const toggleQueue = []
let currentOperation = null

/**
 * Sets up toggle functionality
 */
export function setupToggleManagement() {

  // Load initial toggle states using the target tab ID
  loadInitialToggleStates()

  // Add event listeners to toggles with queuing
  const toggleInputs = document.querySelectorAll(".toggle-input")
  toggleInputs.forEach((input) => {
    input.addEventListener("change", (event) => {
      // Prevent rapid clicking
      if (isProcessingToggle) {
        event.preventDefault()
        input.checked = !input.checked // Revert the change
        return
      }

      // Queue the toggle change
      queueToggleChange(input.id, input.checked)
    })
  })
}

/**
 * Loads initial toggle states for the current target tab
 */
async function loadInitialToggleStates() {

  try {
    // Get the target tab ID (works in both attached and detached modes)
    const targetTabId = await window.getTargetTabId()

    if (!targetTabId) {
      console.log("No target tab available for loading toggle states")
      // Set all toggles to unchecked if no tab available
      document.getElementById("perfmattersoff").checked = false
      document.getElementById("perfmatterscssoff").checked = false
      document.getElementById("perfmattersjsoff").checked = false
      document.getElementById("nocache").checked = false
      updateToggleStates(true)
      return
    }

    console.log("Loading toggle states for tab:", targetTabId)

    // Get parameters for the specific tab
    chrome.runtime.sendMessage({ action: "getParameters", tabId: targetTabId }, (parameters) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting parameters:", chrome.runtime.lastError)
        parameters = []
      }

      // Ensure parameters is an array
      if (!Array.isArray(parameters)) {
        parameters = []
      }

      console.log("Loaded parameters for tab", targetTabId, ":", parameters)

      // Update toggle states based on parameters
      document.getElementById("perfmattersoff").checked = parameters.includes("perfmattersoff")
      document.getElementById("perfmatterscssoff").checked = parameters.includes("perfmatterscssoff")
      document.getElementById("perfmattersjsoff").checked = parameters.includes("perfmattersjsoff")
      document.getElementById("nocache").checked = parameters.includes("nocache")

      updateToggleStates(true) // Pass true to skip parameter updates during initial load
    })
  } catch (error) {
    console.error("Error loading initial toggle states:", error)
    // Fallback to unchecked state
    document.getElementById("perfmattersoff").checked = false
    document.getElementById("perfmatterscssoff").checked = false
    document.getElementById("perfmattersjsoff").checked = false
    document.getElementById("nocache").checked = false
    updateToggleStates(true)
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
    timestamp: Date.now(),
  }

  toggleQueue.push(operation)
  console.log(`Queued toggle change: ${toggleId} = ${isChecked}`)

  // Process the queue if not already processing
  if (!isProcessingToggle) {
    processToggleQueue()
  }
}

/**
 * Processes the toggle queue sequentially
 */
async function processToggleQueue() {
  if (isProcessingToggle || toggleQueue.length === 0) {
    return
  }

  isProcessingToggle = true

  while (toggleQueue.length > 0) {
    const operation = toggleQueue.shift()
    currentOperation = operation

    console.log(`Processing toggle: ${operation.toggleId} = ${operation.isChecked}`)

    // Update UI to show loading state
    updateToggleStates(true) // Skip parameter updates, just update UI

    // Process the parameter change and wait for site to load
    await processParameterChangeAndWaitForLoad(operation.toggleId, operation.isChecked)
  }

  currentOperation = null
  isProcessingToggle = false

  // Final UI update
  updateToggleStates(true)
  console.log("Toggle queue processing completed")
}

/**
 * Processes a single parameter change and waits for site to fully load
 * @param {string} toggleId - The ID of the toggle
 * @param {boolean} isChecked - Whether the toggle is checked
 * @returns {Promise} Promise that resolves when the change is complete and site is loaded
 */
async function processParameterChangeAndWaitForLoad(toggleId, isChecked) {
  return new Promise(async (resolve) => {

    // Map toggle IDs to parameter names
    const parameterMap = {
      perfmattersoff: "perfmattersoff",
      perfmatterscssoff: "perfmatterscssoff",
      perfmattersjsoff: "perfmattersjsoff",
      nocache: "nocache",
    }

    const parameter = parameterMap[toggleId]
    if (!parameter) {
      console.error("Unknown toggle ID:", toggleId)
      resolve()
      return
    }

    try {
      // Get the target tab ID (works in both attached and detached modes)
      const targetTabId = await window.getTargetTabId()

      if (!targetTabId) {
        console.error("No target tab available for parameter update")
        resolve()
        return
      }

      console.log("Processing parameter change for tab:", targetTabId, "parameter:", parameter, "value:", isChecked)

      // Send parameter update with specific tab ID
      chrome.runtime.sendMessage(
        {
          action: "updateParameters",
          parameter: parameter,
          add: isChecked,
          tabId: targetTabId, // Include the specific tab ID
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Parameter update error:", chrome.runtime.lastError)
            resolve()
            return
          }

          if (response && response.error) {
            console.error("Parameter update failed:", response.error)
            resolve()
            return
          }

          if (response && response.urlChanged) {
            console.log(`URL updated for ${parameter} on tab ${targetTabId}, waiting for page to load...`)

            // Wait for the tab to finish loading + additional time
            waitForTabToLoadWithDelay(targetTabId)
              .then(() => {
                console.log(`Page loaded successfully after ${parameter} change on tab ${targetTabId}`)
                resolve()
              })
              .catch((error) => {
                console.error("Error waiting for page load:", error)
                // Resolve anyway after timeout
                setTimeout(resolve, 5000)
              })
          } else {
            console.log(`No URL change needed for ${parameter} on tab ${targetTabId}`)
            // Still add delay even if no URL change needed to ensure consistency
            setTimeout(resolve, 2000)
          }
        },
      )
    } catch (error) {
      console.error("Error in processParameterChangeAndWaitForLoad:", error)
      resolve()
    }
  })
}

/**
 * Waits for a tab to finish loading completely with additional delay
 * @param {number} tabId - The ID of the tab to monitor
 * @returns {Promise} Promise that resolves when the tab is fully loaded
 */
function waitForTabToLoadWithDelay(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = 20000 // 20 second timeout
    const startTime = Date.now()

    function checkTabStatus() {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error("Tab not found"))
          return
        }

        // Check if tab is complete
        if (tab.status === "complete") {
          // Additional wait to ensure all resources are loaded + fake delay for control
          setTimeout(() => {
            console.log(`Tab ${tabId} finished loading with additional delay`)
            resolve()
          }, 3000) // 3 second additional delay as requested
          return
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          console.warn(`Timeout waiting for tab ${tabId} to load`)
          resolve() // Resolve anyway to not block the queue
          return
        }

        // Tab still loading, check again
        setTimeout(checkTabStatus, 500)
      })
    }

    // Start checking
    checkTabStatus()
  })
}

/**
 * Updates toggle states and dependencies
 * @param {boolean} skipParameterUpdate - Whether to skip updating parameters
 */
export function updateToggleStates(skipParameterUpdate = false) {
  const perfmattersoff = document.getElementById("perfmattersoff")
  const perfmatterscssoff = document.getElementById("perfmatterscssoff")
  const perfmattersjsoff = document.getElementById("perfmattersjsoff")
  const nocache = document.getElementById("nocache")

  const isPerfmattersOff = perfmattersoff.checked

  // Get all toggle containers
  const allContainers = [
    perfmattersoff.closest(".toggle-container"),
    perfmatterscssoff.closest(".toggle-container"),
    perfmattersjsoff.closest(".toggle-container"),
    nocache.closest(".toggle-container"),
  ]

  // Apply loading state to all toggles if processing
  if (isProcessingToggle) {
    allContainers.forEach((container, index) => {
      const toggleIds = ["perfmattersoff", "perfmatterscssoff", "perfmattersjsoff", "nocache"]
      const toggleId = toggleIds[index]

      if (container) {
        const input = container.querySelector(".toggle-input")
        if (input) input.disabled = true

        // Only show "processing" on the currently active toggle
        if (currentOperation && currentOperation.toggleId === toggleId) {
          container.classList.add("processing-current")
          container.classList.remove("disabled-toggle")
        } else {
          // All other toggles appear disabled
          container.classList.add("disabled-toggle")
          container.classList.remove("processing-current")
        }
      }
    })

    return
  }

  // Clear all loading states
  allContainers.forEach((container) => {
    if (container) {
      container.classList.remove("processing-current", "disabled-toggle")
      const input = container.querySelector(".toggle-input")
      if (input) input.disabled = false
    }
  })

  // Handle dependent toggles
  ;[perfmatterscssoff, perfmattersjsoff].forEach((toggle) => {
    toggle.disabled = isPerfmattersOff
    const container = toggle.closest(".toggle-container")
    if (isPerfmattersOff) {
      toggle.checked = false
      container.classList.add("disabled-toggle")
    } else {
      container.classList.remove("disabled-toggle")
    }
  })

  // Handle nocache toggle
  nocache.disabled = isPerfmattersOff || perfmatterscssoff.checked || perfmattersjsoff.checked
  const nocacheContainer = nocache.closest(".toggle-container")
  if (nocache.disabled) {
    if (nocache.checked) nocache.checked = false
    nocacheContainer.classList.add("disabled-toggle")
  } else {
    nocacheContainer.classList.remove("disabled-toggle")
  }

  // Handle main perfmatters toggle
  perfmattersoff.disabled = false
  const perfmattersContainer = perfmattersoff.closest(".toggle-container")
  perfmattersContainer.classList.remove("disabled-toggle")
}
