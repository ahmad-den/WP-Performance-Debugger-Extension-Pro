import { formatFileSize } from "../../utils/formatters.js"

/**
 * Gets all loaded and preloaded fonts on the page with proper Early Hints detection
 * @returns {Promise<Array>} Array of font data
 */
export function getLoadedAndPreloadedFonts() {
  return new Promise(async (resolve) => {
    // Get Early Hints data from background script
    const earlyHintsData = await getEarlyHintsFromBackground()
    
    const fontResources = performance.getEntriesByType("resource").filter((entry) => {
      const loadedWithinThreeSeconds = entry.startTime < 3000
      const isFontResource =
        entry.initiatorType === "css" &&
        (entry.name.includes("/fonts/") || entry.name.match(/\.(woff2?|ttf|otf|eot)($|\?)/i))
      return loadedWithinThreeSeconds && isFontResource
    })

    const preloadedFonts = Array.from(document.querySelectorAll('link[rel="preload"][as="font"]')).map((el) => ({
      url: el.href,
      fetchpriority: el.getAttribute("fetchpriority") || null,
      type: el.getAttribute("type") || null,
      crossorigin: el.getAttribute("crossorigin") || null,
    }))

    const uniqueFonts = new Map()

    fontResources.forEach((resource) => {
      const preloadedFont = preloadedFonts.find((pf) => pf.url === resource.name)
      const earlyHintsStatus = checkEarlyHintsStatus(resource.name, earlyHintsData)

      uniqueFonts.set(resource.name, {
        url: resource.name,
        loadTime: Math.round(resource.startTime),
        preloaded: !!preloadedFont,
        earlyHints: earlyHintsStatus.isEarlyHints,
        earlyHintsConfidence: earlyHintsStatus.confidence,
        earlyHintsMethod: earlyHintsStatus.method,
        fetchpriority: preloadedFont?.fetchpriority || null,
        type: getFontType(resource.name),
        crossorigin: preloadedFont?.crossorigin || null,
        fileSize: resource.transferSize || null,
        fileSizeFormatted: resource.transferSize ? formatFileSize(resource.transferSize) : null,
      })
    })

    preloadedFonts.forEach((pf) => {
      if (!uniqueFonts.has(pf.url)) {
        const earlyHintsStatus = checkEarlyHintsStatus(pf.url, earlyHintsData)
        
        uniqueFonts.set(pf.url, {
          url: pf.url,
          loadTime: 0,
          preloaded: true,
          earlyHints: earlyHintsStatus.isEarlyHints,
          earlyHintsConfidence: earlyHintsStatus.confidence,
          earlyHintsMethod: earlyHintsStatus.method,
          fetchpriority: pf.fetchpriority,
          type: getFontType(pf.url),
          crossorigin: pf.crossorigin,
          fileSize: null,
          fileSizeFormatted: null,
        })
      }
    })

    // Add confirmed Early Hints fonts that might not be loaded yet
    if (earlyHintsData && earlyHintsData.confirmedResources) {
      earlyHintsData.confirmedResources.forEach((fontUrl) => {
        if (isFontUrl(fontUrl) && !uniqueFonts.has(fontUrl)) {
          uniqueFonts.set(fontUrl, {
            url: fontUrl,
            loadTime: 0,
            preloaded: false,
            earlyHints: true,
            earlyHintsConfidence: 'high',
            earlyHintsMethod: '103_response',
            fetchpriority: null,
            type: getFontType(fontUrl),
            crossorigin: null,
            fileSize: null,
            fileSizeFormatted: null,
          })
        }
      })
    }

    const allFonts = Array.from(uniqueFonts.values()).sort((a, b) => a.loadTime - b.loadTime)
    resolve(allFonts)
  })
}

/**
 * Gets Early Hints data from background script
 * @returns {Promise<Object|null>} Early Hints data or null
 */
async function getEarlyHintsFromBackground() {
  return new Promise((resolve) => {
    // Get current tab ID
    chrome.runtime.sendMessage({ action: "getCurrentTabId" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.tabId) {
        resolve(null)
        return
      }

      // Get Early Hints data for current tab
      chrome.runtime.sendMessage({ action: "getEarlyHints", tabId: response.tabId }, (earlyHintsData) => {
        if (chrome.runtime.lastError) {
          console.debug("Error getting Early Hints data:", chrome.runtime.lastError)
          resolve(null)
          return
        }

        console.log("🚀 [Early Hints] Retrieved data from background:", earlyHintsData)
        resolve(earlyHintsData)
      })
    })
  })
}

/**
 * Checks Early Hints status for a specific URL
 * @param {string} url - Resource URL to check
 * @param {Object} earlyHintsData - Early Hints data from background
 * @returns {Object} Early Hints status with confidence level
 */
function checkEarlyHintsStatus(url, earlyHintsData) {
  if (!earlyHintsData) {
    return { isEarlyHints: false, confidence: 'none', method: null }
  }

  // Check confirmed Early Hints resources (from 103 responses)
  if (earlyHintsData.confirmedResources && earlyHintsData.confirmedResources.includes(url)) {
    return {
      isEarlyHints: true,
      confidence: 'high',
      method: '103_response'
    }
  }

  // Check potential Early Hints resources (heuristic)
  if (earlyHintsData.potentialResources && earlyHintsData.potentialResources.includes(url)) {
    return {
      isEarlyHints: true,
      confidence: 'low',
      method: 'timing_heuristic'
    }
  }

  return { isEarlyHints: false, confidence: 'none', method: null }
}

/**
 * Checks if a URL is a font resource
 * @param {string} url - URL to check
 * @returns {boolean} True if URL appears to be a font
 */
function isFontUrl(url) {
  return url.match(/\.(woff2?|ttf|otf|eot)($|\?)/i) !== null
}

/**
 * Gets the font type from a URL
 * @param {string} url - The font URL
 * @returns {string} The font type
 */
function getFontType(url) {
  const extension = url.split(".").pop().split("?")[0].toLowerCase()
  const typeMap = {
    woff2: "WOFF2",
    woff: "WOFF",
    ttf: "TTF",
    otf: "OTF",
    eot: "EOT",
    svg: "SVG",
  }
  return typeMap[extension] || "Unknown"
}