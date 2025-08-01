/**
 * Module for managing URL parameters
 */

// Store query parameters per tab
const tabParameters = new Map()

/**
 * Updates URL with parameters
 * @param {string} url - The original URL
 * @param {Set} parameters - Set of parameters to add
 * @returns {string} The updated URL
 */
export function updateUrlWithParameters(url, parameters) {
  try {
    const urlObj = new URL(url)
    urlObj.searchParams.forEach((value, key) => {
      if (!parameters.has(key)) {
        urlObj.searchParams.delete(key)
      }
    })
    parameters.forEach((param) => {
      urlObj.searchParams.set(param, "")
    })
    return urlObj.toString()
  } catch (error) {
    return url // Return original URL if there's an error
  }
}

/**
 * Gets parameters from a URL
 * @param {string} url - The URL to extract parameters from
 * @returns {Set} Set of parameter names
 */
export function getParametersFromUrl(url) {
  try {
    const urlObj = new URL(url)
    return new Set(urlObj.searchParams.keys())
  } catch (error) {
    return new Set()
  }
}

/**
 * Stores parameters for a specific tab
 * @param {number} tabId - The ID of the tab
 * @param {Set} parameters - The parameters to store
 */
export function storeTabParameters(tabId, parameters) {
  tabParameters.set(tabId, parameters)
}

/**
 * Gets parameters for a specific tab
 * @param {number} tabId - The ID of the tab
 * @returns {Set} The stored parameters or an empty Set if not found
 */
export function getTabParameters(tabId) {
  return tabParameters.get(tabId) || new Set()
}

/**
 * Adds a parameter to a tab
 * @param {number} tabId - The ID of the tab
 * @param {string} parameter - The parameter to add
 * @returns {boolean} True if the parameter was added, false if it was already present
 */
export function addTabParameter(tabId, parameter) {
  let params = tabParameters.get(tabId)
  if (!params) {
    params = new Set()
    tabParameters.set(tabId, params)
  }

  if (params.has(parameter)) {
    return false
  }

  params.add(parameter)
  return true
}

/**
 * Removes a parameter from a tab
 * @param {number} tabId - The ID of the tab
 * @param {string} parameter - The parameter to remove
 * @returns {boolean} True if the parameter was removed, false if it wasn't present
 */
export function removeTabParameter(tabId, parameter) {
  const params = tabParameters.get(tabId)
  if (!params || !params.has(parameter)) {
    return false
  }

  params.delete(parameter)
  return true
}

/**
 * Removes stored parameters for a tab
 * @param {number} tabId - The ID of the tab to clean up
 */
export function cleanupTabParameters(tabId) {
  tabParameters.delete(tabId)
}

/**
 * Applies stored parameters to a tab's URL
 * @param {number} tabId - The ID of the tab
 * @param {Object} chrome - The Chrome API object
 */
export function applyParametersToTab(tabId, chrome) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      return
    }
    const params = getTabParameters(tabId)
    const currentUrlParams = getParametersFromUrl(tab.url)
    const newUrl = updateUrlWithParameters(tab.url, params)
    if (newUrl !== tab.url && !setsEqual(params, currentUrlParams)) {
      chrome.tabs.update(tabId, { url: newUrl })
    }
  })
}

/**
 * Compares two sets for equality
 * @param {Set} a - First set
 * @param {Set} b - Second set
 * @returns {boolean} True if sets are equal
 */
function setsEqual(a, b) {
  return a.size === b.size && [...a].every((value) => b.has(value))
}
