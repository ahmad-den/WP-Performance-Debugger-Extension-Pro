const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const CompressionPlugin = require("compression-webpack-plugin")

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production"
  const shouldAnalyze = env && env.analyze === "true"

  console.log(`🔧 Building in ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} mode`)
  if (shouldAnalyze) console.log("📊 Bundle analysis enabled")

  return {
    mode: isProduction ? "production" : "development",

    entry: {
      background: "./src/background/index.js",
      content: "./src/content/index.js",
      popup: "./src/popup/index.js",
    },

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      clean: true,
    },

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction, // Remove console.logs in production
              drop_debugger: true,
              pure_funcs: isProduction ? ["console.log", "console.debug"] : [],
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false, // Remove comments
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],

      // Code splitting for better caching
      splitChunks: {
        chunks: (chunk) => {
          // Don't split chunks for Chrome extension entry points
          return !["background", "content", "popup"].includes(chunk.name)
        },
        minSize: 20000,
        maxSize: 100000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            chunks: "all",
          },
          utils: {
            test: /[\\/]src[\\/]utils[\\/]/,
            name: "utils",
            priority: 10,
            chunks: "all",
            minChunks: 2,
          },
        },
      },

      // Better module IDs for caching
      moduleIds: "deterministic",
      chunkIds: "deterministic",
    },

    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: "src/manifest.json",
            to: "manifest.json",
            transform(content) {
              const manifest = JSON.parse(content)
              // You can modify manifest for production here if needed
              return JSON.stringify(manifest, null, isProduction ? 0 : 2)
            },
          },
          { from: "src/popup.html", to: "popup.html" },
          { from: "src/style.css", to: "style.css" },
          // Copy the styles directory and all CSS files within it
          { from: "src/styles", to: "styles", noErrorOnMissing: true },
          { from: "src/icon16.png", to: "icon16.png", noErrorOnMissing: true },
          { from: "src/icon32.png", to: "icon32.png", noErrorOnMissing: true },
          { from: "src/icon48.png", to: "icon48.png", noErrorOnMissing: true },
          { from: "src/icon128.png", to: "icon128.png", noErrorOnMissing: true },
          { from: "src/icons", to: "icons", noErrorOnMissing: true },
        ],
      }),

      // Compression for better loading (production only)
      ...(isProduction
        ? [
            new CompressionPlugin({
              algorithm: "gzip",
              test: /\.(js|css|html|svg)$/,
              threshold: 8192,
              minRatio: 0.8,
            }),
          ]
        : []),

      // Bundle analysis (when requested)
      ...(shouldAnalyze
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: "static",
              openAnalyzer: false,
              reportFilename: "bundle-report.html",
            }),
          ]
        : []),
    ],

    // FIXED: Use CSP-compatible source maps for Chrome extensions
    devtool: isProduction
      ? "source-map" // Separate files for production
      : "cheap-module-source-map", // CSP-compatible for development

    // Performance hints
    performance: {
      hints: isProduction ? "warning" : false,
      maxEntrypointSize: 250000,
      maxAssetSize: 250000,
    },

    // Resolve optimizations
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      extensions: [".js", ".json"],
    },

    // Module rules for different file types
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      chrome: "88", // Minimum Chrome version for extensions
                    },
                    modules: false,
                  },
                ],
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },

    // Stats configuration for cleaner output
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
    },
  }
}
