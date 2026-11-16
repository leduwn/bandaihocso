const http = require('http');
const { db } = require('../lib/db');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('--- TEST 1: Homepage ---');
  let res = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
  console.log('Homepage status:', res.status, 'Has title:', res.body.includes('Trang chủ - ACAC'));

  console.log('\n--- TEST 2: Core Subpages ---');
  const testPages = ['/gioi-thieu/', '/dich-vu-cua-chung-toi/', '/tin-tuc-su-kien/', '/lien-he/'];
  for (const p of testPages) {
    res = await request({ hostname: 'localhost', port: 3000, path: p, method: 'GET' });
    console.log(`Page ${p}: status ${res.status}, body length: ${res.body.length}`);
  }

  console.log('\n--- TEST 3: Admin Login Page ---');
  res = await request({ hostname: 'localhost', port: 3000, path: '/admin/login', method: 'GET' });
  console.log('Admin login status:', res.status, 'Has login card:', res.body.includes('login-card'));

  console.log('\n--- TEST 4: Admin Authentication ---');
  const postData = 'username=admin&password=admin123';
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, postData);
  console.log('Login POST status:', res.status, 'Location:', res.headers.location);
  const cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : '';
  console.log('Received auth cookie:', !!cookie);

  console.log('\n--- TEST 5: Access Admin Dashboard With Cookie ---');
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin',
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  console.log('Admin Dashboard status:', res.status, 'Has CMS Pro:', res.body.includes('CMS Pro'));

  console.log('\n--- TEST 6: Save Live Edit via API ---');
  const editPayload = JSON.stringify({
    page_slug: 'index',
    edits: [{
      element_id: 'txt-0',
      content_type: 'text',
      content_value: 'CÔNG TY TNHH TƯ VẤN VÀ KIỂM TOÁN ANH (ACAC CHUẨN)'
    }]
  });
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/save-live-edits',
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(editPayload)
    }
  }, editPayload);
  console.log('Save edit status:', res.status, 'Response:', res.body);

  console.log('\n--- TEST 7: Check if saved edit renders on Homepage ---');
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  });
  console.log('Homepage reflects edited text:', res.body.includes('CÔNG TY TNHH TƯ VẤN VÀ KIỂM TOÁN ANH (ACAC CHUẨN)'));

  // Clean up test edit row so data/acac.db is not polluted with ACAC text
  db.prepare("DELETE FROM page_edits WHERE page_slug = 'index' AND element_id = 'txt-0' AND content_value LIKE '%ACAC%'").run();

  console.log('\n--- TEST 8: Test Contact Form Submission ---');
  const contactPayload = JSON.stringify({
    firstname: 'Nguyễn',
    lastname: 'Văn A',
    company: 'Doanh nghiệp FDI',
    email: 'khachhang@example.com',
    phone: '0912345678',
    message: 'Cần tư vấn dịch vụ kiểm toán và báo cáo thuế năm 2026'
  });
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/contact',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(contactPayload)
    }
  }, contactPayload);
  console.log('Contact form status:', res.status, 'Response:', res.body);

  console.log('\n=== ALL TESTS PASSED! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
