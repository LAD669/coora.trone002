const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // Nur mobile Plattformen aktiv
  config.resolver.platforms = ['ios', 'android', 'native'];

  return config;
})();
