// src/popup/displays/insights-display.js

/**
 * Module for handling insights display in the popup - Complete Enhanced Version with Combination Indicators
 */

// Import the simplified helpers
import { sendMessageToContentScript, showElementFeedback, getTargetTabId } from "../../utils/tab-helpers.js"
import { showErrorToast } from "../../utils/toast-notifications.js"
import { updatePSIInsightsDisplay, clearPSIInsightsDisplay, setPSIInsightsLoading } from "./psi-insights-display.js"

// Chrome API is available globally in extension context
const chrome = globalThis.chrome || window.chrome

/**
 * Enhanced state management for insights display
 */
const insightsState = {
  isLoading: false,
  hasError: false,
  errorMessage: "",
  lastUpdate: null,
  dataTypes: {
    local: { available: false, lastUpdate: null },
    field: { available: false, lastUpdate: null },
    lab: { available: false, lastUpdate: null },
  },
  metrics: {
    cls: { local: null, field: null, lab: null },
    lcp: { local: null, field: null, lab: null },
    inp: { local: null, field: null, lab: null },
    ttfb: { local: null, field: null, lab: null }, // Note: lab TTFB will always be null
  },
}

/**
 * Core Web Vitals thresholds based on official Google guidelines
 */
const THRESHOLDS = {
  cls: { good: 0.1, needsImprovement: 0.25 },
  lcp: { good: 2500, needsImprovement: 4000 },
  inp: { good: 200, needsImprovement: 500 },
  ttfb: { good: 800, needsImprovement: 1800 },
}

/**
 * Format metric value for display
 */
function formatMetricValue(metric, value) {
  if (metric === "cls") {
    return typeof value === "number" ? value.toFixed(3) : value
  } else {
    return typeof value === "number" ? `${Math.round(value)}ms` : value
  }
}

/**
 * Updates the insights state and triggers UI updates
 */
function updateInsightsState(updates) {
  const previousState = JSON.parse(JSON.stringify(insightsState))

  // Deep merge updates
  if (updates.dataTypes) {
    Object.assign(insightsState.dataTypes, updates.dataTypes)
  }
  if (updates.metrics) {
    Object.keys(updates.metrics).forEach((metric) => {
      if (insightsState.metrics[metric]) {
        Object.assign(insightsState.metrics[metric], updates.metrics[metric])
      }
    })
  }

  // Update other properties
  Object.keys(updates).forEach((key) => {
    if (key !== "dataTypes" && key !== "metrics") {
      insightsState[key] = updates[key]
    }
  })

  insightsState.lastUpdate = Date.now()

  // Trigger UI updates if state changed
  if (JSON.stringify(previousState) !== JSON.stringify(insightsState)) {
    updateUIFromState()
  }
}

/**
 * Updates UI based on current state
 */
function updateUIFromState() {
  // Update loading states
  updateLoadingStates()

  // Update error states
  updateErrorStates()

  // Hide cache status when resetting
  hideElement("psiCacheStatus")
  
    cacheStatus.style.display = "none"
  updateLegendFromState()

  // Update metric displays
  updateMetricDisplaysFromState()
}

/**
 * Updates loading states across the UI
 */
function updateLoadingStates() {
  const loadingElements = document.querySelectorAll(".metric-loading")
  loadingElements.forEach((el) => {
    el.style.display = insightsState.isLoading ? "flex" : "none"
  })

  // Update PSI button loading state
  if (insightsState.isLoading) {
    setPSIButtonState("analyzing")
  }
}

/**
 * Updates error states across the UI
 */
function updateErrorStates() {
  const errorContainer = document.getElementById("insightsErrorContainer")
  if (errorContainer) {
    if (insightsState.hasError) {
      errorContainer.style.display = "block"
      errorContainer.textContent = insightsState.errorMessage || "An error occurred"
      errorContainer.className = "insights-error-message"
    } else {
      errorContainer.style.display = "none"
    }
  }
}

/**
 * Updates legend visibility based on state including combination indicators
 */
function updateLegendFromState() {
  const localLegend = document.querySelector('.legend-item[data-type="local"]')
  const fieldLegend = document.querySelector('.legend-item[data-type="field"]')
  const labLegend = document.querySelector('.legend-item[data-type="lab"]')

  // Check for combination matches across all metrics
  const combinationStates = getCombinationStates()

  // Show/hide individual legends based on availability and combinations
  if (localLegend) {
    const showLocal = insightsState.dataTypes.local.available && !hasAnyCombinations(combinationStates)
    localLegend.style.display = showLocal ? "flex" : "none"
  }
  if (fieldLegend) {
    const showField = insightsState.dataTypes.field.available && !hasAnyCombinations(combinationStates)
    fieldLegend.style.display = showField ? "flex" : "none"
  }
  if (labLegend) {
    const showLab = insightsState.dataTypes.lab.available && !hasAnyCombinations(combinationStates)
    labLegend.style.display = showLab ? "flex" : "none"
  }

  // Update combination legends
  updateCombinationLegends(combinationStates)

  const legendContainer = document.querySelector(".cwv-legend")
  if (legendContainer) {
    const hasAnyData = Object.values(insightsState.dataTypes).some((dt) => dt.available)
    legendContainer.style.display = hasAnyData ? "flex" : "none"
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
    allSources: false,
  }

  Object.keys(insightsState.metrics).forEach((metric) => {
    const metricData = insightsState.metrics[metric]
    const localValue = metricData.local
    const fieldValue = metricData.field
    const labValue = metricData.lab

    if (localValue !== null && fieldValue !== null && labValue !== null) {
      const tolerance = calculateTolerance(metric, localValue)
      const localFieldMatch = Math.abs(localValue - fieldValue) <= tolerance
      const localLabMatch = Math.abs(localValue - labValue) <= tolerance
      const fieldLabMatch = Math.abs(fieldValue - labValue) <= tolerance

      if (localFieldMatch && localLabMatch && fieldLabMatch) {
        states.allSources = true
      } else if (localFieldMatch) {
        states.localField = true
      } else if (localLabMatch) {
        states.localLab = true
      } else if (fieldLabMatch) {
        states.fieldLab = true
      }
    } else {
      // Check two-way combinations
      if (localValue !== null && fieldValue !== null) {
        const tolerance = calculateTolerance(metric, localValue)
        if (Math.abs(localValue - fieldValue) <= tolerance) {
          states.localField = true
        }
      }
      if (localValue !== null && labValue !== null) {
        const tolerance = calculateTolerance(metric, localValue)
        if (Math.abs(localValue - labValue) <= tolerance) {
          states.localLab = true
        }
      }
      if (fieldValue !== null && labValue !== null) {
        const tolerance = calculateTolerance(metric, fieldValue)
        if (Math.abs(fieldValue - labValue) <= tolerance) {
          states.fieldLab = true
        }
      }
    }
  })

  return states
}

/**
 * Check if any combinations are active
 */
function hasAnyCombinations(states) {
  return states.localField || states.localLab || states.fieldLab || states.allSources
}

/**
 * Update combination legend items
 */
