/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 23:
/*!***********************************************!*\
  !*** ./src/content/analyzers/psi-analyzer.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   analyzePSIData: () => (/* binding */ analyzePSIData),
/* harmony export */   extractAllFieldData: () => (/* binding */ extractAllFieldData),
/* harmony export */   extractLabData: () => (/* binding */ extractLabData),
/* harmony export */   fetchPSIData: () => (/* binding */ fetchPSIData)
/* harmony export */ });
/* harmony import */ var _utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/messaging.js */ 272);
/**
 * PageSpeed Insights API analyzer - Enhanced for all Core Web Vitals
 */



// PSI API configuration
const PSI_API_BASE_URL = "https://psi-api-worker-staging.cache-warmer-getjoinus.workers.dev/";

/**
 * Fetches PageSpeed Insights data for the current page
 * @returns {Promise<Object|null>} PSI data or null if failed
 */
async function fetchPSIData() {
  try {
    const currentUrl = window.location.href;
    const apiUrl = `${PSI_API_BASE_URL}?url=${encodeURIComponent(currentUrl)}`;
    console.log("Fetching PSI data for:", currentUrl);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`PSI API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    // Handle API-level errors (when API returns error in response body)
    if (data.status === "failed" || data.status === "error") {
      const errorMessage = data.message || "Unknown error occurred";
      const errorDetails = data.error ? ` (${data.error.type}: ${data.error.code})` : "";
      throw new Error(`${errorMessage}${errorDetails}`);
    }
    if (data.status !== "success") {
      throw new Error(`PSI API error: ${data.message || "Unknown error"}`);
    }
    console.log("PSI data fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error fetching PSI data:", error);
    // Re-throw with a more user-friendly message if it's a generic error
    if (error.message.includes("[object Object]")) {
      throw new Error("Failed to analyze page with PageSpeed Insights. Please try again.");
    }
    throw error;
  }
}

/**
 * Extracts all Core Web Vitals field data from PSI response
 * @param {Object} psiData - PSI API response data
 * @returns {Object|null} All CWV field data or null if not available
 */
function extractAllFieldData(psiData) {
  try {
    if (!psiData || !psiData.data || !psiData.data.loadingExperience) {
      return null;
    }
    const loadingExperience = psiData.data.loadingExperience;
    const metrics = loadingExperience.metrics;
    if (!metrics) {
      return null;
    }
    const fieldData = {
      id: loadingExperience.id,
      overallCategory: loadingExperience.overall_category
    };

    // Extract CLS data
    if (metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE) {
      fieldData.cls = {
        percentile: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile,
        category: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.category,
        distributions: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.distributions,
        // Convert percentile to actual CLS value (percentile is in hundredths)
        value: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
      };
    }

    // Extract LCP data
    if (metrics.LARGEST_CONTENTFUL_PAINT_MS) {
      fieldData.lcp = {
        percentile: metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile,
        category: metrics.LARGEST_CONTENTFUL_PAINT_MS.category,
        distributions: metrics.LARGEST_CONTENTFUL_PAINT_MS.distributions,
        value: metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile // Already in ms
      };
    }

    // Extract INP data
    if (metrics.INTERACTION_TO_NEXT_PAINT) {
      fieldData.inp = {
        percentile: metrics.INTERACTION_TO_NEXT_PAINT.percentile,
        category: metrics.INTERACTION_TO_NEXT_PAINT.category,
        distributions: metrics.INTERACTION_TO_NEXT_PAINT.distributions,
        value: metrics.INTERACTION_TO_NEXT_PAINT.percentile // Already in ms
      };
    }

    // Extract TTFB data
    if (metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE) {
      fieldData.ttfb = {
        percentile: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.percentile,
        category: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.category,
        distributions: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.distributions,
        value: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.percentile // Already in ms
      };
    }

    // Extract FCP data (bonus metric)
    if (metrics.FIRST_CONTENTFUL_PAINT_MS) {
      fieldData.fcp = {
        percentile: metrics.FIRST_CONTENTFUL_PAINT_MS.percentile,
        category: metrics.FIRST_CONTENTFUL_PAINT_MS.category,
        distributions: metrics.FIRST_CONTENTFUL_PAINT_MS.distributions,
        value: metrics.FIRST_CONTENTFUL_PAINT_MS.percentile // Already in ms
      };
    }
    return fieldData;
  } catch (error) {
    console.error("Error extracting field data:", error);
    return null;
  }
}

/**
 * Extracts Lab data from PSI response - Only CLS and LCP (TTFB not available in lab)
 * @param {Object} psiData - PSI API response data
 * @returns {Object|null} Lab data or null if not available
 */
function extractLabData(psiData) {
  try {
    var _psiData$data, _psiData$data2, _psiData$data3;
    console.log("🧪 [PSI Lab] Attempting to extract lab data from:", psiData);

    // Check multiple possible paths for lab data in PSI response
    let metrics = null;

    // Path 1: Direct metrics in data
    if (psiData !== null && psiData !== void 0 && (_psiData$data = psiData.data) !== null && _psiData$data !== void 0 && _psiData$data.metrics) {
      metrics = psiData.data.metrics;
      console.log("🧪 [PSI Lab] Found metrics in data.metrics:", metrics);
    }

    // Path 2: Lighthouse result audits (standard Lighthouse structure)
    else if (psiData !== null && psiData !== void 0 && (_psiData$data2 = psiData.data) !== null && _psiData$data2 !== void 0 && (_psiData$data2 = _psiData$data2.lighthouseResult) !== null && _psiData$data2 !== void 0 && _psiData$data2.audits) {
      const audits = psiData.data.lighthouseResult.audits;
      console.log("🧪 [PSI Lab] Found lighthouse audits:", Object.keys(audits));

      // Convert audits to metrics format
      metrics = {};
      if (audits["cumulative-layout-shift"]) {
        metrics.CLS = audits["cumulative-layout-shift"];
      }
      if (audits["largest-contentful-paint"]) {
        metrics.LCP = audits["largest-contentful-paint"];
      }
      // Note: TTFB is not available in lab data as it's a server-side metric
    }

    // Path 3: Check if metrics are nested elsewhere
    else if (psiData !== null && psiData !== void 0 && (_psiData$data3 = psiData.data) !== null && _psiData$data3 !== void 0 && _psiData$data3.labData) {
      metrics = psiData.data.labData;
      console.log("🧪 [PSI Lab] Found metrics in data.labData:", metrics);
    }
    if (!metrics) {
      console.log("🧪 [PSI Lab] No lab metrics found in PSI response");
      console.log("🧪 [PSI Lab] Available data keys:", Object.keys((psiData === null || psiData === void 0 ? void 0 : psiData.data) || {}));
      return null;
    }
    const labData = {};

    // Extract CLS lab data
    if (metrics.CLS) {
      labData.cls = {
        numericValue: metrics.CLS.numericValue,
        displayValue: metrics.CLS.displayValue,
        score: metrics.CLS.score,
        value: metrics.CLS.numericValue // Use numericValue as the main value
      };
      console.log("🧪 [PSI Lab] Extracted CLS lab data:", labData.cls);
    }

    // Extract LCP lab data
    if (metrics.LCP) {
      labData.lcp = {
        numericValue: metrics.LCP.numericValue,
        displayValue: metrics.LCP.displayValue,
        score: metrics.LCP.score,
        value: metrics.LCP.numericValue // Use numericValue as the main value
      };
      console.log("🧪 [PSI Lab] Extracted LCP lab data:", labData.lcp);
    }

    // Note: TTFB is intentionally excluded from lab data as it's not available in Lighthouse lab environment

    console.log("🧪 [PSI Lab] Final extracted lab data (CLS & LCP only):", labData);
    return Object.keys(labData).length > 0 ? labData : null;
  } catch (error) {
    console.error("🧪 [PSI Lab] Error extracting lab data:", error);
    return null;
  }
}

/**
 * Analyzes PSI data and sends to popup - Enhanced for all CWV with proper error handling
 * @returns {Promise<boolean>} Success status
 */
async function analyzePSIData() {
  try {
    // Show loading state
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
      action: "updatePSIStatus",
      status: "loading",
      message: "Fetching PageSpeed Insights data..."
    });
    const psiData = await fetchPSIData();
    console.log("🔍 [PSI API] RAW API Response:", JSON.stringify(psiData, null, 2));

    // Extract all field data and lab data
    const allFieldData = extractAllFieldData(psiData);
    const labData = extractLabData(psiData);
    console.log("🌍 [PSI] Extracted field data:", allFieldData);
    console.log("🧪 [PSI] Extracted lab data:", labData);

    // Store PSI data in background for persistence
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
      action: "storePSIResults",
      psiData: {
        allFieldData: allFieldData,
        labData: labData,
        timestamp: Date.now(),
        url: window.location.href,
        rawData: psiData.data // Store raw data for future use
      }
    });

    // Send complete PSI data for insights processing
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
      action: "completePSIResults",
      psiData: psiData
    });

    // Send individual field metric updates
    if (allFieldData) {
      // Update CLS
      if (allFieldData.cls) {
        (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
          action: "updatePSICLS",
          fieldData: allFieldData.cls,
          status: "success"
        });
      }

      // Update LCP
      if (allFieldData.lcp) {
        (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
          action: "updatePSILCP",
          fieldData: allFieldData.lcp,
          status: "success"
        });
      }

      // Update INP
      if (allFieldData.inp) {
        (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
          action: "updatePSIINP",
          fieldData: allFieldData.inp,
          status: "success"
        });
      }

      // Update TTFB
      if (allFieldData.ttfb) {
        (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
          action: "updatePSITTFB",
          fieldData: allFieldData.ttfb,
          status: "success"
        });
      }
    }

    // Send individual lab metric updates (only CLS and LCP available in lab)
    if (labData) {
      console.log("🧪 [PSI] Sending lab data updates:", labData);

      // Update CLS Lab
      if (labData.cls) {
        console.log("🧪 [PSI] Sending CLS lab update:", labData.cls);
        (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
          action: "updatePSILabCLS",
          labData: labData.cls,
          status: "success"
        });
      }

      // Update LCP Lab
      if (labData.lcp) {
        console.log("🧪 [PSI] Sending LCP lab update:", labData.lcp);
        (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
          action: "updatePSILabLCP",
          labData: labData.lcp,
          status: "success"
        });
      }

      // Note: TTFB lab data is not sent as it's not available in Lighthouse lab environment
    } else {
      console.log("🧪 [PSI] No lab data available to send");
    }

    // Send success status LAST to ensure button updates correctly
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
      action: "updatePSIStatus",
      status: "success",
      message: "PSI data loaded successfully"
    });
    console.log("✅ [PSI] Analysis completed successfully");
    return true;
  } catch (error) {
    console.error("Error analyzing PSI data:", error);

    // Extract user-friendly error message
    let userMessage = "Analysis failed. Please try again.";
    if (error.message) {
      // Check for specific error types
      if (error.message.includes("hosting requirements")) {
        userMessage = "This site doesn't meet hosting requirements for analysis.";
      } else if (error.message.includes("403")) {
        userMessage = "Access denied. Site may not be eligible for analysis.";
      } else if (error.message.includes("404")) {
        userMessage = "Page not found or not accessible for analysis.";
      } else if (error.message.includes("500")) {
        userMessage = "Server error occurred. Please try again later.";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        userMessage = "Network error. Please check your connection and try again.";
      } else {
        // Use the error message if it's user-friendly
        userMessage = error.message;
      }
    }
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
      action: "updatePSIStatus",
      status: "error",
      message: `Error analyzing PSI data: ${error.message}`,
      userMessage: userMessage
    });
    return false;
  }
}

/***/ }),

/***/ 158:
/*!************************************************!*\
  !*** ./src/content/analyzers/font-analyzer.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getLoadedAndPreloadedFonts: () => (/* binding */ getLoadedAndPreloadedFonts)
/* harmony export */ });
/* harmony import */ var _utils_formatters_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/formatters.js */ 993);


/**
 * Gets all loaded and preloaded fonts on the page
 * @returns {Promise<Array>} Array of font data
 */
function getLoadedAndPreloadedFonts() {
  return new Promise(resolve => {
    const fontResources = performance.getEntriesByType("resource").filter(entry => {
      const loadedWithinThreeSeconds = entry.startTime < 3000;
      const isFontResource = entry.initiatorType === "css" && (entry.name.includes("/fonts/") || entry.name.match(/\.(woff2?|ttf|otf|eot)($|\?)/i));
      return loadedWithinThreeSeconds && isFontResource;
    });
    const preloadedFonts = Array.from(document.querySelectorAll('link[rel="preload"][as="font"]')).map(el => ({
      url: el.href,
      fetchpriority: el.getAttribute("fetchpriority") || null,
      type: el.getAttribute("type") || null,
      crossorigin: el.getAttribute("crossorigin") || null
    }));

    // Get Early Hints fonts from performance navigation timing
    const earlyHintsFonts = getEarlyHintsFonts();
    const uniqueFonts = new Map();
    fontResources.forEach(resource => {
      const preloadedFont = preloadedFonts.find(pf => pf.url === resource.name);
      const isEarlyHints = earlyHintsFonts.includes(resource.name);
      uniqueFonts.set(resource.name, {
        url: resource.name,
        loadTime: Math.round(resource.startTime),
        preloaded: !!preloadedFont,
        earlyHints: isEarlyHints,
        fetchpriority: (preloadedFont === null || preloadedFont === void 0 ? void 0 : preloadedFont.fetchpriority) || null,
        type: getFontType(resource.name),
        crossorigin: (preloadedFont === null || preloadedFont === void 0 ? void 0 : preloadedFont.crossorigin) || null,
        fileSize: resource.transferSize || null,
        fileSizeFormatted: resource.transferSize ? (0,_utils_formatters_js__WEBPACK_IMPORTED_MODULE_0__.formatFileSize)(resource.transferSize) : null
      });
    });
    preloadedFonts.forEach(pf => {
      if (!uniqueFonts.has(pf.url)) {
        const isEarlyHints = earlyHintsFonts.includes(pf.url);
        uniqueFonts.set(pf.url, {
          url: pf.url,
          loadTime: 0,
          preloaded: true,
          earlyHints: isEarlyHints,
          fetchpriority: pf.fetchpriority,
          type: getFontType(pf.url),
          crossorigin: pf.crossorigin,
          fileSize: null,
          fileSizeFormatted: null
        });
      }
    });

    // Add fonts that are only in Early Hints but not yet loaded
    earlyHintsFonts.forEach(fontUrl => {
      if (!uniqueFonts.has(fontUrl)) {
        uniqueFonts.set(fontUrl, {
          url: fontUrl,
          loadTime: 0,
          preloaded: false,
          earlyHints: true,
          fetchpriority: null,
          type: getFontType(fontUrl),
          crossorigin: null,
          fileSize: null,
          fileSizeFormatted: null
        });
      }
    });
    const allFonts = Array.from(uniqueFonts.values()).sort((a, b) => a.loadTime - b.loadTime);
    resolve(allFonts);
  });
}

/**
 * Gets fonts from Early Hints headers
 * @returns {Array} Array of font URLs from Early Hints
 */
function getEarlyHintsFonts() {
  const earlyHintsFonts = [];
  try {
    // Check if there are any Early Hints in the performance navigation timing
    const navigation = performance.getEntriesByType("navigation")[0];

    // Try to get Early Hints from server timing or other available APIs
    // This is a simplified detection - in practice, Early Hints detection
    // might require server-side cooperation or different detection methods

    // Check for preload links that might have been sent via Early Hints
    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
    preloadLinks.forEach(link => {
      // If the link was added very early (before DOM ready), it might be from Early Hints
      if (link.href && link.href.match(/\.(woff2?|ttf|otf|eot)($|\?)/i)) {
        // Additional heuristics could be added here to better detect Early Hints
        // For now, we'll mark fonts with specific patterns as potentially from Early Hints
        if (isLikelyEarlyHints(link)) {
          earlyHintsFonts.push(link.href);
        }
      }
    });

    // Alternative: Check for fonts loaded very early in the page lifecycle
    const veryEarlyFonts = performance.getEntriesByType("resource").filter(entry => {
      return entry.startTime < 100 &&
      // Loaded within first 100ms
      entry.name.match(/\.(woff2?|ttf|otf|eot)($|\?)/i) && entry.initiatorType === "link"; // Likely from a preload link
    });
    veryEarlyFonts.forEach(font => {
      if (!earlyHintsFonts.includes(font.name)) {
        earlyHintsFonts.push(font.name);
      }
    });
  } catch (error) {
    console.debug("Early Hints detection failed:", error);
  }
  return earlyHintsFonts;
}

/**
 * Heuristic to determine if a preload link might be from Early Hints
 * @param {HTMLLinkElement} link - The link element
 * @returns {boolean} Whether the link is likely from Early Hints
 */
function isLikelyEarlyHints(link) {
  // Check if the link has attributes commonly used with Early Hints
  const hasEarlyHintsAttributes = link.hasAttribute("crossorigin") && link.hasAttribute("type") && link.type.includes("font/");

  // Check if it's in the document head (Early Hints are typically added there)
  const isInHead = link.closest("head") !== null;

  // Additional checks could include timing analysis, server headers, etc.
  return hasEarlyHintsAttributes && isInHead;
}

/**
 * Gets the font type from a URL
 * @param {string} url - The font URL
 * @returns {string} The font type
 */
function getFontType(url) {
  const extension = url.split(".").pop().split("?")[0].toLowerCase();
  const typeMap = {
    woff2: "WOFF2",
    woff: "WOFF",
    ttf: "TTF",
    otf: "OTF",
    eot: "EOT",
    svg: "SVG"
  };
  return typeMap[extension] || "Unknown";
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

/***/ 437:
/*!************************************************!*\
  !*** ./src/content/performance/lcp-monitor.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCurrentLCPData: () => (/* binding */ getCurrentLCPData),
/* harmony export */   highlightLCPElement: () => (/* binding */ highlightLCPElement),
/* harmony export */   initializeLCPMonitoring: () => (/* binding */ initializeLCPMonitoring)
/* harmony export */ });
/* harmony import */ var _utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/messaging.js */ 272);


// LCP monitoring variables
let lcpValue = 0;
let lcpElement = null;
let lcpElementInfo = null;

/**
 * Initializes LCP (Largest Contentful Paint) monitoring
 */
function initializeLCPMonitoring() {
  if (!window.PerformanceObserver) return;
  try {
    const observer = new PerformanceObserver(entryList => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        lcpValue = lastEntry.startTime;
        lcpElement = lastEntry.element;
        console.log("LCP detected:", lcpValue, "ms, element:", lcpElement);
        if (lcpElement) {
          lcpElementInfo = extractElementInfo(lcpElement);
          console.log("LCP element info extracted:", lcpElementInfo);
          (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
            action: "updateLCP",
            value: lcpValue,
            element: lcpElementInfo,
            rating: lcpValue < 2500 ? "good" : lcpValue < 4000 ? "needs-improvement" : "poor"
          });
        } else {
          // Send LCP data even without element info
          console.log("LCP detected but no element info available");
          (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
            action: "updateLCP",
            value: lcpValue,
            element: null,
            rating: lcpValue < 2500 ? "good" : lcpValue < 4000 ? "needs-improvement" : "poor"
          });
        }
      }
    });
    observer.observe({
      type: "largest-contentful-paint",
      buffered: true
    });

    // Send initial data after a delay
    setTimeout(() => {
      console.log("Sending initial LCP data:", lcpValue, lcpElementInfo);
      (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
        action: "updateLCP",
        value: lcpValue,
        element: lcpElementInfo,
        rating: lcpValue < 2500 ? "good" : lcpValue < 4000 ? "needs-improvement" : "poor"
      });
    }, 2000);
  } catch (error) {
    console.log("LCP monitoring error:", error);
  }
}

/**
 * Extracts comprehensive information from the LCP element
 * @param {HTMLElement} element - The LCP element
 * @returns {Object} Detailed element information
 */
function extractElementInfo(element) {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);

  // Get all classes as an array
  const classList = Array.from(element.classList);

  // Extract background image if present
  const backgroundImage = computedStyle.backgroundImage;
  let backgroundImageUrl = null;
  if (backgroundImage && backgroundImage !== "none") {
    const match = backgroundImage.match(/url$$['"]?([^'"]+)['"]?$$/);
    backgroundImageUrl = match ? match[1] : null;
  }

  // Determine the primary source URL
  let primarySource = element.src || backgroundImageUrl || null;

  // For picture elements, get the actual displayed source
  if (element.tagName.toLowerCase() === "img" && element.currentSrc) {
    primarySource = element.currentSrc;
  }

  // Get parent information for context
  const parentInfo = element.parentElement ? {
    tagName: element.parentElement.tagName.toLowerCase(),
    classList: Array.from(element.parentElement.classList),
    id: element.parentElement.id || null
  } : null;

  // Generate element selector for easier identification
  const selector = generateElementSelector(element);
  const elementInfo = {
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    classList: classList,
    classString: classList.join(" ") || null,
    selector: selector,
    src: element.src || null,
    currentSrc: element.currentSrc || null,
    backgroundImageUrl: backgroundImageUrl,
    primarySource: primarySource,
    alt: element.alt || null,
    title: element.title || null,
    textContent: element.textContent ? element.textContent.substring(0, 200) : null,
    dimensions: {
      width: element.offsetWidth,
      height: element.offsetHeight,
      naturalWidth: element.naturalWidth || null,
      naturalHeight: element.naturalHeight || null
    },
    position: {
      top: element.offsetTop,
      left: element.offsetLeft,
      viewportTop: rect.top,
      viewportLeft: rect.left
    },
    styles: {
      objectFit: computedStyle.objectFit,
      objectPosition: computedStyle.objectPosition,
      backgroundSize: computedStyle.backgroundSize,
      backgroundPosition: computedStyle.backgroundPosition
    },
    parent: parentInfo,
    attributes: extractRelevantAttributes(element),
    preview: primarySource // Use primary source for preview
  };
  return elementInfo;
}

/**
 * Generates a CSS selector for the element
 * @param {HTMLElement} element - The element
 * @returns {string} CSS selector
 */
function generateElementSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  let selector = element.tagName.toLowerCase();
  if (element.classList.length > 0) {
    selector += "." + Array.from(element.classList).join(".");
  }

  // Add nth-child if no unique identifier
  if (!element.id && element.classList.length === 0) {
    var _element$parentElemen;
    const siblings = Array.from(((_element$parentElemen = element.parentElement) === null || _element$parentElemen === void 0 ? void 0 : _element$parentElemen.children) || []);
    const index = siblings.indexOf(element) + 1;
    selector += `:nth-child(${index})`;
  }
  return selector;
}

/**
 * Extracts relevant attributes from the element
 * @param {HTMLElement} element - The element
 * @returns {Object} Relevant attributes
 */
function extractRelevantAttributes(element) {
  const relevantAttrs = ["loading", "decoding", "fetchpriority", "sizes", "srcset", "data-src", "data-lazy"];
  const attributes = {};
  relevantAttrs.forEach(attr => {
    if (element.hasAttribute(attr)) {
      attributes[attr] = element.getAttribute(attr);
    }
  });
  return attributes;
}

/**
 * Highlights the LCP element on the page
 * @returns {boolean} True if element was highlighted
 */
function highlightLCPElement() {
  if (!lcpElement) return false;

  // Remove existing highlights
  removeLCPHighlight();
  const highlight = document.createElement("div");
  highlight.id = "bigscoots-lcp-highlight";
  highlight.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999999;
    border: 3px solid #007aff;
    background: rgba(0, 122, 255, 0.1);
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3), 0 0 20px rgba(0, 122, 255, 0.5);
    animation: bigscoots-lcp-pulse 2s infinite;
    border-radius: 4px;
  `;
  if (!document.getElementById("bigscoots-lcp-highlight-styles")) {
    const style = document.createElement("style");
    style.id = "bigscoots-lcp-highlight-styles";
    style.textContent = `
      @keyframes bigscoots-lcp-pulse {
        0% { box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3), 0 0 20px rgba(0, 122, 255, 0.5); }
        50% { box-shadow: 0 0 0 6px rgba(0, 122, 255, 0.5), 0 0 30px rgba(0, 122, 255, 0.8); }
        100% { box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3), 0 0 20px rgba(0, 122, 255, 0.5); }
      }
    `;
    document.head.appendChild(style);
  }
  const rect = lcpElement.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  highlight.style.top = rect.top + scrollTop - 3 + "px";
  highlight.style.left = rect.left + scrollLeft - 3 + "px";
  highlight.style.width = rect.width + 6 + "px";
  highlight.style.height = rect.height + 6 + "px";
  document.body.appendChild(highlight);
  lcpElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center"
  });
  setTimeout(() => {
    removeLCPHighlight();
  }, 5000);
  return true;
}

