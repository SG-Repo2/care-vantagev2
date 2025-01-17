const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add additional asset extensions
config.resolver.assetExts.push('lottie', 'json');

// Add sourceExts to ensure proper file resolution
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

// Ensure proper module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Enable symlinks for proper package resolution
config.resolver.enableSymlinks = true;

module.exports = config;