function updateCombinationLegends(states) {
  const legendContainer = document.querySelector(".cwv-legend")
  if (!legendContainer) return

  // Remove existing combination legends
  const existingCombinations = legendContainer.querySelectorAll(
    '.legend-item[data-type*="-"], .legend-item[data-type="all-sources"]',
  )
  existingCombinations.forEach((item) => item.remove())

  // Add active combination legends
  if (states.allSources) {
    addCombinationLegendItem(legendContainer, "all-sources", "All Match")
  } else {
    if (states.localField) {
      addCombinationLegendItem(legendContainer, "local-field", "Local + Field")
    }
    if (states.localLab) {
      addCombinationLegendItem(legendContainer, "local-lab", "Local + Lab")
    }
    if (states.fieldLab) {
      addCombinationLegendItem(legendContainer, "field-lab", "Field + Lab")
    }
  }
}

/**
 * Add combination legend item
 */
function addCombinationLegendItem(container, type, label) {
  const legendItem = document.createElement("div")
  legendItem.className = "legend-item"
  legendItem.setAttribute("data-type", type)

  const dot = document.createElement("div")
  dot.className = "legend-dot"

  const labelElement = document.createElement("span")
  labelElement.className = "legend-label"
  labelElement.textContent = label

  legendItem.appendChild(dot)
  legendItem.appendChild(labelElement)
  container.appendChild(legendItem)
}

/**
 * Updates metric displays based on current state
 */
function updateMetricDisplaysFromState() {
  Object.keys(insightsState.metrics).forEach((metric) => {
    const metricData = insightsState.metrics[metric]

    // Update local values
    if (metricData.local !== null) {
      updateMetricValue(metric, "local", metricData.local)
    }

    // Update field values
    if (metricData.field !== null) {
      updateMetricValue(metric, "field", metricData.field)
    }

    // Update lab values (only for CLS and LCP, TTFB not available in lab)
    if (metricData.lab !== null && (metric === "cls" || metric === "lcp")) {
      updateMetricValue(metric, "lab", metricData.lab)
    }
  })
}

/**
 * Generic function to update metric values in UI
 */
function updateMetricValue(metric, type, value) {
  const valueContainer = document.getElementById(`${metric}${type.charAt(0).toUpperCase() + type.slice(1)}Value`)
  const textElement = document.getElementById(`${metric}${type.charAt(0).toUpperCase() + type.slice(1)}Text`)

  if (!valueContainer || !textElement) {
    console.log(`Missing elements for ${metric} ${type}:`, {
      container: !!valueContainer,
      text: !!textElement,
    })
    return
  }

  // Show the container
  valueContainer.style.display = "flex"

  // Format value based on metric type
  const displayValue = formatMetricValue(metric, value)
  textElement.textContent = displayValue

  // Add threshold-based styling
  if (typeof value === "number") {
    updateMetricThresholds(metric, value, type === "field", type === "lab")
    addThresholdStyling(textElement, metric, value)
  }

  console.log(`Updated ${metric} ${type} value:`, displayValue)
}

/**
 * Adds threshold-based styling to metric elements
 */
function addThresholdStyling(element, metric, value) {
  const threshold = THRESHOLDS[metric]
  if (!threshold) return

  // Remove existing threshold classes
  element.classList.remove("metric-good", "metric-needs-improvement", "metric-poor")

  // Add appropriate class
  if (value <= threshold.good) {
    element.classList.add("metric-good")
  } else if (value <= threshold.needsImprovement) {
    element.classList.add("metric-needs-improvement")
  } else {
    element.classList.add("metric-poor")
  }
}

/**
 * Verifies content script is ready with simple ping
 */
async function verifyContentScriptReady(targetTabId) {
  console.log(`Verifying content script readiness for tab ${targetTabId}`)

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(targetTabId, { action: "ping" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log("Content script ping failed:", chrome.runtime.lastError.message)
        resolve(false)
      } else if (response && response.ready) {
        console.log("Content script ping successful")
        resolve(true)
      } else {
        console.log("Content script ping returned unexpected response:", response)
        resolve(false)
      }
    })
  })
}

/**
 * Sets up the PSI analyze button functionality with proper detached mode support
 */
function setupPSIAnalyzeButton() {
  console.log("Setting up PSI button")
  const psiBtn = document.getElementById("analyzePSIBtn")

  if (!psiBtn) {
    console.log("PSI button not found")
    return
  }

  // Remove any existing listeners to prevent duplicates
  const newBtn = psiBtn.cloneNode(true)
  psiBtn.parentNode.replaceChild(newBtn, psiBtn)

  // Set initial state
  newBtn.setAttribute("data-tooltip", "Analyze with PageSpeed Insights")

  // Single event listener with proper error handling
  newBtn.addEventListener("click", handlePSIButtonClick)
}

/**
 * Handles PSI button click with proper detached mode support
 */
async function handlePSIButtonClick() {
  try {
    console.log("PSI button clicked - starting analysis")

    // Update state to loading
    updateInsightsState({
      isLoading: true,
      hasError: false,
      errorMessage: "",
    })

    // Get target tab ID using the improved helper that auto-detects mode
    console.log("Getting target tab ID...")
    const targetTabId = await getTargetTabId()
    console.log("Target tab ID for PSI analysis:", targetTabId)

    if (!targetTabId) {
      throw new Error("No target tab available. Please ensure you're on a valid webpage.")
    }

    // Verify content script is ready before sending PSI request
    console.log("Verifying content script readiness...")
    const isReady = await verifyContentScriptReady(targetTabId)

    if (!isReady) {
      throw new Error("Content script not ready. Please refresh the page and try again.")
    }

    console.log("Content script ready, sending PSI analysis request...")

    // Send PSI analysis request with proper timeout handling
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Request timeout - analysis taking too long"))
      }, 45000)

      chrome.tabs.sendMessage(targetTabId, { action: "analyzePSI" }, (response) => {
        clearTimeout(timeout)

        if (chrome.runtime.lastError) {
          console.error("Chrome runtime error:", chrome.runtime.lastError.message)
          reject(new Error(`Connection failed: ${chrome.runtime.lastError.message}`))
        } else if (response && response.success) {
          console.log("PSI analysis request successful:", response)
          resolve(response)
        } else {
          const errorMessage = response?.userMessage || response?.message || "Analysis failed. Please try again."
          console.error("PSI analysis failed:", errorMessage)
          reject(new Error(errorMessage))
        }
      })
    })

    // Success state
    updateInsightsState({
      isLoading: false,
      hasError: false,
    })

    console.log("✅ PSI analysis completed successfully")
  } catch (error) {
    console.error("PSI button error:", error)

    // Error state
    updateInsightsState({
      isLoading: false,
      hasError: true,
      errorMessage: error.message,
    })

    showErrorToast(error.message, { duration: 5000 })
  }
}

/**
 * Enhanced PSI button state management
 */
