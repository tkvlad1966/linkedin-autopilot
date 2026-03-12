const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const Dotenv = require('dotenv-webpack')

const isDev = process.env.NODE_ENV !== 'production'

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'inline-source-map' : false,

  entry: {
    // MV3: flat output names match manifest.json references
    background: './src/background/service-worker.ts',
    content:    './src/content/index.ts',
    popup:      './src/popup/index.ts',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },

  plugins: [
    new Dotenv({
      path: path.resolve(__dirname, '.env'),
      safe: false,
      silent: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json',        to: 'manifest.json' },
        { from: 'src/popup/index.html', to: 'popup.html' },
        { from: 'icons', to: 'icons', noErrorOnMissing: true },
      ],
    }),
  ],

  // Prevent code-splitting — service worker must be a single file in MV3
  optimization: {
    splitChunks: false,
  },
}
