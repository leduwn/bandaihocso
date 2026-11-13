const fs = require('fs');
const path = require('path');

const srcDir = 'asset';
const destDir = 'public/uploads';

const photoMap = {
  '1794542940661_7991897423923476666_7991897423923476666_7ab91640ea24dc78deeefd1c8d0d83d7.jpg': 'bds-opening-ceremony.jpg',
  '1794542921601_7991897423923476666_7991897423923476666_d999f4ca833e3a9e319259795ef63702.jpg': 'bds-1st-ai-reception.jpg',
  '1794542971476_7991897423923476666_7991897423923476666_874335649f11b8715596061e3e8afc30.jpg': 'bds-team-office.jpg',
  '1794542865744_7991897423923476666_7991897423923476666_3c2f249de6c6913a4a1b5ee403bf1866.jpg': 'bds-ai-lab-whiteboard.jpg',
  '1794542865872_7991897423923476666_7991897423923476666_f4e3d168b18022a075624c2903e40be2.jpg': 'bds-lecturer-student-ai.jpg',
  '1794542883783_7991897423923476666_7991897423923476666_810073ee5ef87a85461904672ea2ff2c.jpg': 'bds-student-ai-research.jpg',
  '1794542787163_7991897423923476666_7991897423923476666_39f2190a98bd58a43422b3afbd80b6e4.jpg': 'bds-ai-conference-poster.jpg',
  '1794542786894_7991897423923476666_7991897423923476666_c6937d0cd41da14ac6f990babc5e5250.jpg': 'bds-classroom-guidance.jpg',
  '1794542787886_7991897423923476666_7991897423923476666_f881a89663efb5607d4237a6668e7d64.jpg': 'bds-teambuilding.jpg'
};

for (const [srcName, destName] of Object.entries(photoMap)) {
  const s = path.join(srcDir, srcName);
  const d = path.join(destDir, destName);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(`Copied: ${srcName.slice(0, 20)}... -> ${destName}`);
  }
}
