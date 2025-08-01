const fs = require("fs")
const path = require("path")
const chalk = require("chalk")

// Parse command line arguments
const args = process.argv.slice(2)
const versionType = args[0] // patch, minor, major

if (!["patch", "minor", "major"].includes(versionType)) {
  console.error(chalk.red("❌ Error: Version type must be patch, minor, or major"))
  process.exit(1)
}

function bumpVersion() {
  try {
    // Read package.json
    const packagePath = path.resolve(__dirname, "../package.json")
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"))

    // Read manifest.json from src
    const manifestPath = path.resolve(__dirname, "../src/manifest.json")
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))

    // Parse current version
    const currentVersion = packageJson.version
    const [major, minor, patch] = currentVersion.split(".").map(Number)

    // Calculate new version
    let newVersion
    switch (versionType) {
      case "major":
        newVersion = `${major + 1}.0.0`
        break
      case "minor":
        newVersion = `${major}.${minor + 1}.0`
        break
      case "patch":
        newVersion = `${major}.${minor}.${patch + 1}`
        break
    }

    console.log(chalk.blue(`📈 Bumping version: ${currentVersion} → ${newVersion}`))

    // Update package.json
    packageJson.version = newVersion
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n")

    // Update manifest.json
    manifest.version = newVersion
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")

    console.log(chalk.green("✅ Version updated successfully!"))
    console.log(chalk.gray(`   package.json: ${newVersion}`))
    console.log(chalk.gray(`   manifest.json: ${newVersion}`))
  } catch (error) {
    console.error(chalk.red("❌ Error updating version:"), error.message)
    process.exit(1)
  }
}

bumpVersion()
