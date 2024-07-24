const path = require("path");

module.exports = {
  target: 'node',
  entry: "./src/vscode-extension.ts",
  mode: 'development',
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
    mainFields: ['browser', 'module', 'main'],
  },
  output: {
    filename: "vscode-extension.bundle.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: 'commonjs2',
  },
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
};
