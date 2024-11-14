
// file: next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.sqlite3 = 'sqlite3/sqlite3.js';
    return config;
  }
}

module.exports = nextConfig
