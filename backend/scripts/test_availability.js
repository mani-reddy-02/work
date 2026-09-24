async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/v1/doctors/a75e56c7-b5a8-493d-8408-c36f9e292aad/availability?date=2026-09-24&opType=OP');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
test();