function setPSIButtonState(state) {
  const psiBtn = document.getElementById("analyzePSIBtn")
  if (!psiBtn) return

  console.log(`Setting PSI button state to: ${state}`)

  // Remove all state classes
  psiBtn.classList.remove("analyzing", "success", "error")

  const btnText = psiBtn.querySelector(".psi-btn-text")
  const btnIcon = psiBtn.querySelector(".psi-btn-icon")

  if (state === "analyzing") {
    psiBtn.classList.add("analyzing")
    psiBtn.disabled = true
    if (btnText) btnText.textContent = "Analyzing..."
    psiBtn.setAttribute("data-tooltip", "Analyzing with PageSpeed Insights...")
  } else if (state === "success") {
    psiBtn.classList.add("success")
    psiBtn.disabled = false
    if (btnText) btnText.textContent = "Success!"
    psiBtn.setAttribute("data-tooltip", "Analysis completed successfully")

    // Reset to default after 2 seconds
    setTimeout(() => {
      setPSIButtonState("default")
    }, 2000)
  } else if (state === "error") {
    psiBtn.classList.add("error")
    psiBtn.disabled = false
    if (btnText) btnText.textContent = "Error"
    psiBtn.setAttribute("data-tooltip", "Analysis failed - click to retry")

    // Reset to default after 3 seconds
    setTimeout(() => {
      setPSIButtonState("default")
    }, 3000)
  } else {
    // Default state
    psiBtn.disabled = false
    if (btnText) btnText.textContent = "Analyze PSI"
    psiBtn.setAttribute("data-tooltip", "Analyze with PageSpeed Insights")
  }
}

/**
 * Resets data availability (useful when navigating to new page)
 */
function resetDataAvailability() {
  updateInsightsState({
    dataTypes: {
      local: { available: false, lastUpdate: null },
      field: { available: false, lastUpdate: null },
      lab: { available: false, lastUpdate: null },
    },
    metrics: {
      cls: { local: null, field: null, lab: null },
      lcp: { local: null, field: null, lab: null },
      inp: { local: null, field: null, lab: null },
      ttfb: { local: null, field: null, lab: null }, // Lab TTFB always null
    },
    hasError: false,
    errorMessage: "",
    isLoading: false,
  })

  // Clear PSI insights as well
  clearPSIInsightsDisplay()
}

/**
 * Updates the insights display with analysis results
 * @param {Object} data - Analysis data object
 */
export function updateInsightsDisplay(data) {
  console.log("Updating insights display with data:", data)

  // Update CLS display
  if (data.cls !== undefined) {
    console.log("Updating CLS display")
    updateCLSDisplay(data.cls)
  }

  // Update LCP display
  if (data.lcp !== undefined) {
    console.log("Updating LCP display")
    updateLCPDisplay(data.lcp)
  }

  // Update INP display
  if (data.inp !== undefined) {
    console.log("Updating INP display")
    updateINPDisplay(data.inp)
  }

  // Update TTFB display
  if (data.additionalMetrics !== undefined) {
    console.log("Updating TTFB display")
    updateTTFBDisplay(data.additionalMetrics)
  }
}

// Update the CLS display function - Fixed to properly update state
export function updateCLSDisplay(clsData) {
  console.log("updateCLSDisplay called with:", clsData)

  const value = clsData.value || 0

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      local: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      cls: { local: value },
    },
  })

  const clsElementPreview = document.getElementById("clsElementPreview")

  // Show/hide element preview
  if (clsElementPreview) {
    if (value > 0) {
      clsElementPreview.style.display = "block"
      updateCLSElementPreview(clsData.element || {}, value)
    } else {
      clsElementPreview.style.display = "none"
    }
  }

  updateMetricThresholds("cls", value, false, false) // isField = false, isLab = false (local)
}

// Update the LCP display function - Fixed to properly update state
export function updateLCPDisplay(lcpData) {
  console.log("updateLCPDisplay called with:", lcpData)

  const value = lcpData.value || 0

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      local: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      lcp: { local: value },
    },
  })

  const lcpElementPreview = document.getElementById("lcpElementPreview")

  // Show element preview
  if (lcpElementPreview) {
    lcpElementPreview.style.display = "block"
    updateLCPElementPreview(lcpData.element || {})
  }

  updateMetricThresholds("lcp", value, false, false) // isField = false, isLab = false (local)
}

// Update the INP display function - Enhanced to show element details
export function updateINPDisplay(inpData) {
  console.log("updateINPDisplay called with:", inpData)

  const value = inpData.value || 0

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      local: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      inp: { local: value },
    },
  })

  const inpStatus = document.getElementById("inpStatus")
  const inpElementPreview = document.getElementById("inpElementPreview")

  if (inpStatus) {
    const status = inpData.status || "waiting"

    if (value !== null && value !== undefined && value > 0) {
      if (inpData.entries && inpData.entries.length > 0) {
        const latestEntry = inpData.entries[0]
        inpStatus.innerHTML = `
          <div class="inp-message">
            Latest interaction: ${latestEntry.name} on ${latestEntry.target} (${latestEntry.duration}ms)
          </div>
        `

        // Show element preview if we have element data
        if (latestEntry.element && inpElementPreview) {
          inpElementPreview.style.display = "block"
          updateINPElementPreview(latestEntry.element, latestEntry)
        }
      } else {
        inpStatus.innerHTML = `<div class="inp-message">INP measured: ${value}ms</div>`
        if (inpElementPreview) {
          inpElementPreview.style.display = "none"
        }
      }
    } else {
      if (status === "waiting") {
        inpStatus.innerHTML = `<div class="inp-message">Click anywhere on the page to measure interaction responsiveness</div>`
      } else {
        inpStatus.innerHTML = `<div class="inp-message">No interactions detected yet</div>`
      }
      if (inpElementPreview) {
        inpElementPreview.style.display = "none"
      }
    }
  }

  updateMetricThresholds("inp", value, false, false) // isField = false, isLab = false (local)
}

// Update the TTFB display function - Fixed to properly update state
export function updateTTFBDisplay(metrics) {
  console.log("updateTTFBDisplay called with:", metrics)

  const value = metrics.ttfb || 0

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      local: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      ttfb: { local: value },
    },
  })

  updateMetricThresholds("ttfb", value, false, false) // isField = false, isLab = false (local)
}

/**
 * Updates the CLS display with PSI field data
 */
export function updatePSICLSDisplay(psiData) {
  console.log("updatePSICLSDisplay called with:", psiData)

  if (!psiData || psiData.value === null || psiData.value === undefined || isNaN(psiData.value)) {
    console.log("No valid PSI CLS data available")
    return
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      field: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      cls: { field: psiData.value },
    },
  })

  console.log("PSI CLS field data processed:", psiData.value)
  updateMetricThresholds("cls", psiData.value, true, false) // isField = true, isLab = false
}

/**
 * Updates the LCP display with PSI field data
 */
export function updatePSILCPDisplay(psiData) {
  console.log("updatePSILCPDisplay called with:", psiData)

  if (!psiData || psiData.value === null || psiData.value === undefined || isNaN(psiData.value)) {
    console.log("No valid PSI LCP data available")
    return
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      field: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      lcp: { field: psiData.value },
    },
  })

  console.log("PSI LCP field data processed:", psiData.value)
  updateMetricThresholds("lcp", psiData.value, true, false) // isField = true, isLab = false
}

/**
 * Updates the INP display with PSI field data
 */
