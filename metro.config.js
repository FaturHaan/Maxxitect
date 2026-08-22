const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Abaikan folder supabase/ agar Metro tidak mencoba mem-bundle file backend
config.resolver = {
  ...config.resolver,
  blockList: [
    new RegExp(`${path.resolve(__dirname, 'supabase').replace(/\\/g, '\\\\')}.*`),
  ],
};

module.exports = config;
