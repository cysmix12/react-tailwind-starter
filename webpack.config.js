const webpack = require('webpack');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
let ReactRefreshWebpackPlugin = null;

const packageGroups = require('./packageGroups.json');

// TODO: Switch to 'cross-env'
// ? 'DOTENV' variable is specified in package.json 'scripts' property.
// ? 'dotenv' package is used when developing.
// ? But when deploying to Netlify/Vercel/Heroku, environment variables are automatically exposed.
if (process.env.DOTENV === 'true') require('dotenv').config();

const { NODE_ENV, TITLE, PORT } = process.env;

const isProduction = NODE_ENV === 'production';

if (!isProduction)
  ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const modules = () => {
  return {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        resolve: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [!isProduction && 'react-refresh/babel'].filter(Boolean),
          },
        },
      },
      {
        test: /\.(c|sc|sa)ss$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: isProduction
                  ? [tailwindcss, autoprefixer, cssnano]
                  : [tailwindcss],
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        type: 'asset',
      },
    ],
  };
};

const plugins = () =>
  [
    !isProduction && new ReactRefreshWebpackPlugin(),
    new webpack.EnvironmentPlugin({
      ...process.env,
    }),
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: isProduction,
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      title: TITLE,
      base: '/',
      meta: {
        charset: 'utf-8',
        viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
      },
    }),
    isProduction &&
      new MiniCssExtractPlugin({
        filename: '[name].[fullhash].css',
        chunkFilename: '[name].[chunkhash].css',
      }),
    new CopyWebpackPlugin({ patterns: [{ from: 'public/' }] }),
    isProduction &&
      new ImageMinimizerPlugin({
        minimizer: {
          // TODO: Possibly switch to '@squoosh/lib'
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              [
                'gifsicle',
                {
                  interlaced: true,
                  optimizationLevel: 3,
                },
              ],
              [
                'mozjpeg',
                {
                  progressive: true,
                  quality: 70,
                },
              ],
              [
                'pngquant',
                {
                  strip: true,
                  quality: [0.7, 0.7],
                },
              ],
              'svgo',
            ],
          },
        },
      }),
  ].filter(Boolean);

const config = () => {
  if (isProduction)
    return {
      mode: 'production',
      entry: {
        app: path.resolve(__dirname, 'src/index.tsx'),
      },
      resolve: {
        alias: {
          '@app': path.resolve(__dirname, 'src/'),
          '@styles': path.resolve(__dirname, 'src/styles/'),
        },
      },
      output: {
        publicPath: '/',
        path: path.resolve(__dirname, 'dist/'),
        filename: '[name].[fullhash].js',
        chunkFilename: '[name].[chunkhash].js',
      },
      optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: {
          name: 'manifest',
        },
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: Infinity,
          minSize: 0,
          name: (module) => {
            const package = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            );
            if (package) {
              const packageName = package[1];
              for (let key in packageGroups.groups) {
                if (packageGroups.groups[key].includes(packageName))
                  return `${packageGroups.prefix}.${key}`;
              }
            }
            return packageGroups.prefix;
          },
        },
      },
      module: modules(),
      plugins: plugins(),
    };
  else
    return {
      mode: 'development',
      cache: false,
      entry: {
        app: path.resolve(__dirname, 'src/index.tsx'),
      },
      resolve: {
        alias: {
          '@app': path.resolve(__dirname, 'src/'),
          '@styles': path.resolve(__dirname, 'src/styles/'),
        },
      },
      output: {
        publicPath: '/',
        path: path.resolve(__dirname, 'dist/'),
      },
      devServer: {
        port: PORT || 3000,
        hot: true,
        open: true,
        historyApiFallback: true,
      },
      module: modules(),
      plugins: plugins(),
    };
};

module.exports = config();
