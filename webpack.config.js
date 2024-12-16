const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

/**
 * @param {string} browser - The target browser (chrome or firefox)
 * @returns {import('webpack').Configuration}
 */
function generateConfig(browser) {
  return {
    mode: "development",
    devtool: "source-map",
    entry: {
      background_worker: "./src/background_worker.js",
      web_content_handler: "./src/web_content_handler.js",
      widget_popup: "./src/widget_popup.js",
      form_input_listener: "./src/form_input_listener.js",
      utils: "./src/utils.js",
    },
    output: {
      path: path.resolve(__dirname, `dist/${browser}`),
      filename: "src/[name].js",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { 
            from: browser === "firefox" ? "manifest.firefox.json" : "manifest.json", 
            to: "manifest.json" 
          },
          { from: "public", to: "public" },
          { from: "src/types.js", to: "src/types.js" },
          {
            from: "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
            to: "browser-polyfill.min.js",
          },
        ],
      }),
    ],
  };
}

// Export configurations for both browsers
module.exports = [
  generateConfig("chrome"),
  // Uncomment when ready to add Firefox support
  // generateConfig("firefox"),
];
