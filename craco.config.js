const CracoAlias = require('craco-alias')
const CracoLessPlugin = require('craco-less')
// const CracoAntDesignPlugin = require('craco-antd')
const path = require('path')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')
const Chalk = require('chalk')
const webpack = require('webpack')

module.exports = {
  babel: {
    plugins: [
      [
        'import',
        {
          libraryName: 'antd',
          libraryDirectory: 'es',
          style: true,
        },
        'ant',
      ],
      [
        'import',
        {
          libraryName: '@ant-design/icons',
          libraryDirectory: 'es/icons',
          camel2DashComponentName: false,
        },
        '@ant-design/icons',
      ],
      ['@babel/plugin-proposal-optional-chaining'],
      [
        '@babel/plugin-proposal-decorators',
        {
          legacy: true,
        },
      ],
    ],
  },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        aliases: {
          '@': path.join(__dirname, '/src'),
        },
      },
    },
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@ant-prefix': 'sidus-3d',
            },
            javascriptEnabled: true,
          },
        },
        modifyLessRule: function (lessRule, context) {
          lessRule.test = /\.(less)$/
          lessRule.exclude = undefined
          return lessRule
        },
      },
    },
  ],
  webpack: {
    alias: {
      '@': path.join(__dirname, '/src'),
    },
    plugins: [
      new ProgressBarPlugin({
        width: 60,
        format: `${Chalk.green('build')} [ ${Chalk.cyan(':bar')} ] ${Chalk.cyan(
          ':msg',
        )} ${Chalk.red('(:percent)')}`,
        clear: true,
      }),
      new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh-cn/),
      new AntdDayjsWebpackPlugin({
        plugins: [],
        replaceMoment: true,
      }),
    ],
    configure: (webpackConfig) => {
      return webpackConfig
    },
  },
  devServer: (config) => {
    return {
      ...config,
      port: process.env.REACT_APP_CLI_PORT,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      proxy: {
        ['^' + process.env.REACT_APP_BASE_API]: {
          target: `${process.env.REACT_APP_BASE_PATH}:${process.env.REACT_APP_SERVER_PORT}/`,
          changeOrigin: true,
          pathRewrite: {
            ['^' + process.env.REACT_APP_BASE_API]: '',
          },
        },
      },
    }
  },
}
