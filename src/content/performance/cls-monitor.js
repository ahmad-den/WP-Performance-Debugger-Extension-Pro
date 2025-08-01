import { safeSendMessage } from "../../utils/messaging.js"

// CLS monitoring variables
let clsValue = 0
const clsEntries = []
let largestShiftElement = null
let largestShiftValue = 0

/**
 * Initializes CLS (Cumulative Layout Shift) monitoring
 */
export function initializeCLSMonitoring() {
  if (!window.PerformanceObserver) return

  try {
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value

          // Find the element that caused the largest shift
          if (entry.sources && entry.sources.length > 0) {
            const largestSource = entry.sources.reduce((largest, source) => {
              const sourceShift = calculateShiftValue(source)
              const largestShift = calculateShiftValue(largest)
              return sourceShift > largestShift ? source : largest
            })

            if (entry.value > largestShiftValue) {
              largestShiftValue = entry.value
              largestShiftElement = largestSource.node
            }
          }

          const entryData = {
            value: entry.value,
            startTime: entry.startTime,
            sources: entry.sources
              ? entry.sources.map((source) => ({
                  node: source.node ? source.node.tagName : "unknown",
                  currentRect: source.currentRect,
                  previousRect: source.previousRect,
                  shiftValue: calculateShiftValue(source),
                }))
              : [],
          }

          clsEntries.push(entryData)

          // Extract element info if we have the largest shift element
          let elementInfo = null
          if (largestShiftElement) {
            elementInfo = extractCLSElementInfo(largestShiftElement, largestShiftValue)
            console.log("CLS element extracted:", elementInfo)
          } else {
            console.log("No largest shift element found")
          }

          console.log("CLS detected:", clsValue, "element:", largestShiftElement, "info:", elementInfo)

          safeSendMessage({
            action: "updateCLS",
            value: clsValue,
            entries: clsEntries,
            element: elementInfo,
            rating: clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor",
          })
        }
      }
    })

    observer.observe({ type: "layout-shift", buffered: true })

    setTimeout(() => {
      let elementInfo = null
      if (largestShiftElement) {
        elementInfo = extractCLSElementInfo(largestShiftElement, largestShiftValue)
      }

      safeSendMessage({
        action: "updateCLS",
        value: clsValue,
        entries: clsEntries,
        element: elementInfo,
        rating: clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor",
      })
    }, 1000)
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
  if (!source.currentRect || !source.previousRect) return 0

  const currentRect = source.currentRect
  const previousRect = source.previousRect

  // Calculate the distance moved
  const deltaX = Math.abs(currentRect.x - previousRect.x)
  const deltaY = Math.abs(currentRect.y - previousRect.y)

  // Calculate the area affected
  const area = Math.max(currentRect.width * currentRect.height, previousRect.width * previousRect.height)

  // Simple shift calculation (distance * area factor)
  return (deltaX + deltaY) * (area / (window.innerWidth * window.innerHeight))
}

/**
 * Extracts comprehensive information from the CLS element
 * @param {HTMLElement} element - The element that caused layout shift
 * @param {number} shiftValue - The shift value for this element
 * @returns {Object} Detailed element information
 */
function extractCLSElementInfo(element, shiftValue) {
  if (!element || !element.getBoundingClientRect) {
    console.log("Invalid element for CLS extraction:", element)
    return null
  }

  try {
    const rect = element.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(element)

    // Get all classes as an array
    const classList = Array.from(element.classList || [])

    // Extract background image if present
    const backgroundImage = computedStyle.backgroundImage
    let backgroundImageUrl = null
    if (backgroundImage && backgroundImage !== "none") {
      const match = backgroundImage.match(/url$$['"]?([^'"]+)['"]?$$/)
      backgroundImageUrl = match ? match[1] : null
    }

    // Determine the primary source URL
    let primarySource = element.src || backgroundImageUrl || null

    // For picture elements, get the actual displayed source
    if (element.tagName && element.tagName.toLowerCase() === "img" && element.currentSrc) {
      primarySource = element.currentSrc
    }

    // Generate element selector for easier identification
    const selector = generateCLSElementSelector(element)

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
        naturalHeight: element.naturalHeight || null,
      },
      position: {
        top: element.offsetTop || 0,
        left: element.offsetLeft || 0,
        viewportTop: rect.top,
        viewportLeft: rect.left,
      },
      styles: {
        position: computedStyle.position,
        display: computedStyle.display,
        float: computedStyle.float,
        transform: computedStyle.transform,
      },
      attributes: extractRelevantCLSAttributes(element),
      preview: primarySource, // Use primary source for preview
    }

    return elementInfo
  } catch (e) {
    console.error("Error extracting CLS element info:", e)
    return null
  }
}

