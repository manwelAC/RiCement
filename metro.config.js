// Polyfill for older Node.js versions
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return this.slice().reverse();
  };
}

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add GLB file support
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;