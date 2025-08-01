import { safeSendMessage } from "../../utils/messaging.js"

// Use a unique namespace to avoid conflicts
const INP_NAMESPACE = "bigscoots_inp_" + Date.now()

// Initialize INP data with persistence
function getINPData() {
  if (!window[INP_NAMESPACE]) {
    window[INP_NAMESPACE] = {
      maxINP: 0,
      interactions: new Map(),
      inpEntries: [],
      isInitialized: false,
      lastSentValue: null,
    }
  }
  return window[INP_NAMESPACE]
}

/**
 * Initializes INP (Interaction to Next Paint) monitoring
 */
export function initializeINPMonitoring() {
  const inpData = getINPData()

  // Prevent multiple initializations
  if (inpData.isInitialized) {
    console.log("INP monitoring already initialized, sending cached data")
    sendCurrentINPData()
    return
  }

  if (!window.PerformanceObserver) {
    initializeManualINPTracking()
    return
  }

  if (!PerformanceObserver.supportedEntryTypes || !PerformanceObserver.supportedEntryTypes.includes("event")) {
    initializeManualINPTracking()
    return
  }

  try {
    function processEntry(entry) {
      if (!entry.interactionId) return

      const inpData = getINPData()
      const interactionId = entry.interactionId
      const duration = entry.duration

      const existing = inpData.interactions.get(interactionId)
      if (!existing || duration > existing) {
        inpData.interactions.set(interactionId, duration)

        // Capture element details for the interaction
        let elementDetails = null
        if (entry.target) {
          elementDetails = captureElementDetails(entry.target)
        }

        const entryDetails = {
          interactionId,
          duration: Math.round(duration),
          startTime: entry.startTime,
          name: entry.name,
          target: entry.target ? entry.target.tagName : "unknown",
          timestamp: Date.now(),
          element: elementDetails, // Add element details
        }

        if (duration > inpData.maxINP) {
          inpData.maxINP = duration
          inpData.inpEntries.unshift(entryDetails)
          if (inpData.inpEntries.length > 10) {
            inpData.inpEntries.pop()
          }

          const rating = duration < 200 ? "good" : duration < 500 ? "needs-improvement" : "poor"
          const currentValue = Math.round(duration)

          // Only send if value actually changed
          if (inpData.lastSentValue !== currentValue) {
            inpData.lastSentValue = currentValue

            safeSendMessage({
              action: "updateINP",
              value: currentValue,
              entries: [...inpData.inpEntries], // Send copy to avoid reference issues
              rating: rating,
              status: "measured",
            })
          }
        }
      }
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        processEntry(entry)
      }
    })

    observer.observe({
      type: "event",
      buffered: true,
      durationThreshold: 0,
    })

    inpData.isInitialized = true

    // Send initial state after longer delay to allow for existing interactions
    setTimeout(() => {
      sendCurrentINPData()
    }, 3000) // Increased delay
  } catch (error) {
    console.log("PerformanceObserver failed, falling back to manual tracking")
    initializeManualINPTracking()
  }
}

/**
 * Initializes manual INP tracking as fallback
 */
function initializeManualINPTracking() {
  const inpData = getINPData()

  if (inpData.isInitialized) {
    sendCurrentINPData()
    return
  }

  const interactionEvents = ["pointerdown", "click", "keydown"]

  interactionEvents.forEach((eventType) => {
    document.addEventListener(
      eventType,
      (event) => {
        const startTime = performance.now()

        requestAnimationFrame(() => {
          const duration = performance.now() - startTime
          const inpData = getINPData()

          if (duration > inpData.maxINP) {
            inpData.maxINP = duration

            const entryDetails = {
              duration: Math.round(duration),
              startTime,
              name: eventType,
              target: event.target ? event.target.tagName : "unknown",
              method: "manual",
              timestamp: Date.now(),
            }

            inpData.inpEntries.unshift(entryDetails)
            if (inpData.inpEntries.length > 10) {
              inpData.inpEntries.pop()
            }

            const rating = duration < 200 ? "good" : duration < 500 ? "needs-improvement" : "poor"
            const currentValue = Math.round(duration)

            // Only send if value actually changed
            if (inpData.lastSentValue !== currentValue) {
              inpData.lastSentValue = currentValue

              safeSendMessage({
                action: "updateINP",
                value: currentValue,
                entries: [...inpData.inpEntries],
                rating: rating,
                status: "measured",
              })
            }
          }
        })
      },
      { passive: true, capture: true },
    )
  })

  inpData.isInitialized = true

  setTimeout(() => {
    sendCurrentINPData()
  }, 3000)
}

/**
 * Sends current INP data without resetting
 */
function sendCurrentINPData() {
  const inpData = getINPData()

  const currentData = {
    action: "updateINP",
    value: inpData.maxINP > 0 ? Math.round(inpData.maxINP) : null,
    entries: [...inpData.inpEntries],
    rating: inpData.maxINP < 200 ? "good" : inpData.maxINP < 500 ? "needs-improvement" : "poor",
    status: inpData.maxINP > 0 ? "measured" : "waiting",
  }

  safeSendMessage(currentData)
}

/**
 * Gets the current INP data
 * @returns {Object} Current INP data
 */
export function getCurrentINPData() {
  const inpData = getINPData()

  return {
    value: inpData.maxINP > 0 ? Math.round(inpData.maxINP) : null,
    entries: [...inpData.inpEntries],
    rating: inpData.maxINP < 200 ? "good" : inpData.maxINP < 500 ? "needs-improvement" : "poor",
    status: inpData.maxINP > 0 ? "measured" : "waiting",
  }
}

/**
 * Captures detailed information about an element
 * @param {Element} element - The DOM element to analyze
 * @returns {Object} Element details
 */
function captureElementDetails(element) {
  if (!element) return null

  try {
    const rect = element.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(element)

    return {
      tagName: element.tagName,
      id: element.id || null,
      classList: element.classList ? Array.from(element.classList) : [],
      dimensions: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      position: {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
      },
      selector: generateSelector(element),
      textContent: element.textContent ? element.textContent.trim().substring(0, 100) : null,
    }
  } catch (error) {
    console.log("Error capturing element details:", error)
    return {
      tagName: element.tagName || "UNKNOWN",
      error: "Could not capture details",
    }
  }
}

/**
 * Generates a CSS selector for an element
 * @param {Element} element - The DOM element
 * @returns {string} CSS selector
 */
function generateSelector(element) {
  if (!element) return ""

  try {
    if (element.id) {
      return `#${element.id}`
    }

    let selector = element.tagName.toLowerCase()

    if (element.classList.length > 0) {
      selector += "." + Array.from(element.classList).join(".")
    }

    // Add nth-child if needed for uniqueness
    const parent = element.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName)
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1
        selector += `:nth-child(${index})`
      }
    }

    return selector
  } catch (error) {
    return element.tagName ? element.tagName.toLowerCase() : "unknown"
  }
}
