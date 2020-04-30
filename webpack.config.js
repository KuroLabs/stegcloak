const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './stegcloak.js',
  output: {
    filename: 'stegcloak.js',
    path: path.resolve(__dirname, 'dist'),
    library:'StegCloak'
  },
  plugins: [
    new HtmlWebpackPlugin(),
]
}
