import http from 'http';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, body: d });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 登录已注册账号
  let r = await request('POST', '/auth/login', {
    email: 'health_test2@test.com',
    password: 'Test123456',
  });
  const token = r.body.access_token;
  console.log('Login:', r.status, token ? 'got token' : 'FAILED');
  if (!token) {
    process.exit(1);
  }

  // 4.2 GET full-profile 确认新字段
  r = await request('GET', '/user/full-profile', null, token);
  console.log('[4.2] GET /user/full-profile status:', r.status);
  console.log(
    '      targetWeight:',
    r.body.targetWeight,
    '(期望 300, 上次设为300)',
  );
  console.log(
    '      healthConditions:',
    JSON.stringify(r.body.healthConditions),
  );

  // 4.3 边界值测试
  r = await request('PUT', '/user/profile', { targetWeight: 29 }, token);
  console.log(
    '[4.3] targetWeight=29 (期望400):',
    r.status === 400 ? 'PASS' : 'FAIL',
    r.status,
  );

  r = await request('PUT', '/user/profile', { targetWeight: 301 }, token);
  console.log(
    '[4.3] targetWeight=301 (期望400):',
    r.status === 400 ? 'PASS' : 'FAIL',
    r.status,
  );

  r = await request('PUT', '/user/profile', { targetWeight: 30 }, token);
  console.log(
    '[4.3] targetWeight=30 (期望200):',
    r.status === 200 ? 'PASS' : 'FAIL',
    r.status,
  );

  r = await request('PUT', '/user/profile', { targetWeight: 300 }, token);
  console.log(
    '[4.3] targetWeight=300 (期望200):',
    r.status === 200 ? 'PASS' : 'FAIL',
    r.status,
  );

  // 4.4 未设健康字段的用户
  let r2 = await request('POST', '/auth/register', {
    email: 'new_user_nohealth@test.com',
    password: 'Test123456',
  });
  console.log('[4.4] Register new user:', r2.status);
  r2 = await request('POST', '/auth/login', {
    email: 'new_user_nohealth@test.com',
    password: 'Test123456',
  });
  const token2 = r2.body.access_token;
  r2 = await request('GET', '/user/full-profile', null, token2);
  console.log(
    '[4.4] 新用户 targetWeight:',
    r2.body.targetWeight,
    '| healthConditions:',
    r2.body.healthConditions,
  );
  console.log(
    '[4.4] PASS:',
    r2.body.targetWeight === null && r2.body.healthConditions === null
      ? 'PASS'
      : 'FAIL',
  );
}

main().catch((e) => console.error('Error:', e.message));
