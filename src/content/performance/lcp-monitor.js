import { safeSendMessage } from "../../utils/messaging.js"

// LCP monitoring variables
let lcpValue = 0
let lcpElement = null
let lcpElementInfo = null

/**
 * Initializes LCP (Largest Contentful Paint) monitoring
 */
export function initializeLCPMonitoring() {
  if (!window.PerformanceObserver) return

  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]

      if (lastEntry) {
        lcpValue = lastEntry.startTime
        lcpElement = lastEntry.element

        console.log("LCP detected:", lcpValue, "ms, element:", lcpElement)

        if (lcpElement) {
          lcpElementInfo = extractElementInfo(lcpElement)
          console.log("LCP element info extracted:", lcpElementInfo)

          safeSendMessage({
            action: "updateLCP",
            value: lcpValue,
            element: lcpElementInfo,
            rating: lcpValue < 2500 ? "good" : lcpValue < 4000 ? "needs-improvement" : "poor",
          })
        } else {
          // Send LCP data even without element info
          console.log("LCP detected but no element info available")
          safeSendMessage({
            action: "updateLCP",
            value: lcpValue,
            element: null,
            rating: lcpValue < 2500 ? "good" : lcpValue < 4000 ? "needs-improvement" : "poor",
          })
        }
      }
    })

    observer.observe({ type: "largest-contentful-paint", buffered: true })

    // Send initial data after a delay
    setTimeout(() => {
      console.log("Sending initial LCP data:", lcpValue, lcpElementInfo)
      safeSendMessage({
        action: "updateLCP",
        value: lcpValue,
        element: lcpElementInfo,
        rating: lcpValue < 2500 ? "good" : lcpValue < 4000 ? "needs-improvement" : "poor",
      })
    }, 2000)
  } catch (error) {
    console.log("LCP monitoring error:", error)
  }
}

/**
 * Extracts comprehensive information from the LCP element
 * @param {HTMLElement} element - The LCP element
 * @returns {Object} Detailed element information
 */
function extractElementInfo(element) {
  const rect = element.getBoundingClientRect()
  const computedStyle = window.getComputedStyle(element)

  // Get all classes as an array
  const classList = Array.from(element.classList)

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
  if (element.tagName.toLowerCase() === "img" && element.currentSrc) {
    primarySource = element.currentSrc
  }

  // Get parent information for context
  const parentInfo = element.parentElement
    ? {
        tagName: element.parentElement.tagName.toLowerCase(),
        classList: Array.from(element.parentElement.classList),
        id: element.parentElement.id || null,
      }
    : null

  // Generate element selector for easier identification
  const selector = generateElementSelector(element)

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
      naturalHeight: element.naturalHeight || null,
    },
    position: {
      top: element.offsetTop,
      left: element.offsetLeft,
      viewportTop: rect.top,
      viewportLeft: rect.left,
    },
    styles: {
      objectFit: computedStyle.objectFit,
      objectPosition: computedStyle.objectPosition,
      backgroundSize: computedStyle.backgroundSize,
      backgroundPosition: computedStyle.backgroundPosition,
    },
    parent: parentInfo,
    attributes: extractRelevantAttributes(element),
    preview: primarySource, // Use primary source for preview
  }

  return elementInfo
}

/**
 * Generates a CSS selector for the element
 * @param {HTMLElement} element - The element
 * @returns {string} CSS selector
 */
function generateElementSelector(element) {
  if (element.id) {
    return `#${element.id}`
  }

  let selector = element.tagName.toLowerCase()

  if (element.classList.length > 0) {
    selector += "." + Array.from(element.classList).join(".")
  }

  // Add nth-child if no unique identifier
  if (!element.id && element.classList.length === 0) {
    const siblings = Array.from(element.parentElement?.children || [])
    const index = siblings.indexOf(element) + 1
    selector += `:nth-child(${index})`
  }

  return selector
}

/**
 * Extracts relevant attributes from the element
 * @param {HTMLElement} element - The element
 * @returns {Object} Relevant attributes
 */
function extractRelevantAttributes(element) {
  const relevantAttrs = ["loading", "decoding", "fetchpriority", "sizes", "srcset", "data-src", "data-lazy"]
  const attributes = {}

  relevantAttrs.forEach((attr) => {
    if (element.hasAttribute(attr)) {
      attributes[attr] = element.getAttribute(attr)
    }
  })

  return attributes
}

/**
 * Highlights the LCP element on the page
 * @returns {boolean} True if element was highlighted
 */
export function highlightLCPElement() {
  if (!lcpElement) return false

  // Remove existing highlights
  removeLCPHighlight()

  const highlight = document.createElement("div")
  highlight.id = "bigscoots-lcp-highlight"
  highlight.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999999;
    border: 3px solid #007aff;
    background: rgba(0, 122, 255, 0.1);
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3), 0 0 20px rgba(0, 122, 255, 0.5);
    animation: bigscoots-lcp-pulse 2s infinite;
    border-radius: 4px;
  `

  if (!document.getElementById("bigscoots-lcp-highlight-styles")) {
    const style = document.createElement("style")
    style.id = "bigscoots-lcp-highlight-styles"
    style.textContent = `
      @keyframes bigscoots-lcp-pulse {
        0% { box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3), 0 0 20px rgba(0, 122, 255, 0.5); }
        50% { box-shadow: 0 0 0 6px rgba(0, 122, 255, 0.5), 0 0 30px rgba(0, 122, 255, 0.8); }
        100% { box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3), 0 0 20px rgba(0, 122, 255, 0.5); }
      }
    `
    document.head.appendChild(style)
  }

  const rect = lcpElement.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  highlight.style.top = rect.top + scrollTop - 3 + "px"
  highlight.style.left = rect.left + scrollLeft - 3 + "px"
  highlight.style.width = rect.width + 6 + "px"
  highlight.style.height = rect.height + 6 + "px"

  document.body.appendChild(highlight)

  lcpElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  })

  setTimeout(() => {
    removeLCPHighlight()
  }, 5000)

  return true
}

/**
 * Removes LCP element highlight
 */
function removeLCPHighlight() {
  const existingHighlight = document.getElementById("bigscoots-lcp-highlight")
  if (existingHighlight) {
    existingHighlight.remove()
  }
}

/**
 * Gets the current LCP data
 * @returns {Object} Current LCP data
 */
export function getCurrentLCPData() {
  return {
    value: lcpValue,
    element: lcpElementInfo,
    rating: lcpValue < 2500 ? "good" : lcpValue < 4000 ? "needs-improvement" : "poor",
  }
}
