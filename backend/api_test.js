const fs = require('fs');

async function run() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5M2IyM2FhOS0yZDI5LTQ2YWQtYjA2ZC0zMmVjOTRjNjU5MGQiLCJyb2xlIjoiUEFUSUVOVCIsImlhdCI6MTc4OTQwNjM3MywiZXhwIjoxNzg5NDkyNzczfQ.rx95tIimDQNbo8kHJ4g9StSw4NAO69DcyfWY_iV0xqk';
    
    console.log('Login successful. Token:', token.substring(0, 15) + '...');
    
    // 1. Get Disease "Fever"
    const conditionsRes = await fetch('http://localhost:5000/api/v1/diseases?search=Body Ache');
    const conditionsData = await conditionsRes.json();
    if (!conditionsData.data.conditions || conditionsData.data.conditions.length === 0) throw new Error('No conditions found');
    const condition = conditionsData.data.conditions[0];
    console.log('Found condition:', condition.name);
    
    // 2. Get Hospitals for this condition
    const hospRes = await fetch(`http://localhost:5000/api/v1/hospitals?conditionId=${condition.id}`);
    const hospData = await hospRes.json();
    if (!hospData.data || hospData.data.length === 0) throw new Error('No hospitals found for this condition');
    const hospital = hospData.data[0];
    console.log('Found hospital:', hospital.name);
    
    // 3. Get Doctors for this hospital
    const docsRes = await fetch(`http://localhost:5000/api/v1/doctors?hospitalId=${hospital.id}`);
    const docsData = await docsRes.json();
    let doctorId = null;
    if (docsData.data && docsData.data.length > 0) {
       doctorId = docsData.data[0].id;
    }
    if (!doctorId) throw new Error('No active doctors found in this hospital');
    console.log('Found doctor ID:', doctorId);
    
    // 4. Get Availability (OP)
    const availRes = await fetch(`http://localhost:5000/api/v1/doctors/${doctorId}/availability?opType=VIDEO`);
    const availData = await availRes.json();
    if (!availData.data || !availData.data.availableSlots || availData.data.availableSlots.length === 0) {
      console.log('No slots available. Creating a DoctorSchedule to enable slots...');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      await prisma.doctorSchedule.create({
         data: {
            doctorId: doctorId,
            dayOfWeek: today,
            startTime: '09:00',
            endTime: '17:00',
            videoStartTime: '18:00',
            videoEndTime: '20:00',
            slotDurationMinutes: 30,
            isAvailable: true
         }
      });
      await prisma.$disconnect();
      return run(); // Retry
    }
    const slot = availData.data.availableSlots[0];
    const date = availData.data.date;
    console.log('Found slot:', slot, 'on', date);
    
    // 5. Create OP Booking
    const bookRes = await fetch('http://localhost:5000/api/v1/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
         hospitalId: hospital.id,
         doctorId: doctorId,
         date: date,
         timeSlot: slot,
         opType: 'VIDEO',
         patientName: 'Test Patient',
         patientMobile: '1234567890',
         patientAge: 30,
         patientGender: 'Male',
         reason: 'Fever check',
         conditionId: condition.id
      })
    });
    const bookData = await bookRes.json();
    if (!bookData.success) throw new Error('Booking failed: ' + JSON.stringify(bookData));
    console.log('Booking created successfully:', bookData.data.id);
    
    // 6. Double Book (should fail)
    const doubleBookRes = await fetch('http://localhost:5000/api/v1/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
         hospitalId: hospital.id,
         doctorId: doctorId,
         date: date,
         timeSlot: slot,
         opType: 'OP',
         patientName: 'Double Test Patient',
         patientMobile: '1234567890',
         patientAge: 30,
         patientGender: 'Male',
         reason: 'Double book',
         conditionId: condition.id
      })
    });
    const doubleBookData = await doubleBookRes.json();
    console.log('Double booking result:', doubleBookData.success ? 'FAILED (allowed)' : 'PASSED (rejected duplicate)');
    
    // 7. Check My Bookings
    const myBookingsRes = await fetch('http://localhost:5000/api/v1/appointments/my-bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const myBookingsData = await myBookingsRes.json();
    const found = myBookingsData.data.some(b => b.id === bookData.data.id);
    console.log('My Bookings check:', found ? 'PASSED (booking exists)' : 'FAILED (booking not found)');
    
  } catch (e) {
    console.error('Test error:', e.message);
  }
}

run();
