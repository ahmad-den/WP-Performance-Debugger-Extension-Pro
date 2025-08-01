/**
 * Checks if an image is above the fold (visible in the viewport)
 * @param {HTMLImageElement} img - The image element to check
 * @returns {boolean} True if the image is above the fold
 */
export function isImageAboveFold(img) {
  const rect = img.getBoundingClientRect()
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  return rect.top < viewportHeight && rect.bottom > 0
}

/**
 * Gets the dimensions of an image
 * @param {HTMLImageElement} img - The image element
 * @returns {Object} Object containing natural and displayed dimensions
 */
export function getImageDimensions(img) {
  return {
    natural: {
      width: img.naturalWidth || 0,
      height: img.naturalHeight || 0,
    },
    displayed: {
      width: img.offsetWidth || 0,
      height: img.offsetHeight || 0,
    },
  }
}

/**
 * Determines if an image is on the critical rendering path
 * @param {HTMLImageElement} img - The image element
 * @param {Object} dimensions - The image dimensions
 * @returns {boolean} True if the image is on the critical path
 */
export function isCriticalPathImage(img, dimensions) {
  const rect = img.getBoundingClientRect()
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth

  const isAboveFold = rect.top < viewportHeight && rect.bottom > 0
  const isSignificantSize = dimensions.displayed.width >= 150 || dimensions.displayed.height >= 150
  const takesViewportSpace =
    dimensions.displayed.width * dimensions.displayed.height > viewportWidth * viewportHeight * 0.02

  const isLikelyHero =
    rect.top < viewportHeight * 0.6 &&
    (dimensions.displayed.width > viewportWidth * 0.3 || dimensions.displayed.height > viewportHeight * 0.3)

  const isLikelyLogo =
    img.alt &&
    (img.alt.toLowerCase().includes("logo") ||
      img.alt.toLowerCase().includes("brand") ||
      img.className.toLowerCase().includes("logo") ||
      img.id.toLowerCase().includes("logo"))

  return isAboveFold && (isSignificantSize || isLikelyHero || isLikelyLogo) && takesViewportSpace
}

/**
 * Gets the format of an image from its URL
 * @param {string} url - The image URL
 * @returns {string} The image format
 */
export function getImageFormat(url) {
  const extension = url.split(".").pop().split("?")[0].toLowerCase()
  const formatMap = {
    jpg: "JPEG",
    jpeg: "JPEG",
    png: "PNG",
    gif: "GIF",
    webp: "WebP",
    avif: "AVIF",
    svg: "SVG",
  }
  return formatMap[extension] || "Unknown"
}

/**
 * Analyzes image optimization issues
 * @param {HTMLImageElement} img - The image element
 * @param {Object} dimensions - The image dimensions
 * @returns {Array} Array of optimization issues
 */
export function analyzeImageOptimization(img, dimensions) {
  const issues = []
  const { natural, displayed } = dimensions

  if (natural.width > displayed.width * 2 || natural.height > displayed.height * 2) {
    const wastedPixels = natural.width * natural.height - displayed.width * displayed.height
    issues.push({
      type: "oversized",
      severity: "high",
      message: `Image is ${Math.round(wastedPixels / 1000)}K pixels larger than needed`,
    })
  }

  const format = getImageFormat(img.src)
  if (["JPEG", "PNG"].includes(format)) {
    issues.push({
      type: "format",
      severity: "low",
      message: `Consider modern formats like WebP or AVIF instead of ${format}`,
    })
  }

  if (isCriticalPathImage(img, dimensions) && img.getAttribute("loading") === "lazy") {
    issues.push({
      type: "loading",
      severity: "high",
      message: "Critical image should not use lazy loading",
    })
  }

  return issues
}
