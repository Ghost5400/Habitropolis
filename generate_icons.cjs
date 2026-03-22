// Generate PWA icon sizes from the existing logo.png
// Run: node generate_icons.cjs

const Jimp = require('jimp');
const path = require('path');

async function generateIcons() {
  const logoPath = path.join(__dirname, 'public', 'logo.png');
  const image = await Jimp.read(logoPath);

  // Regular icons
  const sizes = [192, 512];
  for (const size of sizes) {
    const clone = image.clone();
    clone.cover(size, size);
    await clone.writeAsync(path.join(__dirname, 'public', `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  // Maskable icons (with 10% padding for safe zone)
  for (const size of sizes) {
    const padding = Math.floor(size * 0.1);
    const innerSize = size - padding * 2;
    const canvas = new Jimp(size, size, 0x0a0a1aff); // Dark background
    const clone = image.clone();
    clone.cover(innerSize, innerSize);
    canvas.composite(clone, padding, padding);
    await canvas.writeAsync(path.join(__dirname, 'public', `icon-maskable-${size}.png`));
    console.log(`Generated icon-maskable-${size}.png`);
  }

  console.log('✅ All icons generated!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
