const path = require("path");

module.exports = {
  entry: "./src/web-ui.ts",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "web-ui.bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
