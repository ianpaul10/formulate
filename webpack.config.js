const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    background: "./src/background.js",
    content: "./src/content.js",
    popup: "./src/popup.js",
    utils: "./src/utils.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
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
        { from: "manifest.json", to: "manifest.json" },
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
