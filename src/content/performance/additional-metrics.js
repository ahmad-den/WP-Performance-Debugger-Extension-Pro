import { safeSendMessage } from "../../utils/messaging.js"

// Performance metrics storage
const performanceMetrics = {}

/**
 * Initializes additional performance metrics monitoring
 */
export function initializeAdditionalMetrics() {
  const navigation = performance.getEntriesByType("navigation")[0]
  if (navigation) {
    performanceMetrics.ttfb = Math.round(navigation.responseStart - navigation.requestStart)
    performanceMetrics.domLoad = Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart)
    performanceMetrics.pageLoad = Math.round(navigation.loadEventEnd - navigation.navigationStart)
  }

  try {
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          performanceMetrics.fcp = Math.round(entry.startTime)
          safeSendMessage({
            action: "updateAdditionalMetrics",
            metrics: performanceMetrics,
          })
        }
      }
    })

    observer.observe({ type: "paint", buffered: true })
  } catch (error) {
    // Silent error handling
  }

  setTimeout(() => {
    safeSendMessage({
      action: "updateAdditionalMetrics",
      metrics: performanceMetrics,
    })
  }, 1500)
}

/**
 * Gets the current additional metrics data
 * @returns {Object} Current additional metrics data
 */
export function getCurrentAdditionalMetrics() {
  return performanceMetrics
}
