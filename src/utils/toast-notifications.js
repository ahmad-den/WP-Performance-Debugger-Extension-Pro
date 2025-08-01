/**
 * Professional toast notification system
 */

// Toast container and configuration
let toastContainer = null
let toastCounter = 0

const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
}

const TOAST_CONFIG = {
  duration: {
    success: 2500,
    error: 4000,
    warning: 3000,
    info: 2500,
  },
  maxToasts: 3,
  position: "top-center", // Changed to top-center for better positioning
}

/**
 * Initialize the toast container
 */
function initializeToastContainer() {
  if (toastContainer) return

  toastContainer = document.createElement("div")
  toastContainer.id = "toast-container"
  toastContainer.className = `toast-container toast-${TOAST_CONFIG.position}`

  // Add container styles
  toastContainer.style.cssText = `
    position: fixed;
    z-index: 10000;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 320px;
    padding: 8px;
  `

  // Position the container
  switch (TOAST_CONFIG.position) {
    case "top-center":
      toastContainer.style.top = "8px"
      toastContainer.style.left = "50%"
      toastContainer.style.transform = "translateX(-50%)"
      break
    case "top-right":
      toastContainer.style.top = "8px"
      toastContainer.style.right = "8px"
      break
    case "top-left":
      toastContainer.style.top = "8px"
      toastContainer.style.left = "8px"
      break
    case "bottom-right":
      toastContainer.style.bottom = "8px"
      toastContainer.style.right = "8px"
      toastContainer.style.flexDirection = "column-reverse"
      break
    case "bottom-left":
      toastContainer.style.bottom = "8px"
      toastContainer.style.left = "8px"
      toastContainer.style.flexDirection = "column-reverse"
      break
  }

  document.body.appendChild(toastContainer)
}

/**
 * Create a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {Object} options - Additional options
 * @returns {HTMLElement} The toast element
 */
function createToast(message, type = TOAST_TYPES.INFO, options = {}) {
  initializeToastContainer()

  const toastId = `toast-${++toastCounter}`
  const duration = options.duration || TOAST_CONFIG.duration[type]
  const dismissible = options.dismissible !== false
  const compact = options.compact !== false // Default to compact

  // Create toast element
  const toast = document.createElement("div")
  toast.id = toastId
  toast.className = `toast toast-${type} ${compact ? "toast-compact" : ""}`
  toast.style.pointerEvents = "auto"

  // Get icon for toast type
  const icon = getToastIcon(type)

  // Create compact toast content
  if (compact) {
    toast.innerHTML = `
      <div class="toast-content-compact">
        <div class="toast-icon-compact">${icon}</div>
        <div class="toast-message-compact">${message}</div>
        ${dismissible ? '<button class="toast-dismiss-compact" aria-label="Dismiss">×</button>' : ""}
      </div>
      <div class="toast-progress-compact"></div>
    `
  } else {
    // Keep original layout for non-compact toasts
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        ${dismissible ? '<button class="toast-dismiss" aria-label="Dismiss">&times;</button>' : ""}
      </div>
      <div class="toast-progress"></div>
    `
  }

  // Add event listeners
  if (dismissible) {
    const dismissBtn = toast.querySelector(compact ? ".toast-dismiss-compact" : ".toast-dismiss")
    dismissBtn.addEventListener("click", () => dismissToast(toast))
  }

  // Add to container
  toastContainer.appendChild(toast)

  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.classList.add("toast-show")
  })

  // Auto dismiss
  if (duration > 0) {
    const progressBar = toast.querySelector(compact ? ".toast-progress-compact" : ".toast-progress")

    // Animate progress bar
    progressBar.style.animation = `toast-progress ${duration}ms linear`

    setTimeout(() => {
      dismissToast(toast)
    }, duration)
  }

  // Limit number of toasts
  limitToasts()

  return toast
}

/**
 * Dismiss a toast notification
 * @param {HTMLElement} toast - The toast element to dismiss
 */
function dismissToast(toast) {
  if (!toast || !toast.parentNode) return

  toast.classList.add("toast-hide")

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  }, 300) // Match animation duration
}

/**
 * Limit the number of visible toasts
 */
function limitToasts() {
  const toasts = toastContainer.querySelectorAll(".toast")
  if (toasts.length > TOAST_CONFIG.maxToasts) {
    const oldestToast = toasts[0]
    dismissToast(oldestToast)
  }
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} SVG icon
 */
function getToastIcon(type) {
  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22,4 12,14.01 9,11.01"></polyline>
    </svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`,
  }
  return icons[type] || icons.info
}

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {Object} options - Additional options
 */
export function showSuccessToast(message, options = {}) {
  return createToast(message, TOAST_TYPES.SUCCESS, options)
}

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 */
export function showErrorToast(message, options = {}) {
  return createToast(message, TOAST_TYPES.ERROR, options)
}

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 */
export function showWarningToast(message, options = {}) {
  return createToast(message, TOAST_TYPES.WARNING, options)
}

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 */
export function showInfoToast(message, options = {}) {
  return createToast(message, TOAST_TYPES.INFO, options)
}

/**
 * Show toast with action button
 * @param {string} message - Toast message
 * @param {string} type - Toast type
 * @param {Object} action - Action configuration
 * @param {Object} options - Additional options
 */
export function showActionToast(message, type, action, options = {}) {
  return createToast(message, type, { ...options, action })
}

/**
 * Clear all toasts
 */
export function clearAllToasts() {
  if (!toastContainer) return

  const toasts = toastContainer.querySelectorAll(".toast")
  toasts.forEach((toast) => dismissToast(toast))
}

/**
 * Configure toast system
 * @param {Object} config - Configuration options
 */
export function configureToasts(config) {
  Object.assign(TOAST_CONFIG, config)
}

// Export types for convenience
export { TOAST_TYPES }
