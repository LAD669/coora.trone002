const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  config.resolver.platforms = ['ios', 'android', 'native'];
  
  // Disable Watchman to avoid hanging issues
  config.watchFolders = [];
  config.watcher = {
    additionalExts: ['cjs', 'mjs'],
    watchman: {
      deferStates: ['hg.update'],
    },
  };
  
  return config;
})();