export function updatePSIINPDisplay(psiData) {
  console.log("updatePSIINPDisplay called with:", psiData)

  if (!psiData || psiData.value === null || psiData.value === undefined || isNaN(psiData.value)) {
    console.log("No valid PSI INP data available")
    return
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      field: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      inp: { field: psiData.value },
    },
  })

  console.log("PSI INP field data processed:", psiData.value)
  updateMetricThresholds("inp", psiData.value, true, false) // isField = true, isLab = false
}

/**
 * Updates the TTFB display with PSI field data
 */
export function updatePSITTFBDisplay(psiData) {
  console.log("updatePSITTFBDisplay called with:", psiData)

  if (!psiData || psiData.value === null || psiData.value === undefined || isNaN(psiData.value)) {
    console.log("No valid PSI TTFB data available")
    return
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      field: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      ttfb: { field: psiData.value },
    },
  })

  console.log("PSI TTFB field data processed:", psiData.value)
  updateMetricThresholds("ttfb", psiData.value, true, false) // isField = true, isLab = false
}

/**
 * Updates the CLS display with PSI lab data
 */
export function updatePSILabCLSDisplay(labData) {
  console.log("updatePSILabCLSDisplay called with:", labData)

  if (!labData || labData.value === null || labData.value === undefined || isNaN(labData.value)) {
    console.log("No valid PSI Lab CLS data available")
    return
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      lab: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      cls: { lab: labData.value },
    },
  })

  console.log("PSI Lab CLS data processed:", labData.value)
  updateMetricThresholds("cls", labData.value, false, true) // isField = false, isLab = true
}

/**
 * Updates the LCP display with PSI lab data
 */
export function updatePSILabLCPDisplay(labData) {
  console.log("updatePSILabLCPDisplay called with:", labData)

  if (!labData || labData.value === null || labData.value === undefined || isNaN(labData.value)) {
    console.log("No valid PSI Lab LCP data available")
    return
  }

  // Update state with actual value
  updateInsightsState({
    dataTypes: {
      lab: { available: true, lastUpdate: Date.now() },
    },
    metrics: {
      lcp: { lab: labData.value },
    },
  })

  console.log("PSI Lab LCP data processed:", labData.value)
  updateMetricThresholds("lcp", labData.value, false, true) // isField = false, isLab = true
}

// Note: TTFB lab data function removed as TTFB is not available in Lighthouse lab environment

/**
 * @param {Object} statusData - PSI status data
 */
export function updatePSIStatus(statusData) {
  console.log("updatePSIStatus called with:", statusData)

  if (statusData.status === "loading") {
    console.log("PSI: Loading...")
  const cacheStatusContainer = document.getElementById("psiCacheStatus")
  const cacheStatusText = document.getElementById("cacheStatusText")
    setPSIButtonState("analyzing")
    setPSIInsightsLoading(true)
    
    // Hide cache status during loading
    if (cacheStatusContainer) {
      cacheStatusContainer.style.display = "none"
    // Hide cache status during loading and start timing
    if (cacheStatus) {
      cacheStatus.style.display = "none"
    }
    
    // Store start time for timing-based cache detection
    window.psiAnalysisStartTime = Date.now()
    }
  } else if (statusData.status === "success") {
    console.log("PSI: Success -", statusData.message, statusData.cached ? "(cached)" : "(fresh)")
    setPSIButtonState("success")
    setPSIInsightsLoading(false)
  } else if (statusData.status === "error") {
    console.error("PSI: Error -", statusData.message)
    setPSIButtonState("error")
    setPSIInsightsLoading(false)

    // Show error toast for API errors
    // Implement timing-based cache detection
    if (cacheStatus) {
      const analysisEndTime = Date.now()
      const startTime = window.psiAnalysisStartTime || analysisEndTime
      const duration = analysisEndTime - startTime
      
      // If analysis took more than 10 seconds, it's fresh; otherwise cached
      const isFresh = duration > 10000
      const statusText = isFresh ? "FRESH" : "CACHED"
      
      console.log(`PSI analysis took ${duration}ms - showing as ${statusText}`)
      
      const cacheStatusText = document.getElementById("cacheStatusText")
      if (cacheStatusText) {
        cacheStatusText.textContent = statusText
        cacheStatusText.className = `cache-status-text ${isFresh ? "fresh" : "cached"}`
        cacheStatus.style.display = "block"
      }
    }
    
    // Hide cache status on error
    if (cacheStatusContainer) {
      cacheStatus.style.display = "none"
    }
  }
}

/**
 * Handles complete PSI results including insights
 * @param {Object} psiData - Complete PSI data
 */
export function handleCompletePSIResults(psiData) {
  console.log("handleCompletePSIResults called with:", psiData)

  try {
  // Update cache status indicator
  updatePSICacheStatus(psiData.fromCache)
  
    // Update insights display with complete PSI data
    updatePSIInsightsDisplay(psiData)
  } catch (error) {
    console.error("Error handling complete PSI results:", error)
  }
}

/**
 * Updates PSI cache status indicator
 * @param {boolean} fromCache - Whether PSI data is from cache
 */
function updatePSICacheStatus(fromCache) {
  console.log("=== updatePSICacheStatus called ===", fromCache)
  
  const cacheStatusContainer = document.getElementById("psiCacheStatus")
  const cacheStatusText = document.getElementById("cacheStatusText")
  
  if (!cacheStatusContainer || !cacheStatusText) {
    console.log("PSI cache status elements not found")
    return
  }
  
  // Only show cache status for actual PSI API responses, not restored data
  if (fromCache === undefined || fromCache === null) {
    console.log("No cache status provided, hiding indicator")
    psiCacheStatus.style.display = "none"
    return
  }
  
  // Show the container
  cacheStatusContainer.style.display = "flex"
  
  // Update text and styling based on cache status
  if (fromCache === false) {
    cacheStatusText.textContent = "Fresh"
    cacheStatusText.className = "cache-status-text fresh"
  } else {
    cacheStatusText.textContent = "Cached"
    cacheStatusText.className = "cache-status-text cached"
  }
  
  console.log("PSI cache status updated:", fromCache === false ? "Fresh" : "Cached")
}

/**
 * Updates the CLS element preview with enhanced information
 * @param {Object} element - CLS element data
 * @param {number} clsValue - Current CLS value
 */
