// Import performance monitoring modules
import { initializeCLSMonitoring, getCurrentCLSData, highlightCLSElement } from "./performance/cls-monitor.js"
import { initializeLCPMonitoring, getCurrentLCPData, highlightLCPElement } from "./performance/lcp-monitor.js"
import { initializeINPMonitoring, getCurrentINPData } from "./performance/inp-monitor.js"
import { initializeAdditionalMetrics, getCurrentAdditionalMetrics } from "./performance/additional-metrics.js"

// Import analyzer modules
import { getPreloadedImages, highlightImageOnPage } from "./analyzers/image-analyzer.js"
import { getLoadedAndPreloadedFonts } from "./analyzers/font-analyzer.js"
import { analyzePSIData } from "./analyzers/psi-analyzer.js"

// Import utilities
import { safeSendMessage } from "../utils/messaging.js"

// Declare chrome variable to avoid undeclared variable error

console.log("=== CONTENT SCRIPT STARTING ===")
console.log("URL:", window.location.href)
console.log("Domain:", window.location.hostname)

/**
 * Checks if the extension should run on the current domain
 * @returns {boolean} True if the extension should run
 */
function shouldRunOnDomain() {
  const excludedDomains = ["portal.bigscoots.com", "wpo-admin.bigscoots.com", "wpo.bigscoots.com"]

  // Check exact domain matches
  if (excludedDomains.some((domain) => window.location.hostname === domain)) {
    console.log("Domain excluded:", window.location.hostname)
    return false
  }

  // Check if domain ends with bigscoots-wpo.com
  if (window.location.hostname.endsWith("bigscoots-wpo.com")) {
    console.log("BigScoots WPO domain excluded:", window.location.hostname)
    return false
  }

  console.log("Domain allowed:", window.location.hostname)
  return true
}

/**
 * Gets headers from the current page
 * @returns {Promise<Object>} Headers object
 */
function getHeaders() {
  console.log("Fetching headers...")
  return fetch(window.location.href, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  })
    .then((response) => {
      console.log("Headers response received")
      const headers = {}
      ;[
        "x-bigscoots-cache-status",
        "cf-cache-status",
        "x-hosted-by",
        "x-bigscoots-cache-plan",
        "content-encoding",
        "x-bigscoots-cache-mode",
        "x-ezoic-cdn",
        "x-np-cfe",
      ].forEach((header) => {
        headers[header] = response.headers.get(header) || "N/A"
      })

      headers["x-bigscoots-cache-mode (O2O)"] = headers["x-bigscoots-cache-mode"] !== "N/A" ? "Enabled" : "Disabled"
      headers["x-np-cfe"] = headers["x-np-cfe"] !== "N/A" ? "Nerdpress active" : headers["x-np-cfe"]

      console.log("Headers processed:", headers)
      return headers
    })
    .catch((error) => {
      console.error("Error fetching headers:", error)
      return {}
    })
}

/**
 * Analyzes the page source code for various optimizations
 * @returns {Object} Source code analysis results
 */
function analyzeSourceCode() {
  console.log("Analyzing source code...")
  const html = document.documentElement.outerHTML
  const perfmattersRUCSS = html.includes("data-pmdelayedstyle") ? "enabled" : "disabled"
  const perfmattersDelayJS = html.includes("pmdelayedscript") ? "enabled" : "disabled"

  const patterns = {
    gtm: /GTM-\w+/g,
    ua: /UA-\d+-\d+/g,
    ga4: /G-[A-Z0-9]{9,}/g,
    ga: /GA-[A-Z0-9]+/g,
  }

  const matches = Object.fromEntries(
    Object.entries(patterns).map(([key, pattern]) => [key, [...new Set(html.match(pattern) || [])]]),
  )

  const result = {
    perfmattersRUCSS,
    perfmattersDelayJS,
    gtm: matches.gtm.join(", "),
    ua: matches.ua.join(", "),
    ga4: matches.ga4.join(", "),
    ga: matches.ga.join(", "),
    adProvider: detectAdProvider(),
  }

  console.log("Source code analysis complete:", result)
  return result
}

/**
 * Detects ad providers on the page
 * @returns {string} Detected ad provider or "None detected"
 */
