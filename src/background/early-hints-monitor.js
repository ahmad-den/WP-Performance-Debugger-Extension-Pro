/**
 * Early Hints monitoring module - Proper HTTP response analysis
 * Monitors 103 Early Hints responses and Link headers
 */

// Storage for Early Hints data per tab
const tabEarlyHints = new Map()

// Declare chrome variable
const chrome = globalThis.chrome || self.chrome

/**
 * Initializes Early Hints monitoring using webRequest API
 */
export function initializeEarlyHintsMonitoring() {
  console.log("🚀 [Early Hints] Initializing HTTP response monitoring")

  // Monitor all HTTP responses for 103 Early Hints
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      handleHttpResponse(details)
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
  )

  // Clean up Early Hints data when tabs are removed
  chrome.tabs.onRemoved.addListener((tabId) => {
    cleanupTabEarlyHints(tabId)
  })

  // Clean up Early Hints data when navigating to different domains
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      const existingData = tabEarlyHints.get(tabId)
      if (existingData && existingData.domain) {
        try {
          const newDomain = new URL(changeInfo.url).hostname
          if (existingData.domain !== newDomain) {
            console.log("🔄 [Early Hints] Domain changed, clearing Early Hints data for tab:", tabId)
            cleanupTabEarlyHints(tabId)
          }
        } catch (error) {
          console.debug("Error parsing URL for domain comparison:", error)
        }
      }
    }
  })
}

/**
 * Handles HTTP response analysis for Early Hints detection
 * @param {Object} details - webRequest details object
 */
function handleHttpResponse(details) {
  const { tabId, url, statusCode, responseHeaders, type } = details

  // Skip if no tab ID (background requests)
  if (tabId === -1) return

  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    // Initialize tab data if needed
    if (!tabEarlyHints.has(tabId)) {
      tabEarlyHints.set(tabId, {
        domain: domain,
        earlyHintsResources: new Set(),
        mainDocumentUrl: null,
        timestamp: Date.now(),
      })
    }

    const tabData = tabEarlyHints.get(tabId)

    // Update domain if this is a main frame request
    if (type === "main_frame") {
      tabData.domain = domain
      tabData.mainDocumentUrl = url
      // Don't clear existing Early Hints data for same domain navigation
      if (tabData.domain !== domain) {
        tabData.earlyHintsResources.clear()
      }
    }

    // Method 1: Direct 103 Early Hints response detection
    if (statusCode === 103) {
      console.log("🎯 [Early Hints] Detected 103 Early Hints response:", url)
      parseEarlyHintsHeaders(responseHeaders, tabData, url)
      return
    }

    // Method 2: Check for Early Hints indicators in Link headers of main response
    if (type === "main_frame" && statusCode === 200 && responseHeaders) {
      checkForEarlyHintsIndicators(responseHeaders, tabData, url)
    }

    // Method 3: Analyze resource timing for Early Hints characteristics
    if (type === "font" || type === "image") {
      analyzeResourceForEarlyHints(details, tabData)
    }

  } catch (error) {
    console.debug("Error processing HTTP response for Early Hints:", error)
  }
}

/**
 * Parses Link headers from 103 Early Hints responses
 * @param {Array} responseHeaders - Response headers array
 * @param {Object} tabData - Tab Early Hints data
 * @param {string} responseUrl - URL of the response
 */
function parseEarlyHintsHeaders(responseHeaders, tabData, responseUrl) {
  if (!responseHeaders) return

  console.log("📋 [Early Hints] Parsing headers from 103 response:", responseUrl)

  responseHeaders.forEach(header => {
    if (header.name.toLowerCase() === "link") {
      const linkValue = header.value
      console.log("🔗 [Early Hints] Found Link header:", linkValue)

      // Parse Link header format: </resource>; rel=preload; as=font; crossorigin
      const linkMatches = linkValue.match(/<([^>]+)>;\s*rel=preload/gi)
      
      if (linkMatches) {
        linkMatches.forEach(match => {
          const urlMatch = match.match(/<([^>]+)>/)
          if (urlMatch) {
            let resourceUrl = urlMatch[1]
            
            // Convert relative URLs to absolute
            if (resourceUrl.startsWith('/')) {
              try {
                const baseUrl = new URL(responseUrl)
                resourceUrl = `${baseUrl.protocol}//${baseUrl.host}${resourceUrl}`
              } catch (e) {
                console.debug("Error converting relative URL:", e)
              }
            }

            // Determine resource type from Link header
            const asMatch = match.match(/as=([^;,\s]+)/i)
            const resourceType = asMatch ? asMatch[1] : 'unknown'

            console.log("✅ [Early Hints] Confirmed Early Hints resource:", resourceUrl, "type:", resourceType)
            
            tabData.earlyHintsResources.add(resourceUrl)
            
            // Store additional metadata
            if (!tabData.resourceMetadata) {
              tabData.resourceMetadata = new Map()
            }
            
            tabData.resourceMetadata.set(resourceUrl, {
              type: resourceType,
              detectionMethod: '103_response',
              linkHeader: linkValue,
              timestamp: Date.now()
            })
          }
        })
      }
    }
  })
}

/**
 * Checks main document response for Early Hints indicators
 * @param {Array} responseHeaders - Response headers array
 * @param {Object} tabData - Tab Early Hints data
 * @param {string} responseUrl - URL of the response
 */
