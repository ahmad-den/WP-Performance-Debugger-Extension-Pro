/**
 * Module for handling PSI Insights display in the popup
 */

// Chrome API is available globally in extension context
const chrome = globalThis.chrome || window.chrome

import { insightsRenderer } from "./insights-renderer.js"

/**
 * PSI Insights state management
 */
const psiInsightsState = {
  insights: {},
  lastUpdate: null,
  isLoading: false,
  hasError: false,
  errorMessage: "",
}

/**
 * Updates PSI insights display with data from PSI API
 * @param {Object} psiData - Complete PSI API response data
 */
export function updatePSIInsightsDisplay(psiData) {
  console.log("=== updatePSIInsightsDisplay called ===")
  console.log("PSI Data received:", psiData)

  try {
    // Extract insights from PSI data structure
    const insights = extractPSIInsights(psiData)

    if (!insights || Object.keys(insights).length === 0) {
      console.log("No PSI insights found in data")
      showEmptyInsightsState()
      return
    }

    console.log("Extracted PSI insights:", insights)

    // Update state
    psiInsightsState.insights = insights
    psiInsightsState.lastUpdate = Date.now()
    psiInsightsState.isLoading = false
    psiInsightsState.hasError = false

    // Update UI
    displayPSIInsights(insights)
  } catch (error) {
    console.error("Error updating PSI insights display:", error)
    psiInsightsState.hasError = true
    psiInsightsState.errorMessage = error.message
    psiInsightsState.isLoading = false
    showInsightsError(error.message)
  }
}

function extractPSIInsights(psiData) {
  console.log("=== extractPSIInsights called ===")

  try {
    // Navigate through the PSI data structure
    if (!psiData || !psiData.data) {
      console.log("No PSI data or data property found")
      return null
    }

    const lighthouseResult = psiData.data.lighthouseResult
    if (!lighthouseResult) {
      console.log("No lighthouseResult found in PSI data")
      return null
    }

    const audits = lighthouseResult.audits
    if (!audits) {
      console.log("No audits found in lighthouse result")
      return null
    }

    const allInsights = {}

    // Extract failed insights
    if (audits.failed && audits.failed.insights) {
      console.log("Found failed insights:", audits.failed.insights)
      Object.keys(audits.failed.insights).forEach((key) => {
        allInsights[key] = {
          ...audits.failed.insights[key],
          category: "failed",
          score: 0, // Failed insights have score of 0
        }
      })
    }

    // Extract warning insights
    if (audits.warnings && audits.warnings.insights) {
      console.log("Found warning insights:", audits.warnings.insights)
      Object.keys(audits.warnings.insights).forEach((key) => {
        allInsights[key] = {
          ...audits.warnings.insights[key],
          category: "warning",
          score: 0.7, // Warning insights have score between 0.5-0.89
        }
      })
    }

    console.log("Successfully extracted all insights:", allInsights)
    return Object.keys(allInsights).length > 0 ? allInsights : null
  } catch (error) {
    console.error("Error extracting PSI insights:", error)
    return null
  }
}

function displayPSIInsights(insights) {
  console.log("=== displayPSIInsights called ===")
  console.log("Displaying insights:", insights)

  const container = document.getElementById("psiInsightsContainer")
  if (!container) {
    console.log("PSI insights container not found in DOM")
    return
  }

  // Convert insights object to array format expected by renderer
  const insightsArray = Object.keys(insights).map((insightKey) => {
    const insightData = insights[insightKey]
    return {
      id: insightKey,
      title: insightData.title || insightKey,
      description: insightData.description,
      details: insightData.details,
      ...insightData,
    }
  })

  // Use the insights renderer to display the insights
  insightsRenderer.renderInsights(container, insightsArray)

  // Show the container
  container.style.display = "block"
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
  console.log("=== showEmptyInsightsState called ===")

  const container = document.getElementById("psiInsightsContainer")
  if (!container) return

  container.innerHTML = `
    <div class="psi-insights-empty">
      <p>No performance insights available</p>
      <small>Run PSI analysis to get detailed insights</small>
    </div>
  `
  container.style.display = "block"
}

/**
 * Shows error state for insights
 * @param {string} errorMessage - Error message to display
 */
function showInsightsError(errorMessage) {
  console.log("=== showInsightsError called ===")
  console.log("Error message:", errorMessage)

  const container = document.getElementById("psiInsightsContainer")
  if (!container) return

  container.innerHTML = `
    <div class="psi-insights-error">
      <p>Error loading insights: ${errorMessage}</p>
    </div>
  `
  container.style.display = "block"
}

/**
 * Clears PSI insights display
 */
export function clearPSIInsightsDisplay() {
  console.log("=== clearPSIInsightsDisplay called ===")

  const container = document.getElementById("psiInsightsContainer")
  if (container) {
    container.innerHTML = ""
    container.style.display = "none"
  }

  // Reset state
  psiInsightsState.insights = {}
  psiInsightsState.lastUpdate = null
  psiInsightsState.hasError = false
  psiInsightsState.errorMessage = ""
}

/**
 * Sets loading state for PSI insights
 * @param {boolean} isLoading - Loading state
 */
export function setPSIInsightsLoading(isLoading) {
  console.log("=== setPSIInsightsLoading called ===", isLoading)

  psiInsightsState.isLoading = isLoading

  const container = document.getElementById("psiInsightsContainer")
  if (!container) return

  if (isLoading) {
    container.innerHTML = `
      <div class="psi-insights-loading">
        <p>Loading performance insights...</p>
      </div>
    `
    container.style.display = "block"
  }
}

/**
 * Gets current PSI insights state
 * @returns {Object} Current insights state
 */
export function getPSIInsightsState() {
  return { ...psiInsightsState }
}