/**
 * Removes LCP element highlight
 */
function removeLCPHighlight() {
  const existingHighlight = document.getElementById("bigscoots-lcp-highlight");
  if (existingHighlight) {
    existingHighlight.remove();
  }
}

/**
 * Gets the current LCP data
 * @returns {Object} Current LCP data
 */
function getCurrentLCPData() {
  return {
    value: lcpValue,
    element: lcpElementInfo,
    rating: lcpValue < 2500 ? "good" : lcpValue < 4000 ? "needs-improvement" : "poor"
  };
}

/***/ }),

/***/ 616:
/*!**********************************!*\
  !*** ./src/utils/dom-helpers.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   analyzeImageOptimization: () => (/* binding */ analyzeImageOptimization),
/* harmony export */   getImageDimensions: () => (/* binding */ getImageDimensions),
/* harmony export */   getImageFormat: () => (/* binding */ getImageFormat),
/* harmony export */   isCriticalPathImage: () => (/* binding */ isCriticalPathImage),
/* harmony export */   isImageAboveFold: () => (/* binding */ isImageAboveFold)
/* harmony export */ });
/**
 * Checks if an image is above the fold (visible in the viewport)
 * @param {HTMLImageElement} img - The image element to check
 * @returns {boolean} True if the image is above the fold
 */