function updateCLSElementPreview(element, clsValue) {
  console.log("updateCLSElementPreview called with:", element, clsValue)

  const elementTag = document.getElementById("clsElementTag")
  const elementImage = document.getElementById("clsElementImage")
  const clsShiftValue = document.getElementById("clsShiftValue")
  const elementDimensions = document.getElementById("clsElementDimensions")
  const elementPosition = document.getElementById("clsElementPosition")
  const elementClassesContainer = document.getElementById("clsElementClassesContainer")
  const elementClasses = document.getElementById("clsElementClasses")
  const elementSelectorContainer = document.getElementById("clsElementSelector")
  const elementSelector = document.getElementById("clsElementSelector")

  // Handle case where element data might be empty or incomplete
  if (!element || Object.keys(element).length === 0 || !element.tagName) {
    console.log("No CLS element data available, element:", element)
    if (elementTag) elementTag.textContent = "Layout Shift Detected"
    if (clsShiftValue) clsShiftValue.textContent = clsValue ? clsValue.toFixed(3) : "0.000"

    // Show what we can from the CLS data itself
    if (elementDimensions) {
      elementDimensions.textContent = "Element details not available"
    }
    if (elementPosition) {
      elementPosition.textContent = "Position not available"
    }
    if (elementImage) {
      elementImage.innerHTML = '<div class="preview-placeholder">No element preview available</div>'
    }

    // Hide optional sections
    if (elementClassesContainer) elementClassesContainer.style.display = "none"
    if (elementSelectorContainer) elementSelectorContainer.style.display = "none"
    return
  }

  console.log("Updating CLS element preview with:", element)

  // Update element tag with more detailed information
  if (elementTag) {
    let tagDisplay = element.tagName ? element.tagName.toUpperCase() : "ELEMENT"
    if (element.classList && element.classList.length > 0) {
      tagDisplay += "." + element.classList[0]
    } else if (element.id) {
      tagDisplay += `#${element.id}`
    }
    elementTag.textContent = tagDisplay
    elementTag.style.color = "#ff9500" // Orange color for CLS
  }

  // Update shift value
  if (clsShiftValue) {
    clsShiftValue.textContent = element.shiftValue
      ? element.shiftValue.toFixed(3)
      : clsValue
        ? clsValue.toFixed(3)
        : "0.000"
  }

  // Update dimensions
  if (elementDimensions && element.dimensions) {
    let dimensionText = `${element.dimensions.width || 0}×${element.dimensions.height || 0}px`
    if (element.dimensions.naturalWidth && element.dimensions.naturalHeight) {
      dimensionText += ` (natural: ${element.dimensions.naturalWidth}×${element.dimensions.naturalHeight}px)`
    }
    elementDimensions.textContent = dimensionText
  } else if (elementDimensions) {
    elementDimensions.textContent = "Unknown dimensions"
  }

  // Update position
  if (elementPosition && element.position) {
    elementPosition.textContent = `${element.position.left || 0}, ${element.position.top || 0}px`
  } else if (elementPosition) {
    elementPosition.textContent = "Unknown position"
  }

  // Update classes
  if (elementClassesContainer && elementClasses && element.classList && element.classList.length > 0) {
    elementClassesContainer.style.display = "block"
    elementClasses.textContent = element.classList.join(" ")
    elementClasses.title = element.classList.join(" ")
  } else if (elementClassesContainer) {
    elementClassesContainer.style.display = "none"
  }

  // Update CSS selector
  if (elementSelectorContainer && elementSelector && element.selector) {
    elementSelectorContainer.style.display = "block"
    elementSelector.textContent = element.selector
    elementSelector.title = element.selector
  } else if (elementSelectorContainer) {
    elementSelectorContainer.style.display = "none"
  }

  // Update preview image with click functionality
  if (elementImage) {
    const imageUrl =
      element.preview || element.primarySource || element.src || element.currentSrc || element.backgroundImageUrl

    if (imageUrl) {
      console.log("Setting CLS preview image:", imageUrl)
      elementImage.innerHTML = `
        <img src="${imageUrl}" 
             alt="CLS Element Preview" 
             class="element-preview-img clickable-preview" 
             title="Click to highlight this element on the page"
             crossorigin="anonymous">
      `

      // Add click handler to highlight element
      const previewImg = elementImage.querySelector(".clickable-preview")
      if (previewImg) {
        previewImg.addEventListener("click", () => {
          highlightCLSElementOnPage()
        })

        // Add error handling for image loading
        previewImg.addEventListener("error", () => {
          console.log("CLS preview image failed to load")
          elementImage.innerHTML = '<div class="preview-placeholder">Preview not available</div>'
        })
      }
    } else {
      console.log("No image URL available for CLS preview")
      elementImage.innerHTML = '<div class="preview-placeholder">No preview available</div>'
    }
  }

  // Make the entire preview clickable
  const clsElementPreview = document.getElementById("clsElementPreview")
  if (clsElementPreview) {
    clsElementPreview.style.cursor = "pointer"
    clsElementPreview.title = "Click to highlight this element on the page"

    // Remove existing click handlers
    clsElementPreview.replaceWith(clsElementPreview.cloneNode(true))
    const newPreview = document.getElementById("clsElementPreview")

    newPreview.addEventListener("click", () => {
      highlightCLSElementOnPage()
    })
  }
}

/**
 * Updates the LCP element preview with enhanced information
 * @param {Object} element - LCP element data
 */
