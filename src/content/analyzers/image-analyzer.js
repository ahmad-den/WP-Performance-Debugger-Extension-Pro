import {
  getImageDimensions,
  isImageAboveFold,
  isCriticalPathImage,
  getImageFormat,
  analyzeImageOptimization,
} from "../../utils/dom-helpers.js"

/**
 * Gets all preloaded images on the page with proper Early Hints detection
 * @returns {Promise<Array>} Array of preloaded image data
 */
export function getPreloadedImages() {
  return new Promise(async (resolve) => {
    // Get Early Hints data from background script
    const earlyHintsData = await getEarlyHintsFromBackground()
    
    const uniqueImages = new Map()

    // Get performance entries for images
    const imageEntries = performance.getEntriesByType("resource").filter((entry) => {
      return entry.initiatorType === "img" || entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i)
    })

    document.querySelectorAll('link[rel="preload"][as="image"]').forEach((el) => {
      const earlyHintsStatus = checkEarlyHintsStatus(el.href, earlyHintsData)
      
      uniqueImages.set(el.href, {
        url: el.href,
        fetchpriority: el.getAttribute("fetchpriority") || null,
        type: "preload",
        earlyHints: earlyHintsStatus.isEarlyHints,
        earlyHintsConfidence: earlyHintsStatus.confidence,
        earlyHintsMethod: earlyHintsStatus.method,
      })
    })

    document.querySelectorAll("img[data-perfmatters-preload]").forEach((el) => {
      if (!uniqueImages.has(el.src)) {
        const earlyHintsStatus = checkEarlyHintsStatus(el.src, earlyHintsData)
        
        uniqueImages.set(el.src, {
          url: el.src,
          fetchpriority: el.getAttribute("fetchpriority") || null,
          type: "perfmatters",
          earlyHints: earlyHintsStatus.isEarlyHints,
          earlyHintsConfidence: earlyHintsStatus.confidence,
          earlyHintsMethod: earlyHintsStatus.method,
        })
      }
    })

    document.querySelectorAll('img[loading="eager"]').forEach((el) => {
      if (!uniqueImages.has(el.src)) {
        const earlyHintsStatus = checkEarlyHintsStatus(el.src, earlyHintsData)
        
        uniqueImages.set(el.src, {
          url: el.src,
          fetchpriority: el.getAttribute("fetchpriority") || null,
          type: "eager",
          earlyHints: earlyHintsStatus.isEarlyHints,
          earlyHintsConfidence: earlyHintsStatus.confidence,
          earlyHintsMethod: earlyHintsStatus.method,
        })
      }
    })

    // Add confirmed Early Hints images that might not be loaded yet
    if (earlyHintsData && earlyHintsData.confirmedResources) {
      earlyHintsData.confirmedResources.forEach((imageUrl) => {
        if (isImageUrl(imageUrl) && !uniqueImages.has(imageUrl)) {
          uniqueImages.set(imageUrl, {
            url: imageUrl,
            fetchpriority: null,
            type: "early-hints",
            earlyHints: true,
            earlyHintsConfidence: 'high',
            earlyHintsMethod: '103_response',
          })
        }
      })
    }

    const processedImages = Array.from(uniqueImages.values()).map((resource) => {
      const imgElement = document.querySelector(`img[src="${resource.url}"]`)

      if (imgElement) {
        const dimensions = getImageDimensions(imgElement)
        const aboveFold = isImageAboveFold(imgElement)
        const isCritical = isCriticalPathImage(imgElement, dimensions)
        const format = getImageFormat(resource.url)
        const issues = analyzeImageOptimization(imgElement, dimensions)

        return {
          ...resource,
          dimensions,
          aboveFold,
          isCritical,
          format,
          issues,
          loading: imgElement.getAttribute("loading") || "auto",
          decoding: imgElement.getAttribute("decoding") || "auto",
          fetchpriority: imgElement.getAttribute("fetchpriority") || resource.fetchpriority,
        }
      }

      return {
        ...resource,
        aboveFold: false,
        isCritical: false,
        format: getImageFormat(resource.url),
        issues: [{ type: "missing", severity: "low", message: "Image not found in DOM" }],
      }
    })

    resolve(processedImages)
  })
}

/**
 * Gets Early Hints data from background script
 * @returns {Promise<Object|null>} Early Hints data or null
 */
async function getEarlyHintsFromBackground() {
  return new Promise((resolve) => {
    // Get current tab ID first
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
        resolve(null)
        return
      }

      const tabId = tabs[0].id

      // Get Early Hints data for current tab
      chrome.runtime.sendMessage({ action: "getEarlyHints", tabId: tabId }, (earlyHintsData) => {
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
 * Checks if a URL is an image resource
 * @param {string} url - URL to check
 * @returns {boolean} True if URL appears to be an image
 */
function isImageUrl(url) {
  return url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i) !== null
}

/**
 * Highlights an image on the page
 * @param {string} imageUrl - The URL of the image to highlight
 * @returns {boolean} True if image was found and highlighted
 */
export function highlightImageOnPage(imageUrl) {
  removeImageHighlights()

  const images = document.querySelectorAll("img")
  let targetImage = null

  for (const img of images) {
    if (img.src === imageUrl || img.currentSrc === imageUrl) {
      targetImage = img
      break
    }
  }

  if (!targetImage) {
    const allElements = document.querySelectorAll("*")
    for (const element of allElements) {
      const computedStyle = window.getComputedStyle(element)
      const backgroundImage = computedStyle.backgroundImage
      if (backgroundImage && backgroundImage.includes(imageUrl)) {
        targetImage = element
        break
      }
    }
  }

  if (targetImage) {
    const highlight = document.createElement("div")
    highlight.id = "bigscoots-image-highlight"
    highlight.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 999999;
      border: 3px solid #ff4444;
      background: rgba(255, 68, 68, 0.1);
      box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.3), 0 0 20px rgba(255, 68, 68, 0.5);
      animation: bigscoots-pulse 2s infinite;
      border-radius: 4px;
    `

    if (!document.getElementById("bigscoots-highlight-styles")) {
      const style = document.createElement("style")
      style.id = "bigscoots-highlight-styles"
      style.textContent = `
        @keyframes bigscoots-pulse {
          0% { box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.3), 0 0 20px rgba(255, 68, 68, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(255, 68, 68, 0.5), 0 0 30px rgba(255, 68, 68, 0.8); }
          100% { box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.3), 0 0 20px rgba(255, 68, 68, 0.5); }
        }
      `
      document.head.appendChild(style)
    }

    const rect = targetImage.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    highlight.style.top = rect.top + scrollTop - 3 + "px"
    highlight.style.left = rect.left + scrollLeft - 3 + "px"
    highlight.style.width = rect.width + 6 + "px"
    highlight.style.height = rect.height + 6 + "px"

    document.body.appendChild(highlight)

    targetImage.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    })

    setTimeout(() => {
      removeImageHighlights()
    }, 5000)

    return true
  }

  return false
}

/**
 * Removes image highlights from the page
 */
function removeImageHighlights() {
  const existingHighlight = document.getElementById("bigscoots-image-highlight")
  if (existingHighlight) {
    existingHighlight.remove()
  }
}