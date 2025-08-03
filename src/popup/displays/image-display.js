/**
 * Module for handling image display in the popup
 */

// Import the simplified helpers
import { sendMessageToContentScript, showElementFeedback } from "../../utils/tab-helpers.js"

/**
 * Updates the image display with analysis results
 * @param {Array} images - Array of image data
 */
export function updateImageDisplay(images) {
  const imageInfo = document.getElementById("imageInfo")
  const imageCountEl = document.getElementById("imageCount")
  const imageList = document.getElementById("imageList")

  // Add margin if no button is present
  if (imageInfo) imageInfo.style.marginTop = "0px"

  const totalImages = images.length
  imageCountEl.textContent = `Found ${totalImages} preloaded image${totalImages !== 1 ? "s" : ""}`
  imageList.innerHTML = ""

  if (totalImages === 0) {
    imageInfo.style.display = "block"
    const p = document.createElement("p")
    p.textContent = "No preloaded images detected on this page."
    p.className = "empty-state-message"
    imageList.appendChild(p)
    return
  }

  images.forEach((image) => {
    const li = createImageListItem(image)
    imageList.appendChild(li)
  })

  imageInfo.style.display = "block"
}

/**
 * Creates a list item for an image
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The created list item
 */
function createImageListItem(image) {
  const li = document.createElement("li")
  li.className = "image-list-item"
  li.style.cursor = "pointer"
  li.title = "Click to highlight this image on the page"

  // Add click handler to highlight image on page
  li.addEventListener("click", async () => {
    // Get the target tab ID (handles detached mode)
    const targetTabId = await window.getTargetTabId()

    if (!targetTabId) {
      console.log("No target tab available for image highlighting")
      showElementFeedback(li, "error")
      return
    }

    // Show immediate feedback
    showElementFeedback(li, "success")

    const response = await sendMessageToContentScript(targetTabId, {
      action: "highlightImage",
      imageUrl: image.url,
    })

    if (!response) {
      console.log("Failed to highlight image")
    }
  })

  const imgContainer = createImageContainer(image)
  const infoContainer = createImageInfoContainer(image)

  li.appendChild(imgContainer)
  li.appendChild(infoContainer)

  return li
}

/**
 * Creates the image container with thumbnail
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The image container
 */
function createImageContainer(image) {
  const imgContainer = document.createElement("div")
  imgContainer.className = "img-container"

  const img = document.createElement("img")
  img.alt = image.url.substring(image.url.lastIndexOf("/") + 1)
  img.crossOrigin = "anonymous"

  const fallbackIcon = document.createElement("div")
  fallbackIcon.className = "fallback-icon"
  fallbackIcon.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'

  img.onload = () => {
    img.style.display = "block"
    fallbackIcon.style.display = "none"
  }
  img.onerror = () => {
    img.style.display = "none"
    fallbackIcon.style.display = "flex"
  }
  img.src = image.url

  imgContainer.appendChild(img)
  imgContainer.appendChild(fallbackIcon)

  return imgContainer
}

/**
 * Creates the image info container with details and status indicators
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The info container
 */
function createImageInfoContainer(image) {
  const infoContainer = document.createElement("div")
  infoContainer.className = "info-container"

  const urlSpan = document.createElement("span")
  urlSpan.className = "url"
  urlSpan.textContent = image.url
  infoContainer.appendChild(urlSpan)

  const detailsSpan = createImageDetailsSpan(image)
  infoContainer.appendChild(detailsSpan)

  const statusContainer = createImageStatusContainer(image)
  infoContainer.appendChild(statusContainer)

  return infoContainer
}

/**
 * Creates the details span for an image
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The details span
 */
function createImageDetailsSpan(image) {
  const detailsSpan = document.createElement("span")
  detailsSpan.className = "details"
  const details = []

  // Add enhanced details
  if (image.aboveFold !== undefined) {
    details.push(image.aboveFold ? "Above fold" : "Below fold")
  }
  if (image.format) details.push(`Format: ${image.format}`)
  if (image.fileSizeFormatted) details.push(`Size: ${image.fileSizeFormatted}`)
  if (image.dimensions?.displayed) {
    details.push(`${image.dimensions.displayed.width}×${image.dimensions.displayed.height}px`)
  }
  if (image.type) details.push(`Type: ${image.type}`)
  if (image.loading && image.loading !== "auto") details.push(`Loading: ${image.loading}`)

  detailsSpan.textContent = details.length > 0 ? details.join(" | ") : "No additional details"
  return detailsSpan
}

/**
 * Creates the status container with status indicators
 * @param {Object} image - Image data object
 * @returns {HTMLElement} The status container
 */
function createImageStatusContainer(image) {
  const statusContainer = document.createElement("div")
  statusContainer.className = "status-container"

  // Critical Path indicator (most important)
  if (image.isCritical !== undefined) {
    const criticalSticker = document.createElement("span")
    criticalSticker.textContent = image.isCritical ? "CRITICAL PATH" : "NON-CRITICAL"
    criticalSticker.className = image.isCritical ? "status-sticker critical-path" : "status-sticker non-critical"
    statusContainer.appendChild(criticalSticker)
  }

  // Above/Below fold indicator
  if (image.aboveFold !== undefined) {
    const foldSticker = document.createElement("span")
    foldSticker.textContent = image.aboveFold ? "ABOVE FOLD" : "BELOW FOLD"
    foldSticker.className = image.aboveFold ? "status-sticker above-fold" : "status-sticker below-fold"
    statusContainer.appendChild(foldSticker)
  }

  return statusContainer
}