function updateLCPElementPreview(element) {
  console.log("updateLCPElementPreview called with:", element)

  const elementTag = document.getElementById("lcpElementTag")
  const elementImage = document.getElementById("lcpElementImage")
  const elementDimensions = document.getElementById("lcpElementDimensions")
  const elementPosition = document.getElementById("lcpElementPosition")
  const elementSrcContainer = document.getElementById("lcpElementSrcContainer")
  const elementSrc = document.getElementById("lcpElementSrc")
  const elementTextContainer = document.getElementById("lcpElementText")
  const elementText = document.getElementById("lcpElementText")
  const elementClassesContainer = document.getElementById("lcpElementClassesContainer")
  const elementClasses = document.getElementById("lcpElementClasses")

  // Handle case where element data might be empty or incomplete
  if (!element || Object.keys(element).length === 0) {
    console.log("No element data available, showing placeholder")
    if (elementTag) elementTag.textContent = "LCP Element"
    if (elementDimensions) elementDimensions.textContent = "Analyzing..."
    if (elementPosition) elementPosition.textContent = "Analyzing..."
    if (elementImage) {
      elementImage.innerHTML = '<div class="preview-placeholder">Analyzing LCP element...</div>'
    }

    // Hide optional sections
    if (elementSrcContainer) elementSrcContainer.style.display = "none"
    if (elementTextContainer) elementTextContainer.style.display = "none"
    if (elementClassesContainer) elementClassesContainer.style.display = "none"
    return
  }

  console.log("Updating LCP element preview with:", element)

  // Update element tag with more detailed information
  if (elementTag) {
    let tagDisplay = element.tagName ? element.tagName.toUpperCase() : "ELEMENT"
    if (element.classList && element.classList.length > 0) {
      tagDisplay += "." + element.classList[0]
    } else if (element.id) {
      tagDisplay += `#${element.id}`
    }
    elementTag.textContent = tagDisplay
    elementTag.style.color = "#007aff" // Make it blue like in the screenshot
  }

  // Update dimensions with natural dimensions if available
  if (elementDimensions && element.dimensions) {
    let dimensionText = `${element.dimensions.width || 0}×${element.dimensions.height || 0}px`
    if (element.dimensions.naturalWidth && element.dimensions.naturalHeight) {
      dimensionText += ` (natural: ${element.dimensions.naturalWidth}×${element.dimensions.naturalHeight}px)`
    }
    elementDimensions.textContent = dimensionText
  } else if (elementDimensions) {
    elementDimensions.textContent = "Unknown dimensions"
  }

  // Update position
  if (elementPosition && element.position) {
    elementPosition.textContent = `${element.position.left || 0}, ${element.position.top || 0}px`
  } else if (elementPosition) {
    elementPosition.textContent = "Unknown position"
  }

  // Update classes
  if (elementClassesContainer && elementClasses && element.classList && element.classList.length > 0) {
    elementClassesContainer.style.display = "block"
    elementClasses.textContent = element.classList.join(" ")
    elementClasses.title = element.classList.join(" ")
  } else if (elementClassesContainer) {
    elementClassesContainer.style.display = "none"
  }

  // Update source with primary source
  if (element.primarySource || element.src || element.currentSrc || element.backgroundImageUrl) {
    const sourceUrl = element.primarySource || element.src || element.currentSrc || element.backgroundImageUrl
    if (elementSrcContainer && elementSrc) {
      elementSrcContainer.style.display = "block"
      const displaySrc = sourceUrl.length > 60 ? sourceUrl.substring(0, 60) + "..." : sourceUrl
      elementSrc.textContent = displaySrc
      elementSrc.title = sourceUrl
    }
  } else if (elementSrcContainer) {
    elementSrcContainer.style.display = "none"
  }

  // Update text content
  if (element.textContent && element.textContent.trim()) {
    if (elementTextContainer && elementText) {
      elementTextContainer.style.display = "block"
      const displayText =
        element.textContent.length > 60 ? element.textContent.substring(0, 60) + "..." : element.textContent
      elementText.textContent = displayText
      elementText.title = element.textContent
    }
  } else if (elementTextContainer) {
    elementTextContainer.style.display = "none"
  }

  // Update preview image with click functionality
  if (elementImage) {
    const imageUrl =
      element.preview || element.primarySource || element.src || element.currentSrc || element.backgroundImageUrl

    if (imageUrl) {
      console.log("Setting LCP preview image:", imageUrl)
      elementImage.innerHTML = `
        <img src="${imageUrl}" 
             alt="LCP Element Preview" 
             class="element-preview-img clickable-preview" 
             title="Click to highlight this element on the page"
             crossorigin="anonymous">
      `

      // Add click handler to highlight element
      const previewImg = elementImage.querySelector(".clickable-preview")
      if (previewImg) {
        previewImg.addEventListener("click", () => {
          highlightLCPElementOnPage()
        })

        // Add error handling for image loading
        previewImg.addEventListener("error", () => {
          console.log("LCP preview image failed to load")
          elementImage.innerHTML = '<div class="preview-placeholder">Preview not available</div>'
        })
      }
    } else {
      console.log("No image URL available for LCP preview")
      elementImage.innerHTML = '<div class="preview-placeholder">No preview available</div>'
    }
  }

  // Make the entire preview clickable
  const lcpElementPreview = document.getElementById("lcpElementPreview")
  if (lcpElementPreview) {
    lcpElementPreview.style.cursor = "pointer"
    lcpElementPreview.title = "Click to highlight this element on the page"

    // Remove existing click handlers
    lcpElementPreview.replaceWith(lcpElementPreview.cloneNode(true))
    const newPreview = document.getElementById("lcpElementPreview")

    newPreview.addEventListener("click", () => {
      highlightLCPElementOnPage()
    })
  }
}

/**
 * Updates the INP element preview with enhanced information
 * @param {Object} element - INP element data
 * @param {Object} interaction - Interaction entry data
 */
function updateINPElementPreview(element, interaction) {
  console.log("updateINPElementPreview called with:", element, interaction)

  const elementTag = document.getElementById("inpElementTag")
  const elementImage = document.getElementById("inpElementImage")
  const elementDimensions = document.getElementById("inpElementDimensions")
  const elementPosition = document.getElementById("inpElementPosition")
  const elementClassesContainer = document.getElementById("inpElementClassesContainer")
  const elementClasses = document.getElementById("inpElementClasses")
  const interactionTypeContainer = document.getElementById("inpInteractionTypeContainer")
  const interactionType = document.getElementById("inpInteractionType")
  const interactionDuration = document.getElementById("inpInteractionDuration")

  // Handle case where element data might be empty or incomplete
  if (!element || Object.keys(element).length === 0) {
    console.log("No INP element data available, showing interaction info")
    if (elementTag) elementTag.textContent = `${interaction.target || "Element"} (${interaction.name})`
    if (interactionDuration) interactionDuration.textContent = `${interaction.duration}ms`
    if (elementDimensions) elementDimensions.textContent = "Element details not available"
    if (elementPosition) elementPosition.textContent = "Position not available"
    if (elementImage) {
      elementImage.innerHTML = '<div class="preview-placeholder">No element preview available</div>'
    }

    // Hide optional sections
    if (elementClassesContainer) elementClassesContainer.style.display = "none"
    if (interactionTypeContainer) interactionTypeContainer.style.display = "none"
    return
  }

  console.log("Updating INP element preview with:", element)

  // Update element tag with more detailed information
  if (elementTag) {
    let tagDisplay = element.tagName ? element.tagName.toUpperCase() : "ELEMENT"
    if (element.classList && element.classList.length > 0) {
      tagDisplay += "." + element.classList[0]
    } else if (element.id) {
      tagDisplay += `#${element.id}`
    }
    elementTag.textContent = tagDisplay
    elementTag.style.color = "#ff6b35" // Orange-red color for INP
  }

  // Update interaction duration
  if (interactionDuration) {
    interactionDuration.textContent = `${interaction.duration}ms`
  }

  // Update dimensions
  if (elementDimensions && element.dimensions) {
    const dimensionText = `${element.dimensions.width || 0}×${element.dimensions.height || 0}px`
    elementDimensions.textContent = dimensionText
  } else if (elementDimensions) {
    elementDimensions.textContent = "Unknown dimensions"
  }

  // Update position
  if (elementPosition && element.position) {
    elementPosition.textContent = `${element.position.left || 0}, ${element.position.top || 0}px`
  } else if (elementPosition) {
    elementPosition.textContent = "Unknown position"
  }

  // Update classes
  if (elementClassesContainer && elementClasses && element.classList && element.classList.length > 0) {
    elementClassesContainer.style.display = "block"
    elementClasses.textContent = element.classList.join(" ")
    elementClasses.title = element.classList.join(" ")
  } else if (elementClassesContainer) {
    elementClassesContainer.style.display = "none"
  }

  // Update interaction type
  if (interactionTypeContainer && interactionType) {
    interactionTypeContainer.style.display = "block"
    interactionType.textContent = interaction.name || "unknown"
  } else if (interactionTypeContainer) {
    interactionTypeContainer.style.display = "none"
  }

  // Update preview image with click functionality
  if (elementImage) {
    const imageUrl = element.preview || element.src || element.currentSrc

    if (imageUrl) {
      console.log("Setting INP preview image:", imageUrl)
      elementImage.innerHTML = `
        <img src="${imageUrl}" 
             alt="INP Element Preview" 
             class="element-preview-img clickable-preview" 
             title="Click to highlight this element on the page"
             crossorigin="anonymous">
      `

      // Add click handler to highlight element
      const previewImg = elementImage.querySelector(".clickable-preview")
      if (previewImg) {
        previewImg.addEventListener("click", () => {
          highlightINPElementOnPage()
        })

        // Add error handling for image loading
        previewImg.addEventListener("error", () => {
          console.log("INP preview image failed to load")
          elementImage.innerHTML = '<div class="preview-placeholder">Preview not available</div>'
        })
      }
    } else {
      console.log("No image URL available for INP preview")
      elementImage.innerHTML = '<div class="preview-placeholder">No preview available</div>'
    }
  }

  // Make the entire preview clickable
  const inpElementPreview = document.getElementById("inpElementPreview")
  if (inpElementPreview) {
    inpElementPreview.style.cursor = "pointer"
    inpElementPreview.title = "Click to highlight this element on the page"

    // Remove existing click handlers
    inpElementPreview.replaceWith(inpElementPreview.cloneNode(true))
    const newPreview = document.getElementById("inpElementPreview")

    newPreview.addEventListener("click", () => {
      highlightINPElementOnPage()
    })
  }
}

