module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        webpackConfig.resolve.fallback = {
          process: require.resolve('process/browser'),
        };
        return webpackConfig;
      },
    },
  };
  