/**
 * Generates a CSS selector for the CLS element
 * @param {HTMLElement} element - The element
 * @returns {string} CSS selector
 */
function generateCLSElementSelector(element) {
  if (!element.tagName) return "unknown"

  if (element.id) {
    return `#${element.id}`
  }

  let selector = element.tagName.toLowerCase()

  if (element.classList && element.classList.length > 0) {
    selector += "." + Array.from(element.classList).join(".")
  }

  // Add nth-child if no unique identifier
  if (!element.id && (!element.classList || element.classList.length === 0)) {
    try {
      const siblings = Array.from(element.parentElement?.children || [])
      const index = siblings.indexOf(element) + 1
      if (index > 0) {
        selector += `:nth-child(${index})`
      }
    } catch (e) {
      // Ignore errors
    }
  }

  return selector
}

/**
 * Extracts relevant attributes from the CLS element
 * @param {HTMLElement} element - The element
 * @returns {Object} Relevant attributes
 */
function extractRelevantCLSAttributes(element) {
  const relevantAttrs = ["loading", "decoding", "fetchpriority", "sizes", "srcset", "data-src", "data-lazy", "style"]
  const attributes = {}

  relevantAttrs.forEach((attr) => {
    if (element.hasAttribute && element.hasAttribute(attr)) {
      attributes[attr] = element.getAttribute(attr)
    }
  })

  return attributes
}

/**
 * Highlights the CLS element on the page
 * @returns {boolean} True if element was highlighted
 */
export function highlightCLSElement() {
  if (!largestShiftElement) return false

  // Remove existing highlights
  removeCLSHighlight()

  const highlight = document.createElement("div")
  highlight.id = "bigscoots-cls-highlight"
  highlight.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999999;
    border: 3px solid #ff9500;
    background: rgba(255, 149, 0, 0.1);
    box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.3), 0 0 20px rgba(255, 149, 0, 0.5);
    animation: bigscoots-cls-pulse 2s infinite;
    border-radius: 4px;
  `

  if (!document.getElementById("bigscoots-cls-highlight-styles")) {
    const style = document.createElement("style")
    style.id = "bigscoots-cls-highlight-styles"
    style.textContent = `
      @keyframes bigscoots-cls-pulse {
        0% { box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.3), 0 0 20px rgba(255, 149, 0, 0.5); }
        50% { box-shadow: 0 0 0 6px rgba(255, 149, 0, 0.5), 0 0 30px rgba(255, 149, 0, 0.8); }
        100% { box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.3), 0 0 20px rgba(255, 149, 0, 0.5); }
      }
    `
    document.head.appendChild(style)
  }

  const rect = largestShiftElement.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  highlight.style.top = rect.top + scrollTop - 3 + "px"
  highlight.style.left = rect.left + scrollLeft - 3 + "px"
  highlight.style.width = rect.width + 6 + "px"
  highlight.style.height = rect.height + 6 + "px"

  document.body.appendChild(highlight)

  largestShiftElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  })

  setTimeout(() => {
    removeCLSHighlight()
  }, 5000)

  return true
}

/**
 * Removes CLS element highlight
 */
function removeCLSHighlight() {
  const existingHighlight = document.getElementById("bigscoots-cls-highlight")
  if (existingHighlight) {
    existingHighlight.remove()
  }
}

/**
 * Gets the current CLS data
 * @returns {Object} Current CLS data
 */
export function getCurrentCLSData() {
  let elementInfo = null
  if (largestShiftElement) {
    elementInfo = extractCLSElementInfo(largestShiftElement, largestShiftValue)
  }

  return {
    value: clsValue,
    entries: clsEntries,
    element: elementInfo,
    rating: clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor",
  }
}