/**
 * Highlights the INP element on the page
 */
async function highlightINPElementOnPage() {
  console.log("highlightINPElementOnPage called")

  const inpElementPreview = document.getElementById("inpElementPreview")

  try {
    // Use the improved getTargetTabId function that auto-detects mode
    const targetTabId = await getTargetTabId()
    console.log("Target tab ID for INP highlighting:", targetTabId)

    if (!targetTabId) {
      console.log("No target tab available for INP highlighting")
      if (inpElementPreview) {
        showElementFeedback(inpElementPreview, "error")
      }
      return false
    }

    // Show immediate feedback
    if (inpElementPreview) {
      showElementFeedback(inpElementPreview, "success")
    }

    const response = await sendMessageToContentScript(targetTabId, {
      action: "highlightINPElement",
    })

    console.log("INP highlight response:", response)
    return !!response
  } catch (error) {
    console.error("Error highlighting INP element:", error)
    if (inpElementPreview) {
      showElementFeedback(inpElementPreview, "error")
    }
    return false
  }
}

/**
 * Highlights the CLS element on the page
 */
async function highlightCLSElementOnPage() {
  console.log("highlightCLSElementOnPage called")

  const clsElementPreview = document.getElementById("clsElementPreview")

  try {
    // Use the improved getTargetTabId function that auto-detects mode
    const targetTabId = await getTargetTabId()
    console.log("Target tab ID for CLS highlighting:", targetTabId)

    if (!targetTabId) {
      console.log("No target tab available for CLS highlighting")
      if (clsElementPreview) {
        showElementFeedback(clsElementPreview, "error")
      }
      return false
    }

    // Show immediate feedback
    if (clsElementPreview) {
      showElementFeedback(clsElementPreview, "success")
    }

    const response = await sendMessageToContentScript(targetTabId, {
      action: "highlightCLSElement",
    })

    console.log("CLS highlight response:", response)
    return !!response
  } catch (error) {
    console.error("Error highlighting CLS element:", error)
    if (clsElementPreview) {
      showElementFeedback(clsElementPreview, "error")
    }
    return false
  }
}

/**
 * Highlights the LCP element on the page
 */
async function highlightLCPElementOnPage() {
  console.log("highlightLCPElementOnPage called")

  const lcpElementPreview = document.getElementById("lcpElementPreview")

  try {
    // Use the improved getTargetTabId function that auto-detects mode
    const targetTabId = await getTargetTabId()
    console.log("Target tab ID for LCP highlighting:", targetTabId)

    if (!targetTabId) {
      console.log("No target tab available for LCP highlighting")
      if (lcpElementPreview) {
        showElementFeedback(lcpElementPreview, "error")
      }
      return false
    }

    // Show immediate feedback
    if (lcpElementPreview) {
      showElementFeedback(lcpElementPreview, "success")
    }

    const response = await sendMessageToContentScript(targetTabId, {
      action: "highlightLCPElement",
    })

    console.log("LCP highlight response:", response)
    return !!response
  } catch (error) {
    console.error("Error highlighting LCP element:", error)
    if (lcpElementPreview) {
      showElementFeedback(lcpElementPreview, "error")
    }
    return false
  }
}

/**
 * Updates threshold indicators with correct Core Web Vitals ranges
 * Now supports combination indicators when values are close (within tolerance)
 */
