const fs = require('fs');
const path = require('path');

console.log('📝 Creating placeholder icon files...\n');

const publicDir = path.join(__dirname, '..', '..', 'nextjs', 'public');

// Ensure directory exists
if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found:', publicDir);
    process.exit(1);
}

// Create SVG icon (512x512)
const iconSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <text x="256" y="280" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">V</text>
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" opacity="0.9">ZK Lending</text>
</svg>`;

// Create OG image SVG (1200x630)
const ogSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#581c87;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#grad2)"/>
  <text x="600" y="250" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">VeriFi</text>
  <text x="600" y="350" font-family="Arial, sans-serif" font-size="48" fill="#a78bfa" text-anchor="middle">Privacy-Preserving P2P Lending</text>
  <text x="600" y="450" font-family="Arial, sans-serif" font-size="36" fill="#60a5fa" text-anchor="middle">🔐 Powered by Zero-Knowledge Proofs</text>
</svg>`;

// Write files
fs.writeFileSync(path.join(publicDir, 'verifi-icon.svg'), iconSvg);
fs.writeFileSync(path.join(publicDir, 'og-image.svg'), ogSvg);

console.log('✅ Created: public/verifi-icon.svg');
console.log('✅ Created: public/og-image.svg');
console.log('\n📌 Note: For production, convert these to PNG:');
console.log('   - verifi-icon.png (512x512)');
console.log('   - og-image.png (1200x630)');
console.log('\n💡 You can use online tools like:');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - Or design custom icons in Figma/Canva\n');
