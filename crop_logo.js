const sharp = require('sharp');

async function processLogo() {
  try {
    const inputPath = 'public/logo.jpg';
    const outputPath = 'public/logo-cropped.png';

    // Let's just do a simple tight trim on the dark background.
    // By default, trim() uses the top-left pixel color.
    await sharp(inputPath)
      .trim({
        threshold: 25 // fairly conservative
      })
      .toFile(outputPath);

    console.log('Successfully tightly cropped image');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

processLogo();