function checkForEarlyHintsIndicators(responseHeaders, tabData, responseUrl) {
  if (!responseHeaders) return

  // Look for server timing headers that might indicate Early Hints usage
  const serverTimingHeader = responseHeaders.find(h => h.name.toLowerCase() === 'server-timing')
  if (serverTimingHeader && serverTimingHeader.value.includes('early-hints')) {
    console.log("🕐 [Early Hints] Server-Timing indicates Early Hints usage:", serverTimingHeader.value)
    tabData.hasServerTimingIndicator = true
  }

  // Look for custom headers that indicate Early Hints support
  const earlyHintsHeaders = [
    'x-early-hints',
    'x-early-hints-enabled', 
    'x-103-early-hints',
    'cf-early-hints', // Cloudflare Early Hints
    'x-bigscoots-early-hints' // BigScoots specific
  ]

  earlyHintsHeaders.forEach(headerName => {
    const header = responseHeaders.find(h => h.name.toLowerCase() === headerName)
    if (header) {
      console.log(`🎯 [Early Hints] Found Early Hints indicator header: ${headerName} = ${header.value}`)
      tabData.hasEarlyHintsHeader = true
      tabData.earlyHintsHeaderValue = header.value
    }
  })
}

/**
 * Analyzes resource characteristics for Early Hints patterns
 * @param {Object} details - webRequest details
 * @param {Object} tabData - Tab Early Hints data
 */
function analyzeResourceForEarlyHints(details, tabData) {
  const { url, timeStamp, initiator } = details

  // Check if this resource was preloaded via Early Hints
  if (tabData.earlyHintsResources.has(url)) {
    console.log("✅ [Early Hints] Confirmed resource loaded via Early Hints:", url)
    return
  }

  // Advanced heuristic: Check for very early resource requests with specific patterns
  if (initiator && initiator.type === 'parser' && timeStamp) {
    // Resources initiated by parser very early might be from Early Hints
    // This is still a heuristic but more reliable than the previous method
    const isVeryEarly = timeStamp < (tabData.timestamp + 50) // Within 50ms of navigation start
    
    if (isVeryEarly) {
      console.log("🤔 [Early Hints] Potential Early Hints resource (heuristic):", url)
      
      // Store as potential Early Hints with lower confidence
      if (!tabData.potentialEarlyHints) {
        tabData.potentialEarlyHints = new Set()
      }
      tabData.potentialEarlyHints.add(url)
      
      if (!tabData.resourceMetadata) {
        tabData.resourceMetadata = new Map()
      }
      
      tabData.resourceMetadata.set(url, {
        type: details.type,
        detectionMethod: 'timing_heuristic',
        confidence: 'low',
        timestamp: timeStamp
      })
    }
  }
}

/**
 * Gets Early Hints data for a specific tab
 * @param {number} tabId - Tab ID
 * @returns {Object|null} Early Hints data or null
 */
export function getTabEarlyHints(tabId) {
  const data = tabEarlyHints.get(tabId)
  if (!data) return null

  return {
    confirmedResources: Array.from(data.earlyHintsResources),
    potentialResources: data.potentialEarlyHints ? Array.from(data.potentialEarlyHints) : [],
    hasServerIndicator: data.hasServerTimingIndicator || false,
    hasEarlyHintsHeader: data.hasEarlyHintsHeader || false,
    headerValue: data.earlyHintsHeaderValue || null,
    domain: data.domain,
    metadata: data.resourceMetadata ? Object.fromEntries(data.resourceMetadata) : {}
  }
}

/**
 * Checks if a specific URL was loaded via Early Hints
 * @param {number} tabId - Tab ID
 * @param {string} url - Resource URL to check
 * @returns {Object} Early Hints status and confidence level
 */
export function isEarlyHintsResource(tabId, url) {
  const data = tabEarlyHints.get(tabId)
  if (!data) {
    return { isEarlyHints: false, confidence: 'none', method: null }
  }

  // Check confirmed Early Hints resources (from 103 responses)
  if (data.earlyHintsResources.has(url)) {
    const metadata = data.resourceMetadata?.get(url)
    return {
      isEarlyHints: true,
      confidence: 'high',
      method: metadata?.detectionMethod || '103_response',
      metadata: metadata
    }
  }

  // Check potential Early Hints resources (heuristic)
  if (data.potentialEarlyHints?.has(url)) {
    const metadata = data.resourceMetadata?.get(url)
    return {
      isEarlyHints: true,
      confidence: 'low',
      method: metadata?.detectionMethod || 'timing_heuristic',
      metadata: metadata
    }
  }

  return { isEarlyHints: false, confidence: 'none', method: null }
}

/**
 * Cleans up Early Hints data for a tab
 * @param {number} tabId - Tab ID to clean up
 */
function cleanupTabEarlyHints(tabId) {
  tabEarlyHints.delete(tabId)
  console.log("🧹 [Early Hints] Cleaned up data for tab:", tabId)
}

/**
 * Gets Early Hints statistics for debugging
 * @returns {Object} Early Hints statistics
 */
export function getEarlyHintsStats() {
  const stats = {
    totalTabs: tabEarlyHints.size,
    tabsWithEarlyHints: 0,
    totalConfirmedResources: 0,
    totalPotentialResources: 0
  }

  tabEarlyHints.forEach(data => {
    if (data.earlyHintsResources.size > 0 || (data.potentialEarlyHints && data.potentialEarlyHints.size > 0)) {
      stats.tabsWithEarlyHints++
    }
    stats.totalConfirmedResources += data.earlyHintsResources.size
    stats.totalPotentialResources += (data.potentialEarlyHints?.size || 0)
  })

  return stats
}