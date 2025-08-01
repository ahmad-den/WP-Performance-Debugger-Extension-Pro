/**
 * Module for handling header display in the popup
 */

import { getHeaderColor, getContrastColor } from "../../utils/formatters.js"

/**
 * Updates the header display with analysis results
 * @param {Object} headersData - Headers data object
 */
export function updateHeaderDisplay(headersData) {
  const headerInfoContainer = document.getElementById("headerInfo")

  // Add margin if no button is present
  if (headerInfoContainer) headerInfoContainer.style.marginTop = "0px"

  const existingEmptyMsg = headerInfoContainer.querySelector(".empty-state-message")
  if (existingEmptyMsg) existingEmptyMsg.remove()

  const allHeaderValueSpans = headerInfoContainer.querySelectorAll(".header-list li .header-value")

  // Reset all headers to default state
  resetHeaderValues(allHeaderValueSpans)

  if (headersData && Object.keys(headersData).length > 0) {
    const hasAnyData = updateHeaderValues(allHeaderValueSpans, headersData)

    if (!hasAnyData) {
      showEmptyHeaderMessage(headerInfoContainer, "All header information is N/A or analysis pending.")
    }
  } else {
    showEmptyHeaderMessage(headerInfoContainer, "No header information available or analysis pending.")
  }

  headerInfoContainer.style.display = "block"
}

/**
 * Resets all header values to default state
 * @param {NodeList} headerValueSpans - All header value span elements
 */
function resetHeaderValues(headerValueSpans) {
  headerValueSpans.forEach((spanElement) => {
    spanElement.textContent = "N/A"
    const defaultBgColor = getHeaderColor("", "N/A")
    spanElement.style.backgroundColor = defaultBgColor
    spanElement.style.color = getContrastColor(defaultBgColor)
    spanElement.style.display = "inline-block"
    if (spanElement.id === "adprovider") {
      spanElement.setAttribute("data-provider", "N/A")
    }
  })
}

/**
 * Updates header values with actual data
 * @param {NodeList} headerValueSpans - All header value span elements
 * @param {Object} headersData - Headers data object
 * @returns {boolean} True if any data was found
 */
function updateHeaderValues(headerValueSpans, headersData) {
  let hasAnyData = false

  headerValueSpans.forEach((spanElement) => {
    const elementId = spanElement.id
    let headerKeyToLookup = elementId

    const keyMapping = {
      perfmattersrucss: "perfmattersRUCSS",
      perfmattersdelayjs: "perfmattersDelayJS",
      adprovider: "adProvider",
    }

    if (keyMapping[elementId]) {
      headerKeyToLookup = keyMapping[elementId]
    }

    const value = headersData[headerKeyToLookup]

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      spanElement.textContent = String(value)
      hasAnyData = true
    } else {
      spanElement.textContent = "N/A"
    }

    const bgColor = getHeaderColor(headerKeyToLookup, value)
    spanElement.style.backgroundColor = bgColor
    spanElement.style.color = getContrastColor(bgColor)

    if (elementId === "adprovider") {
      spanElement.setAttribute("data-provider", value && String(value).trim() !== "" ? String(value) : "N/A")
    }
  })

  return hasAnyData
}

/**
 * Shows an empty state message
 * @param {HTMLElement} container - The container element
 * @param {string} message - The message to show
 */
function showEmptyHeaderMessage(container, message) {
  if (!container.querySelector(".empty-state-message")) {
    const p = document.createElement("p")
    p.textContent = message
    p.className = "empty-state-message"
    container.appendChild(p)
  }
}
