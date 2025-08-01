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
    // Send message to background to get Early Hints data for current tab
    chrome.runtime.sendMessage({ action: "getCurrentTabEarlyHints" }, (response) => {
      if (chrome.runtime.lastError) {
        console.debug("Error getting Early Hints data:", chrome.runtime.lastError)
        resolve(null)
        return
      }

      console.log("🚀 [Early Hints] Retrieved data from background:", response)
      resolve(response)
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

/**
 * Checks if a URL is an image resource
 * @param {string} url - URL to check
 * @returns {boolean} True if URL appears to be an image
 */
function isImageUrl(url) {
  return url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)($|\?)/i) !== null
}

/**
 * Highlights an image on the page
 * @param {string} imageUrl - The URL of the image to highlight
 * @returns {boolean} True if image was highlighted successfully
 */
export function highlightImageOnPage(imageUrl) {
  console.log("Attempting to highlight image:", imageUrl)

  try {
    // Find the image element by URL
    let targetImage = null
    
    // Try different selectors to find the image
    const images = document.querySelectorAll('img')
    for (const img of images) {
      if (img.src === imageUrl || img.currentSrc === imageUrl) {
        targetImage = img
        break
      }
    }

    // Also check for background images
    if (!targetImage) {
      const elements = document.querySelectorAll('*')
      for (const el of elements) {
        const style = window.getComputedStyle(el)
        const bgImage = style.backgroundImage
        if (bgImage && bgImage.includes(imageUrl)) {
          targetImage = el
          break
        }
      }
    }

    if (!targetImage) {
      console.log("Image not found on page:", imageUrl)
      return false
    }

    console.log("Found image element to highlight:", targetImage)

    // Remove any existing highlights
    removeImageHighlight()

    // Create highlight overlay
    const highlight = document.createElement("div")
    highlight.id = "bigscoots-image-highlight"
    highlight.style.cssText = `
      position: absolute !important;
      pointer-events: none !important;
      z-index: 999999 !important;
      border: 3px solid #34c759 !important;
      background: rgba(52, 199, 89, 0.1) !important;
      border-radius: 4px !important;
      box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.3) !important;
      transition: all 0.3s ease !important;
    `

    // Add highlight styles if not already present
    if (!document.getElementById("bigscoots-image-highlight-styles")) {
      const style = document.createElement("style")
      style.id = "bigscoots-image-highlight-styles"
      style.textContent = `
        @keyframes bigscoots-image-pulse {
          0% { box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.3), 0 0 20px rgba(52, 199, 89, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(52, 199, 89, 0.5), 0 0 30px rgba(52, 199, 89, 0.8); }
          100% { box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.3), 0 0 20px rgba(52, 199, 89, 0.5); }
        }
      `
      document.head.appendChild(style)
    }

    // Position the highlight
    const rect = targetImage.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    highlight.style.top = `${rect.top + scrollTop - 3}px`
    highlight.style.left = `${rect.left + scrollLeft - 3}px`
    highlight.style.width = `${rect.width + 6}px`
    highlight.style.height = `${rect.height + 6}px`
    highlight.style.animation = "bigscoots-image-pulse 2s infinite"

    // Add the highlight to the page
    document.body.appendChild(highlight)

    // Scroll element into view
    targetImage.scrollIntoView({
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

    // Remove highlight after 5 seconds
    setTimeout(() => {
      removeImageHighlight()
    }, 5000)

    console.log("Image highlighted successfully")
    return true
  } catch (error) {
    console.error("Error highlighting image:", error)
    return false
  }
}

/**
 * Removes image highlight from the page
 */
function removeImageHighlight() {
  const existingHighlight = document.getElementById("bigscoots-image-highlight")
  if (existingHighlight) {
    existingHighlight.remove()
  }
}