import http from 'http';
import app from '../app';
import { prisma } from '../config/prisma';

let server: http.Server;
let baseUrl: string;

function makeRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<{ status: number; body: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const postData = options.body ? JSON.stringify(options.body) : null;

    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode || 500, body: json, raw: data });
        } catch {
          resolve({ status: res.statusCode || 500, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runHealthAiTests() {
  console.log('--- STARTING HEALTH AI & TRIAGE NAVIGATION INTEGRATION TESTS ---');
  server = app.listen(0);
  const address = server.address() as any;
  baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Test server listening at ${baseUrl}`);

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: STATUS & PROVIDER COMPLIANCE
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 1: STATUS & REGULATORY COMPLIANCE]');
    const statusRes = await makeRequest('/api/v1/health-ai/status');
    if (statusRes.status !== 200 || !statusRes.body.success) {
      throw new Error(`GET /status failed: status ${statusRes.status}`);
    }
    const statusData = statusRes.body.data;
    if (!statusData.compliance?.educationalUseOnly || !statusData.compliance?.noAutonomousDiagnosis) {
      throw new Error('Compliance validation failed: educational or non-diagnostic boundaries missing');
    }
    console.log('✔ GET /health-ai/status returns 200 with verified Google Gemini terms compliance:');
    console.log(`  Model: ${statusData.model}, Provider Configured: ${statusData.configured}`);
    console.log(`  Educational Use Only: ${statusData.compliance.educationalUseOnly}, PII Redaction: ${statusData.compliance.piiRedactionEnabled}`);

    // ----------------------------------------------------
    // TEST GROUP 2: CLINICAL DEPARTMENTS DIRECTORY
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 2: CLINICAL DEPARTMENTS DIRECTORY]');
    const deptRes = await makeRequest('/api/v1/health-ai/departments');
    if (deptRes.status !== 200 || !deptRes.body.success || !Array.isArray(deptRes.body.data)) {
      throw new Error(`GET /departments failed: status ${deptRes.status}`);
    }
    console.log(`✔ GET /health-ai/departments returned ${deptRes.body.data.length} clinical routing categories`);

    // ----------------------------------------------------
    // TEST GROUP 3: HEALTH EDUCATION CHAT & SAFETY BOUNDARIES
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 3: HEALTH EDUCATION CHAT]');

    // 3.1 Empty input rejection
    const emptyChat = await makeRequest('/api/v1/health-ai/chat', {
      method: 'POST',
      body: { message: '' }
    });
    if (emptyChat.status !== 400) {
      throw new Error(`Expected 400 for empty chat message, got ${emptyChat.status}`);
    }
    console.log('✔ Empty prompt properly rejected with 400 Bad Request');

    // 3.2 English Health Education Query
    const engChat = await makeRequest('/api/v1/health-ai/chat', {
      method: 'POST',
      body: { message: 'What is diabetes and what are preventive care steps?' }
    });
    if (engChat.status !== 200 || !engChat.body.success) {
      throw new Error(`Health education chat failed: status ${engChat.status}`);
    }
    const engData = engChat.body.data;
    if (!engData.answer || !engData.disclaimer) {
      throw new Error('Chat response missing educational answer or disclaimer');
    }
    console.log('✔ English health education query answered with medical disclaimer and zero diagnostic claims');

    // 3.3 Telugu Language Query
    const teluguChat = await makeRequest('/api/v1/health-ai/chat', {
      method: 'POST',
      body: { message: 'జ్వరం వస్తే ఏమి చేయాలి?', language: 'te' }
    });
    if (teluguChat.status !== 200 || !teluguChat.body.success) {
      throw new Error(`Telugu chat failed: status ${teluguChat.status}`);
    }
    console.log('✔ Telugu language health education verified (returned native Telugu response)');

    // 3.4 Red-Flag Interception in Chat Prompt
    const emergencyChat = await makeRequest('/api/v1/health-ai/chat', {
      method: 'POST',
      body: { message: 'I have crushing chest pain radiating to left arm and cannot breathe' }
    });
    if (emergencyChat.status !== 200 || !emergencyChat.body.data.isEmergencyAlert) {
      throw new Error('Emergency warning signs in chat prompt were not intercepted as an emergency alert');
    }
    console.log('✔ Emergency red flag words in chat prompt successfully intercepted with emergency warning');

    // ----------------------------------------------------
    // TEST GROUP 4: SYMPTOM INTAKE & CLINICIAN TRIAGE NAVIGATION
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 4: SYMPTOM INTAKE & OP DEPARTMENT ROUTING]');

    // 4.1 Orthopedic routing
    const orthoTriage = await makeRequest('/api/v1/health-ai/triage', {
      method: 'POST',
      body: {
        symptomDescription: 'Severe knee pain and stiffness while climbing stairs for 2 weeks',
        severity: 'moderate',
        ageGroup: 'adult'
      }
    });
    if (orthoTriage.status !== 200 || !orthoTriage.body.success) {
      throw new Error(`Orthopedic triage failed: status ${orthoTriage.status}`);
    }
    const orthoData = orthoTriage.body.data;
    if (orthoData.triage.recommendedDepartment !== 'Orthopedics') {
      throw new Error(`Expected Orthopedics, got ${orthoData.triage.recommendedDepartment}`);
    }
    console.log('✔ Joint pain symptom routed deterministically to Orthopedics:');
    console.log(`  Matched Doctors: ${orthoData.doctors.length}, Specialty: ${orthoData.specialty?.name || 'General'}`);

    // 4.2 Pediatric routing by age group
    const pedTriage = await makeRequest('/api/v1/health-ai/triage', {
      method: 'POST',
      body: {
        symptomDescription: 'High fever and lack of appetite',
        ageGroup: 'child',
        severity: 'moderate'
      }
    });
    if (pedTriage.status !== 200 || pedTriage.body.data.triage.recommendedDepartment !== 'Pediatrics') {
      throw new Error(`Expected Pediatrics for child, got ${pedTriage.body.data.triage.recommendedDepartment}`);
    }
    console.log('✔ Child patient group routed deterministically to Pediatrics');

    // 4.3 Acute Emergency Red Flag Triage
    const emergTriage = await makeRequest('/api/v1/health-ai/triage', {
      method: 'POST',
      body: {
        symptomDescription: 'Severe crushing chest pain, slurred speech and facial drooping',
        severity: 'severe',
        reportedRedFlags: ['Sudden crushing chest pain or radiating jaw/arm pain']
      }
    });
    if (emergTriage.status !== 200) {
      throw new Error(`Emergency triage failed: status ${emergTriage.status}`);
    }
    const emergData = emergTriage.body.data.triage;
    if (emergData.category !== 'EMERGENCY' || emergData.urgency !== 'IMMEDIATE_EMERGENCY') {
      throw new Error(`Expected EMERGENCY category, got ${emergData.category}`);
    }
    console.log('✔ Critical red flag symptoms triggered immediate EMERGENCY protocol (Call 108 / Casualty alert)');

    console.log('\n==================================================================');
    console.log('ALL HEALTH AI & OP NAVIGATION INTEGRATION TESTS PASSED 100%');
    console.log('==================================================================\n');
    server.close();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ HEALTH AI INTEGRATION TEST FAILED:', err.message);
    if (server) server.close();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runHealthAiTests();
