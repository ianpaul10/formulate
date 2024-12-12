const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env) => ({
  mode: "development",
  devtool: "source-map",
  entry: {
    background: "./src/background.js",
    content: "./src/content.js",
    popup: "./src/popup.js",
  },
  output: {
    path: path.resolve(__dirname, `dist/${env.browser}`),
    filename: "[name].js",
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
          from: "manifest.json",
          to: "manifest.json",
          transform(content) {
            const manifest = JSON.parse(content);
            // Browser-specific manifest modifications
            if (env.browser === "chrome") {
              delete manifest.browser_specific_settings;
              // Use service_worker for Chrome
              manifest.background = {
                service_worker: "src/background.js",
                type: "module",
              };
            } else {
              // Use scripts array for Firefox
              manifest.background = {
                scripts: ["src/background.js"],
                type: "module",
              };
            }
            return JSON.stringify(manifest, null, 2);
          },
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
});