function isImageAboveFold(img) {
  const rect = img.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < viewportHeight && rect.bottom > 0;
}

/**
 * Gets the dimensions of an image
 * @param {HTMLImageElement} img - The image element
 * @returns {Object} Object containing natural and displayed dimensions
 */
function getImageDimensions(img) {
  return {
    natural: {
      width: img.naturalWidth || 0,
      height: img.naturalHeight || 0
    },
    displayed: {
      width: img.offsetWidth || 0,
      height: img.offsetHeight || 0
    }
  };
}

/**
 * Determines if an image is on the critical rendering path
 * @param {HTMLImageElement} img - The image element
 * @param {Object} dimensions - The image dimensions
 * @returns {boolean} True if the image is on the critical path
 */
function isCriticalPathImage(img, dimensions) {
  const rect = img.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const isAboveFold = rect.top < viewportHeight && rect.bottom > 0;
  const isSignificantSize = dimensions.displayed.width >= 150 || dimensions.displayed.height >= 150;
  const takesViewportSpace = dimensions.displayed.width * dimensions.displayed.height > viewportWidth * viewportHeight * 0.02;
  const isLikelyHero = rect.top < viewportHeight * 0.6 && (dimensions.displayed.width > viewportWidth * 0.3 || dimensions.displayed.height > viewportHeight * 0.3);
  const isLikelyLogo = img.alt && (img.alt.toLowerCase().includes("logo") || img.alt.toLowerCase().includes("brand") || img.className.toLowerCase().includes("logo") || img.id.toLowerCase().includes("logo"));
  return isAboveFold && (isSignificantSize || isLikelyHero || isLikelyLogo) && takesViewportSpace;
}

