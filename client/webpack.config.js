const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function readRootEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return {};
  return fs.readFileSync(envPath, 'utf8').split(/\r?\n/).reduce((values, line) => {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith('#')) return values;
    values[match[1]] = match[2].replace(/^(['\x22])(.*)\1$/, '$2');
    return values;
  }, {});
}

const rootEnv = readRootEnv();
const googleClientId = process.env.GOOGLE_CLIENT_ID || rootEnv.GOOGLE_CLIENT_ID || '';
const hideGoogleAuth = /^(true|1|yes)$/i.test(process.env.HIDE_GOOGLE_AUTH || rootEnv.HIDE_GOOGLE_AUTH || 'false');

module.exports = {
  entry: './src/index.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'app.[contenthash].js', clean: true, publicPath: '/' },
  module: { rules: [
    { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
    { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    { test: /\.(woff2?|ttf|eot|svg)$/, type: 'asset/resource' }
  ] },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new webpack.DefinePlugin({
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
      'process.env.HIDE_GOOGLE_AUTH': JSON.stringify(hideGoogleAuth)
    })
  ],
  devServer: { port: 3000, historyApiFallback: true, hot: true, proxy: [{ context: ['/api'], target: 'http://localhost:5000' }] },
  devtool: 'source-map'
};
