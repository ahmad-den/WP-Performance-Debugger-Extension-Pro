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

    const uniqueFonts = new Map()

    fontResources.forEach((resource) => {
      const preloadedFont = preloadedFonts.find((pf) => pf.url === resource.name)

      uniqueFonts.set(resource.name, {
        url: resource.name,
        loadTime: Math.round(resource.startTime),
        preloaded: !!preloadedFont,
        fetchpriority: preloadedFont?.fetchpriority || null,
        type: getFontType(resource.name),
        crossorigin: preloadedFont?.crossorigin || null,
        fileSize: resource.transferSize || null,
        fileSizeFormatted: resource.transferSize ? formatFileSize(resource.transferSize) : null,
      })
    })

    preloadedFonts.forEach((pf) => {
      if (!uniqueFonts.has(pf.url)) {
        uniqueFonts.set(pf.url, {
          url: pf.url,
          loadTime: 0,
          preloaded: true,
          fetchpriority: pf.fetchpriority,
          type: getFontType(pf.url),
          crossorigin: pf.crossorigin,
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
