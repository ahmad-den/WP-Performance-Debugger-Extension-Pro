import { formatFileSize } from "../../utils/formatters.js"

/**
 * Gets all loaded and preloaded fonts on the page
 * @returns {Promise<Array>} Array of font data
 */
export function getLoadedAndPreloadedFonts() {
  return new Promise((resolve) => {
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

    // Get Early Hints fonts from performance navigation timing
    const earlyHintsFonts = getEarlyHintsFonts()

    const uniqueFonts = new Map()

    fontResources.forEach((resource) => {
      const preloadedFont = preloadedFonts.find((pf) => pf.url === resource.name)
      const isEarlyHints = earlyHintsFonts.includes(resource.name)

      uniqueFonts.set(resource.name, {
        url: resource.name,
        loadTime: Math.round(resource.startTime),
        preloaded: !!preloadedFont,
        earlyHints: isEarlyHints,
        fetchpriority: preloadedFont?.fetchpriority || null,
        type: getFontType(resource.name),
        crossorigin: preloadedFont?.crossorigin || null,
        fileSize: resource.transferSize || null,
        fileSizeFormatted: resource.transferSize ? formatFileSize(resource.transferSize) : null,
      })
    })

    preloadedFonts.forEach((pf) => {
      if (!uniqueFonts.has(pf.url)) {
        const isEarlyHints = earlyHintsFonts.includes(pf.url)
        uniqueFonts.set(pf.url, {
          url: pf.url,
          loadTime: 0,
          preloaded: true,
          earlyHints: isEarlyHints,
          fetchpriority: pf.fetchpriority,
          type: getFontType(pf.url),
          crossorigin: pf.crossorigin,
          fileSize: null,
          fileSizeFormatted: null,
        })
      }
    })

    // Add fonts that are only in Early Hints but not yet loaded
    earlyHintsFonts.forEach((fontUrl) => {
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
          fileSizeFormatted: null,
        })
      }
    })

    const allFonts = Array.from(uniqueFonts.values()).sort((a, b) => a.loadTime - b.loadTime)
    resolve(allFonts)
  })
}

/**
 * Gets fonts from Early Hints headers
 * @returns {Array} Array of font URLs from Early Hints
 */
function getEarlyHintsFonts() {
  const earlyHintsFonts = []

  try {
    // Check if there are any Early Hints in the performance navigation timing
    const navigation = performance.getEntriesByType("navigation")[0]

    // Try to get Early Hints from server timing or other available APIs
    // This is a simplified detection - in practice, Early Hints detection
    // might require server-side cooperation or different detection methods

    // Check for preload links that might have been sent via Early Hints
    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="font"]')
    preloadLinks.forEach((link) => {
      // If the link was added very early (before DOM ready), it might be from Early Hints
      if (link.href && link.href.match(/\.(woff2?|ttf|otf|eot)($|\?)/i)) {
        // Additional heuristics could be added here to better detect Early Hints
        // For now, we'll mark fonts with specific patterns as potentially from Early Hints
        if (isLikelyEarlyHints(link)) {
          earlyHintsFonts.push(link.href)
        }
      }
    })

    // Alternative: Check for fonts loaded very early in the page lifecycle
    const veryEarlyFonts = performance.getEntriesByType("resource").filter((entry) => {
      return (
        entry.startTime < 100 && // Loaded within first 100ms
        entry.name.match(/\.(woff2?|ttf|otf|eot)($|\?)/i) &&
        entry.initiatorType === "link"
      ) // Likely from a preload link
    })

    veryEarlyFonts.forEach((font) => {
      if (!earlyHintsFonts.includes(font.name)) {
        earlyHintsFonts.push(font.name)
      }
    })
  } catch (error) {
    console.debug("Early Hints detection failed:", error)
  }

  return earlyHintsFonts
}

/**
 * Heuristic to determine if a preload link might be from Early Hints
 * @param {HTMLLinkElement} link - The link element
 * @returns {boolean} Whether the link is likely from Early Hints
 */
function isLikelyEarlyHints(link) {
  // Check if the link has attributes commonly used with Early Hints
  const hasEarlyHintsAttributes =
    link.hasAttribute("crossorigin") && link.hasAttribute("type") && link.type.includes("font/")

  // Check if it's in the document head (Early Hints are typically added there)
  const isInHead = link.closest("head") !== null

  // Additional checks could include timing analysis, server headers, etc.
  return hasEarlyHintsAttributes && isInHead
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
