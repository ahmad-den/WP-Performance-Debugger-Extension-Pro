/**
 * PageSpeed Insights API analyzer - Enhanced for all Core Web Vitals
 */

import { safeSendMessage } from "../../utils/messaging.js"

// PSI API configuration
const PSI_API_BASE_URL = "https://psi-api-worker-staging.cache-warmer-getjoinus.workers.dev/"

/**
 * Fetches PageSpeed Insights data for the current page
 * @returns {Promise<Object|null>} PSI data or null if failed
 */
export async function fetchPSIData() {
  try {
    const currentUrl = window.location.href
    const apiUrl = `${PSI_API_BASE_URL}?url=${encodeURIComponent(currentUrl)}`

    console.log("Fetching PSI data for:", currentUrl)

    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`PSI API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Handle API-level errors (when API returns error in response body)
    if (data.status === "failed" || data.status === "error") {
      const errorMessage = data.message || "Unknown error occurred"
      const errorDetails = data.error ? ` (${data.error.type}: ${data.error.code})` : ""
      throw new Error(`${errorMessage}${errorDetails}`)
    }

    if (data.status !== "success") {
      throw new Error(`PSI API error: ${data.message || "Unknown error"}`)
    }

    console.log("PSI data fetched successfully:", data)
    return data
  } catch (error) {
    console.error("Error fetching PSI data:", error)
    // Re-throw with a more user-friendly message if it's a generic error
    if (error.message.includes("[object Object]")) {
      throw new Error("Failed to analyze page with PageSpeed Insights. Please try again.")
    }
    throw error
  }
}

/**
 * Extracts all Core Web Vitals field data from PSI response
 * @param {Object} psiData - PSI API response data
 * @returns {Object|null} All CWV field data or null if not available
 */
export function extractAllFieldData(psiData) {
  try {
    if (!psiData || !psiData.data || !psiData.data.loadingExperience) {
      return null
    }

    const loadingExperience = psiData.data.loadingExperience
    const metrics = loadingExperience.metrics

    if (!metrics) {
      return null
    }

    const fieldData = {
      id: loadingExperience.id,
      overallCategory: loadingExperience.overall_category,
    }

    // Extract CLS data
    if (metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE) {
      fieldData.cls = {
        percentile: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile,
        category: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.category,
        distributions: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.distributions,
        // Convert percentile to actual CLS value (percentile is in hundredths)
        value: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100,
      }
    }

    // Extract LCP data
    if (metrics.LARGEST_CONTENTFUL_PAINT_MS) {
      fieldData.lcp = {
        percentile: metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile,
        category: metrics.LARGEST_CONTENTFUL_PAINT_MS.category,
        distributions: metrics.LARGEST_CONTENTFUL_PAINT_MS.distributions,
        value: metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile, // Already in ms
      }
    }

    // Extract INP data
    if (metrics.INTERACTION_TO_NEXT_PAINT) {
      fieldData.inp = {
        percentile: metrics.INTERACTION_TO_NEXT_PAINT.percentile,
        category: metrics.INTERACTION_TO_NEXT_PAINT.category,
        distributions: metrics.INTERACTION_TO_NEXT_PAINT.distributions,
        value: metrics.INTERACTION_TO_NEXT_PAINT.percentile, // Already in ms
      }
    }

    // Extract TTFB data
    if (metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE) {
      fieldData.ttfb = {
        percentile: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.percentile,
        category: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.category,
        distributions: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.distributions,
        value: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.percentile, // Already in ms
      }
    }

    // Extract FCP data (bonus metric)
    if (metrics.FIRST_CONTENTFUL_PAINT_MS) {
      fieldData.fcp = {
        percentile: metrics.FIRST_CONTENTFUL_PAINT_MS.percentile,
        category: metrics.FIRST_CONTENTFUL_PAINT_MS.category,
        distributions: metrics.FIRST_CONTENTFUL_PAINT_MS.distributions,
        value: metrics.FIRST_CONTENTFUL_PAINT_MS.percentile, // Already in ms
      }
    }

    return fieldData
  } catch (error) {
    console.error("Error extracting field data:", error)
    return null
  }
}

/**
 * Extracts Lab data from PSI response - Only CLS and LCP (TTFB not available in lab)
 * @param {Object} psiData - PSI API response data
 * @returns {Object|null} Lab data or null if not available
 */
export function extractLabData(psiData) {
  try {
    console.log("🧪 [PSI Lab] Attempting to extract lab data from:", psiData)

    // Check multiple possible paths for lab data in PSI response
    let metrics = null

    // Path 1: Direct metrics in data
    if (psiData?.data?.metrics) {
      metrics = psiData.data.metrics
      console.log("🧪 [PSI Lab] Found metrics in data.metrics:", metrics)
    }

    // Path 2: Lighthouse result audits (standard Lighthouse structure)
    else if (psiData?.data?.lighthouseResult?.audits) {
      const audits = psiData.data.lighthouseResult.audits
      console.log("🧪 [PSI Lab] Found lighthouse audits:", Object.keys(audits))

      // Convert audits to metrics format
      metrics = {}
      if (audits["cumulative-layout-shift"]) {
        metrics.CLS = audits["cumulative-layout-shift"]
      }
      if (audits["largest-contentful-paint"]) {
        metrics.LCP = audits["largest-contentful-paint"]
      }
      // Note: TTFB is not available in lab data as it's a server-side metric
    }

    // Path 3: Check if metrics are nested elsewhere
    else if (psiData?.data?.labData) {
      metrics = psiData.data.labData
      console.log("🧪 [PSI Lab] Found metrics in data.labData:", metrics)
    }

    if (!metrics) {
      console.log("🧪 [PSI Lab] No lab metrics found in PSI response")
      console.log("🧪 [PSI Lab] Available data keys:", Object.keys(psiData?.data || {}))
      return null
    }

    const labData = {}

    // Extract CLS lab data
    if (metrics.CLS) {
      labData.cls = {
        numericValue: metrics.CLS.numericValue,
        displayValue: metrics.CLS.displayValue,
        score: metrics.CLS.score,
        value: metrics.CLS.numericValue, // Use numericValue as the main value
      }
      console.log("🧪 [PSI Lab] Extracted CLS lab data:", labData.cls)
    }

    // Extract LCP lab data
    if (metrics.LCP) {
      labData.lcp = {
        numericValue: metrics.LCP.numericValue,
        displayValue: metrics.LCP.displayValue,
        score: metrics.LCP.score,
        value: metrics.LCP.numericValue, // Use numericValue as the main value
      }
      console.log("🧪 [PSI Lab] Extracted LCP lab data:", labData.lcp)
    }

    // Note: TTFB is intentionally excluded from lab data as it's not available in Lighthouse lab environment

    console.log("🧪 [PSI Lab] Final extracted lab data (CLS & LCP only):", labData)
    return Object.keys(labData).length > 0 ? labData : null
  } catch (error) {
    console.error("🧪 [PSI Lab] Error extracting lab data:", error)
    return null
  }
}

/**
 * Analyzes PSI data and sends to popup - Enhanced for all CWV with proper error handling
 * @returns {Promise<boolean>} Success status
 */
export async function analyzePSIData() {
  try {
    // Show loading state
    safeSendMessage({
      action: "updatePSIStatus",
      status: "loading",
      message: "Fetching PageSpeed Insights data...",
    })

    const psiData = await fetchPSIData()

    console.log("🔍 [PSI API] RAW API Response:", JSON.stringify(psiData, null, 2))

    // Extract all field data and lab data
    const allFieldData = extractAllFieldData(psiData)
    const labData = extractLabData(psiData)

    console.log("🌍 [PSI] Extracted field data:", allFieldData)
    console.log("🧪 [PSI] Extracted lab data:", labData)

    // Store PSI data in background for persistence
    safeSendMessage({
      action: "storePSIResults",
      psiData: {
        allFieldData: allFieldData,
        labData: labData,
        timestamp: Date.now(),
        url: window.location.href,
        rawData: psiData.data, // Store raw data for future use
      },
    })

    // Send complete PSI data for insights processing
    safeSendMessage({
      action: "completePSIResults",
      psiData: psiData,
    })

    // Send individual field metric updates
    if (allFieldData) {
      // Update CLS
      if (allFieldData.cls) {
        safeSendMessage({
          action: "updatePSICLS",
          fieldData: allFieldData.cls,
          status: "success",
        })
      }

      // Update LCP
      if (allFieldData.lcp) {
        safeSendMessage({
          action: "updatePSILCP",
          fieldData: allFieldData.lcp,
          status: "success",
        })
      }

      // Update INP
      if (allFieldData.inp) {
        safeSendMessage({
          action: "updatePSIINP",
          fieldData: allFieldData.inp,
          status: "success",
        })
      }

      // Update TTFB
      if (allFieldData.ttfb) {
        safeSendMessage({
          action: "updatePSITTFB",
          fieldData: allFieldData.ttfb,
          status: "success",
        })
      }
    }

    // Send individual lab metric updates (only CLS and LCP available in lab)
    if (labData) {
      console.log("🧪 [PSI] Sending lab data updates:", labData)

      // Update CLS Lab
      if (labData.cls) {
        console.log("🧪 [PSI] Sending CLS lab update:", labData.cls)
        safeSendMessage({
          action: "updatePSILabCLS",
          labData: labData.cls,
          status: "success",
        })
      }

      // Update LCP Lab
      if (labData.lcp) {
        console.log("🧪 [PSI] Sending LCP lab update:", labData.lcp)
        safeSendMessage({
          action: "updatePSILabLCP",
          labData: labData.lcp,
          status: "success",
        })
      }

      // Note: TTFB lab data is not sent as it's not available in Lighthouse lab environment
    } else {
      console.log("🧪 [PSI] No lab data available to send")
    }

    // Send success status LAST to ensure button updates correctly
    safeSendMessage({
      action: "updatePSIStatus",
      status: "success",
      message: "PSI data loaded successfully",
    })

    console.log("✅ [PSI] Analysis completed successfully")
    return true
  } catch (error) {
    console.error("Error analyzing PSI data:", error)

    // Extract user-friendly error message
    let userMessage = "Analysis failed. Please try again."
    if (error.message) {
      // Check for specific error types
      if (error.message.includes("hosting requirements")) {
        userMessage = "This site doesn't meet hosting requirements for analysis."
      } else if (error.message.includes("403")) {
        userMessage = "Access denied. Site may not be eligible for analysis."
      } else if (error.message.includes("404")) {
        userMessage = "Page not found or not accessible for analysis."
      } else if (error.message.includes("500")) {
        userMessage = "Server error occurred. Please try again later."
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        userMessage = "Network error. Please check your connection and try again."
      } else {
        // Use the error message if it's user-friendly
        userMessage = error.message
      }
    }

    safeSendMessage({
      action: "updatePSIStatus",
      status: "error",
      message: `Error analyzing PSI data: ${error.message}`,
      userMessage: userMessage,
    })
    return false
  }
}
