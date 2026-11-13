const fs = require('fs');

function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.toString('ascii', 1, 4) === 'PNG') {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  }
  return null;
}

console.log('ban-dai-hoc-so-logo:', getPngDimensions('public/uploads/ban-dai-hoc-so-logo.png'));
console.log('cmcu-logo-blue:', getPngDimensions('public/uploads/cmcu-logo-blue.png'));
console.log('cmcu-logo-white:', getPngDimensions('public/uploads/cmcu-logo-white.png'));