/**
 * Gets the format of an image from its URL
 * @param {string} url - The image URL
 * @returns {string} The image format
 */
function getImageFormat(url) {
  const extension = url.split(".").pop().split("?")[0].toLowerCase();
  const formatMap = {
    jpg: "JPEG",
    jpeg: "JPEG",
    png: "PNG",
    gif: "GIF",
    webp: "WebP",
    avif: "AVIF",
    svg: "SVG"
  };
  return formatMap[extension] || "Unknown";
}

/**
 * Analyzes image optimization issues
 * @param {HTMLImageElement} img - The image element
 * @param {Object} dimensions - The image dimensions
 * @returns {Array} Array of optimization issues
 */
function analyzeImageOptimization(img, dimensions) {
  const issues = [];
  const {
    natural,
    displayed
  } = dimensions;
  if (natural.width > displayed.width * 2 || natural.height > displayed.height * 2) {
    const wastedPixels = natural.width * natural.height - displayed.width * displayed.height;
    issues.push({
      type: "oversized",
      severity: "high",
      message: `Image is ${Math.round(wastedPixels / 1000)}K pixels larger than needed`
    });
  }
  const format = getImageFormat(img.src);
  if (["JPEG", "PNG"].includes(format)) {
    issues.push({
      type: "format",
      severity: "low",
      message: `Consider modern formats like WebP or AVIF instead of ${format}`
    });
  }
  if (isCriticalPathImage(img, dimensions) && img.getAttribute("loading") === "lazy") {
    issues.push({
      type: "loading",
      severity: "high",
      message: "Critical image should not use lazy loading"
    });
  }
  return issues;
}

/***/ }),

/***/ 794:
/*!************************************************!*\
  !*** ./src/content/performance/cls-monitor.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCurrentCLSData: () => (/* binding */ getCurrentCLSData),
/* harmony export */   highlightCLSElement: () => (/* binding */ highlightCLSElement),
/* harmony export */   initializeCLSMonitoring: () => (/* binding */ initializeCLSMonitoring)
/* harmony export */ });
/* harmony import */ var _utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/messaging.js */ 272);


// CLS monitoring variables
let clsValue = 0;
const clsEntries = [];
let largestShiftElement = null;
let largestShiftValue = 0;

/**
 * Initializes CLS (Cumulative Layout Shift) monitoring
 */
function initializeCLSMonitoring() {
  if (!window.PerformanceObserver) return;
  try {
    const observer = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;

          // Find the element that caused the largest shift
          if (entry.sources && entry.sources.length > 0) {
            const largestSource = entry.sources.reduce((largest, source) => {
              const sourceShift = calculateShiftValue(source);
              const largestShift = calculateShiftValue(largest);
              return sourceShift > largestShift ? source : largest;
            });
            if (entry.value > largestShiftValue) {
              largestShiftValue = entry.value;
              largestShiftElement = largestSource.node;
            }
          }
          const entryData = {
            value: entry.value,
            startTime: entry.startTime,
            sources: entry.sources ? entry.sources.map(source => ({
              node: source.node ? source.node.tagName : "unknown",
              currentRect: source.currentRect,
              previousRect: source.previousRect,
              shiftValue: calculateShiftValue(source)
            })) : []
          };
          clsEntries.push(entryData);

          // Extract element info if we have the largest shift element
          let elementInfo = null;
          if (largestShiftElement) {
            elementInfo = extractCLSElementInfo(largestShiftElement, largestShiftValue);
            console.log("CLS element extracted:", elementInfo);
          } else {
            console.log("No largest shift element found");
          }
          console.log("CLS detected:", clsValue, "element:", largestShiftElement, "info:", elementInfo);
          (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
            action: "updateCLS",
            value: clsValue,
            entries: clsEntries,
            element: elementInfo,
            rating: clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor"
          });
        }
      }
    });
    observer.observe({
      type: "layout-shift",
      buffered: true
    });
    setTimeout(() => {
      let elementInfo = null;
      if (largestShiftElement) {
        elementInfo = extractCLSElementInfo(largestShiftElement, largestShiftValue);
      }
      (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
        action: "updateCLS",
        value: clsValue,
        entries: clsEntries,
        element: elementInfo,
        rating: clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor"
      });
    }, 1000);
  } catch (error) {
    // Silent error handling
  }
}

/**
 * Calculates the shift value for a layout shift source
 * @param {Object} source - Layout shift source
 * @returns {number} Shift value
 */
function calculateShiftValue(source) {
  if (!source.currentRect || !source.previousRect) return 0;
  const currentRect = source.currentRect;
  const previousRect = source.previousRect;

  // Calculate the distance moved
  const deltaX = Math.abs(currentRect.x - previousRect.x);
  const deltaY = Math.abs(currentRect.y - previousRect.y);

  // Calculate the area affected
  const area = Math.max(currentRect.width * currentRect.height, previousRect.width * previousRect.height);

  // Simple shift calculation (distance * area factor)
  return (deltaX + deltaY) * (area / (window.innerWidth * window.innerHeight));
}

/**
 * Extracts comprehensive information from the CLS element
 * @param {HTMLElement} element - The element that caused layout shift
 * @param {number} shiftValue - The shift value for this element
 * @returns {Object} Detailed element information
 */
function extractCLSElementInfo(element, shiftValue) {
  if (!element || !element.getBoundingClientRect) {
    console.log("Invalid element for CLS extraction:", element);
    return null;
  }
  try {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    // Get all classes as an array
    const classList = Array.from(element.classList || []);

    // Extract background image if present
    const backgroundImage = computedStyle.backgroundImage;
    let backgroundImageUrl = null;
    if (backgroundImage && backgroundImage !== "none") {
      const match = backgroundImage.match(/url$$['"]?([^'"]+)['"]?$$/);
      backgroundImageUrl = match ? match[1] : null;
    }

    // Determine the primary source URL
    let primarySource = element.src || backgroundImageUrl || null;

    // For picture elements, get the actual displayed source
    if (element.tagName && element.tagName.toLowerCase() === "img" && element.currentSrc) {
      primarySource = element.currentSrc;
    }

    // Generate element selector for easier identification
    const selector = generateCLSElementSelector(element);
    const elementInfo = {
      tagName: element.tagName ? element.tagName.toLowerCase() : "unknown",
      id: element.id || null,
      classList: classList,
      classString: classList.join(" ") || null,
      selector: selector,
      src: element.src || null,
      currentSrc: element.currentSrc || null,
      backgroundImageUrl: backgroundImageUrl,
      primarySource: primarySource,
      alt: element.alt || null,
      title: element.title || null,
      textContent: element.textContent ? element.textContent.substring(0, 200) : null,
      shiftValue: shiftValue,
      dimensions: {
        width: element.offsetWidth || 0,
        height: element.offsetHeight || 0,
        naturalWidth: element.naturalWidth || null,
        naturalHeight: element.naturalHeight || null
      },
      position: {
        top: element.offsetTop || 0,
        left: element.offsetLeft || 0,
        viewportTop: rect.top,
        viewportLeft: rect.left
      },
      styles: {
        position: computedStyle.position,
        display: computedStyle.display,
        float: computedStyle.float,
        transform: computedStyle.transform
      },
      attributes: extractRelevantCLSAttributes(element),
      preview: primarySource // Use primary source for preview
    };
    return elementInfo;
  } catch (e) {
    console.error("Error extracting CLS element info:", e);
    return null;
  }
}

