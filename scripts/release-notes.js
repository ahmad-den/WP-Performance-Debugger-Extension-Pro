const fs = require("fs")
const path = require("path")
const chalk = require("chalk")

// Parse command line arguments
const args = process.argv.slice(2)
const version = args[0]

if (!version) {
  console.error(chalk.red("❌ Error: Please provide a version number"))
  console.log(chalk.gray("Usage: node scripts/release-notes.js 1.2.3"))
  process.exit(1)
}

function generateReleaseNotes() {
  const template = `# Release Notes - v${version}

## 🚀 New Features
- 

## 🐛 Bug Fixes
- 

## 🔧 Improvements
- 

## 📝 Technical Changes
- 

## 🔄 Breaking Changes
- None

## 📋 Installation
1. Download the extension package
2. Open Chrome and go to chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## 🧪 Testing
- [ ] Extension loads without errors
- [ ] All tabs function correctly
- [ ] Performance monitoring works
- [ ] Cache analysis displays properly
- [ ] Debug toggles work as expected

---
**Full Changelog**: [Compare v${version}](https://github.com/your-username/bigscoots-perf-extension/compare/v${version})
`

  const notesPath = path.resolve(__dirname, "../releases", `release-notes-v${version}.md`)

  // Ensure releases directory exists
  const releasesDir = path.dirname(notesPath)
  if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir, { recursive: true })
  }

  fs.writeFileSync(notesPath, template)

  console.log(chalk.green("✅ Release notes template created!"))
  console.log(chalk.gray(`   File: releases/release-notes-v${version}.md`))
  console.log(chalk.yellow("\n📝 Please edit the file to add your changes before releasing."))
}

generateReleaseNotes()
