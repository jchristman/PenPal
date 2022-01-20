module.exports = {
  context: __dirname + "/client",
  entry: {
    javascript: "./src/client/main.js",
    html: "./src/client/main.html"
  },
  output: {
    filename: "client.js",
    path: __dirname + "/dist"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ["react-hot", "babel-loader"]
      },
      {
        test: /\.html$/,
        loader: "file?name=[name].[ext]"
      }
    ]
  }
};