function detectAdProvider() {
  const html = document.documentElement.outerHTML
  const scripts = Array.from(document.scripts).map((script) => script.src)

  const adProviders = {
    Mediavine: {
      domains: ["scripts.mediavine.com", "ads.mediavine.com"],
      patterns: ["window.mediavineDomain", "__mediavineMachine"],
      enabled: false,
    },
    "AdThrive/Raptive": {
      domains: ["ads.adthrive.com", "cdn.adthrive.com"],
      patterns: ["window.adthrive", "adthrive.config"],
      enabled: false,
    },
    Ezoic: {
      domains: ["www.ezojs.com", "ezoic.com", "ezoic.net"],
      patterns: ["ezstandalone", "ez_ad_units"],
      enabled: false,
    },
    "Google AdSense": {
      domains: ["pagead2.googlesyndication.com", "adsbygoogle"],
      patterns: ["adsbygoogle.push", "(adsbygoogle"],
      enabled: false,
    },
  }

  Object.keys(adProviders).forEach((provider) => {
    const hasDomain = adProviders[provider].domains.some((domain) => scripts.some((src) => src && src.includes(domain)))
    const hasPattern = adProviders[provider].patterns.some((pattern) => html.includes(pattern))
    if (hasDomain || hasPattern) {
      adProviders[provider].enabled = true
    }
  })

  const detectedProviders = Object.keys(adProviders).filter((provider) => adProviders[provider].enabled)
  return detectedProviders.join(", ") || "None detected"
}

/**
 * Highlights the INP element on the page
 * @returns {boolean} Success status
 */
function highlightINPElement() {
  console.log("highlightINPElement called")

  try {
    const inpData = getCurrentINPData()
    console.log("Current INP data:", inpData)

    if (!inpData.entries || inpData.entries.length === 0) {
      console.log("No INP entries available for highlighting")
      return false
    }

    // Get the latest (highest INP) entry
    const latestEntry = inpData.entries[0]
    console.log("Latest INP entry:", latestEntry)

    if (!latestEntry.element || !latestEntry.element.selector) {
      console.log("No element selector available for highlighting")
      return false
    }

    // Try to find the element using the selector
    let targetElement = null
    try {
      targetElement = document.querySelector(latestEntry.element.selector)
    } catch (error) {
      console.log("Error with selector, trying alternative methods:", error)
    }

    // Fallback: try to find by ID or class
    if (!targetElement && latestEntry.element.id) {
      targetElement = document.getElementById(latestEntry.element.id)
    }

    if (!targetElement && latestEntry.element.classList && latestEntry.element.classList.length > 0) {
      targetElement = document.querySelector(`.${latestEntry.element.classList[0]}`)
    }

    if (!targetElement) {
      console.log("Could not find INP element to highlight")
      return false
    }

    console.log("Found INP element to highlight:", targetElement)

    // Create highlight overlay
    const highlight = document.createElement("div")
    highlight.id = "bigscoots-inp-highlight"
    highlight.style.cssText = `
      position: fixed !important;
      pointer-events: none !important;
      z-index: 999999 !important;
      border: 3px solid #ff6b35 !important;
      background: rgba(255, 107, 53, 0.1) !important;
      border-radius: 4px !important;
      box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.3) !important;
      transition: all 0.3s ease !important;
    `

    // Position the highlight
    const rect = targetElement.getBoundingClientRect()
    highlight.style.left = `${rect.left - 3}px`
    highlight.style.top = `${rect.top - 3}px`
    highlight.style.width = `${rect.width + 6}px`
    highlight.style.height = `${rect.height + 6}px`

    // Remove any existing highlights
    const existingHighlight = document.getElementById("bigscoots-inp-highlight")
    if (existingHighlight) {
      existingHighlight.remove()
    }

    // Add the highlight
    document.body.appendChild(highlight)

    // Scroll element into view
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    })

    // Add pulsing animation
    let pulseCount = 0
    const pulseInterval = setInterval(() => {
      if (pulseCount >= 6) {
        clearInterval(pulseInterval)
        return
      }

      highlight.style.transform = pulseCount % 2 === 0 ? "scale(1.05)" : "scale(1)"
      pulseCount++
    }, 300)

    // Remove highlight after 3 seconds
    setTimeout(() => {
      if (highlight && highlight.parentNode) {
        highlight.remove()
      }
    }, 3000)

    console.log("INP element highlighted successfully")
    return true
  } catch (error) {
    console.error("Error highlighting INP element:", error)
    return false
  }
}