/**
 * Generates a CSS selector for the CLS element
 * @param {HTMLElement} element - The element
 * @returns {string} CSS selector
 */
function generateCLSElementSelector(element) {
  if (!element.tagName) return "unknown";
  if (element.id) {
    return `#${element.id}`;
  }
  let selector = element.tagName.toLowerCase();
  if (element.classList && element.classList.length > 0) {
    selector += "." + Array.from(element.classList).join(".");
  }

  // Add nth-child if no unique identifier
  if (!element.id && (!element.classList || element.classList.length === 0)) {
    try {
      var _element$parentElemen;
      const siblings = Array.from(((_element$parentElemen = element.parentElement) === null || _element$parentElemen === void 0 ? void 0 : _element$parentElemen.children) || []);
      const index = siblings.indexOf(element) + 1;
      if (index > 0) {
        selector += `:nth-child(${index})`;
      }
    } catch (e) {
      // Ignore errors
    }
  }
  return selector;
}

/**
 * Extracts relevant attributes from the CLS element
 * @param {HTMLElement} element - The element
 * @returns {Object} Relevant attributes
 */
function extractRelevantCLSAttributes(element) {
  const relevantAttrs = ["loading", "decoding", "fetchpriority", "sizes", "srcset", "data-src", "data-lazy", "style"];
  const attributes = {};
  relevantAttrs.forEach(attr => {
    if (element.hasAttribute && element.hasAttribute(attr)) {
      attributes[attr] = element.getAttribute(attr);
    }
  });
  return attributes;
}

/**
 * Highlights the CLS element on the page
 * @returns {boolean} True if element was highlighted
 */
function highlightCLSElement() {
  if (!largestShiftElement) return false;

  // Remove existing highlights
  removeCLSHighlight();
  const highlight = document.createElement("div");
  highlight.id = "bigscoots-cls-highlight";
  highlight.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999999;
    border: 3px solid #ff9500;
    background: rgba(255, 149, 0, 0.1);
    box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.3), 0 0 20px rgba(255, 149, 0, 0.5);
    animation: bigscoots-cls-pulse 2s infinite;
    border-radius: 4px;
  `;
  if (!document.getElementById("bigscoots-cls-highlight-styles")) {
    const style = document.createElement("style");
    style.id = "bigscoots-cls-highlight-styles";
    style.textContent = `
      @keyframes bigscoots-cls-pulse {
        0% { box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.3), 0 0 20px rgba(255, 149, 0, 0.5); }
        50% { box-shadow: 0 0 0 6px rgba(255, 149, 0, 0.5), 0 0 30px rgba(255, 149, 0, 0.8); }
        100% { box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.3), 0 0 20px rgba(255, 149, 0, 0.5); }
      }
    `;
    document.head.appendChild(style);
  }
  const rect = largestShiftElement.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  highlight.style.top = rect.top + scrollTop - 3 + "px";
  highlight.style.left = rect.left + scrollLeft - 3 + "px";
  highlight.style.width = rect.width + 6 + "px";
  highlight.style.height = rect.height + 6 + "px";
  document.body.appendChild(highlight);
  largestShiftElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center"
  });
  setTimeout(() => {
    removeCLSHighlight();
  }, 5000);
  return true;
}

/**
 * Removes CLS element highlight
 */
function removeCLSHighlight() {
  const existingHighlight = document.getElementById("bigscoots-cls-highlight");
  if (existingHighlight) {
    existingHighlight.remove();
  }
}

/**
 * Gets the current CLS data
 * @returns {Object} Current CLS data
 */
function getCurrentCLSData() {
  let elementInfo = null;
  if (largestShiftElement) {
    elementInfo = extractCLSElementInfo(largestShiftElement, largestShiftValue);
  }
  return {
    value: clsValue,
    entries: clsEntries,
    element: elementInfo,
    rating: clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor"
  };
}

/***/ }),

/***/ 820:
/*!*************************************************!*\
  !*** ./src/content/analyzers/image-analyzer.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getPreloadedImages: () => (/* binding */ getPreloadedImages),
/* harmony export */   highlightImageOnPage: () => (/* binding */ highlightImageOnPage)
/* harmony export */ });
/* harmony import */ var _utils_dom_helpers_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/dom-helpers.js */ 616);


/**
 * Gets all preloaded images on the page
 * @returns {Promise<Array>} Array of preloaded image data
 */
function getPreloadedImages() {
  const uniqueImages = new Map();

  // Get performance entries for images
  const imageEntries = performance.getEntriesByType("resource").filter(entry => {
    return entry.initiatorType === "img" || entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i);
  });
  document.querySelectorAll('link[rel="preload"][as="image"]').forEach(el => {
    const earlyHints = detectEarlyHintsFromImageLink(el);
    uniqueImages.set(el.href, {
      url: el.href,
      fetchpriority: el.getAttribute("fetchpriority") || null,
      type: "preload",
      earlyHints
    });
  });
  document.querySelectorAll("img[data-perfmatters-preload]").forEach(el => {
    if (!uniqueImages.has(el.src)) {
      const earlyHints = detectEarlyHintsFromImagePerformance(el.src, imageEntries);
      uniqueImages.set(el.src, {
        url: el.src,
        fetchpriority: el.getAttribute("fetchpriority") || null,
        type: "perfmatters",
        earlyHints
      });
    }
  });
  document.querySelectorAll('img[loading="eager"]').forEach(el => {
    if (!uniqueImages.has(el.src)) {
      const earlyHints = detectEarlyHintsFromImagePerformance(el.src, imageEntries);
      uniqueImages.set(el.src, {
        url: el.src,
        fetchpriority: el.getAttribute("fetchpriority") || null,
        type: "eager",
        earlyHints
      });
    }
  });
  return Promise.resolve(Array.from(uniqueImages.values()).map(resource => {
    const imgElement = document.querySelector(`img[src="${resource.url}"]`);
    if (imgElement) {
      const dimensions = (0,_utils_dom_helpers_js__WEBPACK_IMPORTED_MODULE_0__.getImageDimensions)(imgElement);
      const aboveFold = (0,_utils_dom_helpers_js__WEBPACK_IMPORTED_MODULE_0__.isImageAboveFold)(imgElement);
      const isCritical = (0,_utils_dom_helpers_js__WEBPACK_IMPORTED_MODULE_0__.isCriticalPathImage)(imgElement, dimensions);
      const format = (0,_utils_dom_helpers_js__WEBPACK_IMPORTED_MODULE_0__.getImageFormat)(resource.url);
      const issues = (0,_utils_dom_helpers_js__WEBPACK_IMPORTED_MODULE_0__.analyzeImageOptimization)(imgElement, dimensions);
      return {
        ...resource,
        dimensions,
        aboveFold,
        isCritical,
        format,
        issues,
        loading: imgElement.getAttribute("loading") || "auto",
        decoding: imgElement.getAttribute("decoding") || "auto",
        fetchpriority: imgElement.getAttribute("fetchpriority") || null
      };
    }
    return {
      ...resource,
      aboveFold: false,
      isCritical: false,
      format: (0,_utils_dom_helpers_js__WEBPACK_IMPORTED_MODULE_0__.getImageFormat)(resource.url),
      issues: [{
        type: "missing",
        severity: "low",
        message: "Image not found in DOM"
      }]
    };
  }));
}

/**
 * Detects Early Hints from image preload link element
 * @param {HTMLLinkElement} link - Link element
 * @returns {boolean} True if likely from Early Hints
 */
function detectEarlyHintsFromImageLink(link) {
  // Check for Early Hints indicators in link attributes
  return link.hasAttribute("as") && link.getAttribute("as") === "image" && link.hasAttribute("rel") && link.getAttribute("rel") === "preload";
}

/**
 * Detects Early Hints from image performance entries
 * @param {string} imageUrl - Image URL
 * @param {Array} imageEntries - Performance entries for images
 * @returns {boolean} True if likely loaded via Early Hints
 */
function detectEarlyHintsFromImagePerformance(imageUrl, imageEntries) {
  const entry = imageEntries.find(e => e.name === imageUrl);
  if (!entry) return false;

  // Early Hints characteristics for images:
  // 1. Very early start time (within first 200ms for images)
  // 2. Link initiator type
  // 3. Fast response time
  return entry.startTime < 200 && entry.initiatorType === "link" && entry.responseEnd - entry.responseStart < 100;
}

/**
 * Highlights an image on the page
 * @param {string} imageUrl - The URL of the image to highlight
 * @returns {boolean} True if image was found and highlighted
 */
function highlightImageOnPage(imageUrl) {
  removeImageHighlights();
  const images = document.querySelectorAll("img");
  let targetImage = null;
  for (const img of images) {
    if (img.src === imageUrl || img.currentSrc === imageUrl) {
      targetImage = img;
      break;
    }
  }
  if (!targetImage) {
    const allElements = document.querySelectorAll("*");
    for (const element of allElements) {
      const computedStyle = window.getComputedStyle(element);
      const backgroundImage = computedStyle.backgroundImage;
      if (backgroundImage && backgroundImage.includes(imageUrl)) {
        targetImage = element;
        break;
      }
    }
  }
  if (targetImage) {
    const highlight = document.createElement("div");
    highlight.id = "bigscoots-image-highlight";
    highlight.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 999999;
      border: 3px solid #ff4444;
      background: rgba(255, 68, 68, 0.1);
      box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.3), 0 0 20px rgba(255, 68, 68, 0.5);
      animation: bigscoots-pulse 2s infinite;
      border-radius: 4px;
    `;
    if (!document.getElementById("bigscoots-highlight-styles")) {
      const style = document.createElement("style");
      style.id = "bigscoots-highlight-styles";
      style.textContent = `
        @keyframes bigscoots-pulse {
          0% { box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.3), 0 0 20px rgba(255, 68, 68, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(255, 68, 68, 0.5), 0 0 30px rgba(255, 68, 68, 0.8); }
          100% { box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.3), 0 0 20px rgba(255, 68, 68, 0.5); }
        }
      `;
      document.head.appendChild(style);
    }
    const rect = targetImage.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    highlight.style.top = rect.top + scrollTop - 3 + "px";
    highlight.style.left = rect.left + scrollLeft - 3 + "px";
    highlight.style.width = rect.width + 6 + "px";
    highlight.style.height = rect.height + 6 + "px";
    document.body.appendChild(highlight);
    targetImage.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center"
    });
    setTimeout(() => {
      removeImageHighlights();
    }, 5000);
    return true;
  }
  return false;
}

