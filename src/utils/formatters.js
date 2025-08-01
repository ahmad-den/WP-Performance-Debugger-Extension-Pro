/**
 * Formats a file size in bytes to a human-readable string
 * @param {number} bytes - The size in bytes
 * @returns {string} Formatted size string (e.g., "1.5 KB")
 */
export function formatFileSize(bytes) {
  if (!bytes) return "Unknown"
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

/**
 * Gets the appropriate background color for a header value
 * @param {string} headerKey - The header key
 * @param {string} value - The header value
 * @returns {string} CSS color value
 */
export function getHeaderColor(headerKey, value) {
  const lowerValue = typeof value === "string" ? value.toLowerCase().trim() : "n/a"
  const saneKey = typeof headerKey === "string" ? headerKey.toLowerCase().replace(/-/g, "") : ""

  switch (saneKey) {
    case "xbigscootscachestatus":
    case "cfcachestatus":
      return getCacheStatusColor(lowerValue)
    case "xbigscootscacheplan":
      return getCachePlanColor(lowerValue)
    case "xbigscootscachemode":
    case "xbigscootscachemodeo2o":
      return getEnabledDisabledColor(lowerValue === "enabled" || lowerValue === "true", lowerValue === "n/a")
    case "xezoiccdn":
      if (lowerValue === "hit") return "var(--success-bg-strong)"
      if (lowerValue === "n/a" || lowerValue === "") return "var(--neutral-bg)"
      return "var(--error-bg-strong)"
    case "xnpcfe":
      if (lowerValue && lowerValue !== "n/a" && lowerValue !== "disabled" && lowerValue !== "inactive")
        return "var(--success-bg-strong)"
      if (lowerValue === "n/a" || lowerValue === "") return "var(--neutral-bg)"
      return "var(--error-bg-strong)"
    case "perfmattersrucss":
    case "perfmattersdelayjs":
      return getEnabledDisabledColor(lowerValue === "enabled", lowerValue === "n/a")
    case "xhostedby":
      return lowerValue && lowerValue !== "n/a" && lowerValue.trim() !== ""
        ? "var(--info-bg-strong)"
        : "var(--neutral-bg)"
    case "contentencoding":
      return lowerValue && lowerValue !== "n/a" && lowerValue.trim() !== ""
        ? "var(--info-bg-strong)"
        : "var(--neutral-bg)"
    case "gtm":
    case "ua":
    case "ga4":
    case "ga":
      return lowerValue && lowerValue !== "n/a" && lowerValue.trim() !== ""
        ? "var(--warning-bg-strong)"
        : "var(--neutral-bg)"
    case "adprovider":
      if (lowerValue === "none detected" || lowerValue === "n/a" || lowerValue === "") return "var(--neutral-bg)"
      return "var(--success-bg-strong)"
    default:
      return "var(--neutral-bg)"
  }
}

/**
 * Gets the color for a cache status value
 * @param {string} status - The cache status
 * @returns {string} CSS color value
 */
function getCacheStatusColor(status) {
  switch (status) {
    case "hit":
      return "var(--success-bg-strong)"
    case "miss":
      return "var(--error-bg-strong)"
    case "bypass":
      return "var(--warning-bg-strong)"
    case "dynamic":
      return "var(--info-bg-strong)"
    default:
      return "var(--neutral-bg)"
  }
}

/**
 * Gets the color for a cache plan value
 * @param {string} plan - The cache plan
 * @returns {string} CSS color value
 */
function getCachePlanColor(plan) {
  switch (plan) {
    case "standard":
      return "var(--plan-standard-bg)"
    case "performance+":
      return "var(--plan-performance-plus-bg)"
    default:
      return "var(--neutral-bg)"
  }
}

/**
 * Gets the color for enabled/disabled status
 * @param {boolean} isEnabled - Whether the feature is enabled
 * @param {boolean} isNA - Whether the value is N/A
 * @returns {string} CSS color value
 */
function getEnabledDisabledColor(isEnabled, isNA = false) {
  if (isNA) return "var(--neutral-bg)"
  return isEnabled ? "var(--success-bg-strong)" : "var(--error-bg-strong)"
}

/**
 * Gets the appropriate text color for a background color
 * @param {string} bgColorHexOrVar - The background color
 * @returns {string} CSS color value for text
 */
export function getContrastColor(bgColorHexOrVar) {
  let hexColor = bgColorHexOrVar
  if (hexColor.startsWith("var(--")) {
    const varName = hexColor.match(/--([a-zA-Z0-9-]+)/)[0]
    hexColor = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  }

  if (!hexColor || !hexColor.startsWith("#")) return "var(--text-primary)"
  hexColor = hexColor.slice(1)

  let r, g, b
  if (hexColor.length === 3) {
    r = Number.parseInt(hexColor[0] + hexColor[0], 16)
    g = Number.parseInt(hexColor[1] + hexColor[1], 16)
    b = Number.parseInt(hexColor[2] + hexColor[2], 16)
  } else if (hexColor.length === 6) {
    r = Number.parseInt(hexColor.substr(0, 2), 16)
    g = Number.parseInt(hexColor.substr(2, 2), 16)
    b = Number.parseInt(hexColor.substr(4, 2), 16)
  } else {
    return "var(--text-primary)"
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "var(--text-primary)"

  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  if (bgColorHexOrVar.includes("-strong") || bgColorHexOrVar === "var(--plan-performance-plus-bg)") {
    return "#ffffff"
  }
  if (bgColorHexOrVar === "var(--plan-standard-bg)") return "var(--text-primary)"

  return yiq >= 145 ? "var(--text-primary)" : "#ffffff"
}
