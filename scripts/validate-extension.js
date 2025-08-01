const fs = require("fs")
const path = require("path")
const chalk = require("chalk")

const distDir = path.resolve(__dirname, "../dist")
const manifestPath = path.join(distDir, "manifest.json")

function validateExtension() {
  console.log(chalk.blue("🔍 Validating extension..."))

  const errors = []
  const warnings = []

  try {
    // Check if dist directory exists
    if (!fs.existsSync(distDir)) {
      errors.push("dist directory not found. Run build first.")
      return showResults(errors, warnings)
    }

    // Check if manifest exists
    if (!fs.existsSync(manifestPath)) {
      errors.push("manifest.json not found in dist directory")
      return showResults(errors, warnings)
    }

    // Validate manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))

    // Required fields
    const requiredFields = ["manifest_version", "name", "version", "description"]
    requiredFields.forEach((field) => {
      if (!manifest[field]) {
        errors.push(`Missing required field in manifest: ${field}`)
      }
    })

    // Check manifest version
    if (manifest.manifest_version !== 3) {
      warnings.push("Using Manifest V2. Consider upgrading to Manifest V3.")
    }

    // Check required files exist
    const requiredFiles = ["background.js", "content.js", "popup.js", "popup.html", "style.css"]

    requiredFiles.forEach((file) => {
      const filePath = path.join(distDir, file)
      if (!fs.existsSync(filePath)) {
        errors.push(`Required file missing: ${file}`)
      } else {
        // Check file size
        const stats = fs.statSync(filePath)
        const sizeInKB = stats.size / 1024

        if (sizeInKB > 500) {
          warnings.push(`Large file detected: ${file} (${sizeInKB.toFixed(1)}KB)`)
        }
      }
    })

    // Check for icons
    const iconSizes = ["16", "32", "48", "128"]
    iconSizes.forEach((size) => {
      const iconPath = path.join(distDir, `icon${size}.png`)
      if (!fs.existsSync(iconPath)) {
        warnings.push(`Missing icon: icon${size}.png`)
      }
    })

    // Check total package size
    const totalSize = getTotalDirectorySize(distDir)
    const totalSizeInMB = totalSize / (1024 * 1024)

    if (totalSizeInMB > 128) {
      errors.push(`Package too large: ${totalSizeInMB.toFixed(2)}MB (Chrome Web Store limit: 128MB)`)
    } else if (totalSizeInMB > 50) {
      warnings.push(`Large package size: ${totalSizeInMB.toFixed(2)}MB`)
    }

    // Validate permissions
    if (manifest.permissions) {
      const sensitivePermissions = ["tabs", "activeTab", "<all_urls>", "storage"]
      const usedSensitivePermissions = manifest.permissions.filter((p) =>
        sensitivePermissions.some((sp) => p.includes(sp)),
      )

      if (usedSensitivePermissions.length > 0) {
        warnings.push(`Sensitive permissions detected: ${usedSensitivePermissions.join(", ")}`)
      }
    }

    showResults(errors, warnings)
  } catch (error) {
    errors.push(`Validation error: ${error.message}`)
    showResults(errors, warnings)
  }
}

function getTotalDirectorySize(dirPath) {
  let totalSize = 0

  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath)

    if (stats.isFile()) {
      totalSize += stats.size
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath)
      files.forEach((file) => {
        calculateSize(path.join(currentPath, file))
      })
    }
  }

  calculateSize(dirPath)
  return totalSize
}

function showResults(errors, warnings) {
  console.log("\n" + chalk.blue("📋 Validation Results:"))

  if (errors.length === 0 && warnings.length === 0) {
    console.log(chalk.green("✅ Extension validation passed!"))
    console.log(chalk.gray("   No errors or warnings found."))
    process.exit(0)
  }

  if (errors.length > 0) {
    console.log(chalk.red(`\n❌ Errors (${errors.length}):`))
    errors.forEach((error) => {
      console.log(chalk.red(`   • ${error}`))
    })
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow(`\n⚠️  Warnings (${warnings.length}):`))
    warnings.forEach((warning) => {
      console.log(chalk.yellow(`   • ${warning}`))
    })
  }

  if (errors.length > 0) {
    console.log(chalk.red("\n❌ Validation failed. Please fix errors before releasing."))
    process.exit(1)
  } else {
    console.log(chalk.green("\n✅ Validation passed with warnings."))
    process.exit(0)
  }
}

validateExtension()
