async function test() {
  try {
    // SM_Hospital ID
    const hospId = '9c2e7291-de11-4a74-9752-781454e0f99c';
    // Fever condition ID
    const condId = '902e8a20-eef8-449e-b079-913df5a457ad';
    const res = await fetch(`http://localhost:5000/api/v1/hospitals/${hospId}/doctors?conditionId=${condId}`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
test();