/**
 * Runs the main analysis of the page
 */
async function runAnalysis() {
  console.log("=== STARTING PAGE ANALYSIS ===")

  if (!shouldRunOnDomain()) {
    console.log("Extension should not run on this domain, exiting")
    return
  }

  console.log("Initializing performance monitoring...")
  // Initialize performance monitoring
  initializeCLSMonitoring()
  initializeLCPMonitoring()
  initializeINPMonitoring()
  initializeAdditionalMetrics()

  console.log("Running analysis promises...")
  // Run analysis
  try {
    const [images, fonts, headers, sourceCodeInfo] = await Promise.all([
      getPreloadedImages(),
      getLoadedAndPreloadedFonts(),
      getHeaders(),
      Promise.resolve(analyzeSourceCode()),
    ])

    console.log("Analysis results:")
    console.log("- Images:", images.length)
    console.log("- Fonts:", fonts.length)
    console.log("- Headers:", Object.keys(headers).length)
    console.log("- Source code info:", sourceCodeInfo)

    const analysisData = {
      images,
      fonts,
      headers: { ...headers, ...sourceCodeInfo },
      cls: getCurrentCLSData(),
      lcp: getCurrentLCPData(),
      inp: getCurrentINPData(),
      additionalMetrics: getCurrentAdditionalMetrics(),
    }

    console.log("Sending analysis results to background...")
    safeSendMessage({
      action: "analysisResults",
      ...analysisData,
    })

    console.log("Sending badge update...")
    safeSendMessage({
      action: "updateBadge",
      hostedBy: headers["x-hosted-by"] || "N/A",
      cacheStatus: headers["x-bigscoots-cache-status"] || headers["cf-cache-status"] || "N/A",
    })

    console.log("=== PAGE ANALYSIS COMPLETE ===")
  } catch (error) {
    console.error("Error during analysis:", error)
  }
}

// Initialize the extension
console.log("Starting content script initialization...")
runAnalysis()

// Set up message listener with proper async handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request.action)

  // Handle ping requests to verify content script is ready
  if (request.action === "ping") {
    console.log("Content script ping received - responding immediately")
    sendResponse({ ready: true })
    return false // Synchronous response, don't keep channel open
  }

  if (request.action === "getCurrentPerformanceData") {
    const data = {
      cls: getCurrentCLSData(),
      lcp: getCurrentLCPData(),
      inp: getCurrentINPData(),
      additionalMetrics: getCurrentAdditionalMetrics(),
    }
    console.log("Sending current performance data:", data)
    sendResponse(data)
    return false // Synchronous response
  } else if (request.action === "highlightImage") {
    const success = highlightImageOnPage(request.imageUrl)
    sendResponse({ success })
    return false // Synchronous response
  } else if (request.action === "highlightLCPElement") {
    const success = highlightLCPElement()
    sendResponse({ success })
    return false // Synchronous response
  } else if (request.action === "highlightCLSElement") {
    const success = highlightCLSElement()
    sendResponse({ success })
    return false // Synchronous response
  } else if (request.action === "highlightINPElement") {
    const success = highlightINPElement()
    sendResponse({ success })
    return false // Synchronous response
  } else if (request.action === "requestAnalysis") {
    console.log("Fresh analysis requested")
    // Re-run the analysis when requested
    runAnalysis()
    sendResponse({ success: true })
    return false // Synchronous response
  } else if (request.action === "analyzePSI") {
    // Handle PSI analysis request - this is async
    console.log("Received PSI analysis request")

    // Execute PSI analysis asynchronously
    const handlePSIAnalysis = async () => {
      try {
        console.log("Starting PSI analysis...")
        const success = await analyzePSIData()
        console.log("PSI analysis completed:", success)
        sendResponse({ success: true })
      } catch (error) {
        console.error("PSI analysis error:", error)
        sendResponse({ success: false, error: error.message })
      }
    }

    // Start the async operation
    handlePSIAnalysis()

    return true // Keep message channel open for async response
  }

  return false // Don't keep channel open for unhandled messages
})

console.log("=== CONTENT SCRIPT SETUP COMPLETE ===")