function updateMetricThresholds(metric, value, isField = false, isLab = false) {
  const threshold = THRESHOLDS[metric]
  if (!threshold || value === null || value === undefined) return

  const bar = document.querySelector(`.${metric}-bar`)
  if (!bar) return

  // Calculate position based on threshold ranges
  let percentage = 0
  const maxValue = threshold.needsImprovement * 2 // Extended range for visualization

  if (metric === "cls") {
    // CLS uses different scale (0-1 range)
    percentage = Math.min((value / 0.5) * 100, 100)
  } else {
    // Time-based metrics (ms)
    percentage = Math.min((value / maxValue) * 100, 100)
  }

  // Determine indicator type and data label
  let dataType = "local"
  let dataLabel = "Local"

  if (isLab) {
    dataType = "lab"
    dataLabel = "Lab"
  } else if (isField) {
    dataType = "field"
    dataLabel = "Field"
  }

  // Get current metric values for combination checking
  const localValue = insightsState.metrics[metric].local
  const fieldValue = insightsState.metrics[metric].field
  const labValue = insightsState.metrics[metric].lab

  // Define tolerance for "close enough" values (0% to 0.1% tolerance)
  const tolerance = calculateTolerance(metric, value)

  // Check for matching values within tolerance
  const localFieldMatch = localValue !== null && fieldValue !== null && Math.abs(localValue - fieldValue) <= tolerance
  const localLabMatch = localValue !== null && labValue !== null && Math.abs(localValue - labValue) <= tolerance
  const fieldLabMatch = fieldValue !== null && labValue !== null && Math.abs(fieldValue - labValue) <= tolerance
  const allMatch =
    localValue !== null && fieldValue !== null && labValue !== null && localFieldMatch && localLabMatch && fieldLabMatch

  // Remove all existing indicators for this metric to avoid duplicates
  const existingIndicators = bar.querySelectorAll(".threshold-indicator")
  existingIndicators.forEach((indicator) => indicator.remove())

  // Create indicators based on combinations and individual values
  const indicatorsToCreate = new Set()

  if (allMatch) {
    // All three sources match - show single combination indicator
    const indicator = document.createElement("div")
    indicator.className = `threshold-indicator all-sources-indicator`
    indicator.style.left = `${percentage}%`
    indicator.setAttribute("data-type", "all-sources-indicator")
    indicator.setAttribute("data-metric", metric)
    indicator.setAttribute("data-value", value)
    indicator.setAttribute("data-position", percentage.toFixed(2))
    indicator.title = `All Sources Match: ${formatMetricValue(metric, value)}`
    bar.appendChild(indicator)
    console.log(`Added all-sources combination indicator for ${metric} at ${percentage}%`)
  } else {
    // Handle partial matches and individual indicators
    if (localFieldMatch && localValue !== null && fieldValue !== null) {
      // Local and Field match - create combination indicator
      const localPercentage = calculateIndicatorPosition(metric, localValue)
      const indicator = document.createElement("div")
      indicator.className = `threshold-indicator local-field-indicator`
      indicator.style.left = `${localPercentage}%`
      indicator.setAttribute("data-type", "local-field-indicator")
      indicator.setAttribute("data-metric", metric)
      indicator.setAttribute("data-value", localValue)
      indicator.setAttribute("data-position", localPercentage.toFixed(2))
      indicator.title = `Local + Field Match: ${formatMetricValue(metric, localValue)}`
      bar.appendChild(indicator)

      // Add lab indicator separately if it exists and doesn't match
      if (labValue !== null && !localLabMatch) {
        createIndividualIndicator(bar, metric, labValue, "lab", "Lab")
      }
    } else if (localLabMatch && localValue !== null && labValue !== null) {
      // Local and Lab match - create combination indicator
      const localPercentage = calculateIndicatorPosition(metric, localValue)
      const indicator = document.createElement("div")
      indicator.className = `threshold-indicator local-lab-indicator`
      indicator.style.left = `${localPercentage}%`
      indicator.setAttribute("data-type", "local-lab-indicator")
      indicator.setAttribute("data-metric", metric)
      indicator.setAttribute("data-value", localValue)
      indicator.setAttribute("data-position", localPercentage.toFixed(2))
      indicator.title = `Local + Lab Match: ${formatMetricValue(metric, localValue)}`
      bar.appendChild(indicator)

      // Add field indicator separately if it exists and doesn't match
      if (fieldValue !== null && !localFieldMatch) {
        createIndividualIndicator(bar, metric, fieldValue, "field", "Field")
      }
    } else if (fieldLabMatch && fieldValue !== null && labValue !== null) {
      // Field and Lab match - create combination indicator
      const fieldPercentage = calculateIndicatorPosition(metric, fieldValue)
      const indicator = document.createElement("div")
      indicator.className = `threshold-indicator field-lab-indicator`
      indicator.style.left = `${fieldPercentage}%`
      indicator.setAttribute("data-type", "field-lab-indicator")
      indicator.setAttribute("data-metric", metric)
      indicator.setAttribute("data-value", fieldValue)
      indicator.setAttribute("data-position", fieldPercentage.toFixed(2))
      indicator.title = `Field + Lab Match: ${formatMetricValue(metric, fieldValue)}`
      bar.appendChild(indicator)

      // Add local indicator separately if it exists and doesn't match
      if (localValue !== null && !localFieldMatch) {
        createIndividualIndicator(bar, metric, localValue, "local", "Local")
      }
    } else {
      // No matches - create individual indicators for all available sources
      if (localValue !== null) {
        createIndividualIndicator(bar, metric, localValue, "local", "Local")
      }
      if (fieldValue !== null) {
        createIndividualIndicator(bar, metric, fieldValue, "field", "Field")
      }
      if (labValue !== null && (metric === "cls" || metric === "lcp")) {
        createIndividualIndicator(bar, metric, labValue, "lab", "Lab")
      }
    }
  }

  // Smart positioning logic for multiple indicators
  const allIndicators = bar.querySelectorAll(".threshold-indicator")
  if (allIndicators.length > 1) {
    bar.classList.add("multiple-indicators")
    positionIndicatorsIntelligently(bar, allIndicators)
  } else {
    bar.classList.remove("multiple-indicators")
  }
}

/**
 * Calculate tolerance based on metric type and value
 * 0% to 0.1% tolerance as requested
 */
function calculateTolerance(metric, value) {
  if (metric === "cls") {
    // For CLS, 0.1% of typical range (0-0.5)
    return Math.max(0.0005, value * 0.001) // Minimum 0.0005, or 0.1% of value
  } else {
    // For time-based metrics, 0.1% of value with minimum 1ms
    return Math.max(1, value * 0.001) // Minimum 1ms, or 0.1% of value
  }
}

/**
 * Calculate indicator position on the threshold bar
 */
function calculateIndicatorPosition(metric, value) {
  const threshold = THRESHOLDS[metric]
  if (!threshold) return 0

  const maxValue = threshold.needsImprovement * 2

  if (metric === "cls") {
    return Math.min((value / 0.5) * 100, 100)
  } else {
    return Math.min((value / maxValue) * 100, 100)
  }
}

/**
 * Create individual indicator for a specific data source
 */
function createIndividualIndicator(bar, metric, value, dataType, dataLabel) {
  const threshold = THRESHOLDS[metric]
  if (!threshold) return

  // Calculate position
  let percentage = 0
  const maxValue = threshold.needsImprovement * 2

  if (metric === "cls") {
    percentage = Math.min((value / 0.5) * 100, 100)
  } else {
    percentage = Math.min((value / maxValue) * 100, 100)
  }

  const indicator = document.createElement("div")
  indicator.className = `threshold-indicator ${dataType}-indicator`
  indicator.style.left = `${percentage}%`
  indicator.setAttribute("data-type", dataType)
  indicator.setAttribute("data-metric", metric)
  indicator.setAttribute("data-value", value)
  indicator.setAttribute("data-position", percentage.toFixed(2))
  indicator.title = `${dataLabel}: ${formatMetricValue(metric, value)}`

  bar.appendChild(indicator)
}

/**
 * Intelligently positions indicators to handle overlaps and same-position stacking
 */
function positionIndicatorsIntelligently(bar, indicators) {
  // Group indicators by position (within 1% tolerance for same position)
  const positionGroups = new Map()

  indicators.forEach((indicator) => {
    const position = Number.parseFloat(indicator.getAttribute("data-position"))
    let foundGroup = false

    // Check if this position is close to any existing group
    for (const [groupPos, group] of positionGroups) {
      if (Math.abs(position - groupPos) <= 1) {
        group.push(indicator)
        foundGroup = true
        break
      }
    }

    if (!foundGroup) {
      positionGroups.set(position, [indicator])
    }
  })

  // Position indicators within each group
  positionGroups.forEach((group, position) => {
    if (group.length === 1) {
      // Single indicator - normal positioning
      const indicator = group[0]
      indicator.style.left = `${position}%`
      indicator.style.top = "-5px" // Updated position
      indicator.style.zIndex = "10"
    } else {
      // Multiple indicators at same position - stack them
      group.forEach((indicator, index) => {
        const dataType = indicator.getAttribute("data-type")

        // Vertical stacking with slight horizontal offset for visibility
        const verticalOffset = index * 8 // 8px vertical spacing
        const horizontalOffset = index * 2 // 2px horizontal offset for better visibility

        indicator.style.left = `calc(${position}% + ${horizontalOffset}px)`
        indicator.style.top = `${-5 - verticalOffset}px` // Updated position
        indicator.style.zIndex = `${15 + index}` // Higher z-index for stacked items

        // Add stacked class for special styling
        indicator.classList.add("stacked-indicator")
      })
    }
  })
}

// Initialize PSI button when the module loads
document.addEventListener("DOMContentLoaded", () => {
  setupPSIAnalyzeButton()
})

// Also export the setup function so it can be called from other modules
export { setupPSIAnalyzeButton, resetDataAvailability }

// Export the state management function
export { updateInsightsState }

// Ensure PSI button is set up when module loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupPSIAnalyzeButton)
} else {
  setupPSIAnalyzeButton()
}