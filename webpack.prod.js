
const path = require('path');

module.exports = {
  entry: './src/puzzles.js',
  mode: 'production',
  resolve: {
    alias: {
      config: path.join(__dirname, 'config', 'config-prod.js')
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'puzzles.js',
  }
};