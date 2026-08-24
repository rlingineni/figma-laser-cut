const HtmlPlugin = require('@rspack/plugin-html').default;
const { rspack } = require('@rspack/core');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const extensions = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json', '.css'];

/**
 * @type {import('@rspack/cli').Configuration}
 */
module.exports = {
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'inline-source-map',
  entry: {
    ui: './src/app/index.tsx',
    code: './src/plugin/controller.ts',
  },
  stats: {
    errors: true,
    warnings: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: { react: { runtime: 'classic' } },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
        type: 'javascript/auto',
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions,
    tsConfigPath: path.resolve(__dirname, 'tsconfig.json'),
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  plugins: [
    new rspack.DefinePlugin({
      'process.env.PREVIEW_ENV': JSON.stringify(process.env.PREVIEW_ENV),
    }),
    new rspack.CssExtractRspackPlugin({}),
    new HtmlPlugin({
      template: './src/app/index.ejs',
      filename: 'ui.html',
      chunks: ['ui'],
      cache: false,
      inject: false,
      minify: {
        collapseWhitespace: true,
        removeComments: true,
      },
      templateParameters: (compilation) => {
        const res = {
          inlineCss: compilation.assets['ui.css']?.source() ?? '',
          inlineJS: compilation.assets['ui.js'].source(),
        };
        if (compilation.assets['ui.css']) compilation.deleteAsset('ui.css');
        compilation.deleteAsset('ui.js');
        return res;
      },
    }),
  ],
};
