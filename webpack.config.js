
const path = require('path');

module.exports = {
  entry: './src/puzzles.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'puzzles.js',
  }
};