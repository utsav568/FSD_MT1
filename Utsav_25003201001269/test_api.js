const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
        }
      },
      res => {
        let resData = '';
        res.on('data', chunk => {
          resData += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: resData });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`PASS: ${testName}`);
      passed++;
    } else {
      console.error(`FAIL: ${testName}`);
      failed++;
    }
  }

  const resAll = await request('GET', '/api/registrations');
  assert(resAll.status === 200 && Array.isArray(resAll.body) && resAll.body.length === 3, 'GET /api/registrations returns initial 3 records');

  const resFilterCSE = await request('GET', '/api/registrations/filter?department=cse');
  assert(resFilterCSE.status === 200 && Array.isArray(resFilterCSE.body) && resFilterCSE.body.length === 1 && resFilterCSE.body[0].department === 'CSE', 'GET /api/registrations/filter?department=cse is case-insensitive');

  const resFilterEmpty = await request('GET', '/api/registrations/filter?department=nonexistent');
  assert(resFilterEmpty.status === 200 && Array.isArray(resFilterEmpty.body) && resFilterEmpty.body.length === 0, 'GET /api/registrations/filter with non-matching returns empty array');

  const resPending = await request('GET', '/api/registrations/pending');
  assert(resPending.status === 200 && Array.isArray(resPending.body) && resPending.body.every(r => r.paymentStatus === 'Pending'), 'GET /api/registrations/pending returns pending items');

  const resById = await request('GET', '/api/registrations/501');
  assert(resById.status === 200 && resById.body.id === 501, 'GET /api/registrations/501 returns matching record');

  const resByIdNotFound = await request('GET', '/api/registrations/999');
  assert(resByIdNotFound.status === 404, 'GET /api/registrations/999 returns 404');

  const postPayload = {
    participantName: "Karan Singh",
    eventName: "AI Workshop",
    department: "CSE",
    ticketCount: 2,
    paymentStatus: "Pending"
  };
  const resPost = await request('POST', '/api/registrations', postPayload);
  assert(resPost.status === 201 && resPost.body.id === 504 && resPost.body.participantName === "Karan Singh", 'POST /api/registrations creates new record with 201');

  const resPostInvalid = await request('POST', '/api/registrations', { ...postPayload, ticketCount: -1 });
  assert(resPostInvalid.status === 400, 'POST /api/registrations rejects negative ticketCount with 400');

  const resPostInvalidStatus = await request('POST', '/api/registrations', { ...postPayload, paymentStatus: 'Unknown' });
  assert(resPostInvalidStatus.status === 400, 'POST /api/registrations rejects invalid paymentStatus with 400');

  const putPayload = {
    participantName: "Riya Sharma",
    eventName: "Tech Fest",
    department: "CSE",
    ticketCount: 3,
    paymentStatus: "Paid"
  };
  const resPut = await request('PUT', '/api/registrations/501', putPayload);
  assert(resPut.status === 200 && resPut.body.ticketCount === 3, 'PUT /api/registrations/501 updates record with 200');

  const resPutNotFound = await request('PUT', '/api/registrations/999', putPayload);
  assert(resPutNotFound.status === 404, 'PUT /api/registrations/999 returns 404');

  const resDelete = await request('DELETE', '/api/registrations/502');
  assert(resDelete.status === 200 && resDelete.body.message, 'DELETE /api/registrations/502 deletes record with 200');

  const resDeleteNotFound = await request('DELETE', '/api/registrations/999');
  assert(resDeleteNotFound.status === 404, 'DELETE /api/registrations/999 returns 404');

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
