const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = path.join(__dirname, '..');
  const source = path.join(root, 'icons', 'app-icon.svg');
  const output = path.join(root, 'assets');
  const web = path.join(root, 'www');
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(web, { recursive: true });

  // capacitor-assets requires assets/icon.png as its standard source.
  await sharp(source).resize(1024, 1024).png().toFile(path.join(output, 'icon.png'));
  await sharp(source).resize(1024, 1024).png().toFile(path.join(output, 'icon-only.png'));

  // Android adaptive icon foreground, with safe padding for launcher masks.
  const foreground = await sharp(source)
    .resize(680, 680, { fit: 'contain' })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: foreground, left: 172, top: 172 }])
    .png()
    .toFile(path.join(output, 'icon-foreground.png'));

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: '#0756a5'
    }
  }).png().toFile(path.join(output, 'icon-background.png'));

  await sharp(source)
    .resize(2732, 2732, { fit: 'contain', background: '#0756a5' })
    .png()
    .toFile(path.join(output, 'splash.png'));

  for (const item of ['index.html', 'manifest.webmanifest', 'css', 'js', 'icons']) {
    fs.cpSync(path.join(root, item), path.join(web, item), { recursive: true });
  }
}
main().catch(error => { console.error(error); process.exit(1); });