/**
 * Removes image highlights from the page
 */
function removeImageHighlights() {
  const existingHighlight = document.getElementById("bigscoots-image-highlight");
  if (existingHighlight) {
    existingHighlight.remove();
  }
}

/***/ }),

/***/ 951:
/*!************************************************!*\
  !*** ./src/content/performance/inp-monitor.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCurrentINPData: () => (/* binding */ getCurrentINPData),
/* harmony export */   initializeINPMonitoring: () => (/* binding */ initializeINPMonitoring)
/* harmony export */ });
/* harmony import */ var _utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/messaging.js */ 272);


// Use a unique namespace to avoid conflicts
const INP_NAMESPACE = "bigscoots_inp_" + Date.now();

// Initialize INP data with persistence
function getINPData() {
  if (!window[INP_NAMESPACE]) {
    window[INP_NAMESPACE] = {
      maxINP: 0,
      interactions: new Map(),
      inpEntries: [],
      isInitialized: false,
      lastSentValue: null
    };
  }
  return window[INP_NAMESPACE];
}

/**
 * Initializes INP (Interaction to Next Paint) monitoring
 */
function initializeINPMonitoring() {
  const inpData = getINPData();

  // Prevent multiple initializations
  if (inpData.isInitialized) {
    console.log("INP monitoring already initialized, sending cached data");
    sendCurrentINPData();
    return;
  }
  if (!window.PerformanceObserver) {
    initializeManualINPTracking();
    return;
  }
  if (!PerformanceObserver.supportedEntryTypes || !PerformanceObserver.supportedEntryTypes.includes("event")) {
    initializeManualINPTracking();
    return;
  }
  try {
    function processEntry(entry) {
      if (!entry.interactionId) return;
      const inpData = getINPData();
      const interactionId = entry.interactionId;
      const duration = entry.duration;
      const existing = inpData.interactions.get(interactionId);
      if (!existing || duration > existing) {
        inpData.interactions.set(interactionId, duration);

        // Capture element details for the interaction
        let elementDetails = null;
        if (entry.target) {
          elementDetails = captureElementDetails(entry.target);
        }
        const entryDetails = {
          interactionId,
          duration: Math.round(duration),
          startTime: entry.startTime,
          name: entry.name,
          target: entry.target ? entry.target.tagName : "unknown",
          timestamp: Date.now(),
          element: elementDetails // Add element details
        };
        if (duration > inpData.maxINP) {
          inpData.maxINP = duration;
          inpData.inpEntries.unshift(entryDetails);
          if (inpData.inpEntries.length > 10) {
            inpData.inpEntries.pop();
          }
          const rating = duration < 200 ? "good" : duration < 500 ? "needs-improvement" : "poor";
          const currentValue = Math.round(duration);

          // Only send if value actually changed
          if (inpData.lastSentValue !== currentValue) {
            inpData.lastSentValue = currentValue;
            (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
              action: "updateINP",
              value: currentValue,
              entries: [...inpData.inpEntries],
              // Send copy to avoid reference issues
              rating: rating,
              status: "measured"
            });
          }
        }
      }
    }
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        processEntry(entry);
      }
    });
    observer.observe({
      type: "event",
      buffered: true,
      durationThreshold: 0
    });
    inpData.isInitialized = true;

    // Send initial state after longer delay to allow for existing interactions
    setTimeout(() => {
      sendCurrentINPData();
    }, 3000); // Increased delay
  } catch (error) {
    console.log("PerformanceObserver failed, falling back to manual tracking");
    initializeManualINPTracking();
  }
}

/**
 * Initializes manual INP tracking as fallback
 */
function initializeManualINPTracking() {
  const inpData = getINPData();
  if (inpData.isInitialized) {
    sendCurrentINPData();
    return;
  }
  const interactionEvents = ["pointerdown", "click", "keydown"];
  interactionEvents.forEach(eventType => {
    document.addEventListener(eventType, event => {
      const startTime = performance.now();
      requestAnimationFrame(() => {
        const duration = performance.now() - startTime;
        const inpData = getINPData();
        if (duration > inpData.maxINP) {
          inpData.maxINP = duration;
          const entryDetails = {
            duration: Math.round(duration),
            startTime,
            name: eventType,
            target: event.target ? event.target.tagName : "unknown",
            method: "manual",
            timestamp: Date.now()
          };
          inpData.inpEntries.unshift(entryDetails);
          if (inpData.inpEntries.length > 10) {
            inpData.inpEntries.pop();
          }
          const rating = duration < 200 ? "good" : duration < 500 ? "needs-improvement" : "poor";
          const currentValue = Math.round(duration);

          // Only send if value actually changed
          if (inpData.lastSentValue !== currentValue) {
            inpData.lastSentValue = currentValue;
            (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
              action: "updateINP",
              value: currentValue,
              entries: [...inpData.inpEntries],
              rating: rating,
              status: "measured"
            });
          }
        }
      });
    }, {
      passive: true,
      capture: true
    });
  });
  inpData.isInitialized = true;
  setTimeout(() => {
    sendCurrentINPData();
  }, 3000);
}

/**
 * Sends current INP data without resetting
 */
function sendCurrentINPData() {
  const inpData = getINPData();
  const currentData = {
    action: "updateINP",
    value: inpData.maxINP > 0 ? Math.round(inpData.maxINP) : null,
    entries: [...inpData.inpEntries],
    rating: inpData.maxINP < 200 ? "good" : inpData.maxINP < 500 ? "needs-improvement" : "poor",
    status: inpData.maxINP > 0 ? "measured" : "waiting"
  };
  (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)(currentData);
}

/**
 * Gets the current INP data
 * @returns {Object} Current INP data
 */
function getCurrentINPData() {
  const inpData = getINPData();
  return {
    value: inpData.maxINP > 0 ? Math.round(inpData.maxINP) : null,
    entries: [...inpData.inpEntries],
    rating: inpData.maxINP < 200 ? "good" : inpData.maxINP < 500 ? "needs-improvement" : "poor",
    status: inpData.maxINP > 0 ? "measured" : "waiting"
  };
}

/**
 * Captures detailed information about an element
 * @param {Element} element - The DOM element to analyze
 * @returns {Object} Element details
 */
