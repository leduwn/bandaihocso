const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3000, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('Testing homepage:');
  const res = await get('/');
  console.log('HTTP Status:', res.status);
  console.log('Contains CMC title:', res.body.includes('Trường Đại học CMC - Ban Đại học số CMC'));
  console.log('Contains cmcu-logo-blue:', res.body.includes('cmcu-logo-blue.png'));
  console.log('Contains ban-dai-hoc-so-logo:', res.body.includes('ban-dai-hoc-so-logo.png'));
  console.log('Contains Ban Đại học số caption:', res.body.includes('Ban Đại học số'));
  console.log('Contains cmcu-brand.css:', res.body.includes('cmcu-brand.css'));
  console.log('Contains Campus Cầu Giấy:', res.body.includes('Campus Cầu Giấy'));
  console.log('Contains Hotline 024 7102 9999:', res.body.includes('024 7102 9999'));
  console.log('Contains AI-Native service:', res.body.includes('AI-Native'));
  console.log('Old broken chatbot script removed:', !res.body.includes('ACACChatbotConfig'));
  console.log('Old broken buttons removed:', !res.body.includes('phone-1-1.png'));

  console.log('\nTesting subpages:');
  const subpages = ['/gioi-thieu/', '/dich-vu-cua-chung-toi/', '/tin-tuc-su-kien/', '/lien-he/'];
  for (const p of subpages) {
    const subRes = await get(p);
    console.log(`Page ${p}: status ${subRes.status}, has dual logo: ${subRes.body.includes('cmcu-logo-blue.png')}`);
  }

  console.log('\nTesting Admin page:');
  const adminRes = await get('/admin/login');
  console.log('Admin login status:', adminRes.status);
}

verify().catch(console.error);
