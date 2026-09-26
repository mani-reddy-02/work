async function main() {
  const loginRes = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gorkalsreenu10@gmail.com', password: '123456' }),
  });
  const loginData: any = await loginRes.json();
  const token = loginData.data?.token;
  console.log('Hospital Admin Logged In:', loginData.success);

  // 1. List hospital nursing bookings
  const bookingsRes = await fetch('http://127.0.0.1:5000/api/v1/home-nursing/hospital/bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bookingsData: any = await bookingsRes.json();
  console.log('Hospital Nursing Bookings Found:', bookingsData.data?.length);

  // 2. Find the unassigned booking
  const unassigned = bookingsData.data?.find((b: any) => !b.nurseId);
  console.log('Unassigned booking:', unassigned?.bookingNumber, unassigned?.patientName);

  if (unassigned) {
    // 3. Assign Nurse2
    const assignRes = await fetch(`http://127.0.0.1:5000/api/v1/home-nursing/hospital/bookings/${unassigned.id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nurseId: '107a7e06-b32a-44b9-83c1-892949e7ef01' }),
    });
    const assignData: any = await assignRes.json();
    console.log('Assignment Result:', assignData.success, 'Assigned to:', assignData.data?.nurse?.name);
  }
}

main().catch(console.error);
