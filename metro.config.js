const { getDefaultConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    sourceExts: [...defaultConfig.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'],
    resolverMainFields: ['react-native', 'browser', 'main'],
    assetExts: [...defaultConfig.resolver.assetExts, 'lottie', 'json'],
    // Add .expo directory to watchFolders
    watchFolders: [
      ...defaultConfig.resolver.watchFolders || [],
      `${__dirname}/.expo`
    ],
  },
  // Ensure .expo directory is included in the project roots
  projectRoot: __dirname,
  watchFolders: [`${__dirname}/.expo`]
};
