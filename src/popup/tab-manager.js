/**
 * Module for managing popup tabs
 */

console.log("=== TAB MANAGER LOADING ===")

/**
 * Sets up tab switching functionality
 * @param {Array} tabs - Array of tab configuration objects
 */
export function setupTabSwitching(tabs) {
  console.log("setupTabSwitching called with tabs:", tabs)

  function switchTab(activeTabId) {
    console.log("switchTab called with:", activeTabId)
    tabs.forEach((tabInfo) => {
      const tabEl = document.getElementById(tabInfo.id)
      const contentEl = document.getElementById(tabInfo.contentId)
      console.log(`Processing tab ${tabInfo.id}:`, !!tabEl, !!contentEl)

      if (tabEl && contentEl) {
        if (tabInfo.id === activeTabId) {
          tabEl.classList.add("active")
          contentEl.classList.add("active")
          console.log(`Activated tab: ${tabInfo.id}`)
        } else {
          tabEl.classList.remove("active")
          contentEl.classList.remove("active")
        }
      } else {
        console.warn(`Missing elements for tab ${tabInfo.id}:`, { tabEl: !!tabEl, contentEl: !!contentEl })
      }
    })
    localStorage.setItem("activeExtensionTab", activeTabId)
    console.log("Active tab saved to localStorage:", activeTabId)
  }

  // Add click listeners to tabs
  tabs.forEach((tabInfo) => {
    const tabEl = document.getElementById(tabInfo.id)
    console.log(`Setting up click listener for tab ${tabInfo.id}:`, !!tabEl)

    if (tabEl) {
      // Remove any existing listeners
      const newTabEl = tabEl.cloneNode(true)
      tabEl.parentNode.replaceChild(newTabEl, tabEl)

      // Add new listener
      newTabEl.addEventListener("click", (e) => {
        console.log(`Tab ${tabInfo.id} clicked`)
        e.preventDefault()
        e.stopPropagation()
        switchTab(tabInfo.id)
      })
      console.log(`Click listener added to tab ${tabInfo.id}`)
    } else {
      console.error(`Tab element not found: ${tabInfo.id}`)
    }
  })

  // Restore last active tab or default to first tab
  const lastActiveTab = localStorage.getItem("activeExtensionTab")
  console.log("Last active tab from localStorage:", lastActiveTab)

  if (lastActiveTab && tabs.find((t) => t.id === lastActiveTab)) {
    console.log("Restoring last active tab:", lastActiveTab)
    switchTab(lastActiveTab)
  } else if (tabs.length > 0) {
    console.log("No last active tab, defaulting to first tab:", tabs[0].id)
    switchTab(tabs[0].id)
  }

  console.log("Tab switching setup complete")
}

console.log("=== TAB MANAGER LOADED ===")
