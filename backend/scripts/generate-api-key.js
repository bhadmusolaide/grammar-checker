#!/usr/bin/env node

/**
 * Script to generate a secure API key for production deployment
 *
 * Usage: node scripts/generate-api-key.js
 */

const crypto = require('crypto');

function generateSecureApiKey() {
  // Generate a 32-byte random key and convert to hexadecimal
  return crypto.randomBytes(32).toString('hex');
}

function generateSecureApiKeyBase64() {
  // Generate a 32-byte random key and convert to base64
  return crypto.randomBytes(32).toString('base64');
}

// Generate and display the API key
const hexKey = generateSecureApiKey();
const base64Key = generateSecureApiKeyBase64();

console.log('Secure API Key Generator');
console.log('========================');
console.log('');
console.log('HEX Format (recommended for .env files):');
console.log(hexKey);
console.log('');
console.log('Base64 Format (alternative):');
console.log(base64Key);
console.log('');
console.log('To use in production:');
console.log('1. Copy one of the keys above');
console.log('2. Replace the API_KEY value in your .env file');
console.log('3. Keep this key secret and never commit it to version control');
