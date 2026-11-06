const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const source = path.join(__dirname, '..', 'icons', 'app-icon.svg');
  const output = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(output, { recursive: true });
  await sharp(source).resize(1024, 1024).png().toFile(path.join(output, 'icon-only.png'));
  await sharp(source).resize(2732, 2732, { fit: 'contain', background: '#0756a5' }).png().toFile(path.join(output, 'splash.png'));
}
main().catch(error => { console.error(error); process.exit(1); });
