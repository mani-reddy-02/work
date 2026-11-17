import assert from 'assert';
import http from 'http';
import app from '../app';
import { prisma } from '../config/prisma';

let server: http.Server;
let baseUrl: string;

function makeRequest(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ status: number; body: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const postData = options.body ? JSON.stringify(options.body) : null;

    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode || 500, body: json, raw: data });
          } catch {
            resolve({ status: res.statusCode || 500, body: data, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runDiseasesDiscoveryTests() {
  console.log('[TEST] Starting Dynamic Diseases Discovery (OP & Video) Tests...');

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });

  try {
    // 1. Fetch OP diseases
    console.log('[TEST 1] Fetch diseases for OP consultation (consultationType=op)');
    const resOp = await makeRequest('/api/v1/diseases?consultationType=op');
    assert.strictEqual(resOp.status, 200, 'Status should be 200');
    assert.strictEqual(resOp.body.success, true, 'Success should be true');
    assert(Array.isArray(resOp.body.data.conditions), 'Conditions should be an array');
    console.log(`  -> Retrieved ${resOp.body.data.total} conditions for OP consultation`);

    // Verify categorical specialties have non-empty conditions
    for (const cat of resOp.body.data.categorical) {
      assert(cat.conditions && cat.conditions.length > 0, `Category ${cat.name} must have at least 1 condition`);
    }

    // 2. Fetch Video diseases
    console.log('[TEST 2] Fetch diseases for Video consultation (consultationType=video)');
    const resVideo = await makeRequest('/api/v1/diseases?consultationType=video');
    assert.strictEqual(resVideo.status, 200, 'Status should be 200');
    assert.strictEqual(resVideo.body.success, true, 'Success should be true');
    console.log(`  -> Retrieved ${resVideo.body.data.total} conditions for Video consultation`);

    // 3. Compare: Cardiology check
    // In our DB, Ranjith is a Cardiology doctor at SM Hospital, but has NO video schedules.
    // If there is no other video doctor for Cardiology, Cardiology should NOT appear in video diseases!
    const opHasCardio = resOp.body.data.conditions.some((c: any) => 
      (c.specialtyName && c.specialtyName.toLowerCase().includes('cardio')) ||
      (c.name && c.name.toLowerCase().includes('heart'))
    );
    console.log(`  -> OP consultation includes Cardiology: ${opHasCardio}`);

    // 4. Test unrepresented specialty (e.g. if no doctor has Neurology or Oncology)
    const activeDocSpecialties = await prisma.user.findMany({
      where: { role: 'DOCTOR', active: true },
      select: {
        specialization: true,
        department: { select: { name: true, specialty: { select: { name: true } } } }
      }
    });
    const coveredNames = new Set<string>();
    for (const d of activeDocSpecialties) {
      if (d.specialization) coveredNames.add(d.specialization.toLowerCase());
      if (d.department?.name) coveredNames.add(d.department.name.toLowerCase());
      if (d.department?.specialty?.name) coveredNames.add(d.department.specialty.name.toLowerCase());
    }

    // Every condition returned in OP must match an active doctor's department or specialty
    for (const cond of resOp.body.data.conditions) {
      const specName = (cond.specialtyName || '').toLowerCase();
      const isCovered = Array.from(coveredNames).some(n => specName.includes(n) || n.includes(specName));
      assert(isCovered, `Condition "${cond.name}" with specialty "${cond.specialtyName}" must have an active doctor`);
    }
    console.log('  -> Verified: All returned conditions strictly correspond to active doctors');

    // 5. Test Remote Coordinates (out of range)
    console.log('[TEST 3] Location filtering with coordinates in the middle of nowhere (lat: 0, lng: 0, radius: 10km)');
    const resFar = await makeRequest('/api/v1/diseases?lat=0&lng=0&radius=10&nearbyOnly=true');
    assert.strictEqual(resFar.status, 200);
    assert.strictEqual(resFar.body.data.total, 0, 'Should return 0 conditions when no doctors are in range');
    assert.strictEqual(resFar.body.data.conditions.length, 0);
    assert.strictEqual(resFar.body.data.categorical.length, 0);
    console.log('  -> Verified: 0 conditions returned when outside active range');

    // 6. Test Coordinates near SM Hospital (lat 13.6288, lng 79.4192)
    console.log('[TEST 4] Location filtering near SM Hospital (Tirupati, radius: 25km)');
    const resNear = await makeRequest('/api/v1/diseases?lat=13.6288&lng=79.4192&radius=25&nearbyOnly=true');
    assert.strictEqual(resNear.status, 200);
    assert(resNear.body.data.total > 0, 'Should return conditions for doctors near Tirupati');
    console.log(`  -> Retrieved ${resNear.body.data.total} conditions near Tirupati`);

    console.log('[SUCCESS] All Dynamic Disease Discovery Tests Passed!');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

runDiseasesDiscoveryTests().catch((err) => {
  console.error('[FAILED] Test run failed:', err);
  process.exit(1);
});
