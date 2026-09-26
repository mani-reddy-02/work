async function main() {
  const loginRes = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nurse2@gmail.com', password: '123456' }),
  });
  const loginData: any = await loginRes.json();
  console.log('Login success:', loginData.success, 'Role:', loginData.data?.role);

  const token = loginData.data?.token;
  if (!token) throw new Error('No token');

  // 1. Dashboard
  const dashRes = await fetch('http://127.0.0.1:5000/api/v1/home-nursing/nurse/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dashData: any = await dashRes.json();
  console.log('Dashboard Data:');
  console.log(' - Nurse:', dashData.data?.nurse?.name, 'at', dashData.data?.nurse?.hospitalName);
  console.log(' - Stats:', dashData.data?.stats);
  console.log(' - Next Visit:', dashData.data?.nextVisit?.name, 'service:', dashData.data?.nextVisit?.service, 'status:', dashData.data?.nextVisit?.status);
  console.log(' - Today Visits count:', dashData.data?.todayVisits?.length);

  // 2. Visits list
  const visitsRes = await fetch('http://127.0.0.1:5000/api/v1/home-nursing/nurse/visits', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const visitsData: any = await visitsRes.json();
  console.log('Visits Data:');
  console.log(' - Upcoming:', visitsData.data?.upcoming?.length);
  console.log(' - History:', visitsData.data?.history?.length);

  // 3. Test status transition: Start visit -> In Progress
  const nextVisitId = dashData.data?.nextVisit?.id;
  if (nextVisitId) {
    console.log('\nTesting status transition for visit:', nextVisitId);
    const startRes = await fetch(`http://127.0.0.1:5000/api/v1/home-nursing/nurse/visits/${nextVisitId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    const startData: any = await startRes.json();
    console.log(' - Status updated to:', startData.data?.status);
  }
}

main().catch(console.error);
