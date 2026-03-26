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
      res.on('end', () =>
        resolve({ status: res.statusCode, body: JSON.parse(d) }),
      );
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 注册测试用户（忽略已存在错误）
  let r = await request('POST', '/auth/register', {
    email: 'health_test2@test.com',
    password: 'Test123456',
  });
  console.log('Register:', r.status);

  // 登录
  r = await request('POST', '/auth/login', {
    email: 'health_test2@test.com',
    password: 'Test123456',
  });
  const token = r.body.access_token;
  console.log('Login:', r.status, token ? 'got token' : 'no token');

  // 4.1 更新 targetWeight 和 healthConditions
  r = await request(
    'PUT',
    '/user/profile',
    { targetWeight: 65, healthConditions: ['高血压', '糖尿病'] },
    token,
  );
  console.log(
    '[4.1] PUT /user/profile:',
    r.status,
    '| targetWeight:',
    r.body.targetWeight,
    '| healthConditions:',
    JSON.stringify(r.body.healthConditions),
  );

  // 4.2 GET full-profile 确认新字段
  r = await request('GET', '/user/full-profile', null, token);
  console.log(
    '[4.2] GET /user/full-profile | targetWeight:',
    r.body.targetWeight,
    '| healthConditions:',
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

  // 4.4 旧用户（新建用户，未设置健康字段）
  let r2 = await request('POST', '/auth/register', {
    email: 'old_user_test@test.com',
    password: 'Test123456',
  });
  r2 = await request('POST', '/auth/login', {
    email: 'old_user_test@test.com',
    password: 'Test123456',
  });
  const token2 = r2.body.access_token;
  r2 = await request('GET', '/user/full-profile', null, token2);
  console.log(
    '[4.4] 旧用户(未设健康字段) targetWeight:',
    r2.body.targetWeight,
    '| healthConditions:',
    r2.body.healthConditions,
    '(期望均为null)',
  );
  console.log(
    '[4.4] PASS:',
    r2.body.targetWeight === null && r2.body.healthConditions === null,
  );
}

main().catch((e) => console.error(e));