function captureElementDetails(element) {
  if (!element) return null;
  try {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    return {
      tagName: element.tagName,
      id: element.id || null,
      classList: element.classList ? Array.from(element.classList) : [],
      dimensions: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      position: {
        left: Math.round(rect.left),
        top: Math.round(rect.top)
      },
      selector: generateSelector(element),
      textContent: element.textContent ? element.textContent.trim().substring(0, 100) : null
    };
  } catch (error) {
    console.log("Error capturing element details:", error);
    return {
      tagName: element.tagName || "UNKNOWN",
      error: "Could not capture details"
    };
  }
}

/**
 * Generates a CSS selector for an element
 * @param {Element} element - The DOM element
 * @returns {string} CSS selector
 */
function generateSelector(element) {
  if (!element) return "";
  try {
    if (element.id) {
      return `#${element.id}`;
    }
    let selector = element.tagName.toLowerCase();
    if (element.classList.length > 0) {
      selector += "." + Array.from(element.classList).join(".");
    }

    // Add nth-child if needed for uniqueness
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
    }
    return selector;
  } catch (error) {
    return element.tagName ? element.tagName.toLowerCase() : "unknown";
  }
}

/***/ }),

/***/ 968:
/*!*******************************************************!*\
  !*** ./src/content/performance/additional-metrics.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCurrentAdditionalMetrics: () => (/* binding */ getCurrentAdditionalMetrics),
/* harmony export */   initializeAdditionalMetrics: () => (/* binding */ initializeAdditionalMetrics)
/* harmony export */ });
/* harmony import */ var _utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/messaging.js */ 272);


// Performance metrics storage
const performanceMetrics = {};

/**
 * Initializes additional performance metrics monitoring
 */
function initializeAdditionalMetrics() {
  const navigation = performance.getEntriesByType("navigation")[0];
  if (navigation) {
    performanceMetrics.ttfb = Math.round(navigation.responseStart - navigation.requestStart);
    performanceMetrics.domLoad = Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart);
    performanceMetrics.pageLoad = Math.round(navigation.loadEventEnd - navigation.navigationStart);
  }
  try {
    const observer = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          performanceMetrics.fcp = Math.round(entry.startTime);
          (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
            action: "updateAdditionalMetrics",
            metrics: performanceMetrics
          });
        }
      }
    });
    observer.observe({
      type: "paint",
      buffered: true
    });
  } catch (error) {
    // Silent error handling
  }
  setTimeout(() => {
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_0__.safeSendMessage)({
      action: "updateAdditionalMetrics",
      metrics: performanceMetrics
    });
  }, 1500);
}

/**
 * Gets the current additional metrics data
 * @returns {Object} Current additional metrics data
 */
function getCurrentAdditionalMetrics() {
  return performanceMetrics;
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
/*!******************************!*\
  !*** ./src/content/index.js ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _performance_cls_monitor_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./performance/cls-monitor.js */ 794);
/* harmony import */ var _performance_lcp_monitor_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./performance/lcp-monitor.js */ 437);
/* harmony import */ var _performance_inp_monitor_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./performance/inp-monitor.js */ 951);
/* harmony import */ var _performance_additional_metrics_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./performance/additional-metrics.js */ 968);
/* harmony import */ var _analyzers_image_analyzer_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./analyzers/image-analyzer.js */ 820);
/* harmony import */ var _analyzers_font_analyzer_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./analyzers/font-analyzer.js */ 158);
/* harmony import */ var _analyzers_psi_analyzer_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./analyzers/psi-analyzer.js */ 23);
/* harmony import */ var _utils_messaging_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/messaging.js */ 272);
// Import performance monitoring modules





// Import analyzer modules




// Import utilities


// Declare chrome variable to avoid undeclared variable error

console.log("=== CONTENT SCRIPT STARTING ===");
console.log("URL:", window.location.href);
console.log("Domain:", window.location.hostname);

/**
 * Checks if the extension should run on the current domain
 * @returns {boolean} True if the extension should run
 */
function shouldRunOnDomain() {
  const excludedDomains = ["portal.bigscoots.com", "wpo-admin.bigscoots.com", "wpo.bigscoots.com"];

  // Check exact domain matches
  if (excludedDomains.some(domain => window.location.hostname === domain)) {
    console.log("Domain excluded:", window.location.hostname);
    return false;
  }

  // Check if domain ends with bigscoots-wpo.com
  if (window.location.hostname.endsWith("bigscoots-wpo.com")) {
    console.log("BigScoots WPO domain excluded:", window.location.hostname);
    return false;
  }
  console.log("Domain allowed:", window.location.hostname);
  return true;
}

/**
 * Gets headers from the current page
 * @returns {Promise<Object>} Headers object
 */
function getHeaders() {
  console.log("Fetching headers...");
  return fetch(window.location.href, {
    method: "GET",
    cache: "no-store",
    credentials: "include"
  }).then(response => {
    console.log("Headers response received");
    const headers = {};
    ["x-bigscoots-cache-status", "cf-cache-status", "x-hosted-by", "x-bigscoots-cache-plan", "content-encoding", "x-bigscoots-cache-mode", "x-ezoic-cdn", "x-np-cfe"].forEach(header => {
      headers[header] = response.headers.get(header) || "N/A";
    });
    headers["x-bigscoots-cache-mode (O2O)"] = headers["x-bigscoots-cache-mode"] !== "N/A" ? "Enabled" : "Disabled";
    headers["x-np-cfe"] = headers["x-np-cfe"] !== "N/A" ? "Nerdpress active" : headers["x-np-cfe"];
    console.log("Headers processed:", headers);
    return headers;
  }).catch(error => {
    console.error("Error fetching headers:", error);
    return {};
  });
}

/**
 * Analyzes the page source code for various optimizations
 * @returns {Object} Source code analysis results
 */
function analyzeSourceCode() {
  console.log("Analyzing source code...");
  const html = document.documentElement.outerHTML;
  const perfmattersRUCSS = html.includes("data-pmdelayedstyle") ? "enabled" : "disabled";
  const perfmattersDelayJS = html.includes("pmdelayedscript") ? "enabled" : "disabled";
  const patterns = {
    gtm: /GTM-\w+/g,
    ua: /UA-\d+-\d+/g,
    ga4: /G-[A-Z0-9]{9,}/g,
    ga: /GA-[A-Z0-9]+/g
  };
  const matches = Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => [key, [...new Set(html.match(pattern) || [])]]));
  const result = {
    perfmattersRUCSS,
    perfmattersDelayJS,
    gtm: matches.gtm.join(", "),
    ua: matches.ua.join(", "),
    ga4: matches.ga4.join(", "),
    ga: matches.ga.join(", "),
    adProvider: detectAdProvider()
  };
  console.log("Source code analysis complete:", result);
  return result;
}

/**
 * Detects ad providers on the page
 * @returns {string} Detected ad provider or "None detected"
 */
function detectAdProvider() {
  const html = document.documentElement.outerHTML;
  const scripts = Array.from(document.scripts).map(script => script.src);
  const adProviders = {
    Mediavine: {
      domains: ["scripts.mediavine.com", "ads.mediavine.com"],
      patterns: ["window.mediavineDomain", "__mediavineMachine"],
      enabled: false
    },
    "AdThrive/Raptive": {
      domains: ["ads.adthrive.com", "cdn.adthrive.com"],
      patterns: ["window.adthrive", "adthrive.config"],
      enabled: false
    },
    Ezoic: {
      domains: ["www.ezojs.com", "ezoic.com", "ezoic.net"],
      patterns: ["ezstandalone", "ez_ad_units"],
      enabled: false
    },
    "Google AdSense": {
      domains: ["pagead2.googlesyndication.com", "adsbygoogle"],
      patterns: ["adsbygoogle.push", "(adsbygoogle"],
      enabled: false
    }
  };
  Object.keys(adProviders).forEach(provider => {
    const hasDomain = adProviders[provider].domains.some(domain => scripts.some(src => src && src.includes(domain)));
    const hasPattern = adProviders[provider].patterns.some(pattern => html.includes(pattern));
    if (hasDomain || hasPattern) {
      adProviders[provider].enabled = true;
    }
  });
  const detectedProviders = Object.keys(adProviders).filter(provider => adProviders[provider].enabled);
  return detectedProviders.join(", ") || "None detected";
}

/**
 * Highlights the INP element on the page
 * @returns {boolean} Success status
 */
