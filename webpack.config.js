"use strict";
const path = require("path");
const CopyWebPackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = () => ({
  devtool: "sourcemap",
  entry: {
    background: "./src/background.ts",
    content: "./src/content.ts",
    options: "./src/options.ts",
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
    ],
  },
  /*externals: [
    'child_process'
  ],*/
  optimization: {
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new CopyWebPackPlugin([
      {
        from: "**",
        context: "src",
        ignore: ["*.js", "*.ts", "*.tsx"],
      },
    ]),
  ],
});
