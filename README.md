# 🚀 BigScoots Performance Debugger Extension

A comprehensive Chrome extension for analyzing website performance metrics, specifically optimized for BigScoots hosting environments. This extension provides real-time Core Web Vitals monitoring, resource analysis, cache debugging, and performance optimization insights.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Architecture Overview](#-architecture-overview)
- [File Structure & Dependencies](#-file-structure--dependencies)
- [Development Guide](#-development-guide)
- [Enhancement Scenarios](#-enhancement-scenarios)
- [Build & Release](#-build--release)
- [Contributing](#-contributing)

## ✨ Features

### 🎯 Core Web Vitals Monitoring
- **Real-time CLS tracking** with layout shift source identification
- **LCP measurement** with element preview and optimization hints
- **INP monitoring** for interaction responsiveness
- **TTFB analysis** for server response optimization

### 🔍 Resource Analysis
- **Image optimization** analysis with preload detection
- **Font loading** performance with priority recommendations
- **Critical path** identification for above-the-fold content

### 🛡️ Cache & Performance Headers
- **BigScoots-specific** cache status monitoring
- **CDN detection** (Cloudflare, Ezoic, etc.)
- **Hosting verification** and optimization status
- **Performance plugin** conflict detection

### 🎛️ Debug Tools
- **Perfmatters toggles** for real-time optimization testing
- **Cache bypass** parameters for debugging
- **URL manipulation** for A/B testing scenarios

### 🖥️ Advanced UI
- **Detachable popup** windows for multi-monitor setups
- **Cross-tab persistence** for consistent debugging
- **Professional loading states** and user feedback
- **Responsive design** for both attached and detached modes

## 🚀 Installation

### Development Setup
\`\`\`bash
# Clone the repository
git clone <repository-url>
cd bigscoots-perf-extension

# Install dependencies
npm install

# Build for development
npm run build:dev

# Build for production
npm run build

# Watch mode for development
npm run watch
\`\`\`

### Chrome Extension Installation
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder
4. The extension icon will appear in your toolbar

## 🏗️ Architecture Overview

The extension follows a modular architecture with clear separation of concerns:

### Core Components

\`\`\`
Background Service Worker ←→ Popup Interface ←→ Content Scripts
         ↓                        ↓                    ↓
   Tab Management          Display Modules        Performance
   Window Control          State Manager          Monitoring
   Message Router          Toggle Controls        Resource Scan
\`\`\`

### Component Relationships

- **Background Service Worker**: Manages extension lifecycle, tab data, and window states
- **Popup Interface**: Provides user interaction and data visualization
- **Content Scripts**: Analyzes page performance and resources

## 📁 File Structure & Dependencies

### 🗂️ **Root Directory**

#### **`package.json`**
**Purpose**: Project configuration and dependency management
**Contains**: Build scripts, dependencies, extension metadata
**Dependencies**: None
**Affects**: All build processes, dependency resolution

#### **`webpack.config.js`**
**Purpose**: Build system configuration with optimization
**Contains**: Bundle configuration, development/production modes, code splitting
**Dependencies**: `package.json`
**Affects**: All compiled output in `/dist`

#### **`.gitignore`**
**Purpose**: Version control exclusions
**Contains**: Build artifacts, node_modules, release packages
**Dependencies**: None
**Affects**: Repository cleanliness

#### **`.github/workflows/release.yml`**
**Purpose**: CI/CD pipeline for automated releases
**Contains**: Build, validation, and release automation
**Dependencies**: `package.json`, build scripts
**Affects**: GitHub releases, automated deployment

---

### 📂 **`/src` - Main Source Code**

#### 🎨 **Core UI Files**

##### **`popup.html`**
**Purpose**: Main extension interface structure
**Contains**: 
- Tab navigation (Images, Fonts, Headers, Insights, Debug)
- Core Web Vitals display containers
- Window control buttons
- Current URL display
**Dependencies**: `style.css`, `popup.js`
**Affects**: All popup display modules
**Enhancement Guide**: 
- *Add new tab*: Update tab list and content containers
- *Modify layout*: Update HTML structure and corresponding CSS
- *Add new metrics*: Create new display containers in insights section

##### **`style.css`**
**Purpose**: Complete styling system with theme support
**Contains**:
- CSS custom properties for theming
- Component styles (tabs, cards, buttons, toggles)
- Core Web Vitals visualization
- Detached mode responsive design
- Loading states and animations
**Dependencies**: `popup.html`
**Affects**: All visual components
**Enhancement Guide**:
- *Theme changes*: Modify CSS custom properties in `:root`
- *New components*: Add styles following existing naming conventions
- *Responsive updates*: Modify `.detached-mode` classes

##### **`manifest.json`**
**Purpose**: Extension configuration and permissions
**Contains**:
- Extension metadata and version
- Permissions and host permissions
- Content script injection rules
- Background service worker configuration
**Dependencies**: None
**Affects**: Extension functionality, security model
**Enhancement Guide**:
- *New permissions*: Add to `permissions` or `host_permissions`
- *Content script scope*: Modify `matches` and `exclude_matches`
- *Version updates*: Update `version` field

---

#### ⚙️ **`/background` - Service Worker**

##### **`index.js`**
**Purpose**: Main background script coordinator
**Contains**:
- Extension lifecycle management
- Event listener setup
- Tab and window event handling
- Message handler initialization
**Dependencies**: All background modules
**Affects**: Extension-wide functionality
**Enhancement Guide**:
- *New global events*: Add listeners here
- *Extension startup logic*: Modify initialization
- *Cross-component coordination*: Update message routing

##### **`message-handler.js`**
**Purpose**: Centralized message routing system
**Contains**:
- Message action routing
- Tab-specific message handling
- Analysis result forwarding
- Parameter management coordination
**Dependencies**: `tab-manager.js`, `parameter-manager.js`, `window-manager.js`
**Affects**: All inter-component communication
**Enhancement Guide**:
- *New message types*: Add action handlers
- *Cross-tab messaging*: Modify forwarding logic
- *Data flow changes*: Update routing rules

##### **`tab-manager.js`**
**Purpose**: Tab-specific data storage and lifecycle
**Contains**:
- Analysis result caching per tab
- Tab cleanup on close
- Data retrieval methods
**Dependencies**: None
**Affects**: Data persistence, memory management
**Enhancement Guide**:
- *New data types*: Add storage methods
- *Cache optimization*: Modify storage strategy
- *Data retention*: Update cleanup logic

##### **`parameter-manager.js`**
**Purpose**: URL parameter manipulation for debug features
**Contains**:
- URL parameter addition/removal
- Tab-specific parameter tracking
- URL reconstruction logic
**Dependencies**: None
**Affects**: Debug toggle functionality
**Enhancement Guide**:
- *New debug parameters*: Add parameter handling
- *URL manipulation*: Modify reconstruction logic
- *Parameter persistence*: Update storage methods

##### **`window-manager.js`**
**Purpose**: Detachable popup window management
**Contains**:
- Detached window creation
- Window state persistence
- Focus management
- Bounds saving/restoration
**Dependencies**: `../utils/window-state.js`
**Affects**: Popup window behavior
**Enhancement Guide**:
- *Window features*: Modify creation parameters
- *Multi-window support*: Extend window tracking
- *State persistence*: Update storage logic

---

#### 🌐 **`/content` - Page Analysis**

##### **`index.js`**
**Purpose**: Main content script coordinator
**Contains**:
- Page analysis orchestration
- Domain exclusion logic
- WordPress plugin detection
- Analysis result compilation
**Dependencies**: All content modules
**Affects**: All page analysis features
**Enhancement Guide**:
- *New analysis types*: Add analyzer imports and calls
- *Domain filtering*: Modify exclusion logic
- *Plugin detection*: Add new plugin patterns

##### 📊 **`/performance` - Core Web Vitals Monitoring**

###### **`cls-monitor.js`**
**Purpose**: Cumulative Layout Shift detection and analysis
**Contains**:
- PerformanceObserver for layout shifts
- Element identification and highlighting
- Shift value calculation
- Element information extraction
**Dependencies**: `../../utils/messaging.js`
**Affects**: CLS metrics display, element highlighting
**Enhancement Guide**:
- *CLS thresholds*: Modify rating calculations
- *Element details*: Enhance information extraction
- *Highlighting styles*: Update visual feedback

###### **`lcp-monitor.js`**
**Purpose**: Largest Contentful Paint tracking
**Contains**:
- LCP element identification
- Element preview generation
- Performance threshold evaluation
- Element highlighting system
**Dependencies**: `../../utils/messaging.js`
**Affects**: LCP metrics display, element previews
**Enhancement Guide**:
- *LCP analysis*: Enhance element information
- *Preview generation*: Improve image extraction
- *Performance insights*: Add optimization hints

###### **`inp-monitor.js`**
**Purpose**: Interaction to Next Paint measurement
**Contains**:
- Interaction event monitoring
- Manual fallback tracking
- Response time calculation
- Interaction history management
**Dependencies**: `../../utils/messaging.js`
**Affects**: INP metrics display
**Enhancement Guide**:
- *Interaction types*: Add new event monitoring
- *Measurement accuracy*: Improve timing precision
- *Fallback methods*: Enhance manual tracking

###### **`additional-metrics.js`**
**Purpose**: TTFB, FCP, and other performance metrics
**Contains**:
- Navigation timing analysis
- Paint timing observation
- Performance entry processing
**Dependencies**: `../../utils/messaging.js`
**Affects**: Additional metrics display
**Enhancement Guide**:
- *New metrics*: Add performance observers
- *Timing analysis*: Enhance calculation methods
- *Browser compatibility*: Add fallback methods

##### 🔍 **`/analyzers` - Resource Analysis**

###### **`image-analyzer.js`**
**Purpose**: Image optimization and preload analysis
**Contains**:
- Preloaded image detection
- Critical path analysis
- Optimization issue identification
- Image highlighting system
**Dependencies**: `../../utils/dom-helpers.js`
**Affects**: Image analysis display, optimization insights
**Enhancement Guide**:
- *Optimization rules*: Add new analysis criteria
- *Image formats*: Support new formats
- *Performance hints*: Enhance recommendations

###### **`font-analyzer.js`**
**Purpose**: Font loading performance analysis
**Contains**:
- Font resource detection
- Preload status analysis
- Loading performance measurement
- Font type identification
**Dependencies**: `../../utils/formatters.js`
**Affects**: Font analysis display
**Enhancement Guide**:
- *Font formats*: Add new format support
- *Loading strategies*: Analyze new techniques
- *Performance metrics*: Add timing analysis

---

#### 🖥️ **`/popup` - UI Components**

##### **`index.js`**
**Purpose**: Main popup controller and mode manager
**Contains**:
- Attached/detached mode detection
- Tab switching coordination
- Data refresh management
- Message listener setup
**Dependencies**: All popup modules, utils
**Affects**: Entire popup functionality
**Enhancement Guide**:
- *New display modes*: Add mode detection logic
- *Data flow*: Modify refresh strategies
- *UI coordination*: Update component initialization

##### 📱 **`/displays` - UI Display Modules**

###### **`image-display.js`**
**Purpose**: Image analysis results presentation
**Contains**:
- Image list rendering
- Click-to-highlight functionality
- Status indicator display
- Copy URL functionality
**Dependencies**: `../../utils/tab-helpers.js`
**Affects**: Images tab display
**Enhancement Guide**:
- *Display format*: Modify list item structure
- *Interaction features*: Add new click handlers
- *Status indicators*: Add new optimization states

###### **`font-display.js`**
**Purpose**: Font loading results presentation
**Contains**:
- Font list rendering with badges
- Copy URL functionality
- Status sticker system
- Priority indication
**Dependencies**: None (self-contained)
**Affects**: Fonts tab display
**Enhancement Guide**:
- *Font metrics*: Add new performance indicators
- *Visual design*: Modify badge and sticker styles
- *Interaction features*: Add new functionality

###### **`header-display.js`**
**Purpose**: Cache headers and optimization status
**Contains**:
- Header value formatting
- Color-coded status display
- Empty state handling
- Dynamic content updates
**Dependencies**: `../../utils/formatters.js`
**Affects**: Headers tab display
**Enhancement Guide**:
- *New headers*: Add header detection and formatting
- *Status colors*: Modify color scheme logic
- *Display groups*: Add new header categories

###### **`insights-display.js`**
**Purpose**: Core Web Vitals visualization and insights
**Contains**:
- Metrics visualization with thresholds
- Element preview generation
- Click-to-highlight coordination
- Plugin conflict display
**Dependencies**: `../../utils/tab-helpers.js`
**Affects**: Insights tab display, element highlighting
**Enhancement Guide**:
- *New metrics*: Add visualization components
- *Threshold updates*: Modify rating calculations
- *Preview features*: Enhance element information

##### 🎛️ **Management Modules**

###### **`tab-manager.js`**
**Purpose**: Tab switching functionality
**Contains**:
- Tab activation logic
- State persistence
- Content visibility management
**Dependencies**: None
**Affects**: Tab navigation behavior
**Enhancement Guide**:
- *New tabs*: Add tab configuration
- *State management*: Modify persistence logic
- *Animation effects*: Add transition handling

###### **`toggle-manager.js`**
**Purpose**: Debug parameter toggles with queue management
**Contains**:
- Toggle state management
- Sequential processing queue
- Loading state visualization
- Parameter synchronization
**Dependencies**: None
**Affects**: Debug tab functionality
**Enhancement Guide**:
- *New toggles*: Add toggle configuration and handlers
- *Processing logic*: Modify queue management
- *Loading states*: Update visual feedback

###### **`window-state-manager.js`**
**Purpose**: Detach/attach popup window controls
**Contains**:
- Window mode detection
- Detach/attach operations
- Button state management
- Style application
**Dependencies**: `../utils/messaging.js`, `../utils/window-state.js`
**Affects**: Window control functionality
**Enhancement Guide**:
- *Window features*: Add new window operations
- *Mode detection*: Improve detection accuracy
- *UI updates*: Modify button states and icons

---

#### 🛠️ **`/utils` - Shared Utilities**

##### **`formatters.js`**
**Purpose**: Data formatting and color scheme management
**Contains**:
- File size formatting
- Header color coding
- Cache status evaluation
- Contrast color calculation
**Dependencies**: None
**Affects**: All data display components
**Enhancement Guide**:
- *New data types*: Add formatting functions
- *Color schemes*: Modify color logic
- *Display formats*: Add new formatting options

##### **`dom-helpers.js`**
**Purpose**: DOM manipulation and image analysis utilities
**Contains**:
- Image dimension analysis
- Critical path detection
- Optimization issue identification
- Viewport calculations
**Dependencies**: None
**Affects**: Image analysis, content script operations
**Enhancement Guide**:
- *Analysis criteria*: Add new detection methods
- *Performance rules*: Modify optimization logic
- *DOM operations*: Add new helper functions

##### **`messaging.js`**
**Purpose**: Safe Chrome extension messaging wrappers
**Contains**:
- Error-safe message sending
- Tab-specific messaging
- Message listener setup
**Dependencies**: None
**Affects**: All inter-component communication
**Enhancement Guide**:
- *Message types*: Add new messaging patterns
- *Error handling*: Improve error recovery
- *Communication protocols*: Add new message formats

##### **`window-state.js`**
**Purpose**: Window state persistence and storage management
**Contains**:
- Window state storage
- Bounds persistence
- Tab ID management
- Storage key definitions
**Dependencies**: None
**Affects**: Window management, state persistence
**Enhancement Guide**:
- *State properties*: Add new state tracking
- *Storage optimization*: Improve data efficiency
- *State validation*: Add integrity checks

##### **`tab-helpers.js`**
**Purpose**: Tab verification and cross-mode messaging
**Contains**:
- Tab existence verification
- Target tab ID resolution
- Cross-mode messaging coordination
- Visual feedback helpers
**Dependencies**: `window-state.js`
**Affects**: All tab-specific operations
**Enhancement Guide**:
- *Tab operations*: Add new tab management functions
- *Mode handling*: Improve attached/detached coordination
- *Feedback systems*: Add new notification types

##### **`toast-notifications.js`**
**Purpose**: Professional notification system (available but unused)
**Contains**:
- Toast creation and management
- Animation and positioning
- Action button support
- Auto-dismiss functionality
**Dependencies**: None
**Affects**: User feedback (when implemented)
**Enhancement Guide**:
- *Notification types*: Add new toast styles
- *Integration*: Connect to existing feedback systems
- *Customization*: Add theme support

---

## 🔧 **`/scripts` - Build & Release Tools**

##### **`zip-extension.js`**
**Purpose**: Production package creation
**Contains**:
- Extension packaging logic
- Version extraction
- File compression
- Release preparation
**Dependencies**: `package.json`, `dist/` folder
**Affects**: Release packages
**Enhancement Guide**:
- *Package contents*: Modify included files
- *Compression settings*: Optimize package size
- *Naming conventions*: Update file naming

##### **`validate-extension.js`**
**Purpose**: Pre-release validation and quality checks
**Contains**:
- Manifest validation
- File existence checks
- Size limit verification
- Permission auditing
**Dependencies**: `dist/` folder, `manifest.json`
**Affects**: Release quality assurance
**Enhancement Guide**:
- *Validation rules*: Add new quality checks
- *Size limits*: Update threshold values
- *Security checks*: Add permission validation

##### **`bump-version.js`**
**Purpose**: Automated version management
**Contains**:
- Semantic version bumping
- Multi-file version updates
- Version synchronization
**Dependencies**: `package.json`, `src/manifest.json`
**Affects**: Version consistency
**Enhancement Guide**:
- *Version files*: Add new files to update
- *Version formats*: Support new versioning schemes
- *Automation*: Add pre/post-bump hooks

##### **`release-notes.js`**
**Purpose**: Release documentation generator
**Contains**:
- Release note templates
- Version-specific documentation
- Changelog formatting
**Dependencies**: None
**Affects**: Release documentation
**Enhancement Guide**:
- *Template format*: Modify note structure
- *Automation*: Add git integration
- *Content generation*: Add automated sections

##### **`install-deps.sh`**
**Purpose**: Development environment setup
**Contains**:
- Dependency installation
- Script permissions setup
- Environment validation
**Dependencies**: `package.json`
**Affects**: Development setup
**Enhancement Guide**:
- *Dependencies*: Add new required packages
- *Environment checks*: Add validation steps
- *Setup automation*: Add configuration steps

---

## 🛠️ Development Guide

### Adding New Features

#### 🎯 **Adding a New Performance Metric**

**Files to Modify:**
1. **`src/content/performance/new-metric-monitor.js`** - Create new monitor
2. **`src/content/index.js`** - Import and initialize monitor
3. **`src/popup/displays/insights-display.js`** - Add display logic
4. **`src/popup.html`** - Add UI elements
5. **`src/style.css`** - Add styling

**Example Flow:**
\`\`\`javascript
// 1. Create monitor in /content/performance/
export function initializeNewMetricMonitoring() {
  // Implementation
}

// 2. Add to content/index.js
import { initializeNewMetricMonitoring } from './performance/new-metric-monitor.js'
initializeNewMetricMonitoring()

// 3. Add display function in insights-display.js
export function updateNewMetricDisplay(data) {
  // Update UI
}
\`\`\`

#### 🔍 **Adding a New Resource Analyzer**

**Files to Modify:**
1. **`src/content/analyzers/new-analyzer.js`** - Create analyzer
2. **`src/content/index.js`** - Integrate analyzer
3. **`src/popup/displays/new-display.js`** - Create display module
4. **`src/popup/index.js`** - Wire up display
5. **`src/popup.html`** - Add new tab (if needed)

#### 🎛️ **Adding a New Debug Toggle**

**Files to Modify:**
1. **`src/popup.html`** - Add toggle HTML
2. **`src/popup/toggle-manager.js`** - Add toggle logic
3. **`src/background/parameter-manager.js`** - Add parameter handling
4. **`src/style.css`** - Add toggle styling

#### 🖥️ **Adding a New Display Tab**

**Files to Modify:**
1. **`src/popup.html`** - Add tab button and content area
2. **`src/popup/index.js`** - Add to TABS configuration
3. **`src/popup/displays/new-tab-display.js`** - Create display module
4. **`src/style.css`** - Add tab-specific styling

### 🔄 Data Flow Understanding

\`\`\`
Page Analysis → Background Storage → Popup Display
     ↓                 ↓                 ↓
Performance      Tab-Specific       Display
Monitoring   →   Data Storage   →   Components
Resource     →   Parameter      →   User Interface
Analysis     →   Management     →   State Management
\`\`\`

**Flow Details:**
1. **Content Scripts** analyze page performance and resources
2. **Background** stores results per tab and manages parameters  
3. **Popup** retrieves data and displays in organized tabs
4. **User Actions** trigger parameter changes via background messaging

### 🧪 **Testing Scenarios**

#### **Attached Mode Testing**
- Test popup functionality when attached to extension icon
- Verify tab switching and data refresh
- Test debug toggles and parameter management

#### **Detached Mode Testing**
- Test window detachment and reattachment
- Verify cross-tab data persistence
- Test window bounds saving and restoration

#### **Performance Testing**
- Test Core Web Vitals accuracy
- Verify element highlighting functionality
- Test resource analysis completeness

## 🚀 Build & Release

### Development Commands
\`\`\`bash
# Development build with source maps
npm run build:dev

# Production build with optimization
npm run build

# Watch mode for development
npm run watch

# Bundle analysis
npm run build:analyze
\`\`\`

### Release Commands
\`\`\`bash
# Validate extension before release
npm run validate

# Create release package
npm run release

# Version bumping
npm run version:patch  # 1.0.0 → 1.0.1
npm run version:minor  # 1.0.0 → 1.1.0
npm run version:major  # 1.0.0 → 2.0.0
\`\`\`

### Release Process
1. **Development** → `npm run build:dev`
2. **Testing** → Manual testing in Chrome
3. **Validation** → `npm run validate`
4. **Version Bump** → `npm run version:patch`
5. **Production Build** → `npm run build`
6. **Package Creation** → `npm run release`
7. **Upload to Chrome Web Store**

## 📈 Enhancement Scenarios

### 🎯 **Scenario: Add New Core Web Vital (e.g., FID)**

**Required Changes:**
1. **`src/content/performance/fid-monitor.js`** - Create FID monitoring
2. **`src/content/index.js`** - Initialize FID monitor
3. **`src/popup/displays/insights-display.js`** - Add FID display function
4. **`src/popup.html`** - Add FID metric container
5. **`src/style.css`** - Add FID-specific styling

**Dependencies:**
- Must follow existing monitor pattern
- Integrate with messaging system
- Update insights display coordination

### 🔍 **Scenario: Add CSS Analysis**

**Required Changes:**
1. **`src/content/analyzers/css-analyzer.js`** - Create CSS analyzer
2. **`src/content/index.js`** - Integrate CSS analysis
3. **`src/popup/displays/css-display.js`** - Create CSS display
4. **`src/popup/index.js`** - Add CSS display to initialization
5. **`src/popup.html`** - Add CSS tab and content area
6. **`src/popup/tab-manager.js`** - Add CSS tab to configuration

**Dependencies:**
- Follow analyzer pattern from image/font analyzers
- Create new display module following existing patterns
- Update tab management system

### 🎛️ **Scenario: Add Server-Side Caching Toggle**

**Required Changes:**
1. **`src/popup.html`** - Add cache toggle HTML
2. **`src/popup/toggle-manager.js`** - Add cache toggle logic
3. **`src/background/parameter-manager.js`** - Add cache parameter handling
4. **`src/style.css`** - Add toggle styling

**Dependencies:**
- Must integrate with existing toggle queue system
- Follow parameter management patterns
- Update toggle state management

### 🖥️ **Scenario: Add Multi-Window Support**

**Required Changes:**
1. **`src/background/window-manager.js`** - Extend window tracking
2. **`src/utils/window-state.js`** - Add multi-window state management
3. **`src/popup/window-state-manager.js`** - Update window controls
4. **`src/popup/index.js`** - Handle multiple window instances

**Dependencies:**
- Requires significant window management refactoring
- Must maintain data consistency across windows
- Update message routing for multiple instances

### 📊 **Scenario: Add Performance Comparison**

**Required Changes:**
1. **`src/background/tab-manager.js`** - Add historical data storage
2. **`src/popup/displays/comparison-display.js`** - Create comparison UI
3. **`src/popup.html`** - Add comparison tab
4. **`src/content/performance/`** - Update all monitors for historical tracking
5. **`src/style.css`** - Add comparison visualization styles

**Dependencies:**
- Requires data persistence strategy
- Must integrate with all existing monitors
- Need new visualization components

## 🤝 Contributing

### Code Style Guidelines
- Use ES6+ features and modules
- Follow existing naming conventions
- Add JSDoc comments for functions
- Maintain separation of concerns

### File Organization
- Keep related functionality in same directory
- Use descriptive file names
- Maintain consistent import/export patterns
- Follow established dependency patterns

### Testing Requirements
- Test in both attached and detached modes
- Verify cross-tab functionality
- Test on various website types
- Validate performance impact

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Follow enhancement scenarios guide
4. Test thoroughly
5. Update documentation
6. Submit pull request

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Built with ❤️ for the BigScoots community**
