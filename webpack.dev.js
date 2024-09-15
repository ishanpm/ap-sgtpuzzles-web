
const path = require('path');

module.exports = {
  entry: './src/puzzles.js',
  mode: 'development',
  resolve: {
    alias: {
      config: path.join(__dirname, 'src', 'config-dev.js')
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'puzzles.js',
  }
};