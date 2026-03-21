const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'public/assets/buildings');

async function processImages() {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png') && !f.includes('_nobg.png'));
  
  for (const file of files) {
    const p = path.join(DIR, file);
    console.log('Processing', file);
    const img = await Jimp.read(p);
    
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // Strict pure white detection (> 240) + feather
      if (red > 240 && green > 240 && blue > 240) {
        const whiteness = (red + green + blue) / 3;
        if (whiteness > 250) {
           this.bitmap.data[idx + 3] = 0; // Fully transparent
        } else {
           // Feather anti-aliases slightly
           this.bitmap.data[idx + 3] = Math.max(0, 255 - (whiteness - 240) * 17);
        }
      }
    });

    // Auto-crop to remove dead transparent space around the isometric subject
    img.autocrop();

    await img.writeAsync(p);
    console.log('Finished', file);
  }
}

processImages().catch(console.error);
