/**
 * Simplified PSI Insights Renderer
 * Renders PageSpeed Insights data with minimal DOM structure
 */

export class InsightsRenderer {
  constructor() {
    this.expandedInsights = new Set()
    this.activeTooltip = null
  }

  /**
   * Render the complete PSI insights interface
   */
  renderInsights(container, insights) {
    if (!container) {
      console.error("InsightsRenderer: Container element not found")
      return
    }

    // Clear existing content
    container.innerHTML = ""

    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      this.renderEmptyState(container)
      return
    }

    // Render header directly to container
    const header = this.renderHeader(insights.length)
    container.appendChild(header)

    // Render insights directly to container
    insights.forEach((insight, index) => {
      const item = this.renderInsightItem(insight, index)
      container.appendChild(item)
    })

    // Initialize tooltip system after rendering
    this.initializeTooltips()
  }

  /**
   * Initialize smart tooltip system with proper cleanup
   */
  initializeTooltips() {
    // Clean up any existing tooltips and listeners
    this.cleanupTooltips()

    // Add event listeners to all tooltip triggers
    document.querySelectorAll(".tooltip-trigger").forEach((trigger) => {
      trigger.addEventListener("mouseenter", (e) => this.showTooltip(e))
      trigger.addEventListener("mouseleave", (e) => this.hideTooltip(e))
      trigger.addEventListener("mousemove", (e) => this.updateTooltipPosition(e))
    })
  }

  /**
   * Clean up all tooltips and prevent clustering
   */
  cleanupTooltips() {
    // Remove all existing tooltips
    document.querySelectorAll(".smart-tooltip").forEach((tooltip) => tooltip.remove())
    this.activeTooltip = null
  }

  /**
   * Show smart positioned tooltip with clustering prevention
   */
  showTooltip(event) {
    // Prevent multiple tooltips
    this.cleanupTooltips()

    const trigger = event.target
    const tooltipText = trigger.getAttribute("data-tooltip")

    if (!tooltipText) return

    // Create tooltip element
    const tooltip = document.createElement("div")
    tooltip.className = "smart-tooltip"
    tooltip.textContent = tooltipText
    document.body.appendChild(tooltip)

    // Store reference
    this.activeTooltip = tooltip
    trigger._tooltip = tooltip

    // Position tooltip
    this.positionTooltip(trigger, tooltip)
  }

  /**
   * Position tooltip intelligently
   */
  positionTooltip(trigger, tooltip) {
    const triggerRect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 16

    // Calculate initial position (below trigger)
    let left = triggerRect.left
    let top = triggerRect.bottom + 8

    // Adjust horizontal position if tooltip would overflow
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding
    }
    if (left < padding) {
      left = padding
    }

    // Adjust vertical position if tooltip would overflow
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = triggerRect.top - tooltipRect.height - 8
    }
    if (top < padding) {
      top = triggerRect.bottom + 8 // Fallback to below
    }

    // Apply position with smooth animation
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`
    tooltip.style.opacity = "1"
    tooltip.style.transform = "translateY(0)"
  }

  /**
   * Update tooltip position on mouse move (for better tracking)
   */
  updateTooltipPosition(event) {
    if (!this.activeTooltip) return

    const trigger = event.target
    this.positionTooltip(trigger, this.activeTooltip)
  }

  /**
   * Hide tooltip with proper cleanup
   */
  hideTooltip(event) {
    const trigger = event.target
    if (trigger._tooltip) {
      trigger._tooltip.remove()
      trigger._tooltip = null
    }
    if (this.activeTooltip) {
      this.activeTooltip.remove()
      this.activeTooltip = null
    }
  }

  /**
   * Render the insights header with count
   */
  renderHeader(count) {
    const header = document.createElement("div")
    header.className = "psi-insights-header"

    const title = document.createElement("h3")
    title.className = "section-title"
    title.textContent = "Performance Insights"

    const countBadge = document.createElement("span")
    countBadge.className = "insights-count"
    countBadge.textContent = `${count} insights`

    header.appendChild(title)
    header.appendChild(countBadge)

    return header
  }

  /**
   * Render individual insight item - simplified without icons
   */
  renderInsightItem(insight, index) {
    const item = document.createElement("div")

    // Determine status based on score instead of hardcoding
    const statusClass = this.determineInsightStatus(insight)
    item.className = `psi-insight-item ${statusClass}`

    // Create header
    const header = this.renderInsightHeader(insight, index)
    item.appendChild(header)

    // Create content (initially hidden)
    const content = this.renderInsightContent(insight)
    item.appendChild(content)

    return item
  }

  /**
   * Determine insight status based on category and score
   */
  determineInsightStatus(insight) {
    // First check if insight has a category from the API
    if (insight.category) {
      switch (insight.category) {
        case "failed":
          return "failed-insight"
        case "warning":
          return "warning-insight"
        default:
          return "unknown-insight"
      }
    }

    // Fallback to score-based determination if no category
    if (insight.score === undefined || insight.score === null) {
      return "unknown-insight"
    }

    const score = Number.parseFloat(insight.score)

    // PSI scoring: 0-0.49 = failed, 0.5-0.89 = warning
    if (score < 0.5) {
      return "failed-insight"
    } else if (score < 0.9) {
      return "warning-insight"
    } else {
      return "unknown-insight"
    }
  }

  /**
   * Render insight header (clickable) - simplified without icons
   */
  renderInsightHeader(insight, index) {
    const header = document.createElement("div")
    header.className = "insight-header"
    header.setAttribute("role", "button")
    header.setAttribute("tabindex", "0")
    header.setAttribute("aria-expanded", "false")

    // Title only (no icon)
    const title = document.createElement("div")
    title.className = "insight-title"
    title.textContent = this.formatInsightTitle(insight.title || insight.id)

    // Expand icon
    const expandIcon = document.createElement("div")
    expandIcon.className = "insight-expand-icon"
    expandIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
        `

    header.appendChild(title)
    header.appendChild(expandIcon)

    // Add click handler
    header.addEventListener("click", () => this.toggleInsight(header.parentElement, index))
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        this.toggleInsight(header.parentElement, index)
      }
    })

    return header
  }

  /**
   * Render insight content with support for different detail types
   */
  renderInsightContent(insight) {
    console.log("Rendering insight content for:", insight.title || insight.id, insight)

    const content = document.createElement("div")
    content.className = "insight-content"

    // Add description if available
    if (insight.description) {
      const description = this.renderDescription(insight.description)
      content.appendChild(description)
    }

    // Special handling for network dependency tree
    if (insight.id === "network-dependency-tree-insight" || insight.id === "critical-request-chains") {
      console.log("Detected network dependency tree insight")
      const networkTree = this.renderNetworkDependencyFromAPI(insight)
      content.appendChild(networkTree)
      return content
    }

    // Handle different types of details
    if (insight.details) {
      console.log("Processing insight details:", insight.details)

      if (insight.details.type === "network-tree") {
        console.log("Rendering network tree for:", insight.title)
        const networkTree = this.renderNetworkTree(insight.details)
        content.appendChild(networkTree)
      } else if (insight.details.items) {
        console.log("Rendering details items for:", insight.title)
        const detailsContainer = this.renderDetails(insight.details, insight)
        if (detailsContainer.children.length > 0) {
          content.appendChild(detailsContainer)
        }
      } else {
        console.log("Unknown details structure for:", insight.title, insight.details)
        // Show raw details structure for debugging
        const debugContainer = document.createElement("div")
        debugContainer.className = "debug-details"
        debugContainer.innerHTML = `<pre style="font-size: 10px; max-height: 150px; overflow: auto;">${JSON.stringify(insight.details, null, 2)}</pre>`
        content.appendChild(debugContainer)
      }
    } else {
      console.log("No details found for:", insight.title)
      // Show a minimal "no data" message if no details
      const noData = document.createElement("div")
      noData.className = "no-data-message"
      noData.textContent = "No detailed data available"
      content.appendChild(noData)
    }

    return content
  }

  /**
   * Render network dependency tree from API response structure
   */
  renderNetworkDependencyFromAPI(insight) {
    console.log("Rendering network dependency tree from API:", insight)

    const container = document.createElement("div")
    container.className = "network-dependency-container"

    // Extract chains data from the API structure
    let chainsData = null
    let longestChain = null

    if (insight.details && insight.details.items && insight.details.items.length > 0) {
      const firstItem = insight.details.items[0]
      if (firstItem.value && firstItem.value.chains) {
        chainsData = firstItem.value.chains
        longestChain = firstItem.value.longestChain
        console.log("Found chains data:", chainsData)
      }
    }

    if (chainsData && Object.keys(chainsData).length > 0) {
      // Show summary info
      const summary = document.createElement("div")
      summary.className = "network-summary"

      const chainCount = Object.keys(chainsData).length

      summary.innerHTML = `
        <div class="summary-item">
          <span class="summary-label">Critical chains:</span>
          <span class="summary-value">${chainCount}</span>
        </div>
        ${
          longestChain && longestChain.duration
            ? `
        <div class="summary-item">
          <span class="summary-label">Longest chain:</span>
          <span class="summary-value">${Math.round(longestChain.duration)}ms</span>
        </div>
        `
            : ""
        }
      `
      container.appendChild(summary)

      // Render each chain
      const chainsContainer = document.createElement("div")
      chainsContainer.className = "critical-chains"

      Object.entries(chainsData).forEach(([chainId, chain], index) => {
        const chainHeader = document.createElement("div")
        chainHeader.className = "chain-header"
        chainHeader.textContent = `Chain ${index + 1}`
        chainsContainer.appendChild(chainHeader)

        const chainTree = this.renderAPIChain(chain, 0)
        chainsContainer.appendChild(chainTree)
      })

      container.appendChild(chainsContainer)
    } else {
      // No chains data found
      const noChains = document.createElement("div")
      noChains.className = "no-chains-message"
      noChains.textContent = "No critical request chains detected"
      container.appendChild(noChains)
    }

    return container
  }

  /**
   * Render a chain from the API response structure
   */
  renderAPIChain(chain, depth) {
    const chainElement = document.createElement("div")
    chainElement.className = `critical-chain-item depth-${depth}`

    // Create the main item
    const itemElement = document.createElement("div")
    itemElement.className = "chain-item"

    // Add indentation
    const indent = document.createElement("div")
    indent.className = "chain-indent"
    indent.style.width = `${depth * 16}px`

    if (depth > 0) {
      indent.innerHTML = "└─ "
    }

    // Extract URL info
    const url = chain.url || "Unknown URL"
    const filename = this.extractFilename(url)
    const domain = this.extractDomain(url)

    // Create URL display
    const urlDisplay = document.createElement("div")
    urlDisplay.className = "chain-url"

    const urlText = document.createElement("span")
    urlText.className = "url-text tooltip-trigger"
    urlText.setAttribute("data-tooltip", url)
    urlText.textContent = filename

    if (domain && !domain.includes(window.location.hostname)) {
      const domainSpan = document.createElement("span")
      domainSpan.className = "url-domain"
      domainSpan.textContent = ` (${domain})`
      urlText.appendChild(domainSpan)
    }

    urlDisplay.appendChild(urlText)

    // Add timing info
    const timing = document.createElement("div")
    timing.className = "chain-timing"

    const transferSize = chain.transferSize || 0
    const duration = chain.navStartToEndTime || 0

    timing.innerHTML = `
      <span class="timing-size">${this.formatBytes(transferSize)}</span>
      <span class="timing-duration">${Math.round(duration)}ms</span>
    `

    // Combine elements
    itemElement.appendChild(indent)
    itemElement.appendChild(urlDisplay)
    itemElement.appendChild(timing)
    chainElement.appendChild(itemElement)

    // Render children recursively
    if (chain.children && Object.keys(chain.children).length > 0) {
      Object.values(chain.children).forEach((childChain) => {
        const childElement = this.renderAPIChain(childChain, depth + 1)
        chainElement.appendChild(childElement)
      })
    }

    return chainElement
  }

  /**
   * Render network dependency tree specifically for critical request chains
   */
  renderNetworkDependencyTree(insight) {
    console.log("Rendering network dependency tree for critical request chains:", insight)

    const container = document.createElement("div")
    container.className = "network-dependency-container"

    // Check if we have chains data
    let chainsData = null

    if (insight.details && insight.details.chains) {
      chainsData = insight.details.chains
    } else if (insight.details && insight.details.items) {
      // Look for chains in items
      for (const item of insight.details.items) {
        if (item.chains) {
          chainsData = item.chains
          break
        }
      }
    }

    if (chainsData && Object.keys(chainsData).length > 0) {
      // Show summary info
      const summary = document.createElement("div")
      summary.className = "network-summary"

      const chainCount = Object.keys(chainsData).length
      const longestChain = this.findLongestChain(chainsData)

      summary.innerHTML = `
        <div class="summary-item">
          <span class="summary-label">Critical chains:</span>
          <span class="summary-value">${chainCount}</span>
        </div>
        ${
          longestChain
            ? `
        <div class="summary-item">
          <span class="summary-label">Longest chain:</span>
          <span class="summary-value">${Math.round(longestChain.duration)}ms</span>
        </div>
        `
            : ""
        }
      `
      container.appendChild(summary)

      // Render each chain
      const chainsContainer = document.createElement("div")
      chainsContainer.className = "critical-chains"

      Object.entries(chainsData).forEach(([chainId, chain], index) => {
        const chainHeader = document.createElement("div")
        chainHeader.className = "chain-header"
        chainHeader.textContent = `Chain ${index + 1}`
        chainsContainer.appendChild(chainHeader)

        const chainTree = this.renderCriticalChain(chain, 0)
        chainsContainer.appendChild(chainTree)
      })

      container.appendChild(chainsContainer)
    } else {
      // No chains data found
      const noChains = document.createElement("div")
      noChains.className = "no-chains-message"
      noChains.textContent = "No critical request chains detected"
      container.appendChild(noChains)
    }

    return container
  }

  /**
   * Find the longest chain for summary display
   */
  findLongestChain(chainsData) {
    let longest = null
    let maxDuration = 0

    Object.values(chainsData).forEach((chain) => {
      const duration = this.calculateChainDuration(chain)
      if (duration > maxDuration) {
        maxDuration = duration
        longest = { ...chain, duration }
      }
    })

    return longest
  }

  /**
   * Calculate total duration of a chain
   */
  calculateChainDuration(chain) {
    let totalDuration = chain.transferSize || 0

    if (chain.children) {
      Object.values(chain.children).forEach((child) => {
        totalDuration += this.calculateChainDuration(child)
      })
    }

    return totalDuration
  }

  /**
   * Render a critical request chain
   */
  renderCriticalChain(chain, depth) {
    const chainElement = document.createElement("div")
    chainElement.className = `critical-chain-item depth-${depth}`

    // Create the main item
    const itemElement = document.createElement("div")
    itemElement.className = "chain-item"

    // Add indentation
    const indent = document.createElement("div")
    indent.className = "chain-indent"
    indent.style.width = `${depth * 16}px`

    if (depth > 0) {
      indent.innerHTML = "└─ "
    }

    // Extract URL info
    const url = chain.request?.url || chain.url || "Unknown URL"
    const filename = this.extractFilename(url)
    const domain = this.extractDomain(url)

    // Create URL display
    const urlDisplay = document.createElement("div")
    urlDisplay.className = "chain-url"

    const urlText = document.createElement("span")
    urlText.className = "url-text tooltip-trigger"
    urlText.setAttribute("data-tooltip", url)
    urlText.textContent = filename

    if (domain && !domain.includes(window.location.hostname)) {
      const domainSpan = document.createElement("span")
      domainSpan.className = "url-domain"
      domainSpan.textContent = ` (${domain})`
      urlText.appendChild(domainSpan)
    }

    urlDisplay.appendChild(urlText)

    // Add timing info
    const timing = document.createElement("div")
    timing.className = "chain-timing"

    const transferSize = chain.transferSize || 0
    const duration = chain.responseReceivedTime - chain.startTime || 0

    timing.innerHTML = `
      <span class="timing-size">${this.formatBytes(transferSize)}</span>
      <span class="timing-duration">${Math.round(duration)}ms</span>
    `

    // Combine elements
    itemElement.appendChild(indent)
    itemElement.appendChild(urlDisplay)
    itemElement.appendChild(timing)
    chainElement.appendChild(itemElement)

    // Render children recursively
    if (chain.children && Object.keys(chain.children).length > 0) {
      Object.values(chain.children).forEach((childChain) => {
        const childElement = this.renderCriticalChain(childChain, depth + 1)
        chainElement.appendChild(childElement)
      })
    }

    return chainElement
  }

  /**
   * Render insight description with link formatting
   */
  renderDescription(description) {
    const descContainer = document.createElement("div")
    descContainer.className = "insight-description"

    // Convert markdown-style links to HTML links
    const htmlDescription = description.replace(
      /\[([^\]]+)\]$$([^)]+)$$/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="insight-link">$1</a>',
    )

    descContainer.innerHTML = htmlDescription
    return descContainer
  }

  /**
   * Render details based on type
   */
  renderDetails(details, insight) {
    const container = document.createElement("div")
    container.className = "insight-details-container"

    if (!details.items || !Array.isArray(details.items)) {
      console.log("No items array found in details:", details)
      return container
    }

    // Process items only once - find the first table-like structure
    let tableRendered = false

    for (const item of details.items) {
      if (item.type === "checklist") {
        const checklist = this.renderChecklist(item)
        container.appendChild(checklist)
      } else if (item.type === "node") {
        const nodeInfo = this.renderNodeInfo(item)
        container.appendChild(nodeInfo)
      } else if (item.items && Array.isArray(item.items) && !tableRendered) {
        // Only render the first table structure found
        const table = this.renderDetailsTable({ items: item.items, headings: item.headings }, insight)
        container.appendChild(table)
        tableRendered = true
      }
    }

    // Fallback: if no table was rendered, try extracting from details
    if (!tableRendered && container.children.length === 0) {
      const tableData = this.extractTableData(details)
      if (tableData && tableData.items && tableData.items.length > 0) {
        const table = this.renderDetailsTable(tableData, insight)
        container.appendChild(table)
      }
    }

    return container
  }

  /**
   * Render checklist items with checkmarks and X marks
   */
  renderChecklist(checklistItem) {
    const checklist = document.createElement("div")
    checklist.className = "insight-checklist"

    if (!checklistItem.items || typeof checklistItem.items !== "object") {
      return checklist
    }

    // Convert checklist items object to array for rendering
    Object.entries(checklistItem.items).forEach(([key, item]) => {
      const checklistRow = document.createElement("div")
      checklistRow.className = "checklist-item"

      // Create icon based on value
      const icon = document.createElement("div")
      icon.className = `checklist-icon ${item.value ? "checklist-pass" : "checklist-fail"}`

      if (item.value) {
        icon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        `
      } else {
        icon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `
      }

      // Create label
      const label = document.createElement("div")
      label.className = "checklist-label"
      label.textContent = item.label || key

      checklistRow.appendChild(icon)
      checklistRow.appendChild(label)
      checklist.appendChild(checklistRow)
    })

    return checklist
  }

  /**
   * Render node information
   */
  renderNodeInfo(nodeItem) {
    const nodeContainer = document.createElement("div")
    nodeContainer.className = "insight-node-info"

    if (nodeItem.snippet) {
      const snippet = document.createElement("div")
      snippet.className = "node-snippet"
      snippet.textContent = nodeItem.snippet
      nodeContainer.appendChild(snippet)
    }

    if (nodeItem.selector) {
      const selector = document.createElement("div")
      selector.className = "node-selector"
      selector.textContent = `Selector: ${nodeItem.selector}`
      nodeContainer.appendChild(selector)
    }

    if (nodeItem.nodeLabel) {
      const label = document.createElement("div")
      label.className = "node-label"
      label.textContent = nodeItem.nodeLabel
      nodeContainer.appendChild(label)
    }

    return nodeContainer
  }

  /**
   * Render network dependency tree - Fixed to handle PSI network tree structure
   */
  renderNetworkTree(details) {
    console.log("Rendering network tree with details:", details)

    const treeContainer = document.createElement("div")
    treeContainer.className = "network-tree-container"

    // Add maximum critical path latency if available
    if (details.longestChain && details.longestChain.duration) {
      const latencyInfo = document.createElement("div")
      latencyInfo.className = "network-latency-info"
      latencyInfo.textContent = `Maximum critical path latency: ${details.longestChain.duration} ms`
      treeContainer.appendChild(latencyInfo)
    }

    // Add initial navigation header
    const navHeader = document.createElement("div")
    navHeader.className = "network-nav-header"
    navHeader.textContent = "Initial Navigation"
    treeContainer.appendChild(navHeader)

    // Handle different possible structures for network tree data
    let chainsData = null

    // Check for chains in details directly
    if (details.chains) {
      chainsData = details.chains
      console.log("Found chains in details.chains:", chainsData)
    }
    // Check for chains in items array
    else if (details.items && Array.isArray(details.items)) {
      // Look for chains in the items array
      for (const item of details.items) {
        if (item.chains) {
          chainsData = item.chains
          console.log("Found chains in details.items[].chains:", chainsData)
          break
        }
        // Sometimes the entire item is the chain data
        if (item.url && (item.children || item.transferSize)) {
          // Convert single item to chains format
          chainsData = { 0: item }
          console.log("Converted single item to chains format:", chainsData)
          break
        }
      }

      // If no chains found but we have items, try to render as a simple list
      if (!chainsData && details.items.length > 0) {
        console.log("No chains found, rendering items as simple list")
        const simpleList = this.renderNetworkSimpleList(details.items)
        treeContainer.appendChild(simpleList)
        return treeContainer
      }
    }

    // Render the dependency chains if we found them
    if (chainsData && typeof chainsData === "object") {
      const chainsContainer = document.createElement("div")
      chainsContainer.className = "network-chains"

      Object.entries(chainsData).forEach(([chainId, chain]) => {
        console.log(`Rendering chain ${chainId}:`, chain)
        const chainElement = this.renderNetworkChain(chain, 0)
        chainsContainer.appendChild(chainElement)
      })

      treeContainer.appendChild(chainsContainer)
    } else {
      console.log("No valid chains data found, showing debug info")
      // Show debug information
      const debugInfo = document.createElement("div")
      debugInfo.className = "network-debug"
      debugInfo.innerHTML = `
        <div>Network tree structure not recognized:</div>
        <pre style="font-size: 8px; max-height: 200px; overflow: auto;">${JSON.stringify(details, null, 2)}</pre>
      `
      treeContainer.appendChild(debugInfo)
    }

    return treeContainer
  }

  /**
   * Render network items as a simple list when chain structure is not available
   */
  renderNetworkSimpleList(items) {
    const listContainer = document.createElement("div")
    listContainer.className = "network-simple-list"

    items.forEach((item, index) => {
      const itemElement = document.createElement("div")
      itemElement.className = "network-list-item"

      // Extract URL and basic info
      const url = item.url || item.href || "Unknown URL"
      const filename = this.extractFilename(url)
      const domain = this.extractDomain(url)

      // Create display
      const urlDisplay = document.createElement("div")
      urlDisplay.className = "network-url-display"
      urlDisplay.textContent = filename

      if (domain && !domain.includes(window.location.hostname)) {
        const domainSpan = document.createElement("span")
        domainSpan.className = "network-domain"
        domainSpan.textContent = ` (${domain})`
        urlDisplay.appendChild(domainSpan)
      }

      // Add timing/size info if available
      const metaInfo = document.createElement("div")
      metaInfo.className = "network-meta"

      const parts = []
      if (item.transferSize) parts.push(this.formatBytes(item.transferSize))
      if (item.duration) parts.push(`${item.duration}ms`)
      if (item.startTime) parts.push(`@${item.startTime}ms`)

      if (parts.length > 0) {
        metaInfo.textContent = parts.join(", ")
      }

      itemElement.appendChild(urlDisplay)
      if (metaInfo.textContent) {
        itemElement.appendChild(metaInfo)
      }

      listContainer.appendChild(itemElement)
    })

    return listContainer
  }

  /**
   * Render individual network chain with proper indentation
   */
  renderNetworkChain(chain, depth) {
    if (!chain || typeof chain !== "object") {
      console.log("Invalid chain data:", chain)
      return document.createElement("div")
    }

    const chainElement = document.createElement("div")
    chainElement.className = `network-chain-item depth-${depth}`

    // Create the main item
    const itemElement = document.createElement("div")
    itemElement.className = "network-item"

    // Add tree connector
    const connector = document.createElement("div")
    connector.className = "tree-connector"
    connector.style.marginLeft = `${depth * 20}px`

    // Add connector lines based on depth
    if (depth > 0) {
      connector.innerHTML = "└─ "
    }

    // Extract filename and domain
    const url = chain.url || chain.href || "Unknown"
    const filename = this.extractFilename(url)
    const domain = this.extractDomain(url)

    // Create URL display
    const urlDisplay = document.createElement("span")
    urlDisplay.className = "network-url"

    // Color code by domain
    if (domain && domain.includes("mediavine.com")) {
      urlDisplay.classList.add("mediavine-domain")
    } else if (domain && domain.includes("googlesyndication.com")) {
      urlDisplay.classList.add("third-party")
    } else {
      urlDisplay.classList.add("main-domain")
    }

    // Truncate long filenames
    const displayName = filename.length > 50 ? `...${filename.slice(-47)}` : filename
    urlDisplay.textContent = displayName

    // Add domain in parentheses if different from main
    if (domain && !domain.includes(window.location.hostname)) {
      const domainSpan = document.createElement("span")
      domainSpan.className = "network-domain"
      domainSpan.textContent = ` (${domain})`
      urlDisplay.appendChild(domainSpan)
    }

    // Add timing and size info
    const metaInfo = document.createElement("span")
    metaInfo.className = "network-meta"

    const timing = chain.navStartToEndTime || chain.duration || chain.endTime
    const timingText = timing ? `${Math.round(timing)} ms` : "N/A"
    const size = chain.transferSize ? this.formatBytes(chain.transferSize) : "N/A"

    metaInfo.innerHTML = ` - <span class="network-timing">${timingText}</span>, <span class="network-size">${size}</span>`

    // Combine elements
    itemElement.appendChild(connector)
    itemElement.appendChild(urlDisplay)
    itemElement.appendChild(metaInfo)

    chainElement.appendChild(itemElement)

    // Render children recursively
    if (chain.children && typeof chain.children === "object" && Object.keys(chain.children).length > 0) {
      Object.entries(chain.children).forEach(([childId, childChain]) => {
        const childElement = this.renderNetworkChain(childChain, depth + 1)
        chainElement.appendChild(childElement)
      })
    }

    return chainElement
  }

  /**
   * Extract table data from PSI nested structure
   */
  extractTableData(details) {
    if (!details) return null

    // Handle PSI nested structure: details.items[0].items contains the actual data
    if (details.items && Array.isArray(details.items) && details.items.length > 0) {
      // Look for the first item that has table-like structure
      for (const item of details.items) {
        if (item.items && Array.isArray(item.items) && item.items.length > 0) {
          // Check if this looks like table data (not checklist or node)
          if (item.type !== "checklist" && item.type !== "node") {
            return {
              headings: item.headings || details.headings || [],
              items: item.items,
            }
          }
        }
      }

      // Fallback: use details.items directly if no nested structure found
      const nonSpecialItems = details.items.filter(
        (item) => item.type !== "checklist" && item.type !== "node" && !item.items,
      )

      if (nonSpecialItems.length > 0) {
        return {
          headings: details.headings || [],
          items: nonSpecialItems,
        }
      }
    }

    return null
  }

  /**
   * Render details table for insight data
   */
  renderDetailsTable(details, insight) {
    const table = document.createElement("table")
    table.className = "insight-table"

    // Create header
    const thead = document.createElement("thead")
    const headerRow = document.createElement("tr")

    if (details.headings && details.headings.length > 0) {
      details.headings.forEach((heading, index) => {
        const th = document.createElement("th")
        // Safely extract string value from heading object
        let headingText = "Column"
        if (typeof heading === "string") {
          headingText = heading
        } else if (heading && typeof heading === "object") {
          headingText = heading.label || heading.text || heading.key || "Column"
        }

        th.textContent = this.formatHeading(headingText)

        // Add alignment classes based on column type
        if (index === 0) {
          th.classList.add("url-column")
        } else if (this.isNumericColumn(headingText)) {
          th.classList.add("numeric-column")
        }

        headerRow.appendChild(th)
      })
    } else {
      // Default headers for forced reflow data
      const sourceHeader = document.createElement("th")
      sourceHeader.textContent = "Source"
      sourceHeader.classList.add("url-column")
      const timeHeader = document.createElement("th")
      timeHeader.textContent = "Reflow Time"
      timeHeader.classList.add("numeric-column")
      headerRow.appendChild(sourceHeader)
      headerRow.appendChild(timeHeader)
    }

    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Create body
    const tbody = document.createElement("tbody")
    details.items.forEach((item) => {
      const row = this.renderTableRow(item, details.headings, insight)
      tbody.appendChild(row)
    })

    table.appendChild(tbody)
    return table
  }

  /**
   * Check if a column should be treated as numeric
   */
  isNumericColumn(headingText) {
    const numericKeywords = ["transfer", "savings", "time", "size", "bytes", "ms", "kb", "mb", "duration", "score"]
    return numericKeywords.some((keyword) => headingText.toLowerCase().includes(keyword))
  }

  /**
   * Render table row for insight item
   */
  renderTableRow(item, headings, insight) {
    const row = document.createElement("tr")

    if (headings && headings.length > 0) {
      headings.forEach((heading, index) => {
        const td = document.createElement("td")
        // Safely extract key from heading object
        let key = "unknown"
        if (typeof heading === "string") {
          key = heading
        } else if (heading && typeof heading === "object") {
          key = heading.key || heading.text || heading.label || "unknown"
        }
        const value = item[key]

        // Apply column-specific styling
        if (index === 0) {
          td.className = "url-cell"
          td.innerHTML = this.formatUrlCell(value, item)
        } else if (this.isNumericColumn(key)) {
          td.className = "numeric-cell"
          td.innerHTML = this.formatNumericValue(value, key)
        } else if (key === "source") {
          td.className = "source-cell"
          td.innerHTML = this.formatSourceCell(value, item)
        } else if (key === "reflowTime" || key === "time" || key.includes("time") || key.includes("Time")) {
          td.className = "metric-value"
          td.innerHTML = this.formatTimeValue(value)
        } else {
          td.textContent = this.formatCellValue(value)
        }

        row.appendChild(td)
      })
    } else {
      // Default formatting for forced reflow data
      const sourceCell = document.createElement("td")
      sourceCell.className = "source-cell"
      sourceCell.innerHTML = this.formatSourceCell(item.source || item.url, item)

      const timeCell = document.createElement("td")
      timeCell.className = "metric-value"
      timeCell.innerHTML = this.formatTimeValue(item.reflowTime || item.time || item.duration)

      row.appendChild(sourceCell)
      row.appendChild(timeCell)
    }

    return row
  }

  /**
   * Format URL cell with better wrapping and tooltip
   */
  formatUrlCell(url, item) {
    if (!url) {
      return '<div class="unattributed">Unattributed</div>'
    }

    const urlString = typeof url === "object" ? url.url || url.href || String(url) : String(url)
    const filename = this.extractFilename(urlString)
    const domain = this.extractDomain(urlString)

    return `
  <div class="url-container compact">
    <div class="url-filename tooltip-trigger" data-tooltip="${this.escapeHtml(urlString)}">
      ${this.escapeHtml(filename)}${domain ? ` (${this.escapeHtml(domain)})` : ""}
    </div>
  </div>
`
  }

  /**
   * Format numeric values with proper alignment and units
   */
  formatNumericValue(value, key) {
    if (value === undefined || value === null) {
      return '<span class="numeric-na">—</span>'
    }

    const numValue = Number.parseFloat(value)
    if (isNaN(numValue)) {
      return '<span class="numeric-na">—</span>'
    }

    // Format based on the type of numeric value
    if (key.toLowerCase().includes("bytes") || key.toLowerCase().includes("size")) {
      return `<span class="numeric-bytes">${this.formatBytes(numValue)}</span>`
    } else if (key.toLowerCase().includes("time") || key.toLowerCase().includes("ms")) {
      return `<span class="numeric-time">${numValue.toFixed(1)}ms</span>`
    } else if (key.toLowerCase().includes("savings")) {
      return `<span class="numeric-savings">${this.formatBytes(numValue)}</span>`
    } else {
      return `<span class="numeric-value">${numValue.toLocaleString()}</span>`
    }
  }

  /**
   * Format bytes into human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    if (!url) return ""

    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (e) {
      return ""
    }
  }

  /**
   * Format source cell with URL and location
   */
  formatSourceCell(source, item) {
    if (!source) {
      return '<div class="unattributed">Unattributed</div>'
    }

    // Handle PSI source object structure
    if (typeof source === "object" && source.url) {
      const filename = this.extractFilename(source.url)
      const domain = this.extractDomain(source.url)

      let html = `
  <div class="url-container compact">
    <div class="url-filename tooltip-trigger" data-tooltip="${this.escapeHtml(source.url || source)}">
      ${this.escapeHtml(filename)}${domain ? ` (${this.escapeHtml(domain)})` : ""}
    </div>
  </div>
`

      if (source.line !== undefined || source.column !== undefined) {
        const line = source.line || 0
        const column = source.column || 0
        html += `<div class="source-location">Line ${line}, Column ${column}</div>`
      }

      return html
    }

    // Handle string source
    if (typeof source === "string") {
      const filename = this.extractFilename(source)
      const domain = this.extractDomain(source)

      let html = `
  <div class="url-container compact">
    <div class="url-filename tooltip-trigger" data-tooltip="${this.escapeHtml(source.url || source)}">
      ${this.escapeHtml(filename)}${domain ? ` (${this.escapeHtml(domain)})` : ""}
    </div>
  </div>
`

      if (item.line !== undefined || item.column !== undefined) {
        const line = item.line || 0
        const column = item.column || 0
        html += `<div class="source-location">Line ${line}, Column ${column}</div>`
      }

      return html
    }

    return '<div class="unattributed">Unattributed</div>'
  }

  /**
   * Extract filename from URL for cleaner display
   */
  extractFilename(url) {
    if (!url) return "Unknown"

    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.split("/").pop() || pathname
      return filename || "Unknown"
    } catch (e) {
      // Handle relative URLs or malformed URLs
      const parts = url.split("/")
      return parts[parts.length - 1] || url
    }
  }

  /**
   * Format time value with appropriate styling
   */
  formatTimeValue(time) {
    if (time === undefined || time === null) {
      return '<span class="reflow-time low">N/A</span>'
    }

    const numTime = Number.parseFloat(time)
    if (isNaN(numTime)) {
      return '<span class="reflow-time low">N/A</span>'
    }

    let className = "low"

    if (numTime > 50) {
      className = "high"
    } else if (numTime > 16) {
      className = "medium"
    }

    return `<span class="reflow-time ${className}">${numTime.toFixed(2)}ms</span>`
  }

  /**
   * Format cell value
   */
  formatCellValue(value) {
    if (value === undefined || value === null) {
      return "N/A"
    }

    if (typeof value === "object") {
      return JSON.stringify(value)
    }

    return String(value)
  }

  /**
   * Format insight title
   */
  formatInsightTitle(title) {
    if (!title) return "Performance Insight"

    // Convert kebab-case to title case
    return title.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  /**
   * Format table heading
   */
  formatHeading(heading) {
    // Ensure we have a string
    if (!heading) {
      return "Column"
    }

    if (typeof heading !== "string") {
      return String(heading)
    }

    return heading
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  /**
   * Toggle insight expansion
   */
  toggleInsight(item, index) {
    const header = item.querySelector(".insight-header")
    const content = item.querySelector(".insight-content")
    const expandIcon = header.querySelector(".insight-expand-icon")

    const isExpanded = item.classList.contains("expanded")

    if (isExpanded) {
      item.classList.remove("expanded")
      header.classList.remove("expanded")
      header.setAttribute("aria-expanded", "false")
      this.expandedInsights.delete(index)
    } else {
      item.classList.add("expanded")
      header.classList.add("expanded")
      header.setAttribute("aria-expanded", "true")
      this.expandedInsights.add(index)

      // Reinitialize tooltips for newly expanded content
      setTimeout(() => this.initializeTooltips(), 100)
    }
  }

  /**
   * Render empty state
   */
  renderEmptyState(container) {
    const emptyState = document.createElement("div")
    emptyState.className = "psi-insights-empty"
    emptyState.innerHTML = `
            <p>No performance insights available</p>
            <small>Run a PageSpeed Insights analysis to see detailed performance recommendations</small>
        `
    container.appendChild(emptyState)
  }

  /**
   * Render error state
   */
  renderError(container, error) {
    const errorState = document.createElement("div")
    errorState.className = "psi-insights-error"
    errorState.innerHTML = `
            <p>Failed to load insights</p>
            <small>${this.escapeHtml(error.message || "Unknown error occurred")}</small>
        `
    container.appendChild(errorState)
  }

  /**
   * Render loading state
   */
  renderLoading(container) {
    const loadingState = document.createElement("div")
    loadingState.className = "psi-insights-loading"
    loadingState.textContent = "Loading insights..."
    container.appendChild(loadingState)
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (typeof text !== "string") return ""
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  processMarkdown(text) {
    if (!text) return ""

    // Convert markdown links [text](url) to HTML links
    return text.replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" class="insight-link" target="_blank">$1</a>')
  }

  getFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.split("/").pop()
      return filename || urlObj.hostname
    } catch {
      return url
    }
  }

  destroy() {
    if (this.tooltipElement) {
      this.tooltipElement.remove()
    }
  }
}

// Export singleton instance
export const insightsRenderer = new InsightsRenderer()
