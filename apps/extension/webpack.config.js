const path = require("path");

function createWebpackConfig(mode = "production", watch = false) {
  const isProduction = mode === "production";

  return {
    mode,
    watch,
    target: ["web", "es2020"],
    entry: {
      contentScript: path.join(__dirname, "src", "contentScript", "index.ts"),
      hook: path.join(__dirname, "src", "hook", "index.ts"),
      client: path.join(__dirname, "src", "client", "index.ts")
    },
    output: {
      path: path.join(__dirname, "build", "production_chrome"),
      filename: "[name].bundle.js",
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-typescript",
                "solid"
              ]
            }
          }
        }
      ]
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    devtool: isProduction ? false : "cheap-module-source-map",
    optimization: {
      minimize: isProduction
    }
  };
}

module.exports = createWebpackConfig;
