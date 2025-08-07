module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Expo preset already includes these transformations
      // No additional plugins needed to avoid conflicts
    ],
  };
};
