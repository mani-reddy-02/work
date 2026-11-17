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

async function runDepartmentDiscoveryTests() {
  console.log('[TEST] Starting Dynamic Location-Based Department Discovery Tests...');

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });

  try {
    // 1. Fetch public departments (default browse)
    console.log('[TEST 1] Fetch public departments with hasDoctors=true');
    const res1 = await makeRequest('/api/v1/departments?hasDoctors=true');
    assert.strictEqual(res1.status, 200, 'Status should be 200');
    assert.strictEqual(res1.body.success, true, 'Success should be true');
    assert(Array.isArray(res1.body.data), 'Data should be an array');
    console.log(`  -> Retrieved ${res1.body.data.length} active departments with doctors`);

    // Verify all returned departments are active and have doctorCount > 0
    for (const d of res1.body.data) {
      assert.strictEqual(d.isActive, true, `Department ${d.name} must be active`);
      assert(d.doctorCount > 0, `Department ${d.name} must have active doctorCount > 0`);
      assert(d.hospitalId, `Department ${d.name} must belong to an approved hospital`);
    }
    console.log('  -> All returned departments have active doctors and active status');

    // 2. Proximity Range Filtering: Find an approved hospital that has active departments with doctors
    const hospitalWithCoords = await prisma.hospital.findFirst({
      where: {
        verificationStatus: 'APPROVED',
        latitude: { not: null },
        longitude: { not: null },
        departments: {
          some: {
            isActive: true,
            users: { some: { role: 'DOCTOR', active: true } },
          },
        },
      },
    });

    if (hospitalWithCoords && hospitalWithCoords.latitude && hospitalWithCoords.longitude) {
      const hLat = hospitalWithCoords.latitude;
      const hLng = hospitalWithCoords.longitude;

      console.log(`[TEST 2] Testing proximity search near hospital "${hospitalWithCoords.name}" (${hLat}, ${hLng})`);

      // Search near the hospital within 25 km
      const resNearby = await makeRequest(
        `/api/v1/departments?hasDoctors=true&lat=${hLat}&lng=${hLng}&radius=25&nearbyOnly=true`
      );
      assert.strictEqual(resNearby.status, 200);
      assert(Array.isArray(resNearby.body.data));
      assert(resNearby.body.data.length > 0, 'Should find at least 1 department near this hospital');
      console.log(`  -> Found ${resNearby.body.data.length} departments within 25km`);

      for (const d of resNearby.body.data) {
        assert(d.distance !== null && d.distance !== undefined, 'Department must have distance attached');
        assert(d.distance <= 25, `Distance (${d.distance}km) must be within 25km radius`);
        assert(d.distanceText, 'Distance text must be present');
      }

      // Check distance ordering
      for (let i = 0; i < resNearby.body.data.length - 1; i++) {
        const curr = resNearby.body.data[i].distance;
        const next = resNearby.body.data[i + 1].distance;
        if (curr != null && next != null) {
          assert(curr <= next, 'Departments must be sorted by distance ascending');
        }
      }
      console.log('  -> Distance calculation, radius filter, and ascending sort verified');

      // Far away coordinates (e.g. North Pole / Remote Pacific) with small radius should return 0
      console.log('[TEST 3] Testing out-of-range coordinates (radius=5km from 0,0)');
      const resFar = await makeRequest(
        `/api/v1/departments?hasDoctors=true&lat=0.0&lng=0.0&radius=5&nearbyOnly=true`
      );
      assert.strictEqual(resFar.status, 200);
      assert.strictEqual(resFar.body.data.length, 0, 'No departments should be found 0,0 with 5km radius');
      console.log('  -> Out-of-range departments correctly excluded (0 returned)');
    }

    console.log('\n[PASS] All Department Discovery integration tests passed 100%!');
  } finally {
    server.close();
  }
}

runDepartmentDiscoveryTests().catch((err) => {
  console.error('[FAIL] Department Discovery test failed:', err);
  if (server) server.close();
  process.exit(1);
});
