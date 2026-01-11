const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Polyfill for toReversed if not available (for Node.js < 22)
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

const config = getDefaultConfig(__dirname);

// Optimize file watching to prevent "too many open files" error
config.watchFolders = [__dirname];
config.resolver = {
  ...config.resolver,
  blockList: [
    /node_modules\/.*\/node_modules\/react-native\/.*/,
  ],
};

// Reduce file watching by excluding unnecessary directories
config.watcher = {
  ...config.watcher,
  additionalExts: ['cjs', 'mjs'],
  healthCheck: {
    enabled: true,
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