function highlightINPElement() {
  console.log("highlightINPElement called");
  try {
    const inpData = (0,_performance_inp_monitor_js__WEBPACK_IMPORTED_MODULE_2__.getCurrentINPData)();
    console.log("Current INP data:", inpData);
    if (!inpData.entries || inpData.entries.length === 0) {
      console.log("No INP entries available for highlighting");
      return false;
    }

    // Get the latest (highest INP) entry
    const latestEntry = inpData.entries[0];
    console.log("Latest INP entry:", latestEntry);
    if (!latestEntry.element || !latestEntry.element.selector) {
      console.log("No element selector available for highlighting");
      return false;
    }

    // Try to find the element using the selector
    let targetElement = null;
    try {
      targetElement = document.querySelector(latestEntry.element.selector);
    } catch (error) {
      console.log("Error with selector, trying alternative methods:", error);
    }

    // Fallback: try to find by ID or class
    if (!targetElement && latestEntry.element.id) {
      targetElement = document.getElementById(latestEntry.element.id);
    }
    if (!targetElement && latestEntry.element.classList && latestEntry.element.classList.length > 0) {
      targetElement = document.querySelector(`.${latestEntry.element.classList[0]}`);
    }
    if (!targetElement) {
      console.log("Could not find INP element to highlight");
      return false;
    }
    console.log("Found INP element to highlight:", targetElement);

    // Create highlight overlay
    const highlight = document.createElement("div");
    highlight.id = "bigscoots-inp-highlight";
    highlight.style.cssText = `
      position: fixed !important;
      pointer-events: none !important;
      z-index: 999999 !important;
      border: 3px solid #ff6b35 !important;
      background: rgba(255, 107, 53, 0.1) !important;
      border-radius: 4px !important;
      box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.3) !important;
      transition: all 0.3s ease !important;
    `;

    // Position the highlight
    const rect = targetElement.getBoundingClientRect();
    highlight.style.left = `${rect.left - 3}px`;
    highlight.style.top = `${rect.top - 3}px`;
    highlight.style.width = `${rect.width + 6}px`;
    highlight.style.height = `${rect.height + 6}px`;

    // Remove any existing highlights
    const existingHighlight = document.getElementById("bigscoots-inp-highlight");
    if (existingHighlight) {
      existingHighlight.remove();
    }

    // Add the highlight
    document.body.appendChild(highlight);

    // Scroll element into view
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center"
    });

    // Add pulsing animation
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
      if (pulseCount >= 6) {
        clearInterval(pulseInterval);
        return;
      }
      highlight.style.transform = pulseCount % 2 === 0 ? "scale(1.05)" : "scale(1)";
      pulseCount++;
    }, 300);

    // Remove highlight after 3 seconds
    setTimeout(() => {
      if (highlight && highlight.parentNode) {
        highlight.remove();
      }
    }, 3000);
    console.log("INP element highlighted successfully");
    return true;
  } catch (error) {
    console.error("Error highlighting INP element:", error);
    return false;
  }
}

/**
 * Runs the main analysis of the page
 */
async function runAnalysis() {
  console.log("=== STARTING PAGE ANALYSIS ===");
  if (!shouldRunOnDomain()) {
    console.log("Extension should not run on this domain, exiting");
    return;
  }
  console.log("Initializing performance monitoring...");
  // Initialize performance monitoring
  (0,_performance_cls_monitor_js__WEBPACK_IMPORTED_MODULE_0__.initializeCLSMonitoring)();
  (0,_performance_lcp_monitor_js__WEBPACK_IMPORTED_MODULE_1__.initializeLCPMonitoring)();
  (0,_performance_inp_monitor_js__WEBPACK_IMPORTED_MODULE_2__.initializeINPMonitoring)();
  (0,_performance_additional_metrics_js__WEBPACK_IMPORTED_MODULE_3__.initializeAdditionalMetrics)();
  console.log("Running analysis promises...");
  // Run analysis
  try {
    const [images, fonts, headers, sourceCodeInfo] = await Promise.all([(0,_analyzers_image_analyzer_js__WEBPACK_IMPORTED_MODULE_4__.getPreloadedImages)(), (0,_analyzers_font_analyzer_js__WEBPACK_IMPORTED_MODULE_5__.getLoadedAndPreloadedFonts)(), getHeaders(), Promise.resolve(analyzeSourceCode())]);
    console.log("Analysis results:");
    console.log("- Images:", images.length);
    console.log("- Fonts:", fonts.length);
    console.log("- Headers:", Object.keys(headers).length);
    console.log("- Source code info:", sourceCodeInfo);
    const analysisData = {
      images,
      fonts,
      headers: {
        ...headers,
        ...sourceCodeInfo
      },
      cls: (0,_performance_cls_monitor_js__WEBPACK_IMPORTED_MODULE_0__.getCurrentCLSData)(),
      lcp: (0,_performance_lcp_monitor_js__WEBPACK_IMPORTED_MODULE_1__.getCurrentLCPData)(),
      inp: (0,_performance_inp_monitor_js__WEBPACK_IMPORTED_MODULE_2__.getCurrentINPData)(),
      additionalMetrics: (0,_performance_additional_metrics_js__WEBPACK_IMPORTED_MODULE_3__.getCurrentAdditionalMetrics)()
    };
    console.log("Sending analysis results to background...");
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_7__.safeSendMessage)({
      action: "analysisResults",
      ...analysisData
    });
    console.log("Sending badge update...");
    (0,_utils_messaging_js__WEBPACK_IMPORTED_MODULE_7__.safeSendMessage)({
      action: "updateBadge",
      hostedBy: headers["x-hosted-by"] || "N/A",
      cacheStatus: headers["x-bigscoots-cache-status"] || headers["cf-cache-status"] || "N/A"
    });
    console.log("=== PAGE ANALYSIS COMPLETE ===");
  } catch (error) {
    console.error("Error during analysis:", error);
  }
}

// Initialize the extension
console.log("Starting content script initialization...");
runAnalysis();

// Set up message listener with proper async handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request.action);

  // Handle ping requests to verify content script is ready
  if (request.action === "ping") {
    console.log("Content script ping received - responding immediately");
    sendResponse({
      ready: true
    });
    return false; // Synchronous response, don't keep channel open
  }
  if (request.action === "getCurrentPerformanceData") {
    const data = {
      cls: (0,_performance_cls_monitor_js__WEBPACK_IMPORTED_MODULE_0__.getCurrentCLSData)(),
      lcp: (0,_performance_lcp_monitor_js__WEBPACK_IMPORTED_MODULE_1__.getCurrentLCPData)(),
      inp: (0,_performance_inp_monitor_js__WEBPACK_IMPORTED_MODULE_2__.getCurrentINPData)(),
      additionalMetrics: (0,_performance_additional_metrics_js__WEBPACK_IMPORTED_MODULE_3__.getCurrentAdditionalMetrics)()
    };
    console.log("Sending current performance data:", data);
    sendResponse(data);
    return false; // Synchronous response
  } else if (request.action === "highlightImage") {
    const success = (0,_analyzers_image_analyzer_js__WEBPACK_IMPORTED_MODULE_4__.highlightImageOnPage)(request.imageUrl);
    sendResponse({
      success
    });
    return false; // Synchronous response
  } else if (request.action === "highlightLCPElement") {
    const success = (0,_performance_lcp_monitor_js__WEBPACK_IMPORTED_MODULE_1__.highlightLCPElement)();
    sendResponse({
      success
    });
    return false; // Synchronous response
  } else if (request.action === "highlightCLSElement") {
    const success = (0,_performance_cls_monitor_js__WEBPACK_IMPORTED_MODULE_0__.highlightCLSElement)();
    sendResponse({
      success
    });
    return false; // Synchronous response
  } else if (request.action === "highlightINPElement") {
    const success = highlightINPElement();
    sendResponse({
      success
    });
    return false; // Synchronous response
  } else if (request.action === "requestAnalysis") {
    console.log("Fresh analysis requested");
    // Re-run the analysis when requested
    runAnalysis();
    sendResponse({
      success: true
    });
    return false; // Synchronous response
  } else if (request.action === "analyzePSI") {
    // Handle PSI analysis request - this is async
    console.log("Received PSI analysis request");

    // Execute PSI analysis asynchronously
    const handlePSIAnalysis = async () => {
      try {
        console.log("Starting PSI analysis...");
        const success = await (0,_analyzers_psi_analyzer_js__WEBPACK_IMPORTED_MODULE_6__.analyzePSIData)();
        console.log("PSI analysis completed:", success);
        sendResponse({
          success: true
        });
      } catch (error) {
        console.error("PSI analysis error:", error);
        sendResponse({
          success: false,
          error: error.message
        });
      }
    };

    // Start the async operation
    handlePSIAnalysis();
    return true; // Keep message channel open for async response
  }
  return false; // Don't keep channel open for unhandled messages
});
console.log("=== CONTENT SCRIPT SETUP COMPLETE ===");
})();

/******/ })()
;
//# sourceMappingURL=content.js.map