
const webpack = require('webpack')
const dotenv = require('dotenv')
const path = require('path');

dotenv.config();

module.exports = {
  entry: './src/puzzles.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'puzzles.js',
  },
  resolve: {
    fallback: {
      "stream": require.resolve("stream-browserify")
    }
  },
  plugins: [
    // fix "process is not defined" error:
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ]
};